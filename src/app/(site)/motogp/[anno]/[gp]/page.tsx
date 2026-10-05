import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { racingFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";
import {
  Linguette,
  linguetteClassi,
  TabellaSessione,
  FonteDati,
} from "@/components/TabelleMotoGP";
import {
  getStagione,
  getCategorie,
  scegliCategoria,
  getEvento,
  getEventi,
  getSessioni,
  getRisultatiSessione,
  nomeGP,
  nomeSessione,
  codiceSessione,
  slugEvento,
  bandiera,
  formattaPeriodo,
} from "@/sanity/lib/motogp";

export const revalidate = 600;

type Props = {
  params: Promise<{ anno: string; gp: string }>;
  searchParams: Promise<{ classe?: string; sessione?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { anno, gp } = await params;
  const { classe } = await searchParams;
  const stagione = /^\d{4}$/.test(anno) ? await getStagione(Number(anno)) : undefined;
  const evento = stagione ? await getEvento(stagione, gp) : undefined;
  if (!evento) return { title: "Gran Premio non trovato" };
  const nome = classe ? classe.toUpperCase().replace("MOTO", "Moto") : "MotoGP";
  return {
    title: `${nomeGP(evento)} ${anno} ${nome}: risultati gara, qualifiche e prove | Caliumi Racing`,
    description: `Risultati completi ${nome} del ${nomeGP(evento)} ${anno} al ${evento.circuit?.name ?? ""}: gara, Sprint, qualifiche e prove libere con tempi e distacchi.`,
    alternates: { canonical: `/motogp/${anno}/${gp}${classe ? `?classe=${classe}` : ""}` },
  };
}

export default async function GPPage({ params, searchParams }: Props) {
  const { anno, gp } = await params;
  const { classe, sessione: codice } = await searchParams;
  if (!/^\d{4}$/.test(anno)) notFound();

  const stagione = await getStagione(Number(anno));
  if (!stagione) notFound();

  const [evento, categorie, eventi] = await Promise.all([
    getEvento(stagione, gp),
    getCategorie(stagione),
    getEventi(stagione),
  ]);
  if (!evento) notFound();

  const categoria = scegliCategoria(categorie, classe);
  const sessioni = categoria ? await getSessioni(stagione, evento, categoria) : [];
  const finite = sessioni.filter((s) => s.status === "FINISHED");

  const scelta =
    finite.find((s) => codiceSessione(s) === codice) ??
    [...finite].reverse().find((s) => s.type === "RAC") ??
    finite[finite.length - 1];

  const risultati = scelta ? await getRisultatiSessione(stagione, scelta) : [];
  const gara = scelta ? ["RAC", "SPR"].includes(scelta.type) : false;

  const base = `/motogp/${anno}/${gp}`;
  const qClasse = categoria && categoria.id !== categorie[0]?.id ? `classe=${categoria.slug}` : "";
  const baseStagione = stagione.current ? "/motogp" : `/motogp/${anno}`;

  const pos = eventi.findIndex((e) => e.id === evento.id);
  const prec = pos > 0 ? eventi[pos - 1] : undefined;
  const succ = pos >= 0 && pos < eventi.length - 1 && eventi[pos + 1].status === "FINISHED" ? eventi[pos + 1] : undefined;

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/motogp" className="hover:text-racing-yellow">MotoGP</Link>
          {" / "}
          <Link href={baseStagione} className="hover:text-racing-yellow">{anno}</Link>
          {" / "}
          <span className="text-white/70">{nomeGP(evento)}</span>
        </nav>

        <h1 className={`${racingFont.className} text-center text-3xl text-racing-yellow sm:text-4xl`}>
          {bandiera(evento.country?.iso)} {nomeGP(evento)} {anno}
        </h1>
        <p className="mb-8 mt-2 text-center text-white/70">
          {evento.circuit?.name}
          {evento.circuit?.place ? ` (${evento.circuit.place})` : ""} ·{" "}
          {formattaPeriodo(evento.date_start, evento.date_end)}
        </p>

        {categoria && (
          <div className="mb-4 flex justify-center">
            <Linguette voci={linguetteClassi(categorie, categoria, base)} />
          </div>
        )}

        {finite.length > 0 && scelta && (
          <div className="mb-8 flex justify-center">
            <Linguette
              voci={finite.map((s) => {
                const q = [qClasse, `sessione=${codiceSessione(s)}`].filter(Boolean).join("&");
                return { href: `${base}?${q}`, label: nomeSessione(s), attiva: s.id === scelta.id };
              })}
            />
          </div>
        )}

        {scelta && risultati.length > 0 ? (
          <>
            <h2 className={`${racingFont.className} mb-2 text-2xl text-racing-yellow`}>
              {categoria?.nome} · {nomeSessione(scelta)}
            </h2>
            {scelta.condition?.track && (
              <p className="mb-3 text-sm text-white/50">
                Pista {scelta.condition.track === "Dry" ? "asciutta" : scelta.condition.track === "Wet" ? "bagnata" : scelta.condition.track}
                {scelta.condition.air ? ` · aria ${scelta.condition.air}` : ""}
                {scelta.condition.ground ? ` · asfalto ${scelta.condition.ground}` : ""}
              </p>
            )}
            <TabellaSessione righe={risultati} gara={gara} />
          </>
        ) : (
          <p className="text-center text-white/60">
            Risultati non ancora disponibili per questo Gran Premio.
          </p>
        )}

        <Pubblicita posizione="motogp-gp" className="mt-10" />

        <div className="mt-10 flex items-center justify-between gap-4 text-sm font-semibold">
          {prec ? (
            <Link href={`/motogp/${anno}/${slugEvento(prec)}${qClasse ? `?${qClasse}` : ""}`} className="text-racing-yellow hover:underline">
              ← {nomeGP(prec)}
            </Link>
          ) : (
            <span />
          )}
          <Link href={baseStagione} className="text-white/60 hover:text-racing-yellow">
            Classifica {anno}
          </Link>
          {succ ? (
            <Link href={`/motogp/${anno}/${slugEvento(succ)}${qClasse ? `?${qClasse}` : ""}`} className="text-racing-yellow hover:underline">
              {nomeGP(succ)} →
            </Link>
          ) : (
            <span />
          )}
        </div>

        <FonteDati />
      </div>
    </section>
  );
}
