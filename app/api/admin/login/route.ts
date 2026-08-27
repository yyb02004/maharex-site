import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, getAdminCookieOptions, verifyAdminCredentials } from "@/lib/admin-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { isSameOriginRequest, readJsonRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const loginLimit = await checkRateLimit(request, "admin-login", 10, 10 * 60);
  if (loginLimit.limited) {
    return NextResponse.json(
      { message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: rateLimitHeaders(loginLimit) }
    );
  }

  const parsed = await readJsonRequest(request, 4_096);
  if (!parsed.ok) return NextResponse.json({ message: parsed.message }, { status: parsed.status });

  const id = String(parsed.body.id || "").slice(0, 100);
  const password = String(parsed.body.password || "").slice(0, 200);

  if (!verifyAdminCredentials(id, password)) {
    return NextResponse.json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(ADMIN_COOKIE, createAdminSession(), getAdminCookieOptions());
    return response;
  } catch (error) {
    console.error("Admin session creation failed", error);
    return NextResponse.json({ message: "관리자 보안 설정을 확인해 주세요." }, { status: 503 });
  }
}
