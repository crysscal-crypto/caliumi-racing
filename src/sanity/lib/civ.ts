// CIV - Campionato Italiano Velocità: dati salvati in src/data/civ.json
// dal programma scripts/aggiorna-civ.mjs (da lanciare dopo ogni round).
import dati from "@/data/civ.json";
import { iso2 } from "@/sanity/lib/sbk";

export type RigaGaraCIV = { pos: string; num: string; pilota: string; team: string; giri: string; tempo: string };
export type GaraCIV = { evento: string; sessione: string; codice: string; righe: RigaGaraCIV[] };
export type RigaClassificaCIV = { pos: number; cognome: string; nome: string; naz: string; punti: number };
export type ClasseCIV = { slug: string; nome: string; classifica: RigaClassificaCIV[]; dopo?: string; gare: GaraCIV[] };
export type EventoCIV = { id: string; round: number; slug: string; circuito: string; titolo: string; data: string };
export type StagioneCIV = { anno: number; eventi: EventoCIV[]; classi: ClasseCIV[] };
type FileCIV = { aggiornato: string | null; stagioni: StagioneCIV[] };

const civ = dati as unknown as FileCIV;

const ORDINE = ["superbike", "supersport", "sportbike", "moto3", "moto4"];

export function aggiornatoCIV(): string | null {
  return civ.aggiornato;
}

export function stagioniCIV(): StagioneCIV[] {
  return [...civ.stagioni]
    .filter((s) => s.eventi.length > 0)
    .sort((a, b) => b.anno - a.anno)
    .map((s) => ({
      ...s,
      classi: [...s.classi].sort((a, b) => ORDINE.indexOf(a.slug) - ORDINE.indexOf(b.slug)),
    }));
}

export function stagioneCIV(anno?: number): StagioneCIV | undefined {
  const tutte = stagioniCIV();
  return anno === undefined ? tutte[0] : tutte.find((s) => s.anno === anno);
}

export function scegliClasseCIV(s: StagioneCIV, slug?: string): ClasseCIV | undefined {
  return s.classi.find((c) => c.slug === slug) ?? s.classi[0];
}

export function eventoCIV(s: StagioneCIV, slug: string): EventoCIV | undefined {
  return s.eventi.find((e) => e.slug === slug);
}

export function gareEvento(c: ClasseCIV, evento: EventoCIV): GaraCIV[] {
  return c.gare.filter((g) => g.evento === evento.id);
}

export function nomeGaraCIV(sessione: string): string {
  return sessione.replace(/super\s*pole\s*race/i, "Superpole Race").replace(/\s+/g, " ").trim();
}

export function slugGara(g: GaraCIV): string {
  return g.codice;
}

export function bandieraCIV(naz: string): string {
  const iso = iso2(naz);
  if (!iso) return "";
  return String.fromCodePoint(...iso.split("").map((c) => 127397 + c.charCodeAt(0)));
}

// "10-11 Ottobre 2026" dal titolo "Vallelunga, 10-11 Ottobre 2026"
export function dateEvento(e: EventoCIV): string {
  return e.titolo.replace(e.circuito, "").replace(/^[,\s]+/, "").trim();
}
