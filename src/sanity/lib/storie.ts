// Dati per le storie Instagram: risultati delle sessioni MotoGP e WorldSBK appena concluse

import {
  getStagione,
  getEventi,
  getCategorie,
  getSessioni,
  getRisultatiSessione,
  nomeGP,
  nomeSessione,
  slugEvento,
  codiceSessione,
} from "./motogp";
import {
  getStagioneSBK,
  getRounds,
  getCategorieSBK,
  getSessioniRound,
  sessioniCategoria,
  getRisultatiSBK,
  nomeSessioneSBK,
  codiceSessioneSBK,
  eGara,
  tempoGara,
  distacco,
} from "./sbk";

export type Serie = "motogp" | "sbk";

export type Candidata = {
  chiave: string; // identificativo unico della sessione (per non pubblicarla due volte)
  serie: Serie;
  anno: number;
  evento: string; // slug GP / round
  sessione: string; // MotoGP: id sessione · SBK: codice sessione
  quando: string; // inizio sessione (ISO)
};

export type RigaStoria = { pos: number; nome: string; iso: string; team: string; valore: string };

export type Storia = {
  serie: Serie;
  campionato: string;
  evento: string;
  circuito: string;
  iso: string;
  sessione: string;
  gara: boolean;
  righe: RigaStoria[];
  percorso: string; // pagina dei risultati sul sito
};

const SITO = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.caliumiracing.com").replace(
  "https://caliumiracing.com",
  "https://www.caliumiracing.com"
);

export function urlImmagine(c: Candidata): string {
  const q = new URLSearchParams({ serie: c.serie, anno: String(c.anno), evento: c.evento, sessione: c.sessione });
  return `${SITO}/storie/immagine?${q.toString()}`;
}

const oggi = () => new Date().toISOString().slice(0, 10);
const giorno = (d: string, delta: number) => new Date(Date.parse(`${d}T12:00:00Z`) + delta * 86400000).toISOString().slice(0, 10);

function recente(quando: string | null | undefined, ore: number): boolean {
  if (!quando) return false;
  const t = Date.parse(quando);
  return !Number.isNaN(t) && t <= Date.now() && Date.now() - t <= ore * 3600000;
}

// "Francesco Bagnaia" -> "F. BAGNAIA"
function nomeBreve(nome: string): string {
  const parti = nome.trim().split(/\s+/);
  if (parti.length < 2) return nome.toUpperCase();
  return `${parti[0].charAt(0)}. ${parti.slice(1).join(" ").toUpperCase()}`;
}

// ---------- Sessioni concluse di recente ----------
export async function sessioniRecenti(ore = 12): Promise<Candidata[]> {
  const [motogp, sbk] = await Promise.all([recentiMotoGP(ore), recentiSBK(ore)]);
  return [...motogp, ...sbk].sort((a, b) => a.quando.localeCompare(b.quando));
}

async function recentiMotoGP(ore: number): Promise<Candidata[]> {
  try {
    const stagione = await getStagione();
    if (!stagione) return [];
    const [eventi, categorie] = await Promise.all([getEventi(stagione), getCategorie(stagione)]);
    const motogp = categorie[0];
    if (!motogp) return [];
    const ora = oggi();
    const inCorso = eventi.filter((e) => e.date_start <= giorno(ora, 1) && e.date_end >= giorno(ora, -1));
    const tutte = await Promise.all(
      inCorso.map(async (e) =>
        (await getSessioni(stagione, e, motogp))
          .filter((s) => s.status === "FINISHED" && recente(s.date, ore))
          .map((s) => ({
            chiave: `motogp:${s.id}`,
            serie: "motogp" as const,
            anno: stagione.year,
            evento: slugEvento(e),
            sessione: s.id,
            quando: s.date,
          }))
      )
    );
    return tutte.flat();
  } catch {
    return [];
  }
}

async function recentiSBK(ore: number): Promise<Candidata[]> {
  try {
    const stagione = await getStagioneSBK();
    if (!stagione) return [];
    const [rounds, categorie] = await Promise.all([getRounds(stagione), getCategorieSBK(stagione)]);
    const sbk = categorie.find((c) => c.id === "SBK");
    if (!sbk) return [];
    const ora = oggi();
    const inCorso = rounds.filter((r) => r.inizio <= giorno(ora, 1) && r.fine >= giorno(ora, -1));
    const tutte = await Promise.all(
      inCorso.map(async (r) =>
        sessioniCategoria(await getSessioniRound(stagione, r), sbk)
          .filter((s) => s.stato === "FINISHED" && recente(s.inizio, ore))
          .map((s) => ({
            chiave: `sbk:${stagione.anno}:${r.sigla}:${s.codice}`,
            serie: "sbk" as const,
            anno: stagione.anno,
            evento: r.slug,
            sessione: s.codice,
            quando: s.inizio as string,
          }))
      )
    );
    return tutte.flat();
  } catch {
    return [];
  }
}

