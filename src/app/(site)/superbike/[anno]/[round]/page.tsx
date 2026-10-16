import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { racingFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";
import { Linguette } from "@/components/TabelleMotoGP";
import { linguetteClassiSBK, TabellaSessioneSBK, FonteDatiSBK } from "@/components/TabelleSBK";
import { bandiera, formattaPeriodo } from "@/sanity/lib/motogp";
import {
  getStagioneSBK,
  getCategorieSBK,
  scegliCategoriaSBK,
  getRound,
  getRounds,
  roundsCategoria,
  finito,
  getSessioniRound,
  sessioniCategoria,
  getRisultatiSBK,
  eGara,
  nomeSessioneSBK,
  codiceSessioneSBK,
  nomeClasseSBK,
} from "@/sanity/lib/sbk";

export const revalidate = 600;

type Props = {
  params: Promise<{ anno: string; round: string }>;
  searchParams: Promise<{ classe?: string; sessione?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { anno, round: slug } = await params;
  const { classe } = await searchParams;
  const stagione = /^\d{4}$/.test(anno) ? await getStagioneSBK(Number(anno)) : undefined;
  const round = stagione ? await getRound(stagione, slug) : undefined;
  if (!round) return { title: "Round non trovato" };
  const nome = classe ? nomeClasseSBK(classe.toUpperCase()) : "Superbike";
  return {
    title: `${nome} ${round.nome} ${anno}: risultati Gara 1, Superpole Race e Gara 2 | Caliumi Racing`,
    description: `Risultati completi ${nome} del round di ${round.nome} ${anno} (${round.circuito}): gare, Superpole e prove libere con tempi, distacchi e giri veloci.`,
    alternates: { canonical: `/superbike/${anno}/${slug}${classe ? `?classe=${classe}` : ""}` },
  };
}

export default async function RoundSBKPage({ params, searchParams }: Props) {
  const { anno, round: slug } = await params;
  const { classe, sessione: codice } = await searchParams;
  if (!/^\d{4}$/.test(anno)) notFound();

  const stagione = await getStagioneSBK(Number(anno));
  if (!stagione) notFound();

  const [round, categorie, tuttiRound] = await Promise.all([
    getRound(stagione, slug),
    getCategorieSBK(stagione),
    getRounds(stagione),
  ]);
  if (!round) notFound();

  const presenti = categorie.filter((c) => round.categorie.length === 0 || round.categorie.includes(c.id));
  const categoria = scegliCategoriaSBK(presenti, classe);
  const sessioni = categoria ? sessioniCategoria(await getSessioniRound(stagione, round), categoria) : [];
  const finite = sessioni.filter((s) => s.stato === "FINISHED");

  const scelta =
    finite.find((s) => codiceSessioneSBK(s) === codice) ??
    [...finite].reverse().find((s) => eGara(s)) ??
    finite[finite.length - 1];

  const risultati = scelta && categoria ? await getRisultatiSBK(stagione, round, categoria.id, scelta) : [];
  const gara = scelta ? eGara(scelta) : false;

  const base = `/superbike/${anno}/${slug}`;
  const qClasse = categoria && categoria.id !== presenti[0]?.id ? `classe=${categoria.slug}` : "";
  const baseStagione = stagione.current ? "/superbike" : `/superbike/${anno}`;

  const elenco = categoria ? roundsCategoria(tuttiRound, categoria) : tuttiRound;
  const pos = elenco.findIndex((r) => r.id === round.id);
  const prec = pos > 0 ? elenco[pos - 1] : undefined;
  const succ = pos >= 0 && pos < elenco.length - 1 && finito(elenco[pos + 1]) ? elenco[pos + 1] : undefined;

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/superbike" className="hover:text-racing-yellow">Superbike</Link>
          {" / "}
          <Link href={baseStagione} className="hover:text-racing-yellow">{anno}</Link>
          {" / "}
          <span className="text-white/70">{round.nome}</span>
        </nav>

        <h1 className={`${racingFont.className} text-center text-3xl text-racing-yellow sm:text-4xl`}>
          {bandiera(round.iso)} Round di {round.nome} {anno}
        </h1>
        <p className="mb-8 mt-2 text-center text-white/70">
          {round.circuito} · {formattaPeriodo(round.inizio, round.fine)}
        </p>

        {categoria && presenti.length > 1 && (
          <div className="mb-4 flex justify-center">
            <Linguette voci={linguetteClassiSBK(presenti, categoria, base)} />
          </div>
        )}

        {finite.length > 0 && scelta && (
          <div className="mb-8 flex justify-center">
            <Linguette
              voci={finite.map((s) => {
                const q = [qClasse, `sessione=${codiceSessioneSBK(s)}`].filter(Boolean).join("&");
                return { href: `${base}?${q}`, label: nomeSessioneSBK(s), attiva: s.id === scelta.id };
              })}
            />
          </div>
        )}

        {scelta && risultati.length > 0 ? (
          <>
            <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
              {categoria?.nome} · {nomeSessioneSBK(scelta)}
            </h2>
            <TabellaSessioneSBK righe={risultati} gara={gara} />
          </>
        ) : (
          <p className="text-center text-white/60">
            Risultati non ancora disponibili per questo round.
          </p>
        )}

        <Pubblicita posizione="motogp-gp" className="mt-10" />

        <div className="mt-10 flex items-center justify-between gap-4 text-sm font-semibold">
          {prec ? (
            <Link href={`/superbike/${anno}/${prec.slug}${qClasse ? `?${qClasse}` : ""}`} className="text-racing-yellow hover:underline">
              ← {prec.nome}
            </Link>
          ) : (
            <span />
          )}
          <Link href={baseStagione} className="text-white/60 hover:text-racing-yellow">
            Classifica {anno}
          </Link>
          {succ ? (
            <Link href={`/superbike/${anno}/${succ.slug}${qClasse ? `?${qClasse}` : ""}`} className="text-racing-yellow hover:underline">
              {succ.nome} →
            </Link>
          ) : (
            <span />
          )}
        </div>

        <FonteDatiSBK />
      </div>
    </section>
  );
}
