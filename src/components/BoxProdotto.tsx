import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import { linkAmazon, type Prodotto } from "@/sanity/lib/prodotti";

const builder = imageUrlBuilder(client);

const DOMINI_AMAZON = [
  "amazon-adsystem.com",
  "media-amazon.com",
  "ssl-images-amazon.com",
];

// Prende l'indirizzo dell'immagine dal codice incollato da SiteStripe
function immagineDaCodice(codice?: string): string | null {
  if (!codice) return null;

  const candidati: string[] = [];
  const diretto = codice.trim();
  if (/^(https?:)?\/\/\S+$/.test(diretto)) candidati.push(diretto);

  for (const m of codice.matchAll(/<img[^>]*?\ssrc\s*=\s*["']([^"']+)["']/gi)) {
    candidati.push(m[1]);
  }

  for (const grezzo of candidati) {
    let src = grezzo.replace(/&amp;/g, "&");
    if (src.startsWith("//")) src = `https:${src}`;
    if (src.includes("/e/ir?")) continue; // pixel di tracciamento 1x1
    try {
      const url = new URL(src);
      const ammesso = DOMINI_AMAZON.some((d) => url.hostname.endsWith(d));
      if (url.protocol === "https:" && ammesso) return url.toString();
    } catch {
      // indirizzo non valido: passa al successivo
    }
  }
  return null;
}

export default function BoxProdotto({ prodotto }: { prodotto: Prodotto }) {
  const href = linkAmazon(prodotto.asin);
  const srcImmagine = prodotto.immagine
    ? builder.image(prodotto.immagine).width(600).height(400).url()
    : immagineDaCodice(prodotto.immagineAmazon);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-racing-yellow/20 bg-carbon-800">
      {srcImmagine && (
        <a
          href={href}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="flex h-48 items-center justify-center bg-white p-4"
        >
          <img
            src={srcImmagine}
            alt={prodotto.immagine?.alt || prodotto.nome}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        </a>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-white">{prodotto.nome}</h3>
        {prodotto.descrizione && (
          <p className="mt-2 flex-1 text-sm text-white/70">
            {prodotto.descrizione}
          </p>
        )}
        <a
          href={href}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="mt-4 inline-block rounded-md bg-racing-yellow px-4 py-2 text-center text-sm font-semibold text-carbon-950 transition hover:scale-105"
        >
          Vedi su Amazon
        </a>
        <p className="mt-2 text-center text-xs text-white/40">
          Link affiliato Amazon
        </p>
      </div>
    </div>
  );
}