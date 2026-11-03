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
  autore?: string;
  copertina?: ImmagineSanity;
  testo?: PortableTextBlock[];
};

const CAMPI = `_id, titolo, "slug": slug.current, campionato, "data": dataPubblicazione, "aggiornato": _updatedAt, sommario, autore, copertina`;

export async function getUltimeRedazione(quante = 6): Promise<NotiziaRedazione[]> {
  try {
    return await client.fetch(
      `*[_type == "notiziaRedazione" && defined(slug.current) && dataPubblicazione <= now()] | order(dataPubblicazione desc)[0...$n]{ ${CAMPI} }`,
      { n: quante },
      { next: { revalidate: 120 } }
    );
  } catch {
    return [];
  }
}

export async function getRedazioneDaSlug(slug: string): Promise<NotiziaRedazione | null> {
  try {
    return await client.fetch(
      `*[_type == "notiziaRedazione" && slug.current == $slug && dataPubblicazione <= now()][0]{ ${CAMPI}, testo }`,
      { slug },
      { next: { revalidate: 120 } }
    );
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
