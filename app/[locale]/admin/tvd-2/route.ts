import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ locale: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { locale } = await params;
  const safeLocale = locale === "ko" ? locale : "ko";
  const cookieStore = await cookies();

  if (!verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL(`/${safeLocale}/admin/rfq?error=auth`, request.url));
  }

  return NextResponse.redirect(new URL(`/${safeLocale}/admin/models/tvd-installation`, request.url));
}
