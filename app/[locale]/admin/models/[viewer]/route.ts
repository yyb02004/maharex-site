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

const legacyViewers = new Set(["tvd-dryer", "tvd-condenser", "tvd-receiver", "tvd-hotwater"]);
const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Vary": "Cookie, Accept-Encoding",
  "X-Robots-Tag": "noindex, nofollow, noarchive"
};

function isModelViewer(value: string): value is ModelViewerKey {
  return Object.prototype.hasOwnProperty.call(modelViewers, value);
}

export async function GET(request: Request, { params }: RouteContext) {
  const { locale, viewer } = await params;
  const safeLocale = locale === "ko" ? locale : "ko";
  const cookieStore = await cookies();

  if (!verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL(`/${safeLocale}/admin/rfq?error=auth`, request.url), { headers: privateHeaders });
  }

  if (legacyViewers.has(viewer)) {
    return NextResponse.redirect(new URL(`/${safeLocale}/admin/models/tvd-installation`, request.url), { headers: privateHeaders });
  }

  if (!isModelViewer(viewer)) {
    return new Response("Not Found", { status: 404, headers: privateHeaders });
  }

  if (!request.headers.get("accept-encoding")?.includes("br")) {
    return new Response("This 3D viewer requires Brotli compression support.", {
      status: 406,
      headers: privateHeaders
    });
  }

  const model = modelViewers[viewer];
  const modelRoot = path.join(process.cwd(), "private", "models", "tvd-2");
  const asset = new URL(request.url).searchParams.get("asset");
  let fileName: string = model.fileName;

  if (asset !== null) {
    const manifest: { assets: string[] } = JSON.parse(await readFile(path.join(modelRoot, model.manifestFile), "utf8"));
    if (!manifest.assets.includes(asset)) {
      return new Response("Not Found", { status: 404, headers: privateHeaders });
    }
    fileName = asset;
  }

  const viewerPath = path.join(modelRoot, fileName);
  const file = await readFile(viewerPath);

  return new Response(file, {
    headers: {
      ...privateHeaders,
      ...(asset === null ? { "Content-Disposition": `inline; filename="${model.downloadName}"` } : {}),
      "Content-Encoding": "br",
      "Content-Length": String(file.byteLength),
      "Content-Security-Policy":
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
      "Content-Type": asset === null ? "text/html; charset=utf-8" : "application/json; charset=utf-8",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    }
  });
}
