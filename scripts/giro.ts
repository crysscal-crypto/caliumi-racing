// Giro di pubblicazione automatica eseguito su GitHub Actions (workflow "Storie Instagram").
// Qui c'è ffmpeg, quindi le storie escono come video con la musica, esattamente come su Vercel.
// Uso: npm run giro   (servono le stesse variabili d'ambiente del sito)

import { giro } from "../src/sanity/lib/giro";

giro()
  .then((esito) => {
    console.log(JSON.stringify(esito, null, 2));
    // Gli errori di Facebook (es. token scaduto) non fanno fallire il giro: Instagram e articoli vanno avanti
    // e non arriva un'email di errore ogni 5 minuti
    const gravi = (esito.errori ?? []).filter((e: string) => !e.startsWith("fb:"));
    const fallito = gravi.length > 0 && !esito.pubblicate?.length;
    process.exit(fallito ? 1 : 0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
