import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "maharex_admin_session";

const ADMIN_ID = "maharex";
const PASSWORD_HASH = "b20f311d064699e2ab31b5a7e5583aa5bce1390416c36a767adba57d3f81f1c3";
const SESSION_SECRET = process.env.MAHAREX_ADMIN_SECRET || "maharex-local-admin-session";

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

export function createAdminSession() {
  const nonce = randomBytes(16).toString("hex");
  const signature = sha256(`${nonce}:${SESSION_SECRET}`);
  return `${nonce}.${signature}`;
}

export function verifyAdminSession(value?: string) {
  if (!value) return false;
  const [nonce, signature] = value.split(".");
  if (!nonce || !signature) return false;
  return safeEqual(signature, sha256(`${nonce}:${SESSION_SECRET}`));
}
