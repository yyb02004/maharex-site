import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { isSameOriginRequest, readFormRequest } from "@/lib/request-security";
import { deleteRfqSubmission } from "@/lib/rfq-store";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const isAdmin = verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/ko/admin/rfq?error=auth", request.url), { status: 303 });
  }

  const formData = await readFormRequest(request);
  const id = String(formData?.get("id") || "");
  if (/^[a-f0-9-]{20,64}$/i.test(id)) {
    await deleteRfqSubmission(id);
  }

  return NextResponse.redirect(new URL("/ko/admin/rfq", request.url), { status: 303 });
}
