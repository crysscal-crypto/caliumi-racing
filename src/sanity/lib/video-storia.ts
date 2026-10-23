// Trasforma l'immagine della storia in un video di ~15 secondi con musica (tracce in assets/musica)
// e lo carica su Sanity, così Instagram lo può scaricare da un indirizzo pubblico.

import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
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

async function tracciaACaso(): Promise<string> {
  const tracce = (await readdir(CARTELLA_MUSICA)).filter((f) => f.toLowerCase().endsWith(".mp3"));
  if (tracce.length === 0) throw new Error("Nessuna traccia in assets/musica");
  return join(CARTELLA_MUSICA, tracce[Math.floor(Math.random() * tracce.length)]);
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
        "-i", musica,
        "-filter_complex",
        "[0:v]scale=1080:1920,format=yuv420p,fade=t=in:st=0:d=0.6[v];[1:a]afade=t=out:st=13.3:d=1.4,aresample=48000[a]",
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
