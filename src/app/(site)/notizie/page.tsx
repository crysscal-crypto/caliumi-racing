import type { Metadata } from "next";
import { racingFont } from "@/sanity/lib/fonts";
import { Fragment } from "react";
import CardNotizia from "@/components/CardNotizia";
import Pubblicita from "@/components/Pubblicita";
import InstallaApp from "@/components/InstallaApp";
import CardRedazione from "@/components/CardRedazione";
import FontePreferitaGoogle from "@/components/FontePreferitaGoogle";
import { getUltimeRedazione } from "@/sanity/lib/redazione";
import {
  getNotizie,
  getCommenti,
  mappaCommenti,
  formattaData,
  pulisciLink,
  FEEDS,
  CATEGORIE,
} from "@/sanity/lib/notizie";
import Link from "next/link";

export const revalidate = 300;

type Props = { searchParams: Promise<{ categoria?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { categoria } = await searchParams;
  const cat = CATEGORIE.find((c) => c.slug === categoria);
  if (cat) {
    return {
      title: `Notizie ${cat.nome} di oggi | Caliumi Racing`,
      description: `${cat.descrizione} Aggiornate ogni 30 minuti dalle principali testate italiane.`,
      alternates: { canonical: `/notizie?categoria=${cat.slug}` },
    };
  }
  return {
    title: "Notizie MotoGP, Superbike e motori di oggi | Caliumi Racing",
    description:
      "Le ultime notizie di MotoGP, Superbike, Moto2, motocross, novità moto, Formula 1 e motori dalle principali testate italiane, aggiornate ogni 30 minuti.",
    alternates: { canonical: "/notizie", types: { "application/rss+xml": [{ url: "/feed.xml", title: "Caliumi Racing - Notizie" }] } },
  };
}

export default async function NotiziePage({ searchParams }: Props) {
  const { categoria } = await searchParams;
  const cat = CATEGORIE.find((c) => c.slug === categoria);
  const [notizie, commenti, nostre] = await Promise.all([
    getNotizie(cat ? 45 : 60, cat?.nome),
    getCommenti(),
    cat ? Promise.resolve([]) : getUltimeRedazione(7),
  ]);
  const fonti = Array.from(new Set(FEEDS.map((f) => f.fonte)));
  const commentiPerLink = mappaCommenti(commenti);
  const inEvidenza = cat ? [] : commenti.slice(0, 5);

  const slugPerLink = new Map<string, string>();
  notizie.forEach((n) => slugPerLink.set(pulisciLink(n.link), n.slug));

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          {cat ? `Notizie ${cat.nome}` : "Notizie"}
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-center text-white/70">
          {cat
            ? `${cat.descrizione} Aggiornate ogni 30 minuti.`
            : "Le ultime dal mondo delle corse e dei motori: MotoGP, Superbike, off-road, novità moto, Formula 1 e auto, raccolte dalle testate di settore e aggiornate ogni 30 minuti."}
        </p>

        {/* categorie */}
        <nav aria-label="Categorie notizie" className="mb-8 flex flex-wrap justify-center gap-2">
          {[{ slug: "", nome: "Tutte" }, ...CATEGORIE].map((c) => {
            const attiva = (cat?.slug ?? "") === c.slug;
            return (
              <Link
                key={c.slug || "tutte"}
                href={c.slug ? `/notizie?categoria=${c.slug}` : "/notizie"}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  attiva
                    ? "border-racing-yellow bg-racing-yellow text-carbon-950"
                    : "border-white/20 text-white/80 hover:border-racing-yellow hover:text-racing-yellow"
                }`}
              >
                {c.nome}
              </Link>
            );
          })}
        </nav>

        <FontePreferitaGoogle className="mx-auto mb-10 max-w-2xl" />

        {nostre.length > 0 && (
          <div className="mb-12">
            <h2 className={`${racingFont.className} mb-4 text-2xl text-racing-yellow`}>
              Le notizie di Caliumi Racing
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-2 lg:col-span-3">
                <CardRedazione notizia={nostre[0]} grande />
              </div>
              {nostre.slice(1).map((n) => (
                <CardRedazione key={n._id} notizia={n} />
              ))}
            </div>
          </div>
        )}

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
          {cat ? `Ultime notizie ${cat.nome}` : "Ultime notizie"}
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

      <InstallaApp />
    </section>
  );
}
