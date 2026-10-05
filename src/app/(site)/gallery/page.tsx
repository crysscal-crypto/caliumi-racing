import type { Metadata } from "next";
import Link from "next/link";
import { racingFont } from "@/sanity/lib/fonts";
import FiltriGallery from "@/components/FiltriGallery";
import {
  getGalleryItems,
  anniDisponibili,
  categorieDisponibili,
  categorieGallery,
  anteprima,
} from "@/sanity/lib/gallery";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Gallery foto 1989–2002 | Cristian Caliumi",
  description:
    "Le foto delle stagioni di Cristian Caliumi, anno per anno: Trofeo Gilera, Sport Production, Campionato Italiano ed Europeo 125 e 250, Motomondiale e Superbike.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const items = await getGalleryItems();
  const anni = anniDisponibili(items);

  const stagioni = anni.map((anno) => {
    const foto = items.filter((i) => i.year === anno);
    const campionati = Array.from(
      new Set(foto.map((f) => f.category).filter(Boolean) as string[])
    ).map((c) => categorieGallery[c] ?? c);
    return { anno, copertina: foto[0], quante: foto.length, campionati };
  });

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          Gallery
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-center text-white/70">
          Le foto delle mie stagioni in pista, anno per anno. Scegli una
          stagione per vedere tutte le foto.
        </p>

        {stagioni.length === 0 ? (
          <p className="text-center text-white/60">Nessuna foto ancora caricata.</p>
        ) : (
          <>
            <FiltriGallery anni={anni} categorie={categorieDisponibili(items)} />

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {stagioni.map((s) => (
                <Link
                  key={s.anno}
                  href={`/gallery/anno/${s.anno}`}
                  className="group overflow-hidden rounded-lg bg-carbon-800 transition hover:scale-[1.02]"
                >
                  <div className="relative">
                    <img
                      src={anteprima(s.copertina.image)}
                      alt={s.copertina.image?.alt || `Cristian Caliumi stagione ${s.anno}`}
                      loading="lazy"
                      className="h-64 w-full object-cover"
                    />
                    <span
                      className={`${racingFont.className} absolute bottom-3 left-4 text-5xl text-racing-yellow drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]`}
                    >
                      {s.anno}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/60">
                      {s.quante} foto
                    </p>
                    {s.campionati.length > 0 && (
                      <p className="mt-1 text-sm font-semibold text-white group-hover:text-racing-yellow">
                        {s.campionati.join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
