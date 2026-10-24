// Controlla TUTTE le gare del Motomondiale (1949 → stagione scorsa) e, dove l'archivio ufficiale MotoGP
// non ha la classifica, la recupera da Wikipedia (licenza CC BY-SA).
// Crea:
//   src/data/motogp-integrazioni.json  → classifiche recuperate (le usa il sito)
//   src/data/motogp-mancanti.json      → gare ancora senza classifica (report)
// Uso (dalla cartella del progetto):  node scripts/integra-motogp.mjs
// Durata: 15-30 minuti (va piano per non farsi bloccare). Se lo interrompi, riparte da dove era arrivato.
// Alla fine fa da solo git add / commit / push dei due file (salta con --no-push). Non tocca Sanity.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BASE = "https://api.motogp.pulselive.com/motogp/v1/results";
const WIKI = "https://en.wikipedia.org/w/index.php";
const UA = "CaliumiRacingBot/1.0 (https://www.caliumiracing.com; info@caliumiracing.com)";
const PARALLELE = 3;
const CACHE = "scripts/.cache-integra-motogp.json";
const OUT_DATI = "src/data/motogp-integrazioni.json";
const OUT_REPORT = "src/data/motogp-mancanti.json";
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- Rete ----------------
async function api(percorso) {
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(BASE + percorso, { headers: { Accept: "application/json", "User-Agent": UA } });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
      if (res.status === 429) await pausa(20000 * (i + 1)); // bloccati: aspetto parecchio
    } catch {}
    await pausa(1500 * (i + 1));
  }
  throw new Error(`API non raggiungibile: ${percorso}`);
}

const wikiCache = new Map();
async function wikiRaw(titolo, salti = 0) {
  if (wikiCache.has(titolo)) return wikiCache.get(titolo);
  let testo = null;
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(`${WIKI}?title=${encodeURIComponent(titolo.replace(/ /g, "_"))}&action=raw`, {
        headers: { "User-Agent": UA },
      });
      if (res.status === 404) break;
      if (res.ok) {
        testo = await res.text();
        break;
      }
    } catch {}
    await pausa(2000 * (i + 1));
  }
  const red = testo?.match(/^#REDIRECT\s*\[\[([^\]|#]+)/i);
  if (red && salti < 2) testo = await wikiRaw(red[1].trim(), salti + 1);
  wikiCache.set(titolo, testo);
  await pausa(300);
  return testo;
}

async function inParallelo(elementi, n, fn) {
  const out = new Array(elementi.length);
  let k = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (k < elementi.length) {
        const i = k++;
        out[i] = await fn(elementi[i], i);
      }
    })
  );
  return out;
}

