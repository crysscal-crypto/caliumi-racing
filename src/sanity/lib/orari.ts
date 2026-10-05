// Orari dei weekend di gara convertiti in ora italiana
import {
  getStagione,
  getCategorie,
  getEventi,
  getSessioni,
  nomeSessione,
  type Evento,
  type Sessione,
} from "@/sanity/lib/motogp";

// La fonte MotoGP dà l'orario LOCALE del circuito: serve il fuso del paese
const FUSI: Record<string, string> = {
  ES: "Europe/Madrid", FR: "Europe/Paris", IT: "Europe/Rome", SM: "Europe/Rome",
  HU: "Europe/Budapest", CZ: "Europe/Prague", NL: "Europe/Amsterdam", DE: "Europe/Berlin",
  GB: "Europe/London", AT: "Europe/Vienna", PT: "Europe/Lisbon", FI: "Europe/Helsinki",
  TR: "Europe/Istanbul", JP: "Asia/Tokyo", ID: "Asia/Makassar", AU: "Australia/Melbourne",
  MY: "Asia/Kuala_Lumpur", QA: "Asia/Qatar", TH: "Asia/Bangkok", BR: "America/Sao_Paulo",
  US: "America/Chicago", AR: "America/Argentina/Buenos_Aires", IN: "Asia/Kolkata",
  KZ: "Asia/Almaty", CN: "Asia/Shanghai", ZA: "Africa/Johannesburg", BE: "Europe/Brussels",
  SE: "Europe/Stockholm", CH: "Europe/Zurich", HR: "Europe/Zagreb", RS: "Europe/Belgrade",
  SA: "Asia/Riyadh", AE: "Asia/Dubai",
};

function scartoMinuti(fuso: string, istante: Date): number {
  const parti = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(istante);
  const v = (t: string) => Number(parti.find((p) => p.type === t)?.value);
  const comeUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"));
  return (comeUtc - istante.getTime()) / 60000;
}

// "2026-10-09T10:45:00+00:00" (ora locale del circuito) -> istante reale
export function istanteReale(data: string, iso?: string): Date {
  const [g, o] = data.slice(0, 16).split("T");
  const [Y, M, D] = g.split("-").map(Number);
  const [h, m] = o.split(":").map(Number);
  const fuso = iso ? FUSI[iso.toUpperCase()] : undefined;
  const ingenuo = Date.UTC(Y, M - 1, D, h, m);
  if (!fuso) return new Date(ingenuo);
  let istante = new Date(ingenuo - scartoMinuti(fuso, new Date(ingenuo)) * 60000);
  istante = new Date(ingenuo - scartoMinuti(fuso, istante) * 60000);
  return istante;
}

export function oraItaliana(d: Date): string {
  return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(d);
}

export function giornoItaliano(d: Date): string {
  const s = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type VoceOrario = {
  id: string;
  classe: string;
  sessione: string;
  tipo: string;
  quando: string; // ISO reale
  stato: string;
  tv8: boolean;
};

export async function getOrariGP(): Promise<{ evento: Evento; voci: VoceOrario[]; anno: number } | null> {
  const stagione = await getStagione();
  if (!stagione) return null;
  const eventi = await getEventi(stagione);
  const evento =
    eventi.find((e) => e.status !== "FINISHED") ?? eventi[eventi.length - 1];
  if (!evento) return null;

  const categorie = await getCategorie(stagione);
  const perClasse = await Promise.all(
    categorie.map(async (c) => ({ c, sessioni: await getSessioni(stagione, evento, c) }))
  );

  const voci: VoceOrario[] = perClasse.flatMap(({ c, sessioni }) =>
    sessioni.map((s: Sessione) => ({
      id: s.id,
      classe: c.nome,
      sessione: nomeSessione(s),
      tipo: s.type,
      quando: istanteReale(s.date, evento.country?.iso).toISOString(),
      stato: s.status,
      tv8: ["Q", "SPR", "RAC"].includes(s.type),
    }))
  );
  voci.sort((a, b) => a.quando.localeCompare(b.quando));
  return { evento, voci, anno: stagione.year };
}
