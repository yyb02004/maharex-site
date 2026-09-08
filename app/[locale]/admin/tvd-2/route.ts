import { readFile } from "fs/promises";
import path from "path";
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

  const acceptsBrotli = request.headers.get("accept-encoding")?.includes("br") ?? false;
  const extension = acceptsBrotli ? "br" : "gz";
  const viewerPath = path.join(process.cwd(), "private", "tvd", `TVD-2.0_3D_viewer.html.${extension}`);
  const viewer = await readFile(viewerPath);

  return new Response(viewer, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": 'inline; filename="TVD-2.0_3D_viewer.html"',
      "Content-Encoding": acceptsBrotli ? "br" : "gzip",
      "Content-Length": String(viewer.byteLength),
      "Content-Security-Policy":
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
      "Content-Type": "text/html; charset=utf-8",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Vary": "Cookie, Accept-Encoding",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}