// ---------- Dati di una storia ----------
export async function datiStoria(serie: string, anno: number, evento: string, sessione: string): Promise<Storia | null> {
  try {
    return serie === "sbk" ? await storiaSBK(anno, evento, sessione) : await storiaMotoGP(anno, evento, sessione);
  } catch {
    return null;
  }
}

async function storiaMotoGP(anno: number, slug: string, id: string): Promise<Storia | null> {
  const stagione = await getStagione(anno);
  if (!stagione) return null;
  const [eventi, categorie] = await Promise.all([getEventi(stagione), getCategorie(stagione)]);
  const evento = eventi.find((e) => slugEvento(e) === slug);
  const categoria = categorie[0];
  if (!evento || !categoria) return null;
  const sessione = (await getSessioni(stagione, evento, categoria)).find((s) => s.id === id);
  if (!sessione) return null;
  const gara = sessione.type === "RAC" || sessione.type === "SPR";
  const righe = (await getRisultatiSessione(stagione, sessione))
    .filter((r) => r.position)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .slice(0, 10)
    .map((r, i) => {
      let valore: string;
      if (gara) {
        valore =
          i === 0
            ? r.time ?? ""
            : r.gap?.lap && r.gap.lap !== "0"
              ? `+${r.gap.lap} ${r.gap.lap === "1" ? "giro" : "giri"}`
              : r.gap?.first
                ? `+${r.gap.first}`
                : "";
      } else {
        valore = i === 0 ? r.best_lap?.time ?? "" : r.gap?.first ? `+${r.gap.first}` : "";
      }
      return {
        pos: r.position as number,
        nome: nomeBreve(r.rider.full_name),
        iso: r.rider.country?.iso ?? "",
        team: r.team?.name ?? "",
        valore,
      };
    });
  return {
    serie: "motogp",
    campionato: "MotoGP",
    evento: nomeGP(evento),
    circuito: evento.circuit?.name ?? "",
    iso: evento.country?.iso ?? "",
    sessione: nomeSessione(sessione),
    gara,
    righe,
    percorso: `/motogp/${anno}/${slug}?sessione=${codiceSessione(sessione)}`,
  };
}

async function storiaSBK(anno: number, slug: string, codice: string): Promise<Storia | null> {
  const stagione = await getStagioneSBK(anno);
  if (!stagione) return null;
  const [rounds, categorie] = await Promise.all([getRounds(stagione), getCategorieSBK(stagione)]);
  const round = rounds.find((r) => r.slug === slug);
  const sbk = categorie.find((c) => c.id === "SBK");
  if (!round || !sbk) return null;
  const sessione = sessioniCategoria(await getSessioniRound(stagione, round), sbk).find((s) => s.codice === codice);
  if (!sessione) return null;
  const gara = eGara(sessione);
  const classificati = (await getRisultatiSBK(stagione, round, sbk.id, sessione))
    .filter((r) => r.pos !== null)
    .sort((a, b) => (a.pos ?? 99) - (b.pos ?? 99))
    .slice(0, 10);
  const primo = classificati[0];
  const righe = classificati.map((r, i) => {
    let valore: string;
    if (gara) {
      const giriInMeno = primo ? primo.giri - r.giri : 0;
      valore =
        i === 0
          ? tempoGara(r.tempo)
          : giriInMeno > 0
            ? `+${giriInMeno} ${giriInMeno === 1 ? "giro" : "giri"}`
            : distacco(r.tempo - primo.tempo);
    } else {
      valore = i === 0 ? tempoGara(r.giroVeloce) : distacco(r.giroVeloce - primo.giroVeloce);
    }
    return { pos: r.pos as number, nome: nomeBreve(r.pilota.nome), iso: r.pilota.iso, team: r.team, valore };
  });
  return {
    serie: "sbk",
    campionato: "WorldSBK",
    evento: round.nome,
    circuito: round.circuito,
    iso: round.iso,
    sessione: nomeSessioneSBK(sessione),
    gara,
    righe,
    percorso: `/superbike/${anno}/${slug}?sessione=${codiceSessioneSBK(sessione)}`,
  };
}
