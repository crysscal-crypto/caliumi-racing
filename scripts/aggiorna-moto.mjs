/**
 * Completa i dati tecnici delle moto da corsa in "Le mie moto".
 * Riempie SOLO i campi vuoti: quello che hai già scritto tu non viene toccato.
 * Corregge solo il motore della Honda RS 250 (V di 75°, non 90°).
 *
 * Uso:  node --env-file=.env.local scripts/aggiorna-moto.mjs
 */
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2025-01-01",
  useCdn: false,
});

const NOTA = "Dati indicativi del modello da corsa di serie: la moto di gara era preparata dal team e poteva differire.";

const DATI = {
  "honda-rs-125-r-1992": {
    alimentazione: "carburatore",
    peso: "circa 70 kg (a secco)",
  },
  "aprilia-rs-125-1994": {
    motore: "monocilindrico 2 tempi, aspirazione a disco rotante",
    alesaggioCorsa: "54 x 54,5 mm",
    potenza: "circa 42 CV",
    alimentazione: "carburatore",
    peso: "circa 70 kg (a secco)",
  },
  "yamaha-tz-125-1995": {
    motore: "monocilindrico 2 tempi",
    potenza: "42 CV (dato Yamaha TZ125 1994)",
    alimentazione: "carburatore",
    telaio: "Deltabox in alluminio",
    peso: "circa 70 kg (a secco)",
  },
  "yamaha-tz-250-1996": {
    motore: "bicilindrico a V di 90°, 2 tempi, derivato dalla YZR 250 da Gran Premio",
    potenza: "circa 90 CV",
    alimentazione: "due carburatori",
    pneumatici: "17 pollici anteriore e posteriore",
    peso: "circa 100 kg (a secco)",
  },
  "honda-rs-250-1998": {
    potenza: "oltre 90 CV",
    alimentazione: "due carburatori",
    peso: "circa 101 kg (a secco)",
  },
  "aprilia-rsv-250-1999": {
    potenza: "circa 100 CV",
    alimentazione: "due carburatori",
    peso: "circa 95 kg (a secco)",
  },
  "ducati-996-rs-2002": {
    potenza: "circa 170 CV",
    cambio: "6 marce, frizione antisaltellamento",
    sospAnt: "forcella Öhlins a steli rovesciati",
    sospPost: "monoammortizzatore Öhlins",
    freni: "Brembo, doppio disco anteriore",
    pneumatici: "cerchi da 17 pollici, gomme Dunlop",
    peso: "circa 165 kg",
  },
};

let fatti = 0;
for (const [slug, campi] of Object.entries(DATI)) {
  const base = `moto-${slug}`;
  for (const id of [base, `drafts.${base}`]) {
    const esiste = await client.fetch(`count(*[_id == $id])`, { id });
    if (!esiste) continue;
    let p = client.patch(id).setIfMissing({ ...campi, notaDati: NOTA });
    if (slug === "honda-rs-250-1998") p = p.set({ motore: "bicilindrico a V di 75°, 2 tempi" });
    await p.commit();
    fatti++;
    console.log(`Aggiornata: ${id}`);
  }
}
console.log(`\nFATTO: ${fatti} schede aggiornate. Ricarica lo Studio per vederle.`);
