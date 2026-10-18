// Aggiorna i risultati e le classifiche del CIV (Campionato Italiano Velocità)
// leggendoli dal sito ufficiale dei tempi (Perugia Timing) e li pubblica sul sito.
//
// Uso (dalla cartella del progetto):
//   node scripts/aggiorna-civ.mjs            -> stagione in corso (solo i round nuovi + l'ultimo)
//   node scripts/aggiorna-civ.mjs 2024       -> una stagione precisa (dal 2020 in poi)
//   node scripts/aggiorna-civ.mjs tutto      -> tutte le stagioni dal 2020 (circa 1 ora)
//   aggiungi  --no-push  per non pubblicare in automatico
//
// Usa Microsoft Edge (o Chrome) già installato sul PC, senza aprire finestre.
// Non tocca Sanity: scrive solo il file src/data/civ.json.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { chromium } from "playwright-core";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const BASE = "https://livedataciv.perugiatiming.com";
const FILE = "src/data/civ.json";
const PRIMO_ANNO = 2020; // prima di questa stagione il sito dei tempi ha solo PDF

const args = process.argv.slice(2);
const pubblica = !args.includes("--no-push");
const richiesta = args.find((a) => !a.startsWith("--"));

// Classi principali del CIV (i nomi cambiano negli anni)
const CLASSI = [
  { slug: "superbike", nome: "Superbike", re: /superbike/i },
  { slug: "supersport", nome: "Supersport", re: /supersport|\bss\s*600/i },
  { slug: "sportbike", nome: "Sportbike", re: /sport\s*bike/i },
  { slug: "moto3", nome: "Moto3", re: /^\s*moto\s*3\s*$/i },
  { slug: "moto4", nome: "Moto4 / PreMoto3", re: /moto\s*4|pre\s*moto\s*3/i },
];
const classeDi = (nome) => CLASSI.find((c) => c.re.test(nome));

// ---------- Dati esistenti ----------
const dati = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { aggiornato: null, stagioni: [] };
dati.stagioni ??= [];

// ---------- Browser ----------
let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {}
}
if (!browser) {
  console.error("Non trovo né Microsoft Edge né Google Chrome sul PC.");
  process.exit(1);
}
const page = await browser.newPage();
page.setDefaultTimeout(30000);

const pausa = (ms) => page.waitForTimeout(ms);

async function vai(url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("tr", { timeout: 20000 }).catch(() => {});
  await pausa(1500);
}

async function cliccaEAttendi(azione, arg, re) {
  const prima = page.url();
  await page.evaluate(azione, arg);
  await page.waitForURL((u) => u.toString() !== prima && re.test(u.toString()), { timeout: 25000 });
  await page.waitForSelector("tr", { timeout: 20000 }).catch(() => {});
  await pausa(1500);
}

// ---------- Elenco round di una stagione ----------
async function roundDellAnno(anno) {
  await vai(BASE + "/");
  return page.evaluate((anno) => {
    const btn = [...document.querySelectorAll("button.oggetto-accordion")].find((b) => b.innerText.trim() === String(anno));
    if (!btn) return [];
    const i = btn.id.split("-")[1];
    const righe = [...document.getElementById("panel-" + i).querySelectorAll("tr")].slice(1);
    return righe.map((t, j) => ({
      j,
      data: t.querySelectorAll("td")[0]?.innerText.trim() ?? "",
      titolo: t.querySelector("a")?.innerText.trim() ?? "",
    }));
  }, anno);
}

async function apriRound(anno, j) {
  await vai(BASE + "/");
  await cliccaEAttendi(
    ([anno, j]) => {
      const btn = [...document.querySelectorAll("button.oggetto-accordion")].find((b) => b.innerText.trim() === String(anno));
      const i = btn.id.split("-")[1];
      document.getElementById("panel-" + i).querySelectorAll("tr")[j + 1].querySelector("a").click();
    },
    [anno, j],
    /\/Sessioni\/[0-9a-f-]{36}$/i
  );
  return page.url().split("/Sessioni/")[1];
}

// ---------- Classi e gare di un round ----------
async function classiDelRound() {
  return page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll("tr")]
        .map((t) => t.querySelectorAll("td")[3]?.innerText.trim())
        .filter(Boolean)
    ),
  ]);
}

async function apriClasse(urlRound, nomeClasse) {
  await vai(urlRound);
  await cliccaEAttendi(
    (nome) => {
      [...document.querySelectorAll("tr td a")].find((a) => a.innerText.trim() === nome).click();
    },
    nomeClasse,
    /\/Sessioni\/[0-9a-f-]{36}\/\d+$/i
  );
  return page.url();
}

