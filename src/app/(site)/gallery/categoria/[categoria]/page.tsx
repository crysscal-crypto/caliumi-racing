import type { Metadata } from "next";
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

type Params = { params: Promise<{ categoria: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categoria } = await params;
  const label = categorieGallery[categoria];
  if (!label) return { title: "Pagina non trovata" };
  return {
    title: `Foto ${label} | Cristian Caliumi`,
    description: `Le foto di Cristian Caliumi nel ${label}: gare, circuiti e moto.`,
    alternates: { canonical: `/gallery/categoria/${categoria}` },
  };
}

export default async function GalleryCategoriaPage({ params }: Params) {
  const { categoria } = await params;
  const label = categorieGallery[categoria];
  if (!label) notFound();

  const items = await getGalleryItems();
  const foto = items
    .filter((i) => i.category === categoria)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  if (foto.length === 0) notFound();

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-10 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          {label}
        </h1>

        <FiltriGallery
          anni={anniDisponibili(items)}
          categorie={categorieDisponibili(items)}
          categoriaAttiva={categoria}
        />

        <GalleryGrid foto={inFotoGallery(foto)} />
        <Pubblicita posizione="articolo-fondo" className="mt-12" />
      </div>
    </section>
  );
}
