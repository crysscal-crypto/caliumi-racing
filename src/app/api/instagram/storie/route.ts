// Chiamato ogni 15 minuti da GitHub Actions: pubblica come storia Instagram
// i risultati delle sessioni MotoGP e WorldSBK appena concluse.
// ?anteprima=1 mostra cosa verrebbe pubblicato senza pubblicare nulla.

import { NextResponse } from "next/server";
import { sessioniRecenti, datiStoria, urlImmagine } from "@/sanity/lib/storie";
import { leggiStato, segnaPubblicata, togliPubblicata, tokenValido, pubblicaStoria } from "@/sanity/lib/instagram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PER_GIRO = 3;

export async function GET(req: Request) {
  const segreto = process.env.CRON_SECRET;
  if (!segreto || req.headers.get("authorization") !== `Bearer ${segreto}`) {
    return NextResponse.json({ errore: "Non autorizzato" }, { status: 401 });
  }

  const anteprima = new URL(req.url).searchParams.has("anteprima");

  try {
    const [candidate, stato] = await Promise.all([sessioniRecenti(12), leggiStato()]);
    const nuove = candidate.filter((c) => !stato.pubblicate.includes(c.chiave));

    if (anteprima) {
      return NextResponse.json({
        sessioniRecenti: candidate.length,
        daPubblicare: nuove.map((c) => ({ chiave: c.chiave, immagine: urlImmagine(c) })),
      });
    }

    if (nuove.length === 0) return NextResponse.json({ pubblicate: [] });

    const token = await tokenValido(stato);
    const pubblicate: string[] = [];
    const errori: string[] = [];

    for (const c of nuove.slice(0, MAX_PER_GIRO)) {
      const dati = await datiStoria(c.serie, c.anno, c.evento, c.sessione);
      if (!dati || dati.righe.length < 3) continue; // risultati non ancora pronti: riprovo al giro dopo

      await segnaPubblicata(c.chiave, stato);
      try {
        await pubblicaStoria(`${urlImmagine(c)}&v=${Date.now()}`, token);
        pubblicate.push(c.chiave);
      } catch (e) {
        await togliPubblicata(c.chiave, stato);
        errori.push(`${c.chiave}: ${(e as Error).message}`);
      }
    }

    return NextResponse.json({ pubblicate, errori }, { status: errori.length && !pubblicate.length ? 500 : 200 });
  } catch (e) {
    return NextResponse.json({ errore: (e as Error).message }, { status: 500 });
  }
}
