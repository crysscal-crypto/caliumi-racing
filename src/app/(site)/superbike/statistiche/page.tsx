import type { Metadata } from "next";
import Link from "next/link";
import { racingFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";
import { Linguette } from "@/components/TabelleMotoGP";
import { FonteDatiSBK } from "@/components/TabelleSBK";
import { bandiera } from "@/sanity/lib/motogp";
import {
  getStatisticheSBK,
  unisciClassiSBK,
  elencoPilotiSBK,
  serieTitoliSBK,
  slugClasseSBK,
  nomeClasseStatSBK,
  type PilotaStatSBK,
} from "@/sanity/lib/statistiche-sbk";
import { nomeClasseSBK } from "@/sanity/lib/sbk";

export const revalidate = 3600;

type Props = { searchParams: Promise<{ classe?: string }> };

const nomiPaesi = new Intl.DisplayNames(["it"], { type: "region" });
function paese(iso: string): string {
  try {
    return nomiPaesi.of(iso) ?? iso;
  } catch {
    return iso;
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { classe } = await searchParams;
  const nome =
    classe === "tutte" ? "Mondiale Superbike (tutte le classi)" : classe ? nomeClasseSBK(classe.toUpperCase()) : "Superbike";
  return {
    title: `Statistiche ${nome}: titoli mondiali, vittorie e record di tutti i tempi | Caliumi Racing`,
    description: `Albo d'oro ${nome} dal 1988, piloti con più titoli, più vittorie e podi, record di stagione, titoli e vittorie per costruttore e per nazione. Aggiornate dopo ogni gara.`,
    alternates: { canonical: classe ? `/superbike/statistiche?classe=${classe}` : "/superbike/statistiche" },
  };
}

const th = "px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white/50";
const td = "px-2 py-1.5";

function Classifica({
  titolo,
  righe,
  colonna,
}: {
  titolo: string;
  righe: { nome: string; iso?: string; valore: number; nota?: string }[];
  colonna: string;
}) {
  if (righe.length === 0) return null;
  return (
    <div className="rounded-lg bg-carbon-800 p-4">
      <h3 className="mb-2 font-semibold text-racing-yellow">{titolo}</h3>
      <table className="w-full text-sm text-white">
        <thead className="border-b border-white/10">
          <tr>
            <th className={th}>#</th>
            <th className={th}>Nome</th>
            <th className={`${th} text-right`}>{colonna}</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => (
            <tr key={`${r.nome}-${i}`} className="border-b border-white/5">
              <td className={`${td} text-white/50`}>{i + 1}</td>
              <td className={td}>
                {r.iso ? <span className="mr-1">{bandiera(r.iso)}</span> : null}
                {r.nome}
                {r.nota ? <span className="block text-xs text-white/40">{r.nota}</span> : null}
              </td>
              <td className={`${td} text-right font-bold text-racing-yellow`}>{r.valore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Numero({ valore, testo }: { valore: string | number; testo: string }) {
  return (
    <div className="rounded-lg bg-carbon-800 p-4 text-center">
      <p className={`${racingFont.className} text-3xl text-racing-yellow`}>{valore}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/60">{testo}</p>
    </div>
  );
}

const periodo = (p: PilotaStatSBK) => (p.a[0] === p.a[1] ? `${p.a[0]}` : `${p.a[0]}–${p.a[1]}`);

export default async function StatisticheSBKPage({ searchParams }: Props) {
  const { classe } = await searchParams;
  const { classi, aggiornato, annoCorrente } = await getStatisticheSBK();

  if (classi.length === 0) {
    return (
      <section className="carbon-bg">
        <div className="content-panel mx-auto max-w-6xl px-4 py-16 text-center text-white/60 sm:px-6">
          Statistiche in preparazione.
        </div>
      </section>
    );
  }

  const tutte = classe === "tutte";
  const c = tutte ? unisciClassiSBK(classi) : classi.find((x) => slugClasseSBK(x) === classe) ?? classi[0];
  const nome = nomeClasseStatSBK(c);
  const piloti = elencoPilotiSBK(c);

  const perTitoli = piloti.filter((p) => p.t.length > 0).sort((a, b) => b.t.length - a.t.length || b.v - a.v).slice(0, 15);
  const perVittorie = [...piloti].sort((a, b) => b.v - a.v || b.p - a.p).filter((p) => p.v > 0).slice(0, 25);
  const perPodi = [...piloti].sort((a, b) => b.p - a.p || b.v - a.v).filter((p) => p.p > 0).slice(0, 15);
  const perGare = [...piloti].sort((a, b) => b.g - a.g).slice(0, 15);
  const italiani = piloti.filter((p) => p.i === "IT" && p.v > 0).sort((a, b) => b.v - a.v || b.p - a.p).slice(0, 15);
  const costruttori = Object.entries(c.costruttori).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const titoliCostruttori = Object.entries(c.titoliCostruttori).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const nazioni = Object.entries(c.nazioni).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const recordStagione = [...c.recordStagione].sort((a, b) => b.v - a.v || b.v / b.gare - a.v / a.gare).slice(0, 10);
  const vincitori = piloti.filter((p) => p.v > 0).length;
  const serie = tutte ? null : serieTitoliSBK(c);
  const vittorieItalia = c.nazioni["IT"] ?? 0;
  const posItalia = Object.entries(c.nazioni).sort((a, b) => b[1] - a[1]).findIndex(([k]) => k === "IT") + 1;
  const campioniPerAnno = [...c.campioni].sort((a, b) => b.anno - a.anno);

  const linguette = [
    ...classi.map((x, i) => ({
      href: i === 0 ? "/superbike/statistiche" : `/superbike/statistiche?classe=${slugClasseSBK(x)}`,
      label: nomeClasseStatSBK(x),
      attiva: !tutte && x.id === c.id,
    })),
    { href: "/superbike/statistiche?classe=tutte", label: "Tutte le classi", attiva: tutte },
  ];

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/superbike" className="hover:text-racing-yellow">Superbike</Link>
          {" / "}
          <span className="text-white/70">Statistiche</span>
        </nav>

        <h1 className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}>
          Statistiche {nome}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-center text-white/70">
          Titoli mondiali, vittorie, podi e record dal {c.primaGara?.anno ?? 1988} a oggi
          {annoCorrente ? `, stagione ${annoCorrente} compresa e aggiornata dopo ogni gara` : ""}.
        </p>

        <div className="mb-10 flex justify-center">
          <Linguette voci={linguette} />
        </div>

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Numero valore={c.gare} testo="Gare disputate" />
          <Numero valore={vincitori} testo="Vincitori diversi" />
          <Numero valore={c.campioni.length} testo="Titoli assegnati" />
          <Numero valore={vittorieItalia} testo="Vittorie italiane" />
        </div>

        <div className="mb-10 rounded-lg border border-racing-yellow/30 bg-carbon-900 p-5">
          <h2 className={`${racingFont.className} mb-3 text-xl text-racing-yellow`}>Lo sapevi?</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-white/85">
            {c.primaGara && (
              <li>
                La prima gara in archivio è quella di {c.primaGara.round} nel {c.primaGara.anno}
                {c.primaGara.circuito ? ` (${c.primaGara.circuito})` : ""}.
              </li>
            )}
            {perVittorie[0] && (
              <li>
                Il pilota con più vittorie è {perVittorie[0].n} con {perVittorie[0].v} successi su {perVittorie[0].g} gare
                ({Math.round((perVittorie[0].v / perVittorie[0].g) * 100)}%).
              </li>
            )}
            {perTitoli[0] && (
              <li>
                Il più titolato è {perTitoli[0].n}: {perTitoli[0].t.length} mondiali ({[...perTitoli[0].t].sort().join(", ")}).
              </li>
            )}
            {serie && serie.quanti > 1 && (
              <li>
                La serie più lunga di titoli consecutivi è di {serie.n}: {serie.quanti} di fila dal {serie.da} al {serie.a}.
              </li>
            )}
            {recordStagione[0] && (
              <li>
                Record di vittorie in una stagione: {recordStagione[0].n} con {recordStagione[0].v} successi su {recordStagione[0].gare} gare nel {recordStagione[0].anno}.
              </li>
            )}
            {vittorieItalia > 0 && (
              <li>
                L&apos;Italia ha vinto {vittorieItalia} gare{posItalia > 0 ? ` ed è ${posItalia}ª tra le nazioni` : ""}.
              </li>
            )}
            {titoliCostruttori[0] && (
              <li>
                Il costruttore con più titoli mondiali è {titoliCostruttori[0][0]} con {titoliCostruttori[0][1]} titoli costruttori.
              </li>
            )}
            {costruttori[0] && (
              <li>
                Il costruttore più vincente è {costruttori[0][0]} con {costruttori[0][1]} vittorie.
              </li>
            )}
          </ul>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Classifica
            titolo="Più titoli mondiali"
            colonna="Titoli"
            righe={perTitoli.map((p) => ({ nome: p.n, iso: p.i, valore: p.t.length, nota: [...p.t].sort().join(", ") }))}
          />
          <Classifica
            titolo="Più vittorie"
            colonna="Vittorie"
            righe={perVittorie.map((p) => ({ nome: p.n, iso: p.i, valore: p.v, nota: `${p.g} gare · ${periodo(p)}` }))}
          />
        </div>

        <Pubblicita posizione="motogp-classifica" className="mb-10" />

        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Classifica
            titolo="Più podi"
            colonna="Podi"
            righe={perPodi.map((p) => ({ nome: p.n, iso: p.i, valore: p.p, nota: periodo(p) }))}
          />
          <Classifica
            titolo="Più gare disputate"
            colonna="Gare"
            righe={perGare.map((p) => ({ nome: p.n, iso: p.i, valore: p.g, nota: periodo(p) }))}
          />
          <Classifica
            titolo="I piloti italiani più vincenti"
            colonna="Vittorie"
            righe={italiani.map((p) => ({ nome: p.n, iso: p.i, valore: p.v, nota: `${p.p} podi${p.t.length ? ` · ${p.t.length} titoli` : ""}` }))}
          />
          <Classifica
            titolo="Record di vittorie in una stagione"
            colonna="Vittorie"
            righe={recordStagione.map((r) => ({ nome: r.n, iso: r.i, valore: r.v, nota: `${r.anno} · su ${r.gare} gare` }))}
          />
          <Classifica
            titolo="Titoli mondiali costruttori"
            colonna="Titoli"
            righe={titoliCostruttori.map(([n, v]) => ({ nome: n, valore: v }))}
          />
          <Classifica
            titolo="Vittorie per costruttore"
            colonna="Vittorie"
            righe={costruttori.map(([n, v]) => ({ nome: n, valore: v }))}
          />
          <Classifica
            titolo="Vittorie per nazione"
            colonna="Vittorie"
            righe={nazioni.map(([iso, v]) => ({ nome: paese(iso), iso, valore: v }))}
          />
        </div>

        {campioniPerAnno.length > 0 && (
          <div className="mb-10">
            <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
              Albo d&apos;oro {tutte ? "Mondiale Superbike" : nome}
            </h2>
            <div className="overflow-x-auto rounded-lg bg-carbon-800">
              <table className="w-full min-w-[480px] text-sm text-white">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className={th}>Anno</th>
                    {tutte && <th className={th}>Classe</th>}
                    <th className={th}>Campione</th>
                    <th className={`${th} hidden sm:table-cell`}>Team</th>
                    <th className={`${th} text-right`}>Punti</th>
                  </tr>
                </thead>
                <tbody>
                  {campioniPerAnno.map((x) => (
                    <tr key={`${x.anno}-${x.cl}`} className="border-b border-white/5">
                      <td className={td}>
                        <Link href={x.anno === annoCorrente ? "/superbike" : `/superbike/${x.anno}`} className="font-semibold text-racing-yellow hover:underline">
                          {x.anno}
                        </Link>
                      </td>
                      {tutte && <td className={`${td} text-white/70`}>{x.cl}</td>}
                      <td className={td}>
                        <span className="mr-1">{bandiera(x.i)}</span>
                        {x.n}
                      </td>
                      <td className={`${td} hidden text-white/70 sm:table-cell`}>{x.c}</td>
                      <td className={`${td} text-right`}>{x.pt ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-white/40">
          Vittorie e podi contano tutte le gare, Superpole Race compresa. Le vittorie per costruttore sono ricavate dal nome del team.
          {aggiornato ? ` Archivio storico aggiornato al ${new Date(aggiornato).toLocaleDateString("it-IT")}.` : ""}
        </p>
        <FonteDatiSBK />
      </div>
    </section>
  );
}
