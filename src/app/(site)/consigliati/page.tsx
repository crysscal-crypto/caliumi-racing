import type { Metadata } from "next";
import BoxProdotto from "@/components/BoxProdotto";
import { racingFont } from "@/sanity/lib/fonts";
import { categorieProdotti, getProdotti } from "@/sanity/lib/prodotti";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Attrezzatura moto consigliata | Cristian Caliumi",
  description:
    "Caschi, guanti, tute, stivali e accessori per andare in moto: una selezione di prodotti consigliati da Cristian Caliumi.",
};

export default async function ConsigliatiPage() {
  const prodotti = await getProdotti();
  const gruppi = categorieProdotti
    .map((c) => ({
      ...c,
      prodotti: prodotti.filter((p) => p.categoria === c.value),
    }))
    .filter((g) => g.prodotti.length > 0);

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          Consigliati
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-center text-white/70">
          Una selezione di attrezzatura per chi va in moto. I link portano ad
          Amazon: se acquisti, il sito riceve una piccola commissione, senza
          costi in più per te.
        </p>

        {gruppi.length === 0 ? (
          <p className="text-center text-white/60">
            Presto qui troverai i prodotti consigliati.
          </p>
        ) : (
          <div className="space-y-12">
            {gruppi.map((gruppo) => (
              <div key={gruppo.value}>
                <h2 className="mb-4 text-2xl font-semibold text-white">
                  {gruppo.label}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {gruppo.prodotti.map((prodotto) => (
                    <BoxProdotto key={prodotto._id} prodotto={prodotto} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-xs text-white/50">
          In qualità di Affiliato Amazon, io ricevo un guadagno dagli acquisti
          idonei.
        </p>
      </div>
    </section>
  );
}