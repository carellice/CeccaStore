import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function embedAsset(assetPath) {
  if (!assetPath) return null;
  if (!assetPath.startsWith("/") || assetPath.includes(".."))
    throw new Error("Invalid local asset");
  const bytes = await readFile(path.join(root, "public", assetPath));
  const type = MIME[path.extname(assetPath).toLowerCase()];
  if (!type) throw new Error("Unsupported private image");
  return `data:${type};base64,${bytes.toString("base64")}`;
}

let requestText = "";
for await (const chunk of process.stdin) requestText += chunk;
const { pin, sourcePath } = JSON.parse(requestText);
if (!/^\d{6}$/.test(pin))
  throw new Error("Provide a six-digit PIN through stdin");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const projects = Array.isArray(source) ? source : [source];
for (const app of projects) {
  app.icon = await embedAsset(app.icon);
  app.screenshots = await Promise.all((app.screenshots || []).map(embedAsset));
}
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 600000;
const key = pbkdf2Sync(pin, salt, iterations, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
cipher.setAAD(Buffer.from("ceccastore-private-catalog-v1"));
const data = Buffer.concat([
  cipher.update(JSON.stringify({ projects })),
  cipher.final(),
  cipher.getAuthTag(),
]);
key.fill(0);
await writeFile(
  path.join(root, "src/data/protected-catalog.json"),
  JSON.stringify(
    {
      version: 1,
      iterations,
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      data: data.toString("base64"),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Private package written: ${projects.length} project(s). PIN not saved.`,
);
