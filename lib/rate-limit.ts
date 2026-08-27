import { createHash } from "crypto";

type RateLimitResult = {
  limited: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
};

type MemoryEntry = {
  count: number;
  expiresAt: number;
};

const memoryLimits = new Map<string, MemoryEntry>();
const maxMemoryEntries = 5_000;

function cleanEnv(value?: string) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

function pickEnv(...keys: string[]) {
  for (const key of keys) {
    const value = cleanEnv(process.env[key]);
    if (value) return value;
  }
  return undefined;
}

function getRedisConfig() {
  const url = pickEnv("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "REDIS_REST_API_URL");
  const token = pickEnv("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "REDIS_REST_API_TOKEN");
  if (!url || !token || !url.startsWith("https://")) return null;
  return { url, token };
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function getClientKey(request: Request) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";
  const ip = forwarded.split(",")[0]?.trim().slice(0, 100);
  const fallback = `${request.headers.get("user-agent") || "unknown"}:${new URL(request.url).host}`;
  return hash(ip || fallback);
}

function checkMemoryLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryLimits.get(key);
  const entry = !existing || existing.expiresAt <= now ? { count: 0, expiresAt: now + windowSeconds * 1000 } : existing;
  entry.count += 1;
  memoryLimits.set(key, entry);

  if (memoryLimits.size > 1_000) {
    for (const [itemKey, item] of memoryLimits) {
      if (item.expiresAt <= now) memoryLimits.delete(itemKey);
    }
  }

  while (memoryLimits.size > maxMemoryEntries) {
    const oldestKey = memoryLimits.keys().next().value;
    if (!oldestKey) break;
    memoryLimits.delete(oldestKey);
  }

  return {
    limited: entry.count > limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000))
  };
}

async function checkRedisLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult | null> {
  const config = getRedisConfig();
  if (!config) return null;

  const script = [
    "local count = redis.call('INCR', KEYS[1])",
    "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
    "local ttl = redis.call('TTL', KEYS[1])",
    "return {count, ttl}"
  ].join("\n");

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(["EVAL", script, "1", key, String(windowSeconds)]),
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as { result?: [number, number]; error?: string } | null;
  if (!response.ok || payload?.error || !Array.isArray(payload?.result)) {
    throw new Error(payload?.error || `Rate limit storage failed: ${response.status}`);
  }

  const count = Number(payload.result[0]);
  const ttl = Math.max(1, Number(payload.result[1]) || windowSeconds);
  return {
    limited: count > limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfter: ttl
  };
}

export async function checkRateLimit(request: Request, scope: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const safeScope = scope.replace(/[^a-z0-9:_-]/gi, "-");
  const key = `maharex:rate-limit:${safeScope}:${getClientKey(request)}`;

  try {
    const redisResult = await checkRedisLimit(key, limit, windowSeconds);
    if (redisResult) return redisResult;
  } catch (error) {
    console.error("Distributed rate limit failed; using local fallback", error instanceof Error ? error.message : error);
  }

  return checkMemoryLimit(key, limit, windowSeconds);
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "Cache-Control": "no-store",
    "Retry-After": String(result.retryAfter),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining)
  };
}
