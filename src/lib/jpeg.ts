// Converte il PNG prodotto da ImageResponse in JPEG (Instagram accetta solo JPEG).
// Solo JavaScript, senza programmi esterni: funziona sia su Node sia su Cloudflare.

import { decode } from "fast-png";
import jpeg from "jpeg-js";

export function pngInJpeg(png: ArrayBuffer, qualita: number): Uint8Array {
  const img = decode(new Uint8Array(png));
  const { width, height, channels } = img;
  const sorgente = img.data;
  const pixel = width * height;
  const rgba = new Uint8Array(pixel * 4);
  const max = img.depth === 16 ? 257 : 1;
  for (let i = 0; i < pixel; i++) {
    const s = i * channels;
    const d = i * 4;
    if (channels >= 3) {
      rgba[d] = sorgente[s] / max;
      rgba[d + 1] = sorgente[s + 1] / max;
      rgba[d + 2] = sorgente[s + 2] / max;
    } else {
      const g = sorgente[s] / max;
      rgba[d] = g;
      rgba[d + 1] = g;
      rgba[d + 2] = g;
    }
    // trasparenza su sfondo nero (come prima)
    const a = channels === 4 || channels === 2 ? sorgente[s + channels - 1] / max / 255 : 1;
    if (a < 1) {
      rgba[d] *= a;
      rgba[d + 1] *= a;
      rgba[d + 2] *= a;
    }
    rgba[d + 3] = 255;
  }
  const out = jpeg.encode({ data: rgba, width, height }, qualita);
  return new Uint8Array(out.data);
}
