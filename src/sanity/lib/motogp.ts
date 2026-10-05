// Dati MotoGP / Moto2 / Moto3 dalla fonte pubblica usata da motogp.com
// Nessun dato salvato in Sanity: tutto in cache su Vercel.

const BASE = "https://api.motogp.pulselive.com/motogp/v1/results";

const ORA = 600; // 10 minuti: stagione in corso
const SETTIMANA = 60 * 60 * 24 * 7; // stagioni passate

export type Stagione = { id: string; year: number; current: boolean };
export type Categoria = { id: string; name: string; legacy_id: number; slug: string; nome: string };
export type Evento = {
  id: string;
  name: string;
  sponsored_name?: string;
  short_name: string;
  date_start: string;
  date_end: string;
  test: boolean;
  status: string;
  country?: { iso: string; name: string };
  circuit?: { name: string; place?: string };
};
export type Sessione = {
  id: string;
  type: string;
  number: number | null;
  date: string;
  status: string;
  condition?: { track?: string; air?: string; ground?: string; weather?: string; humidity?: string };
};
type Pilota = {
  full_name: string;
  number?: number;
  country?: { iso: string; name: string };
};
export type RigaSessione = {
  id: string;
  position: number | null;
  rider: Pilota;
  team?: { name: string };
  constructor?: { name: string };
  time?: string;
  points?: number;
  total_laps?: number;
  average_speed?: number;
  top_speed?: number;
  best_lap?: { number?: number; time?: string };
  gap?: { first?: string; prev?: string; lap?: string };
  status?: string;
};
export type RigaClassifica = {
  id: string;
  position: number | null;
  rider: Pilota;
  team?: { name: string };
  constructor?: { name: string };
  points: number;
  race_wins?: number;
  podiums?: number;
  sprint_wins?: number;
};

async function api<T>(percorso: string, cache: number): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${percorso}`, {
      next: { revalidate: cache },
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; CaliumiRacing/1.0; +https://caliumiracing.com)",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const cacheAnno = (s: Stagione) => (s.current ? ORA : SETTIMANA);

// ---------- Stagioni ----------
export async function getStagioni(): Promise<Stagione[]> {
  const dati = await api<Stagione[]>("/seasons", 60 * 60 * 24);
  return (dati ?? []).sort((a, b) => b.year - a.year);
}

export async function getStagione(anno?: number): Promise<Stagione | undefined> {
  const stagioni = await getStagioni();
  if (anno === undefined) return stagioni.find((s) => s.current) ?? stagioni[0];
  return stagioni.find((s) => s.year === anno);
}

// ---------- Classi ----------
function slugCategoria(nome: string): string {
  return nome.replace(/™/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export async function getCategorie(stagione: Stagione): Promise<Categoria[]> {
  const dati = await api<Omit<Categoria, "slug" | "nome">[]>(
    `/categories?seasonUuid=${stagione.id}`,
    SETTIMANA
  );
  return (dati ?? [])
    .map((c) => ({ ...c, slug: slugCategoria(c.name), nome: c.name.replace(/™/g, "") }))
    .sort((a, b) => (a.legacy_id === 3 ? -1 : b.legacy_id === 3 ? 1 : 0));
}

export function scegliCategoria(categorie: Categoria[], slug?: string): Categoria | undefined {
  return categorie.find((c) => c.slug === slug) ?? categorie[0];
}

// ---------- Gran Premi ----------
export async function getEventi(stagione: Stagione): Promise<Evento[]> {
  const dati = await api<Evento[]>(`/events?seasonUuid=${stagione.id}`, cacheAnno(stagione));
  return (dati ?? [])
    .filter((e) => !e.test)
    .sort((a, b) => a.date_start.localeCompare(b.date_start));
}

export function slugEvento(e: Evento): string {
  return e.short_name.toLowerCase();
}

export async function getEvento(stagione: Stagione, slug: string): Promise<Evento | undefined> {
  return (await getEventi(stagione)).find((e) => slugEvento(e) === slug);
}

const NOMI_GP: Record<string, string> = {
  CAT: "Catalogna",
  ARA: "Aragona",
  VAL: "Valencia",
  RSM: "San Marino",
  SMR: "San Marino",
  SPA: "Spagna",
  EMI: "Emilia-Romagna",
  STY: "Stiria",
  TER: "Teruel",
  EUR: "Europa",
  POR: "Portogallo",
  ALG: "Algarve",
  AME: "Americhe",
  TEX: "Americhe",
  DOH: "Doha",
  ITA: "Italia",
  PAC: "Pacifico",
  RIO: "Rio",
  MAD: "Madrid",
};

const nomiPaesi = new Intl.DisplayNames(["it"], { type: "region" });

export function nomeGP(e: Evento): string {
  const speciale = NOMI_GP[e.short_name];
  if (speciale) return `GP ${speciale}`;
  try {
    if (e.country?.iso) return `GP ${nomiPaesi.of(e.country.iso)}`;
  } catch {
    // ignora
  }
  return e.name;
}

export function bandiera(iso?: string): string {
  if (!iso || iso.length !== 2) return "";
  return String.fromCodePoint(...iso.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

// ---------- Sessioni ----------
export async function getSessioni(stagione: Stagione, evento: Evento, categoria: Categoria): Promise<Sessione[]> {
  const dati = await api<Sessione[]>(
    `/sessions?eventUuid=${evento.id}&categoryUuid=${categoria.id}`,
    cacheAnno(stagione)
  );
  return (dati ?? []).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRisultatiSessione(stagione: Stagione, sessione: Sessione): Promise<RigaSessione[]> {
  const dati = await api<{ classification?: RigaSessione[] }>(
    `/session/${sessione.id}/classification?test=false`,
    sessione.status === "FINISHED" && !stagione.current ? SETTIMANA : ORA
  );
  return dati?.classification ?? [];
}

const NOMI_SESSIONI: Record<string, string> = {
  FP: "Prove libere",
  PR: "Practice",
  Q: "Qualifiche",
  SPR: "Sprint",
  WUP: "Warm up",
  RAC: "Gara",
};

export function nomeSessione(s: Sessione): string {
  const base = NOMI_SESSIONI[s.type] ?? s.type;
  return s.number ? `${base} ${s.number}` : base;
}

export function codiceSessione(s: Sessione): string {
  return `${s.type}${s.number ?? ""}`.toLowerCase();
}

// ---------- Classifica mondiale ----------
export async function getClassifica(stagione: Stagione, categoria: Categoria): Promise<RigaClassifica[]> {
  const dati = await api<{ classification?: RigaClassifica[] }>(
    `/standings?seasonUuid=${stagione.id}&categoryUuid=${categoria.id}&type=rider`,
    cacheAnno(stagione)
  );
  return dati?.classification ?? [];
}

// ---------- Utilità ----------
export function formattaPeriodo(inizio: string, fine: string): string {
  const fmt = (d: string, opz: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("it-IT", { ...opz, timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const stessoMese = inizio.slice(0, 7) === fine.slice(0, 7);
  return stessoMese
    ? `${fmt(inizio, { day: "numeric" })}–${fmt(fine, { day: "numeric", month: "long", year: "numeric" })}`
    : `${fmt(inizio, { day: "numeric", month: "long" })} – ${fmt(fine, { day: "numeric", month: "long", year: "numeric" })}`;
}

export function giorniA(data: string): number {
  const oggi = new Date();
  const inizio = new Date(`${data}T00:00:00Z`);
  return Math.ceil((inizio.getTime() - oggi.getTime()) / 86400000);
}
