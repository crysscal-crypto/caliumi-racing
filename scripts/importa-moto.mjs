/**
 * Crea in Sanity le BOZZE delle schede "Le mie moto".
 * Non sovrascrive niente: se una scheda esiste già, la salta.
 *
 * Uso (dalla cartella del progetto):
 *   node --env-file=.env.local scripts/importa-moto.mjs
 *
 * Dopo: apri lo Studio > "Le mie moto", controlla i dati e premi Publish.
 */
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  console.error("Mancano delle variabili in .env.local (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_WRITE_TOKEN).");
  process.exit(1);
}
const client = createClient({ projectId, dataset, token, apiVersion: "2025-01-01", useCdn: false });

const SERIE = "Dati della versione stradale di serie: la moto da gara era preparata e poteva differire.";
const CORSA = "Dati indicativi del modello da corsa: valori da verificare.";

const MOTO = [
  {
    slug: "aprilia-af1-125-1989",
    nome: "Aprilia AF1 125",
    annoInizio: 1989,
    campionati: "Sport Production",
    riassunto: "La prima moto da gara di Cristian Caliumi: l'Aprilia AF1 125 con cui ha esordito nella Sport Production nel 1989.",
    racconto: "Il debutto agonistico: Campionato Sport Production in sella a una Aprilia AF1 125 stradale, preparata per la pista. Il primo vero banco di prova, da autodidatta.",
    motore: "Rotax 123, monocilindrico 2 tempi",
    cilindrata: "124,7 cc",
    alesaggioCorsa: "54 x 54,5 mm",
    potenza: "circa 30 CV a 10.500 giri",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "doppia trave in acciaio",
    sospAnt: "forcella a steli rovesciati",
    sospPost: "monoammortizzatore, forcellone monobraccio",
    freni: "disco anteriore 320 mm, posteriore 240 mm",
    pneumatici: "17 pollici anteriore e posteriore",
    peso: "circa 130 kg (a secco)",
    velocita: "circa 166 km/h",
    notaDati: SERIE,
  },
  {
    slug: "gilera-sp01-125-1990",
    nome: "Gilera SP01 125",
    annoInizio: 1990,
    campionati: "Gilera Cup",
    riassunto: "La Gilera SP01 125 della Gilera Cup 1990: 6° posto assoluto e titolo di miglior Rookie per Cristian Caliumi.",
    racconto: "Con la SP01 ho corso la Gilera Cup 1990, chiusa al 6° posto assoluto e con il titolo di miglior Rookie.",
    motore: "monocilindrico 2 tempi",
    cilindrata: "124,3 cc",
    potenza: "35 CV a 10.600 giri",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "Twinbox Gilera e tubolare",
    sospAnt: "forcella tradizionale",
    freni: "disco anteriore 300 mm, posteriore 240 mm",
    pneumatici: "100/80-16 anteriore, 130/70-17 posteriore",
    peso: "116 kg (a secco)",
    velocita: "circa 171 km/h",
    notaDati: SERIE,
  },
  {
    slug: "gilera-sp02-125-1990",
    nome: "Gilera SP02 125",
    annoInizio: 1990,
    annoFine: 1991,
    campionati: "Sport Production",
    team: "Concessionario Tondelli di Carpi · poi pilota ufficiale Gilera (1991)",
    riassunto: "La Gilera SP02 125 con cui Cristian Caliumi ha corso la Sport Production nel 1990 e, da pilota ufficiale Gilera, nel 1991.",
    racconto: "Nel 1990 la SP02 me la mise a disposizione il concessionario Tondelli di Carpi, grazie anche all'amico e manager Giorgio Donzelli.\n\nNel 1991 diventai pilota ufficiale Gilera nella Sport Production: lottammo per il titolo fino all'ultima gara, poi una caduta chiuse il discorso.",
    motore: "monocilindrico 2 tempi",
    cilindrata: "124,3 cc",
    potenza: "circa 35 CV",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "Twinbox Gilera e tubolare",
    sospAnt: "forcella a steli rovesciati da 40 mm",
    freni: "disco anteriore 300 mm, posteriore 240 mm",
    pneumatici: "100/80-16 anteriore, 130/70-17 posteriore",
    peso: "116 kg (a secco)",
    velocita: "circa 171 km/h",
    notaDati: SERIE,
  },
  {
    slug: "gilera-crono-125-1991",
    nome: "Gilera Crono 125",
    annoInizio: 1991,
    campionati: "Trofeo Gilera (colori Motosprint)",
    riassunto: "La Gilera Crono 125 del Trofeo Gilera 1991, corso con i colori della rivista Motosprint e vinto da Cristian Caliumi.",
    racconto: "Nel 1991, in parallelo alla Sport Production, ho corso il Trofeo Gilera con i colori della rivista Motosprint. È andata bene: il Trofeo l'abbiamo vinto.",
    motore: "monocilindrico 2 tempi, valvola allo scarico APTS",
    cilindrata: "124,3 cc",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "Twinbox Gilera in lamiera scatolata e tubi quadri",
    sospAnt: "forcella a steli rovesciati",
    sospPost: "forcellone a doppio braccio",
    freni: "disco anteriore 300 mm, posteriore 240 mm",
    peso: "118 kg (a secco)",
    velocita: "circa 172 km/h",
    notaDati: SERIE,
  },
  {
    slug: "honda-rs-125-r-1992",
    nome: "Honda RS 125 R",
    annoInizio: 1992,
    campionati: "Trofeo Grand Prix (Campionato Italiano Velocità)",
    team: "Ex Eugenio Lazzarini, preparata da Lazzarini",
    riassunto: "La Honda RS 125 R ex Eugenio Lazzarini con cui Cristian Caliumi è passato alle Gran Prix nel 1992.",
    racconto: "Il passaggio alle Gran Prix: una Honda 125 acquistata da Eugenio Lazzarini e preparata da lui. Con lei è arrivato un 3° posto assoluto al Trofeo Tordi e la partecipazione al Trofeo Grand Prix.",
    motore: "monocilindrico 2 tempi",
    cilindrata: "124 cc",
    alesaggioCorsa: "54 x 54,5 mm",
    potenza: "circa 40 CV a 12.500 giri",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "doppia trave in alluminio",
    notaDati: CORSA,
  },
  {
    slug: "aprilia-rs-125-1994",
    nome: "Aprilia RS 125",
    annoInizio: 1994,
    campionati: "Campionato Europeo Velocità 125 GP",
    team: "Team Semprucci Krona (manager Massimo Broccoli)",
    riassunto: "L'Aprilia 125 GP del Team Semprucci Krona con cui Cristian Caliumi ha chiuso 9° l'Europeo Velocità 1994.",
    racconto: "Nel 1994 con il Team Semprucci Krona, guidato da Massimo Broccoli, ex pilota del Mondiale 500. Europeo Velocità 125 GP chiuso al 9° posto, senza disputare tutte le gare.",
    motore: "monocilindrico 2 tempi",
    cilindrata: "124,8 cc",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "doppia trave in alluminio",
    notaDati: CORSA,
  },
  {
    slug: "yamaha-tz-125-1995",
    nome: "Yamaha TZ 125",
    annoInizio: 1995,
    campionati: "Motomondiale 125 (wild card Mugello) · Campionato Italiano Velocità 125 GP",
    team: "Team GMR, preparata da Alberto Gubellini",
    riassunto: "La Yamaha 125 del Team GMR con cui Cristian Caliumi ha corso da wild card il GP d'Italia 1995 al Mugello, chiuso 19°.",
    racconto: "La moto della mia unica gara nel Motomondiale: wild card al Gran Premio d'Italia 1995 al Mugello, 19° al traguardo. Preparata da Alberto Gubellini del Team GMR.",
    motore: "monocilindrico 2 tempi",
    cilindrata: "124 cc",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "doppia trave in alluminio",
    notaDati: CORSA,
  },
  {
    slug: "yamaha-tz-250-1996",
    nome: "Yamaha TZ 250",
    annoInizio: 1996,
    annoFine: 1997,
    campionati: "Campionato Italiano Velocità 250 GP",
    riassunto: "La Yamaha TZ 250 del passaggio di Cristian Caliumi alla classe 250 GP nel 1996 e 1997.",
    racconto: "Il salto alla 250 GP, una moto completamente diversa dalla 125: più potenza, più peso, un modo diverso di guidare.",
    motore: "bicilindrico a V 2 tempi",
    cilindrata: "249 cc",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "doppia trave in alluminio",
    notaDati: CORSA,
  },
  {
    slug: "honda-rs-250-1998",
    nome: "Honda RS 250",
    annoInizio: 1998,
    campionati: "Campionato Europeo e Campionato Italiano Velocità 250",
    team: "Team Emmegi (team manager Stefano Cappanera)",
    riassunto: "La Honda RS 250 del Team Emmegi con cui Cristian Caliumi ha corso l'Europeo e l'Italiano Velocità 250 nel 1998.",
    racconto: "Nel 1998 Europeo e Italiano insieme, con il Team Emmegi e Stefano Cappanera, patron del Team Krona che aveva portato Kazuto Sakata al successo nel Mondiale 125.",
    motore: "bicilindrico a V di 90°, 2 tempi",
    cilindrata: "249 cc",
    alesaggioCorsa: "54 x 54,5 mm",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "doppia trave in alluminio",
    notaDati: CORSA,
  },
  {
    slug: "aprilia-rsv-250-1999",
    nome: "Aprilia RSV 250",
    annoInizio: 1999,
    campionati: "Campionato Italiano Velocità 250",
    team: "Team RCGM · moto ex Tetsuya Harada",
    riassunto: "L'Aprilia RSV 250 ex Tetsuya Harada guidata da Cristian Caliumi con il Team RCGM nel 1999.",
    racconto: "Con il Team RCGM ho guidato un'Aprilia RSV 250 ex Harada: una moto nata per il Mondiale.",
    motore: "bicilindrico 2 tempi, valvole rotanti",
    cilindrata: "249 cc",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "doppia trave in alluminio",
    notaDati: CORSA,
  },
  {
    slug: "ducati-996-rs-2002",
    nome: "Ducati 996 RS",
    annoInizio: 2002,
    campionati: "Campionato Mondiale Superbike · Campionato Italiano Velocità Superbike",
    team: "Team Pedercini (manager Giuseppe Rondina)",
    riassunto: "La Ducati 996 RS del Team Pedercini con cui Cristian Caliumi ha corso 5 gare del Mondiale Superbike 2002, con un 16° posto in Gara 1.",
    racconto: "Nel 2002 la Superbike con il Team Pedercini: Italiano Velocità e cinque gare del Mondiale. Il miglior risultato è stato un 16° posto in Gara 1.",
    motore: "bicilindrico a L di 90°, 4 tempi, distribuzione desmodromica, 4 valvole per cilindro",
    cilindrata: "996 cc",
    alesaggioCorsa: "98 x 66 mm",
    alimentazione: "iniezione elettronica",
    raffreddamento: "a liquido",
    cambio: "6 marce",
    telaio: "traliccio in tubi d'acciaio",
    notaDati: CORSA,
  },
];

let creati = 0;
for (const m of MOTO) {
  const { slug, ...dati } = m;
  const id = `moto-${slug}`;
  const esiste = await client.fetch(`count(*[_id in [$id, "drafts." + $id]])`, { id });
  if (esiste) {
    console.log(`Già presente, salto: ${m.nome}`);
    continue;
  }
  await client.create({ _id: `drafts.${id}`, _type: "moto", slug: { _type: "slug", current: slug }, ...dati });
  creati++;
  console.log(`Bozza creata: ${m.nome} (${m.annoInizio})`);
}
console.log(`\nFATTO: ${creati} bozze create. Apri lo Studio > "Le mie moto", controlla i dati e premi Publish.`);
