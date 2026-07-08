import { NextResponse } from "next/server";
import { addRfqSubmission, getRfqStorageStatus, type RfqSubmission } from "@/lib/rfq-store";
import { getTelegramStatus, notifyTelegramRfq } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createRfqSubmission(input: Omit<RfqSubmission, "id" | "createdAt">): RfqSubmission {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...input
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    rfqStorage: getRfqStorageStatus(),
    telegram: getTelegramStatus()
  });
}

export async function POST(request: Request) {
  try {
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

    const input = { company, name, email, phone, product, message };
    let submission: RfqSubmission;
    let saved = true;

    try {
      submission = await addRfqSubmission(input);
    } catch (error) {
      saved = false;
      submission = createRfqSubmission(input);
      console.error("RFQ storage failed; attempting Telegram notification fallback", error);
    }

    try {
      const notification = await notifyTelegramRfq(submission);
      if (!saved && notification.skipped) {
        console.error("Telegram RFQ notification skipped because TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID are missing.");
        throw new Error("RFQ storage failed and Telegram notification is not configured.");
      }
    } catch (error) {
      console.error("Telegram RFQ notification failed", error);
      if (!saved) {
        return NextResponse.json(
          { message: "견적 요청 접수 중 오류가 발생했습니다. 전화 또는 이메일로 문의해 주세요." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, submission, saved });
  } catch (error) {
    console.error("RFQ submission failed", error);
    return NextResponse.json(
      { message: "견적 요청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
