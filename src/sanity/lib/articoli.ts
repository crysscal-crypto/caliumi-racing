import { client } from "@/sanity/lib/client";

export const categoryLabels: Record<string, string> = {
  "trofeo-gilera": "Trofeo Gilera",
  "sport-production": "Sport Production",
  "gp-italiano": "Campionato Italiano GP",
  "gp-europeo": "Campionato Europeo GP",
  motomondiale: "Motomondiale",
  superbike: "Superbike",
  superstock: "Superstock",
};

export function labelCampionato(slug: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(categoryLabels, slug)
    ? categoryLabels[slug]
    : undefined;
}

export type ArticoloLista = {
  _id: string;
  title: string;
  slug: { current: string };
  category?: string;
  year?: number;
  source?: string;
  summary?: string;
  coverImage?: any;
};

export async function getTuttiArticoli(): Promise<ArticoloLista[]> {
  return client.fetch(
    `*[_type == "articolo" && defined(slug.current)] | order(year desc, publishedAt desc) {
      _id, title, slug, category, year, source, summary, coverImage
    }`
  );
}