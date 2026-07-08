import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type RfqSubmission = {
  id: string;
  createdAt: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  product: string;
  message: string;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "rfq-submissions.json");
const kvKey = "maharex:rfq-submissions";

function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!url.startsWith("https://")) {
    throw new Error("RFQ 저장소 URL은 https:// 주소여야 합니다.");
  }
  return { url, token };
}

async function kvCommand<T>(command: unknown[]): Promise<T> {
  const config = getKvConfig();
  if (!config) {
    throw new Error("Vercel KV 환경변수가 설정되어 있지 않습니다.");
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });

  const result = (await response.json().catch(() => null)) as { result?: T; error?: string } | null;
  if (!response.ok || result?.error) {
    throw new Error(result?.error || `Vercel KV 요청 실패: ${response.status}`);
  }

  return result?.result as T;
}

function shouldUseKv() {
  return Boolean(getKvConfig());
}

async function readKvSubmissions(): Promise<RfqSubmission[]> {
  const raw = await kvCommand<string | null>(["GET", kvKey]);
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeKvSubmissions(submissions: RfqSubmission[]) {
  await kvCommand<"OK">(["SET", kvKey, JSON.stringify(submissions)]);
}

export async function readRfqSubmissions(): Promise<RfqSubmission[]> {
  if (shouldUseKv()) {
    return readKvSubmissions();
  }

  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addRfqSubmission(input: Omit<RfqSubmission, "id" | "createdAt">) {
  const submissions = await readRfqSubmissions();
  const submission: RfqSubmission = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...input
  };
  submissions.unshift(submission);

  if (shouldUseKv()) {
    await writeKvSubmissions(submissions);
    return submission;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(submissions, null, 2), "utf8");
  return submission;
}

export async function deleteRfqSubmission(id: string) {
  const submissions = await readRfqSubmissions();
  const next = submissions.filter((item) => item.id !== id);

  if (shouldUseKv()) {
    await writeKvSubmissions(next);
    return next.length !== submissions.length;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(next, null, 2), "utf8");
  return next.length !== submissions.length;
}
