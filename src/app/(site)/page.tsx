import Link from "next/link";
import Image from "next/image";
import { racingFont } from "@/sanity/lib/fonts";
import CardNotizia from "@/components/CardNotizia";
import Pubblicita from "@/components/Pubblicita";
import {
  getNotizie,
  getCommenti,
  mappaCommenti,
  pulisciLink,
} from "@/sanity/lib/notizie";

export const revalidate = 300;

export default async function HomePage() {
  const [notizie, commenti] = await Promise.all([getNotizie(9), getCommenti()]);
  const commentiPerLink = mappaCommenti(commenti);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[45vh] min-h-[320px] w-full">
          <Image
            src="/hero.jpg"
            alt="Cristian Caliumi in pista"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon-950 via-carbon-950/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-12 text-center sm:px-6">
            <h1 className={`${racingFont.className} text-3xl tracking-wide text-white sm:text-5xl`}>
              Cristian Caliumi
            </h1>
            <p className="mt-2 text-white/80">
              Pilota motociclistico
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/chi-sono"
                className="rounded-md bg-racing-yellow px-6 py-3 font-semibold text-carbon-950 transition hover:scale-105"
              >
                La mia storia
              </Link>
              <Link
                href="/gallery"
                className="rounded-md border border-white/40 px-6 py-3 font-semibold text-white transition hover:scale-105"
              >
                Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ultime notizie */}
      {notizie.length > 0 && (
        <section className="carbon-bg">
          <div className="content-panel mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className={`${racingFont.className} text-2xl text-racing-yellow sm:text-3xl`}>
                Ultime notizie MotoGP e Superbike
              </h2>
              <Link
                href="/notizie"
                className="text-sm font-semibold text-racing-yellow hover:underline"
              >
                Tutte le notizie →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notizie.map((n) => (
                <CardNotizia
                  key={n.id}
                  notizia={n}
                  commento={commentiPerLink.get(pulisciLink(n.link))?.commento}
                />
              ))}
            </div>
            <Pubblicita posizione="home-notizie" className="mt-8" />
          </div>
        </section>
      )}

      {/* Breve intro */}
      <section className="carbon-bg">
        <div className="content-panel mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-white/80">
            Una passione per le moto vissuta in pista per anni, tra
            campionati nazionali, trofei ed esperienze internazionali —
            compresa una wild card nel Motomondiale classe 125 e alcune gare
            nel Campionato Mondiale Superbike. Qui racconto la mia storia,
            le foto e le classifiche delle stagioni vissute in sella.
          </p>
          <Link
            href="/articoli"
            className="mt-6 inline-block rounded-md border border-racing-yellow px-6 py-3 font-semibold text-racing-yellow transition hover:scale-105"
          >
            Scopri la carriera
          </Link>
        </div>
      </section>
    </>
  );
}
