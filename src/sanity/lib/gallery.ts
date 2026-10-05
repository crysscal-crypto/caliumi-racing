import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import type { FotoGallery } from "@/components/GalleryGrid";

const builder = imageUrlBuilder(client);

export const categorieGallery: Record<string, string> = {
  "trofeo-gilera": "Trofeo Gilera",
  "sport-production": "Sport Production",
  "gp-italiano-125": "Campionato Italiano 125cc",
  "gp-italiano-250": "Campionato Italiano 250cc",
  "gp-europeo-125": "Campionato Europeo 125cc",
  "gp-europeo-250": "Campionato Europeo 250cc",
  motomondiale: "Motomondiale",
  superbike: "Superbike",
  superstock: "Superstock",
  // vecchie categorie, tenute per le foto già caricate
  "gp-italiano": "Campionato Italiano GP",
  "gp-europeo": "Campionato Europeo GP",
};

export type GalleryItem = {
  _id: string;
  title: string;
  year: number;
  description?: string;
  category?: string;
  image: any;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  return client.fetch(
    `*[_type == "galleryItem" && defined(image)] | order(year desc, _createdAt asc) {
      _id, title, year, description, category, image
    }`
  );
}

export function anteprima(image: any, w = 600, h = 450): string {
  return builder.image(image).width(w).height(h).url();
}

export function inFotoGallery(items: GalleryItem[]): FotoGallery[] {
  return items.map((item) => ({
    id: item._id,
    titolo: item.title,
    anno: item.year,
    descrizione: item.description,
    alt: item.image?.alt || item.title,
    anteprima: anteprima(item.image),
    grande: builder.image(item.image).width(2000).fit("max").auto("format").url(),
  }));
}

export function anniDisponibili(items: GalleryItem[]): number[] {
  return Array.from(
    new Set(items.map((i) => i.year).filter((y): y is number => typeof y === "number"))
  ).sort((a, b) => a - b);
}

export function categorieDisponibili(items: GalleryItem[]): string[] {
  return Object.keys(categorieGallery).filter((c) =>
    items.some((i) => i.category === c)
  );
}
