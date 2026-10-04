import type { Metadata } from "next";
import ElencoArticoli from "@/components/ElencoArticoli";
import { getTuttiArticoli } from "@/sanity/lib/articoli";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Articoli e classifiche storiche | Cristian Caliumi",
  description:
    "Articoli di giornale e classifiche storiche di Trofeo Gilera, Sport Production, Campionato Italiano ed Europeo GP, Motomondiale e Superbike: le stagioni di Cristian Caliumi.",
};

export default async function ArticoliPage() {
  const tutti = await getTuttiArticoli();

  return (
    <ElencoArticoli
      titolo="Articoli"
      intro="Ritagli di giornale, cronache e classifiche delle stagioni di Cristian Caliumi, per campionato e per anno."
      tutti={tutti}
      articoli={tutti}
    />
  );
}