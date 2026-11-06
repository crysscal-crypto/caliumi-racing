// Crea src/data/statistiche-motogp.json con le statistiche storiche del Motomondiale
// (tutte le stagioni concluse + le gare già disputate della stagione in corso).
// Gira da solo ogni lunedì su GitHub (.github/workflows/statistiche-motogp.yml).
// Uso (dalla cartella del progetto):  node scripts/statistiche-motogp.mjs
// Durata: circa 10-20 minuti. Non tocca Sanity.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

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

// Classifiche mancanti nell'archivio ufficiale, recuperate da Wikipedia (scripts/integra-motogp.mjs)
const INTEGRAZIONI = existsSync("src/data/motogp-integrazioni.json")
  ? JSON.parse(readFileSync("src/data/motogp-integrazioni.json", "utf8"))
  : {};
const normNome = (n) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const perNome = {}; // nome pilota → chiave ufficiale (per non dividere lo stesso pilota in due)

function chiavePilota(r) {
  if (r.wiki) return perNome[normNome(r.full_name)] ?? `nome:${normNome(r.full_name)}`;
  const k = r.riders_api_uuid || r.riders_id || r.full_name;
  perNome[normNome(r.full_name)] ??= k;
  return k;
}

const daWikipedia = (righe) =>
  righe.map((r) => ({
    rider: { full_name: r.r, wiki: true, country: r.c ? { iso: r.c } : undefined },
    position: r.p,
    points: r.pt ?? 0,
    constructor: r.m ? { name: r.m } : undefined,
  }));

const stagioni = (await api("/seasons")) ?? [];
// tutte le stagioni, compresa quella in corso (solo le gare già finite)
const concluse = stagioni.filter((s) => s.year <= new Date().getFullYear()).sort((a, b) => a.year - b.year);
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
      circuiti: {}, // circuito → { pilota: vittorie }
      dal: {}, // primo anno con dati di pole, giri veloci e Sprint
      _serie: { k: null, n: 0 }, // vittorie consecutive in corso (solo per il calcolo)
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
      const ufficiale = cl?.classification ?? [];
      const righe = ufficiale.length ? ufficiale : daWikipedia(INTEGRAZIONI[gara.id]?.righe ?? []);
      const record = cl?.records ?? [];
      const sprint = sessioni.filter((s) => s.type === "SPR").pop();
      const clSprint = sprint ? await api(`/session/${sprint.id}/classification?test=false`) : null;
      return {
        ev,
        righe,
        pole: record.find((x) => x.type === "poleLap")?.rider ?? null,
        veloce: record.find((x) => x.type === "fastestLap")?.rider ?? null,
        sprint: clSprint?.classification ?? [],
      };
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
          pp: 0, // pole position
          gv: 0, // giri più veloci in gara
          ht: 0, // hat-trick: pole + vittoria + giro più veloce
          rt: 0, // ritiri / non classificato
          vc: 0, // massimo di vittorie consecutive
          sv: 0, // vittorie Sprint
          sp: 0, // podi Sprint
        });
        p.n = riga.rider.full_name;
        p.g++;
        p.a[1] = stagione.year;
        puntiStagione[k] = (puntiStagione[k] ?? 0) + (riga.points ?? 0);
        if (riga.position >= 1 && riga.position <= 3) p.p++;
        if (!riga.rider.wiki && (riga.position === null || riga.status === "OUTSTND")) p.rt++;
        if (riga.position === 1) {
          p.v++;
          // vittorie consecutive nella classe
          if (c._serie.k === k) c._serie.n++;
          else c._serie = { k, n: 1 };
          if (c._serie.n > p.vc) p.vc = c._serie.n;
          const circ = r.ev.circuit?.name;
          if (circ) {
            const cc = (c.circuiti[circ] ??= {});
            cc[k] = (cc[k] ?? 0) + 1;
          }
          vittorieStagione[k] = (vittorieStagione[k] ?? 0) + 1;
          const cos = riga.constructor?.name;
          if (cos) c.costruttori[cos] = (c.costruttori[cos] ?? 0) + 1;
          const iso = riga.rider.country?.iso;
          if (iso) c.nazioni[iso] = (c.nazioni[iso] ?? 0) + 1;
        }
      }

      const vincitore = r.righe.find((x) => x.position === 1)?.rider;
      const kVinc = vincitore ? chiavePilota(vincitore) : null;
      const kPole = r.pole ? r.pole.riders_api_uuid || r.pole.riders_id || null : null;
      const kVeloce = r.veloce ? r.veloce.riders_api_uuid || r.veloce.riders_id || null : null;
      if (kPole && c.piloti[kPole]) {
        c.piloti[kPole].pp++;
        c.dal.pole ??= stagione.year;
      }
      if (kVeloce && c.piloti[kVeloce]) {
        c.piloti[kVeloce].gv++;
        c.dal.veloce ??= stagione.year;
      }
      if (kVinc && kVinc === kPole && kVinc === kVeloce) c.piloti[kVinc].ht++;
      for (const riga of r.sprint) {
        if (!riga.rider || !riga.position || riga.position > 3) continue;
        const k = chiavePilota(riga.rider);
        if (!c.piloti[k]) continue; // conto solo chi ha anche corso le gare lunghe
        c.piloti[k].sp++;
        if (riga.position === 1) c.piloti[k].sv++;
        c.dal.sprint ??= stagione.year;
      }
    }

    if (gpClasse === 0) continue;
    c.anni.push(stagione.year);
    if (stagione.current) {
      // stagione in corso: niente campione, ma il record di vittorie sì
      const [kM, vM] = Object.entries(vittorieStagione).sort((a, b) => b[1] - a[1])[0] ?? [];
      if (kM) c.recordStagione.push({ anno: stagione.year, k: kM, n: c.piloti[kM].n, i: c.piloti[kM].i, v: vM, gp: gpClasse });
      continue;
    }

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
for (const c of Object.values(classi)) delete c._serie;
const uscita = {
  aggiornato: new Date().toISOString(),
  // il sito aggiunge da solo solo le stagioni successive a questa
  ultimaStagione: concluse.at(-1).year,
  classi: Object.values(classi).sort((a, b) => a.legacy - b.legacy),
};
if (uscita.classi.reduce((t, c) => t + c.gp, 0) < 1000) {
  console.error("Dati incompleti (API non raggiungibile?): file NON aggiornato.");
  process.exit(1);
}
writeFileSync("src/data/statistiche-motogp.json", JSON.stringify(uscita));
console.log("\nFATTO: creato src/data/statistiche-motogp.json");
