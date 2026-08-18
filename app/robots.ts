import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/ko/admin/"]
    },
    sitemap: "https://www.maharex.com/sitemap.xml",
    host: "https://www.maharex.com"
  };
}
