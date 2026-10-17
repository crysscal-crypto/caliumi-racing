import type { MetadataRoute } from "next";

const SITO = "https://www.caliumiracing.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/studio", "/api/"] }],
    sitemap: `${SITO}/sitemap.xml`,
    host: SITO,
  };
}
