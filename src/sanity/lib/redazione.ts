// Notizie scritte da Cristian (documenti "notiziaRedazione" in Sanity)
import type { PortableTextBlock } from "@portabletext/react";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

type ImmagineSanity = { asset?: { _ref: string }; alt?: string; credito?: string; didascalia?: string };

export type NotiziaRedazione = {
  _id: string;
  titolo: string;
  slug: string;
  campionato: string;
  data: string;
  aggiornato: string;
  sommario: string;
  estratto?: string;
  autore?: string;
  copertina?: ImmagineSanity;
  testo?: PortableTextBlock[];
};

const CAMPI = `_id, titolo, "slug": slug.current, campionato, "data": dataPubblicazione, "aggiornato": _updatedAt, "sommario": coalesce(sommario, ""), "estratto": pt::text(testo[0...4]), autore, copertina`;

// Se il sommario non c'è ancora (lo scrive l'IA entro pochi minuti) uso l'inizio del testo
function conSommario<T extends { sommario: string; estratto?: string } | null>(n: T): T {
  if (!n) return n;
  if (!n.sommario) {
    const e = (n.estratto ?? "").replace(/\s+/g, " ").trim();
    n.sommario = e.length > 200 ? `${e.slice(0, 197).replace(/\s\S*$/, "")}…` : e;
  }
  delete n.estratto;
  return n;
}

export async function getUltimeRedazione(quante = 6): Promise<NotiziaRedazione[]> {
  try {
    const elenco = await client.fetch<NotiziaRedazione[]>(
      `*[_type == "notiziaRedazione" && defined(slug.current) && dataPubblicazione <= now()] | order(dataPubblicazione desc)[0...$n]{ ${CAMPI} }`,
      { n: quante },
      { next: { revalidate: 120 } }
    );
    return elenco.map(conSommario);
  } catch {
    return [];
  }
}

export async function getRedazioneDaSlug(slug: string): Promise<NotiziaRedazione | null> {
  try {
    const n = await client.fetch<NotiziaRedazione | null>(
      `*[_type == "notiziaRedazione" && slug.current == $slug && dataPubblicazione <= now()][0]{ ${CAMPI}, testo }`,
      { slug },
      { next: { revalidate: 120 } }
    );
    return conSommario(n);
  } catch {
    return null;
  }
}

export async function getSlugRedazione(): Promise<{ slug: string; aggiornato: string }[]> {
  try {
    return await client.fetch(
      `*[_type == "notiziaRedazione" && defined(slug.current) && dataPubblicazione <= now()]{ "slug": slug.current, "aggiornato": _updatedAt }`
    );
  } catch {
    return [];
  }
}

export function urlCopertina(img: ImmagineSanity | undefined, larghezza: number, altezza?: number): string | null {
  if (!img?.asset) return null;
  const b = urlFor(img).width(larghezza).auto("format").quality(80);
  return (altezza ? b.height(altezza).fit("crop") : b).url();
}
