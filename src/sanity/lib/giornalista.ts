// "Giornalista automatico": dopo Q2, Sprint e Gara della MotoGP e dopo Superpole e gare della Superbike
// scrive con l'IA (Google Gemini gratuito, oppure Claude) un articolo originale (risultati ufficiali + notizie delle testate),
// lo salva come BOZZA in Sanity con una foto vera a licenza libera (Wikimedia Commons, autore citato)
// o, se non c'è, la grafica del podio, e avvisa Cristian sul telefono (ntfy, gratuito).

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";
import { sessioniRecenti, datiStoria, type Candidata, type Storia } from "./storie";
import { getStagione, getCategorie, getClassifica, getEventi, eventoFinito } from "./motogp";
import { getStagioneSBK, getCategorieSBK, getClassificaSBK } from "./sbk";
import { getTutteLeNotizie, CAMPIONATI_MOTO } from "./notizie";
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

// Le bozze scritte dall'IA con la copertina escono da sole dopo questo tempo, se Cristian non le ha già pubblicate o cancellate
const ATTESA_PUBBLICAZIONE = 2 * 3600 * 1000;

function oraUscita(): string {
  return new Date(Date.now() + ATTESA_PUBBLICAZIONE).toLocaleTimeString("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function pubblicaBozzeScadute(): Promise<string[]> {
  if (!process.env.SANITY_API_WRITE_TOKEN) return [];
  const c = sanity();
  const limite = new Date(Date.now() - ATTESA_PUBBLICAZIONE).toISOString();
  const bozze = await c.fetch<Record<string, unknown>[]>(
    `*[_type == "notiziaRedazione" && _id in path("drafts.**") && autoPubblica == true && defined(copertina.asset) && _createdAt < $limite][0...3]`,
    { limite }
  );
  const fatte: string[] = [];
  for (const b of bozze) {
    const idBozza = String(b._id);
    const id = idBozza.replace(/^drafts\./, "");
    const { _id, _rev, _createdAt, _updatedAt, autoPubblica, ...campi } = b;
    void _id; void _rev; void _createdAt; void _updatedAt; void autoPubblica;
    await c
      .transaction()
      .createOrReplace({ ...campi, _id: id, _type: "notiziaRedazione", dataPubblicazione: new Date().toISOString() })
      .delete(idBozza)
      .commit();
    fatte.push(`pubblicato: ${String(b.titolo ?? id)}`);
  }
  return fatte;
}

function sanity() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Manca SANITY_API_WRITE_TOKEN");
  return createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: "raw" });
}

