// Dati WorldSBK / WorldSSP / WorldSPB e altre classi dalla fonte pubblica usata da worldsbk.com
// Nessun dato salvato in Sanity: tutto in cache su Vercel.

const BASE = "https://api.wsbk.pulselive.com";

const ORA = 600; // 10 minuti: stagione in corso
const SETTIMANA = 60 * 60 * 24 * 7; // stagioni passate
const GIORNO = 60 * 60 * 24;

// ---------- Tipi ----------
type Rif = { type: string; id: string };
type Risorsa = {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data: Rif | Rif[] | null }>;
};
type Risposta = { data?: Risorsa[]; included?: Risorsa[] };

export type StagioneSBK = { anno: number; current: boolean };
export type CategoriaSBK = { id: string; slug: string; nome: string; sigla: string; ordine: number };
export type RoundSBK = {
  id: string;
  sigla: string;
  slug: string;
  nome: string;
  circuito: string;
  iso: string;
  inizio: string; // YYYY-MM-DD
  fine: string; // YYYY-MM-DD
  ordine: number;
  stato: string;
  categorie: string[];
};
export type SessioneSBK = {
  id: string;
  codice: string; // usato nell'indirizzo dei risultati (es. 001, L1A, Q1A)
  sigla: string; // RC1, SPRC, FP1...
  descrizione: string;
  categoria: string;
  inizio: string | null; // ISO UTC
  stato: string;
  giri: number | null;
  ordine: number;
};
export type PilotaSBK = { id: string; nome: string; iso: string };
export type RigaRisultatoSBK = {
  id: string;
  pos: number | null; // null = ritirato / non classificato
  numero?: number;
  pilota: PilotaSBK;
  team: string;
  tempo: number; // ms (gara: tempo totale, prove: miglior giro)
  giri: number;
  stato: string;
  giroVeloce: number; // ms
  velocita?: number;
};
export type RigaClassificaSBK = {
  id: string;
  pos: number;
  numero?: number;
  pilota: PilotaSBK;
  team: string;
  punti: number;
};
export type RigaCostruttoriSBK = { id: string; pos: number; nome: string; iso: string; punti: number };
export type GaraSBK = { round: RoundSBK; sessione: SessioneSBK; righe: RigaRisultatoSBK[] };

