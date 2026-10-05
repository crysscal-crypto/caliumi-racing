import type { Metadata } from "next";
import Link from "next/link";
import { racingFont } from "@/sanity/lib/fonts";
import { client } from "@/sanity/lib/client";
import Pubblicita from "@/components/Pubblicita";
import { FonteDati } from "@/components/TabelleMotoGP";
import { getOrariGP, oraItaliana, giornoItaliano } from "@/sanity/lib/orari";
import { nomeGP, bandiera, formattaPeriodo, slugEvento, giorniA } from "@/sanity/lib/motogp";

export const revalidate = 600;

async function getNotaTv(anno: number, gp: string): Promise<string | null> {
  try {
    return await client.fetch(
      `*[_type == "notaTv" && anno == $anno && upper(gp) == $gp][0].testo`,
      { anno, gp: gp.toUpperCase() }
    );
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const dati = await getOrariGP();
  if (!dati) return { title: "Orari MotoGP in TV | Caliumi Racing" };
  const nome = nomeGP(dati.evento);
  return {
    title: `Orari MotoGP ${nome} ${dati.anno}: TV8, Sky e NOW, Sprint e gara | Caliumi Racing`,
    description: `Orari in ora italiana del ${nome} ${dati.anno}: prove, qualifiche, Sprint e gara di MotoGP, Moto2 e Moto3, con i canali Sky Sport MotoGP, NOW e TV8.`,
    alternates: { canonical: "/motogp/orari" },
  };
}

export default async function OrariPage() {
  const dati = await getOrariGP();

  if (!dati || dati.voci.length === 0) {
    return (
      <section className="carbon-bg">
        <div className="content-panel mx-auto max-w-5xl px-4 py-16 text-center text-white/60 sm:px-6">
          Orari non ancora disponibili. Riprova tra poco.
        </div>
      </section>
    );
  }

  const { evento, voci, anno } = dati;
  const nota = await getNotaTv(anno, evento.short_name);
  const giorni = giorniA(evento.date_start);

  const perGiorno = new Map<string, typeof voci>();
  for (const v of voci) {
    const g = giornoItaliano(new Date(v.quando));
    perGiorno.set(g, [...(perGiorno.get(g) ?? []), v]);
  }

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/motogp" className="hover:text-racing-yellow">MotoGP</Link>
          {" / "}
          <span className="text-white/70">Orari TV</span>
        </nav>

        <h1 className={`${racingFont.className} text-center text-3xl text-racing-yellow sm:text-4xl`}>
          Orari {bandiera(evento.country?.iso)} {nomeGP(evento)} {anno}
        </h1>
        <p className="mt-2 text-center text-white/70">
          {evento.circuit?.name} · {formattaPeriodo(evento.date_start, evento.date_end)}
        </p>
        {giorni > 0 && (
          <p className="mt-2 text-center font-semibold text-racing-yellow">
            {giorni === 1 ? "Si parte domani" : `Mancano ${giorni} giorni`}
          </p>
        )}
        <p className="mx-auto mb-8 mt-4 max-w-2xl text-center text-sm text-white/60">
          Tutti gli orari sono in <strong>ora italiana</strong>. Sky Sport MotoGP e NOW trasmettono
          tutte le sessioni in diretta. TV8 trasmette in chiaro qualifiche, Sprint e gare.
        </p>

        <div className="mb-10 rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5">
          <h2 className="mb-1 font-semibold text-racing-yellow">In chiaro su TV8</h2>
          <p className="whitespace-pre-line text-white/85">
            {nota ??
              "Qualifiche, Sprint e gare sono trasmesse anche in chiaro su TV8, in diretta o in differita a seconda del Gran Premio."}
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
                      const motogp = v.classe.startsWith("MotoGP");
                      const finita = v.stato === "FINISHED";
                      return (
                        <tr
                          key={v.id}
                          className={`border-b border-white/5 ${motogp && ["SPR", "RAC"].includes(v.tipo) ? "bg-racing-red/15" : ""} ${finita ? "text-white/45" : ""}`}
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
                                href={`/motogp/${anno}/${slugEvento(evento)}`}
                                className="font-semibold text-racing-yellow hover:underline"
                              >
                                Risultati →
                              </Link>
                            ) : (
                              <span className="text-white/60">
                                Sky · NOW{v.tv8 ? <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white">TV8</span> : null}
                              </span>
                            )}
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
          Orari ufficiali del calendario MotoGP, convertiti in ora italiana. Possono cambiare:
          ricontrolla il giorno della gara.
        </p>
        <FonteDati />
      </div>
    </section>
  );
}
