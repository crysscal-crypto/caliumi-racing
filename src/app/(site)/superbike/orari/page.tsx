import type { Metadata } from "next";
import Link from "next/link";
import { racingFont } from "@/sanity/lib/fonts";
import { client } from "@/sanity/lib/client";
import Pubblicita from "@/components/Pubblicita";
import { FonteDatiSBK } from "@/components/TabelleSBK";
import { oraItaliana, giornoItaliano } from "@/sanity/lib/orari";
import { bandiera, formattaPeriodo, giorniA } from "@/sanity/lib/motogp";
import {
  getStagioneSBK,
  getCategorieSBK,
  getRounds,
  finito,
  getSessioniRound,
  sessioniCategoria,
  nomeSessioneSBK,
  codiceSessioneSBK,
  eGara,
  type RoundSBK,
} from "@/sanity/lib/sbk";

export const revalidate = 600;

type Voce = { id: string; classe: string; slug: string; principale: boolean; sessione: string; codice: string; gara: boolean; quando: string; stato: string };

async function getOrariSBK(): Promise<{ round: RoundSBK; voci: Voce[]; anno: number } | null> {
  const stagione = await getStagioneSBK();
  if (!stagione) return null;
  const rounds = await getRounds(stagione);
  const round = rounds.find((r) => !finito(r)) ?? rounds[rounds.length - 1];
  if (!round) return null;

  const [categorie, sessioni] = await Promise.all([getCategorieSBK(stagione), getSessioniRound(stagione, round)]);
  const voci: Voce[] = categorie.flatMap((c, i) =>
    sessioniCategoria(sessioni, c)
      .filter((s) => s.inizio)
      .map((s) => ({
        id: s.id,
        classe: c.nome,
        slug: i === 0 ? "" : c.slug,
        principale: c.id === "SBK",
        sessione: nomeSessioneSBK(s),
        codice: codiceSessioneSBK(s),
        gara: eGara(s),
        quando: s.inizio as string,
        stato: s.stato,
      }))
  );
  voci.sort((a, b) => a.quando.localeCompare(b.quando));
  return { round, voci, anno: stagione.anno };
}

async function getNotaTv(anno: number, sigla: string): Promise<string | null> {
  try {
    return await client.fetch(
      `*[_type == "notaTv" && anno == $anno && upper(gp) == $gp][0].testo`,
      { anno, gp: `SBK-${sigla.toUpperCase()}` }
    );
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const dati = await getOrariSBK();
  if (!dati) return { title: "Orari Superbike in TV | Caliumi Racing" };
  return {
    title: `Orari Superbike ${dati.round.nome} ${dati.anno}: Superpole, Gara 1, Superpole Race e Gara 2 | Caliumi Racing`,
    description: `Orari in ora italiana del round di ${dati.round.nome} ${dati.anno} del Mondiale Superbike: prove libere, Superpole e gare di WorldSBK, WorldSSP e delle altre classi.`,
    alternates: { canonical: "/superbike/orari" },
  };
}

export default async function OrariSBKPage() {
  const dati = await getOrariSBK();

  if (!dati || dati.voci.length === 0) {
    return (
      <section className="carbon-bg">
        <div className="content-panel mx-auto max-w-5xl px-4 py-16 text-center text-white/60 sm:px-6">
          Orari non ancora disponibili. Riprova tra poco.
        </div>
      </section>
    );
  }

  const { round, voci, anno } = dati;
  const nota = await getNotaTv(anno, round.sigla);
  const giorni = giorniA(round.inizio);

  const perGiorno = new Map<string, Voce[]>();
  for (const v of voci) {
    const g = giornoItaliano(new Date(v.quando));
    perGiorno.set(g, [...(perGiorno.get(g) ?? []), v]);
  }

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/superbike" className="hover:text-racing-yellow">Superbike</Link>
          {" / "}
          <span className="text-white/70">Orari</span>
        </nav>

        <h1 className={`${racingFont.className} text-center text-3xl text-racing-yellow sm:text-4xl`}>
          Orari {bandiera(round.iso)} {round.nome} {anno}
        </h1>
        <p className="mt-2 text-center text-white/70">
          {round.circuito} · {formattaPeriodo(round.inizio, round.fine)}
        </p>
        {giorni > 0 && (
          <p className="mt-2 text-center font-semibold text-racing-yellow">
            {giorni === 1 ? "Si parte domani" : `Mancano ${giorni} giorni`}
          </p>
        )}
        <p className="mx-auto mb-8 mt-4 max-w-2xl text-center text-sm text-white/60">
          Tutti gli orari sono in <strong>ora italiana</strong>. In evidenza le gare della Superbike.
        </p>

        <div className="mb-10 rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5">
          <h2 className="mb-1 font-semibold text-racing-yellow">Dove vederla in TV</h2>
          <p className="whitespace-pre-line text-white/85">
            {nota ??
              "Il Mondiale Superbike è trasmesso in diretta su Sky Sport e NOW, con le gare anche in chiaro su TV8. Controlla la guida TV per dirette e differite."}
          </p>
        </div>

        <div className="space-y-8">
          {[...perGiorno.entries()].map(([giorno, elenco]) => (
            <div key={giorno}>
              <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>{giorno}</h2>
              <div className="overflow-hidden rounded-lg bg-carbon-800">
                <table className="w-full text-sm text-white">
                  <tbody>
                    {elenco.map((v) => {
                      const finita = v.stato === "FINISHED";
                      const q = [v.slug && `classe=${v.slug}`, `sessione=${v.codice}`].filter(Boolean).join("&");
                      return (
                        <tr
                          key={v.id}
                          className={`border-b border-white/5 ${v.principale && v.gara ? "bg-racing-red/15" : ""} ${finita ? "text-white/45" : ""}`}
                        >
                          <td className="w-16 px-3 py-2.5 font-mono text-base font-bold text-racing-yellow">
                            {oraItaliana(new Date(v.quando))}
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="font-semibold">{v.classe}</span>{" "}
                            <span className="text-white/70">· {v.sessione}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs">
                            {finita ? (
                              <Link
                                href={`/superbike/${anno}/${round.slug}?${q}`}
                                className="font-semibold text-racing-yellow hover:underline"
                              >
                                Risultati →
                              </Link>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <Pubblicita posizione="motogp-gp" className="mt-10" />

        <p className="mt-8 text-center text-xs text-white/40">
          Orari ufficiali del calendario WorldSBK, convertiti in ora italiana. Possono cambiare:
          ricontrolla il giorno della gara.
        </p>
        <FonteDatiSBK />
      </div>
    </section>
  );
}
