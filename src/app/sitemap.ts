import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import { getStagioni } from "@/sanity/lib/motogp";

export const revalidate = 3600;

const SITO = process.env.NEXT_PUBLIC_SITE_URL || "https://caliumiracing.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ora = new Date();
  const pagina = (percorso: string, priorita = 0.6, frequenza: "daily" | "weekly" | "monthly" | "yearly" = "monthly", data?: string) => ({
    url: `${SITO}${percorso}`,
    lastModified: data ? new Date(data) : ora,
    changeFrequency: frequenza,
    priority: priorita,
  });

  const fisse = [
    pagina("/", 1, "daily"),
    pagina("/chi-sono", 0.9, "monthly"),
    pagina("/gallery", 0.8, "weekly"),
    pagina("/articoli", 0.8, "weekly"),
    pagina("/moto", 0.8, "monthly"),
    pagina("/campionati", 0.8, "monthly"),
    pagina("/notizie", 0.7, "daily"),
    pagina("/motogp", 0.9, "daily"),
    pagina("/motogp/orari", 0.8, "daily"),
    pagina("/motogp/statistiche", 0.8, "weekly"),
    pagina("/privacy", 0.2, "yearly"),
  ];

  let dinamiche: MetadataRoute.Sitemap = [];
  try {
    const d: {
      articoli: { slug: string; anno?: number; cat?: string; agg: string }[];
      moto: { slug: string; agg: string }[];
      campionati: { slug: string; agg: string }[];
      gallery: { anno?: number; cat?: string }[];
    } = await client.fetch(`{
      "articoli": *[_type == "articolo" && defined(slug.current)]{ "slug": slug.current, "anno": year, "cat": category, "agg": _updatedAt },
      "moto": *[_type == "moto" && defined(slug.current)]{ "slug": slug.current, "agg": _updatedAt },
      "campionati": *[_type == "campionato" && defined(slug.current)]{ "slug": slug.current, "agg": _updatedAt },
      "gallery": *[_type == "galleryItem" && defined(image)]{ "anno": year, "cat": category }
    }`);

    const unici = <T,>(a: (T | undefined | null)[]) => Array.from(new Set(a.filter((x): x is T => x !== undefined && x !== null)));

    dinamiche = [
      ...d.articoli.map((a) => pagina(`/articoli/${a.slug}`, 0.7, "yearly", a.agg)),
      ...unici(d.articoli.map((a) => a.anno)).map((y) => pagina(`/articoli/anno/${y}`, 0.6)),
      ...unici(d.articoli.map((a) => a.cat)).map((c) => pagina(`/articoli/campionato/${c}`, 0.6)),
      ...d.moto.map((m) => pagina(`/moto/${m.slug}`, 0.7, "yearly", m.agg)),
      ...d.campionati.map((c) => pagina(`/campionati/${c.slug}`, 0.7, "yearly", c.agg)),
      ...unici(d.gallery.map((g) => g.anno)).map((y) => pagina(`/gallery/anno/${y}`, 0.6)),
      ...unici(d.gallery.map((g) => g.cat)).map((c) => pagina(`/gallery/categoria/${c}`, 0.5)),
    ];
  } catch {
    // se Sanity non risponde, la sitemap contiene comunque le pagine fisse
  }

  let stagioni: MetadataRoute.Sitemap = [];
  try {
    stagioni = (await getStagioni())
      .filter((s) => !s.current)
      .map((s) => pagina(`/motogp/${s.year}`, 0.5, "yearly"));
  } catch {
    // ignora
  }

  return [...fisse, ...dinamiche, ...stagioni];
}
