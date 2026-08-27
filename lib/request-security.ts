import { products } from "@/lib/site-data";

export type RfqInput = {
  company: string;
  name: string;
  email: string;
  phone: string;
  product: string;
  message: string;
};

type JsonResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: number; message: string };

type RfqValidationResult =
  | { kind: "valid"; input: RfqInput }
  | { kind: "invalid"; message: string }
  | { kind: "spam" };

const allowedProducts = new Set<string>(products.flatMap((product) => [product.ko.name, product.en.name]));
const controlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

function cleanField(value: unknown) {
  return String(value ?? "").replace(controlCharacters, "").trim();
}

function looksGenerated(value: string) {
  if (!/^[A-Za-z]{14,}$/.test(value)) return false;
  const uppercase = (value.match(/[A-Z]/g) || []).length;
  const lowercase = (value.match(/[a-z]/g) || []).length;
  let transitions = 0;

  for (let index = 1; index < value.length; index += 1) {
    if (/[A-Z]/.test(value[index]) !== /[A-Z]/.test(value[index - 1])) transitions += 1;
  }

  return uppercase >= 3 && lowercase >= 6 && transitions >= 5;
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readJsonRequest(request: Request, maxBytes = 24_000): Promise<JsonResult> {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json")) {
    return { ok: false, status: 415, message: "지원하지 않는 요청 형식입니다." };
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, status: 413, message: "요청 내용이 너무 큽니다." };
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return { ok: false, status: 413, message: "요청 내용이 너무 큽니다." };
  }

  try {
    const body = JSON.parse(raw) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid JSON object");
    return { ok: true, body: body as Record<string, unknown> };
  } catch {
    return { ok: false, status: 400, message: "잘못된 요청입니다." };
  }
}

export async function readFormRequest(request: Request, maxBytes = 4_096) {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/x-www-form-urlencoded")) return null;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) return null;
  return new URLSearchParams(raw);
}

export function validateRfqBody(body: Record<string, unknown>): RfqValidationResult {
  const website = cleanField(body.website);
  const startedAt = Number(body.startedAt);
  const elapsed = Date.now() - startedAt;

  if (website || !Number.isFinite(startedAt) || elapsed < 3_000 || elapsed > 24 * 60 * 60 * 1000) {
    return { kind: "spam" };
  }

  const input: RfqInput = {
    company: cleanField(body.company),
    name: cleanField(body.name),
    email: cleanField(body.email),
    phone: cleanField(body.phone),
    product: cleanField(body.product),
    message: cleanField(body.message)
  };

  if (!input.company || !input.name || !input.phone || !input.message) {
    return { kind: "invalid", message: "회사명, 담당자, 연락처, 요청 사항을 입력해 주세요." };
  }

  if (input.company.length > 120 || input.name.length > 80 || input.phone.length > 40 || input.message.length > 3_000) {
    return { kind: "invalid", message: "입력 가능한 글자 수를 초과했습니다." };
  }

  if (input.company.length < 2 || input.name.length < 2 || input.message.length < 10) {
    return { kind: "invalid", message: "회사명, 담당자 및 요청 사항을 조금 더 자세히 입력해 주세요." };
  }

  const phoneDigits = input.phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 20) {
    return { kind: "invalid", message: "연락 가능한 전화번호를 확인해 주세요." };
  }

  if (input.email.length > 254 || (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email))) {
    return { kind: "invalid", message: "이메일 주소를 확인해 주세요." };
  }

  if (input.product && !allowedProducts.has(input.product)) {
    return { kind: "invalid", message: "관심 제품을 다시 선택해 주세요." };
  }

  const linkCount = (input.message.match(/(?:https?:\/\/|www\.)/gi) || []).length;
  const generatedFields = [input.company, input.name, input.message].filter(looksGenerated).length;
  if (linkCount > 2 || generatedFields >= 2) {
    return { kind: "spam" };
  }

  return { kind: "valid", input };
}
