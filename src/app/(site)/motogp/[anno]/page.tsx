import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import StagioneMotoGP from "@/components/StagioneMotoGP";
import { getStagione } from "@/sanity/lib/motogp";

export const revalidate = 600;

type Props = {
  params: Promise<{ anno: string }>;
  searchParams: Promise<{ classe?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { anno } = await params;
  const { classe } = await searchParams;
  if (!/^\d{4}$/.test(anno)) return { title: "Pagina non trovata" };
  const nome = classe ? classe.toUpperCase().replace("MOTO", "Moto") : "Motomondiale";
  return {
    title: `${nome} ${anno}: classifica finale e risultati | Caliumi Racing`,
    description: `Classifica piloti e risultati di tutti i Gran Premi del Motomondiale ${anno}.`,
    alternates: { canonical: `/motogp/${anno}${classe ? `?classe=${classe}` : ""}` },
  };
}

export default async function MotoGPAnnoPage({ params, searchParams }: Props) {
  const { anno } = await params;
  const { classe } = await searchParams;
  if (!/^\d{4}$/.test(anno)) notFound();

  const stagione = await getStagione(Number(anno));
  if (!stagione) notFound();
  if (stagione.current) redirect(classe ? `/motogp?classe=${classe}` : "/motogp");

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <StagioneMotoGP stagione={stagione} classe={classe} base={`/motogp/${anno}`} />
      </div>
    </section>
  );
}
