// Statistiche storiche Motomondiale: base storica (file JSON creato dallo script)
// + stagione in corso aggiunta in automatico, gara dopo gara.
import base from "@/data/statistiche-motogp.json";
import {
  getStagione,
  getCategorie,
  getEventi,
  getSessioni,
  getRisultatiSessione,
  getClassifica,
} from "@/sanity/lib/motogp";

export type PilotaStat = {
  k: string;
  n: string; // nome
  i: string; // nazione ISO
  v: number; // vittorie
  p: number; // podi
  g: number; // gare
  t: number[]; // anni dei titoli
  a: [number, number]; // primo e ultimo anno
};
export type Campione = { anno: number; k: string; n: string; i: string; c: string; pt: number | null; cl: string };
export type RecordStagione = { anno: number; k: string; n: string; i: string; v: number; gp: number };
export type ClasseStat = {
  id: string;
  legacy: number;
  nomi: string[];
  anni: number[];
  gp: number;
  primoGP: { anno: number; gp: string; circuito: string } | null;
  piloti: Record<string, Omit<PilotaStat, "k">>;
  costruttori: Record<string, number>;
  nazioni: Record<string, number>;
  campioni: Campione[];
  recordStagione: RecordStagione[];
};
type FileStat = { aggiornato: string | null; ultimaStagione: number | null; classi: ClasseStat[] };

const ORDINE = [3, 2, 1, 5, 10, 9, 8];
const SLUG: Record<number, string> = { 3: "motogp", 2: "moto2", 1: "moto3", 5: "250cc", 10: "125cc", 9: "350cc", 8: "50cc" };

export function slugClasse(c: ClasseStat): string {
  return SLUG[c.legacy] ?? c.nomi[0].toLowerCase().replace(/[^a-z0-9]+/g, "");
}
export function nomeClasse(c: ClasseStat): string {
  return [...c.nomi].reverse().join(" / ");
}

function copia(): FileStat {
  return JSON.parse(JSON.stringify(base)) as FileStat;
}

