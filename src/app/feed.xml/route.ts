// Feed RSS degli articoli di Caliumi Racing (per Google, aggregatori di notizie e lettori RSS)
import { client } from "@/sanity/lib/client";

export const revalidate = 300;

const SITO = "https://www.caliumiracing.com";

const xml = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  let articoli: { slug: string; titolo: string; data: string; sommario?: string; campionato?: string; foto?: string }[] = [];
  try {
    articoli = await client.fetch(
      `*[_type == "notiziaRedazione" && defined(slug.current) && dataPubblicazione <= now()] | order(dataPubblicazione desc)[0...30]{ "slug": slug.current, titolo, "data": dataPubblicazione, sommario, campionato, "foto": copertina.asset->url }`,
      {},
      { next: { revalidate: 300 } }
    );
  } catch {
    // feed vuoto
  }

  const corpo = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Caliumi Racing - Notizie</title>
    <link>${SITO}/notizie</link>
    <description>Gli articoli di Caliumi Racing su MotoGP, Superbike e motociclismo.</description>
    <language>it</language>
    <atom:link href="${SITO}/feed.xml" rel="self" type="application/rss+xml" />
    ${articoli[0] ? `<lastBuildDate>${new Date(articoli[0].data).toUTCString()}</lastBuildDate>` : ""}
${articoli
  .map(
    (a) => `    <item>
      <title>${xml(a.titolo)}</title>
      <link>${SITO}/notizie/${xml(a.slug)}</link>
      <guid isPermaLink="true">${SITO}/notizie/${xml(a.slug)}</guid>
      <pubDate>${new Date(a.data).toUTCString()}</pubDate>
      ${a.campionato ? `<category>${xml(a.campionato)}</category>` : ""}
      ${a.sommario ? `<description>${xml(a.sommario)}</description>` : ""}
      ${a.foto ? `<media:content url="${xml(`${a.foto}?w=1200&h=675&fit=crop`)}" medium="image" />` : ""}
    </item>`
  )
  .join("\\n")}
  </channel>
</rss>`;

  return new Response(corpo, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
