import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { brotliCompress, constants } from "node:zlib";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const compress = promisify(brotliCompress);
const sourceRoot = process.argv[2];
if (!sourceRoot) throw new Error("Pass the TVD auxiliary outputs directory as the first argument.");

const targetRoot = path.join(process.cwd(), "private", "models", "tvd-2");
const source = await readFile(path.join(sourceRoot, "installation_viewer.html"), "utf8");
const modelTag = '<script id="model-data" type="application/json">';
const modelStart = source.indexOf(modelTag);
const modelEnd = source.indexOf("</script>", modelStart);
if (modelStart < 0 || modelEnd < 0) throw new Error("Model data is missing from the source viewer.");

const { parts, ...metadata } = JSON.parse(source.slice(modelStart + modelTag.length, modelEnd));
if (metadata.key !== "installation" || !Array.isArray(parts) || !parts.length) {
  throw new Error("Expected a complete installation model with parts.");
}

// Bound individual responses while preserving every part and its original order.
const groups = [];
let currentParts = [];
let rawBytes = 0;
for (const part of parts) {
  const size = Buffer.byteLength(JSON.stringify(part));
  if (currentParts.length && rawBytes + size > 8_000_000) {
    groups.push(currentParts);
    currentParts = [];
    rawBytes = 0;
  }
  currentParts.push(part);
  rawBytes += size;
}
if (currentParts.length) groups.push(currentParts);

await mkdir(targetRoot, { recursive: true });
async function writeCompressed(name, content) {
  const compressed = await compress(Buffer.from(content, "utf8"), {
    params: {
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_QUALITY]: 9
    }
  });
  if (compressed.byteLength > 4_000_000) throw new Error(`${name} exceeds the response size budget.`);
  await writeFile(path.join(targetRoot, name), compressed);
  console.log(`${name}: ${compressed.byteLength} bytes`);
}

const assets = [];
for (const [index, group] of groups.entries()) {
  const name = `installation-data-${String(index).padStart(3, "0")}.json.br`;
  await writeCompressed(name, JSON.stringify({ ...(index === 0 ? { metadata } : {}), parts: group }));
  assets.push(name);
}

let html = source.slice(0, modelStart + modelTag.length) + "{}" + source.slice(modelEnd);
const scriptStart = html.lastIndexOf("<script>");
const scriptEnd = html.lastIndexOf("</script>");
if (scriptStart < 0 || scriptEnd < scriptStart) throw new Error("Viewer script is missing.");
const sourceViewerScript = html.slice(scriptStart + "<script>".length, scriptEnd);
const resizeObserver = /new ResizeObserver\(([A-Za-z_$][\w$]*)\)\.observe\(([A-Za-z_$][\w$]*)\)/g;
if ([...sourceViewerScript.matchAll(resizeObserver)].length !== 1) {
  throw new Error("Expected exactly one viewer resize observer.");
}
// Defer canvas size writes until after ResizeObserver delivers the layout change.
const viewerScript = sourceViewerScript.replace(
  resizeObserver,
  (_, resize, stage) => `new ResizeObserver(() => requestAnimationFrame(${resize})).observe(${stage})`
);
const loader = `async function loadModelData() {
  const files = ${JSON.stringify(assets)};
  const model = { parts: [] };
  for (let offset = 0; offset < files.length; offset += 3) {
    const sections = await Promise.all(files.slice(offset, offset + 3).map(async (file) => {
      const url = new URL(location.href);
      url.search = new URLSearchParams({ asset: file }).toString();
      url.hash = "";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Model data request failed.");
      }
      return response.json();
    }));
    for (const section of sections) {
      if (section.metadata) Object.assign(model, section.metadata);
      model.parts.push(...section.parts);
    }
    document.getElementById("status").textContent = "모델 불러오는 중 " + Math.round(Math.min(offset + 3, files.length) / files.length * 100) + "%";
  }
  document.getElementById("model-data").textContent = JSON.stringify(model);
}
(async () => {
  try {
    await loadModelData();
    ${viewerScript}
    document.getElementById("model-data").remove();
  } catch (error) {
    window.__errors.push(String(error));
    const message = "모델을 불러오지 못했습니다. 관리자 로그인 상태를 확인하고 새로고침해 주세요.";
    document.getElementById("status").textContent = message;
    const panel = document.getElementById("error");
    panel.textContent = message;
    panel.style.display = "block";
  }
})();`;

html = html.slice(0, scriptStart + "<script>".length) + loader + html.slice(scriptEnd);
html = html
  .replace("</head>", '<style id="maharex-admin-viewer">.downloads,aside p:has(>a[href$=".txt"]){display:none!important}</style></head>')
  .replace("<title>MAHAREX · TVD-2.0 설비 검토</title>", "<title>MAHAREX · TVD-2.0 전체설비</title>");

await writeCompressed("installation_viewer.html.br", html);
await writeFile(path.join(targetRoot, "installation_manifest.json"), JSON.stringify({
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  partCount: parts.length,
  revision: metadata.revision,
  assets
}, null, 2) + "\n");

const obsolete = new Set(["dryer_viewer.html.br", "condenser_viewer.html.br", "receiver_viewer.html.br", "hotwater_viewer.html.br"]);
for (const name of await readdir(targetRoot)) {
  if (obsolete.has(name) || (/^installation-data-\d+\.json\.br$/.test(name) && !assets.includes(name))) {
    await unlink(path.join(targetRoot, name));
  }
}
console.log(`Complete installation: ${parts.length} parts in ${assets.length} protected data files.`);
