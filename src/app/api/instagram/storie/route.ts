// Pubblica come storia Instagram (video con musica) i risultati delle sessioni MotoGP e WorldSBK appena concluse.
// Chiamato ogni 5 minuti da cron-job.org con ?sfondo=1 (risponde subito e lavora in sottofondo)
// e, come riserva, da GitHub Actions (aspetta la fine e mostra il risultato).
// ?anteprima=1 mostra cosa verrebbe pubblicato senza pubblicare nulla.

import { NextResponse, after } from "next/server";
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
import { giroArticoli, giroAttualita } from "@/sanity/lib/giornalista";
import { client } from "@/sanity/lib/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
// Dati sempre freschi: senza questo le sessioni appena finite potevano risultare "non iniziate"
export const fetchCache = "force-no-store";

const MAX_PER_GIRO = 3;
const TEMPO_MAX = 200_000; // oltre questo tempo non inizio altre storie: riprendo al giro dopo

export async function GET(req: Request) {
  const segreto = process.env.CRON_SECRET;
  if (!segreto || req.headers.get("authorization") !== `Bearer ${segreto}`) {
    return NextResponse.json({ errore: "Non autorizzato" }, { status: 401 });
  }

  const parametri = new URL(req.url).searchParams;

  if (parametri.has("anteprima")) {
    try {
      const [candidate, stato] = await Promise.all([sessioniRecenti(), leggiStato()]);
      const nuove = candidate.filter((c) => !stato.pubblicate.includes(c.chiave));
      return NextResponse.json({
        sessioniRecenti: candidate.length,
        daPubblicare: nuove.map((c) => ({ chiave: c.chiave, immagine: urlImmagine(c) })),
      });
    } catch (e) {
      return NextResponse.json({ errore: (e as Error).message }, { status: 500 });
    }
  }

  if (parametri.has("sfondo")) {
    after(() => giro().catch(() => {}));
    return NextResponse.json({ avviato: true });
  }

  try {
    const esito = await giro();
    return NextResponse.json(esito, { status: esito.errori?.length && !esito.pubblicate?.length ? 500 : 200 });
  } catch (e) {
    return NextResponse.json({ errore: (e as Error).message }, { status: 500 });
  }
}

type Esito = {
  pubblicate?: string[];
  errori?: string[];
  occupato?: boolean;
  articoli?: string[];
  erroriArticoli?: string[];
};

async function giro(): Promise<Esito> {
  const inizio = Date.now();
  if (!(await prendiBlocco())) return { occupato: true };
  try {
    const [candidate, stato] = await Promise.all([sessioniRecenti(), leggiStato()]);
    const nuove = candidate.filter((c) => !stato.pubblicate.includes(c.chiave));
    const nuoviArticoli = await articoliDaAnnunciare(stato.pubblicate);
    if (nuove.length === 0 && nuoviArticoli.length === 0) return { pubblicate: [], ...(await articoli(inizio)) };

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
async function articoliDaAnnunciare(fatte: string[]): Promise<{ _id: string; slug: string }[]> {
  try {
    const elenco = await client.fetch<{ _id: string; slug: string }[]>(
      `*[_type == "notiziaRedazione" && defined(slug.current) && dataPubblicazione > $da && dataPubblicazione <= now()] | order(dataPubblicazione asc){ _id, "slug": slug.current }`,
      { da: new Date(Date.now() - 48 * 3600000).toISOString() },
      { cache: "no-store" }
    );
    return elenco.filter((a) => !a._id.startsWith("drafts.") && !fatte.includes(`articolo:${a._id}`));
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
