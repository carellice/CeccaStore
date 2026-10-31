import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { assetUrl } from "../src/asset-url.js";
import { selectCatalogRepos, isDownloadAsset, normalizeDownload } from "../scripts/sync-catalog.mjs";

const root = new URL("../", import.meta.url);
const readJson = async (file) =>
  JSON.parse(await readFile(new URL(file, root), "utf8"));

test("Claude skill releases stay downloadable after catalog synchronization", () => {
  const asset = {
    name: "app-to-pwa-casaos.skill",
    browser_download_url: "https://github.com/carellice/app-to-pwa-casaos/releases/download/v1.1.0/app-to-pwa-casaos.skill",
    size: 77669,
  };
  assert(isDownloadAsset(asset));
  assert(!isDownloadAsset({ name: "app-to-pwa-casaos.skill.sha256" }));
  assert.deepEqual(normalizeDownload(asset, { repo: "app-to-pwa-casaos", platforms: ["Claude Code"], isPrivate: false }), {
    name: asset.name,
    label: "Claude · skill",
    url: asset.browser_download_url,
    size: asset.size,
    private: false,
  });
});

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
