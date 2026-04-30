import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const referer = request.headers.get("referer");
  const origin = referer ? new URL(referer).origin : new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/ko/admin/rfq`, { status: 303 });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0
  });
  return response;
}
