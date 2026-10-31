// "Giornalista automatico": dopo Q2, Sprint e Gara della MotoGP e dopo Superpole e gare della Superbike
// scrive con Claude un articolo originale (risultati ufficiali + notizie delle testate),
// lo salva come BOZZA in Sanity con la copertina dei risultati e avvisa Cristian sul telefono (ntfy).

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";
import { sessioniRecenti, datiStoria, type Candidata, type Storia } from "./storie";
import { getStagione, getCategorie, getClassifica } from "./motogp";
import { getStagioneSBK, getCategorieSBK, getClassificaSBK } from "./sbk";
import { getTutteLeNotizie } from "./notizie";
import { daMarkdown, slugDa } from "./markdown";

const DOC = "segreti.instagram"; // stesso documento privato delle storie
const SITO = "https://www.caliumiracing.com";
const MODELLO = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

// Sessioni per cui scrivere l'articolo e minuti di attesa dall'inizio (così le testate hanno già pubblicato)
const ATTESA: Record<string, number> = {
  "motogp:Q2": 45,
  "motogp:SPR": 60,
  "motogp:RAC": 90,
  "sbk:SP": 45,
  "sbk:RC1": 80,
  "sbk:SPRC": 50,
  "sbk:RC2": 80,
};

const chiave = () => Math.random().toString(36).slice(2, 12);

function sanity() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Manca SANITY_API_WRITE_TOKEN");
  return createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: "raw" });
}

function tipoArticolo(c: Candidata): string | null {
  const t = c.tipo.toUpperCase();
  const k = `${c.serie}:${c.serie === "sbk" && /^SP\d*$/.test(t) && t !== "SPRC" ? "SP" : t}`;
  return ATTESA[k] !== undefined ? k : null;
}

async function classificaMondiale(s: Storia, anno: number): Promise<string[]> {
  try {
    if (s.serie === "motogp") {
      const st = await getStagione(anno);
      const cat = st ? (await getCategorie(st))[0] : undefined;
      if (!st || !cat) return [];
      return (await getClassifica(st, cat)).slice(0, 10).map((r) => `${r.position}. ${r.rider.full_name} ${r.points} pt`);
    }
    const st = await getStagioneSBK(anno);
    const cat = st ? (await getCategorieSBK(st)).find((c) => c.id === "SBK") : undefined;
    if (!st || !cat) return [];
    return (await getClassificaSBK(st, cat)).slice(0, 10).map((r) => `${r.pos}. ${r.pilota.nome} ${r.punti} pt`);
  } catch {
    return [];
  }
}

async function notizieCollegate(s: Storia, dopo: string): Promise<string[]> {
  try {
    const campionato = s.serie === "motogp" ? "MotoGP" : "Superbike";
    const da = Date.parse(dopo) - 3 * 3600000;
    return (await getTutteLeNotizie())
      .filter((n) => n.campionato === campionato && n.data && Date.parse(n.data) >= da)
      .slice(0, 15)
      .map((n) => `- [${n.fonte}] ${n.titolo}${n.estratto ? ` — ${n.estratto}` : ""}`);
  } catch {
    return [];
  }
}

type Articolo = { titolo: string; sommario: string; testo: string };

