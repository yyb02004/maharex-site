import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");

  if (!verifyAdminCredentials(id, password)) {
    const failUrl = request.headers.get("referer") || `${new URL(request.url).origin}/ko/admin/rfq`;
    return NextResponse.redirect(`${failUrl.split("?")[0]}?error=login`, { status: 303 });
  }

  const referer = request.headers.get("referer");
  const origin = referer ? new URL(referer).origin : new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/ko/admin/rfq`, { status: 303 });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
