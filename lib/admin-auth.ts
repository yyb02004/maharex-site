import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "maharex_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const ADMIN_ID = process.env.MAHAREX_ADMIN_ID?.trim() || "maharex";
const PASSWORD_HASH =
  process.env.MAHAREX_ADMIN_PASSWORD_HASH?.trim() || "b20f311d064699e2ab31b5a7e5583aa5bce1390416c36a767adba57d3f81f1c3";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminCredentials(id: string, password: string) {
  return id.trim() === ADMIN_ID && safeEqual(sha256(`${ADMIN_ID}-admin:${password.trim()}`), PASSWORD_HASH);
}

function getSessionSecret() {
  const secret =
    process.env.MAHAREX_ADMIN_SECRET?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (secret) return secret;
  return process.env.NODE_ENV === "production" ? null : "maharex-local-admin-session";
}

function signSession(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createAdminSession() {
  const secret = getSessionSecret();
  if (!secret) throw new Error("관리자 세션 비밀키가 설정되어 있지 않습니다.");

  const issuedAt = Date.now();
  const nonce = randomBytes(16).toString("hex");
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${signSession(payload, secret)}`;
}

export function verifyAdminSession(value?: string) {
  if (!value) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const [issuedAtRaw, nonce, signature] = value.split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!issuedAt || !nonce || !signature) return false;

  const age = Date.now() - issuedAt;
  if (age < -5 * 60 * 1000 || age > ADMIN_SESSION_MAX_AGE * 1000) return false;

  return safeEqual(signature, signSession(`${issuedAtRaw}.${nonce}`, secret));
}

export function getAdminCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  };
}
