// Sitemap Google News: gli articoli di Caliumi Racing degli ultimi 2 giorni.
// Google la legge spesso e scopre subito gli articoli nuovi.
import { client } from "@/sanity/lib/client";

export const revalidate = 300;

const SITO = "https://www.caliumiracing.com";

const xml = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  let articoli: { slug: string; titolo: string; data: string }[] = [];
  try {
    articoli = await client.fetch(
      `*[_type == "notiziaRedazione" && defined(slug.current) && dataPubblicazione > $da && dataPubblicazione <= now()] | order(dataPubblicazione desc)[0...1000]{ "slug": slug.current, titolo, "data": dataPubblicazione }`,
      { da: new Date(Date.now() - 2 * 86400000).toISOString() },
      { next: { revalidate: 300 } }
    );
  } catch {
    // sitemap vuota: Google riprova più tardi
  }

  const corpo = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articoli
  .map(
    (a) => `  <url>
    <loc>${SITO}/notizie/${xml(a.slug)}</loc>
    <news:news>
      <news:publication><news:name>Caliumi Racing</news:name><news:language>it</news:language></news:publication>
      <news:publication_date>${new Date(a.data).toISOString()}</news:publication_date>
      <news:title>${xml(a.titolo)}</news:title>
    </news:news>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(corpo, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
