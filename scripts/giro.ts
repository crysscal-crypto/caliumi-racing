// Giro di pubblicazione automatica eseguito su GitHub Actions (workflow "Storie Instagram").
// Qui c'è ffmpeg, quindi le storie escono come video con la musica, esattamente come su Vercel.
// Uso: npm run giro   (servono le stesse variabili d'ambiente del sito)

import { giro } from "../src/sanity/lib/giro";

giro()
  .then((esito) => {
    console.log(JSON.stringify(esito, null, 2));
    const fallito = Boolean(esito.errori?.length) && !esito.pubblicate?.length;
    process.exit(fallito ? 1 : 0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
