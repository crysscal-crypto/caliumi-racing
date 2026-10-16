// Statistiche storiche Mondiale Superbike: base storica (file JSON creato dallo script)
// + stagioni successive aggiunte in automatico, gara dopo gara.
import base from "@/data/statistiche-sbk.json";
import {
  getStagioniSBK,
  getCategorieSBK,
  getRounds,
  roundsCategoria,
  finito,
  getGareStagioneSBK,
  getClassificaSBK,
  getCostruttoriSBK,
  costruttoreDaTeam,
  nomeClasseSBK,
} from "@/sanity/lib/sbk";

export type PilotaStatSBK = {
  k: string;
  n: string; // nome
  i: string; // nazione ISO (2 lettere)
  v: number; // vittorie
  p: number; // podi
  g: number; // gare
  t: number[]; // anni dei titoli
  a: [number, number]; // primo e ultimo anno
};
export type CampioneSBK = { anno: number; k: string; n: string; i: string; c: string; pt: number | null; cl?: string };
export type CampioneCostruttoriSBK = { anno: number; n: string; pt: number | null; cl?: string };
export type RecordStagioneSBK = { anno: number; k: string; n: string; i: string; v: number; gare: number };
export type ClasseStatSBK = {
  id: string;
  anni: number[];
  gare: number;
  primaGara: { anno: number; round: string; circuito: string } | null;
  piloti: Record<string, Omit<PilotaStatSBK, "k">>;
  costruttori: Record<string, number>;
  titoliCostruttori: Record<string, number>;
  nazioni: Record<string, number>;
  campioni: CampioneSBK[];
  campioniCostruttori: CampioneCostruttoriSBK[];
  recordStagione: RecordStagioneSBK[];
};
type FileStat = { aggiornato: string | null; ultimaStagione: number | null; classi: ClasseStatSBK[] };

const ORDINE = ["SBK", "SSP", "SPB", "SSP300", "SST", "ST6", "WCR"];

export function slugClasseSBK(c: ClasseStatSBK): string {
  return c.id.toLowerCase();
}
export function nomeClasseStatSBK(c: ClasseStatSBK): string {
  return c.id === "tutte" ? "Tutte le classi" : nomeClasseSBK(c.id);
}

function copia(): FileStat {
  return JSON.parse(JSON.stringify(base)) as FileStat;
}

function nuovaClasse(id: string): ClasseStatSBK {
  return {
    id, anni: [], gare: 0, primaGara: null, piloti: {}, costruttori: {}, titoliCostruttori: {},
    nazioni: {}, campioni: [], campioniCostruttori: [], recordStagione: [],
  };
}

