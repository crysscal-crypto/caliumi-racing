import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { racingFont } from "@/sanity/lib/fonts";
import CardNotizia from "@/components/CardNotizia";
import Pubblicita from "@/components/Pubblicita";
import {
  getNotizie,
  getNotiziaDaSlug,
  getCommenti,
  mappaCommenti,
  formattaData,
  pulisciLink,
} from "@/sanity/lib/notizie";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const notizia = await getNotiziaDaSlug(slug);
  if (!notizia) return { title: "Notizia non disponibile", robots: { index: false } };

  const commento = mappaCommenti(await getCommenti()).get(pulisciLink(notizia.link));

  return {
    title: `${notizia.titolo} | Notizie ${notizia.campionato}`,
    description: (commento?.commento || notizia.estratto || notizia.titolo).slice(0, 160),
    alternates: { canonical: `/notizie/${slug}` },
    // Indicizzata da Google solo se c'è il commento di Cristian (contenuto originale)
    robots: commento ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function NotiziaPage({ params }: Params) {
  const { slug } = await params;
  const [notizia, commenti, tutte] = await Promise.all([
    getNotiziaDaSlug(slug),
    getCommenti(),
    getNotizie(13),
  ]);

  if (!notizia) redirect("/notizie");

  const commentiPerLink = mappaCommenti(commenti);
  const commento = commentiPerLink.get(pulisciLink(notizia.link));
  const altre = tutte.filter((n) => n.slug !== notizia.slug).slice(0, 6);

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/" className="hover:text-racing-yellow">Home</Link>
          {" / "}
          <Link href="/notizie" className="hover:text-racing-yellow">Notizie</Link>
          {" / "}
          <span className="text-white/70">{notizia.campionato}</span>
        </nav>

        <article>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-racing-yellow">
            {notizia.campionato} · {notizia.fonte}
            {notizia.data && (
              <time
                dateTime={notizia.data}
                className="ml-2 font-normal normal-case text-white/50"
              >
                {formattaData(notizia.data)}
              </time>
            )}
          </p>
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
            {notizia.titolo}
          </h1>
          {notizia.estratto && (
            <p className="mt-4 text-lg text-white/75">{notizia.estratto}</p>
          )}

          {commento && (
            <div className="mt-8 rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5">
              <h2 className={`${racingFont.className} mb-2 text-xl text-racing-yellow`}>
                Il commento di Cristian
              </h2>
              <p className="whitespace-pre-line italic text-white/85">
                {commento.commento}
              </p>
            </div>
          )}

          <a
            href={notizia.link}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="mt-8 inline-block rounded-md bg-racing-yellow px-6 py-3 font-semibold text-carbon-950 transition hover:scale-105"
          >
            Leggi l&apos;articolo completo su {notizia.fonte} ↗
          </a>
          <p className="mt-2 text-xs text-white/40">
            Si apre in una nuova scheda: Caliumi Racing resta aperto.
          </p>
        </article>

        <Pubblicita posizione="notizia-sotto-testo" className="mt-10" />

        {altre.length > 0 && (
          <div className="mt-14">
            <h2 className={`${racingFont.className} mb-4 text-2xl text-racing-yellow`}>
              Altre notizie
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {altre.map((n) => (
                <CardNotizia
                  key={n.id}
                  notizia={n}
                  commento={commentiPerLink.get(pulisciLink(n.link))?.commento}
                />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/notizie"
                className="inline-block rounded-md border border-racing-yellow px-6 py-3 font-semibold text-racing-yellow transition hover:scale-105"
              >
                Tutte le notizie
              </Link>
            </div>
          </div>
        )}

        <Pubblicita posizione="notizia-fondo" className="mt-14" />

        <div className="mt-14 rounded-lg bg-carbon-800 p-5 text-center">
          <p className="text-white/80">
            Curioso delle corse di una volta? Ritagli di giornale e classifiche
            delle mie stagioni, dal Trofeo Gilera alla Superbike.
          </p>
          <Link
            href="/articoli"
            className="mt-3 inline-block text-sm font-semibold text-racing-yellow hover:underline"
          >
            Vai agli articoli d&apos;epoca →
          </Link>
        </div>
      </div>
    </section>
  );
}
