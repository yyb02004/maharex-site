import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { brotliDecompressSync } from "node:zlib";
import test from "node:test";

const builder = fileURLToPath(new URL("./build-private-model-viewers.mjs", import.meta.url));

for (const [profile, key, directory, errorsKey, statusId] of [
  ["tvd-installation", "installation", "tvd-2", "__errors", "status"],
  ["nf-1200", "nutsche", "nf-1200", "__nutscheErrors", "model-status"]
]) {
  test(`${profile}: preserve model data and enforce authenticated loader responses`, async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "maharex-model-test-"));
    try {
      const source = path.join(temp, "source");
      await mkdir(source);
      const model = {
        key, revision: 3,
        parts: [{ name: "plate", data: "0".repeat(6_000_010) }, { name: "support", position: [1, -2, 3.5] }]
      };
      const serialized = JSON.stringify(model);
      await writeFile(path.join(source, `${key}_viewer.html`), `<!doctype html><html><head><title>Fixture</title></head><body>
<script id="model-data" type="application/json">${serialized}</script>
<script>const stage={};function resize(){}new ResizeObserver(resize).observe(stage);window.loadedModel=JSON.parse(document.getElementById("model-data").textContent);</script></body></html>`);
      execFileSync(process.execPath, [builder, source, profile], { cwd: temp, stdio: "pipe" });
      const root = path.join(temp, "private", "models", directory);
      const manifest = JSON.parse(await readFile(path.join(root, `${key}_manifest.json`), "utf8"));
      assert.equal(manifest.partCount, model.parts.length);
      if (profile === "nf-1200") assert(manifest.assets.length > 1, "Split a single oversized part");
      const sections = new Map();
      for (const name of manifest.assets) {
        const bytes = await readFile(path.join(root, name));
        assert(bytes.length < 4_000_000);
        sections.set(name, JSON.parse(brotliDecompressSync(bytes)));
      }
      const html = brotliDecompressSync(await readFile(path.join(root, `${key}_viewer.html.br`))).toString();
      assert(html.includes("new ResizeObserver(() => requestAnimationFrame(resize))"));
      const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));

      for (const authorized of [true, false]) {
        const elements = Object.fromEntries(["model-data", statusId, "error"].map(id => [id, {
          textContent: "", style: {}, removed: false, remove() { this.removed = true; }
        }]));
        const window = { [errorsKey]: [] };
        await vm.runInNewContext(script, {
          window, document: { getElementById: id => elements[id] },
          location: { href: `https://example.test/ko/admin/models/${profile}` },
          URL, URLSearchParams, requestAnimationFrame() {},
          ResizeObserver: class { observe() {} },
          async fetch(url, options) {
            assert.equal(url.origin, "https://example.test");
            assert.equal(url.pathname, `/ko/admin/models/${profile}`);
            assert.equal(options.cache, "no-store");
            return {
              ok: true,
              headers: { get: () => authorized ? "application/json" : "text/html" },
              json: async () => sections.get(url.searchParams.get("asset"))
            };
          }
        });
        if (authorized) {
          assert.deepEqual(JSON.parse(JSON.stringify(window.loadedModel)), model);
          assert.equal(elements["model-data"].removed, true);
          assert.equal(window[errorsKey].length, 0);
        } else {
          assert.equal(window.loadedModel, undefined);
          assert.equal(elements.error.style.display, "block");
          assert.equal(window[errorsKey].length, 1);
        }
      }
    } finally {
      assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
      assert(path.basename(temp).startsWith("maharex-model-test-"));
      await rm(temp, { recursive: true, force: true });
    }
  });
}
