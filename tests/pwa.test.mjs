import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("PWA manifest declares a standalone app and valid local icons", async () => {
  const manifest = JSON.parse(await read("../public/manifest.webmanifest"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);

  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith("/"), \`icon must be same-origin: \${icon.src}\`);
    await read(\`../public\${icon.src}\`);
  }
});

test("HTML links the manifest and registers the service worker", async () => {
  const html = await read("../index.html");
  assert.match(html, /rel="manifest"\s+href="\/manifest\.webmanifest"/);
  assert.match(html, /serviceWorker\.register\("\/sw\.js"\)/);
});

test("service worker precaches the app shell and supports offline navigation", async () => {
  const worker = await read("../public/sw.js");
  assert.match(worker, /const APP_SHELL = \[.*"\/index\.html".*\]/);
  assert.match(worker, /self\.skipWaiting\(\)/);
  assert.match(worker, /self\.clients\.claim\(\)/);
  assert.match(worker, /caches\.match\("\/index\.html"\)/);
});
