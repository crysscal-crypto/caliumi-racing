// Aggregatore notizie da feed RSS (nessun pacchetto esterno)
import { client } from "@/sanity/lib/client";

export type Notizia = {
  id: string;
  slug: string;
  titolo: string;
  link: string;
  estratto: string;
  data: string | null; // ISO
  fonte: string;
  campionato: string;
  immagine: string | null; // URL miniatura dal feed o dalla pagina articolo
};

export type Commento = {
  _id: string;
  titolo: string;
  link: string;
  fonte?: string;
  commento: string;
  data?: string;
};

// leggiPagina: se il feed non ha la foto, prova a prenderla dalla pagina articolo.
// Va lasciato false per i siti che bloccano le richieste (es. GPOne risponde 403/429).
type Feed = { fonte: string; campionato: string; url: string; leggiPagina?: boolean };

export const FEEDS: Feed[] = [
  { fonte: "GPOne", campionato: "MotoGP", url: "https://www.gpone.com/it/rss.xml", leggiPagina: false },
  { fonte: "Moto.it", campionato: "MotoGP", url: "https://www.moto.it/rss/news-motogp.xml", leggiPagina: true },
  { fonte: "Moto.it", campionato: "Superbike", url: "https://www.moto.it/rss/news-superbike.xml", leggiPagina: true },
  { fonte: "Moto.it", campionato: "Motorsport", url: "https://www.moto.it/rss/news-sport.xml", leggiPagina: true },
  { fonte: "Moto.it", campionato: "Motocross", url: "https://www.moto.it/rss/news-motocross.xml", leggiPagina: true },
  { fonte: "Moto.it", campionato: "Moto News", url: "https://www.moto.it/rss/news.xml", leggiPagina: true },
  { fonte: "Motorsport.com", campionato: "MotoGP", url: "https://it.motorsport.com/rss/motogp/news/", leggiPagina: true },
  { fonte: "Motorsport.com", campionato: "Superbike", url: "https://it.motorsport.com/rss/wsbk/news/", leggiPagina: true },
];

const AGGIORNA_OGNI = 1800; // secondi (30 minuti)
const CACHE_IMMAGINI = 86400; // secondi (24 ore) — l'immagine di un articolo non cambia
const TIMEOUT_IMMAGINE = 5000; // millisecondi, per singola pagina
const TEMPO_MAX_IMMAGINI = 15000; // millisecondi, tempo massimo totale per cercare le foto
const RICHIESTE_INSIEME = 6; // pagine articolo scaricate in parallelo
const MAX_NOTIZIE = 60;
const MAX_ESTRATTO = 180;
const USER_AGENT = "Mozilla/5.0 (compatible; CaliumiRacingBot/1.0; +https://caliumiracing.com)";
const SVILUPPO = process.env.NODE_ENV !== "production";

