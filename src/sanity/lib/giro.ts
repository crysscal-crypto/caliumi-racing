// Giro di pubblicazione automatica: storie Instagram (video con musica), Reel, post Facebook,
// IndexNow e articoli scritti dall'IA. Usato dalla pagina /api/instagram/storie e da scripts/giro.ts
// (GitHub Actions, dove c'è ffmpeg per il video con la musica).

import { sessioniRecenti, datiStoria, urlImmagine } from "@/sanity/lib/storie";
import {
  leggiStato,
  segnaPubblicata,
  togliPubblicata,
  tokenValido,
  pubblicaStoria,
  prendiBlocco,
  lasciaBlocco,
} from "@/sanity/lib/instagram";
import { creaVideoStoria, eliminaVideo } from "@/sanity/lib/video-storia";
import { giroArticoli, giroAttualita, giroRichieste, pubblicaBozzeScadute, riempiSommari } from "@/sanity/lib/giornalista";
import { importaBozze } from "@/sanity/lib/importa-bozze";
import { client } from "@/sanity/lib/client";
import { facebookAttivo, sessioniPerReel, didascaliaReel, sessioniPerFacebook, pubblicaRisultatiFacebook, pubblicaArticoloFacebook } from "@/sanity/lib/facebook";

const MAX_PER_GIRO = 3;
const TEMPO_MAX = 200_000; // oltre questo tempo non inizio altre storie: riprendo al giro dopo

export type Esito = {
  pubblicate?: string[];
  errori?: string[];
  occupato?: boolean;
  articoli?: string[];
  erroriArticoli?: string[];
};

