import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/admin-model-catalog.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { modelCategories, modelSets, modelViewers, getModelCategory } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("five ordered categories include every model exactly once", () => {
  assert.deepEqual(modelCategories.map((category) => category.label), ["반응기", "트레이진공건조기", "로터리드라이어", "필터", "분쇄기"]);
  const keys = modelCategories.flatMap((category) => category.models);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual([...keys].sort(), Object.keys(modelViewers).sort());
  assert.deepEqual(modelSets.map((model) => model.key).sort(), [...keys].sort());
  assert(getModelCategory("rotary-dryers").models.includes("conical-dryer"));
  assert.deepEqual(getModelCategory("mills").models, ["pm12", "pm12-low-hopper", "ejm12"]);
});

test("unrecognized and multi-valued category queries are not accepted", () => {
  for (const value of [undefined, "", "../conical-dryer", "constructor", ["rotary-dryers"], ["mills", "filters"]]) assert.equal(getModelCategory(value), undefined);
});

test("catalog counts match private manifests; category images exist", async () => {
  for (const model of modelSets) {
    const viewer = modelViewers[model.key];
    const manifest = JSON.parse(await readFile(path.join("private/models", viewer.directory, viewer.manifestFile), "utf8"));
    assert.equal(Number(model.partCount.replace(/\D/g, "")), manifest.partCount, model.key);
  }
  for (const category of modelCategories) assert((await readFile(path.join("public", category.image))).length > 0);
});
