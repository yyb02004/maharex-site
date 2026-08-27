import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { isSameOriginRequest, readJsonRequest, validateRfqBody } from "@/lib/request-security";
import { addRfqSubmission, type RfqSubmission } from "@/lib/rfq-store";
import { notifyTelegramRfq } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createRfqSubmission(input: Omit<RfqSubmission, "id" | "createdAt">): RfqSubmission {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input
  };
}

export async function GET() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
    }

    const attemptLimit = await checkRateLimit(request, "rfq-attempt", 10, 10 * 60);
    if (attemptLimit.limited) {
      return NextResponse.json(
        { message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429, headers: rateLimitHeaders(attemptLimit) }
      );
    }

    const parsed = await readJsonRequest(request);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: parsed.status });
    }

    const validation = validateRfqBody(parsed.body);
    if (validation.kind === "spam") {
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }
    if (validation.kind === "invalid") {
      return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    const acceptedLimit = await checkRateLimit(request, "rfq-accepted", 5, 60 * 60);
    if (acceptedLimit.limited) {
      return NextResponse.json(
        { message: "견적 요청 접수 한도를 초과했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429, headers: rateLimitHeaders(acceptedLimit) }
      );
    }

    const input = validation.input;
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

    return NextResponse.json({ ok: true, saved }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RFQ submission failed", error);
    return NextResponse.json(
      { message: "견적 요청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
