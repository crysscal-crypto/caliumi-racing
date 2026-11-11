// File usati dalle immagini delle storie (font e logo).
// Su un server Node li legge dalla cartella assets/; su Cloudflare (dove non c'è il disco)
// li prende dalla copia pubblica in public/storie-asset/.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function leggiAsset(nome: string): Promise<Buffer | null> {
  try {
    return await readFile(join(process.cwd(), "assets", nome));
  } catch {
    // non siamo su Node con il disco: provo su Cloudflare
  }
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as { ASSETS?: { fetch: (r: Request) => Promise<Response> } };
    if (!env.ASSETS) return null;
    const r = await env.ASSETS.fetch(new Request(`https://asset.local/storie-asset/${nome}`));
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}
