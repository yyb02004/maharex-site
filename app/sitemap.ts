import type { MetadataRoute } from "next";
import { aboutMenu, products } from "@/lib/site-data";

const baseUrl = "https://www.maharex.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/ko", priority: 1, changeFrequency: "monthly" as const },
    { path: "/ko/products", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/ko/references", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/ko/engineering", priority: 0.8, changeFrequency: "yearly" as const },
    { path: "/ko/engineering/validation", priority: 0.7, changeFrequency: "yearly" as const },
    { path: "/ko/engineering/measuring-equipment", priority: 0.7, changeFrequency: "yearly" as const },
    { path: "/ko/contact", priority: 0.8, changeFrequency: "yearly" as const },
    { path: "/ko/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    ...aboutMenu.map(([, slug]) => ({
      path: `/ko/about/${slug}`,
      priority: slug === "company" || slug === "customers" ? 0.8 : 0.6,
      changeFrequency: "yearly" as const
    })),
    ...products.map((product) => ({
      path: `/ko/products/${product.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const
    }))
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    priority,
    changeFrequency
  }));
}
