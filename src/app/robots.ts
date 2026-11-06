import type { MetadataRoute } from "next";

const SITO = "https://www.caliumiracing.com";

// Motori di ricerca e IA (ChatGPT, Claude, Gemini, Perplexity, Copilot, Apple, Meta...) possono leggere tutto il sito.
// Restano chiusi solo lo Studio (area di gestione) e le API interne.
const BOT_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
  "DuckAssistBot",
];

const CHIUSO = ["/studio", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...BOT_IA.map((userAgent) => ({ userAgent, allow: "/", disallow: CHIUSO })),
      { userAgent: "*", allow: "/", disallow: CHIUSO },
    ],
    sitemap: `${SITO}/sitemap.xml`,
    host: SITO,
  };
}