// ---------- Chiamate ----------
async function api(percorso: string, cache: number): Promise<Risposta | null> {
  try {
    const res = await fetch(`${BASE}${percorso}`, {
      next: { revalidate: cache },
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; CaliumiRacing/1.0; +https://caliumiracing.com)",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as Risposta;
  } catch {
    return null;
  }
}

const cacheAnno = (s: StagioneSBK) => (s.current ? ORA : SETTIMANA);
const testo = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const numero = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

function rifId(r: Risorsa, campo: string): string | undefined {
  const d = r.relationships?.[campo]?.data;
  return d && !Array.isArray(d) ? d.id : undefined;
}

// "riders" e "rider" sono la stessa cosa: tolgo la s finale
function mappaInclusi(risposta: Risposta | null): Map<string, Risorsa> {
  const m = new Map<string, Risorsa>();
  for (const x of risposta?.included ?? []) m.set(`${x.type.replace(/s$/, "")}:${x.id}`, x);
  return m;
}

// ---------- Nazioni (la fonte usa 3 lettere, le bandiere 2) ----------
const ISO: Record<string, string> = {
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

export function iso2(iso3?: string | null): string {
  if (!iso3) return "";
  const k = iso3.toUpperCase();
  return ISO[k] ?? (k.length === 2 ? k : "");
}

// ---------- Costruttori ----------
const NOMI_COSTRUTTORI: Record<string, string> = {
  DUCAT: "Ducati", YAMAH: "Yamaha", KAWAS: "Kawasaki", HONDA: "Honda", SUZUK: "Suzuki",
  APRIL: "Aprilia", BMW: "BMW", BIMOT: "Bimota", MVAGU: "MV Agusta", MV: "MV Agusta",
  TRIUM: "Triumph", KTM: "KTM", BENEL: "Benelli", PETRO: "Petronas", BUELL: "Buell", EBR: "EBR",
  QJMOT: "QJMotor", CFMOT: "CFMoto",
};

export function nomeCostruttore(id: string, nome?: string | null): string {
  if (nome) return nome;
  return NOMI_COSTRUTTORI[id] ?? id.charAt(0) + id.slice(1).toLowerCase();
}

// La fonte non dà la marca della moto nei risultati: la ricavo dal nome del team
const MARCHE: [RegExp, string][] = [
  [/ducati/i, "Ducati"], [/yamaha/i, "Yamaha"], [/kawasaki/i, "Kawasaki"], [/honda/i, "Honda"],
  [/suzuki/i, "Suzuki"], [/aprilia/i, "Aprilia"], [/bmw/i, "BMW"], [/bimota/i, "Bimota"],
  [/mv\s*agusta/i, "MV Agusta"], [/triumph/i, "Triumph"], [/\bktm\b/i, "KTM"], [/petronas/i, "Petronas"],
  [/benelli/i, "Benelli"], [/buell|\bebr\b/i, "Buell"], [/qjmotor/i, "QJMotor"], [/cfmoto/i, "CFMoto"],
];

export function costruttoreDaTeam(team: string): string | undefined {
  return MARCHE.find(([re]) => re.test(team))?.[1];
}

// ---------- Stagioni ----------
export async function getStagioniSBK(): Promise<StagioneSBK[]> {
  const dati = await api("/wsbk-events/v1/seasons", GIORNO);
  return (dati?.data ?? [])
    .map((s) => ({ anno: Number(s.id), current: s.attributes.current === true }))
    .filter((s) => s.anno > 1900)
    .sort((a, b) => b.anno - a.anno);
}

export async function getStagioneSBK(anno?: number): Promise<StagioneSBK | undefined> {
  const stagioni = await getStagioniSBK();
  if (anno === undefined) return stagioni.find((s) => s.current) ?? stagioni[0];
  return stagioni.find((s) => s.anno === anno);
}

// ---------- Classi ----------
const CLASSI: Record<string, { nome: string; ordine: number }> = {
  SBK: { nome: "Superbike", ordine: 1 },
  SSP: { nome: "Supersport", ordine: 2 },
  SPB: { nome: "Sportbike", ordine: 3 },
  SSP300: { nome: "Supersport 300", ordine: 4 },
  SST: { nome: "Superstock 1000", ordine: 5 },
  ST6: { nome: "Superstock 600", ordine: 6 },
  WCR: { nome: "WorldWCR", ordine: 7 },
};

export function nomeClasseSBK(id: string): string {
  return CLASSI[id]?.nome ?? id;
}

export async function getCategorieSBK(stagione: StagioneSBK): Promise<CategoriaSBK[]> {
  const dati = await api(`/wsbk-events/v1/seasons/${stagione.anno}/categories`, SETTIMANA);
  return (dati?.data ?? [])
    .filter((c) => CLASSI[c.id])
    .map((c) => ({
      id: c.id,
      slug: c.id.toLowerCase(),
      nome: CLASSI[c.id].nome,
      sigla: testo(c.attributes.name) || c.id,
      ordine: CLASSI[c.id].ordine,
    }))
    .sort((a, b) => a.ordine - b.ordine);
}

export function scegliCategoriaSBK(categorie: CategoriaSBK[], slug?: string): CategoriaSBK | undefined {
  return categorie.find((c) => c.slug === slug) ?? categorie[0];
}

// ---------- Round ----------
export async function getRounds(stagione: StagioneSBK): Promise<RoundSBK[]> {
  const dati = await api(`/wsbk-events/v1/seasons/${stagione.anno}/rounds`, cacheAnno(stagione));
  return (dati?.data ?? [])
    .map((r) => {
      const a = r.attributes;
      const cat = r.relationships?.categories?.data;
      const sigla = testo(a.source_id) || r.id.split("-").pop() || r.id;
      return {
        id: r.id,
        sigla,
        slug: sigla.toLowerCase(),
        nome: testo(a.brief_description) || testo(a.description) || sigla,
        circuito: testo(a.name),
        iso: iso2(testo(a.country_iso)),
        inizio: testo(a.start_date).slice(0, 10),
        fine: testo(a.end_date).slice(0, 10) || testo(a.start_date).slice(0, 10),
        ordine: numero(a.sequence_order),
        stato: testo(a.status),
        categorie: Array.isArray(cat) ? cat.map((c) => c.id) : [],
      };
    })
    .filter((r) => r.inizio)
    .sort((a, b) => a.ordine - b.ordine || a.inizio.localeCompare(b.inizio));
}

export function roundsCategoria(rounds: RoundSBK[], categoria: CategoriaSBK): RoundSBK[] {
  return rounds.filter((r) => r.categorie.length === 0 || r.categorie.includes(categoria.id));
}

export async function getRound(stagione: StagioneSBK, slug: string): Promise<RoundSBK | undefined> {
  return (await getRounds(stagione)).find((r) => r.slug === slug);
}

export const finito = (r: RoundSBK) => r.stato === "FINISHED";

// ---------- Sessioni ----------
// Nelle stagioni vecchie la sigla a volte è sbagliata (es. Gara 2 segnata "RC1"): la ricavo dal nome
function siglaVera(sigla: string, nome: string): string {
  const s = sigla.toUpperCase();
  if (/superpole\s*race/i.test(nome)) return "SPRC";
  const m = nome.match(/^\s*race\s*(\d)/i);
  if (m) return `RC${m[1]}`;
  if (/^\s*race\b/i.test(nome) || s === "RACE") return "RC";
  return s;
}

export async function getSessioniRound(stagione: StagioneSBK, round: RoundSBK): Promise<SessioneSBK[]> {
  const dati = await api(
    `/wsbk-events/v1/seasons/${stagione.anno}/rounds/${round.sigla}/sessions`,
    finito(round) && !stagione.current ? SETTIMANA : ORA
  );
  return (dati?.data ?? [])
    .map((s) => {
      const a = s.attributes;
      return {
        id: s.id,
        codice: testo(a.source_id),
        sigla: siglaVera(testo(a.short_name), testo(a.brief_description) || testo(a.description)),
        descrizione: testo(a.brief_description) || testo(a.description),
        categoria: rifId(s, "category") ?? "",
        inizio: testo(a.start_date_utc) || null,
        stato: testo(a.status),
        giri: a.laps ? numero(a.laps) : null,
        ordine: numero(a.incremental_id),
      };
    })
    .sort((a, b) => (a.inizio ?? "").localeCompare(b.inizio ?? "") || a.ordine - b.ordine);
}

// Sessioni di una classe; se una gara è stata interrotta con bandiera rossa tengo solo la versione finale
export function sessioniCategoria(sessioni: SessioneSBK[], categoria: CategoriaSBK): SessioneSBK[] {
  const della = sessioni.filter((s) => s.categoria === categoria.id);
  // Parziale = gara interrotta (bandiera rossa) o una delle manche: conta solo il risultato finale/aggregato
  const rossa = (s: SessioneSBK) => /\bred\b|heat/i.test(s.descrizione);
  const perSigla = new Map<string, SessioneSBK>();
  for (const s of della) {
    const prima = perSigla.get(s.sigla);
    if (!prima || (rossa(prima) && !rossa(s)) || (rossa(prima) === rossa(s) && s.ordine > prima.ordine)) {
      perSigla.set(s.sigla, s);
    }
  }
  return della.filter((s) => perSigla.get(s.sigla) === s);
}

export function eGara(s: SessioneSBK): boolean {
  return /^RC\d?$/.test(s.sigla) || s.sigla === "SPRC";
}

export function nomeSessioneSBK(s: SessioneSBK): string {
  const m = s.sigla.match(/^([A-Z]+?)(\d*)$/);
  const [, base, n] = m ?? [null, s.sigla, ""];
  const num = n ? ` ${Number(n)}` : "";
  if (s.sigla === "SPRC") return "Superpole Race";
  if (base === "RC") return `Gara${num}`;
  if (base === "FP") return `Prove libere${num}`;
  if (base === "SP") return `Superpole${num}`;
  if (base === "QP") return `Qualifiche${num}`;
  if (base === "WUP") return `Warm up${num}`;
  return s.descrizione || s.sigla;
}

export function codiceSessioneSBK(s: SessioneSBK): string {
  return s.sigla.toLowerCase();
}

// ---------- Risultati ----------
export async function getRisultatiSBK(
  stagione: StagioneSBK,
  round: RoundSBK,
  categoria: string,
  sessione: SessioneSBK
): Promise<RigaRisultatoSBK[]> {
  const dati = await api(
    `/wsbk-results/v1/seasons/${stagione.anno}/categories/${categoria}/rounds/${round.sigla}/sessions/${sessione.codice}/results`,
    sessione.stato === "FINISHED" && !stagione.current ? SETTIMANA : ORA
  );
  const inc = mappaInclusi(dati);
  return [...(dati?.data ?? [])]
    .sort((a, b) => (numero(a.attributes.position) || 999) - (numero(b.attributes.position) || 999))
    .map((r) => {
      const a = r.attributes;
      const pid = rifId(r, "rider") ?? "";
      const pil = inc.get(`rider:${pid}`)?.attributes ?? {};
      const team = inc.get(`team:${rifId(r, "team")}`)?.attributes ?? {};
      const stato = testo(a.status);
      const classificato = /^classified$/i.test(stato);
      return {
        id: r.id,
        pos: classificato && numero(a.position) > 0 ? numero(a.position) : null,
        numero: a.number ? numero(a.number) : undefined,
        pilota: {
          id: pid,
          nome: `${testo(pil.name)} ${testo(pil.surname)}`.trim() || "—",
          iso: iso2(testo(pil.country_iso)),
        },
        team: testo(team.name),
        tempo: numero(a.time),
        giri: numero(a.laps),
        stato,
        giroVeloce: numero(a.fastest_lap_time),
        velocita: a.speed ? numero(a.speed) : undefined,
      };
    });
}

// Tutte le gare concluse di una stagione per una classe
export async function getGareStagioneSBK(stagione: StagioneSBK, categoria: CategoriaSBK): Promise<GaraSBK[]> {
  const rounds = roundsCategoria(await getRounds(stagione), categoria).filter(finito);
  const perRound = await Promise.all(
    rounds.map(async (round) => {
      const sessioni = sessioniCategoria(await getSessioniRound(stagione, round), categoria).filter(
        (s) => eGara(s) && s.stato === "FINISHED"
      );
      return Promise.all(
        sessioni.map(async (sessione) => ({
          round,
          sessione,
          righe: await getRisultatiSBK(stagione, round, categoria.id, sessione),
        }))
      );
    })
  );
  return perRound.flat().filter((g) => g.righe.length > 0);
}

export function vittoriePodi(gare: GaraSBK[]): Map<string, { v: number; p: number }> {
  const m = new Map<string, { v: number; p: number }>();
  for (const g of gare) {
    for (const r of g.righe) {
      if (r.pos === null || r.pos > 3) continue;
      const x = m.get(r.pilota.id) ?? { v: 0, p: 0 };
      x.p++;
      if (r.pos === 1) x.v++;
      m.set(r.pilota.id, x);
    }
  }
  return m;
}

// ---------- Classifiche ----------
export async function getClassificaSBK(stagione: StagioneSBK, categoria: CategoriaSBK): Promise<RigaClassificaSBK[]> {
  const dati = await api(
    `/wsbk-results/v1/seasons/${stagione.anno}/categories/${categoria.id}/riders/standings`,
    cacheAnno(stagione)
  );
  const inc = mappaInclusi(dati);
  return (dati?.data ?? [])
    .map((r) => {
      const a = r.attributes;
      const pid = rifId(r, "rider") ?? "";
      const pil = inc.get(`rider:${pid}`)?.attributes ?? {};
      const team = inc.get(`team:${rifId(r, "team")}`)?.attributes ?? {};
      return {
        id: r.id,
        pos: numero(a.position),
        numero: a.number ? numero(a.number) : undefined,
        pilota: {
          id: pid,
          nome: `${testo(pil.name)} ${testo(pil.surname)}`.trim() || "—",
          iso: iso2(testo(pil.country_iso)),
        },
        team: testo(team.name),
        punti: numero(a.points),
      };
    })
    .sort((a, b) => (a.pos || 999) - (b.pos || 999));
}

export async function getCostruttoriSBK(stagione: StagioneSBK, categoria: CategoriaSBK): Promise<RigaCostruttoriSBK[]> {
  const dati = await api(
    `/wsbk-results/v1/seasons/${stagione.anno}/categories/${categoria.id}/manufacturers/standings`,
    cacheAnno(stagione)
  );
  const inc = mappaInclusi(dati);
  return (dati?.data ?? [])
    .map((r) => {
      const mid = rifId(r, "manufacturer") ?? "";
      const m = inc.get(`manufacturer:${mid}`)?.attributes ?? {};
      return {
        id: r.id,
        pos: numero(r.attributes.position),
        nome: nomeCostruttore(mid, testo(m.name) || null),
        iso: iso2(testo(m.country_iso)),
        punti: numero(r.attributes.points),
      };
    })
    .sort((a, b) => (a.pos || 999) - (b.pos || 999));
}

// ---------- Formattazione ----------
export function tempoGara(ms: number): string {
  if (!ms) return "-";
  const tot = Math.round(ms);
  const h = Math.floor(tot / 3600000);
  const m = Math.floor((tot % 3600000) / 60000);
  const s = Math.floor((tot % 60000) / 1000);
  const mil = String(tot % 1000).padStart(3, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}.${mil}` : `${m}:${ss}.${mil}`;
}

export function distacco(ms: number): string {
  if (ms <= 0) return "";
  const s = Math.floor(ms / 1000);
  const mil = String(Math.round(ms % 1000)).padStart(3, "0");
  return s >= 60 ? `+${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}.${mil}` : `+${s}.${mil}`;
}

export function nomeRound(r: RoundSBK): string {
  return r.nome;
}
