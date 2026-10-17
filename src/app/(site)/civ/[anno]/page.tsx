import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import StagioneCIVView from "@/components/StagioneCIV";
import { stagioneCIV, stagioniCIV, scegliClasseCIV } from "@/sanity/lib/civ";

type Props = {
  params: Promise<{ anno: string }>;
  searchParams: Promise<{ classe?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { anno } = await params;
  const { classe } = await searchParams;
  const s = /^\d{4}$/.test(anno) ? stagioneCIV(Number(anno)) : undefined;
  if (!s) return { title: "Pagina non trovata" };
  const nome = scegliClasseCIV(s, classe)?.nome ?? "Superbike";
  return {
    title: `CIV ${nome} ${anno}: classifica finale e risultati | Caliumi Racing`,
    description: `Classifica e risultati di tutte le gare del Campionato Italiano Velocità ${nome} ${anno}.`,
    alternates: { canonical: `/civ/${anno}${classe ? `?classe=${classe}` : ""}` },
  };
}

export default async function CIVAnnoPage({ params, searchParams }: Props) {
  const { anno } = await params;
  const { classe } = await searchParams;
  if (!/^\d{4}$/.test(anno)) notFound();
  const s = stagioneCIV(Number(anno));
  if (!s) notFound();
  if (stagioniCIV()[0]?.anno === s.anno) redirect(classe ? `/civ?classe=${classe}` : "/civ");

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <StagioneCIVView stagione={s} classe={classe} base={`/civ/${anno}`} />
      </div>
    </section>
  );
}
