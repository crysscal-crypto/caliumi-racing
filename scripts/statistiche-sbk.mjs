// Crea src/data/statistiche-sbk.json con le statistiche storiche del Mondiale Superbike
// e delle altre classi (Supersport, Superstock 1000 e 600, Supersport 300...).
// Solo le stagioni CONCLUSE: la stagione in corso viene aggiunta in automatico dal sito.
// Uso (dalla cartella del progetto):  node scripts/statistiche-sbk.mjs
// Durata: circa 5-15 minuti. Non tocca Sanity.

import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "https://api.wsbk.pulselive.com";
const PARALLELE = 5;
const CLASSI = { SBK: 1, SSP: 2, SPB: 3, SSP300: 4, SST: 5, ST6: 6, WCR: 7 };

const ISO = {
  ITA: "IT", GBR: "GB", ESP: "ES", AUS: "AU", USA: "US", JPN: "JP", FRA: "FR", GER: "DE", DEU: "DE",
  NED: "NL", NLD: "NL", TUR: "TR", RSA: "ZA", ZAF: "ZA", ARG: "AR", POR: "PT", PRT: "PT", BEL: "BE",
  SUI: "CH", CHE: "CH", AUT: "AT", CZE: "CZ", SWE: "SE", FIN: "FI", NZL: "NZ", CAN: "CA", BRA: "BR",
  IRL: "IE", NOR: "NO", DEN: "DK", DNK: "DK", HUN: "HU", POL: "PL", SVK: "SK", SLO: "SI", SVN: "SI",
  CRO: "HR", HRV: "HR", RUS: "RU", UKR: "UA", THA: "TH", MAS: "MY", MYS: "MY", INA: "ID", IDN: "ID",
  IND: "IN", PHI: "PH", PHL: "PH", CHN: "CN", KOR: "KR", VEN: "VE", COL: "CO", MEX: "MX", CHI: "CL",
  CHL: "CL", URU: "UY", URY: "UY", GRE: "GR", GRC: "GR", ISR: "IL", EST: "EE", LAT: "LV", LVA: "LV",
  LTU: "LT", QAT: "QA", UAE: "AE", ARE: "AE", SMR: "SM", MON: "MC", MCO: "MC", LUX: "LU", AND: "AD",
  ROU: "RO", BUL: "BG", BGR: "BG", SRB: "RS", KAZ: "KZ", IRI: "IR", IRN: "IR", EGY: "EG", PER: "PE",
  ECU: "EC", CRC: "CR", GUA: "GT", JAM: "JM", SGP: "SG", TPE: "TW", HKG: "HK", VIE: "VN", VNM: "VN",
  KSA: "SA", SAU: "SA", ISL: "IS", MLT: "MT", CYP: "CY", BIH: "BA", MKD: "MK", ALB: "AL", MNE: "ME",
  BLR: "BY", GEO: "GE", ARM: "AM", AZE: "AZ",
};
const iso2 = (x) => (x ? ISO[x.toUpperCase()] ?? (x.length === 2 ? x.toUpperCase() : "") : "");

const NOMI_COSTRUTTORI = {
  DUCAT: "Ducati", YAMAH: "Yamaha", KAWAS: "Kawasaki", HONDA: "Honda", SUZUK: "Suzuki",
  APRIL: "Aprilia", BMW: "BMW", BIMOT: "Bimota", MVAGU: "MV Agusta", MV: "MV Agusta",
  TRIUM: "Triumph", KTM: "KTM", BENEL: "Benelli", PETRO: "Petronas", BUELL: "Buell", EBR: "EBR",
  QJMOT: "QJMotor", CFMOT: "CFMoto",
};
const nomeCostruttore = (id, nome) => nome || NOMI_COSTRUTTORI[id] || id.charAt(0) + id.slice(1).toLowerCase();

const MARCHE = [
  [/ducati/i, "Ducati"], [/yamaha/i, "Yamaha"], [/kawasaki/i, "Kawasaki"], [/honda/i, "Honda"],
  [/suzuki/i, "Suzuki"], [/aprilia/i, "Aprilia"], [/bmw/i, "BMW"], [/bimota/i, "Bimota"],
  [/mv\s*agusta/i, "MV Agusta"], [/triumph/i, "Triumph"], [/\bktm\b/i, "KTM"], [/petronas/i, "Petronas"],
  [/benelli/i, "Benelli"], [/buell|\bebr\b/i, "Buell"], [/qjmotor/i, "QJMotor"], [/cfmoto/i, "CFMoto"],
];
const marcaDaTeam = (t) => MARCHE.find(([re]) => re.test(t || ""))?.[1];

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

