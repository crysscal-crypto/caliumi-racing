// Bozze preparate a mano (da Claude) dentro src/data/bozze-da-importare.json:
// al primo controllo del cron finiscono nello Studio come BOZZA, con la copertina già caricata.
// Non crea doppioni: se la bozza o l'articolo pubblicato esistono già, non fa nulla.

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";
import { daMarkdown, slugDa } from "./markdown";
import bozze from "@/data/bozze-da-importare.json";

const SITO = "https://www.caliumiracing.com";

type Bozza = {
  id: string;
  scadenza?: string;
  sostituisce?: string; // id di una vecchia bozza da eliminare (solo se mai pubblicata)
  titolo: string;
  campionato: string;
  sommario: string;
  testo: string;
  immagine?: string;
  alt?: string;
  credito?: string;
};

export async function importaBozze(): Promise<string[]> {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return [];
  const c = createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: "raw" });
  const fatte: string[] = [];

  for (const b of bozze as Bozza[]) {
    if (b.scadenza && Date.now() > Date.parse(b.scadenza)) continue;
    const id = `notizia-${b.id}`;
    if (b.sostituisce) await c.delete(`drafts.notizia-${b.sostituisce}`).catch(() => {});
    const esiste = await c.fetch<number>(`count(*[_id in [$a, $b]])`, { a: id, b: `drafts.${id}` });
    if (esiste > 0) continue;

    let copertina: Record<string, unknown> | undefined;
    if (b.immagine) {
      try {
        const r = await fetch(`${SITO}${b.immagine}`, { cache: "no-store", signal: AbortSignal.timeout(20000) });
        if (r.ok) {
          const asset = await c.assets.upload("image", Buffer.from(await r.arrayBuffer()), { filename: `${b.id}.jpg` });
          copertina = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: b.alt ?? b.titolo,
            ...(b.credito ? { credito: b.credito } : {}),
          };
        }
      } catch {
        // senza copertina: si aggiunge dallo Studio
      }
    }

    let slug = slugDa(b.titolo) || b.id;
    if ((await c.fetch<number>(`count(*[_type == "notiziaRedazione" && slug.current == $s])`, { s: slug })) > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    await c.createIfNotExists({
      _id: `drafts.${id}`,
      _type: "notiziaRedazione",
      titolo: b.titolo.slice(0, 110),
      slug: { _type: "slug", current: slug },
      campionato: b.campionato,
      dataPubblicazione: new Date().toISOString(),
      sommario: b.sommario.slice(0, 220),
      testo: daMarkdown(b.testo),
      ...(copertina ? { copertina } : {}),
    });
    fatte.push(`bozza:${b.id}`);
  }
  return fatte;
}
