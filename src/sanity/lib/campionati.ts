import { client } from "@/sanity/lib/client";

export type Campionato = {
  _id: string;
  nome: string;
  slug: { current: string };
  sottotitolo?: string;
  periodo?: string;
  categorie?: string[];
  riassunto?: string;
  foto?: any;
  sezioni?: { _key: string; titolo?: string; testo?: string }[];
  esperienza?: string;
  alboDoro?: { _key: string; anno?: number; moto?: string; pilota?: string }[];
  moto?: { _id: string; nome: string; slug: { current: string }; annoInizio: number; annoFine?: number }[];
};

const CAMPI = `_id, nome, slug, sottotitolo, periodo, categorie, riassunto, foto, sezioni, esperienza, alboDoro,
  "moto": moto[]->{ _id, nome, slug, annoInizio, annoFine }`;

export async function getCampionati(): Promise<Campionato[]> {
  return client.fetch(`*[_type == "campionato" && defined(slug.current)] | order(coalesce(ordine, 99) asc, nome asc) { ${CAMPI} }`);
}

export async function getCampionato(slug: string): Promise<Campionato | null> {
  return client.fetch(`*[_type == "campionato" && slug.current == $slug][0] { ${CAMPI} }`, { slug });
}

export async function getCollegati(categorie: string[]) {
  if (categorie.length === 0) return { articoli: [], foto: [] };
  return client.fetch(
    `{
      "articoli": *[_type == "articolo" && category in $c && defined(slug.current)] | order(year asc) { _id, title, slug, year, source },
      "foto": *[_type == "galleryItem" && category in $c && defined(image)] | order(year asc) [0...24] { _id, title, year, description, image }
    }`,
    { c: categorie }
  ) as Promise<{
    articoli: { _id: string; title: string; slug: { current: string }; year?: number; source?: string }[];
    foto: { _id: string; title: string; year?: number; description?: string; image: any }[];
  }>;
}