const rif = (r, campo) => r.relationships?.[campo]?.data?.id;
const inclusi = (risp) => {
  const m = new Map();
  for (const x of risp?.included ?? []) m.set(`${x.type.replace(/s$/, "")}:${x.id}`, x.attributes);
  return m;
};
const nomePilota = (a) => `${(a?.name ?? "").trim()} ${(a?.surname ?? "").trim()}`.trim();
const eGara = (sigla) => /^RC\d?$/.test(sigla) || sigla === "SPRC";
const siglaVera = (s) => {
  const nome = (s.attributes.brief_description || s.attributes.description || "").trim();
  if (/superpole\s*race/i.test(nome)) return "SPRC";
  const m = nome.match(/^\s*race\s*(\d)/i);
  if (m) return `RC${m[1]}`;
  const sigla = (s.attributes.short_name || "").trim().toUpperCase();
  if (/^\s*race\b/i.test(nome) || sigla === "RACE") return "RC";
  return sigla;
};
const rossa = (s) => /\bred\b|heat/i.test(s.attributes.brief_description ?? "");

// ---------- Stagioni ----------
const stagioni = (await api("/wsbk-events/v1/seasons"))?.data ?? [];
const concluse = stagioni
  .filter((s) => s.attributes.current !== true)
  .map((s) => Number(s.id))
  .filter((a) => a > 1900)
  .sort((a, b) => a - b);

if (concluse.length === 0) {
  console.error("Impossibile leggere le stagioni. Controlla la connessione e riprova.");
  process.exit(1);
}
console.log(`Stagioni da elaborare: ${concluse.length} (${concluse[0]}-${concluse.at(-1)})`);

const classi = {};
function classe(id) {
  return (classi[id] ??= {
    id,
    anni: [],
    gare: 0,
    primaGara: null,
    piloti: {},
    costruttori: {},
    titoliCostruttori: {},
    nazioni: {},
    campioni: [],
    campioniCostruttori: [],
    recordStagione: [],
  });
}

