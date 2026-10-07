/**
 * Pubblica tutte le BOZZE degli articoli (tipo "articolo") in un colpo solo.
 * Uso:  node --env-file=.env.local scripts/pubblica-articoli.mjs
 */
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2025-01-01",
  useCdn: false,
});

const bozze = await client.fetch(`*[_type == "articolo" && _id in path("drafts.**")]`);
if (bozze.length === 0) {
  console.log("Nessuna bozza di articolo da pubblicare.");
  process.exit(0);
}
for (const b of bozze) {
  const id = b._id.replace(/^drafts\./, "");
  const { _id, _rev, _createdAt, _updatedAt, ...dati } = b;
  await client.transaction().createOrReplace({ ...dati, _id: id }).delete(b._id).commit();
  console.log(`Pubblicato: ${b.title}`);
}
console.log(`\nFATTO: ${bozze.length} articoli pubblicati.`);
