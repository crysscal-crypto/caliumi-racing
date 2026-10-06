/**
 * Carica in Sanity gli articoli già trascritti e preparati (scansioni/pronti/articoli.json).
 * Crea BOZZE: poi nello Studio controlli e premi Publish.
 * Non sovrascrive: se un articolo esiste già, lo salta.
 * Dopo il caricamento sposta le scansioni originali da scansioni/da-fare a scansioni/fatte.
 *
 * Uso:  node --env-file=.env.local scripts/importa-articoli-pronti.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";

const PRONTI = path.join("scansioni", "pronti");
const DA_FARE = path.join("scansioni", "da-fare");
const FATTE = path.join("scansioni", "fatte");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  console.error("Mancano delle variabili in .env.local.");
  process.exit(1);
}
const client = createClient({ projectId, dataset, token, apiVersion: "2025-01-01", useCdn: false });
const k = () => randomUUID().slice(0, 12);

const file = path.join(PRONTI, "articoli.json");
if (!fs.existsSync(file)) {
  console.log("Nessun file scansioni/pronti/articoli.json da caricare.");
  process.exit(0);
}
const articoli = JSON.parse(fs.readFileSync(file, "utf8"));

const blocco = (testo, style = "normal") => ({
  _type: "block",
  _key: k(),
  style,
  markDefs: [],
  children: [{ _type: "span", _key: k(), text: testo, marks: [] }],
});

let creati = 0;
for (const a of articoli) {
  const id = `articolo-${a.slug}`;
  const esiste = await client.fetch(`count(*[_id in [$id, "drafts." + $id]])`, { id });
  if (esiste) {
    console.log(`Già presente, salto: ${a.title}`);
    continue;
  }

  const scansioni = [];
  for (const [nome, alt] of a.scans) {
    const asset = await client.assets.upload("image", fs.createReadStream(path.join(PRONTI, nome)), { filename: nome });
    scansioni.push({ _type: "image", _key: k(), asset: { _type: "reference", _ref: asset._id }, alt });
  }

  const doc = {
    _id: `drafts.${id}`,
    _type: "articolo",
    title: a.title,
    slug: { _type: "slug", current: a.slug },
    category: a.category,
    year: a.year,
    ...(a.season ? { season: a.season } : {}),
    ...(a.source ? { source: a.source } : {}),
    ...(a.publishedAt ? { publishedAt: a.publishedAt } : {}),
    summary: a.summary,
    coverImage: { ...scansioni[0], _key: undefined },
    scans: scansioni,
    body: a.body.map((p) => (typeof p === "string" ? blocco(p) : blocco(p.h2, "h2"))),
    ...(a.standings
      ? {
          standings: a.standings.map(([position, rider, points]) => ({
            _type: "standingRow",
            _key: k(),
            position,
            rider,
            points,
            race: a.standingsRace,
          })),
        }
      : {}),
  };
  delete doc.coverImage._key;
  await client.create(doc);
  creati++;
  console.log(`Bozza creata: ${a.title}`);

  for (const s of a.sorgenti ?? []) {
    const da = path.join(DA_FARE, s);
    if (!fs.existsSync(da)) continue;
    const a2 = path.join(FATTE, s);
    fs.mkdirSync(path.dirname(a2), { recursive: true });
    fs.renameSync(da, a2);
  }
}
console.log(`\nFATTO: ${creati} bozze create. Apri lo Studio > Articolo, controlla e premi Publish.`);
