import { NextResponse } from "next/server";
import { checkRfqStorage } from "@/lib/rfq-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const rfqStorage = await checkRfqStorage();
  if (!rfqStorage.writeOk) {
    console.error("RFQ storage keepalive failed", rfqStorage);
    return NextResponse.json({ ok: false, rfqStorage }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rfqStorage });
}
