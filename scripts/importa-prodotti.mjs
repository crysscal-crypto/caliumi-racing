/**
 * Crea in Sanity i prodotti Amazon a partire dai link.
 *
 * Uso (dalla cartella del progetto):
 *   node --env-file=.env.local scripts/importa-prodotti.mjs
 *
 * In scripts/prodotti.txt scrivi un link Amazon per riga.
 * Facoltativo: la categoria davanti al link (caschi, guanti, tute, stivali, accessori).
 * I prodotti già presenti (stesso codice ASIN) vengono saltati: puoi rilanciarlo senza rischi.
 */

import fs from "node:fs";
import { createClient } from "@sanity/client";

const FILE = "scripts/prodotti.txt";
const CATEGORIE = ["caschi", "guanti", "tute", "stivali", "accessori"];
const HOST_AMAZON = /(^|\.)(amazon\.[a-z.]+|amzn\.(to|eu)|a\.co|link\.amazon)$/i;

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

async function risolviLink(inizio) {
  let url = inizio;
  for (let i = 0; i < 6; i++) {
    if (/\/(dp|gp\/product)\/[A-Z0-9]{10}/i.test(url)) return url;
    const risposta = await fetch(url, { redirect: "manual" });
    const prossimo = risposta.headers.get("location");
    if (!prossimo) break;
    url = new URL(prossimo, url).toString();
    if (!HOST_AMAZON.test(new URL(url).hostname)) break;
  }
  return url;
}

function leggiLink(url) {
  const m = url.match(
    /^https?:\/\/[^/]+\/(?:([^/]+)\/)?(?:dp|gp\/product)\/([A-Z0-9]{10})/i
  );
  if (!m) return null;
  const asin = m[2].toUpperCase();
  let nome = "";
  if (m[1]) {
    try {
      nome = decodeURIComponent(m[1]).replace(/-+/g, " ").trim();
    } catch {
      nome = m[1].replace(/-+/g, " ").trim();
    }
  }
  if (!nome) nome = `Prodotto ${asin}`;
  return { asin, nome: nome.slice(0, 140) };
}

function indovinaCategoria(nome) {
  const n = nome.toLowerCase();
  if (/\b(casco|caschi|helmet)\b/.test(n)) return "caschi";
  if (/\b(guanti|guanto|gloves?)\b/.test(n)) return "guanti";
  if (/\b(giacca|giubbotto|tuta|pantaloni|jeans|gilet)\b/.test(n)) return "tute";
  if (/\b(stivali|stivaletti|scarpe|boots?)\b/.test(n)) return "stivali";
  return "accessori";
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.log(`Non trovo il file ${FILE}. Crealo e scrivici un link Amazon per riga.`);
    return;
  }

  const righe = fs
    .readFileSync(FILE, "utf8")
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter((r) => r && !r.startsWith("#"));

  if (righe.length === 0) {
    console.log("Nessun link trovato in scripts/prodotti.txt.");
    return;
  }

  console.log(`Trovate ${righe.length} righe.\n`);
  let creati = 0;

  for (const [i, riga] of righe.entries()) {
    const anteprima = riga.length > 90 ? `${riga.slice(0, 90)}...` : riga;
    console.log(`[${i + 1}/${righe.length}] ${anteprima}`);
    try {
      const parti = riga.split(/\s+/);
      let categoria;
      if (CATEGORIE.includes(parti[0].toLowerCase())) {
        categoria = parti.shift().toLowerCase();
      }

      let link = parti[0];
      if (!link) {
        throw new Error("Manca il link.");
      }
      // Il browser copia gli indirizzi senza https://: lo aggiungiamo noi
      if (!/^https?:\/\//i.test(link)) {
        link = `https://${link}`;
      }

      let host;
      try {
        host = new URL(link).hostname;
      } catch {
        throw new Error("Il link non è valido.");
      }
      if (!HOST_AMAZON.test(host)) {
        throw new Error("Il link non è di Amazon.");
      }

      const finale = await risolviLink(link);
      const dati = leggiLink(finale);
      if (!dati) {
        throw new Error(
          "Non trovo il codice ASIN. Apri il prodotto su Amazon.it e copia l'indirizzo dalla barra del browser (quello con /dp/)."
        );
      }

      const esistente = await client.fetch(
        `*[_type == "prodotto" && asin == $asin][0]._id`,
        { asin: dati.asin }
      );
      if (esistente) {
        console.log("  Salto: questo prodotto esiste già.\n");
        continue;
      }

      const cat = categoria || indovinaCategoria(dati.nome);
      await client.create({
        _type: "prodotto",
        nome: dati.nome,
        categoria: cat,
        asin: dati.asin,
        inEvidenza: false,
      });
      creati++;
      console.log(`  Creato: ${dati.nome} (${cat}, ${dati.asin})\n`);
    } catch (errore) {
      console.log(`  ERRORE: ${errore.message}\n`);
    }
  }

  console.log(`Finito: ${creati} prodotti creati su ${righe.length} righe.`);
  console.log(
    "Apri lo Studio per controllare i nomi, aggiungere la descrizione e la foto."
  );
}

main();