// Aggiunge la stagione in corso ai dati storici
export async function getStatistiche(): Promise<{ classi: ClasseStat[]; aggiornato: string | null; annoCorrente?: number }> {
  const dati = copia();
  const stagione = await getStagione();

  if (stagione && dati.ultimaStagione !== null && stagione.year > dati.ultimaStagione) {
    const [categorie, eventi] = await Promise.all([getCategorie(stagione), getEventi(stagione)]);
    const finiti = eventi.filter((e) => e.status === "FINISHED");

    for (const cat of categorie) {
      let c = dati.classi.find((x) => x.id === cat.id);
      if (!c) {
        c = { id: cat.id, legacy: cat.legacy_id, nomi: [cat.nome], anni: [], gp: 0, primoGP: null, piloti: {}, costruttori: {}, nazioni: {}, campioni: [], recordStagione: [] };
        dati.classi.push(c);
      }
      if (!c.nomi.includes(cat.nome)) c.nomi.push(cat.nome);

      const gare = await Promise.all(
        finiti.map(async (ev) => {
          const sessioni = await getSessioni(stagione, ev, cat);
          const gara = sessioni.filter((s) => s.type === "RAC" && s.status === "FINISHED").pop();
          return gara ? getRisultatiSessione(stagione, gara) : [];
        })
      );

      const vittorieStagione: Record<string, number> = {};
      let gp = 0;
      for (const righe of gare) {
        if (righe.length === 0) continue;
        gp++;
        c.gp++;
        for (const r of righe) {
          const anyR = r.rider as { riders_api_uuid?: string; riders_id?: string; full_name: string; country?: { iso: string } };
          const k = anyR.riders_api_uuid || anyR.riders_id || anyR.full_name;
          const p = (c.piloti[k] ??= { n: anyR.full_name, i: anyR.country?.iso ?? "", v: 0, p: 0, g: 0, t: [], a: [stagione.year, stagione.year] });
          p.g++;
          p.a[1] = stagione.year;
          if (r.position !== null && r.position <= 3) p.p++;
          if (r.position === 1) {
            p.v++;
            vittorieStagione[k] = (vittorieStagione[k] ?? 0) + 1;
            if (r.constructor?.name) c.costruttori[r.constructor.name] = (c.costruttori[r.constructor.name] ?? 0) + 1;
            if (anyR.country?.iso) c.nazioni[anyR.country.iso] = (c.nazioni[anyR.country.iso] ?? 0) + 1;
          }
        }
      }
      if (gp > 0 && !c.anni.includes(stagione.year)) c.anni.push(stagione.year);

      const [kMax, vMax] = Object.entries(vittorieStagione).sort((a, b) => b[1] - a[1])[0] ?? [];
      if (kMax) c.recordStagione.push({ anno: stagione.year, k: kMax, n: c.piloti[kMax].n, i: c.piloti[kMax].i, v: vMax, gp });

      // Stagione conclusa: aggiunge il campione
      if (eventi.length > 0 && finiti.length === eventi.length) {
        const cl = await getClassifica(stagione, cat);
        const primo = cl.find((x) => x.position === 1);
        if (primo) {
          const r = primo.rider as { riders_api_uuid?: string; riders_id?: string; full_name: string; country?: { iso: string } };
          const k = r.riders_api_uuid || r.riders_id || r.full_name;
          c.campioni.push({ anno: stagione.year, k, n: r.full_name, i: r.country?.iso ?? "", c: primo.constructor?.name ?? "", pt: primo.points, cl: cat.nome });
          if (c.piloti[k] && !c.piloti[k].t.includes(stagione.year)) c.piloti[k].t.push(stagione.year);
        }
      }
    }
  }

  const classi = dati.classi
    .filter((c) => c.gp > 0)
    .sort((a, b) => {
      const ia = ORDINE.indexOf(a.legacy), ib = ORDINE.indexOf(b.legacy);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

  return { classi, aggiornato: dati.aggiornato, annoCorrente: stagione?.year };
}

// Unisce tutte le classi (per la vista "Tutte le classi")
export function unisciClassi(classi: ClasseStat[]): ClasseStat {
  const tot: ClasseStat = { id: "tutte", legacy: 0, nomi: ["Tutte le classi"], anni: [], gp: 0, primoGP: null, piloti: {}, costruttori: {}, nazioni: {}, campioni: [], recordStagione: [] };
  for (const c of classi) {
    tot.gp += c.gp;
    if (c.primoGP && (!tot.primoGP || c.primoGP.anno < tot.primoGP.anno)) tot.primoGP = c.primoGP;
    for (const a of c.anni) if (!tot.anni.includes(a)) tot.anni.push(a);
    for (const [k, p] of Object.entries(c.piloti)) {
      const t = (tot.piloti[k] ??= { n: p.n, i: p.i, v: 0, p: 0, g: 0, t: [], a: [p.a[0], p.a[1]] });
      t.v += p.v;
      t.p += p.p;
      t.g += p.g;
      t.t.push(...p.t);
      t.a = [Math.min(t.a[0], p.a[0]), Math.max(t.a[1], p.a[1])];
    }
    for (const [k, v] of Object.entries(c.costruttori)) tot.costruttori[k] = (tot.costruttori[k] ?? 0) + v;
    for (const [k, v] of Object.entries(c.nazioni)) tot.nazioni[k] = (tot.nazioni[k] ?? 0) + v;
    tot.campioni.push(...c.campioni);
    tot.recordStagione.push(...c.recordStagione.map((r) => ({ ...r })));
  }
  tot.campioni.sort((a, b) => b.anno - a.anno);
  return tot;
}

export function elencoPiloti(c: ClasseStat): PilotaStat[] {
  return Object.entries(c.piloti).map(([k, p]) => ({ k, ...p }));
}

export function serieTitoli(c: ClasseStat): { n: string; i: string; da: number; a: number; quanti: number } | null {
  const lista = [...c.campioni].sort((a, b) => a.anno - b.anno);
  let migliore: { n: string; i: string; da: number; a: number; quanti: number } | null = null;
  let inizio = 0;
  for (let j = 1; j <= lista.length; j++) {
    const fine = j === lista.length || lista[j].k !== lista[j - 1].k || lista[j].anno !== lista[j - 1].anno + 1;
    if (fine) {
      const quanti = j - inizio;
      if (!migliore || quanti > migliore.quanti)
        migliore = { n: lista[inizio].n, i: lista[inizio].i, da: lista[inizio].anno, a: lista[j - 1].anno, quanti };
      inizio = j;
    }
  }
  return migliore;
}
