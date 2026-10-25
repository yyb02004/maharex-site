import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Usage: node scripts/prepare-love-photos.mjs <directory-containing-originals>
// Originals are read only. Web copies retain the full frame and strip EXIF data.
const sourceDirectory = process.argv[2];
if (!sourceDirectory) {
  throw new Error("Provide the directory containing the original wedding photos.");
}

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const loveDirectory = path.join(projectDirectory, "public", "love");
const outputDirectory = path.join(loveDirectory, "photos");
const baseName = "KakaoTalk_20261025_001733780";
const originals = Array.from({ length: 23 }, (_, index) => {
  const suffix = index === 0 ? "" : `_${String(index).padStart(2, "0")}`;
  return path.resolve(sourceDirectory, `${baseName}${suffix}.jpg`);
});

// Validate every source before creating any output.
const sourceStats = await Promise.all(originals.map((original) => stat(original)));
await mkdir(outputDirectory, { recursive: true });
const manifest = [];
let outputBytes = 0;

for (const [index, original] of originals.entries()) {
  const id = index + 1;
  const number = String(id).padStart(2, "0");
  const data = await readFile(original);
  const fullName = `photo-${number}.webp`;
  const thumbName = `thumb-${number}.webp`;
  const [full, thumb] = await Promise.all([
    sharp(data)
      .rotate()
      .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(outputDirectory, fullName)),
    sharp(data)
      .rotate()
      .resize(600, 600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(outputDirectory, thumbName)),
  ]);
  outputBytes += full.size + thumb.size;
  manifest.push({
    id,
    src: `/love/photos/${fullName}`,
    thumb: `/love/photos/${thumbName}`,
    width: full.width,
    height: full.height,
  });
}

await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const share = await sharp(originals[19])
  .rotate()
  .resize(800, 1200, { fit: "inside", withoutEnlargement: true })
  .jpeg({ quality: 88 })
  .toFile(path.join(loveDirectory, "share.jpg"));

let appleIconBytes = 0;
try {
  const icon = await readFile(path.join(loveDirectory, "icon.svg"));
  const appleIcon = await sharp(icon)
    .resize(180, 180)
    .png()
    .toFile(path.join(loveDirectory, "apple-icon.png"));
  appleIconBytes = appleIcon.size;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

// RFC 5545: CRLF line endings, with content lines folded at 75 UTF-8 octets.
// Count whole Unicode code points so folding never splits a Korean character.
try {
  const calendarPath = path.join(loveDirectory, "wedding.ics");
  const calendar = await readFile(calendarPath, "utf8");
  const lines = calendar.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  while (lines.at(-1) === "") lines.pop();
  const folded = lines.flatMap((line) => {
    const parts = [];
    let current = "";
    for (const character of line) {
      if (Buffer.byteLength(current + character, "utf8") > 75) {
        parts.push(current);
        current = " ";
      }
      current += character;
    }
    parts.push(current);
    return parts;
  });
  await writeFile(calendarPath, `${folded.join("\r\n")}\r\n`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

console.log(JSON.stringify({
  photos: manifest.length,
  files: manifest.length * 2,
  sourceBytes: sourceStats.reduce((sum, item) => sum + item.size, 0),
  outputBytes,
  shareBytes: share.size,
  appleIconBytes,
  outputDirectory,
  manifest,
}, null, 2));
