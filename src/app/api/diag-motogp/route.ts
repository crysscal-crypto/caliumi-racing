// Diagnostica temporanea: controlla se l'API MotoGP risponde dal server Cloudflare
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const prove: Record<string, unknown> = {};
  for (const [nome, ua] of [
    ["sito", "Mozilla/5.0 (compatible; CaliumiRacing/1.0; +https://caliumiracing.com)"],
    ["browser", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"],
  ]) {
    try {
      const r = await fetch("https://api.motogp.pulselive.com/motogp/v1/results/seasons", {
        cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": ua },
      });
      const t = await r.text();
      prove[nome] = { status: r.status, server: r.headers.get("server"), inizio: t.slice(0, 150) };
    } catch (e) {
      prove[nome] = { errore: (e as Error).message };
    }
  }
  return NextResponse.json(prove);
}
