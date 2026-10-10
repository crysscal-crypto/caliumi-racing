import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { racingFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";

// ===== FOTO A LATO =====
// Metti la foto in: public/chi-sono.jpg (verticale, circa 900x1200 pixel)
const FOTO = "/chi-sono.jpg";
const DIDASCALIA = "Cristian Caliumi in pista";
const TESTO_ALT = "Cristian Caliumi, pilota di Carpi, in sella alla sua moto da corsa";
// =======================

export const metadata: Metadata = {
  title: "Chi Sono – Cristian Caliumi | Carriera motociclistica",
  description:
    "La storia sportiva di Cristian Caliumi, pilota di Carpi: dagli esordi nel 1989 al Trofeo Gilera, dal Motomondiale 125 al Campionato Mondiale Superbike.",
};

const sections = [
  {
    title: "1989 — Gli esordi",
    text: `La storia sportiva di Cristian Caliumi inizia nel 1989, spinta da una passione autentica per le competizioni motociclistiche. Nato a Carpi, in provincia di Modena, il 13 agosto 1972, Caliumi muove i primi passi nel mondo delle corse da autodidatta, dimostrando fin da subito determinazione, talento e una naturale predisposizione alla guida.

Il debutto agonistico avviene nel Campionato Sport Production, in sella a una Aprilia AF1 125 stradale, che rappresenta il primo vero banco di prova in pista. Già l'anno successivo arriva il passaggio a Gilera, marchio con cui il pilota emiliano inizia a raccogliere risultati di rilievo.`,
  },
  {
    title: "1990-1991 — Gilera e il Trofeo",
    text: `Nel 1990 Cristian Caliumi partecipa alla Sport Production con una Gilera SP02, moto messa a disposizione dal concessionario Tondelli di Carpi, grazie anche al supporto del suo amico e manager Giorgio Donzelli. Parallelamente prende parte alla Gilera Cup, chiudendo la stagione al 6° posto assoluto e conquistando il titolo di miglior Rookie.

Il 1991 rappresenta una stagione chiave: Caliumi diventa pilota ufficiale Gilera nella Sport Production, lottando per il titolo fino all'ultima gara — una caduta gli costa la vittoria finale. Nello stesso anno veste anche i colori della rivista Motosprint nel Trofeo Gilera, competizione che riesce a vincere.`,
  },
  {
    title: "1992 — Il passaggio alle Gran Prix",
    text: `Forte dei risultati ottenuti, nel 1992 arriva il passaggio alle Gran Prix. In sella a una Honda 125 cc acquistata da Eugenio Lazzarini e preparata dallo stesso, Cristian affronta il suo primo approccio al mondo GP, ottenendo un 3° posto assoluto al Trofeo Tordi e partecipando al Trofeo Grand Prix, l'allora denominazione del Campionato Italiano Velocità.`,
  },
  {
    title: "1994 — Team Semprucci Krona",
    text: `Nel 1994 approda al Team Semprucci Krona, guidato dal manager Massimo Broccoli, ex pilota del Mondiale 500. In sella a una Aprilia RSV 125, Caliumi prende parte al Campionato Europeo Velocità 125 GP, chiudendo la stagione al 9° posto assoluto, pur non disputando tutte le gare del calendario.`,
  },
  {
    title: "1995 — L'esordio nel Motomondiale",
    text: `Il 1995 segna l'esordio nel Motomondiale 125 cc. Con una Yamaha preparata da Alberto Gubellini del Team GMR, Cristian partecipa come wild card al Gran Premio d'Italia al Mugello, ottenendo un 19° posto finale — un risultato di valore per un pilota esordiente. Nello stesso anno prende parte anche al Campionato Italiano Velocità 125 GP.`,
  },
  {
    title: "1996-1999 — La 250 GP",
    text: `Tra il 1996 e il 1997 avviene il passaggio di categoria alla 250 GP, in sella a una Yamaha TZ250. Nel 1998, con la Honda RS 250 GP, Caliumi disputa contemporaneamente il Campionato Europeo e il Campionato Italiano Velocità, difendendo i colori del Team Emmegi, sotto la guida del team manager Stefano Cappanera, patron del Team Krona che ha portato Kazuto Sakata al successo nel Motomondiale 125.

Nel 1999 arriva l'ingresso nel Team RCGM, dove Cristian guida una Aprilia RSV 250 ex Harada.`,
  },
  {
    title: "2002 — Il Campionato Mondiale Superbike",
    text: `Il percorso agonistico culmina nel 2002 con l'approdo alla Superbike. Con il Team Pedercini, Cristian Caliumi disputa il Campionato Italiano Velocità Superbike e prende parte anche ad alcune gare del Campionato Mondiale Superbike, in sella a una Ducati 996 RS, seguito dal manager Giuseppe Rondina. Nel Mondiale WSBK, Caliumi ottiene un 16° posto in Gara 1, un risultato di rilievo considerando il livello della categoria.`,
  },
  {
    title: "2007-2014 — Direttore Sportivo, Team Azione Corse",
    text: `Terminata l'attività agonistica in sella, Cristian Caliumi prosegue il suo percorso nel motociclismo come Direttore Sportivo del Team Azione Corse dal 2007 al 2014, impegnato nei Campionati Mondiali Superstock 1000 e Superstock 600. In questi anni ha guidato piloti come Per Bjork, Andrea Liberini, Sam Lowes e Marko Rohtlaan.`,
  },
];

export default function ChiSonoPage() {
  const fotoPresente = existsSync(path.join(process.cwd(), "public", FOTO));

  const foto = fotoPresente ? (
    <figure className="overflow-hidden rounded-lg border border-racing-yellow/30 bg-carbon-800 shadow-2xl">
      <img
        src={FOTO}
        alt={TESTO_ALT}
        className="w-full object-cover"
        loading="eager"
      />
      <figcaption className="px-4 py-3 text-center text-sm italic text-white/70">
        {DIDASCALIA}
      </figcaption>
    </figure>
  ) : null;

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-2 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          Cristian Caliumi
        </h1>
        <p className="mb-12 text-center text-white/60">
          Nato a Carpi (MO) il 13 agosto 1972 — carriera motociclistica
        </p>

        <div className={fotoPresente ? "lg:grid lg:grid-cols-[1fr_340px] lg:gap-12" : "mx-auto max-w-3xl"}>
          {foto && <div className="mx-auto mb-10 max-w-sm lg:hidden">{foto}</div>}

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  {section.title}
                </h2>
                {section.text.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="mb-3 text-white/80">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}

            <Link
              href="/moto"
              className="block rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5 text-center transition hover:bg-carbon-800"
            >
              <span className={`${racingFont.className} text-2xl text-racing-yellow`}>Le mie moto →</span>
              <span className="mt-1 block text-sm text-white/70">
                Dalla Aprilia AF1 125 alla Ducati 996 RS: schede tecniche e ricordi di pista
              </span>
            </Link>

            <Link
              href="/campionati"
              className="block rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5 text-center transition hover:bg-carbon-800"
            >
              <span className={`${racingFont.className} text-2xl text-racing-yellow`}>I campionati →</span>
              <span className="mt-1 block text-sm text-white/70">
                Trofeo Gilera, Sport Production, GP e Superbike: com&apos;erano e chi li ha vinti
              </span>
            </Link>
            <Pubblicita posizione="articolo-fondo" className="mt-4" />
          </div>

          {foto && (
            <aside className="hidden lg:block">
              <div className="sticky top-28">{foto}</div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
