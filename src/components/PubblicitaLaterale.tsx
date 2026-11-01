"use client";

import { useEffect, useState } from "react";

import { ADSENSE_CLIENT } from "@/components/adsense";

// Due annunci verticali 160x600 ai lati della pagina.
// Compaiono SOLO sugli schermi molto larghi (≥ 1600px), dove c'è spazio vuoto: non coprono mai il contenuto.
const SLOT = "4070460060";
const LARGHEZZA_MINIMA = 1600;

function Colonna({ lato }: { lato: "sinistra" | "destra" }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // annuncio non caricato: la pagina funziona lo stesso
    }
  }, []);

  return (
    <aside
      aria-label="Pubblicità"
      className={`fixed top-28 z-10 ${lato === "sinistra" ? "left-4" : "right-4"}`}
      style={{ width: 160 }}
    >
      <p className="mb-0.5 text-center text-[9px] uppercase tracking-widest text-white/25">Pubblicità</p>
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: 160, height: 600 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={SLOT}
      />
    </aside>
  );
}

export default function PubblicitaLaterale() {
  const [largo, setLargo] = useState(false);

  useEffect(() => {
    // decido una volta sola all'apertura: niente annunci che compaiono e spariscono ridimensionando
    setLargo(window.innerWidth >= LARGHEZZA_MINIMA);
  }, []);

  if (!ADSENSE_CLIENT || !largo) return null;
  return (
    <>
      <Colonna lato="sinistra" />
      <Colonna lato="destra" />
    </>
  );
}