// ---------------- Nazioni ----------------
const ISO = {
  ITA: "IT", GBR: "GB", UK: "GB", ENG: "GB", SCO: "GB", WAL: "GB", NIR: "GB", ESP: "ES", SPA: "ES", AUS: "AU",
  USA: "US", JPN: "JP", JAP: "JP", FRA: "FR", GER: "DE", DEU: "DE", FRG: "DE", GDR: "DE", NED: "NL", NLD: "NL", HOL: "NL",
  BEL: "BE", SUI: "CH", CHE: "CH", SWI: "CH", AUT: "AT", CZE: "CZ", TCH: "CZ", SWE: "SE", FIN: "FI", NZL: "NZ",
  CAN: "CA", BRA: "BR", IRL: "IE", NOR: "NO", DEN: "DK", DNK: "DK", HUN: "HU", POL: "PL", SVK: "SK", SLO: "SI",
  SVN: "SI", CRO: "HR", HRV: "HR", YUG: "RS", RUS: "RU", URS: "RU", UKR: "UA", THA: "TH", MAS: "MY", MAL: "MY",
  MYS: "MY", INA: "ID", IDN: "ID", IND: "IN", CHN: "CN", KOR: "KR", VEN: "VE", COL: "CO", MEX: "MX", ARG: "AR",
  CHI: "CL", CHL: "CL", URU: "UY", RSA: "ZA", ZAF: "ZA", POR: "PT", PRT: "PT", SMR: "SM", RSM: "SM", LUX: "LU",
  AND: "AD", MON: "MC", TUR: "TR", QAT: "QA", UAE: "AE", ZIM: "ZW", RHO: "ZW", EST: "EE", LAT: "LV", LTU: "LT",
  ISR: "IL", GRE: "GR", ROU: "RO", BUL: "BG", SRB: "RS", KAZ: "KZ", PHI: "PH", SGP: "SG", TPE: "TW", HKG: "HK",
};
const NOMI_PAESI = {
  italy: "IT", "united kingdom": "GB", "great britain": "GB", britain: "GB", england: "GB", scotland: "GB", wales: "GB",
  "northern ireland": "GB", spain: "ES", australia: "AU", "united states": "US", usa: "US", japan: "JP", france: "FR",
  germany: "DE", "west germany": "DE", "east germany": "DE", netherlands: "NL", belgium: "BE", switzerland: "CH",
  austria: "AT", "czech republic": "CZ", czechoslovakia: "CZ", sweden: "SE", finland: "FI", "new zealand": "NZ",
  canada: "CA", brazil: "BR", ireland: "IE", norway: "NO", denmark: "DK", hungary: "HU", poland: "PL", slovakia: "SK",
  slovenia: "SI", croatia: "HR", yugoslavia: "RS", russia: "RU", "soviet union": "RU", ukraine: "UA", thailand: "TH",
  malaysia: "MY", indonesia: "ID", india: "IN", china: "CN", "south korea": "KR", venezuela: "VE", colombia: "CO",
  mexico: "MX", argentina: "AR", chile: "CL", uruguay: "UY", "south africa": "ZA", portugal: "PT", "san marino": "SM",
  "rhodesia and nyasaland": "ZW", luxembourg: "LU", andorra: "AD", monaco: "MC", turkey: "TR", qatar: "QA", rhodesia: "ZW", zimbabwe: "ZW",
  estonia: "EE", latvia: "LV", lithuania: "LT", israel: "IL", greece: "GR", romania: "RO", bulgaria: "BG",
  serbia: "RS", kazakhstan: "KZ", philippines: "PH", singapore: "SG", "chinese taipei": "TW", taiwan: "TW",
};
function naz(codice) {
  if (!codice) return "";
  const c = codice.trim();
  return ISO[c.toUpperCase()] ?? NOMI_PAESI[c.toLowerCase()] ?? (/^[A-Z]{2}$/.test(c) ? c : "");
}

