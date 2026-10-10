"use client";

import { useEffect } from "react";

// ===== CONFIGURAZIONE ADSENSE =====
// Si compila quando AdSense approva il sito (dominio caliumiracing.com collegato).
// Finché ADSENSE_CLIENT è vuoto: in locale vedi un riquadro tratteggiato, online non compare nulla.
export const ADSENSE_CLIENT = "ca-pub-8453289586204430";

const SLOT: Record<Posizione, string> = {
  "home-notizie": "4070460060",
  "notizie-elenco": "4070460060",
  "notizia-sotto-testo": "4070460060",
  "notizia-fondo": "4070460060",
  "articolo-fondo": "4070460060",
  "motogp-classifica": "4070460060",
  "motogp-gp": "4070460060",
};
// ===================================

type Posizione =
  | "home-notizie"
  | "notizie-elenco"
  | "notizia-sotto-testo"
  | "notizia-fondo"
  | "articolo-fondo"
  | "motogp-classifica"
  | "motogp-gp";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function Pubblicita({
  posizione,
  className = "",
}: {
  posizione: Posizione;
  className?: string;
}) {
  const slot = SLOT[posizione];
  const attiva = Boolean(ADSENSE_CLIENT && slot);

  useEffect(() => {
    if (!attiva) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // annuncio non caricato: la pagina funziona lo stesso
    }
  }, [attiva]);

  if (!attiva) {
    if (process.env.NODE_ENV !== "development") return null;
    return (
      <div
        className={`flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-xs uppercase tracking-widest text-white/40 ${className}`}
      >
        Spazio pubblicità · {posizione}
      </div>
    );
  }

  return (
    <aside className={`overflow-hidden ${className}`} aria-label="Pubblicità">
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-white/30">
        Pubblicità
      </p>
      <ins
        className="adsbygoogle block min-h-[100px]"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
