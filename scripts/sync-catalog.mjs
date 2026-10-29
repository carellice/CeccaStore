import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { readFile, writeFile, access, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const catalogPath = path.join(root, "src/data/catalog.json");
const policyPath = path.join(root, "src/data/catalog-policy.json");
const owner = "carellice";
const sharedReleases = {
  "dueffe-streamwise": "streamwise-v",
  "dueffe-garage": "garage-v",
  "dueffe-health": "health-v",
  "dueffe-since": "since-v",
  "dueffe-subber": "subber-v",
};

export function repoHash(name) {
  return createHash("sha256")
    .update(name.trim().toLowerCase(), "utf8")
    .digest("hex");
}

export function selectCatalogRepos(repos, policy) {
  if (
    !policy ||
    !Array.isArray(policy.excludedRepoHashes) ||
    !Array.isArray(policy.protectedRepos) ||
    policy.excludedRepoHashes.some(
      (hash) => typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash),
    ) ||
    policy.protectedRepos.some(
      (repo) => typeof repo !== "string" || !repo.trim(),
    )
  ) {
    throw new Error("La selezione dei progetti non è valida.");
  }
  const excluded = new Set(policy.excludedRepoHashes);
  const protectedRepos = new Set(
    policy.protectedRepos.map((name) => name.trim().toLowerCase()),
  );
  return repos.filter((repo) => {
    const name = repo.name ?? repo.repo;
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("Un repository non ha un nome valido.");
    }
    return (
      !excluded.has(repoHash(name)) &&
      !protectedRepos.has(name.trim().toLowerCase())
    );
  });
}

export function websiteUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (
      [
        "github.com",
        "www.github.com",
        "api.github.com",
        "raw.githubusercontent.com",
      ].includes(url.hostname)
    )
      return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function isDownloadAsset(asset) {
  return (
    !!asset?.name &&
    /\.(apk|exe|msi|msix|msixbundle|dmg|pkg|zip|7z|appimage|deb|rpm|ipk|wgt|jar|tar\.gz|tar\.xz)$/i.test(
      asset.name,
    ) &&
    !/(?:^|[-_.])(source|sources|src|symbols|checksums?)(?:[-_.]|$)/i.test(
      asset.name,
    )
  );
}

export function downloadLabel(name, platforms = [], repo = "") {
  const lower = name.toLowerCase();
  const arch = /applesilicon|apple-silicon|mac-arm64/.test(lower)
    ? "Apple Silicon"
    : /mac-intel|mac-x64/.test(lower)
      ? "Intel"
      : /(?:win|windows)[-_]x64/.test(lower)
        ? "64 bit"
        : "";
  if (/\.apk$/.test(lower))
    return /debug/.test(lower) ? "Android · APK debug" : "Android · APK";
  if (/\.ipk$/.test(lower)) return "TV LG webOS · IPK";
  if (/\.wgt$/.test(lower)) return "TV Samsung Tizen · WGT";
  if (/\.dmg$|\.pkg$/.test(lower) || /mac|applesilicon/.test(lower))
    return `macOS${arch ? ` · ${arch}` : ""}`;
  if (/\.exe$|\.msi$|\.msix(?:bundle)?$/.test(lower))
    return /setup|install/.test(lower)
      ? "Windows · installer"
      : "Windows · applicazione";
  if (/\.appimage$|\.deb$|\.rpm$/.test(lower) || /linux/.test(lower))
    return "Linux";
  if (repo === "easy-crypt" && /pc.*\.zip$/.test(lower))
    return "Windows · pacchetto Python";
  if (/web/.test(lower)) return "Web · pacchetto statico";
  if (/windows|win-|portable-win|pc-/.test(lower))
    return `Windows · ZIP${arch ? ` ${arch}` : ""}`;
  if (platforms.length === 1 && platforms[0] === "macOS") return "macOS · ZIP";
  if (platforms.length === 1 && platforms[0] === "Windows")
    return "Windows · ZIP portatile";
  return name;
}

export function normalizeDownload(asset, app, visibility = new Map()) {
  const url = asset.browser_download_url || asset.url;
  const sourceRepo =
    /^https:\/\/github\.com\/[^/]+\/([^/]+)\/releases\/download\//i.exec(
      url || "",
    )?.[1];
  return {
    name: asset.name,
    label: downloadLabel(asset.name, app.platforms, app.repo),
    url,
    size: Number(asset.size) || 0,
    private:
      typeof asset.requiresAuth === "boolean"
        ? asset.requiresAuth
        : (visibility.get(sourceRepo) ?? !!app.isPrivate),
  };
}

async function gh(args) {
  try {
    const result = await exec("gh", args, {
      cwd: root,
      maxBuffer: 32 * 1024 * 1024,
      windowsHide: true,
    });
    return result.stdout;
  } catch (error) {
    const code =
      error.code === "ENOENT"
        ? "GitHub CLI non trovata. Installa gh e accedi con gh auth login."
        : `Richiesta GitHub non riuscita (codice ${error.code ?? "sconosciuto"}). Verifica gh auth status e la connessione.`;
    throw new Error(code);
  }
}

async function getReleases(repo) {
  const pages = JSON.parse(
    await gh([
      "api",
      `repos/${owner}/${repo}/releases?per_page=100`,
      "--paginate",
      "--slurp",
    ]),
  );
  return pages
    .flat()
    .filter((r) => !r.draft && !r.prerelease)
    .sort(
      (a, b) =>
        new Date(b.published_at || b.created_at) -
        new Date(a.published_at || a.created_at),
    );
}

