import Link from "next/link";
import { racingFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";
import {
  Linguette,
  linguetteClassi,
  TabellaClassifica,
  TabellaSessione,
  FonteDati,
} from "@/components/TabelleMotoGP";
import {
  getCategorie,
  scegliCategoria,
  getEventi,
  getClassifica,
  getSessioni,
  getRisultatiSessione,
  getStagioni,
  nomeGP,
  slugEvento,
  bandiera,
  formattaPeriodo,
  giorniA,
  type Stagione,
} from "@/sanity/lib/motogp";

export default async function StagioneMotoGP({
  stagione,
  classe,
  base,
}: {
  stagione: Stagione;
  classe?: string;
  base: string;
}) {
  const categorie = await getCategorie(stagione);
  const categoria = scegliCategoria(categorie, classe);

  if (!categoria) {
    return (
      <p className="text-center text-white/60">
        Dati non disponibili in questo momento. Riprova tra poco.
      </p>
    );
  }

  const [eventi, classifica, stagioni] = await Promise.all([
    getEventi(stagione),
    getClassifica(stagione, categoria),
    getStagioni(),
  ]);

  const finiti = eventi.filter((e) => e.status === "FINISHED");
  const prossimo = eventi.find((e) => e.status !== "FINISHED");
  const ultimo = finiti[finiti.length - 1];

  let risultatiUltimo: Awaited<ReturnType<typeof getRisultatiSessione>> = [];
  if (ultimo && stagione.current) {
    const sessioni = await getSessioni(stagione, ultimo, categoria);
    const gara = [...sessioni].reverse().find((s) => s.type === "RAC" && s.status === "FINISHED");
    if (gara) risultatiUltimo = await getRisultatiSessione(stagione, gara);
  }

  const qClasse = categoria.id === categorie[0]?.id ? "" : `?classe=${categoria.slug}`;
  const nomeClasse = categoria.nome;

  return (
    <>
      <h1
        className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}
      >
        {nomeClasse} {stagione.year}
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-center text-white/70">
        Classifica piloti, calendario e risultati di ogni Gran Premio
        {stagione.current ? ", aggiornati automaticamente dopo ogni sessione." : "."}
      </p>

      <div className="mb-10 flex justify-center">
        <Linguette voci={linguetteClassi(categorie, categoria, base)} />
      </div>

      {prossimo && stagione.current && (
        <div className="mb-10 rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5 text-center">
          <p className="text-xs uppercase tracking-widest text-white/50">Prossimo Gran Premio</p>
          <p className={`${racingFont.className} mt-1 text-2xl text-white`}>
            {bandiera(prossimo.country?.iso)} {nomeGP(prossimo)}
          </p>
          <p className="text-white/70">
            {prossimo.circuit?.name} · {formattaPeriodo(prossimo.date_start, prossimo.date_end)}
          </p>
          {giorniA(prossimo.date_start) > 0 && (
            <p className="mt-2 font-semibold text-racing-yellow">
              {giorniA(prossimo.date_start) === 1
                ? "Si parte domani"
                : `Mancano ${giorniA(prossimo.date_start)} giorni`}
            </p>
          )}
          <Link
            href="/motogp/orari"
            className="mt-3 inline-block rounded-md bg-racing-yellow px-5 py-2 text-sm font-semibold text-carbon-950 transition hover:scale-105"
          >
            Orari e dove vederlo in TV →
          </Link>
        </div>
      )}

      {ultimo && risultatiUltimo.length > 0 && (
        <div className="mb-12">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 className={`${racingFont.className} text-2xl text-racing-yellow`}>
              Ultima gara: {nomeGP(ultimo)}
            </h2>
            <Link
              href={`${base}/${slugEvento(ultimo)}${qClasse}`}
              className="text-sm font-semibold text-racing-yellow hover:underline"
            >
              Tutte le sessioni →
            </Link>
          </div>
          <TabellaSessione righe={risultatiUltimo.slice(0, 10)} gara />
        </div>
      )}

      <div className="mb-12">
        <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
          Classifica piloti {nomeClasse} {stagione.year}
        </h2>
        {classifica.length > 0 ? (
          <TabellaClassifica righe={classifica} />
        ) : (
          <p className="text-white/60">Classifica non disponibile.</p>
        )}
      </div>

      <Pubblicita posizione="motogp-classifica" className="mb-12" />

      {eventi.length > 0 && (
        <div className="mb-12">
          <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
            Calendario {stagione.year}
          </h2>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eventi.map((e, i) => {
              const finito = e.status === "FINISHED";
              const contenuto = (
                <>
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Round {i + 1} · {formattaPeriodo(e.date_start, e.date_end)}
                  </p>
                  <p className="font-semibold text-white">
                    {bandiera(e.country?.iso)} {nomeGP(e)}
                  </p>
                  <p className="text-sm text-white/60">{e.circuit?.name}</p>
                  <p className={`mt-1 text-xs font-semibold ${finito ? "text-racing-yellow" : "text-white/40"}`}>
                    {finito ? "Risultati →" : e === prossimo ? "Prossima gara" : "In programma"}
                  </p>
                </>
              );
              return (
                <li key={e.id}>
                  {finito ? (
                    <Link
                      href={`${base}/${slugEvento(e)}${qClasse}`}
                      className="block h-full rounded-lg bg-carbon-800 p-4 transition hover:bg-carbon-700"
                    >
                      {contenuto}
                    </Link>
                  ) : (
                    <div
                      className={`h-full rounded-lg p-4 ${e === prossimo ? "border border-racing-yellow/50 bg-carbon-800" : "bg-carbon-800/60"}`}
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
        href="/motogp/statistiche"
        className="mb-12 block rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5 text-center transition hover:bg-carbon-800"
      >
        <span className={`${racingFont.className} text-2xl text-racing-yellow`}>
          Statistiche e record di tutti i tempi →
        </span>
        <span className="mt-1 block text-sm text-white/70">
          Titoli mondiali, vittorie, podi, albo d&apos;oro dal 1949, costruttori e nazioni
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
                key={s.id}
                href={s.current ? "/motogp" : `/motogp/${s.year}`}
                className={`rounded border px-2.5 py-1 text-sm transition ${
                  s.year === stagione.year
                    ? "border-racing-yellow bg-racing-yellow font-semibold text-carbon-950"
                    : "border-white/20 text-white/80 hover:border-racing-yellow hover:text-racing-yellow"
                }`}
              >
                {s.year}
              </Link>
            ))}
          </div>
        </div>
      )}

      <FonteDati />
    </>
  );
}
