/**
 * PASSO 1 – Esporta foto e testi da Sanity, così Claude può scrivere i testi SEO mancanti.
 * Non modifica niente in Sanity.
 *
 * Uso:  node --env-file=.env.local scripts/esporta-testi.mjs
 * Crea la cartella testi-seo/ con elenco.json e le anteprime delle foto.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2025-01-01",
  useCdn: false,
});

const CARTELLA = "testi-seo";
const FOTO = path.join(CARTELLA, "foto");
fs.mkdirSync(FOTO, { recursive: true });

const url = (ref) => {
  // image-<id>-<w>x<h>-<ext>
  const [, id, dim, ext] = ref.split("-");
  return `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${id}-${dim}.${ext}?w=900&fm=jpg&q=70`;
};

async function scarica(ref, nome) {
  const dest = path.join(FOTO, `${nome}.jpg`);
  if (fs.existsSync(dest)) return;
  const res = await fetch(url(ref));
  if (res.ok) fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

const dati = await client.fetch(`{
  "gallery": *[_type == "galleryItem"]{ _id, title, year, category, description, "alt": image.alt, "ref": image.asset._ref, "moto": moto->nome },
  "moto": *[_type == "moto"]{ _id, nome, "slug": slug.current, annoInizio, annoFine, campionati, team, riassunto, racconto,
            motore, cilindrata, alesaggioCorsa, potenza, coppia, alimentazione, raffreddamento, cambio, telaio,
            sospAnt, sospPost, freni, pneumatici, peso, velocita, notaDati,
            "fotoAlt": foto.alt, "fotoRef": foto.asset._ref,
            "altreFoto": altreFoto[]{ _key, alt, didascalia, "ref": asset._ref } },
  "campionati": *[_type == "campionato"]{ _id, nome, "fotoAlt": foto.alt, "fotoRef": foto.asset._ref }
}`);

let n = 0;
for (const g of dati.gallery) if (g.ref) { await scarica(g.ref, `g_${g._id.replace(/\W/g, "_")}`); n++; }
for (const m of dati.moto) {
  if (m.fotoRef) { await scarica(m.fotoRef, `m_${m._id.replace(/\W/g, "_")}`); n++; }
  for (const f of m.altreFoto ?? []) if (f.ref) { await scarica(f.ref, `m_${m._id.replace(/\W/g, "_")}_${f._key}`); n++; }
}
for (const c of dati.campionati) if (c.fotoRef) { await scarica(c.fotoRef, `c_${c._id.replace(/\W/g, "_")}`); n++; }

fs.writeFileSync(path.join(CARTELLA, "elenco.json"), JSON.stringify(dati, null, 1));
console.log(`FATTO: ${dati.gallery.length} foto gallery, ${dati.moto.length} moto, ${dati.campionati.length} campionati, ${n} anteprime.`);
console.log('Ora scrivi a Claude: "esportato".');
