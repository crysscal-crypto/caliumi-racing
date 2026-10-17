import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { racingFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";
import { Linguette } from "@/components/TabelleMotoGP";
import { linguetteClassiCIV, TabellaGaraCIV, FonteDatiCIV } from "@/components/StagioneCIV";
import {
  stagioneCIV,
  stagioniCIV,
  scegliClasseCIV,
  eventoCIV,
  gareEvento,
  nomeGaraCIV,
  slugGara,
  dateEvento,
} from "@/sanity/lib/civ";

type Props = {
  params: Promise<{ anno: string; evento: string }>;
  searchParams: Promise<{ classe?: string; gara?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { anno, evento } = await params;
  const { classe } = await searchParams;
  const s = /^\d{4}$/.test(anno) ? stagioneCIV(Number(anno)) : undefined;
  const e = s ? eventoCIV(s, evento) : undefined;
  if (!s || !e) return { title: "Round non trovato" };
  const nome = scegliClasseCIV(s, classe)?.nome ?? "Superbike";
  return {
    title: `CIV ${nome} ${e.circuito} ${anno}: risultati Gara 1 e Gara 2 | Caliumi Racing`,
    description: `Risultati completi CIV ${nome} del round di ${e.circuito} (${dateEvento(e)}): ordine d'arrivo, tempi e distacchi di tutte le gare.`,
    alternates: { canonical: `/civ/${anno}/${evento}${classe ? `?classe=${classe}` : ""}` },
  };
}

export default async function CIVEventoPage({ params, searchParams }: Props) {
  const { anno, evento } = await params;
  const { classe, gara: codice } = await searchParams;
  if (!/^\d{4}$/.test(anno)) notFound();
  const s = stagioneCIV(Number(anno));
  if (!s) notFound();
  const e = eventoCIV(s, evento);
  if (!e) notFound();

  const c = scegliClasseCIV(s, classe);
  const gare = c ? gareEvento(c, e) : [];
  const scelta = gare.find((g) => slugGara(g) === codice) ?? gare[gare.length - 1];

  const base = `/civ/${anno}/${evento}`;
  const qClasse = c && c.slug !== s.classi[0]?.slug ? `classe=${c.slug}` : "";
  const baseStagione = stagioniCIV()[0]?.anno === s.anno ? "/civ" : `/civ/${anno}`;
  const prec = s.eventi.find((x) => x.round === e.round - 1);
  const succ = s.eventi.find((x) => x.round === e.round + 1);

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/civ" className="hover:text-racing-yellow">CIV</Link>
          {" / "}
          <Link href={baseStagione} className="hover:text-racing-yellow">{anno}</Link>
          {" / "}
          <span className="text-white/70">{e.circuito}</span>
        </nav>

        <h1 className={`${racingFont.className} text-center text-3xl text-racing-yellow sm:text-4xl`}>
          CIV {e.circuito} {anno}
        </h1>
        <p className="mb-8 mt-2 text-center text-white/70">
          Round {e.round} · {dateEvento(e)}
        </p>

        {c && s.classi.length > 1 && (
          <div className="mb-4 flex justify-center">
            <Linguette voci={linguetteClassiCIV(s, c, base)} />
          </div>
        )}

        {gare.length > 1 && scelta && (
          <div className="mb-8 flex justify-center">
            <Linguette
              voci={gare.map((g) => {
                const q = [qClasse, `gara=${slugGara(g)}`].filter(Boolean).join("&");
                return { href: `${base}?${q}`, label: nomeGaraCIV(g.sessione), attiva: g === scelta };
              })}
            />
          </div>
        )}

        {scelta ? (
          <>
            <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>
              {c?.nome} · {nomeGaraCIV(scelta.sessione)}
            </h2>
            <TabellaGaraCIV righe={scelta.righe} />
          </>
        ) : (
          <p className="text-center text-white/60">Risultati non disponibili per questa classe.</p>
        )}

        <Pubblicita posizione="motogp-gp" className="mt-10" />

        <div className="mt-10 flex items-center justify-between gap-4 text-sm font-semibold">
          {prec ? (
            <Link href={`/civ/${anno}/${prec.slug}${qClasse ? `?${qClasse}` : ""}`} className="text-racing-yellow hover:underline">
              ← {prec.circuito}
            </Link>
          ) : (
            <span />
          )}
          <Link href={`${baseStagione}${qClasse ? `?${qClasse}` : ""}`} className="text-white/60 hover:text-racing-yellow">
            Classifica {anno}
          </Link>
          {succ ? (
            <Link href={`/civ/${anno}/${succ.slug}${qClasse ? `?${qClasse}` : ""}`} className="text-racing-yellow hover:underline">
              {succ.circuito} →
            </Link>
          ) : (
            <span />
          )}
        </div>

        <FonteDatiCIV />
      </div>
    </section>
  );
}
