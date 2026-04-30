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

export async function readRfqSubmissions(): Promise<RfqSubmission[]> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addRfqSubmission(input: Omit<RfqSubmission, "id" | "createdAt">) {
  await mkdir(dataDir, { recursive: true });
  const submissions = await readRfqSubmissions();
  const submission: RfqSubmission = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...input
  };
  submissions.unshift(submission);
  await writeFile(dataFile, JSON.stringify(submissions, null, 2), "utf8");
  return submission;
}

export async function deleteRfqSubmission(id: string) {
  await mkdir(dataDir, { recursive: true });
  const submissions = await readRfqSubmissions();
  const next = submissions.filter((item) => item.id !== id);
  await writeFile(dataFile, JSON.stringify(next, null, 2), "utf8");
  return next.length !== submissions.length;
}
