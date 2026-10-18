"use client";

import { useEffect, useState } from "react";
import Pubblicita from "@/components/Pubblicita";

const CHIAVE = "caliumi-barra-pubblicita-chiusa";

// Barra pubblicitaria sottile in fondo allo schermo, chiudibile con la ×
export default function BarraPubblicita() {
  const [visibile, setVisibile] = useState(false);

  useEffect(() => {
    let chiusa = false;
    try {
      chiusa = sessionStorage.getItem(CHIAVE) === "1";
    } catch {}
    if (!chiusa) setVisibile(true);
  }, []);

  if (!visibile) return null;

  const chiudi = () => {
    setVisibile(false);
    try {
      sessionStorage.setItem(CHIAVE, "1");
    } catch {}
  };

  return (
    <div className="barra-pubblicita fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-carbon-950/95 backdrop-blur">
      <div className="relative mx-auto max-w-3xl px-8 pb-1 pt-0.5">
        <button
          onClick={chiudi}
          aria-label="Chiudi pubblicità"
          className="absolute right-1 top-1 rounded px-1.5 text-lg leading-none text-white/50 hover:text-white"
        >
          ×
        </button>
        <Pubblicita posizione="barra-basso" />
      </div>
    </div>
  );
}
