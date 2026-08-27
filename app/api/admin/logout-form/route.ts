import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminCookieOptions } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  const target = new URL("/ko/admin/rfq", request.url);
  if (!isSameOriginRequest(request)) {
    return NextResponse.redirect(new URL("?error=auth", target), { status: 303 });
  }

  const response = NextResponse.redirect(target, { status: 303 });
  response.cookies.set(ADMIN_COOKIE, "", getAdminCookieOptions(0));
  return response;
}
