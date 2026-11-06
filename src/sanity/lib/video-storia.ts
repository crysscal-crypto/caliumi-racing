// Trasforma l'immagine della storia in un video di ~15 secondi con musica (tracce in assets/musica)
// e lo carica su Sanity, così Instagram lo può scaricare da un indirizzo pubblico.

import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

const esegui = promisify(execFile);
const CARTELLA_MUSICA = join(process.cwd(), "assets", "musica");

function sanity() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Manca la variabile SANITY_API_WRITE_TOKEN");
  return createClient({ projectId, dataset, apiVersion, token, useCdn: false });
}

async function percorsoFfmpeg(): Promise<string> {
  const mod = (await import("ffmpeg-static")) as unknown as { default?: string | null } | string;
  const p = typeof mod === "string" ? mod : mod.default;
  if (!p) throw new Error("ffmpeg non disponibile");
  return p;
}

let ultimaTraccia = "";

// Traccia a caso (mai la stessa due volte di fila) e punto di partenza a caso dentro la traccia,
// così le storie hanno musiche sempre diverse
async function tracciaACaso(): Promise<{ file: string; inizio: number }> {
  const tracce = (await readdir(CARTELLA_MUSICA)).filter((f) => f.toLowerCase().endsWith(".mp3"));
  if (tracce.length === 0) throw new Error("Nessuna traccia in assets/musica");
  const scelte = tracce.length > 1 ? tracce.filter((t) => t !== ultimaTraccia) : tracce;
  const traccia = scelte[Math.floor(Math.random() * scelte.length)];
  ultimaTraccia = traccia;
  const file = join(CARTELLA_MUSICA, traccia);
  // le tracce da 60 secondi (circa 900 KB) permettono di partire in punti diversi; quelle corte partono da 0
  const lunga = (await stat(file)).size > 600_000;
  const inizio = lunga ? Math.floor(Math.random() * 40) : 0;
  return { file, inizio };
}

export type VideoCaricato = { url: string; assetId: string };

export async function creaVideoStoria(immagine: Buffer, nome: string): Promise<VideoCaricato> {
  const dir = await mkdtemp(join(tmpdir(), "storia-"));
  try {
    const img = join(dir, "storia.jpg");
    const out = join(dir, "storia.mp4");
    await writeFile(img, immagine);
    const [ffmpeg, musica] = await Promise.all([percorsoFfmpeg(), tracciaACaso()]);

    // Formato richiesto da Instagram: H.264 + AAC 48 kHz, 1080x1920, 30 fps, moov all'inizio
    await esegui(
      ffmpeg,
      [
        "-y", "-v", "error",
        "-loop", "1", "-framerate", "30", "-t", "15", "-i", img,
        "-ss", String(musica.inizio), "-i", musica.file,
        "-filter_complex",
        "[0:v]scale=1080:1920,format=yuv420p,fade=t=in:st=0:d=0.6[v];[1:a]loudnorm=I=-31:TP=-9:LRA=11,afade=t=in:st=0:d=0.8,afade=t=out:st=13.3:d=1.4,aresample=48000[a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-crf", "23",
        "-profile:v", "high", "-level", "4.1",
        "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
        "-shortest", "-movflags", "+faststart",
        out,
      ],
      { timeout: 45000 }
    );

    const asset = await sanity().assets.upload("file", await readFile(out), {
      filename: `${nome.replace(/[^a-z0-9-]+/gi, "-")}.mp4`,
      contentType: "video/mp4",
    });
    return { url: asset.url, assetId: asset._id };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// Dopo la pubblicazione il file su Sanity non serve più
export async function eliminaVideo(assetId: string): Promise<void> {
  try {
    await sanity().delete(assetId);
  } catch {
    // non è un problema se resta
  }
}