// Articoli senza sommario (scritti da Cristian): lo scrive l'IA
export async function riempiSommari(): Promise<string[]> {
  if (!process.env.SANITY_API_WRITE_TOKEN || !iaDisponibile()) return [];
  const c = sanity();
  const docs = await c.fetch<{ _id: string; titolo?: string; testo?: string }[]>(
    `*[_type == "notiziaRedazione" && (!defined(sommario) || sommario == "") && defined(testo) && _updatedAt > $da][0...3]{ _id, titolo, "testo": pt::text(testo) }`,
    { da: new Date(Date.now() - 30 * 86400000).toISOString() }
  );
  const fatti: string[] = [];
  for (const d of docs) {
    if (!d.testo || d.testo.length < 80) continue;
    const prompt = `Scrivi il sommario di questo articolo di motociclismo in italiano: massimo 200 caratteri, una o due frasi, chiaro e accattivante, solo fatti presenti nel testo, senza virgolette e senza ripetere il titolo parola per parola. Rispondi SOLO con il sommario.

Titolo: ${d.titolo ?? ""}

Testo:
${d.testo.slice(0, 6000)}`;
    let risposta = "";
    try {
      risposta = await ia(prompt);
    } catch {
      continue; // riprovo al giro dopo; intanto il sito usa l'inizio del testo
    }
    let sommario = risposta.replace(/^["'«\s]+|["'»\s]+$/g, "").replace(/\s+/g, " ").trim();
    if (sommario.length > 220) sommario = `${sommario.slice(0, 217).replace(/\s\S*$/, "")}…`;
    if (!sommario) continue;
    await c.patch(d._id).set({ sommario }).commit();
    fatti.push(`sommario: ${d.titolo ?? d._id}`);
  }
  return fatti;
}

export function tipoArticolo(c: Candidata): string | null {
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

async function scriviArticolo(s: Storia, classifica: string[], notizie: string[]): Promise<Articolo> {
  const risultati = s.righe.map((r) => `${r.pos}. ${r.nomeCompleto} (${r.team}) ${r.valore}`).join("\n");
  const prompt = `Sei un giornalista della redazione di Caliumi Racing, sito di notizie di motociclismo.
Scrivi in italiano un articolo ORIGINALE sulla sessione qui sotto.

CAMPIONATO: ${s.campionato}
EVENTO: ${s.evento} — circuito: ${s.circuito}
SESSIONE: ${s.sessione}

RISULTATI UFFICIALI (top 10, tempi o distacchi):
${risultati}

${classifica.length ? `CLASSIFICA MONDIALE PILOTI (top 10):\n${classifica.join("\n")}\n` : ""}
${notizie.length ? `TITOLI E SOMMARI DELLE TESTATE (solo come spunto: NON copiare frasi):\n${notizie.join("\n")}\n` : ""}
REGOLE:
- Non nominare la redazione né chi scrive: niente firme, niente "noi di Caliumi Racing".
- Usa solo fatti presenti nei dati sopra. Non inventare dichiarazioni, cadute, penalità o dettagli che non ci sono.
- Nessuna frase copiata dalle testate: rielabora con parole tue, tono appassionato ma serio.
- 350-550 parole. Un paragrafo d'apertura forte, poi 2-3 sezioni con titoletti Markdown "## ".
- Cita il podio con i distacchi e, se c'è, cosa cambia nel mondiale.
- Nei risultati i nomi sono abbreviati (es. "M. BEZZECCHI"): nel testo scrivi il nome completo solo se sei certo di chi è, altrimenti usa il cognome.
- Titolo SEO max 90 caratteri con vincitore, evento e sessione. Sommario max 200 caratteri.

Rispondi SOLO con un JSON valido, senza altro testo:
{"titolo": "...", "sommario": "...", "testo": "...markdown..."}`;

  const testo = await ia(prompt);
  const json = testo.slice(testo.indexOf("{"), testo.lastIndexOf("}") + 1);
  const a = JSON.parse(json) as Articolo;
  if (!a.titolo || !a.sommario || !a.testo) throw new Error("Risposta dell'IA incompleta");
  return a;
}

// Quale IA usare: tutte gratuite tranne Claude (a pagamento, solo se c'è la chiave e nessun'altra)
function iaDisponibile(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.GITHUB_TOKEN || process.env.ANTHROPIC_API_KEY
  );
}

// Prova Gemini; se è sovraccarico passa a GitHub Models (gratis con GitHub, nessuna chiave in più)
async function ia(prompt: string): Promise<string> {
  const errori: string[] = [];
  if (process.env.GEMINI_API_KEY) {
    try {
      return await gemini(prompt);
    } catch (e) {
      errori.push((e as Error).message);
    }
  }
  if (process.env.GROQ_API_KEY) {
    try {
      // Groq: piano gratuito (chiave da console.groq.com, senza carta)
      return await compatibileOpenAI(prompt, "Groq", "https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY, [
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-20b",
      ]);
    } catch (e) {
      errori.push((e as Error).message);
    }
  }
  if (process.env.GITHUB_TOKEN) {
    try {
      return await compatibileOpenAI(
        prompt,
        "GitHub Models",
        "https://models.github.ai/inference/chat/completions",
        process.env.GITHUB_TOKEN,
        ["openai/gpt-4.1-mini", "openai/gpt-4o-mini"]
      );
    } catch (e) {
      errori.push((e as Error).message);
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await claude(prompt);
    } catch (e) {
      errori.push((e as Error).message);
    }
  }
  throw new Error(errori.join(" | ") || "Nessuna IA configurata");
}

// Servizi con la stessa interfaccia di OpenAI (Groq, GitHub Models)
async function compatibileOpenAI(
  prompt: string,
  nome: string,
  url: string,
  chiave: string,
  modelli: string[]
): Promise<string> {
  let ultimo = "";
  for (const modello of modelli) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${chiave}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: modello,
          messages: [{ role: "user", content: prompt }],
          ...(/json/i.test(prompt) ? { response_format: { type: "json_object" } } : {}),
          temperature: 0.7,
          max_tokens: 4000,
        }),
        signal: AbortSignal.timeout(60000),
        cache: "no-store",
      });
      const grezzo = await res.text();
      let j: { choices?: { message?: { content?: string } }[]; error?: { message?: string } } = {};
      try {
        j = JSON.parse(grezzo);
      } catch {
        // risposta non JSON
      }
      const testo = j.choices?.[0]?.message?.content ?? "";
      if (res.ok && testo) return testo;
      ultimo = `${modello}: ${j.error?.message ?? `${res.status} ${grezzo.slice(0, 200)}`}`;
    } catch (e) {
      ultimo = `${modello}: ${(e as Error).message}`;
    }
  }
  throw new Error(`${nome}: ${ultimo}`);
}

