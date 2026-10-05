/**
 * Carica in Sanity (Gallery) tutte le foto della cartella foto-gallery.
 *
 * Come preparare le cartelle (dentro il progetto):
 *   foto-gallery/1998/gp-europeo-250/foto1.jpg
 *   foto-gallery/1998/gp-europeo-250/foto2.jpg
 *   foto-gallery/1991/trofeo-gilera/qualsiasi-nome.jpg
 *   foto-gallery/1995/foto-senza-categoria.jpg      (la categoria si può omettere)
 *
 * Categorie: sport-production, trofeo-gilera, gp-italiano-125, gp-italiano-250,
 *            gp-europeo-125, gp-europeo-250, motomondiale, superbike, superstock
 *
 * Uso:   node --env-file=.env.local scripts/importa-gallery.mjs
 * Le foto caricate vengono spostate in foto-gallery/fatte (così non si caricano due volte).
 * Le foto vengono ridimensionate (max 2400 px) e alleggerite prima del caricamento.
 * Le foto vengono PUBBLICATE subito. Titoli e testi si possono migliorare dopo nello Studio.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

// Ridimensiona e alleggerisce prima di caricare (lato lungo max 2400 px, JPEG qualità 82)
let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.log("Nota: 'sharp' non trovato, le foto vengono caricate senza ridimensionarle.");
  console.log("Per attivarlo: npm install sharp --legacy-peer-deps\n");
}

async function prepara(file) {
  if (!sharp) return fs.createReadStream(file);
  return sharp(file)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

const CARTELLA = "foto-gallery";
const FATTE = path.join(CARTELLA, "fatte");
const ESTENSIONI = [".jpg", ".jpeg", ".png", ".webp"];
const CATEGORIE = {
  "sport-production": "Sport Production",
  "trofeo-gilera": "Trofeo Gilera",
  "gp-italiano-125": "Campionato Italiano 125cc",
  "gp-italiano-250": "Campionato Italiano 250cc",
  "gp-europeo-125": "Campionato Europeo 125cc",
  "gp-europeo-250": "Campionato Europeo 250cc",
  motomondiale: "Motomondiale",
  superbike: "Superbike",
  superstock: "Superstock",
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  console.error("Mancano delle variabili in .env.local (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_WRITE_TOKEN).");
  process.exit(1);
}
if (!fs.existsSync(CARTELLA)) {
  fs.mkdirSync(CARTELLA);
  console.log(`Ho creato la cartella "${CARTELLA}". Mettici dentro le foto (vedi istruzioni in cima allo script) e rilancia.`);
  process.exit(0);
}
const client = createClient({ projectId, dataset, token, apiVersion: "2025-01-01", useCdn: false });

// Trova tutte le foto: foto-gallery/ANNO[/CATEGORIA]/file
const daCaricare = [];
for (const anno of fs.readdirSync(CARTELLA)) {
  const dirAnno = path.join(CARTELLA, anno);
  if (anno === "fatte" || !fs.statSync(dirAnno).isDirectory()) continue;
  if (!/^\d{4}$/.test(anno)) {
    console.log(`Salto la cartella "${anno}": il nome deve essere un anno (es. 1998).`);
    continue;
  }
  for (const voce of fs.readdirSync(dirAnno)) {
    const p = path.join(dirAnno, voce);
    if (fs.statSync(p).isDirectory()) {
      if (!CATEGORIE[voce]) {
        console.log(`Salto la cartella "${anno}/${voce}": categoria non valida.`);
        continue;
      }
      for (const f of fs.readdirSync(p)) {
        if (ESTENSIONI.includes(path.extname(f).toLowerCase())) daCaricare.push({ file: path.join(p, f), anno: Number(anno), categoria: voce });
      }
    } else if (ESTENSIONI.includes(path.extname(voce).toLowerCase())) {
      daCaricare.push({ file: p, anno: Number(anno), categoria: null });
    }
  }
}

if (daCaricare.length === 0) {
  console.log("Nessuna foto da caricare in foto-gallery.");
  process.exit(0);
}
console.log(`Foto da caricare: ${daCaricare.length}\n`);

const contatori = {};
let ok = 0;
for (const { file, anno, categoria } of daCaricare) {
  const etichetta = categoria ? `${CATEGORIE[categoria]} ${anno}` : `stagione ${anno}`;
  const chiave = `${anno}-${categoria ?? ""}`;
  contatori[chiave] = (contatori[chiave] ?? 0) + 1;
  try {
    const dati = await prepara(file);
    const opzioni = sharp
      ? { filename: path.parse(file).name + ".jpg", contentType: "image/jpeg" }
      : { filename: path.basename(file) };
    const asset = await client.assets.upload("image", dati, opzioni);
    await client.create({
      _type: "galleryItem",
      title: `Cristian Caliumi – ${etichetta} (${contatori[chiave]})`,
      year: anno,
      ...(categoria ? { category: categoria } : {}),
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: `Cristian Caliumi in pista, ${etichetta}`,
      },
    });
    const dest = path.join(FATTE, path.relative(CARTELLA, file));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(file, dest);
    ok++;
    console.log(`OK  ${file}`);
  } catch (e) {
    console.log(`ERRORE  ${file}: ${e.message}`);
  }
}
console.log(`\nFATTO: ${ok} foto caricate su ${daCaricare.length}.`);
