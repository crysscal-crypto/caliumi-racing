import type { Metadata } from "next";
import { racingFont } from "@/sanity/lib/fonts";
import { Fragment } from "react";
import CardNotizia from "@/components/CardNotizia";
import Pubblicita from "@/components/Pubblicita";
import {
  getNotizie,
  getCommenti,
  mappaCommenti,
  formattaData,
  pulisciLink,
  FEEDS,
} from "@/sanity/lib/notizie";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Notizie MotoGP e Superbike di oggi | Caliumi Racing",
  description:
    "Le ultime notizie di MotoGP e Superbike raccolte dalle principali testate italiane del motociclismo, aggiornate ogni 30 minuti, con il commento di Cristian Caliumi.",
  alternates: { canonical: "/notizie" },
};

export default async function NotiziePage() {
  const [notizie, commenti] = await Promise.all([getNotizie(), getCommenti()]);
  const fonti = Array.from(new Set(FEEDS.map((f) => f.fonte)));
  const commentiPerLink = mappaCommenti(commenti);
  const inEvidenza = commenti.slice(0, 5);

  const slugPerLink = new Map<string, string>();
  notizie.forEach((n) => slugPerLink.set(pulisciLink(n.link), n.slug));

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          Notizie
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-center text-white/70">
          Le ultime dal mondo delle corse in moto, MotoGP e Superbike, raccolte
          dalle testate di settore e aggiornate ogni 30 minuti.
        </p>

        {inEvidenza.length > 0 && (
          <div className="mb-12">
            <h2
              className={`${racingFont.className} mb-4 text-2xl text-racing-yellow`}
            >
              Il commento di Cristian
            </h2>
            <ul className="space-y-4">
              {inEvidenza.map((c) => {
                const slug = slugPerLink.get(pulisciLink(c.link));
                return (
                  <li key={c._id}>
                    <article className="rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5">
                      <p className="mb-1 text-xs uppercase tracking-wide text-white/50">
                        {c.fonte ? `${c.fonte} · ` : ""}
                        {formattaData(c.data, false)}
                      </p>
                      <h3 className="text-lg font-semibold leading-snug text-white">
                        {c.titolo}
                      </h3>
                      <p className="mt-3 whitespace-pre-line border-l-2 border-racing-yellow pl-4 italic text-white/85">
                        {c.commento}
                      </p>
                      {slug ? (
                        <a
                          href={`/notizie/${slug}`}
                          className="mt-3 inline-block text-sm font-semibold text-racing-yellow hover:underline"
                        >
                          Leggi la notizia →
                        </a>
                      ) : (
                        <a
                          href={c.link}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="mt-3 inline-block text-sm font-semibold text-racing-yellow hover:underline"
                        >
                          Leggi la notizia{c.fonte ? ` su ${c.fonte}` : ""} ↗
                        </a>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <h2 className={`${racingFont.className} mb-4 text-2xl text-racing-yellow`}>
          Ultime notizie
        </h2>

        {notizie.length === 0 ? (
          <p className="text-center text-white/60">
            Le notizie non sono disponibili in questo momento. Riprova tra poco.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notizie.map((n, i) => (
              <Fragment key={n.id}>
                <CardNotizia
                  notizia={n}
                  commento={commentiPerLink.get(pulisciLink(n.link))?.commento}
                />
                {(i + 1) % 9 === 0 && i + 1 < notizie.length && (
                  <Pubblicita
                    posizione="notizie-elenco"
                    className="md:col-span-2 lg:col-span-3"
                  />
                )}
              </Fragment>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-white/40">
          Fonti: {fonti.join(", ")}. Titoli e marchi appartengono ai rispettivi
          editori. Aggiornamento automatico ogni 30 minuti.
        </p>
      </div>
    </section>
  );
}
