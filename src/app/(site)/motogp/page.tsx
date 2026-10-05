import type { Metadata } from "next";
import StagioneMotoGP from "@/components/StagioneMotoGP";
import { getStagione } from "@/sanity/lib/motogp";

export const revalidate = 600;

type Props = { searchParams: Promise<{ classe?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { classe } = await searchParams;
  const stagione = await getStagione();
  const anno = stagione?.year ?? new Date().getFullYear();
  const nome = classe === "moto2" ? "Moto2" : classe === "moto3" ? "Moto3" : "MotoGP";
  return {
    title: `Classifica ${nome} ${anno}, calendario e risultati | Caliumi Racing`,
    description: `Classifica piloti ${nome} ${anno} aggiornata, calendario dei Gran Premi e risultati di gara, Sprint, qualifiche e prove libere.`,
    alternates: { canonical: classe ? `/motogp?classe=${classe}` : "/motogp" },
  };
}

export default async function MotoGPPage({ searchParams }: Props) {
  const { classe } = await searchParams;
  const stagione = await getStagione();

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {stagione ? (
          <StagioneMotoGP stagione={stagione} classe={classe} base={`/motogp/${stagione.year}`} />
        ) : (
          <p className="text-center text-white/60">
            Dati MotoGP non disponibili in questo momento. Riprova tra poco.
          </p>
        )}
      </div>
    </section>
  );
}
