import type { Metadata } from "next";
import StagioneCIVView from "@/components/StagioneCIV";
import { stagioneCIV, scegliClasseCIV } from "@/sanity/lib/civ";

type Props = { searchParams: Promise<{ classe?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { classe } = await searchParams;
  const s = stagioneCIV();
  const c = s ? scegliClasseCIV(s, classe) : undefined;
  const nome = c?.nome ?? "Superbike";
  const anno = s?.anno ?? new Date().getFullYear();
  return {
    title: `CIV ${nome} ${anno}: classifica e risultati del Campionato Italiano Velocità | Caliumi Racing`,
    description: `Classifica di campionato CIV ${nome} ${anno}, calendario e risultati di Gara 1, Gara 2 e Superpole Race del Campionato Italiano Velocità.`,
    alternates: { canonical: classe ? `/civ?classe=${classe}` : "/civ" },
  };
}

export default async function CIVPage({ searchParams }: Props) {
  const { classe } = await searchParams;
  const s = stagioneCIV();
  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {s ? (
          <StagioneCIVView stagione={s} classe={classe} base={`/civ/${s.anno}`} />
        ) : (
          <p className="text-center text-white/60">Risultati del CIV in arrivo.</p>
        )}
      </div>
    </section>
  );
}
