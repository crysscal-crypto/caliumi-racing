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
};

export type Commento = {
  _id: string;
  titolo: string;
  link: string;
  fonte?: string;
  commento: string;
  data?: string;
};

type Feed = { fonte: string; campionato: string; url: string };

export const FEEDS: Feed[] = [
  { fonte: "GPOne", campionato: "MotoGP", url: "https://www.gpone.com/it/rss.xml" },
  { fonte: "Moto.it", campionato: "MotoGP", url: "https://www.moto.it/rss/news-motogp.xml" },
  { fonte: "Moto.it", campionato: "Superbike", url: "https://www.moto.it/rss/news-superbike.xml" },
];

const AGGIORNA_OGNI = 1800; // secondi (30 minuti)
const MAX_NOTIZIE = 45;
const MAX_ESTRATTO = 180;

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
      };
    })
    .filter((n) => n.titolo && /^https?:\/\//.test(n.link));
}

async function scaricaFeed(feed: Feed): Promise<Notizia[]> {
  try {
    const res = await fetch(feed.url, {
      next: { revalidate: AGGIORNA_OGNI },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CaliumiRacingBot/1.0; +https://caliumiracing.com)" },
    });
    if (!res.ok) return [];
    return leggiFeed(await res.text(), feed);
  } catch {
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
  return (await getTutteLeNotizie()).slice(0, quante);
}

export async function getNotiziaDaSlug(slug: string): Promise<Notizia | undefined> {
  return (await getTutteLeNotizie()).find((n) => n.slug === slug);
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
