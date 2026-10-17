import Link from "next/link";
import { racingFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";
import { Linguette } from "@/components/TabelleMotoGP";
import {
  stagioniCIV,
  scegliClasseCIV,
  gareEvento,
  nomeGaraCIV,
  bandieraCIV,
  dateEvento,
  aggiornatoCIV,
  type StagioneCIV,
  type ClasseCIV,
  type RigaGaraCIV,
} from "@/sanity/lib/civ";

const th = "px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white/50";
const td = "px-2 py-2";

export function linguetteClassiCIV(s: StagioneCIV, attiva: ClasseCIV, base: string, extra = "") {
  return s.classi.map((c, i) => ({
    href: i === 0 ? `${base}${extra ? `?${extra}` : ""}` : `${base}?classe=${c.slug}${extra ? `&${extra}` : ""}`,
    label: c.nome,
    attiva: c.slug === attiva.slug,
  }));
}

export function TabellaGaraCIV({ righe }: { righe: RigaGaraCIV[] }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-carbon-800">
      <table className="w-full min-w-[480px] text-sm text-white">
        <thead className="border-b border-white/10">
          <tr>
            <th className={th}>Pos.</th>
            <th className={th}>Pilota</th>
            <th className={`${th} text-center`}>Giri</th>
            <th className={`${th} text-right`}>Tempo / Distacco</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => {
            const fuori = !/^\d+$/.test(r.pos);
            return (
              <tr key={`${r.num}-${i}`} className={`border-b border-white/5 ${fuori ? "text-white/40" : ""}`}>
                <td className={`${td} font-bold ${r.pos === "1" ? "text-racing-yellow" : ""}`}>
                  {r.pos === "RET" ? "Rit." : r.pos === "EX" ? "Esc." : r.pos}
                </td>
                <td className={td}>
                  <span className="font-semibold">{r.pilota}</span>
                  {r.num ? <span className="ml-1 text-white/40">#{r.num}</span> : null}
                  {r.team ? <span className="block text-xs text-white/50">{r.team}</span> : null}
                </td>
                <td className={`${td} text-center`}>{r.giri}</td>
                <td className={`${td} text-right font-mono`}>{r.tempo || (fuori ? "" : "-")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FonteDatiCIV() {
  const agg = aggiornatoCIV();
  return (
    <p className="mt-10 text-center text-xs text-white/40">
      Dati: cronometraggio ufficiale CIV (Perugia Timing)
      {agg ? `, aggiornati al ${new Date(agg).toLocaleDateString("it-IT")}` : ""}. Caliumi Racing non è affiliato a FMI o al CIV.
    </p>
  );
}

export default function StagioneCIVView({
  stagione,
  classe,
  base,
}: {
  stagione: StagioneCIV;
  classe?: string;
  base: string;
}) {
  const c = scegliClasseCIV(stagione, classe);
  const stagioni = stagioniCIV();

  if (!c) {
    return <p className="text-center text-white/60">Risultati in arrivo.</p>;
  }

  const qClasse = c.slug === stagione.classi[0]?.slug ? "" : `?classe=${c.slug}`;
  const ultimaGara = c.gare[c.gare.length - 1];
  const eventoUltima = ultimaGara ? stagione.eventi.find((e) => e.id === ultimaGara.evento) : undefined;
  const dopo = c.dopo ? stagione.eventi.find((e) => e.id === c.dopo) : undefined;

  return (
    <>
      <h1 className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}>
        CIV {c.nome} {stagione.anno}
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-center text-white/70">
        Classifica di campionato, calendario e risultati di ogni gara del Campionato Italiano Velocità {stagione.anno}.
      </p>

      {stagione.classi.length > 1 && (
        <div className="mb-10 flex justify-center">
          <Linguette voci={linguetteClassiCIV(stagione, c, base)} />
        </div>
      )}

      {ultimaGara && eventoUltima && (
        <div className="mb-12">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 className={`${racingFont.className} text-2xl text-racing-yellow`}>
              Ultima gara: {eventoUltima.circuito} · {nomeGaraCIV(ultimaGara.sessione)}
            </h2>
            <Link
              href={`${base}/${eventoUltima.slug}${qClasse}`}
              className="text-sm font-semibold text-racing-yellow hover:underline"
            >
              Tutte le gare del round →
            </Link>
          </div>
          <TabellaGaraCIV righe={ultimaGara.righe.slice(0, 10)} />
        </div>
      )}

      <div className="mb-12">
        <h2 className={`${racingFont.className} mb-1 text-2xl text-racing-yellow`}>
          Classifica {c.nome} {stagione.anno}
        </h2>
        {dopo && <p className="mb-3 text-sm text-white/50">Dopo il round {dopo.round} di {dopo.circuito}</p>}
        {c.classifica.length > 0 ? (
          <div className="overflow-x-auto rounded-lg bg-carbon-800">
            <table className="w-full text-sm text-white">
              <thead className="border-b border-white/10">
                <tr>
                  <th className={th}>Pos.</th>
                  <th className={th}>Pilota</th>
                  <th className={`${th} text-right`}>Punti</th>
                </tr>
              </thead>
              <tbody>
                {c.classifica.map((r, i) => (
                  <tr key={`${r.pos}-${r.cognome}`} className={`border-b border-white/5 ${i < 3 ? "bg-white/[0.03]" : ""}`}>
                    <td className={`${td} font-bold ${i === 0 ? "text-racing-yellow" : ""}`}>{r.pos}</td>
                    <td className={td}>
                      <span className="mr-1">{bandieraCIV(r.naz)}</span>
                      <span className="font-semibold">{r.cognome}</span> {r.nome}
                    </td>
                    <td className={`${td} text-right font-bold text-racing-yellow`}>{r.punti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-white/60">Classifica non disponibile.</p>
        )}
      </div>

      <Pubblicita posizione="motogp-classifica" className="mb-12" />

      <div className="mb-12">
        <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>Calendario {stagione.anno}</h2>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stagione.eventi.map((e) => {
            const conGare = gareEvento(c, e).length > 0;
            const contenuto = (
              <>
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Round {e.round} · {dateEvento(e)}
                </p>
                <p className="font-semibold text-white">🇮🇹 {e.circuito}</p>
                <p className={`mt-1 text-xs font-semibold ${conGare ? "text-racing-yellow" : "text-white/40"}`}>
                  {conGare ? "Risultati →" : "Risultati non disponibili"}
                </p>
              </>
            );
            return (
              <li key={e.id}>
                {conGare ? (
                  <Link href={`${base}/${e.slug}${qClasse}`} className="block h-full rounded-lg bg-carbon-800 p-4 transition hover:bg-carbon-700">
                    {contenuto}
                  </Link>
                ) : (
                  <div className="h-full rounded-lg bg-carbon-800/60 p-4">{contenuto}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {stagioni.length > 1 && (
        <div>
          <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>Archivio stagioni</h2>
          <div className="flex flex-wrap gap-2">
            {stagioni.map((s, i) => (
              <Link
                key={s.anno}
                href={i === 0 ? "/civ" : `/civ/${s.anno}`}
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

      <FonteDatiCIV />
    </>
  );
}
