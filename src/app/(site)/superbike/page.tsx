import type { Metadata } from "next";
import StagioneSBK from "@/components/StagioneSBK";
import { getStagioneSBK, nomeClasseSBK } from "@/sanity/lib/sbk";

export const revalidate = 600;

type Props = { searchParams: Promise<{ classe?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { classe } = await searchParams;
  const stagione = await getStagioneSBK();
  const anno = stagione?.anno ?? new Date().getFullYear();
  const nome = classe ? nomeClasseSBK(classe.toUpperCase()) : "Superbike";
  return {
    title: `Classifica ${nome} ${anno}, calendario e risultati SBK | Caliumi Racing`,
    description: `Classifica piloti e costruttori del Mondiale ${nome} ${anno} aggiornata, calendario dei round e risultati di Gara 1, Superpole Race, Gara 2, Superpole e prove libere.`,
    alternates: { canonical: classe ? `/superbike?classe=${classe}` : "/superbike" },
  };
}

export default async function SuperbikePage({ searchParams }: Props) {
  const { classe } = await searchParams;
  const stagione = await getStagioneSBK();

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {stagione ? (
          <StagioneSBK stagione={stagione} classe={classe} base={`/superbike/${stagione.anno}`} />
        ) : (
          <p className="text-center text-white/60">
            Dati Superbike non disponibili in questo momento. Riprova tra poco.
          </p>
        )}
      </div>
    </section>
  );
}
