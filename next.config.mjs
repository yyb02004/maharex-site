/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["maharex.iptime.org"],
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/[locale]/admin/models/[viewer]": [
      "./private/models/tvd-2/installation_viewer.html.br",
      "./private/models/tvd-2/installation_manifest.json",
      "./private/models/tvd-2/installation-data-*.json.br",
      "./private/models/nf-1200/nutsche_viewer.html.br",
      "./private/models/nf-1200/nutsche_manifest.json",
      "./private/models/nf-1200/nutsche-data-*.json.br",
      "./private/models/rs-205/reactor_fullset_viewer.html.br",
      "./private/models/rs-205/reactor_fullset_manifest.json",
      "./private/models/rs-205/reactor_fullset-data-*.json.br",
      "./private/models/rvd-1500/rvd1500_viewer.html.br",
      "./private/models/rvd-1500/rvd1500_manifest.json",
      "./private/models/rvd-1500/rvd1500-data-*.json.br",
      "./private/models/rvd-501/rvd501_viewer.html.br",
      "./private/models/rvd-501/rvd501_manifest.json",
      "./private/models/rvd-501/rvd501-data-*.json.br",
      "./private/models/ejm12/jetmill_viewer.html.br",
      "./private/models/ejm12/jetmill_manifest.json",
      "./private/models/ejm12/jetmill-data-*.json.br",
      "./private/models/pm12/pinmill_viewer.html.br",
      "./private/models/pm12/pinmill_manifest.json",
      "./private/models/pm12/pinmill-data-*.json.br",
      "./private/models/pm12-low-hopper/pinmill_viewer.html.br",
      "./private/models/pm12-low-hopper/pinmill_manifest.json",
      "./private/models/pm12-low-hopper/pinmill-data-*.json.br"
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" }
        ]
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      }
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400
  }
};

export default nextConfig;