// Aggiunge le stagioni non ancora presenti nel file storico
export async function getStatisticheSBK(): Promise<{ classi: ClasseStatSBK[]; aggiornato: string | null; annoCorrente?: number }> {
  const dati = copia();
  const stagioni = await getStagioniSBK();
  const corrente = stagioni.find((s) => s.current);
  const ultima = dati.ultimaStagione ?? 0;
  const nuove = stagioni.filter((s) => s.anno > ultima).sort((a, b) => a.anno - b.anno);

  for (const stagione of nuove) {
    const [categorie, rounds] = await Promise.all([getCategorieSBK(stagione), getRounds(stagione)]);

    for (const cat of categorie) {
      let c = dati.classi.find((x) => x.id === cat.id);
      if (!c) {
        c = nuovaClasse(cat.id);
        dati.classi.push(c);
      }

      const gare = await getGareStagioneSBK(stagione, cat);
      const vittorieStagione: Record<string, number> = {};
      for (const g of gare) {
        c.gare++;
        if (!c.primaGara) c.primaGara = { anno: stagione.anno, round: g.round.nome, circuito: g.round.circuito };
        for (const r of g.righe) {
          const k = r.pilota.id;
          if (!k) continue;
          const p = (c.piloti[k] ??= { n: r.pilota.nome, i: r.pilota.iso, v: 0, p: 0, g: 0, t: [], a: [stagione.anno, stagione.anno] });
          p.g++;
          p.a[1] = stagione.anno;
          if (r.pos !== null && r.pos <= 3) p.p++;
          if (r.pos === 1) {
            p.v++;
            vittorieStagione[k] = (vittorieStagione[k] ?? 0) + 1;
            const marca = costruttoreDaTeam(r.team);
            if (marca) c.costruttori[marca] = (c.costruttori[marca] ?? 0) + 1;
            if (r.pilota.iso) c.nazioni[r.pilota.iso] = (c.nazioni[r.pilota.iso] ?? 0) + 1;
          }
        }
      }
      if (gare.length === 0) continue;
      if (!c.anni.includes(stagione.anno)) c.anni.push(stagione.anno);

      const [kMax, vMax] = Object.entries(vittorieStagione).sort((a, b) => b[1] - a[1])[0] ?? [];
      if (kMax) c.recordStagione.push({ anno: stagione.anno, k: kMax, n: c.piloti[kMax].n, i: c.piloti[kMax].i, v: vMax, gare: gare.length });

      // Stagione conclusa: aggiunge i campioni
      const delle = roundsCategoria(rounds, cat);
      if (delle.length > 0 && delle.every(finito)) {
        const [cl, cc] = await Promise.all([getClassificaSBK(stagione, cat), getCostruttoriSBK(stagione, cat)]);
        const primo = cl.find((x) => x.pos === 1);
        if (primo) {
          c.campioni.push({ anno: stagione.anno, k: primo.pilota.id, n: primo.pilota.nome, i: primo.pilota.iso, c: primo.team, pt: primo.punti });
          const p = c.piloti[primo.pilota.id];
          if (p && !p.t.includes(stagione.anno)) p.t.push(stagione.anno);
        }
        const primoC = cc.find((x) => x.pos === 1);
        if (primoC) {
          c.campioniCostruttori.push({ anno: stagione.anno, n: primoC.nome, pt: primoC.punti });
          c.titoliCostruttori[primoC.nome] = (c.titoliCostruttori[primoC.nome] ?? 0) + 1;
        }
      }
    }
  }

  const classi = dati.classi
    .filter((c) => c.gare > 0)
    .sort((a, b) => {
      const ia = ORDINE.indexOf(a.id), ib = ORDINE.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

  return { classi, aggiornato: dati.aggiornato, annoCorrente: corrente?.anno };
}

// Unisce tutte le classi (per la vista "Tutte le classi")
export function unisciClassiSBK(classi: ClasseStatSBK[]): ClasseStatSBK {
  const tot = nuovaClasse("tutte");
  for (const c of classi) {
    const nome = nomeClasseSBK(c.id);
    tot.gare += c.gare;
    if (c.primaGara && (!tot.primaGara || c.primaGara.anno < tot.primaGara.anno)) tot.primaGara = c.primaGara;
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
    for (const [k, v] of Object.entries(c.titoliCostruttori)) tot.titoliCostruttori[k] = (tot.titoliCostruttori[k] ?? 0) + v;
    for (const [k, v] of Object.entries(c.nazioni)) tot.nazioni[k] = (tot.nazioni[k] ?? 0) + v;
    tot.campioni.push(...c.campioni.map((x) => ({ ...x, cl: nome })));
    tot.campioniCostruttori.push(...c.campioniCostruttori.map((x) => ({ ...x, cl: nome })));
    tot.recordStagione.push(...c.recordStagione.map((r) => ({ ...r })));
  }
  tot.campioni.sort((a, b) => b.anno - a.anno);
  return tot;
}

export function elencoPilotiSBK(c: ClasseStatSBK): PilotaStatSBK[] {
  return Object.entries(c.piloti).map(([k, p]) => ({ k, ...p }));
}

export function serieTitoliSBK(c: ClasseStatSBK): { n: string; i: string; da: number; a: number; quanti: number } | null {
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
