import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import StagioneSBK from "@/components/StagioneSBK";
import { getStagioneSBK, nomeClasseSBK } from "@/sanity/lib/sbk";

export const revalidate = 600;

type Props = {
  params: Promise<{ anno: string }>;
  searchParams: Promise<{ classe?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { anno } = await params;
  const { classe } = await searchParams;
  if (!/^\d{4}$/.test(anno)) return { title: "Pagina non trovata" };
  const nome = classe ? nomeClasseSBK(classe.toUpperCase()) : "Superbike";
  return {
    title: `Mondiale ${nome} ${anno}: classifica finale e risultati | Caliumi Racing`,
    description: `Classifica piloti e costruttori e risultati di tutti i round del Mondiale ${nome} ${anno}.`,
    alternates: { canonical: `/superbike/${anno}${classe ? `?classe=${classe}` : ""}` },
  };
}

export default async function SuperbikeAnnoPage({ params, searchParams }: Props) {
  const { anno } = await params;
  const { classe } = await searchParams;
  if (!/^\d{4}$/.test(anno)) notFound();

  const stagione = await getStagioneSBK(Number(anno));
  if (!stagione) notFound();
  if (stagione.current) redirect(classe ? `/superbike?classe=${classe}` : "/superbike");

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <StagioneSBK stagione={stagione} classe={classe} base={`/superbike/${anno}`} />
      </div>
    </section>
  );
}