async function scriviConClaude(s: Storia, classifica: string[], notizie: string[]): Promise<Articolo> {
  const chiaveApi = process.env.ANTHROPIC_API_KEY;
  if (!chiaveApi) throw new Error("Manca ANTHROPIC_API_KEY");

  const risultati = s.righe.map((r) => `${r.pos}. ${r.nome} (${r.team}) ${r.valore}`).join("\n");
  const prompt = `Sei il giornalista di Caliumi Racing, sito di motociclismo di Cristian Caliumi (ex pilota e direttore sportivo).
Scrivi in italiano un articolo ORIGINALE sulla sessione qui sotto.

CAMPIONATO: ${s.campionato}
EVENTO: ${s.evento} — circuito: ${s.circuito}
SESSIONE: ${s.sessione}

RISULTATI UFFICIALI (top 10, tempi o distacchi):
${risultati}

${classifica.length ? `CLASSIFICA MONDIALE PILOTI (top 10):\n${classifica.join("\n")}\n` : ""}
${notizie.length ? `TITOLI E SOMMARI DELLE TESTATE (solo come spunto: NON copiare frasi):\n${notizie.join("\n")}\n` : ""}
REGOLE:
- Usa solo fatti presenti nei dati sopra. Non inventare dichiarazioni, cadute, penalità o dettagli che non ci sono.
- Nessuna frase copiata dalle testate: rielabora con parole tue, tono appassionato ma serio.
- 350-550 parole. Un paragrafo d'apertura forte, poi 2-3 sezioni con titoletti Markdown "## ".
- Cita il podio con i distacchi e, se c'è, cosa cambia nel mondiale.
- Nei risultati i nomi sono abbreviati (es. "M. BEZZECCHI"): nel testo scrivi il nome completo solo se sei certo di chi è, altrimenti usa il cognome.
- Titolo SEO max 90 caratteri con vincitore, evento e sessione. Sommario max 200 caratteri.

Rispondi SOLO con un JSON valido, senza altro testo:
{"titolo": "...", "sommario": "...", "testo": "...markdown..."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": chiaveApi,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: MODELLO, max_tokens: 3000, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(120000),
    cache: "no-store",
  });
  const j = (await res.json()) as { content?: { type: string; text?: string }[]; error?: { message?: string } };
  if (!res.ok) throw new Error(`Claude: ${j.error?.message ?? res.status}`);
  const testo = (j.content ?? []).map((c) => c.text ?? "").join("");
  const json = testo.slice(testo.indexOf("{"), testo.lastIndexOf("}") + 1);
  const a = JSON.parse(json) as Articolo;
  if (!a.titolo || !a.sommario || !a.testo) throw new Error("Risposta di Claude incompleta");
  return a;
}

async function avvisa(titolo: string, link: string): Promise<void> {
  const canale = process.env.NTFY_TOPIC;
  if (!canale) return;
  try {
    await fetch(`https://ntfy.sh/${canale}`, {
      method: "POST",
      body: `Nuovo articolo da approvare: ${titolo}`,
      headers: { Title: "Caliumi Racing", Click: link, Tags: "racing_motorcycle" },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // l'avviso non è indispensabile: la bozza è comunque nello Studio
  }
}

export async function giroArticoli(scadenza: number): Promise<{ scritti: string[]; errori: string[] }> {
  const scritti: string[] = [];
  const errori: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) return { scritti, errori };

  const c = sanity();
  const doc = await c.getDocument<{ articoli?: string[] }>(DOC);
  const fatti = doc?.articoli ?? [];

  const candidate = (await sessioniRecenti()).filter((x) => {
    const tipo = tipoArticolo(x);
    if (!tipo || fatti.includes(x.chiave)) return false;
    return Date.now() - Date.parse(x.quando) >= ATTESA[tipo] * 60000;
  });

  for (const x of candidate.slice(0, 1)) {
    if (Date.now() > scadenza) break;
    // segno subito, così un errore non fa ripartire l'articolo a ogni controllo
    await c.patch(DOC).setIfMissing({ articoli: [] }).append("articoli", [x.chiave]).commit();
    try {
      const s = await datiStoria(x.serie, x.anno, x.evento, x.sessione);
      if (!s || s.righe.length < 3) throw new Error("Risultati non disponibili");
      const [classifica, notizie] = await Promise.all([
        /RAC|SPR|RC|SPRC/.test(x.tipo) ? classificaMondiale(s, x.anno) : Promise.resolve([]),
        notizieCollegate(s, x.quando),
      ]);
      const a = await scriviConClaude(s, classifica, notizie);

      let copertina: Record<string, unknown> | undefined;
      try {
        const q = new URLSearchParams({ serie: x.serie, anno: String(x.anno), evento: x.evento, sessione: x.sessione });
        const img = await fetch(`${SITO}/storie/copertina?${q}`, { cache: "no-store", signal: AbortSignal.timeout(30000) });
        if (img.ok) {
          const asset = await c.assets.upload("image", Buffer.from(await img.arrayBuffer()), {
            filename: `${slugDa(a.titolo)}.jpg`,
          });
          copertina = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: `${s.campionato} ${s.evento}: risultati ${s.sessione}`,
          };
        }
      } catch {
        // senza copertina: si aggiunge dallo Studio
      }

      const id = `notizia-${chiave()}${chiave()}`;
      let slug = slugDa(a.titolo) || id;
      if ((await c.fetch<number>(`count(*[_type == "notiziaRedazione" && slug.current == $s])`, { s: slug })) > 0) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
      await c.create({
        _id: `drafts.${id}`,
        _type: "notiziaRedazione",
        titolo: a.titolo.slice(0, 110),
        slug: { _type: "slug", current: slug },
        campionato: s.serie === "motogp" ? "MotoGP" : "Superbike",
        dataPubblicazione: new Date().toISOString(),
        sommario: a.sommario.slice(0, 220),
        testo: daMarkdown(a.testo),
        ...(copertina ? { copertina } : {}),
      });
      await avvisa(a.titolo, `${SITO}/studio/structure/notiziaRedazione;${id}`);
      scritti.push(`${x.chiave}: ${a.titolo}`);
    } catch (e) {
      errori.push(`${x.chiave}: ${(e as Error).message}`);
    }
  }
  return { scritti, errori };
}