export async function giro(): Promise<Esito> {
  const inizio = Date.now();
  if (!(await prendiBlocco())) return { occupato: true };
  try {
    // bozze preparate a mano: vanno subito nello Studio
    const importate = await importaBozze().catch((e) => [`bozze: ${(e as Error).message}`]);
    if (importate.length) return { pubblicate: [], articoli: importate };

    // bozze dell'IA non pubblicate entro 2 ore: escono da sole (poi partono storia e post Facebook)
    const uscite = await pubblicaBozzeScadute().catch((e) => [`auto-pubblicazione: ${(e as Error).message}`]);
    if (uscite.length) return { pubblicate: [], articoli: uscite };

    // articoli senza sommario: lo scrive l'IA prima di annunciarli sui social
    const sommari = await riempiSommari().catch(() => [] as string[]);
    if (sommari.length) return { pubblicate: [], articoli: sommari };

    const [candidate, stato] = await Promise.all([sessioniRecenti(), leggiStato()]);
    // IndexNow: avviso subito Bing, Yandex, Seznam (e chi usa i loro indici, come ChatGPT e Copilot) dei nuovi articoli
    const daIndicizzare = await articoliDaAnnunciare(stato.pubblicate, "indexnow:");
    if (daIndicizzare.length && (await avvisaIndexNow(daIndicizzare.map((a) => `${SITO}/notizie/${a.slug}`)))) {
      for (const a of daIndicizzare) await segnaPubblicata(`indexnow:${a._id}`, stato);
    }

    const nuove = candidate.filter((c) => !stato.pubblicate.includes(c.chiave));
    const nuoviArticoli = await articoliDaAnnunciare(stato.pubblicate);
    const perFacebook = await sessioniPerFacebook(stato.pubblicate);
    const articoliFacebook = facebookAttivo() ? await articoliDaAnnunciare(stato.pubblicate, "fb:articolo:") : [];
    const perReel = await sessioniPerReel(stato.pubblicate);
    if (
      nuove.length === 0 &&
      nuoviArticoli.length === 0 &&
      perFacebook.length === 0 &&
      articoliFacebook.length === 0 &&
      perReel.length === 0
    ) {
      return { pubblicate: [], ...(await articoli(inizio)) };
    }

    const token = await tokenValido(stato);
    const pubblicate: string[] = [];
    const errori: string[] = [];

    // Storia "Nuovo articolo" per le notizie appena pubblicate da Cristian
    for (const a of nuoviArticoli.slice(0, 1)) {
      const chiave = `articolo:${a._id}`;
      await segnaPubblicata(chiave, stato);
      try {
        await pubblicaConMusica(`${SITO}/storie/articolo?slug=${encodeURIComponent(a.slug)}&v=${Date.now()}`, chiave, token, pubblicate, errori);
      } catch (e) {
        await togliPubblicata(chiave, stato);
        errori.push(`${chiave}: ${(e as Error).message}`);
      }
    }

    for (const c of nuove.slice(0, MAX_PER_GIRO)) {
      if (Date.now() - inizio > TEMPO_MAX) break;

      const dati = await datiStoria(c.serie, c.anno, c.evento, c.sessione);
      if (!dati || dati.righe.length < 3) continue; // risultati non ancora pronti: riprovo al giro dopo

      const immagine = `${urlImmagine(c)}&v=${Date.now()}`;
      await segnaPubblicata(c.chiave, stato);
      try {
        await pubblicaConMusica(immagine, c.chiave, token, pubblicate, errori);
      } catch (e) {
        await togliPubblicata(c.chiave, stato);
        errori.push(`${c.chiave}: ${(e as Error).message}`);
      }
    }

    // Facebook: risultati delle sessioni importanti e nuovi articoli (con link cliccabile)
    for (const c of perFacebook.slice(0, 2)) {
      if (Date.now() - inizio > TEMPO_MAX) break;
      const chiave = `fb:${c.chiave}`;
      await segnaPubblicata(chiave, stato);
      try {
        if (await pubblicaRisultatiFacebook(c)) pubblicate.push(chiave);
        else await togliPubblicata(chiave, stato);
      } catch (e) {
        await togliPubblicata(chiave, stato);
        errori.push(`${chiave}: ${(e as Error).message}`);
      }
    }
    // Reel Instagram dopo Sprint e gare (uno per giro: l'elaborazione del video richiede tempo)
    for (const c of perReel.slice(0, 1)) {
      if (Date.now() - inizio > 120_000) break;
      const chiave = `reel:${c.chiave}`;
      const didascalia = await didascaliaReel(c);
      if (!didascalia) continue;
      await segnaPubblicata(chiave, stato);
      let video: Awaited<ReturnType<typeof creaVideoStoria>> | null = null;
      try {
        const res = await fetch(`${urlImmagine(c)}&v=${Date.now()}`, { cache: "no-store", signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`Immagine ${res.status}`);
        video = await creaVideoStoria(Buffer.from(await res.arrayBuffer()), chiave);
        await pubblicaStoria({ video: video.url, reel: { didascalia } }, token);
        pubblicate.push(chiave);
      } catch (e) {
        // non riprovo all'infinito: un Reel perso non è grave
        errori.push(`${chiave}: ${(e as Error).message}`);
      } finally {
        if (video) await eliminaVideo(video.assetId);
      }
    }

    for (const a of articoliFacebook.slice(0, 1)) {
      const chiave = `fb:articolo:${a._id}`;
      await segnaPubblicata(chiave, stato);
      try {
        await pubblicaArticoloFacebook(a);
        pubblicate.push(chiave);
      } catch (e) {
        await togliPubblicata(chiave, stato);
        errori.push(`${chiave}: ${(e as Error).message}`);
      }
    }

    const art = await articoli(inizio);
    return { pubblicate, errori, ...art };
  } finally {
    await lasciaBlocco();
  }
}

// Dopo le storie, se c'è tempo, l'articolo automatico (bozza) delle sessioni importanti
async function articoli(inizio: number): Promise<{ articoli?: string[]; erroriArticoli?: string[] }> {
  if (Date.now() - inizio > 90_000) return {};
  try {
    // prima le richieste fatte dallo Studio ("Chiedi un articolo all'IA")
    const rq = await giroRichieste(inizio + 150_000);
    if (rq.scritti.length || rq.errori.length) return { articoli: rq.scritti, erroriArticoli: rq.errori };
    const r = await giroArticoli(inizio + 150_000);
    // se non c'erano gare da raccontare, ogni tanto un articolo di attualità o una curiosità
    const att = r.scritti.length ? { scritti: [], errori: [] } : await giroAttualita(inizio + 150_000);
    return { articoli: [...r.scritti, ...att.scritti], erroriArticoli: [...r.errori, ...att.errori] };
  } catch (e) {
    return { erroriArticoli: [(e as Error).message] };
  }
}

const SITO = "https://www.caliumiracing.com";

// Notizie scritte da Cristian pubblicate nelle ultime 48 ore e non ancora annunciate su Instagram
type ArticoloDaAnnunciare = { _id: string; slug: string; titolo: string; sommario: string; campionato: string };

async function articoliDaAnnunciare(fatte: string[], prefisso = "articolo:"): Promise<ArticoloDaAnnunciare[]> {
  try {
    const elenco = await client.fetch<ArticoloDaAnnunciare[]>(
      `*[_type == "notiziaRedazione" && defined(slug.current) && dataPubblicazione > $da && dataPubblicazione <= now()] | order(dataPubblicazione asc){ _id, "slug": slug.current, titolo, "sommario": coalesce(sommario, ""), campionato }`,
      { da: new Date(Date.now() - 48 * 3600000).toISOString() },
      { cache: "no-store" }
    );
    return elenco.filter((a) => !a._id.startsWith("drafts.") && !fatte.includes(`${prefisso}${a._id}`));
  } catch {
    return [];
  }
}

// Prima provo il video con la musica; se qualcosa va storto pubblico l'immagine
async function pubblicaConMusica(
  immagine: string,
  chiave: string,
  token: string,
  pubblicate: string[],
  errori: string[]
): Promise<void> {
  let video: Awaited<ReturnType<typeof creaVideoStoria>> | null = null;
  try {
    const res = await fetch(immagine, { cache: "no-store", signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Immagine ${res.status}`);
    video = await creaVideoStoria(Buffer.from(await res.arrayBuffer()), chiave);
    await pubblicaStoria({ video: video.url }, token);
    pubblicate.push(`${chiave} (video)`);
  } catch (e) {
    errori.push(`${chiave} video: ${(e as Error).message}`);
    await pubblicaStoria({ immagine }, token);
    pubblicate.push(`${chiave} (immagine)`);
  } finally {
    if (video) await eliminaVideo(video.assetId);
  }
}

const CHIAVE_INDEXNOW = "89957587f42874fb5cb2789aa3f5bc27"; // file in public/

async function avvisaIndexNow(url: string[]): Promise<boolean> {
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "www.caliumiracing.com",
        key: CHIAVE_INDEXNOW,
        keyLocation: `${SITO}/${CHIAVE_INDEXNOW}.txt`,
        urlList: [...url, `${SITO}/notizie`, `${SITO}/`],
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    return r.ok || r.status === 202;
  } catch {
    return false;
  }
}
