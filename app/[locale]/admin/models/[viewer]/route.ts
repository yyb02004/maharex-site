import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { modelViewers, type ModelViewerKey } from "@/lib/admin-model-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ locale: string; viewer: string }>;
};

function isModelViewer(value: string): value is ModelViewerKey {
  return Object.prototype.hasOwnProperty.call(modelViewers, value);
}

export async function GET(request: Request, { params }: RouteContext) {
  const { locale, viewer } = await params;
  const safeLocale = locale === "ko" ? locale : "ko";
  const cookieStore = await cookies();

  if (!verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL(`/${safeLocale}/admin/rfq?error=auth`, request.url));
  }

  if (!isModelViewer(viewer)) {
    return new Response("Not Found", { status: 404 });
  }

  if (!request.headers.get("accept-encoding")?.includes("br")) {
    return new Response("This 3D viewer requires Brotli compression support.", {
      status: 406,
      headers: { "Cache-Control": "private, no-store, max-age=0" }
    });
  }

  const model = modelViewers[viewer];
  const viewerPath = path.join(process.cwd(), "private", "models", "tvd-2", model.fileName);
  const file = await readFile(viewerPath);

  return new Response(file, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="${model.downloadName}"`,
      "Content-Encoding": "br",
      "Content-Length": String(file.byteLength),
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
