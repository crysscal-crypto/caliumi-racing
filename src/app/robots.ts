import type { MetadataRoute } from "next";

const SITO = process.env.NEXT_PUBLIC_SITE_URL || "https://caliumiracing.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/studio", "/api/"] }],
    sitemap: `${SITO}/sitemap.xml`,
    host: SITO,
  };
}
