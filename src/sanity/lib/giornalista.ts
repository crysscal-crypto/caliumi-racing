// "Giornalista automatico": dopo Q2, Sprint e Gara della MotoGP e dopo Superpole e gare della Superbike
// scrive con l'IA (Google Gemini gratuito, oppure Claude) un articolo originale (risultati ufficiali + notizie delle testate),
// lo salva come BOZZA in Sanity con una foto vera a licenza libera (Wikimedia Commons, autore citato)
// o, se non c'è, la grafica del podio, e avvisa Cristian sul telefono (ntfy, gratuito).

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

  const testo = process.env.GEMINI_API_KEY ? await gemini(prompt) : await claude(prompt);
  const json = testo.slice(testo.indexOf("{"), testo.lastIndexOf("}") + 1);
  const a = JSON.parse(json) as Articolo;
  if (!a.titolo || !a.sommario || !a.testo) throw new Error("Risposta dell'IA incompleta");
  return a;
}

// Google Gemini: piano GRATUITO (chiave da aistudio.google.com, senza carta)
async function gemini(prompt: string): Promise<string> {
  // Se un modello è sovraccarico provo i successivi (tutti gratuiti)
  const modelli = [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest"].filter(
    (m, i, a): m is string => !!m && a.indexOf(m) === i
  );
  let ultimo = "";
  for (const modello of modelli) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "", "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(90000),
      cache: "no-store",
    });
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
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) return { scritti, errori };

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

      let copertina: Record<string, unknown> | undefined;
      try {
        const vincitore = s.righe[0];
        const foto = await fotoCommons(vincitore.nomeCompleto, s.campionato);
        let immagine: Buffer | null = null;
        let credito: string | undefined;
        if (foto) {
          const r = await fetch(foto.url, {
            headers: { "User-Agent": "CaliumiRacingBot/1.0 (https://www.caliumiracing.com)" },
            signal: AbortSignal.timeout(30000),
            cache: "no-store",
          });
          if (r.ok) {
            immagine = Buffer.from(await r.arrayBuffer());
            credito = foto.credito;
          }
        }
        if (!immagine) {
          // nessuna foto libera trovata: uso la grafica con il podio
          const q = new URLSearchParams({ serie: x.serie, anno: String(x.anno), evento: x.evento, sessione: x.sessione });
          const r = await fetch(`${SITO}/storie/copertina?${q}`, { cache: "no-store", signal: AbortSignal.timeout(30000) });
          if (r.ok) immagine = Buffer.from(await r.arrayBuffer());
        }
        if (immagine) {
          const asset = await c.assets.upload("image", immagine, { filename: `${slugDa(a.titolo)}.jpg` });
          copertina = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: credito ? `${vincitore.nomeCompleto}, ${s.campionato}` : `${s.campionato} ${s.evento}: risultati ${s.sessione}`,
            ...(credito ? { credito } : {}),
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

export async function giroAttualita(scadenza: number): Promise<{ scritti: string[]; errori: string[] }> {
  const scritti: string[] = [];
  const errori: string[] = [];
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) return { scritti, errori };

  // solo di giorno, ora italiana
  const ora = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Rome" }).format(new Date())
  );
  if (ora < 9 || ora >= 21 || Date.now() > scadenza) return { scritti, errori };

  const c = sanity();
  const doc = await c.getDocument<{ ultimaAttualita?: string }>(DOC);
  if (doc?.ultimaAttualita && Date.now() - Date.parse(doc.ultimaAttualita) < OGNI_ORE_ATTUALITA * 3600000) {
    return { scritti, errori };
  }
  // segno subito: se qualcosa va storto riprovo tra 48 ore, senza insistere
  await c.patch(DOC).set({ ultimaAttualita: new Date().toISOString() }).commit();

  try {
    const da = Date.now() - 30 * 3600000;
    const notizie = (await getTutteLeNotizie())
      .filter((n) => n.data && Date.parse(n.data) >= da)
      .slice(0, 40)
      .map((n) => `- [${n.campionato} · ${n.fonte}] ${n.titolo}${n.estratto ? ` — ${n.estratto}` : ""}`);
    if (notizie.length < 5) throw new Error("Poche notizie nelle ultime 30 ore");

    const giaScritti = await c.fetch<string[]>(
      `*[_type == "notiziaRedazione"] | order(_createdAt desc)[0...15].titolo`
    );

    const prompt = `Sei un giornalista della redazione di Caliumi Racing, sito di notizie di motociclismo.
Qui sotto ci sono i titoli e i sommari delle notizie di moto delle ultime 30 ore, da varie testate.

${notizie.join("\n")}

ARTICOLI GIÀ SCRITTI DA NOI (non ripetere lo stesso argomento):
${giaScritti.map((t) => `- ${t}`).join("\n") || "- nessuno"}

COMPITO:
1. Scegli UN argomento: la notizia più interessante e attuale (meglio se ne parlano più testate) oppure una curiosità che emerge da queste notizie.
2. Scrivi in italiano un articolo ORIGINALE su quell'argomento.

REGOLE:
- Non nominare la redazione né chi scrive: niente firme, niente "noi di Caliumi Racing".
- Usa solo i fatti presenti nei titoli e nei sommari. Non inventare dichiarazioni, numeri, date o dettagli.
- Se un fatto è riportato da una sola testata, scrivi "secondo [testata]".
- Nessuna frase copiata: rielabora con parole tue, tono appassionato ma serio.
- 300-450 parole. Un paragrafo d'apertura forte, poi 2 sezioni con titoletti Markdown "## ".
- Titolo SEO max 90 caratteri. Sommario max 200 caratteri.
- "campionato": uno tra "MotoGP", "Moto2 / Moto3", "Superbike", "CIV", "Motocross", "Moto".
- "protagonista": nome e cognome completi del pilota principale dell'articolo, oppure "" se non c'è.

Rispondi SOLO con un JSON valido, senza altro testo:
{"titolo": "...", "sommario": "...", "testo": "...markdown...", "campionato": "...", "protagonista": "..."}`;

    const testo = process.env.GEMINI_API_KEY ? await gemini(prompt) : await claude(prompt);
    const a = JSON.parse(testo.slice(testo.indexOf("{"), testo.lastIndexOf("}") + 1)) as ArticoloAttualita;
    if (!a.titolo || !a.sommario || !a.testo) throw new Error("Risposta dell'IA incompleta");
    const campionati = ["MotoGP", "Moto2 / Moto3", "Superbike", "CIV", "Motocross", "Moto"];
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
      ...(copertina ? { copertina } : {}),
    });
    await avvisa(`${a.titolo}${copertina ? "" : " (manca la foto)"}`, `${SITO}/studio/structure/notiziaRedazione;${id}`);
    scritti.push(`attualità: ${a.titolo}`);
  } catch (e) {
    errori.push(`attualità: ${(e as Error).message}`);
  }
  return { scritti, errori };
}