// ---------------- Wikitext ----------------
function pulisci(t) {
  return t
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\{\{(?:sort|sortname|nts|ntsh)\|([^{}]*)\}\}/gi, (_, x) => x.split("|").pop())
    .replace(/\{\{(?:nowrap|small|nobr)\|([^{}]*)\}\}/gi, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// toglie gli attributi tipo  style="..." | valore  (il primo | fuori da [[ ]] e {{ }})
function senzaAttributi(cella) {
  let livello = 0;
  for (let i = 0; i < cella.length; i++) {
    const due = cella.slice(i, i + 2);
    if (due === "[[" || due === "{{") {
      livello++;
      i++;
    } else if (due === "]]" || due === "}}") {
      livello--;
      i++;
    } else if (cella[i] === "|" && livello === 0) {
      const prima = cella.slice(0, i);
      if (/=/.test(prima) && !/\[\[|\{\{/.test(prima)) return cella.slice(i + 1);
      return cella;
    }
  }
  return cella;
}

function dividi(riga, sep) {
  // divide per || o !! fuori da [[ ]] e {{ }}
  const parti = [];
  let livello = 0;
  let corrente = "";
  for (let i = 0; i < riga.length; i++) {
    const due = riga.slice(i, i + 2);
    if (due === "[[" || due === "{{") livello++;
    if (due === "]]" || due === "}}") livello--;
    if (livello <= 0 && (due === "||" || (sep === "!" && due === "!!"))) {
      parti.push(corrente);
      corrente = "";
      i++;
      continue;
    }
    corrente += riga[i];
  }
  parti.push(corrente);
  return parti;
}

function leggiTabella(testo) {
  const righe = [];
  let corrente = null;
  let intestazione = null;
  for (const l of testo.split("\n")) {
    const s = l.trim();
    if (s.startsWith("{|") || s.startsWith("|+") || s.startsWith("|}")) continue;
    if (s.startsWith("|-")) {
      if (corrente && corrente.length) righe.push(corrente);
      corrente = [];
      continue;
    }
    if (!s.startsWith("|") && !s.startsWith("!")) {
      if (corrente && corrente.length) corrente[corrente.length - 1].testo += " " + s; // cella su più righe
      continue;
    }
    const tipo = s[0];
    corrente ??= [];
    for (const p of dividi(s.slice(1), tipo)) {
      const grezzo = senzaAttributi(p);
      corrente.push({ th: tipo === "!", testo: grezzo });
    }
  }
  if (corrente && corrente.length) righe.push(corrente);

  for (const r of righe) {
    const etichette = r.map((c) => pulisci(c.testo).toLowerCase());
    if (r.every((c) => c.th) && etichette.some((e) => /rider|driver|pilot/.test(e))) {
      intestazione = etichette;
      break;
    }
  }
  if (!intestazione) return null;
  const dati = righe.filter((r) => r.length >= 3 && !r.every((c) => c.th));
  return { intestazione, dati };
}

function colonne(intestazione) {
  const trova = (re) => intestazione.findIndex((e) => re.test(e));
  return {
    pos: trova(/^(pos|place|fin)/),
    num: trova(/^(no\.?|#|num|number)$/),
    pilota: trova(/rider|driver|pilot|passenger/),
    team: trova(/team|entrant/),
    moto: trova(/manufacturer|constructor|bike|machine|motorcycle|make/),
    giri: trova(/^laps?$/),
    tempo: trova(/time|retired|gap/),
    punti: trova(/^p(oin)?ts\.?$|points/),
  };
}

function righeClassifica(tab) {
  const c = colonne(tab.intestazione);
  if (c.pilota < 0) return [];
  const out = [];
  for (const r of tab.dati) {
    // le righe con meno celle (es. pos come th + resto) restano allineate all'intestazione
    const cella = (i) => (i >= 0 && i < r.length ? r[i].testo : "");
    const pilotaGrezzo = cella(c.pilota);
    const pilota = pulisci(pilotaGrezzo);
    if (!pilota || /source|fonte/i.test(pilota)) continue;
    const flag = pilotaGrezzo.match(/\{\{\s*flag(?:icon|athlete|deco)?\s*\|\s*([^|}]+)/i);
    const posTesto = pulisci(cella(c.pos)).replace(/\.$/, "");
    const pos = /^\d+$/.test(posTesto) ? Number(posTesto) : null;
    if (pos === null && !/ret|dns|dnf|dsq|dnq|nc|exc|wd/i.test(posTesto)) continue;
    out.push({
      p: pos,
      s: pos === null ? posTesto.toUpperCase() : undefined,
      n: Number(pulisci(cella(c.num))) || undefined,
      r: pilota,
      c: naz(flag?.[1]),
      t: pulisci(cella(c.team)) || undefined,
      m: pulisci(cella(c.moto)) || undefined,
      l: Number(pulisci(cella(c.giri))) || undefined,
      tm: pulisci(cella(c.tempo)) || undefined,
      pt: Number(pulisci(cella(c.punti))) || undefined,
    });
  }
  return out;
}

const RE_CLASSE = (nome) => {
  const n = nome.replace(/™/g, "").toLowerCase().replace(/\s+/g, "");
  if (n === "motogp") return /moto\s*gp/i;
  if (/^moto[23e]$/.test(n)) return new RegExp(`moto\\s*${n.slice(4)}\\b`, "i");
  if (/side/.test(n)) return /side-?\s*car/i;
  const cc = n.match(/^(\d+)cc$/);
  if (cc) return new RegExp(`(^|\\D)${cc[1]}\\s*(cc|cm)`, "i");
  return new RegExp(nome, "i");
};

function classificaDaArticolo(testo, nomeClasse) {
  const re = RE_CLASSE(nomeClasse);
  const titoli = [...testo.matchAll(/^(={2,5})\s*([^=\n]+?)\s*\1\s*$/gm)];
  for (let i = 0; i < titoli.length; i++) {
    const [, uguali, titolo] = titoli[i];
    if (!re.test(titolo)) continue;
    if (/qualif|practice|grid|championship/i.test(titolo)) continue;
    // cerco la prima tabella prima del prossimo titolo dello stesso livello o superiore
    const inizio = titoli[i].index + titoli[i][0].length;
    let fine = testo.length;
    for (let k = i + 1; k < titoli.length; k++) {
      if (titoli[k][1].length <= uguali.length) {
        fine = titoli[k].index;
        break;
      }
    }
    const pezzo = testo.slice(inizio, fine);
    const a = pezzo.indexOf("{|");
    if (a < 0) continue;
    const b = pezzo.indexOf("\n|}", a);
    const tab = leggiTabella(pezzo.slice(a, b < 0 ? undefined : b + 3));
    if (!tab) continue;
    const righe = righeClassifica(tab);
    if (righe.filter((r) => r.p !== null).length >= 3) return righe;
  }
  return null;
}

// ---------------- Abbinamento GP → articolo Wikipedia ----------------
const DEMONIMI = {
  AU: ["australian"], JP: ["japanese", "pacific"], ES: ["spanish"], IT: ["italian", "nations"], SM: ["san marino"],
  DE: ["german"], NL: ["dutch"], FR: ["french"], GB: ["british", "ulster", "isle of man"], BE: ["belgian"],
  CZ: ["czech", "czechoslovak"], AT: ["austrian"], MY: ["malaysian"], AR: ["argentine"], BR: ["brazilian"],
  PT: ["portuguese"], QA: ["qatar"], US: ["united states", "american"], SE: ["swedish"], FI: ["finnish"],
  RS: ["yugoslavian"], HR: ["yugoslavian"], VE: ["venezuelan"], ZA: ["south african"], HU: ["hungarian"],
  CH: ["swiss"], TH: ["thailand", "thai"], IN: ["indian"], ID: ["indonesian"], KZ: ["kazakhstan"], TR: ["turkish"],
  CN: ["chinese"], CA: ["canadian"], IE: ["ulster", "irish"], SA: ["saudi"],
};
const VUOTE = new Set(["grand", "prix", "motorcycle", "gran", "premio", "grande", "premio", "of", "the", "de", "di", "the"]);
const parole = (t) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 4 && !VUOTE.has(w));

function punteggio(titolo, e) {
  const tw = parole(titolo.replace(/^\d{4}\s+/, ""));
  const nome = [...parole(e.name ?? ""), ...parole(e.sponsored_name ?? "")];
  const luogo = [...parole(e.circuit?.name ?? ""), ...parole(e.circuit?.place ?? ""), ...parole(e.country?.name ?? "")];
  const dem = (DEMONIMI[e.country?.iso] ?? []).flatMap(parole);
  const simile = (a, b) => a.slice(0, 5) === b.slice(0, 5);
  let p = 0;
  for (const w of tw) {
    if (nome.some((x) => simile(w, x))) p += 2;
    else if (luogo.some((x) => simile(w, x))) p += 1;
    else if (dem.includes(w)) p += 1;
  }
  return p;
}

async function articoliStagione(anno) {
  const testo = (await wikiRaw(`${anno} Grand Prix motorcycle racing season`)) ?? "";
  const visti = new Set();
  const elenco = [];
  for (const m of testo.matchAll(/\[\[\s*((\d{4})\s[^\]|#]*?(?:Grand Prix|TT)[^\]|#]*)/g)) {
    const t = m[1].trim();
    if (Number(m[2]) !== anno || /season|championship/i.test(t) || visti.has(t)) continue;
    visti.add(t);
    elenco.push(t);
  }
  return elenco;
}

function abbina(eventi, articoli) {
  const coppie = [];
  eventi.forEach((e, ie) =>
    articoli.forEach((a, ia) => coppie.push({ e, a, p: punteggio(a, e), d: Math.abs(ia - ie) }))
  );
  coppie.sort((x, y) => y.p - x.p || x.d - y.d);
  const usatiE = new Set();
  const usatiA = new Set();
  const mappa = new Map();
  for (const c of coppie) {
    if (c.p <= 0 || usatiE.has(c.e.id) || usatiA.has(c.a)) continue;
    usatiE.add(c.e.id);
    usatiA.add(c.a);
    mappa.set(c.e.id, c.a);
  }
  return mappa;
}

// ---------------- Programma ----------------
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : { controllate: {} };
const salvaCache = () => writeFileSync(CACHE, JSON.stringify(cache));

const stagioni = ((await api("/seasons")) ?? []).filter((s) => !s.current).sort((a, b) => a.year - b.year);
console.log(`Stagioni da controllare: ${stagioni.length}`);

const integrazioni = existsSync(OUT_DATI) ? JSON.parse(readFileSync(OUT_DATI, "utf8")) : {};
const mancanti = [];
let totGare = 0;

for (const s of stagioni) {
  const [categorie, eventiTutti] = await Promise.all([
    api(`/categories?seasonUuid=${s.id}`),
    api(`/events?seasonUuid=${s.id}`),
  ]);
  const eventi = (eventiTutti ?? []).filter((e) => !e.test).sort((a, b) => a.date_start.localeCompare(b.date_start));
  const coppie = eventi.flatMap((e) => (categorie ?? []).map((c) => ({ e, c })));

  // 1) gare senza classifica nell'archivio ufficiale
  const vuote = (
    await inParallelo(coppie, PARALLELE, async ({ e, c }) => {
      const chiave = `${e.id}:${c.id}`;
      if (cache.controllate[chiave]) return cache.controllate[chiave];
      const sessioni = ((await api(`/sessions?eventUuid=${e.id}&categoryUuid=${c.id}`)) ?? []).filter(
        (x) => (x.type === "RAC" || x.type === "SPR") && x.status === "FINISHED"
      );
      const res = [];
      for (const x of sessioni) {
        const cl = await api(`/session/${x.id}/classification?test=false`);
        res.push({ id: x.id, tipo: x.type, vuota: !(cl?.classification?.length > 0) });
      }
      cache.controllate[chiave] = res;
      return res;
    })
  ).flatMap((res, i) => res.map((r) => ({ ...r, e: coppie[i].e, c: coppie[i].c })));
  salvaCache();
  totGare += vuote.length;

  const daRecuperare = vuote.filter((g) => g.vuota && g.tipo === "RAC" && !integrazioni[g.id]);
  const sprintVuote = vuote.filter((g) => g.vuota && g.tipo === "SPR");
  for (const g of sprintVuote) mancanti.push({ anno: s.year, gp: g.e.short_name, classe: g.c.name, gara: "Sprint" });
  if (daRecuperare.length === 0) {
    console.log(`${s.year}: ok`);
    continue;
  }

  // 2) recupero da Wikipedia
  const articoli = await articoliStagione(s.year);
  const mappa = abbina(eventi, articoli);
  let recuperate = 0;
  for (const g of daRecuperare) {
    const titolo = mappa.get(g.e.id);
    const testo = titolo ? await wikiRaw(titolo) : null;
    const righe = testo ? classificaDaArticolo(testo, g.c.name) : null;
    // in alcuni GP una classe corre due gare (es. manche): non indovino quale sia, la lascio mancante
    const doppia = vuote.filter((x) => x.e.id === g.e.id && x.c.id === g.c.id && x.tipo === "RAC").length > 1;
    if (righe && !doppia) {
      integrazioni[g.id] = { fonte: `https://en.wikipedia.org/wiki/${encodeURIComponent(titolo.replace(/ /g, "_"))}`, righe };
      recuperate++;
    } else {
      mancanti.push({ anno: s.year, gp: g.e.short_name, classe: g.c.name, gara: "Gara", wikipedia: titolo ?? null });
    }
  }
  console.log(`${s.year}: ${daRecuperare.length} senza classifica, ${recuperate} recuperate da Wikipedia`);
  writeFileSync(OUT_DATI, JSON.stringify(integrazioni));
}

mkdirSync("src/data", { recursive: true });
writeFileSync(OUT_DATI, JSON.stringify(integrazioni));
writeFileSync(OUT_REPORT, JSON.stringify({ aggiornato: new Date().toISOString(), totGare, mancanti }, null, 1));
console.log(`\nGare controllate: ${totGare}`);
console.log(`Classifiche recuperate da Wikipedia: ${Object.keys(integrazioni).length}`);
console.log(`Ancora mancanti: ${mancanti.length} (elenco in ${OUT_REPORT})`);

if (!process.argv.includes("--no-push")) {
  try {
    execSync(`git add ${OUT_DATI} ${OUT_REPORT}`, { stdio: "inherit" });
    execSync(`git commit -m "Classifiche storiche MotoGP integrate da Wikipedia"`, { stdio: "inherit" });
    execSync("git push", { stdio: "inherit" });
    console.log("Pubblicato: tra 1-2 minuti online.");
  } catch {
    console.log("Niente da pubblicare o push non riuscito: controlla con  git status");
  }
}
