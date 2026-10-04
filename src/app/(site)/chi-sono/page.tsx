import type { Metadata } from "next";
import { racingFont } from "@/sanity/lib/fonts";

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
  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-2 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          Cristian Caliumi
        </h1>
        <p className="mb-12 text-center text-white/60">
          Nato a Carpi (MO) il 13 agosto 1972 — carriera motociclistica
        </p>

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
        </div>
      </div>
    </section>
  );
}