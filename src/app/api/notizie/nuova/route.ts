// Inserimento automatico di una notizia (per l'assistente IA o qualsiasi automazione).
//
// POST https://www.caliumiracing.com/api/notizie/nuova
// Header:  Authorization: Bearer <NOTIZIE_API_KEY>
// Corpo JSON:
// {
//   "titolo": "Bagnaia vince a Phillip Island",          (obbligatorio)
//   "sommario": "Due righe di riassunto...",              (obbligatorio, max 220 caratteri)
//   "testo": "Testo in Markdown: paragrafi, ## titoletti, > citazioni, - elenchi, **grassetto**, [link](https://...)", (obbligatorio)
//   "campionato": "MotoGP" | "Moto2 / Moto3" | "Superbike" | "CIV" | "Motocross" | "Tecnica" | "Moto",
//   "immagine": "https://.../foto.jpg",                   (facoltativo: viene caricata su Sanity)
//   "credito": "© MotoGP.com",                            (facoltativo)
//   "pubblica": false                                     (false = BOZZA da approvare nello Studio — consigliato)
// }
// Risposta: { ok: true, id, stato: "bozza" | "pubblicata", studio, pagina }

import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { daMarkdown, slugDa } from "@/sanity/lib/markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CAMPIONATI = ["MotoGP", "Moto2 / Moto3", "Superbike", "CIV", "Motocross", "Tecnica", "Moto"];
const SITO = "https://www.caliumiracing.com";

const chiave = () => Math.random().toString(36).slice(2, 12);


export async function POST(req: Request) {
  const segreto = process.env.NOTIZIE_API_KEY;
  if (!segreto || req.headers.get("authorization") !== `Bearer ${segreto}`) {
    return NextResponse.json({ ok: false, errore: "Non autorizzato" }, { status: 401 });
  }
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return NextResponse.json({ ok: false, errore: "Manca SANITY_API_WRITE_TOKEN" }, { status: 500 });

  let d: Record<string, unknown>;
  try {
    d = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errore: "Il corpo deve essere JSON" }, { status: 400 });
  }

  const titolo = String(d.titolo ?? "").trim();
  const sommario = String(d.sommario ?? "").trim();
  const testo = String(d.testo ?? "").trim();
  if (!titolo || !sommario || !testo) {
    return NextResponse.json({ ok: false, errore: "Servono titolo, sommario e testo" }, { status: 400 });
  }
  const campionato = CAMPIONATI.includes(String(d.campionato)) ? String(d.campionato) : "Moto";
  const pubblica = d.pubblica === true;

  const sanity = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

  // slug unico
  let slug = slugDa(titolo) || `notizia-${Date.now()}`;
  const esiste = await sanity.fetch<number>(`count(*[_type == "notiziaRedazione" && slug.current == $s])`, { s: slug });
  if (esiste > 0) slug = `${slug}-${Date.now().toString(36)}`;

  // immagine di copertina (facoltativa)
  let copertina: Record<string, unknown> | undefined;
  if (typeof d.immagine === "string" && /^https?:\/\//.test(d.immagine)) {
    try {
      const res = await fetch(d.immagine, { signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        const asset = await sanity.assets.upload("image", Buffer.from(await res.arrayBuffer()), {
          filename: `${slug}.jpg`,
        });
        copertina = {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
          alt: titolo,
          ...(d.credito ? { credito: String(d.credito) } : {}),
        };
      }
    } catch {
      // senza foto: Cristian la aggiunge dallo Studio
    }
  }

  const base = `notizia-${chiave()}${chiave()}`;
  const id = pubblica ? base : `drafts.${base}`; // le bozze non sono visibili sul sito finché non le pubblichi
  await sanity.create({
    _id: id,
    _type: "notiziaRedazione",
    titolo: titolo.slice(0, 110),
    slug: { _type: "slug", current: slug },
    campionato,
    dataPubblicazione: new Date().toISOString(),
    sommario: sommario.slice(0, 220),
    testo: daMarkdown(testo),
    ...(copertina ? { copertina } : {}),
  });

  return NextResponse.json({
    ok: true,
    id: base,
    stato: pubblica ? "pubblicata" : "bozza",
    studio: `${SITO}/studio/structure/notiziaRedazione;${base}`,
    pagina: `${SITO}/notizie/${slug}`,
  });
}