// Google Gemini: piano GRATUITO (chiave da aistudio.google.com, senza carta)
async function gemini(prompt: string): Promise<string> {
  // Se un modello è sovraccarico provo i successivi (tutti gratuiti)
  const modelli = [
    process.env.GEMINI_MODEL,
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-flash-lite-latest",
  ].filter(
    (m, i, a): m is string => !!m && a.indexOf(m) === i
  );
  let ultimo = "";
  for (const modello of modelli) {
    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "", "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(55000),
        cache: "no-store",
      });
    } catch (e) {
      // troppo lento o non raggiungibile: provo il modello successivo
      ultimo = `${modello}: ${(e as Error).message}`;
      continue;
    }
    const j = (await res.json().catch(() => ({}))) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };
    const testo = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (res.ok && testo) return testo;
    ultimo = `${modello}: ${j.error?.message ?? res.status}`;
  }
  throw new Error(`Gemini: ${ultimo}`);
}

// Claude: a pagamento, usato solo se c'è ANTHROPIC_API_KEY e non c'è GEMINI_API_KEY
async function claude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: MODELLO, max_tokens: 3000, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(120000),
    cache: "no-store",
  });
  const j = (await res.json()) as { content?: { type: string; text?: string }[]; error?: { message?: string } };
  if (!res.ok) throw new Error(`Claude: ${j.error?.message ?? res.status}`);
  return (j.content ?? []).map((c) => c.text ?? "").join("");
}

// ---------- Foto vera da Wikimedia Commons (licenze libere, con autore e licenza citati) ----------
type Foto = { url: string; credito: string; pagina: string };
const LICENZE_OK = /^(cc[ -]by|cc[ -]by-sa|cc0|public domain|pd)/i;
const pulisciHtml = (t: string) => t.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function fotoCommons(nome: string, campionato: string): Promise<Foto | null> {
  for (const ricerca of [`"${nome}" ${campionato}`, `"${nome}"`]) {
    try {
      const q = new URLSearchParams({
        action: "query",
        format: "json",
        generator: "search",
        gsrsearch: `filetype:bitmap ${ricerca}`,
        gsrnamespace: "6",
        gsrlimit: "10",
        prop: "imageinfo",
        iiprop: "url|extmetadata|size",
        iiurlwidth: "1600",
      });
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, {
        headers: { "User-Agent": "CaliumiRacingBot/1.0 (https://www.caliumiracing.com)" },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      const j = (await res.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              index?: number;
              imageinfo?: {
                thumburl?: string;
                descriptionurl?: string;
                width?: number;
                height?: number;
                extmetadata?: Record<string, { value?: string }>;
              }[];
            }
          >;
        };
      };
      const pagine = Object.values(j.query?.pages ?? {}).sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
      for (const p of pagine) {
        const info = p.imageinfo?.[0];
        const meta = info?.extmetadata ?? {};
        const licenza = pulisciHtml(meta.LicenseShortName?.value ?? "");
        if (!info?.thumburl || (info.width ?? 0) < 800 || (info.width ?? 0) < (info.height ?? 0)) continue;
        if (!LICENZE_OK.test(licenza)) continue;
        const autore = pulisciHtml(meta.Artist?.value ?? "") || "Autore sconosciuto";
        return {
          url: info.thumburl,
          credito: `Foto: ${autore.slice(0, 80)} / Wikimedia Commons, ${licenza}`,
          pagina: info.descriptionurl ?? "",
        };
      }
    } catch {
      // provo la ricerca successiva
    }
  }
  return null;
}

