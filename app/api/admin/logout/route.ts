import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminCookieOptions } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", getAdminCookieOptions(0));
  return response;
}
