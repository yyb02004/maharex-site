import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { deleteRfqSubmission } from "@/lib/rfq-store";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const isAdmin = verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/ko/admin/rfq?error=auth", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const id = String(formData.get("id") || "");
  if (id) {
    await deleteRfqSubmission(id);
  }

  const referer = request.headers.get("referer");
  const origin = referer ? new URL(referer).origin : new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/ko/admin/rfq`, { status: 303 });
}
