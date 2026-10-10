import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { racingFont } from "@/sanity/lib/fonts";
import GalleryGrid from "@/components/GalleryGrid";
import FiltriGallery from "@/components/FiltriGallery";
import {
  getGalleryItems,
  anniDisponibili,
  categorieDisponibili,
  categorieGallery,
  inFotoGallery,
} from "@/sanity/lib/gallery";
import Pubblicita from "@/components/Pubblicita";

export const revalidate = 60;

type Params = { params: Promise<{ anno: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { anno } = await params;
  if (!/^\d{4}$/.test(anno)) return { title: "Pagina non trovata" };
  return {
    title: `Foto stagione ${anno} | Cristian Caliumi`,
    description: `Le foto della stagione ${anno} di Cristian Caliumi, pilota di Carpi: gare, circuiti e moto di quell'anno.`,
    alternates: { canonical: `/gallery/anno/${anno}` },
  };
}

export default async function GalleryAnnoPage({ params }: Params) {
  const { anno } = await params;
  if (!/^\d{4}$/.test(anno)) notFound();

  const year = Number(anno);
  const items = await getGalleryItems();
  const foto = items.filter((i) => i.year === year);
  if (foto.length === 0) notFound();

  const anni = anniDisponibili(items);
  const pos = anni.indexOf(year);
  const prec = pos > 0 ? anni[pos - 1] : null;
  const succ = pos < anni.length - 1 ? anni[pos + 1] : null;

  const campionati = Array.from(
    new Set(foto.map((f) => f.category).filter(Boolean) as string[])
  ).map((c) => categorieGallery[c] ?? c);

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          Stagione {anno}
        </h1>
        {campionati.length > 0 && (
          <p className="mx-auto mb-10 max-w-2xl text-center text-white/70">
            {campionati.join(" · ")}
          </p>
        )}

        <FiltriGallery
          anni={anni}
          categorie={categorieDisponibili(items)}
          annoAttivo={year}
        />

        <GalleryGrid foto={inFotoGallery(foto)} />

        <Pubblicita posizione="articolo-fondo" className="mt-12" />

        <div className="mt-12 flex items-center justify-between gap-4 text-sm font-semibold">
          {prec ? (
            <Link href={`/gallery/anno/${prec}`} className="text-racing-yellow hover:underline">
              ← Stagione {prec}
            </Link>
          ) : (
            <span />
          )}
          <Link
            href={`/articoli/anno/${anno}`}
            className="text-white/60 hover:text-racing-yellow"
          >
            Articoli del {anno}
          </Link>
          {succ ? (
            <Link href={`/gallery/anno/${succ}`} className="text-racing-yellow hover:underline">
              Stagione {succ} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </section>
  );
}
