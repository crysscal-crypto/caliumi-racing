"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  etichetta: string;
};

export default function MiniaturaNotizia({ src, alt, etichetta }: Props) {
  const [errore, setErrore] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Se l'immagine è già fallita prima che la pagina diventi interattiva
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setErrore(true);
  }, []);

  if (!src || errore) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-carbon-700 to-carbon-900 text-center leading-none">
        <span className="text-sm font-black italic tracking-tight text-racing-yellow">CALIUMI</span>
        <span className="text-[10px] font-bold italic text-racing-red">Racing</span>
        <span className="mt-1 text-[9px] uppercase tracking-widest text-white/40">{etichetta}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setErrore(true)}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />
  );
}