async function validateAssets(catalog) {
  const paths = [
    ...new Set(
      catalog
        .flatMap((app) => [app.icon, ...(app.screenshots || [])])
        .filter(Boolean),
    ),
  ];
  for (const value of paths) {
    if (!value.startsWith("/") || value.includes("..") || /^\/\//.test(value))
      throw new Error(`Percorso risorsa non valido: ${value}`);
    try {
      await access(path.join(root, "public", value));
    } catch {
      throw new Error(`Risorsa locale mancante: ${value}`);
    }
  }
}

export async function syncCatalog() {
  const storedCatalog = JSON.parse(await readFile(catalogPath, "utf8"));
  if (!Array.isArray(storedCatalog) || storedCatalog.length === 0)
    throw new Error("Il catalogo curato è vuoto o non valido.");
  const policy = JSON.parse(await readFile(policyPath, "utf8"));
  const current = selectCatalogRepos(storedCatalog, policy);
  const login = (await gh(["api", "user", "--jq", ".login"])).trim();
  if (login.toLowerCase() !== owner)
    throw new Error(
      `Accedi come ${owner} prima della sincronizzazione; account attuale: ${login}.`,
    );
  const allRepos = JSON.parse(
    await gh([
      "repo",
      "list",
      owner,
      "--limit",
      "1000",
      "--json",
      "name,description,url,homepageUrl,primaryLanguage,isPrivate,updatedAt",
    ]),
  );
  if (allRepos.length === 1000)
    throw new Error(
      "Raggiunto il limite di 1000 repository: completa la paginazione prima di aggiornare.",
    );
  const repos = selectCatalogRepos(allRepos, policy);
  const byName = new Map(repos.map((r) => [r.name, r]));
  const missing = current.filter((app) => !byName.has(app.repo));
  if (missing.length && !process.argv.includes("--allow-removals"))
    throw new Error(
      `${missing.length} repository del catalogo non sono più visibili. Controlla accessi/ridenominazioni; usa --allow-removals solo per rimuoverli intenzionalmente.`,
    );
  // Release repositories can stay excluded from the store while distributing
  // public APKs for visible apps whose source repositories are private.
  const visibility = new Map(allRepos.map((r) => [r.name, r.isPrivate]));
  const curated = new Map(current.map((app) => [app.repo, app]));
  const releases = new Map();
  const failures = new Set();
  const needed = [
    ...new Set(
      repos
        .filter((r) => curated.get(r.name)?.kind !== "support")
        .map((r) => (sharedReleases[r.name] ? "android-app-releases" : r.name)),
    ),
  ];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(5, needed.length) }, async () => {
      while (cursor < needed.length) {
        const repo = needed[cursor++];
        try {
          releases.set(repo, await getReleases(repo));
        } catch {
          failures.add(repo);
          console.warn(
            `Release non aggiornate per ${repo}: conservati i download precedenti.`,
          );
        }
      }
    }),
  );
  const next = repos.map((repo) => {
    const previous = curated.get(repo.name);
    const entry = previous
      ? { ...previous }
      : {
          repo: repo.name,
          title: repo.name.replace(/[-_]/g, " "),
          description:
            repo.description ||
            "Progetto software. Consulta il repository per documentazione e istruzioni.",
          category: "Sviluppo",
          platforms: [],
          features: [],
          icon: null,
          screenshots: [],
          version: null,
          downloads: [],
          kind: "project",
          needsCuration: true,
        };
    entry.url = repo.url;
    entry.isPrivate = repo.isPrivate;
    entry.language = repo.primaryLanguage?.name || null;
    entry.updatedAt = repo.updatedAt;
    entry.demo = websiteUrl(entry.demo) || websiteUrl(repo.homepageUrl);
    if (entry.kind === "support") {
      entry.downloads = [];
      return entry;
    }
    const source = sharedReleases[repo.name]
      ? "android-app-releases"
      : repo.name;
    if (failures.has(source)) {
      entry.downloads = (entry.downloads || []).map((asset) =>
        normalizeDownload(asset, entry, visibility),
      );
      return entry;
    }
    const latest = (releases.get(source) || []).find(
      (release) =>
        !sharedReleases[repo.name] ||
        release.tag_name.startsWith(sharedReleases[repo.name]),
    );
    if (latest) {
      entry.version = latest.tag_name.replace(/^.*?-v(?=\d)|^v(?=\d)/, "");
      entry.downloads = (latest.assets || [])
        .filter(isDownloadAsset)
        .map((asset) => normalizeDownload(asset, entry, visibility));
    } else {
      entry.downloads = [];
    }
    return entry;
  });
  await validateAssets(next);
  if (new Set(next.map((app) => app.repo)).size !== next.length)
    throw new Error("Repository duplicati: aggiornamento annullato.");
  const temp = `${catalogPath}.tmp`;
  await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await rename(temp, catalogPath);
  console.log(
    `Catalogo aggiornato: ${next.length} progetti, ${next.filter((app) => app.downloads.length).length} con download, ${next.filter((app) => app.needsCuration).length} da curare.`,
  );
  console.log(
    `Selezione rispettata: ${policy.excludedRepos.length} esclusi e ${policy.protectedRepos.length} protetti da PIN; pacchetto protetto invariato.`,
  );
  if (failures.size) {
    console.log(
      `${failures.size} repository conservano le release precedenti. Riprova la sincronizzazione per completarli.`,
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  syncCatalog().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