async function sessioniGara() {
  const tutte = await page.evaluate(() =>
    [...document.querySelectorAll("tr")]
      .map((t, i) => ({ i, cells: [...t.querySelectorAll("td")].map((td) => td.innerText.trim()) }))
      .filter((r) => r.cells.length >= 6)
      .map((r) => ({ riga: r.i, ora: r.cells[1], nome: r.cells[5] }))
  );
  const gare = tutte.filter((s) => /gara|race/i.test(s.nome));
  // gare interrotte con bandiera rossa: tengo solo il risultato finale
  return gare.filter((s) => !/red\s*flag/i.test(s.nome) || !gare.some((x) => x !== s && x.nome.replace(/\s*-?\s*red\s*flag.*/i, "") === s.nome.replace(/\s*-?\s*red\s*flag.*/i, "") && !/red\s*flag/i.test(x.nome)));
}

async function leggiRisultati() {
  return page.evaluate(() => {
    const tab = [...document.querySelectorAll("table")].find((t) => /POS/.test(t.querySelector("tr")?.innerText ?? ""));
    if (!tab) return [];
    // colonne lette dall'intestazione (l'ordine cambia a seconda della larghezza della pagina)
    const intest = [...tab.querySelectorAll("tr")[0].querySelectorAll("th,td")].map((c) => c.innerText.trim().toUpperCase());
    const col = (re) => intest.findIndex((t) => re.test(t));
    const iPos = col(/^POS/), iNum = col(/^#$|^NUM|^N\.?$/), iPil = col(/RIDER|PILOTA|DRIVER/), iTeam = col(/TEAM/);
    const iMoto = col(/MOTO|BIKE|MAKE|MARCA/), iGiri = col(/LAP|GIRI/), iTempo = col(/TIME|TEMPO|GAP/);
    const val = (c, i) => (i >= 0 ? c[i] ?? "" : "");
    return [...tab.querySelectorAll("tbody tr")]
      .map((t) => [...t.querySelectorAll("td")].map((td) => td.innerText.trim()))
      .filter((c) => c.length >= 5 && val(c, iPos))
      .map((c) => ({
        pos: val(c, iPos),
        num: val(c, iNum),
        pilota: val(c, iPil),
        team: val(c, iTeam),
        moto: val(c, iMoto),
        giri: val(c, iGiri),
        tempo: val(c, iTempo),
      }));
  });
}

// ---------- Classifica di campionato (PDF ufficiale) ----------
async function testoPdf(buffer) {
  const doc = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true, verbosity: 0 }).promise;
  const righe = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const tc = await (await doc.getPage(p)).getTextContent();
    const perY = new Map();
    for (const it of tc.items) {
      if (!it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      const k = [...perY.keys()].find((v) => Math.abs(v - y) <= 2) ?? y;
      if (!perY.has(k)) perY.set(k, []);
      perY.get(k).push({ x: it.transform[4], s: it.str.trim() });
    }
    [...perY.entries()].sort((a, b) => b[0] - a[0]).forEach(([, its]) => righe.push(its.sort((a, b) => a.x - b.x)));
  }
  return righe;
}

const maiuscoleIniziali = (t) => t.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (x) => x.toUpperCase());

function leggiClassifica(righe) {
  const out = [];
  for (let i = 0; i < righe.length; i++) {
    const r = righe[i];
    if (!/^\d+$/.test(r[0]?.s ?? "") || r[0].x > 40 || !r[1] || r[1].x > 60) continue;
    const cognome = r.filter((it, k) => k > 0 && it.x < 100).map((it) => it.s).join(" ");
    const punti = r.find((it) => it.x >= 100 && /^\d+$/.test(it.s));
    if (!cognome || !punti || /^\d+$/.test(cognome)) continue;
    const sotto = righe[i + 1] ?? [];
    const testoNome = sotto.filter((it) => it.x < 100).map((it) => it.s).join(" ");
    const m = testoNome.match(/^(.*?)\s*\(([A-Z]{3})\)\s*$/);
    out.push({
      pos: Number(r[0].s),
      cognome: maiuscoleIniziali(cognome),
      nome: m ? m[1] : testoNome,
      naz: m ? m[2] : "",
      punti: Number(punti.s),
    });
  }
  return out;
}

async function classificaCampionato(urlClasse, nomeGara) {
  try {
    await vai(urlClasse);
    await cliccaEAttendi(
      (nome) => {
        const riga = [...document.querySelectorAll("tr")].find((t) => t.querySelectorAll("td")[5]?.innerText.trim() === nome);
        riga.querySelectorAll("a")[1].click();
      },
      nomeGara,
      /\/Pdf\//i
    );
    await page.evaluate(() => {
      const li = [...document.querySelectorAll("li")].filter((e) => e.innerText.trim() === "Classifica di Campionato" && e.offsetParent !== null);
      li[0]?.click();
    });
    const src = await page
      .waitForFunction(() => [...document.querySelectorAll("iframe,embed,object")].map((e) => e.src || e.data).find((s) => /STD|Campionato/i.test(s ?? "")), null, { timeout: 15000 })
      .then((h) => h.jsonValue())
      .catch(() => null);
    if (!src) return [];
    const res = await page.request.get(new URL(src.split("#")[0], BASE).toString());
    if (!res.ok()) return [];
    return leggiClassifica(await testoPdf(await res.body()));
  } catch {
    return [];
  }
}

