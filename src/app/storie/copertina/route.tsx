// Copertina 1200x675 per gli articoli scritti in automatico: podio e top 5 della sessione
// Esempio: /storie/copertina?serie=motogp&anno=2026&evento=mal&sessione=<id>

import { ImageResponse } from "next/og";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { datiStoria } from "@/sanity/lib/storie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const GIALLO = "#F5D300";
const ROSSO = "#E10600";

async function font(file: string): Promise<ArrayBuffer | null> {
  try {
    const b = await readFile(join(process.cwd(), "assets", "fonts", file));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const s = await datiStoria(
    u.searchParams.get("serie") ?? "",
    Number(u.searchParams.get("anno")),
    u.searchParams.get("evento") ?? "",
    u.searchParams.get("sessione") ?? ""
  );
  if (!s || s.righe.length === 0) return new Response("Risultati non disponibili", { status: 404 });

  const [titolo, normale, grassetto, logoFile] = await Promise.all([
    font("racing-sans-one-latin-400-normal.woff"),
    font("barlow-condensed-latin-600-normal.woff"),
    font("barlow-condensed-latin-800-normal.woff"),
    readFile(join(process.cwd(), "assets", "logo-storie.png")).catch(() => null),
  ]);
  const fonts = [
    ...(titolo ? [{ name: "Racing", data: titolo, weight: 400 as const, style: "normal" as const }] : []),
    ...(normale ? [{ name: "Barlow", data: normale, weight: 600 as const, style: "normal" as const }] : []),
    ...(grassetto ? [{ name: "Barlow", data: grassetto, weight: 800 as const, style: "normal" as const }] : []),
  ];
  const logo = logoFile ? `data:image/png;base64,${logoFile.toString("base64")}` : `${u.origin}/icon-512.png`;
  const top = s.righe.slice(0, 5);

  const png = await new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 675,
          display: "flex",
          background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 60%)",
          color: "#FFFFFF",
          fontFamily: "Barlow",
          fontWeight: 600,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: 675, background: ROSSO, display: "flex" }} />
        <div style={{ position: "absolute", left: 14, top: 0, width: 6, height: 675, background: GIALLO, display: "flex" }} />

        <div style={{ display: "flex", flexDirection: "column", width: 520, padding: "56px 0 0 64px" }}>
          <img src={logo} width={88} height={88} style={{ borderRadius: 18 }} />
          <div style={{ display: "flex", marginTop: 30 }}>
            <div style={{ display: "flex", background: ROSSO, fontSize: 26, fontWeight: 800, padding: "3px 16px", borderRadius: 8, letterSpacing: 2 }}>
              {s.campionato.toUpperCase()}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 50, fontWeight: 800, marginTop: 14, lineHeight: 1.05 }}>{s.evento}</div>
          <div style={{ display: "flex", fontFamily: "Racing", fontSize: 72, color: GIALLO, lineHeight: 1.05, marginTop: 6 }}>
            {s.sessione.toUpperCase()}
          </div>
          {s.circuito ? (
            <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{s.circuito}</div>
          ) : null}
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: GIALLO, marginTop: "auto", marginBottom: 48 }}>
            caliumiracing.com
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: "0 56px 0 0" }}>
          {top.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                height: 92,
                marginBottom: 10,
                padding: "0 24px",
                borderRadius: 14,
                background: i === 0 ? "rgba(245,211,0,0.15)" : "#1c1c1c",
                borderLeft: `8px solid ${i === 0 ? GIALLO : i < 3 ? ROSSO : "#2a2a2a"}`,
              }}
            >
              <div style={{ display: "flex", width: 60, fontSize: 44, fontWeight: 800, color: i === 0 ? GIALLO : "#FFFFFF" }}>{r.pos}</div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", fontSize: 36, fontWeight: 800 }}>{r.nome}</div>
                {r.team ? <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.5)" }}>{r.team.slice(0, 40)}</div> : null}
              </div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: i === 0 ? GIALLO : "rgba(255,255,255,0.85)" }}>{r.valore}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 675, ...(fonts.length ? { fonts } : {}) }
  ).arrayBuffer();

  const jpg = await sharp(Buffer.from(png)).jpeg({ quality: 88 }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" } });
}
