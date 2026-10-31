// Pubblicazione automatica sulla Pagina Facebook "Sblisgass Motor Sport":
// - i risultati di Q2, Sprint, Gara (MotoGP) e Superpole/gare (Superbike) con la grafica del podio e il link ai risultati
// - ogni nuova notizia di Caliumi Racing con il link all'articolo (anteprima con foto presa dal sito)

import { sessioniRecenti, datiStoria, type Candidata } from "./storie";
import { tipoArticolo } from "./giornalista";

const GRAPH = "https://graph.facebook.com/v24.0";
const SITO = "https://www.caliumiracing.com";

export const facebookAttivo = () => !!process.env.FACEBOOK_PAGE_TOKEN && !!process.env.FACEBOOK_PAGE_ID;

async function chiama(percorso: string, corpo: Record<string, string>): Promise<string> {
  const res = await fetch(`${GRAPH}/${process.env.FACEBOOK_PAGE_ID}/${percorso}`, {
    method: "POST",
    body: new URLSearchParams({ ...corpo, access_token: process.env.FACEBOOK_PAGE_TOKEN ?? "" }),
    cache: "no-store",
    signal: AbortSignal.timeout(60000),
  });
  const j = (await res.json().catch(() => ({}))) as { id?: string; post_id?: string; error?: { message?: string } };
  if (!res.ok || j.error) throw new Error(`Facebook: ${j.error?.message ?? res.status}`);
  return j.post_id ?? j.id ?? "";
}

// Sessioni importanti appena concluse, non ancora pubblicate su Facebook
export async function sessioniPerFacebook(fatte: string[]): Promise<Candidata[]> {
  if (!facebookAttivo()) return [];
  // solo sessioni iniziate nelle ultime 8 ore: niente risultati vecchi
  return (await sessioniRecenti()).filter(
    (c) => tipoArticolo(c) && !fatte.includes(`fb:${c.chiave}`) && Date.now() - Date.parse(c.quando) < 8 * 3600000
  );
}

export async function pubblicaRisultatiFacebook(c: Candidata): Promise<boolean> {
  const s = await datiStoria(c.serie, c.anno, c.evento, c.sessione);
  if (!s || s.righe.length < 3) return false; // risultati non ancora pronti
  const podio = s.righe
    .slice(0, 3)
    .map((r, i) => `${["🥇", "🥈", "🥉"][i]} ${r.nomeCompleto} ${i === 0 ? "" : r.valore}`.trim())
    .join("\n");
  const hashtag = s.serie === "motogp" ? "#MotoGP" : "#WorldSBK #Superbike";
  const messaggio = `🏁 ${s.campionato} · ${s.evento} · ${s.sessione}\n\n${podio}\n\n📊 Classifica completa, tempi e mondiale:\n${SITO}${s.percorso}\n\n${hashtag} #SblisgassMotorSport`;
  const q = new URLSearchParams({ serie: c.serie, anno: String(c.anno), evento: c.evento, sessione: c.sessione });
  await chiama("photos", { url: `${SITO}/storie/copertina?${q}&v=${Date.now()}`, caption: messaggio });
  return true;
}

export async function pubblicaArticoloFacebook(a: { titolo: string; sommario: string; slug: string; campionato: string }): Promise<void> {
  const messaggio = `📰 ${a.titolo}\n\n${a.sommario}\n\n👉 Leggi l'articolo completo su Caliumi Racing`;
  await chiama("feed", { message: messaggio, link: `${SITO}/notizie/${a.slug}` });
}
