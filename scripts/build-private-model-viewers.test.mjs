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

for (const [profile, key, directory, errorsKey, statusId, sourceFile = `${key}_viewer.html`] of [
  ["tvd-installation", "installation", "tvd-2", "__errors", "status"],
  ["tvd-5000", "tvd5000_installation", "tvd-5000", "__errors", "status", "TVD-5000_installation.html"],
  ["nf-1200", "nutsche", "nf-1200", "__nutscheErrors", "model-status"],
  ["rs-205", "reactor_fullset", "rs-205", "__reactorErrors", "model-status"],
  ["rvd-1500", "rvd1500", "rvd-1500", "__rvdErrors", "model-status", "RVD-1500_viewer.html"],
  ["rvd-501", "rvd501", "rvd-501", "__rvdErrors", "model-status", "RVD-501_viewer.html"],
  ["ejm12", "jetmill", "ejm12", "__jetmillErrors", "model-summary"],
  ["pm12", "pinmill", "pm12", "__pinmillErrors", "model-status"],
  ["pm12-low-hopper", "pinmill", "pm12-low-hopper", "__pinmillErrors", "model-status"]
]) {
  test(`${profile}: preserve model data and enforce authenticated loader responses`, async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "maharex-model-test-"));
    try {
      const source = path.join(temp, "source");
      await mkdir(source);
      const model = {
        key, revision: 3, viewerRevision: "REV03.2",
        parts: [{ name: "plate", data: "0".repeat(6_000_010) }, { name: "support", position: [1, -2, 3.5] }]
      };
      if (profile === "tvd-5000") {
        delete model.revision;
        delete model.viewerRevision;
      }
      const serialized = JSON.stringify(model);
      const observer = key === "pinmill"
        ? "const observer=new ResizeObserver(resize);observer.observe(stage);"
        : "new ResizeObserver(resize).observe(stage);";
      await writeFile(path.join(source, sourceFile), `<!doctype html><html><head><title>Fixture</title></head><body>
<aside><p><a id="other-view" href="standalone.html">Detail</a></p></aside>
<script id="model-data" type="application/json">${serialized}</script>
<script>const stage={};function resize(){}${observer}window.loadedModel=JSON.parse(document.getElementById("model-data").textContent);</script></body></html>`);
      execFileSync(process.execPath, [builder, source, profile], { cwd: temp, stdio: "pipe" });
      const root = path.join(temp, "private", "models", directory);
      const manifest = JSON.parse(await readFile(path.join(root, `${key}_manifest.json`), "utf8"));
      assert.equal(manifest.partCount, model.parts.length);
      assert.equal(manifest.revision, model.revision);
      assert.equal(manifest.viewerRevision, model.viewerRevision);
      if (profile !== "tvd-installation") assert(manifest.assets.length > 1, "Split a single oversized part");
      const sections = new Map();
      for (const name of manifest.assets) {
        const bytes = await readFile(path.join(root, name));
        assert(bytes.length < 4_000_000);
        sections.set(name, JSON.parse(brotliDecompressSync(bytes)));
      }
      const html = brotliDecompressSync(await readFile(path.join(root, `${key}_viewer.html.br`))).toString();
      assert(html.includes("new ResizeObserver(() => requestAnimationFrame(resize))"));
      assert(html.includes('id="other-view"'), "Keep the link node used by source viewer initialization");
      assert(html.includes("aside p:has(>#other-view){display:none!important}"), "Hide the unavailable standalone viewer link");
      const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));

      for (const authorized of [true, false]) {
        const elements = Object.fromEntries(["model-data", statusId, "error", "loading"].map(id => [id, {
          textContent: "", style: {}, removed: false, remove() { this.removed = true; }
        }]));
        const window = profile === "ejm12" ? {} : { [errorsKey]: [] };
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
          assert.equal(window[errorsKey]?.length ?? 0, 0);
        } else {
          assert.equal(window.loadedModel, undefined);
          assert.equal(elements.error.style.display, "block");
          assert.equal(window[errorsKey].length, 1);
          assert.equal(elements.loading.hidden, true);
        }
      }
    } finally {
      assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
      assert(path.basename(temp).startsWith("maharex-model-test-"));
      await rm(temp, { recursive: true, force: true });
    }
  });
}