function decodifica(testo: string): string {
  return testo
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(blocco: string, nome: string): string {
  const m = blocco.match(new RegExp(`<${nome}[^>]*>([\\s\\S]*?)</${nome}>`, "i"));
  return m ? m[1] : "";
}

function linkAtom(blocco: string): string {
  const m =
    blocco.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) ||
    blocco.match(/<link[^>]*href=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

// Normalizza un URL immagine: solo https, risolve URL relativi rispetto alla pagina
function normalizzaImmagine(url: string, base?: string): string | null {
  let u = url.replace(/&amp;/g, "&").trim();
  if (!u) return null;
  if (u.startsWith("//")) u = "https:" + u;
  else if (base && !/^https?:\/\//i.test(u)) {
    try {
      u = new URL(u, base).toString();
    } catch {
      return null;
    }
  }
  if (u.startsWith("http://")) u = "https://" + u.slice(7);
  return /^https:\/\//.test(u) ? u : null;
}

// Cerca l'immagine nel feed: enclosure, media:content, media:thumbnail, oppure primo <img> nel testo
function estraiImmagine(blocco: string): string | null {
  const grezzo = blocco
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'");

  const m =
    grezzo.match(/<enclosure[^>]*type=["']image[^"']*["'][^>]*url=["']([^"']+)["']/i) ||
    grezzo.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i) ||
    grezzo.match(/<enclosure[^>]*url=["']([^"']+\.(?:jpe?g|png|webp|gif)[^"']*)["']/i) ||
    grezzo.match(/<media:content[^>]*url=["']([^"']+)["']/i) ||
    grezzo.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) ||
    grezzo.match(/<img[^>]*src=["']([^"']+)["']/i);

  return m ? normalizzaImmagine(m[1]) : null;
}

function feedLeggePagina(fonte: string): boolean {
  return FEEDS.some((f) => f.fonte === fonte && f.leggiPagina);
}

// Se il feed non ha la foto, legge og:image / twitter:image dalla pagina dell'articolo
async function immagineDaPagina(link: string): Promise<string | null> {
  try {
    const res = await fetch(link, {
      next: { revalidate: CACHE_IMMAGINI },
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(TIMEOUT_IMMAGINE),
    });
    if (!res.ok) {
      if (SVILUPPO) console.warn(`[notizie] foto: pagina risponde ${res.status} → ${link}`);
      return null;
    }
    const html = (await res.text()).slice(0, 300000); // basta l'intestazione della pagina

    const m =
      html.match(/<meta[^>]*property=["']og:image(?::secure_url|:url)?["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url|:url)?["']/i) ||
      html.match(/<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i) ||
      html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i);

    if (!m && SVILUPPO) console.warn(`[notizie] foto: og:image non trovata → ${link}`);
    return m ? normalizzaImmagine(m[1], link) : null;
  } catch (e) {
    if (SVILUPPO) console.warn(`[notizie] foto: errore ${(e as Error).name} → ${link}`);
    return null;
  }
}

// Esegue le richieste a gruppi, per non farsi bloccare dai siti fonte
async function inParallelo<T, R>(lista: T[], max: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const risultati: R[] = new Array(lista.length);
  let prossimo = 0;
  const lavoratori = Array.from({ length: Math.min(max, lista.length) }, async () => {
    while (prossimo < lista.length) {
      const i = prossimo++;
      risultati[i] = await fn(lista[i]);
    }
  });
  await Promise.all(lavoratori);
  return risultati;
}

// Cerca le foto mancanti ma senza mai bloccare la pagina: dopo TEMPO_MAX_IMMAGINI
// mostra le notizie comunque (le foto non ancora trovate arriveranno al prossimo aggiornamento)
async function completaImmagini(notizie: Notizia[]): Promise<Notizia[]> {
  const trovate = new Map<string, string | null>();
  const lavoro = inParallelo(notizie, RICHIESTE_INSIEME, async (n) => {
    if (n.immagine || !feedLeggePagina(n.fonte)) return;
    trovate.set(n.id, await immagineDaPagina(n.link));
  });
  await Promise.race([lavoro, new Promise((fine) => setTimeout(fine, TEMPO_MAX_IMMAGINI))]);
  return notizie.map((n) => {
    const foto = trovate.get(n.id);
    return n.immagine || !foto ? n : { ...n, immagine: foto };
  });
}

function taglia(testo: string): string {
  if (testo.length <= MAX_ESTRATTO) return testo;
  const corto = testo.slice(0, MAX_ESTRATTO);
  return corto.slice(0, corto.lastIndexOf(" ")) + "…";
}

function dataIso(valore: string): string | null {
  if (!valore) return null;
  const d = new Date(decodifica(valore));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function pulisciLink(link: string): string {
  return link.split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
}

function codiceBreve(testo: string): string {
  let h = 5381;
  for (let i = 0; i < testo.length; i++) h = ((h << 5) + h + testo.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function creaSlug(titolo: string, link: string): string {
  const base = titolo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return `${base || "notizia"}-${codiceBreve(pulisciLink(link))}`;
}

function leggiFeed(xml: string, feed: Feed): Notizia[] {
  const blocchi = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];

  return blocchi
    .map((b) => {
      const titolo = decodifica(tag(b, "title"));
      const link = decodifica(tag(b, "link")) || linkAtom(b);
      const descrizione = decodifica(tag(b, "description") || tag(b, "summary"));
      const data = dataIso(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date"));
      return {
        id: link,
        slug: creaSlug(titolo, link),
        titolo,
        link,
        estratto: taglia(descrizione),
        data,
        fonte: feed.fonte,
        campionato: feed.campionato,
        immagine: estraiImmagine(b),
      };
    })
    .filter((n) => n.titolo && /^https?:\/\//.test(n.link));
}

async function scaricaFeed(feed: Feed): Promise<Notizia[]> {
  try {
    const res = await fetch(feed.url, {
      next: { revalidate: AGGIORNA_OGNI },
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
      if (SVILUPPO) console.warn(`[notizie] feed risponde ${res.status} → ${feed.url}`);
      return [];
    }
    return leggiFeed(await res.text(), feed);
  } catch {
    if (SVILUPPO) console.warn(`[notizie] feed non raggiungibile → ${feed.url}`);
    return [];
  }
}

async function getTutteLeNotizie(): Promise<Notizia[]> {
  const risultati = await Promise.all(FEEDS.map(scaricaFeed));
  const visti = new Set<string>();

  return risultati
    .flat()
    .filter((n) => {
      const chiave = pulisciLink(n.link);
      if (visti.has(chiave)) return false;
      visti.add(chiave);
      return true;
    })
    .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
}

export async function getNotizie(quante: number = MAX_NOTIZIE): Promise<Notizia[]> {
  const notizie = (await getTutteLeNotizie()).slice(0, quante);
  return completaImmagini(notizie);
}

export async function getNotiziaDaSlug(slug: string): Promise<Notizia | undefined> {
  const notizia = (await getTutteLeNotizie()).find((n) => n.slug === slug);
  if (!notizia || notizia.immagine || !feedLeggePagina(notizia.fonte)) return notizia;
  return { ...notizia, immagine: await immagineDaPagina(notizia.link) };
}

export async function getCommenti(): Promise<Commento[]> {
  try {
    return await client.fetch(
      `*[_type == "commentoNotizia" && defined(link)] | order(data desc)[0...50] {
        _id, titolo, link, fonte, commento, data
      }`
    );
  } catch {
    return [];
  }
}

export function mappaCommenti(commenti: Commento[]): Map<string, Commento> {
  const mappa = new Map<string, Commento>();
  commenti.forEach((c) => mappa.set(pulisciLink(c.link), c));
  return mappa;
}

export function formattaData(iso: string | null | undefined, conOra = true): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    ...(conOra ? { hour: "2-digit", minute: "2-digit" } : { year: "numeric" }),
    timeZone: "Europe/Rome",
  }).format(new Date(iso));
}