/**
 * Crea in Sanity la BOZZA della scheda "Trofeo Gilera / Gilera Cup".
 * Non sovrascrive niente: se esiste già, la salta.
 *
 * Uso:  node --env-file=.env.local scripts/importa-campionati.mjs
 * Poi:  Studio > "Campionati" > controlla e premi Publish.
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  console.error("Mancano delle variabili in .env.local.");
  process.exit(1);
}
const client = createClient({ projectId, dataset, token, apiVersion: "2025-01-01", useCdn: false });
const k = () => randomUUID().slice(0, 12);

const CAMPIONATI = [
  {
    id: "campionato-trofeo-gilera",
    nome: "Trofeo Gilera – Gilera Cup",
    slug: "trofeo-gilera",
    sottotitolo: "La coppa monomarca 125 due tempi",
    periodo: "1988–1992",
    ordine: 1,
    categorie: ["trofeo-gilera"],
    riassunto:
      "La Gilera Cup, o Trofeo Gilera, era la coppa monomarca riservata alle Gilera 125 due tempi: stesse moto per tutti, regolamenti rigidi e gare decise dalla guida. Per tanti giovani piloti è stata il primo passo verso il Campionato Italiano e le Gran Prix.",
    sezioni: [
      {
        titolo: "Che cos'era",
        testo:
          "La Gilera Cup, chiamata anche Trofeo Gilera, è stata una delle coppe monomarca più seguite tra la fine degli anni '80 e l'inizio degli anni '90. Era riservata alle Gilera 125 due tempi e organizzata dalla LMC di Roma.\n\nL'idea era semplice: tutti in pista con la stessa moto e con un regolamento tecnico rigido, così che a fare la differenza fossero il pilota e la messa a punto. Per molti era una vera scuola, per piloti, meccanici e piccoli team privati.",
      },
      {
        titolo: "La formula",
        testo:
          "- Monomarca Gilera 125 cc due tempi\n- Regolamento tecnico rigido, con moto controllate\n- Costi più accessibili rispetto alle Gran Prix\n- Gruppi numerosi, spesso racchiusi in pochi decimi\n\nCon moto così simili, le gare si decidevano spesso all'ultima staccata.",
      },
      {
        titolo: "Le moto, anno dopo anno",
        testo:
          "Il Trofeo ha seguito l'evoluzione delle sportive Gilera 125 di serie, sempre più vicine a delle piccole moto da Gran Premio:\n\n- 1988 – Gilera KZ\n- 1989 – Gilera MX1\n- 1990 – Gilera SP01\n- 1991 – Gilera SP02 e Crono\n- 1992 – Gilera Crono\n\nLa Crono, con il telaio Twinbox e la valvola allo scarico, era la più evoluta: impegnativa da guidare, ma molto efficace quando era messa a punto bene.",
      },
      {
        titolo: "Nel paddock",
        testo:
          "Nei box si respirava miscela e due tempi: serate passate su carburazioni e rapporti, rivalità forte in pista e rispetto fuori. Era una palestra anche per meccanici e preparatori, molti dei quali lavoravano già nelle Gran Prix.\n\nChi vinceva la Gilera Cup si faceva notare: per molti è stata la porta d'ingresso verso il Campionato Italiano Velocità 125 e poi verso Europeo e Mondiale.",
      },
    ],
    esperienza:
      "Nel 1990 ho corso la Gilera Cup con la SP01: 6° posto assoluto e il titolo di miglior Rookie.\n\nNel 1991, in parallelo alla Sport Production, ho corso il Trofeo con i colori della rivista Motosprint, prima con la SP02 e poi con la Crono. È andata bene: il Trofeo l'abbiamo vinto.",
    alboDoro: [
      { anno: 1988, moto: "Gilera KZ", pilota: "Gimmi Bosio" },
      { anno: 1989, moto: "Gilera MX1", pilota: "Eloi Chiariotti" },
      { anno: 1990, moto: "Gilera SP01", pilota: "Riccardo Ascone" },
      { anno: 1991, moto: "Gilera SP02 / Crono", pilota: "Cristian Caliumi" },
      { anno: 1992, moto: "Gilera Crono", pilota: "Ivan Cremonini" },
    ],
    moto: ["moto-gilera-sp01-125-1990", "moto-gilera-sp02-125-1990", "moto-gilera-crono-125-1991"],
  },
];

for (const c of CAMPIONATI) {
  const { id, slug, sezioni, alboDoro, moto, ...dati } = c;
  const esiste = await client.fetch(`count(*[_id in [$id, "drafts." + $id]])`, { id });
  if (esiste) {
    console.log(`Già presente, salto: ${c.nome}`);
    continue;
  }
  await client.create({
    _id: `drafts.${id}`,
    _type: "campionato",
    ...dati,
    slug: { _type: "slug", current: slug },
    sezioni: sezioni.map((s) => ({ _key: k(), _type: "sezione", ...s })),
    alboDoro: alboDoro.map((a) => ({ _key: k(), _type: "vincitore", ...a })),
    moto: moto.map((ref) => ({ _key: k(), _type: "reference", _ref: ref, _weak: true })),
  });
  console.log(`Bozza creata: ${c.nome}`);
}
console.log('\nFATTO. Apri lo Studio > "Campionati", controlla e premi Publish.');
