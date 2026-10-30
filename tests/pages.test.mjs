import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { assetUrl } from "../src/asset-url.js";
import { selectCatalogRepos } from "../scripts/sync-catalog.mjs";

const root = new URL("../", import.meta.url);
const readJson = async (file) =>
  JSON.parse(await readFile(new URL(file, root), "utf8"));

test("Pages subpath works for local images while preserving encrypted and external assets", () => {
  assert.equal(
    assetUrl("/icons/app.png", "/CeccaStore/"),
    "/CeccaStore/icons/app.png",
  );
  assert.equal(
    assetUrl("/screenshots/view.png", "/CeccaStore/"),
    "/CeccaStore/screenshots/view.png",
  );
  assert.equal(assetUrl("/icons/app.png", "/"), "/icons/app.png");
  for (const url of [
    "data:image/svg+xml;base64,PHN2Zz4=",
    "blob:https://example.com/id",
    "https://example.com/icon.png",
    "//example.com/icon.png",
    null,
  ]) {
    assert.equal(assetUrl(url, "/CeccaStore/"), url);
  }
});

test("catalog images all exist and protected metadata stays outside the visible catalog", async () => {
  const catalog = await readJson("src/data/catalog.json");
  const linkedProjects = await readJson("src/data/linked-projects.json");
  const allProjects = [...catalog, ...linkedProjects];
  const policy = await readJson("src/data/catalog-policy.json");
  assert.equal(new Set(allProjects.map((app) => app.repo)).size, allProjects.length);
  assert.deepEqual(selectCatalogRepos(catalog, policy), catalog);
  assert(!catalog.some((app) => policy.protectedRepos.includes(app.repo)));
  for (const app of allProjects) {
    for (const file of [app.icon, ...app.screenshots].filter(Boolean)) {
      await access(new URL(`public${file}`, root));
    }
    for (const download of app.downloads) {
      const url = new URL(download.url);
      assert.equal(url.protocol, "https:");
      assert.equal(url.hostname, "github.com");
    }
  }
});

test("hashed exclusions and protected projects cannot be reimported", () => {
  const excluded = "an-excluded-project";
  const hash = createHash("sha256").update(excluded).digest("hex");
  const policy = {
    excludedRepoHashes: [hash],
    protectedRepos: ["private-entry"],
  };
  assert.deepEqual(
    selectCatalogRepos(
      [{ name: excluded }, { name: "private-entry" }, { name: "new-project" }],
      policy,
    ),
    [{ name: "new-project" }],
  );
});
