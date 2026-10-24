// Classifiche storiche che mancano nell'archivio ufficiale MotoGP, recuperate da Wikipedia (CC BY-SA)
// con scripts/integra-motogp.mjs e salvate in src/data/motogp-integrazioni.json
import dati from "@/data/motogp-integrazioni.json";
import type { RigaSessione } from "./motogp";

type Riga = {
  p: number | null; // posizione (null = ritirato / non partito)
  s?: string; // stato (RET, DNS...)
  n?: number; // numero
  r: string; // pilota
  c?: string; // nazione (2 lettere)
  t?: string; // team
  m?: string; // moto
  l?: number; // giri
  tm?: string; // tempo / distacco
  pt?: number; // punti
};

const tutte = dati as unknown as Record<string, { fonte: string; righe: Riga[] }>;

export function righeIntegrate(sessioneId: string): RigaSessione[] {
  const x = tutte[sessioneId];
  if (!x) return [];
  return x.righe.map((r, i) => {
    const tm = (r.tm ?? "").replace(/'/g, ":").trim();
    const giri = tm.match(/^\+?\s*(\d+)\s*laps?\b/i);
    const distacco = !giri && tm.startsWith("+") ? tm.replace(/^\+\s*/, "") : undefined;
    return {
      id: `${sessioneId}-${i}`,
      position: r.p,
      rider: { full_name: r.r, number: r.n, country: r.c ? { iso: r.c, name: "" } : undefined },
      team: r.t ? { name: r.t } : undefined,
      constructor: r.m ? { name: r.m } : undefined,
      time: r.p === null || giri || distacco ? undefined : tm || undefined,
      gap: giri ? { lap: giri[1] } : distacco ? { first: distacco } : undefined,
      points: r.pt,
      total_laps: r.l,
      status: r.s,
      fonte: i === 0 ? x.fonte : undefined,
    };
  });
}
