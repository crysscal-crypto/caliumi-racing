// Pubblica come storia Instagram (video con musica) i risultati delle sessioni MotoGP e WorldSBK appena concluse.
// Chiamato ogni 5 minuti da cron-job.org con ?sfondo=1.
// Su Cloudflare (dove non c'è ffmpeg per il video con la musica) il lavoro viene passato a GitHub Actions
// (workflow "Storie Instagram", che esegue scripts/giro.ts); altrove lavora in sottofondo come prima.
// ?anteprima=1 mostra cosa verrebbe pubblicato senza pubblicare nulla.

import { NextResponse, after } from "next/server";
import { sessioniRecenti, urlImmagine } from "@/sanity/lib/storie";
import { leggiStato } from "@/sanity/lib/instagram";
import { giro } from "@/sanity/lib/giro";
import { client } from "@/sanity/lib/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
// Dati sempre freschi: senza questo le sessioni appena finite potevano risultare "non iniziate"
export const fetchCache = "force-no-store";

const REPO = "crysscal-crypto/caliumi-racing";
const WORKFLOW = "storie-instagram.yml";

// Fa partire il giro su GitHub Actions (serve la variabile GITHUB_TOKEN_GIRO)
async function avviaSuGitHub(): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN_GIRO;
  if (!token) return false;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "caliumi-racing",
      },
      body: JSON.stringify({ ref: "main" }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    return r.status === 204;
  } catch {
    return false;
  }
}

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
    if (process.env.GITHUB_TOKEN_GIRO) {
      const ok = await avviaSuGitHub();
      return NextResponse.json({ avviato: ok, dove: "github" }, { status: ok ? 200 : 502 });
    }
    after(() => giro().catch(() => {}));
    return NextResponse.json({ avviato: true });
  }

  try {
    const esito = await giro();
    // controllo manuale: mostro anche lo stato delle ultime richieste di articoli
    const richieste = await client
      .withConfig({ useCdn: false, token: process.env.SANITY_API_WRITE_TOKEN, perspective: "raw" })
      .fetch(`*[_type == "richiestaArticolo"] | order(_createdAt desc)[0...4]{ _id, argomento, esito, tentativi }`)
      .catch(() => []);
    return NextResponse.json({ ...esito, richieste }, { status: esito.errori?.length && !esito.pubblicate?.length ? 500 : 200 });
  } catch (e) {
    return NextResponse.json({ errore: (e as Error).message }, { status: 500 });
  }
}
