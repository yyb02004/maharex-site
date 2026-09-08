/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["maharex.iptime.org"],
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/[locale]/admin/models/[viewer]": [
      "./private/models/tvd-2/installation_viewer.html.br",
      "./private/models/tvd-2/dryer_viewer.html.br",
      "./private/models/tvd-2/condenser_viewer.html.br",
      "./private/models/tvd-2/receiver_viewer.html.br",
      "./private/models/tvd-2/hotwater_viewer.html.br"
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
