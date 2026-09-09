import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { brotliCompress, constants } from "node:zlib";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const compress = promisify(brotliCompress);
const sourceRoot = process.argv[2];
if (!sourceRoot) throw new Error("Pass the model outputs directory as the first argument.");
const profiles = {
  "tvd-installation": {
    directory: "tvd-2", key: "installation", statusId: "status", errorsKey: "__errors",
    title: "MAHAREX · TVD-2.0 전체설비", fragmentData: false
  },
  "nf-1200": {
    directory: "nf-1200", key: "nutsche", statusId: "model-status", errorsKey: "__nutscheErrors",
    title: "MAHAREX · NF-1200 가압누체", fragmentData: true
  }
};
const modelKey = process.argv[3] || "tvd-installation";
if (!Object.hasOwn(profiles, modelKey)) throw new Error("Unknown private model profile.");
const profile = profiles[modelKey];

const targetRoot = path.join(process.cwd(), "private", "models", profile.directory);
const source = await readFile(path.join(sourceRoot, `${profile.key}_viewer.html`), "utf8");
const modelTag = '<script id="model-data" type="application/json">';
const modelStart = source.indexOf(modelTag);
const modelEnd = source.indexOf("</script>", modelStart);
if (modelStart < 0 || modelEnd < 0) throw new Error("Model data is missing from the source viewer.");

const modelData = JSON.parse(source.slice(modelStart + modelTag.length, modelEnd));
const { parts, ...metadata } = modelData;
if (metadata.key !== profile.key || !Array.isArray(parts) || !parts.length) {
  throw new Error("Expected the selected model with parts.");
}

const groups = [];
if (profile.fragmentData) {
  // A perforated plate can exceed the response budget on its own. Split serialized
  // JSON instead of changing the geometry; join it before the viewer parses it.
  const serialized = JSON.stringify(modelData);
  for (let offset = 0; offset < serialized.length; offset += 6_000_000) {
    groups.push({ fragment: serialized.slice(offset, offset + 6_000_000) });
  }
} else {
  let currentParts = [];
  let rawBytes = 0;
  for (const part of parts) {
    const size = Buffer.byteLength(JSON.stringify(part));
    if (currentParts.length && rawBytes + size > 8_000_000) {
      groups.push({ parts: currentParts });
      currentParts = [];
      rawBytes = 0;
    }
    currentParts.push(part);
    rawBytes += size;
  }
  if (currentParts.length) groups.push({ parts: currentParts });
  groups[0] = { metadata, ...groups[0] };
}

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
  const name = `${profile.key}-data-${String(index).padStart(3, "0")}.json.br`;
  await writeCompressed(name, JSON.stringify(group));
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
  const fragments = [];
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
      if (section.parts) model.parts.push(...section.parts);
      if (typeof section.fragment === "string") fragments.push(section.fragment);
    }
    document.getElementById(${JSON.stringify(profile.statusId)}).textContent = "모델 불러오는 중 " + Math.round(Math.min(offset + 3, files.length) / files.length * 100) + "%";
  }
  document.getElementById("model-data").textContent = fragments.length ? fragments.join("") : JSON.stringify(model);
}
(async () => {
  try {
    await loadModelData();
    ${viewerScript}
    document.getElementById("model-data").remove();
  } catch (error) {
    window[${JSON.stringify(profile.errorsKey)}].push(String(error));
    const message = "모델을 불러오지 못했습니다. 관리자 로그인 상태를 확인하고 새로고침해 주세요.";
    document.getElementById(${JSON.stringify(profile.statusId)}).textContent = message;
    const panel = document.getElementById("error");
    panel.textContent = message;
    panel.style.display = "block";
  }
})();`;

html = html.slice(0, scriptStart + "<script>".length) + loader + html.slice(scriptEnd);
html = html
  .replace("</head>", '<style id="maharex-admin-viewer">.downloads,aside p:has(>a[href$=".txt"]){display:none!important}</style></head>')
  .replace(/<title>[^<]*<\/title>/, `<title>${profile.title}</title>`);
if (modelKey === "nf-1200") {
  html = html.replace("<h1>가압누체</h1>", "<h1>가압누체 NF-1200</h1>");
}

await writeCompressed(`${profile.key}_viewer.html.br`, html);
await writeFile(path.join(targetRoot, `${profile.key}_manifest.json`), JSON.stringify({
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  partCount: parts.length,
  revision: metadata.revision,
  assets
}, null, 2) + "\n");

const obsolete = new Set(modelKey === "tvd-installation"
  ? ["dryer_viewer.html.br", "condenser_viewer.html.br", "receiver_viewer.html.br", "hotwater_viewer.html.br"]
  : []);
const generatedAsset = new RegExp(`^${profile.key}-data-\\d+\\.json\\.br$`);
for (const name of await readdir(targetRoot)) {
  if (obsolete.has(name) || (generatedAsset.test(name) && !assets.includes(name))) {
    await unlink(path.join(targetRoot, name));
  }
}
console.log(`${modelKey}: ${parts.length} parts in ${assets.length} protected data files.`);