async function avvisa(titolo: string, link: string): Promise<void> {
  const canale = process.env.NTFY_TOPIC;
  if (!canale) return;
  try {
    await fetch(`https://ntfy.sh/${canale}`, {
      method: "POST",
      body: `Nuovo articolo da controllare: ${titolo}`,
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
  if (!iaDisponibile()) return { scritti, errori };

  const c = sanity();
  type StatoArticoli = { articoli?: string[]; articoliFalliti?: string[]; versioneArticoli?: number };
  let doc: StatoArticoli | undefined = await c.getDocument<StatoArticoli>(DOC);
  // Azzeramento una tantum: i primi tentativi erano stati segnati come fatti anche se non riusciti
  if ((doc?.versioneArticoli ?? 0) < 2) {
    await c.patch(DOC).set({ articoli: [], articoliFalliti: [], versioneArticoli: 2 }).commit();
    doc = { articoli: [], articoliFalliti: [], versioneArticoli: 2 };
  }
  const fatti = doc?.articoli ?? [];
  const falliti = doc?.articoliFalliti ?? [];
  const tentativi = (k: string) => falliti.filter((f) => f === k).length;

  const candidate = (await sessioniRecenti()).filter((x) => {
    const tipo = tipoArticolo(x);
    if (!tipo || fatti.includes(x.chiave) || tentativi(x.chiave) >= 3) return false;
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
      const a = await scriviArticolo(s, classifica, notizie);

      // copertina: la grafica con podio e risultati di QUESTA sessione, così è sempre coerente con l'evento
      let copertina: Record<string, unknown> | undefined;
      try {
        const q = new URLSearchParams({ serie: x.serie, anno: String(x.anno), evento: x.evento, sessione: x.sessione });
        const r = await fetch(`${SITO}/storie/copertina?${q}`, { cache: "no-store", signal: AbortSignal.timeout(30000) });
        if (r.ok) {
          const asset = await c.assets.upload("image", Buffer.from(await r.arrayBuffer()), {
            filename: `${slugDa(a.titolo)}.jpg`,
          });
          copertina = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: `${s.campionato} ${s.evento}: risultati ${s.sessione}`,
            credito: "Grafica Caliumi Racing",
          };
        }
      } catch {
        // senza copertina: resta bozza e si aggiunge dallo Studio
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
        ...(copertina ? { copertina, autoPubblica: true } : {}),
      });
      await avvisa(
        copertina ? `${a.titolo} (esce da solo alle ${oraUscita()})` : `${a.titolo} (manca la foto: non esce da solo)`,
        `${SITO}/studio/structure/notiziaRedazione;${id}`
      );
      scritti.push(`${x.chiave}: ${a.titolo}`);
    } catch (e) {
      errori.push(`${x.chiave}: ${(e as Error).message}`);
      // riprovo ai controlli successivi (massimo 3 tentativi)
      await c
        .patch(DOC)
        .unset([`articoli[@ == "${x.chiave}"]`])
        .setIfMissing({ articoliFalliti: [] })
        .append("articoliFalliti", [x.chiave])
        .set({ ultimoErroreArticolo: `${new Date().toISOString()} ${x.chiave}: ${(e as Error).message}` })
        .commit()
        .catch(() => {});
    }
  }
  return { scritti, errori };
}

// ---------- Ogni 2 giorni: un articolo di attualità o una curiosità, scelto dall'IA tra le notizie del momento ----------
const OGNI_ORE_ATTUALITA = 48;

type ArticoloAttualita = Articolo & { campionato?: string; protagonista?: string };

type Richiesta = { _id: string; argomento?: string; note?: string };

// Classifica piloti MotoGP aggiornata + GP e punti ancora in palio: per articoli su calcoli e previsioni
async function situazioneMondiale(): Promise<string> {
  try {
    const stagione = await getStagione();
    if (!stagione) return "";
    const [categorie, eventi] = await Promise.all([getCategorie(stagione), getEventi(stagione)]);
    const motogp = categorie.find((c) => /motogp/i.test(c.name)) ?? categorie[0];
    const classifica = await getClassifica(stagione, motogp);
    const rimasti = eventi.filter((e) => !eventoFinito(e) && e.status !== "CANCELLED");
    const righe = classifica
      .slice(0, 10)
      .map((r) => `${r.position}. ${r.rider.full_name} ${r.points} punti`)
      .join("\n");
    return `CLASSIFICA PILOTI MOTOGP ${stagione.year} AGGIORNATA (dati ufficiali):
${righe}
GP ANCORA DA CORRERE: ${rimasti.length} (${rimasti.map((e) => e.name).join(", ") || "nessuno"}).
PUNTI IN PALIO PER OGNI GP: 37 (Sprint 12-9-7-6-5-4-3-2-1 ai primi 9, Gara 25-20-16-13-11-10-9-8-7-6-5-4-3-2-1 ai primi 15). Totale ancora disponibile: ${rimasti.length * 37}.`;
  } catch {
    return "";
  }
}

// Articoli chiesti da Cristian dallo Studio ("Chiedi un articolo all'IA"): li scrive subito
export async function giroRichieste(scadenza: number): Promise<{ scritti: string[]; errori: string[] }> {
  if (!process.env.SANITY_API_WRITE_TOKEN || !iaDisponibile()) {
    return { scritti: [], errori: [] };
  }
  const c = sanity();
  // nuove, oppure fallite (fino a 3 tentativi), oppure rimaste "in lavorazione" da più di 15 minuti
  const r = await c.fetch<(Richiesta & { tentativi?: number; riprova?: boolean }) | null>(
    `*[_type == "richiestaArticolo" && !(_id in path("drafts.**")) && (
        !defined(esito) || riprova == true ||
        (string::startsWith(esito, "❌") && coalesce(tentativi, 1) < 3) ||
        (esito == "In lavorazione…" && _updatedAt < $vecchio)
      )] | order(_createdAt asc)[0]{ _id, argomento, note, tentativi, riprova }`,
    { vecchio: new Date(Date.now() - 15 * 60000).toISOString() }
  );
  if (!r) return { scritti: [], errori: [] };
  // segno subito come "in lavorazione" per non scriverlo due volte
  await c
    .patch(r._id)
    .set({ esito: "In lavorazione…", riprova: false, tentativi: r.riprova ? 1 : (r.tentativi ?? 0) + 1 })
    .commit();
  const esito = await giroAttualita(scadenza, r);
  await c
    .patch(r._id)
    .set({
      esito: esito.scritti.length
        ? `✅ Scritto: ${esito.scritti[0].replace(/^attualità: /, "")} — trovi la bozza in "Notizia scritta da me"`
        : `❌ Non riuscito: ${esito.errori[0] ?? "nessun articolo scritto"}. Riprovo da solo (massimo 3 tentativi).`,
    })
    .commit();
  return esito;
}

export async function giroAttualita(
  scadenza: number,
  richiesta?: Richiesta
): Promise<{ scritti: string[]; errori: string[] }> {
  const scritti: string[] = [];
  const errori: string[] = [];
  if (!iaDisponibile()) return { scritti, errori };
  const c = sanity();

  if (!richiesta) {
    // solo di giorno, ora italiana
    const ora = Number(
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Rome" }).format(new Date())
    );
    if (ora < 9 || ora >= 21 || Date.now() > scadenza) return { scritti, errori };

    const doc = await c.getDocument<{ ultimaAttualita?: string }>(DOC);
    if (doc?.ultimaAttualita && Date.now() - Date.parse(doc.ultimaAttualita) < OGNI_ORE_ATTUALITA * 3600000) {
      return { scritti, errori };
    }
    // segno subito: se qualcosa va storto riprovo tra 48 ore, senza insistere
    await c.patch(DOC).set({ ultimaAttualita: new Date().toISOString() }).commit();
  }

  try {
    // per una richiesta su un argomento preciso guardo più indietro (3 giorni)
    const da = Date.now() - (richiesta ? 72 : 30) * 3600000;
    const notizie = (await getTutteLeNotizie())
      .filter((n) => n.data && Date.parse(n.data) >= da && (!!richiesta?.argomento || CAMPIONATI_MOTO.includes(n.campionato)))
      .slice(0, richiesta ? 60 : 40)
      .map((n) => `- [${n.campionato} · ${n.fonte}] ${n.titolo}${n.estratto ? ` — ${n.estratto}` : ""}`);
    if (notizie.length < 5 && !richiesta?.note) throw new Error("Poche notizie recenti");

    // se Cristian ha scritto la richiesta solo nelle informazioni, la uso come argomento
    const argomento = (richiesta?.argomento?.trim() || richiesta?.note?.trim().slice(0, 400)) ?? undefined;
    const note = richiesta?.argomento?.trim() ? richiesta?.note?.trim() : undefined;
    const mondiale = richiesta ? await situazioneMondiale() : "";
    const compito = argomento
      ? `COMPITO:
1. L'argomento è deciso dal direttore: "${argomento}". Scrivi su questo, usando le notizie qui sopra che lo riguardano${note ? " e le informazioni del direttore qui sotto" : ""}.
2. Se nelle notizie e nelle informazioni non c'è abbastanza materiale, scrivi un articolo più corto (anche 200 parole) senza inventare nulla.
3. Scrivi in italiano un articolo ORIGINALE.`
      : `COMPITO:
1. Scegli UN argomento: la notizia più interessante e attuale (meglio se ne parlano più testate) oppure una curiosità che emerge da queste notizie.
2. Scrivi in italiano un articolo ORIGINALE su quell'argomento.`;

    const giaScritti = await c.fetch<string[]>(
      `*[_type == "notiziaRedazione"] | order(_createdAt desc)[0...15].titolo`
    );

    const prompt = `Sei un giornalista della redazione di Caliumi Racing, sito di notizie di motociclismo.
Qui sotto ci sono i titoli e i sommari delle notizie di moto degli ultimi giorni, da varie testate.

${notizie.join("\n")}

ARTICOLI GIÀ SCRITTI DA NOI (non ripetere lo stesso argomento${argomento ? ", salvo quello richiesto dal direttore" : ""}):
${giaScritti.map((t) => `- ${t}`).join("\n") || "- nessuno"}
${note ? `\nINFORMAZIONI DEL DIRETTORE (fatti verificati, puoi usarli):\n${note.slice(0, 4000)}\n` : ""}${mondiale ? `\n${mondiale}\n(Se l'argomento riguarda il Mondiale, fai i calcoli SOLO con questi numeri: sono ufficiali.)\n` : ""}
${compito}

REGOLE:
- Non nominare la redazione né chi scrive: niente firme, niente "noi di Caliumi Racing".
- Usa solo i fatti presenti nei titoli, nei sommari${note ? ", nelle informazioni del direttore" : ""}${mondiale ? " e nella classifica ufficiale" : ""}. Non inventare dichiarazioni, numeri, date o dettagli.
- Se un fatto è riportato da una sola testata, scrivi "secondo [testata]".
- Nessuna frase copiata: rielabora con parole tue, tono appassionato ma serio.
- 300-450 parole. Un paragrafo d'apertura forte, poi 2 sezioni con titoletti Markdown "## ".
- Titolo SEO max 90 caratteri. Sommario max 200 caratteri.
- "campionato": uno tra "MotoGP", "Moto2 / Moto3", "Superbike", "CIV", "Motocross", "Tecnica", "Moto" ("Tecnica" per articoli su come sono fatte le moto: motori, telai, aerodinamica, elettronica, gomme).
- "protagonista": nome e cognome completi del pilota principale dell'articolo, oppure "" se non c'è.

Rispondi SOLO con un JSON valido, senza altro testo:
{"titolo": "...", "sommario": "...", "testo": "...markdown...", "campionato": "...", "protagonista": "..."}`;

    const testo = await ia(prompt);
    const a = JSON.parse(testo.slice(testo.indexOf("{"), testo.lastIndexOf("}") + 1)) as ArticoloAttualita;
    if (!a.titolo || !a.sommario || !a.testo) throw new Error("Risposta dell'IA incompleta");
    const campionati = ["MotoGP", "Moto2 / Moto3", "Superbike", "CIV", "Motocross", "Tecnica", "Moto"];
    const campionato = campionati.includes(a.campionato ?? "") ? (a.campionato as string) : "Moto";

    // foto vera (licenza libera) del protagonista, se c'è
    let copertina: Record<string, unknown> | undefined;
    if (a.protagonista) {
      try {
        const foto = await fotoCommons(a.protagonista, campionato === "Moto" ? "" : campionato);
        if (foto) {
          const r = await fetch(foto.url, {
            headers: { "User-Agent": "CaliumiRacingBot/1.0 (https://www.caliumiracing.com)" },
            signal: AbortSignal.timeout(30000),
            cache: "no-store",
          });
          if (r.ok) {
            const asset = await c.assets.upload("image", Buffer.from(await r.arrayBuffer()), {
              filename: `${slugDa(a.titolo)}.jpg`,
            });
            copertina = {
              _type: "image",
              asset: { _type: "reference", _ref: asset._id },
              alt: a.protagonista,
              credito: foto.credito,
            };
          }
        }
      } catch {
        // senza foto: Cristian la aggiunge dallo Studio prima di pubblicare
      }
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
      campionato,
      dataPubblicazione: new Date().toISOString(),
      sommario: a.sommario.slice(0, 220),
      testo: daMarkdown(a.testo),
      ...(copertina ? { copertina, autoPubblica: true } : {}),
    });
    await avvisa(
      copertina ? `${a.titolo} (esce da solo alle ${oraUscita()})` : `${a.titolo} (manca la foto: non esce da solo)`,
      `${SITO}/studio/structure/notiziaRedazione;${id}`
    );
    scritti.push(`attualità: ${a.titolo}`);
  } catch (e) {
    errori.push(`attualità: ${(e as Error).message}`);
  }
  return { scritti, errori };
}
