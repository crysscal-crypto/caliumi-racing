// Diagnostica temporanea: controlla se l'API MotoGP risponde dal server Cloudflare
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const URLS = [
  "https://api.motogp.pulselive.com/motogp/v1/results/seasons",
  "https://api.pulselive.motogp.com/motogp/v1/results/seasons",
  "https://api.motogp.pulselive.com/motogp/v1/events?seasonYear=2025",
  "http://api.motogp.pulselive.com/motogp/v1/results/seasons",
];
export async function GET() {
  const prove: Record<string, unknown> = {};
  for (const u of URLS) {
    try {
      const r = await fetch(u, { cache: "no-store", headers: { Accept: "application/json" } });
      const t = await r.text();
      prove[u] = { status: r.status, server: r.headers.get("server"), inizio: t.slice(0, 80) };
    } catch (e) {
      prove[u] = { errore: (e as Error).message };
    }
  }
  return NextResponse.json(prove);
}
