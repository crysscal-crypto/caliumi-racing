import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElencoArticoli from "@/components/ElencoArticoli";
import { getTuttiArticoli } from "@/sanity/lib/articoli";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ anno: string }>;
}): Promise<Metadata> {
  const { anno } = await params;
  if (!/^\d{4}$/.test(anno)) return { title: "Pagina non trovata" };

  return {
    title: `Articoli e classifiche ${anno} | Cristian Caliumi`,
    description: `Articoli di giornale, cronache e classifiche della stagione ${anno} nella carriera di Cristian Caliumi.`,
  };
}

export default async function AnnoPage({
  params,
}: {
  params: Promise<{ anno: string }>;
}) {
  const { anno } = await params;
  if (!/^\d{4}$/.test(anno)) notFound();

  const year = Number(anno);
  const tutti = await getTuttiArticoli();
  const articoli = tutti.filter((a) => a.year === year);
  if (articoli.length === 0) notFound();

  return (
    <ElencoArticoli
      titolo={`Stagione ${anno}`}
      intro={`Articoli di giornale, cronache e classifiche del ${anno}.`}
      tutti={tutti}
      articoli={articoli}
      annoAttivo={year}
    />
  );
}