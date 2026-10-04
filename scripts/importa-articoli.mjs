/**
 * Importa le scansioni degli articoli di giornale in Sanity come BOZZE.
 *
 * Uso (dalla cartella del progetto):
 *   node --env-file=.env.local scripts/importa-articoli.mjs
 *
 * Nome file: testata_AAAA-MM-GG_campionato.jpg
 * Esempio:   gazzetta-di-modena_2002-05-18_superbike.jpg
 * (se non conosci il giorno: testata_AAAA_campionato.jpg)
 */

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import Tesseract from "tesseract.js";

const { createWorker } = Tesseract;

const CARTELLA = "scansioni";
const CARTELLA_FATTE = path.join(CARTELLA, "fatte");
const CARTELLA_LINGUA = path.join("scripts", ".tessdata");
const ESTENSIONI = [".jpg", ".jpeg", ".png", ".webp"];
const CAMPIONATI = [
  "trofeo-gilera",
  "sport-production",
  "gp-italiano",
  "gp-europeo",
  "motomondiale",
  "superbike",
  "superstock",
];
const PAROLE_PICCOLE = ["di", "del", "della", "dello", "dei", "delle", "e", "la", "il", "lo", "in"];

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    "Mancano delle variabili in .env.local (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_WRITE_TOKEN)."
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2025-01-01",
  useCdn: false,
});

const chiave = () => randomUUID().slice(0, 12);

function leggiNomeFile(nomeFile) {
  const base = path.parse(nomeFile).name.toLowerCase();
  const formato =
    "Usa il formato testata_AAAA-MM-GG_campionato.jpg, ad esempio gazzetta-di-modena_2002-05-18_superbike.jpg";
  const parti = base.split("_");
  if (parti.length !== 3) {
    throw new Error(`Nome file non valido. ${formato}`);
  }
  const [testataSlug, data, campionato] = parti;
  if (!/^\d{4}(-\d{2}-\d{2})?$/.test(data)) {
    throw new Error(`Data non valida ("${data}"). Usa AAAA-MM-GG oppure solo AAAA.`);
  }
  if (!CAMPIONATI.includes(campionato)) {
    throw new Error(
      `Campionato non valido ("${campionato}"). Valori ammessi: ${CAMPIONATI.join(", ")}`
    );
  }
  return { testataSlug, data, campionato, anno: Number(data.slice(0, 4)) };
}

function nomeTestata(slug) {
  return slug
    .split("-")
    .map((parola, i) =>
      i > 0 && PAROLE_PICCOLE.includes(parola)
        ? parola
        : parola.charAt(0).toUpperCase() + parola.slice(1)
    )
    .join(" ");
}

function dataLeggibile(data) {
  if (data.length === 4) return data;
  const [anno, mese, giorno] = data.split("-");
  return `${giorno}/${mese}/${anno}`;
}

function pulisciTesto(testo) {
  return testo
    .replace(/\r/g, "")
    .replace(/(\p{L})-[ \t]*\n[ \t]*(\p{Ll})/gu, "$1$2")
    .replace(/[ \t]+/g, " ")
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.replace(/\n/g, " ").trim())
    .filter((paragrafo) => (paragrafo.match(/\p{L}/gu) || []).length >= 8);
}

function aBlocchi(paragrafi) {
  return paragrafi.map((testo) => ({
    _type: "block",
    _key: chiave(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: chiave(), text: testo, marks: [] }],
  }));
}

async function importa(worker, nomeFile) {
  const meta = leggiNomeFile(nomeFile);
  const percorso = path.join(CARTELLA, nomeFile);
  const testata = nomeTestata(meta.testataSlug);
  const dataTesto = dataLeggibile(meta.data);
  const slug = `${meta.testataSlug}-${meta.data}-${meta.campionato}`;

  const esistenti = await client.getDocuments([
    `drafts.articolo-${slug}`,
    `articolo-${slug}`,
  ]);
  if (esistenti.some(Boolean)) {
    console.log("  Salto: esiste già un articolo creato da questo file.");
    return false;
  }

  console.log("  Leggo il testo (può richiedere un minuto)...");
  const { data: ocr } = await worker.recognize(percorso);
  const paragrafi = pulisciTesto(ocr.text);

  console.log("  Carico la scansione su Sanity...");
  const asset = await client.assets.upload(
    "image",
    fs.createReadStream(percorso),
    { filename: nomeFile }
  );

  const alt = `Ritaglio di ${testata} del ${dataTesto}`;
  const immagine = () => ({
    _type: "image",
    asset: { _type: "reference", _ref: asset._id },
    alt,
  });

  await client.createOrReplace({
    _id: `drafts.articolo-${slug}`,
    _type: "articolo",
    title: `DA RIVEDERE – ${testata} ${dataTesto}`,
    slug: { _type: "slug", current: slug },
    category: meta.campionato,
    year: meta.anno,
    source: testata,
    publishedAt: meta.data.length === 10 ? meta.data : undefined,
    coverImage: immagine(),
    scans: [{ _key: chiave(), ...immagine() }],
    body: aBlocchi(paragrafi),
  });

  return true;
}

async function main() {
  if (!fs.existsSync(CARTELLA)) {
    fs.mkdirSync(CARTELLA);
    console.log(
      `Ho creato la cartella "${CARTELLA}". Mettici dentro le scansioni e rilancia il comando.`
    );
    return;
  }

  fs.mkdirSync(CARTELLA_FATTE, { recursive: true });
  fs.mkdirSync(CARTELLA_LINGUA, { recursive: true });

  const file = fs
    .readdirSync(CARTELLA)
    .filter((f) => ESTENSIONI.includes(path.extname(f).toLowerCase()));

  if (file.length === 0) {
    console.log(`Nessuna scansione trovata nella cartella "${CARTELLA}".`);
    return;
  }

  console.log(`Trovate ${file.length} scansioni.\n`);
  const worker = await createWorker("ita", 1, { cachePath: CARTELLA_LINGUA });

  let create = 0;
  for (const [i, nomeFile] of file.entries()) {
    console.log(`[${i + 1}/${file.length}] ${nomeFile}`);
    try {
      const fatto = await importa(worker, nomeFile);
      if (fatto) {
        fs.renameSync(
          path.join(CARTELLA, nomeFile),
          path.join(CARTELLA_FATTE, nomeFile)
        );
        create++;
        console.log("  Fatto: bozza creata.\n");
      }
    } catch (errore) {
      console.log(`  ERRORE: ${errore.message}\n`);
    }
  }

  await worker.terminate();
  console.log(`Finito: ${create} bozze create su ${file.length} scansioni.`);
  console.log("Apri lo Studio, controlla ogni bozza e premi Publish.");
}

main();