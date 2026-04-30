import { NextResponse } from "next/server";
import { addRfqSubmission } from "@/lib/rfq-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const company = String(body.company || "").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const product = String(body.product || "").trim();
  const message = String(body.message || "").trim();

  if (!company || !name || !phone || !message) {
    return NextResponse.json({ message: "회사명, 담당자, 연락처, 요청 사항을 입력해 주세요." }, { status: 400 });
  }

  const submission = await addRfqSubmission({ company, name, email, phone, product, message });
  return NextResponse.json({ ok: true, submission });
}
