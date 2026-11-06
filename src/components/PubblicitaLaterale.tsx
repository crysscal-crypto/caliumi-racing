"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { ADSENSE_CLIENT } from "@/components/adsense";

// Annunci verticali ai lati della pagina, su tutte le pagine.
// Misuro lo spazio libero accanto al contenuto: 160x600 se c'è posto, 120x600 se è più stretto,
// niente se non c'è spazio (così non coprono mai il contenuto, es. su telefono e tablet).
// Cambiando pagina gli annunci si ricaricano.
const SLOT = "4070460060";
const MARGINE = 8;

type Formato = { larghezza: number; altezza: number } | null;

function larghezzaContenuto(): number {
  const main = document.querySelector("main");
  if (!main) return 1152;
  let max = 0;
  main.querySelectorAll<HTMLElement>(".mx-auto").forEach((el) => {
    max = Math.max(max, el.getBoundingClientRect().width);
  });
  return max || 1152;
}

function scegliFormato(): Formato {
  const spazio = (window.innerWidth - larghezzaContenuto()) / 2 - MARGINE * 2;
  const altezza = window.innerHeight >= 760 ? 600 : window.innerHeight >= 560 ? 400 : 0;
  if (!altezza) return null;
  if (spazio >= 160) return { larghezza: 160, altezza };
  if (spazio >= 120) return { larghezza: 120, altezza };
  return null;
}

function Colonna({ lato, formato }: { lato: "sinistra" | "destra"; formato: NonNullable<Formato> }) {
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
      className={`fixed top-28 z-10 ${lato === "sinistra" ? "left-2" : "right-2"}`}
      style={{ width: formato.larghezza }}
    >
      <p className="mb-0.5 text-center text-[9px] uppercase tracking-widest text-white/25">Pubblicità</p>
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: formato.larghezza, height: formato.altezza }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={SLOT}
      />
    </aside>
  );
}

export default function PubblicitaLaterale() {
  const pathname = usePathname();
  const [formato, setFormato] = useState<Formato>(null);

  useEffect(() => {
    // misuro dopo che la pagina nuova è stata disegnata
    setFormato(null);
    const t = setTimeout(() => setFormato(scegliFormato()), 300);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!ADSENSE_CLIENT || !formato) return null;
  return (
    <>
      <Colonna key={`s-${pathname}`} lato="sinistra" formato={formato} />
      <Colonna key={`d-${pathname}`} lato="destra" formato={formato} />
    </>
  );
}
