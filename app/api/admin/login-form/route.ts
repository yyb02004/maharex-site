import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, getAdminCookieOptions, verifyAdminCredentials } from "@/lib/admin-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { isSameOriginRequest, readFormRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  const baseUrl = new URL("/ko/admin/rfq", request.url);
  if (!isSameOriginRequest(request)) {
    return NextResponse.redirect(new URL("?error=auth", baseUrl), { status: 303 });
  }

  const loginLimit = await checkRateLimit(request, "admin-login", 10, 10 * 60);
  if (loginLimit.limited) {
    return NextResponse.redirect(new URL("?error=rate", baseUrl), {
      status: 303,
      headers: rateLimitHeaders(loginLimit)
    });
  }

  const formData = await readFormRequest(request);
  if (!formData) return NextResponse.redirect(new URL("?error=login", baseUrl), { status: 303 });

  const id = String(formData.get("id") || "").slice(0, 100);
  const password = String(formData.get("password") || "").slice(0, 200);

  if (!verifyAdminCredentials(id, password)) {
    return NextResponse.redirect(new URL("?error=login", baseUrl), { status: 303 });
  }

  try {
    const response = NextResponse.redirect(baseUrl, { status: 303 });
    response.cookies.set(ADMIN_COOKIE, createAdminSession(), getAdminCookieOptions());
    return response;
  } catch (error) {
    console.error("Admin session creation failed", error);
    return NextResponse.redirect(new URL("?error=config", baseUrl), { status: 303 });
  }
}
