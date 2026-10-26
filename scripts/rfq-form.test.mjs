import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compile = (source) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const dataModule = { exports: {} };
vm.runInNewContext(compile(await readFile("lib/site-data.ts", "utf8")), { exports: dataModule.exports });
const formCode = compile(await readFile("components/RfqForm.tsx", "utf8"));
const security = {};
vm.runInNewContext(compile(await readFile("lib/request-security.ts", "utf8")), {
  exports: security, Date,
  require(name) { if (name === "@/lib/site-data") return dataModule.exports; throw new Error(name); }
});

// Exercise submit behavior without sending an enquiry or notifying Telegram.
function harness(initialProduct, respond) {
  const hooks = [];
  let cursor = 0;
  const calls = [];
  let resets = 0;
  const fields = { company: "Test Company", name: "Test Contact", phone: "01000000000", email: "", message: "Equipment consultation request", website: "" };
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(formCode, {
    exports, Date,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useState(initial) {
          const index = cursor++;
          if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial;
          return [hooks[index], (value) => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }];
        },
        useRef(value) { const index = cursor++; return hooks[index] ||= { current: value }; }
      };
      if (name === "lucide-react") return {};
      if (name === "@/lib/site-data") return dataModule.exports;
      throw new Error(`Unexpected import: ${name}`);
    },
    FormData: class { get(name) { return fields[name]; } },
    fetch: async (url, options) => { calls.push({ url, payload: JSON.parse(options.body) }); return respond(); }
  });
  const render = () => { cursor = 0; return exports.RfqForm({ locale: "ko", initialProduct }); };
  const submit = () => render().props.onSubmit({ preventDefault() {}, currentTarget: { reset() { resets++; } } });
  return { hooks, fields, calls, render, submit, get resets() { return resets; } };
}

function find(node, type) {
  if (!node || typeof node !== "object") return;
  if (node.type === type) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const match = find(child, type);
    if (match) return match;
  }
}

const success = () => ({ ok: true, json: async () => ({ ok: true }) });

test("product query maps to the existing API product name", async () => {
  const form = harness("rotary-dryers", success);
  await form.submit();
  assert.equal(form.calls[0].url, "/api/rfq");
  assert.equal(form.calls[0].payload.product, "로터리 드라이어");
  assert.equal(form.calls[0].payload.company, "Test Company");
  assert.equal(typeof form.calls[0].payload.startedAt, "number");
  assert.equal(form.resets, 1);
  assert.equal(form.hooks[0], "success");
  const validated = security.validateRfqBody({ ...form.calls[0].payload, startedAt: Date.now() - 5000 });
  assert.equal(validated.kind, "valid");
  assert.equal(validated.input.product, "로터리 드라이어");
});

test("undecided product stays empty; arbitrary product strings are not submitted", async () => {
  for (const initial of ["", "unrecognized"]) {
    const form = harness(initial, success);
    await form.submit();
    assert.equal(form.calls[0].payload.product, "");
  }
});

test("changing the selection updates the submitted product", async () => {
  const form = harness("rotary-dryers", success);
  find(form.render(), "select").props.onChange({ target: { value: "filters" } });
  await form.submit();
  assert.equal(form.calls[0].payload.product, "필터");
});

test("rapid duplicate submits produce one request", async () => {
  let resolve;
  const form = harness("", () => new Promise((done) => { resolve = done; }));
  const first = form.submit();
  await form.submit();
  assert.equal(form.calls.length, 1);
  resolve(success());
  await first;
});

test("network and API failures preserve input and permit retry", async () => {
  for (const fail of [() => { throw new Error("offline"); }, () => ({ ok: false, status: 429, json: async () => ({ message: "Try later" }) })]) {
    let attempt = 0;
    const form = harness("reactors", () => ++attempt === 1 ? fail() : success());
    await form.submit();
    assert.equal(form.hooks[0], "error");
    assert.equal(form.resets, 0);
    await form.submit();
    assert.equal(form.calls.length, 2);
    assert.equal(form.hooks[0], "success");
  }
});

test("honeypot field is retained for server spam validation", async () => {
  const form = harness("", success);
  form.fields.website = "bot-filled";
  await form.submit();
  assert.equal(form.calls[0].payload.website, "bot-filled");
  assert.equal(security.validateRfqBody({ ...form.calls[0].payload, startedAt: Date.now() - 5000 }).kind, "spam");
});
