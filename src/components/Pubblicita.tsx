"use client";

import { useEffect } from "react";

import { ADSENSE_CLIENT } from "@/components/adsense";

// ===== CONFIGURAZIONE ANNUNCI =====
// Il codice editore AdSense è in src/components/adsense.ts
// Tutti gli annunci sono "sottili": altezza fissa 90px su computer e 60px su telefono.

const SLOT: Record<Posizione, string> = {
  "home-notizie": "4070460060",
  "notizie-elenco": "4070460060",
  "notizia-sotto-testo": "4070460060",
  "notizia-fondo": "4070460060",
  "articolo-fondo": "4070460060",
  "motogp-classifica": "4070460060",
  "motogp-gp": "4070460060",
  testata: "4070460060",
  "barra-basso": "4070460060",
};
// ===================================

export type Posizione =
  | "home-notizie"
  | "notizie-elenco"
  | "notizia-sotto-testo"
  | "notizia-fondo"
  | "articolo-fondo"
  | "motogp-classifica"
  | "motogp-gp"
  | "testata"
  | "barra-basso";

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
        className={`annuncio-sottile flex items-center justify-center rounded-md border border-dashed border-white/20 text-xs uppercase tracking-widest text-white/40 ${className}`}
      >
        Spazio pubblicità · {posizione}
      </div>
    );
  }

  return (
    <aside className={`overflow-hidden ${className}`} aria-label="Pubblicità">
      <p className="mb-0.5 text-center text-[9px] uppercase tracking-widest text-white/25">Pubblicità</p>
      <ins
        className="adsbygoogle annuncio-sottile"
        style={{ display: "block", width: "100%" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
      />
    </aside>
  );
}
