// Crea src/data/statistiche-motogp.json con le statistiche storiche del Motomondiale
// (tutte le stagioni CONCLUSE). La stagione in corso viene aggiunta in automatico dal sito.
// Uso (dalla cartella del progetto):  node scripts/statistiche-motogp.mjs
// Durata: circa 10-20 minuti. Non tocca Sanity.

import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "https://api.motogp.pulselive.com/motogp/v1/results";
const PARALLELE = 6;

async function api(percorso, tentativi = 4) {
  for (let i = 0; i < tentativi; i++) {
    try {
      const res = await fetch(BASE + percorso, {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 CaliumiRacing-statistiche" },
      });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch {}
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

async function inParallelo(elementi, fn) {
  const risultati = new Array(elementi.length);
  let prossimo = 0;
  async function lavoratore() {
    while (prossimo < elementi.length) {
      const i = prossimo++;
      risultati[i] = await fn(elementi[i], i);
    }
  }
  await Promise.all(Array.from({ length: PARALLELE }, lavoratore));
  return risultati;
}

const chiavePilota = (r) => r.riders_api_uuid || r.riders_id || r.full_name;

const stagioni = (await api("/seasons")) ?? [];
const concluse = stagioni.filter((s) => !s.current).sort((a, b) => a.year - b.year);
if (concluse.length === 0) {
  console.error("Impossibile leggere le stagioni. Controlla la connessione e riprova.");
  process.exit(1);
}
console.log(`Stagioni da elaborare: ${concluse.length} (${concluse[0].year}-${concluse.at(-1).year})`);

const classi = {}; // per id categoria

function classe(cat) {
  const nome = cat.name.replace(/™/g, "");
  if (!classi[cat.id]) {
    classi[cat.id] = {
      id: cat.id,
      legacy: cat.legacy_id,
      nomi: [],
      anni: [],
      gp: 0,
      primoGP: null,
      piloti: {},
      costruttori: {},
      nazioni: {},
      campioni: [],
      recordStagione: [],
    };
  }
  const c = classi[cat.id];
  if (!c.nomi.includes(nome)) c.nomi.push(nome);
  return c;
}

let fatte = 0;
for (const stagione of concluse) {
  const [categorie, eventi] = await Promise.all([
    api(`/categories?seasonUuid=${stagione.id}`),
    api(`/events?seasonUuid=${stagione.id}&isFinished=true`),
  ]);
  const gare = (eventi ?? []).filter((e) => !e.test).sort((a, b) => a.date_start.localeCompare(b.date_start));

  for (const cat of categorie ?? []) {
    const c = classe(cat);
    const vittorieStagione = {};
    const puntiStagione = {};
    let gpClasse = 0;

    const risultati = await inParallelo(gare, async (ev) => {
      const sessioni = (await api(`/sessions?eventUuid=${ev.id}&categoryUuid=${cat.id}`)) ?? [];
      const gara = sessioni.filter((s) => s.type === "RAC").pop();
      if (!gara) return null;
      const cl = await api(`/session/${gara.id}/classification?test=false`);
      return { ev, righe: cl?.classification ?? [] };
    });

    for (const r of risultati) {
      if (!r || r.righe.length === 0) continue;
      gpClasse++;
      c.gp++;
      if (!c.primoGP) c.primoGP = { anno: stagione.year, gp: r.ev.name, circuito: r.ev.circuit?.name ?? "" };
      for (const riga of r.righe) {
        if (!riga.rider) continue;
        const k = chiavePilota(riga.rider);
        const p = (c.piloti[k] ??= {
          n: riga.rider.full_name,
          i: riga.rider.country?.iso ?? "",
          v: 0, // vittorie
          p: 0, // podi
          g: 0, // gare
          t: [], // anni titoli
          a: [stagione.year, stagione.year], // primo e ultimo anno
        });
        p.n = riga.rider.full_name;
        p.g++;
        p.a[1] = stagione.year;
        puntiStagione[k] = (puntiStagione[k] ?? 0) + (riga.points ?? 0);
        if (riga.position >= 1 && riga.position <= 3) p.p++;
        if (riga.position === 1) {
          p.v++;
          vittorieStagione[k] = (vittorieStagione[k] ?? 0) + 1;
          const cos = riga.constructor?.name;
          if (cos) c.costruttori[cos] = (c.costruttori[cos] ?? 0) + 1;
          const iso = riga.rider.country?.iso;
          if (iso) c.nazioni[iso] = (c.nazioni[iso] ?? 0) + 1;
        }
      }
    }

    if (gpClasse === 0) continue;
    c.anni.push(stagione.year);

    // Campione: dalla classifica ufficiale, altrimenti dai punti sommati
    const classifica = await api(
      `/standings?seasonUuid=${stagione.id}&categoryUuid=${cat.id}&type=rider`
    );
    const primo = classifica?.classification?.find((x) => x.position === 1);
    let campione;
    if (primo?.rider) {
      campione = {
        k: chiavePilota(primo.rider),
        n: primo.rider.full_name,
        i: primo.rider.country?.iso ?? "",
        c: primo.constructor?.name ?? "",
        pt: primo.points ?? null,
      };
    } else {
      const [k, pt] = Object.entries(puntiStagione).sort((a, b) => b[1] - a[1])[0] ?? [];
      if (k) campione = { k, n: c.piloti[k].n, i: c.piloti[k].i, c: "", pt };
    }
    if (campione) {
      c.campioni.push({ anno: stagione.year, ...campione, cl: cat.name.replace(/™/g, "") });
      if (c.piloti[campione.k]) c.piloti[campione.k].t.push(stagione.year);
    }

    const [kMax, vMax] = Object.entries(vittorieStagione).sort((a, b) => b[1] - a[1])[0] ?? [];
    if (kMax) c.recordStagione.push({ anno: stagione.year, k: kMax, n: c.piloti[kMax].n, i: c.piloti[kMax].i, v: vMax, gp: gpClasse });
  }

  fatte++;
  console.log(`${stagione.year} fatto (${fatte}/${concluse.length})`);
}

mkdirSync("src/data", { recursive: true });
const uscita = {
  aggiornato: new Date().toISOString(),
  ultimaStagione: concluse.at(-1).year,
  classi: Object.values(classi).sort((a, b) => a.legacy - b.legacy),
};
writeFileSync("src/data/statistiche-motogp.json", JSON.stringify(uscita));
console.log("\nFATTO: creato src/data/statistiche-motogp.json");