// ---------- Una stagione ----------
async function aggiornaStagione(anno, soloNuovi) {
  const elenco = (await roundDellAnno(anno)).filter((r) => r.data && r.titolo);
  if (elenco.length === 0) {
    console.log(`${anno}: nessun round con risultati online.`);
    return;
  }
  elenco.reverse(); // dal primo all'ultimo

  let st = dati.stagioni.find((s) => s.anno === anno);
  if (!st) {
    st = { anno, eventi: [], classi: [] };
    dati.stagioni.push(st);
  }

  for (let n = 0; n < elenco.length; n++) {
    const r = elenco[n];
    const ultimo = n === elenco.length - 1;
    const circuito = r.titolo.split(/,|\s\d/)[0].trim();
    const giaFatto = st.eventi.find((e) => e.titolo === r.titolo);
    if (soloNuovi && giaFatto && !ultimo) continue;

    console.log(`${anno} · Round ${n + 1} ${r.titolo}`);
    const guid = await apriRound(anno, r.j);
    const urlRound = page.url();
    const evento = { id: guid, round: n + 1, slug: `${n + 1}-${circuito.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, circuito, titolo: r.titolo, data: r.data };
    st.eventi = st.eventi.filter((e) => e.titolo !== r.titolo && e.id !== guid);
    st.eventi.push(evento);
    st.eventi.sort((a, b) => a.round - b.round);

    const nomiClassi = (await classiDelRound()).filter((nome) => classeDi(nome));
    for (const nomeClasse of nomiClassi) {
      const def = classeDi(nomeClasse);
      try {
        const urlClasse = await apriClasse(urlRound, nomeClasse);
        const gare = await sessioniGara();
        let c = st.classi.find((x) => x.slug === def.slug);
        if (!c) {
          c = { slug: def.slug, nome: def.nome, classifica: [], gare: [] };
          st.classi.push(c);
        }
        c.gare = c.gare.filter((g) => g.evento !== guid);

        // dalla prima all'ultima gara del weekend
        for (const s of [...gare].reverse()) {
          await vai(urlClasse);
          await cliccaEAttendi(
            (nome) => {
              const riga = [...document.querySelectorAll("tr")].find((t) => t.querySelectorAll("td")[5]?.innerText.trim() === nome);
              riga.querySelectorAll("a")[0].click();
            },
            s.nome,
            /\/Risultati\//i
          );
          const codice = page.url().split("/").pop();
          const righe = await leggiRisultati();
          if (righe.length) c.gare.push({ evento: guid, sessione: s.nome, codice, righe });
          console.log(`   ${def.nome} · ${s.nome}: ${righe.length} piloti`);
        }

        if (ultimo && gare.length) {
          const cl = await classificaCampionato(urlClasse, gare[0].nome);
          if (cl.length) {
            c.classifica = cl;
            c.dopo = guid;
            console.log(`   ${def.nome} · classifica di campionato: ${cl.length} piloti`);
          }
        }
      } catch (e) {
        console.log(`   ${nomeClasse}: saltata (${e.message.split("\n")[0]})`);
      }
    }
    // ordine gare: per round e poi per ordine del weekend
    for (const c of st.classi) {
      c.gare.sort((a, b) => (st.eventi.find((e) => e.id === a.evento)?.round ?? 0) - (st.eventi.find((e) => e.id === b.evento)?.round ?? 0));
    }
    salva();
  }
}

function salva() {
  dati.aggiornato = new Date().toISOString();
  dati.stagioni.sort((a, b) => b.anno - a.anno);
  mkdirSync("src/data", { recursive: true });
  writeFileSync(FILE, JSON.stringify(dati));
}

// ---------- Avvio ----------
try {
  const annoCorrente = new Date().getFullYear();
  if (richiesta === "tutto") {
    for (let a = annoCorrente; a >= PRIMO_ANNO; a--) await aggiornaStagione(a, false);
  } else if (/^\d{4}$/.test(richiesta ?? "")) {
    await aggiornaStagione(Number(richiesta), false);
  } else {
    await aggiornaStagione(annoCorrente, true);
  }
} finally {
  await browser.close();
}
salva();
console.log(`\nFATTO: aggiornato ${FILE}`);

if (pubblica) {
  try {
    execSync(`git add ${FILE}`, { stdio: "inherit" });
    execSync(`git commit -m "aggiornamento risultati CIV"`, { stdio: "inherit" });
    execSync("git push", { stdio: "inherit" });
    console.log("PUBBLICATO: tra 2-3 minuti è online.");
  } catch {
    console.log("Nessuna novità da pubblicare (oppure git non ha funzionato).");
  }
}
