import Link from "next/link";
import { racingFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";
import { Linguette } from "@/components/TabelleMotoGP";
import {
  linguetteClassiSBK,
  TabellaClassificaSBK,
  TabellaCostruttoriSBK,
  TabellaSessioneSBK,
  FonteDatiSBK,
} from "@/components/TabelleSBK";
import { bandiera, formattaPeriodo, giorniA } from "@/sanity/lib/motogp";
import {
  getCategorieSBK,
  scegliCategoriaSBK,
  getRounds,
  roundsCategoria,
  finito,
  getClassificaSBK,
  getCostruttoriSBK,
  getGareStagioneSBK,
  vittoriePodi,
  getStagioniSBK,
  nomeSessioneSBK,
  type StagioneSBK as Stagione,
} from "@/sanity/lib/sbk";

export default async function StagioneSBK({
  stagione,
  classe,
  base,
}: {
  stagione: Stagione;
  classe?: string;
  base: string;
}) {
  const categorie = await getCategorieSBK(stagione);
  const categoria = scegliCategoriaSBK(categorie, classe);

  if (!categoria) {
    return (
      <p className="text-center text-white/60">
        Dati non disponibili in questo momento. Riprova tra poco.
      </p>
    );
  }

  const [tuttiRound, classifica, costruttori, stagioni, gare] = await Promise.all([
    getRounds(stagione),
    getClassificaSBK(stagione, categoria),
    getCostruttoriSBK(stagione, categoria),
    getStagioniSBK(),
    getGareStagioneSBK(stagione, categoria),
  ]);

  const rounds = roundsCategoria(tuttiRound, categoria);
  const prossimo = rounds.find((r) => !finito(r));
  const ultimaGara = gare[gare.length - 1];
  const vittorie = gare.length > 0 ? vittoriePodi(gare) : undefined;

  const qClasse = categoria.id === categorie[0]?.id ? "" : `?classe=${categoria.slug}`;
  const nomeClasse = categoria.nome;

  return (
    <>
      <h1
        className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}
      >
        {nomeClasse} {stagione.anno}
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-center text-white/70">
        Classifica piloti e costruttori, calendario e risultati di ogni round del Mondiale {categoria.sigla}
        {stagione.current ? ", aggiornati automaticamente dopo ogni sessione." : "."}
      </p>

      {categorie.length > 1 && (
        <div className="mb-10 flex justify-center">
          <Linguette voci={linguetteClassiSBK(categorie, categoria, base)} />
        </div>
      )}

      {prossimo && stagione.current && (
        <div className="mb-10 rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5 text-center">
          <p className="text-xs uppercase tracking-widest text-white/50">Prossimo round</p>
          <p className={`${racingFont.className} mt-1 text-2xl text-white`}>
            {bandiera(prossimo.iso)} {prossimo.nome}
          </p>
          <p className="text-white/70">
            {prossimo.circuito} · {formattaPeriodo(prossimo.inizio, prossimo.fine)}
          </p>
          {giorniA(prossimo.inizio) > 0 && (
            <p className="mt-2 font-semibold text-racing-yellow">
              {giorniA(prossimo.inizio) === 1 ? "Si parte domani" : `Mancano ${giorniA(prossimo.inizio)} giorni`}
            </p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {giorniA(prossimo.inizio) <= 0 && (
              <Link
                href={`${base}/${prossimo.slug}${qClasse}`}
                className="inline-block rounded-md bg-racing-red px-5 py-2 text-sm font-semibold text-white transition hover:scale-105"
              >
                Risultati prove e Superpole →
              </Link>
            )}
            <Link
              href="/superbike/orari"
              className="inline-block rounded-md bg-racing-yellow px-5 py-2 text-sm font-semibold text-carbon-950 transition hover:scale-105"
            >
              Orari del weekend →
            </Link>
          </div>
        </div>
      )}

      {ultimaGara && stagione.current && (
        <div className="mb-12">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 className={`${racingFont.className} text-2xl text-racing-yellow`}>
              Ultima gara: {ultimaGara.round.nome} · {nomeSessioneSBK(ultimaGara.sessione)}
            </h2>
            <Link
              href={`${base}/${ultimaGara.round.slug}${qClasse}`}
              className="text-sm font-semibold text-racing-yellow hover:underline"
            >
              Tutte le sessioni →
            </Link>
          </div>
          <TabellaSessioneSBK righe={ultimaGara.righe.slice(0, 10)} gara />
        </div>
      )}

      <div className="mb-12">
        <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
          Classifica piloti {nomeClasse} {stagione.anno}
        </h2>
        {classifica.length > 0 ? (
          <TabellaClassificaSBK righe={classifica} vittorie={vittorie} />
        ) : (
          <p className="text-white/60">Classifica non disponibile.</p>
        )}
      </div>

      <Pubblicita posizione="motogp-classifica" className="mb-12" />

      {costruttori.length > 0 && (
        <div className="mb-12">
          <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
            Classifica costruttori {stagione.anno}
          </h2>
          <TabellaCostruttoriSBK righe={costruttori} />
        </div>
      )}

      {rounds.length > 0 && (
        <div className="mb-12">
          <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
            Calendario {stagione.anno}
          </h2>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rounds.map((r, i) => {
              const fatto = finito(r);
              const inCorso = r === prossimo && giorniA(r.inizio) <= 0;
              const contenuto = (
                <>
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Round {i + 1} · {formattaPeriodo(r.inizio, r.fine)}
                  </p>
                  <p className="font-semibold text-white">
                    {bandiera(r.iso)} {r.nome}
                  </p>
                  <p className="text-sm text-white/60">{r.circuito}</p>
                  <p className={`mt-1 text-xs font-semibold ${fatto || inCorso ? "text-racing-yellow" : "text-white/40"}`}>
                    {fatto ? "Risultati →" : inCorso ? "Weekend in corso: risultati prove →" : r === prossimo ? "Prossimo round" : "In programma"}
                  </p>
                </>
              );
              return (
                <li key={r.id}>
                  {fatto || inCorso ? (
                    <Link
                      href={`${base}/${r.slug}${qClasse}`}
                      className={`block h-full rounded-lg p-4 transition hover:bg-carbon-700 ${inCorso ? "border border-racing-yellow/50 bg-carbon-800" : "bg-carbon-800"}`}
                    >
                      {contenuto}
                    </Link>
                  ) : (
                    <div
                      className={`h-full rounded-lg p-4 ${r === prossimo ? "border border-racing-yellow/50 bg-carbon-800" : "bg-carbon-800/60"}`}
                    >
                      {contenuto}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <Link
        href="/superbike/statistiche"
        className="mb-12 block rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5 text-center transition hover:bg-carbon-800"
      >
        <span className={`${racingFont.className} text-2xl text-racing-yellow`}>
          Statistiche e record di tutti i tempi →
        </span>
        <span className="mt-1 block text-sm text-white/70">
          Titoli mondiali, vittorie, podi, albo d&apos;oro dal 1988, costruttori e nazioni
        </span>
      </Link>

      {stagioni.length > 0 && (
        <div>
          <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
            Archivio stagioni
          </h2>
          <div className="flex flex-wrap gap-2">
            {stagioni.map((s) => (
              <Link
                key={s.anno}
                href={s.current ? "/superbike" : `/superbike/${s.anno}`}
                className={`rounded border px-2.5 py-1 text-sm transition ${
                  s.anno === stagione.anno
                    ? "border-racing-yellow bg-racing-yellow font-semibold text-carbon-950"
                    : "border-white/20 text-white/80 hover:border-racing-yellow hover:text-racing-yellow"
                }`}
              >
                {s.anno}
              </Link>
            ))}
          </div>
        </div>
      )}

      <FonteDatiSBK />
    </>
  );
}
