import { promisify } from "node:util";
import { brotliCompress, constants } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const compress = promisify(brotliCompress);
const sourceRoot = process.argv[2];

if (!sourceRoot) {
  throw new Error("Pass the TVD auxiliary outputs directory as the first argument.");
}

const targetRoot = path.join(process.cwd(), "private", "models", "tvd-2");
const models = [
  ["installation_viewer.html", "installation_viewer.html.br", "전체설비"],
  ["dryer_viewer.html", "dryer_viewer.html.br", "트레이 진공 건조기"],
  ["condenser_viewer.html", "condenser_viewer.html.br", "컨덴서"],
  ["receiver_viewer.html", "receiver_viewer.html.br", "리시버"],
  ["hotwater_viewer.html", "hotwater_viewer.html.br", "온수탱크"]
];

const adminStyle = `<style id="maharex-admin-viewer">
.downloads{display:none!important}
</style>`;

await mkdir(targetRoot, { recursive: true });

for (const [sourceName, targetName, label] of models) {
  const sourcePath = path.join(sourceRoot, sourceName);
  const targetPath = path.join(targetRoot, targetName);
  let html = await readFile(sourcePath, "utf8");

  html = html
    .replace("</head>", `${adminStyle}</head>`)
    .replace("<title>MAHAREX · TVD-2.0 설비 검토</title>", `<title>MAHAREX · TVD-2.0 ${label}</title>`);

  const raw = Buffer.from(html, "utf8");
  const compressed = await compress(raw, {
    params: {
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_QUALITY]: 11
    }
  });

  await writeFile(targetPath, compressed);
  console.log(`${label}: ${raw.byteLength} -> ${compressed.byteLength} bytes`);
}
