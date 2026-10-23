// Immagine 1080x1920 (formato storia Instagram) con la top 10 di una sessione MotoGP o WorldSBK
// Esempio: /storie/immagine?serie=motogp&anno=2026&evento=aus&sessione=<id>

import { ImageResponse } from "next/og";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { datiStoria, type Storia } from "@/sanity/lib/storie";

export const runtime = "nodejs";
export const revalidate = 600;

const GIALLO = "#F5D300";
const ROSSO = "#E10600";
const SITO_TESTO = "caliumiracing.com";

type Font = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700 | 800; style: "normal" };

// Font inclusi nel progetto (cartella assets/fonts)
async function font(file: string): Promise<ArrayBuffer | null> {
  try {
    const b = await readFile(join(process.cwd(), "assets", "fonts", file));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

async function caricaFont(): Promise<Font[]> {
  const [titolo, normale, grassetto] = await Promise.all([
    font("racing-sans-one-latin-400-normal.woff"),
    font("barlow-condensed-latin-600-normal.woff"),
    font("barlow-condensed-latin-800-normal.woff"),
  ]);
  const elenco: Font[] = [];
  if (titolo) elenco.push({ name: "Racing", data: titolo, weight: 400, style: "normal" });
  if (normale) elenco.push({ name: "Barlow", data: normale, weight: 600, style: "normal" });
  if (grassetto) elenco.push({ name: "Barlow", data: grassetto, weight: 800, style: "normal" });
  return elenco;
}

function bandiera(iso?: string): string {
  if (!iso || iso.length !== 2) return "";
  return String.fromCodePoint(...iso.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

function Grafica({ s, logo, bandiere }: { s: Storia; logo: string; bandiere: boolean }) {
  const flag = (iso?: string) => (bandiere ? bandiera(iso) : "");
  const colorePos = (p: number) => (p === 1 ? GIALLO : p <= 3 ? "#FFFFFF" : "rgba(255,255,255,0.75)");
  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #161616 0%, #0a0a0a 45%, #0a0a0a 100%)",
        color: "#FFFFFF",
        fontFamily: "Barlow",
        fontWeight: 600,
        position: "relative",
      }}
    >
      {/* Strisce racing in alto */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 18, background: ROSSO, display: "flex" }} />
      <div style={{ position: "absolute", top: 18, left: 0, width: 1080, height: 8, background: GIALLO, display: "flex" }} />

      <div style={{ display: "flex", flexDirection: "column", padding: "210px 64px 0 64px", flex: 1 }}>
        {/* Testata */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={logo} width={90} height={90} style={{ borderRadius: 20 }} />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 28 }}>
            <div style={{ fontFamily: "Racing", fontSize: 48, color: GIALLO, lineHeight: 1 }}>CALIUMI RACING</div>
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{SITO_TESTO}</div>
          </div>
        </div>

        {/* Titolo */}
        <div style={{ display: "flex", marginTop: 36 }}>
          <div
            style={{
              display: "flex",
              background: ROSSO,
              color: "#FFFFFF",
              fontSize: 30,
              fontWeight: 800,
              padding: "4px 20px",
              borderRadius: 10,
              letterSpacing: 2,
            }}
          >
            {s.campionato.toUpperCase()}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 58, fontWeight: 800, marginTop: 12, lineHeight: 1.05 }}>
          {`${flag(s.iso)} ${s.evento}`.trim()}
        </div>
        <div style={{ display: "flex", fontFamily: "Racing", fontSize: 80, color: GIALLO, lineHeight: 1.05, marginTop: 4 }}>
          {s.sessione.toUpperCase()}
        </div>
        {s.circuito ? (
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>{s.circuito}</div>
        ) : null}

        {/* Classifica */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          {s.righe.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                height: 80,
                padding: "0 22px",
                marginBottom: 6,
                borderRadius: 14,
                background: r.pos === 1 ? "rgba(245,211,0,0.14)" : i % 2 === 0 ? "#1c1c1c" : "#151515",
                borderLeft: `8px solid ${r.pos === 1 ? GIALLO : r.pos <= 3 ? ROSSO : "#2a2a2a"}`,
              }}
            >
              <div style={{ display: "flex", width: 66, fontSize: 42, fontWeight: 800, color: colorePos(r.pos) }}>{r.pos}</div>
              <div style={{ display: "flex", width: bandiere ? 60 : 8, fontSize: 36 }}>{flag(r.iso)}</div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", fontSize: 36, fontWeight: 800, lineHeight: 1.05 }}>{r.nome}</div>
                {r.team ? (
                  <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.5)", lineHeight: 1.1 }}>
                    {r.team.length > 38 ? `${r.team.slice(0, 37)}…` : r.team}
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: 800,
                  color: i === 0 ? GIALLO : "rgba(255,255,255,0.85)",
                }}
              >
                {r.valore}
              </div>
            </div>
          ))}
        </div>

        {/* Richiamo al sito */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.75)" }}>
            Full results, lap times &amp; stats on
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              background: GIALLO,
              color: "#0a0a0a",
              fontSize: 42,
              fontWeight: 800,
              padding: "8px 34px",
              borderRadius: 999,
            }}
          >
            {`${bandiere ? "👉 " : ""}${SITO_TESTO.toUpperCase()}`}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const serie = u.searchParams.get("serie") ?? "";
  const anno = Number(u.searchParams.get("anno"));
  const evento = u.searchParams.get("evento") ?? "";
  const sessione = u.searchParams.get("sessione") ?? "";

  const [s, fonts] = await Promise.all([datiStoria(serie, anno, evento, sessione), caricaFont()]);
  if (!s || s.righe.length === 0) return new Response("Risultati non disponibili", { status: 404 });

  const logoFile = await readFile(join(process.cwd(), "assets", "logo-storie.png")).catch(() => null);
  const logo = logoFile ? `data:image/png;base64,${logoFile.toString("base64")}` : `${u.origin}/icon-512.png`;
  const disegna = async (bandiere: boolean) =>
    new ImageResponse(<Grafica s={s} logo={logo} bandiere={bandiere} />, {
      width: 1080,
      height: 1920,
      ...(fonts.length ? { fonts } : {}),
      ...(bandiere ? { emoji: "twemoji" as const } : {}),
    }).arrayBuffer();

  // Le bandiere arrivano da un servizio esterno: se non risponde, genero l'immagine senza
  let png: ArrayBuffer;
  try {
    png = await disegna(true);
  } catch {
    png = await disegna(false);
  }

  // Instagram vuole JPEG
  const jpg = await sharp(Buffer.from(png)).jpeg({ quality: 90 }).toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600" },
  });
}
