// Riceve i commenti dei lettori: li salva in Sanity come "da approvare" e avvisa Cristian su ntfy
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITO = "https://www.caliumiracing.com";

function errore(messaggio: string, status = 400) {
  return NextResponse.json({ errore: messaggio }, { status });
}

export async function POST(req: Request) {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return errore("Commenti non disponibili", 503);

  let dati: Record<string, unknown>;
  try {
    dati = await req.json();
  } catch {
    return errore("Dati non validi");
  }

  const nome = String(dati.nome ?? "").replace(/\s+/g, " ").trim();
  const testo = String(dati.testo ?? "").replace(/\r/g, "").trim();
  const pagina = String(dati.pagina ?? "");
  const titoloPagina = String(dati.titolo ?? "").slice(0, 200);
  const trappola = String(dati.sito ?? ""); // campo invisibile: lo compilano solo i bot
  const aperto = Number(dati.t ?? 0);

  // anti-spam
  if (trappola) return NextResponse.json({ ok: true });
  if (!aperto || Date.now() - aperto < 4000) return errore("Attendi qualche secondo prima di inviare.");
  if (!/^\/notizie\/[a-z0-9-]+$/i.test(pagina)) return errore("Pagina non valida");
  if (nome.length < 2 || nome.length > 40) return errore("Scrivi un nome tra 2 e 40 caratteri.");
  if (testo.length < 5 || testo.length > 1500) return errore("Il commento deve avere tra 5 e 1500 caratteri.");
  if (/(https?:\/\/|www\.|\.com\b|\.ru\b|\.xyz\b)/i.test(`${nome} ${testo}`)) return errore("I link non sono ammessi nei commenti.");

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const impronta = createHash("sha256").update(`${ip}|caliumi`).digest("hex").slice(0, 16);

  const c = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

  // massimo 3 commenti ogni 10 minuti dalla stessa connessione
  const recenti = await c.fetch<number>(
    `count(*[_type == "commentoLettore" && impronta == $i && data > $da])`,
    { i: impronta, da: new Date(Date.now() - 10 * 60000).toISOString() }
  );
  if (recenti >= 3) return errore("Hai inviato troppi commenti: riprova tra qualche minuto.", 429);

  const doc = await c.create({
    _type: "commentoLettore",
    approvato: false,
    nome,
    testo,
    pagina,
    titoloPagina,
    data: new Date().toISOString(),
    impronta,
  });

  const canale = process.env.NTFY_TOPIC;
  if (canale) {
    try {
      await fetch(`https://ntfy.sh/${canale}`, {
        method: "POST",
        body: `Nuovo commento da approvare di ${nome}: ${testo.slice(0, 120)}`,
        headers: {
          Title: "Caliumi Racing - commento",
          Click: `${SITO}/studio/structure/commentiDaApprovare`,
          Tags: "speech_balloon",
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // l'avviso non è indispensabile
    }
  }

  return NextResponse.json({ ok: true, id: doc._id });
}
