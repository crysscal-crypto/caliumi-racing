import type { Metadata } from "next";
import Link from "next/link";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import { racingFont } from "@/sanity/lib/fonts";
import { getCampionati } from "@/sanity/lib/campionati";
import Pubblicita from "@/components/Pubblicita";

export const revalidate = 60;

const builder = imageUrlBuilder(client);

export const metadata: Metadata = {
  title: "I campionati: Trofeo Gilera, Sport Production, GP e Superbike | Caliumi Racing",
  description:
    "Storia, regolamenti, moto e albi d'oro dei campionati corsi da Cristian Caliumi: Trofeo Gilera, Sport Production, Campionato Italiano ed Europeo GP, Motomondiale e Superbike.",
  alternates: { canonical: "/campionati" },
};

export default async function CampionatiPage() {
  const campionati = await getCampionati();

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}>
          I campionati
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-white/70">
          Com'erano, con che moto si correva e chi li ha vinti: i campionati che ho corso, raccontati uno per uno.
        </p>

        {campionati.length === 0 ? (
          <p className="text-center text-white/60">Schede in preparazione.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campionati.map((c) => (
              <Link
                key={c._id}
                href={`/campionati/${c.slug.current}`}
                className="group overflow-hidden rounded-lg bg-carbon-800 transition hover:scale-[1.02]"
              >
                {c.foto ? (
                  <img
                    src={builder.image(c.foto).width(600).height(380).url()}
                    alt={c.foto.alt || c.nome}
                    loading="lazy"
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className={`${racingFont.className} flex h-48 items-center justify-center bg-carbon-900 px-4 text-center text-3xl text-racing-yellow/50`}>
                    {c.nome}
                  </div>
                )}
                <div className="p-4">
                  {c.periodo && <p className="text-sm text-racing-yellow">{c.periodo}</p>}
                  <h2 className="text-lg font-semibold text-white group-hover:text-racing-yellow">{c.nome}</h2>
                  {c.sottotitolo && <p className="mt-1 text-sm text-white/60">{c.sottotitolo}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
        <Pubblicita posizione="articolo-fondo" className="mt-12" />
      </div>
    </section>
  );
}
