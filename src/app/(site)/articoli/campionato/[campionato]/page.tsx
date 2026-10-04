import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElencoArticoli from "@/components/ElencoArticoli";
import { getTuttiArticoli, labelCampionato } from "@/sanity/lib/articoli";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campionato: string }>;
}): Promise<Metadata> {
  const { campionato } = await params;
  const label = labelCampionato(campionato);
  if (!label) return { title: "Pagina non trovata" };

  return {
    title: `${label}: articoli e classifiche | Cristian Caliumi`,
    description: `${label} — articoli di giornale, cronache e classifiche storiche nella carriera di Cristian Caliumi.`,
  };
}

export default async function CampionatoPage({
  params,
}: {
  params: Promise<{ campionato: string }>;
}) {
  const { campionato } = await params;
  const label = labelCampionato(campionato);
  if (!label) notFound();

  const tutti = await getTuttiArticoli();
  const articoli = tutti.filter((a) => a.category === campionato);
  if (articoli.length === 0) notFound();

  return (
    <ElencoArticoli
      titolo={label}
      intro={`Articoli di giornale, cronache e classifiche: ${label}.`}
      tutti={tutti}
      articoli={articoli}
      campionatoAttivo={campionato}
    />
  );
}