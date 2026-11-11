// Storia Instagram 1080x1920 che annuncia un nuovo articolo di Caliumi Racing
// Esempio: /storie/articolo?slug=<slug-della-notizia>

import { ImageResponse } from "next/og";
import { pngInJpeg } from "@/lib/jpeg";
import { leggiAsset } from "@/lib/asset-storie";
import { getRedazioneDaSlug, urlCopertina } from "@/sanity/lib/redazione";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const GIALLO = "#F5D300";
const ROSSO = "#E10600";

async function font(file: string): Promise<ArrayBuffer | null> {
  try {
    const b = await leggiAsset(`fonts/${file}`);
    if (!b) return null;
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const n = await getRedazioneDaSlug(u.searchParams.get("slug") ?? "");
  if (!n) return new Response("Articolo non trovato", { status: 404 });

  const [titolo, normale, grassetto, logoFile] = await Promise.all([
    font("racing-sans-one-latin-400-normal.woff"),
    font("barlow-condensed-latin-600-normal.woff"),
    font("barlow-condensed-latin-800-normal.woff"),
    leggiAsset("logo-storie.png"),
  ]);
  const fonts = [
    ...(titolo ? [{ name: "Racing", data: titolo, weight: 400 as const, style: "normal" as const }] : []),
    ...(normale ? [{ name: "Barlow", data: normale, weight: 600 as const, style: "normal" as const }] : []),
    ...(grassetto ? [{ name: "Barlow", data: grassetto, weight: 800 as const, style: "normal" as const }] : []),
  ];
  const logo = logoFile ? `data:image/png;base64,${logoFile.toString("base64")}` : `${u.origin}/icon-512.png`;

  // la foto la scarico e la incorporo, così il generatore non dipende da servizi esterni
  let foto: string | null = null;
  const src = urlCopertina(n.copertina, 952, 714);
  if (src) {
    try {
      const r = await fetch(src.replace("auto=format", "fm=jpg"), { signal: AbortSignal.timeout(15000) });
      if (r.ok) foto = `data:image/jpeg;base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
    } catch {
      // senza foto
    }
  }
  const titoloBreve = n.titolo.length > 110 ? `${n.titolo.slice(0, 107)}…` : n.titolo;
  const sommario = n.sommario.length > 170 ? `${n.sommario.slice(0, 167)}…` : n.sommario;

  const png = await new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #161616 0%, #0a0a0a 50%)",
          color: "#FFFFFF",
          fontFamily: "Barlow",
          fontWeight: 600,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 18, background: ROSSO, display: "flex" }} />
        <div style={{ position: "absolute", top: 18, left: 0, width: 1080, height: 8, background: GIALLO, display: "flex" }} />

        <div style={{ display: "flex", flexDirection: "column", padding: "210px 64px 0 64px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={logo} width={96} height={96} style={{ borderRadius: 20 }} />
            <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: GIALLO, marginLeft: 22 }}>caliumiracing.com</div>
          </div>

          <div style={{ display: "flex", marginTop: 40 }}>
            <div
              style={{
                display: "flex",
                background: ROSSO,
                fontSize: 36,
                fontWeight: 800,
                padding: "6px 22px",
                borderRadius: 10,
                letterSpacing: 2,
              }}
            >
              {`NUOVO ARTICOLO · ${n.campionato.toUpperCase()}`}
            </div>
          </div>

          {foto ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
              <img src={foto} width={952} height={714} style={{ borderRadius: 24, objectFit: "cover" }} />
              {n.copertina?.credito ? (
                <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
                  {n.copertina.credito.slice(0, 90)}
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ display: "flex", fontSize: foto ? 62 : 80, fontWeight: 800, lineHeight: 1.05, marginTop: 26 }}>
            {titoloBreve}
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.75)", lineHeight: 1.25, marginTop: 16 }}>
            {sommario}
          </div>

          <div style={{ display: "flex", marginTop: 34 }}>
            <div
              style={{
                display: "flex",
                background: GIALLO,
                color: "#0a0a0a",
                fontSize: 40,
                fontWeight: 800,
                padding: "12px 34px",
                borderRadius: 999,
              }}
            >
              Leggi l&apos;articolo · link in bio
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, ...(fonts.length ? { fonts } : {}) }
  ).arrayBuffer();

  const jpg = pngInJpeg(png, 90);
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" } });
}
