// Pubblicazione delle storie su Instagram (API con login di Instagram)
// Lo stato (sessioni già pubblicate + token rinnovato) è salvato in Sanity in un documento privato.

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

const GRAPH = "https://graph.instagram.com/v24.0";
const DOC = "segreti.instagram"; // l'ID con il punto lo rende NON leggibile pubblicamente
const RINNOVO_GIORNI = 7;

type Stato = { pubblicate: string[]; token?: string; tokenData?: string };

function sanity() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Manca la variabile SANITY_API_WRITE_TOKEN");
  return createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: "raw" });
}

export async function leggiStato(): Promise<Stato> {
  const c = sanity();
  await c.createIfNotExists({ _id: DOC, _type: "statoInstagram", pubblicate: [] });
  const doc = await c.getDocument<Stato & { _id: string }>(DOC);
  return { pubblicate: doc?.pubblicate ?? [], token: doc?.token, tokenData: doc?.tokenData };
}

export async function segnaPubblicata(chiave: string, stato: Stato): Promise<void> {
  const elenco = [...stato.pubblicate, chiave].slice(-400);
  stato.pubblicate = elenco;
  await sanity().patch(DOC).set({ pubblicate: elenco }).commit();
}

export async function togliPubblicata(chiave: string, stato: Stato): Promise<void> {
  stato.pubblicate = stato.pubblicate.filter((k) => k !== chiave);
  await sanity().patch(DOC).set({ pubblicate: stato.pubblicate }).commit();
}

// Token valido: quello rinnovato in Sanity o, la prima volta, quello su Vercel. Si rinnova da solo ogni 7 giorni.
export async function tokenValido(stato: Stato): Promise<string> {
  const attuale = stato.token || process.env.INSTAGRAM_TOKEN;
  if (!attuale) throw new Error("Manca la variabile INSTAGRAM_TOKEN");
  const ultimo = stato.tokenData ? Date.parse(stato.tokenData) : 0;
  if (Date.now() - ultimo < RINNOVO_GIORNI * 86400000) return attuale;
  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(attuale)}`,
      { cache: "no-store" }
    );
    const j = (await res.json()) as { access_token?: string };
    if (j.access_token) {
      await sanity().patch(DOC).set({ token: j.access_token, tokenData: new Date().toISOString() }).commit();
      return j.access_token;
    }
  } catch {
    // se il rinnovo fallisce uso il token attuale e riprovo al giro dopo
  }
  return attuale;
}

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function chiama(percorso: string, token: string, corpo?: Record<string, string>) {
  const res = await fetch(`${GRAPH}${percorso}`, {
    method: corpo ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}` },
    body: corpo ? new URLSearchParams(corpo) : undefined,
    cache: "no-store",
  });
  const j = (await res.json()) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok || j.error) throw new Error(j.error?.message ?? `Errore Instagram ${res.status}`);
  return j;
}

export async function pubblicaStoria(media: { immagine?: string; video?: string }, token: string): Promise<string> {
  const utente = process.env.INSTAGRAM_USER_ID;
  if (!utente) throw new Error("Manca la variabile INSTAGRAM_USER_ID");

  const contenitore = await chiama(
    `/${utente}/media`,
    token,
    media.video
      ? { video_url: media.video, media_type: "STORIES" }
      : { image_url: media.immagine ?? "", media_type: "STORIES" }
  );
  const id = String(contenitore.id);

  // i video richiedono più tempo di elaborazione
  const tentativi = media.video ? 40 : 12;
  let pronto = false;
  for (let i = 0; i < tentativi; i++) {
    await pausa(media.video ? 3000 : 2500);
    const s = await chiama(`/${id}?fields=status_code`, token);
    if (s.status_code === "FINISHED") {
      pronto = true;
      break;
    }
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Contenitore ${s.status_code}`);
  }

  if (!pronto) throw new Error("Instagram non ha finito di elaborare il contenuto");

  const pubblicata = await chiama(`/${utente}/media_publish`, token, { creation_id: id });
  return String(pubblicata.id);
}