let fatte = 0;
for (const anno of concluse) {
  const [cat, rnd] = await Promise.all([
    api(`/wsbk-events/v1/seasons/${anno}/categories`),
    api(`/wsbk-events/v1/seasons/${anno}/rounds`),
  ]);
  const categorie = (cat?.data ?? []).map((c) => c.id).filter((id) => CLASSI[id]);
  const rounds = (rnd?.data ?? [])
    .map((r) => ({
      sigla: r.attributes.source_id,
      nome: (r.attributes.brief_description || r.attributes.description || r.attributes.source_id).trim(),
      circuito: (r.attributes.name || "").trim(),
      ordine: r.attributes.sequence_order ?? 0,
      inizio: r.attributes.start_date ?? "",
      categorie: (r.relationships?.categories?.data ?? []).map((c) => c.id),
    }))
    .sort((a, b) => a.ordine - b.ordine || a.inizio.localeCompare(b.inizio));

  // Sessioni di ogni round (una chiamata per round, contiene tutte le classi)
  const sessioniRound = await inParallelo(rounds, async (r) => (await api(`/wsbk-events/v1/seasons/${anno}/rounds/${r.sigla}/sessions`))?.data ?? []);

  for (const idCat of categorie) {
    const c = classe(idCat);
    const vittorieStagione = {};
    let gareStagione = 0;

    // Elenco gare della classe, in ordine
    const daLeggere = [];
    rounds.forEach((r, i) => {
      if (r.categorie.length && !r.categorie.includes(idCat)) return;
      const delle = sessioniRound[i].filter((s) => s.relationships?.category?.data?.id === idCat && eGara(siglaVera(s)));
      const perSigla = new Map();
      for (const s of delle) {
        const k = siglaVera(s);
        const p = perSigla.get(k);
        if (!p || (rossa(p) && !rossa(s)) || (rossa(p) === rossa(s) && (s.attributes.incremental_id ?? 0) > (p.attributes.incremental_id ?? 0))) perSigla.set(k, s);
      }
      [...perSigla.values()]
        .sort((a, b) => (a.attributes.start_date_utc ?? "").localeCompare(b.attributes.start_date_utc ?? ""))
        .forEach((s) => daLeggere.push({ round: r, codice: s.attributes.source_id }));
    });

    const risultati = await inParallelo(daLeggere, async (g) => {
      const risp = await api(`/wsbk-results/v1/seasons/${anno}/categories/${idCat}/rounds/${g.round.sigla}/sessions/${g.codice}/results`);
      return { ...g, risp };
    });

    for (const { round, risp } of risultati) {
      const righe = risp?.data ?? [];
      if (righe.length === 0) continue;
      const inc = inclusi(risp);
      gareStagione++;
      c.gare++;
      if (!c.primaGara) c.primaGara = { anno, round: round.nome, circuito: round.circuito };

      for (const r of righe) {
        const k = rif(r, "rider");
        if (!k) continue;
        const pil = inc.get(`rider:${k}`) ?? {};
        const team = inc.get(`team:${rif(r, "team")}`)?.name ?? "";
        const p = (c.piloti[k] ??= { n: nomePilota(pil) || k, i: iso2(pil.country_iso), v: 0, p: 0, g: 0, t: [], a: [anno, anno] });
        if (nomePilota(pil)) p.n = nomePilota(pil);
        p.g++;
        p.a[1] = anno;
        const classificato = /^classified$/i.test(r.attributes.status ?? "");
        const pos = classificato ? r.attributes.position : null;
        if (pos >= 1 && pos <= 3) p.p++;
        if (pos === 1) {
          p.v++;
          vittorieStagione[k] = (vittorieStagione[k] ?? 0) + 1;
          const marca = marcaDaTeam(team);
          if (marca) c.costruttori[marca] = (c.costruttori[marca] ?? 0) + 1;
          if (p.i) c.nazioni[p.i] = (c.nazioni[p.i] ?? 0) + 1;
        }
      }
    }

    if (gareStagione === 0) continue;
    c.anni.push(anno);

    // Campione piloti
    const cl = await api(`/wsbk-results/v1/seasons/${anno}/categories/${idCat}/riders/standings`);
    const primo = (cl?.data ?? []).find((x) => x.attributes.position === 1);
    if (primo) {
      const inc = inclusi(cl);
      const k = rif(primo, "rider");
      const pil = inc.get(`rider:${k}`) ?? {};
      const team = inc.get(`team:${rif(primo, "team")}`)?.name ?? "";
      c.campioni.push({ anno, k, n: nomePilota(pil) || c.piloti[k]?.n || k, i: iso2(pil.country_iso), c: team, pt: primo.attributes.points ?? null });
      if (c.piloti[k] && !c.piloti[k].t.includes(anno)) c.piloti[k].t.push(anno);
    }

    // Campione costruttori
    const cc = await api(`/wsbk-results/v1/seasons/${anno}/categories/${idCat}/manufacturers/standings`);
    const primoC = (cc?.data ?? []).find((x) => x.attributes.position === 1);
    if (primoC) {
      const inc = inclusi(cc);
      const mid = rif(primoC, "manufacturer");
      const nome = nomeCostruttore(mid, inc.get(`manufacturer:${mid}`)?.name);
      c.campioniCostruttori.push({ anno, n: nome, pt: primoC.attributes.points ?? null });
      c.titoliCostruttori[nome] = (c.titoliCostruttori[nome] ?? 0) + 1;
    }

    const [kMax, vMax] = Object.entries(vittorieStagione).sort((a, b) => b[1] - a[1])[0] ?? [];
    if (kMax) c.recordStagione.push({ anno, k: kMax, n: c.piloti[kMax].n, i: c.piloti[kMax].i, v: vMax, gare: gareStagione });
  }

  fatte++;
  console.log(`${anno} fatto (${fatte}/${concluse.length})`);
}

mkdirSync("src/data", { recursive: true });
const uscita = {
  aggiornato: new Date().toISOString(),
  ultimaStagione: concluse.at(-1),
  classi: Object.values(classi).sort((a, b) => CLASSI[a.id] - CLASSI[b.id]),
};
writeFileSync("src/data/statistiche-sbk.json", JSON.stringify(uscita));
console.log("\nFATTO: creato src/data/statistiche-sbk.json");
