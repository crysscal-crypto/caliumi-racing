// Configurazione per pubblicare il sito su Cloudflare Workers (OpenNext)
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

export default defineCloudflareConfig({
  // pagine aggiornate periodicamente (revalidate) salvate su R2
  incrementalCache: r2IncrementalCache,
  // aggiornamento in sottofondo delle pagine scadute
  queue: doQueue,
});
