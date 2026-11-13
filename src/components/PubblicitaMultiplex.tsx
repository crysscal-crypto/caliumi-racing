"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { ADSENSE_CLIENT } from "@/components/adsense";

// Griglia di annunci "nativi" di Google (AdSense Multiplex): foto + titolo, in fondo alle pagine
const SLOT_MULTIPLEX = "5315617760";

export default function PubblicitaMultiplex({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const caricato = useRef<string | null>(null);

  useEffect(() => {
    if (caricato.current === pathname) return;
    caricato.current = pathname;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // annuncio non caricato: la pagina funziona lo stesso
    }
  }, [pathname]);

  if (!ADSENSE_CLIENT) return null;
  return (
    <aside aria-label="Contenuti sponsorizzati" className={`mx-auto w-full max-w-6xl ${className}`}>
      <p className="mb-2 text-xs uppercase tracking-widest text-white/40">Potrebbe interessarti anche</p>
      <ins
        key={pathname}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={SLOT_MULTIPLEX}
        data-ad-format="autorelaxed"
      />
    </aside>
  );
}
