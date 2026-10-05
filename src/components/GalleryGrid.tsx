"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FotoGallery = {
  id: string;
  titolo: string;
  anno?: number;
  descrizione?: string;
  alt: string;
  anteprima: string;
  grande: string;
};

export default function GalleryGrid({ foto }: { foto: FotoGallery[] }) {
  const [aperta, setAperta] = useState<number | null>(null);
  const inizioTocco = useRef<number | null>(null);

  const chiudi = useCallback(() => setAperta(null), []);
  const avanti = useCallback(
    () => setAperta((i) => (i === null ? i : (i + 1) % foto.length)),
    [foto.length]
  );
  const indietro = useCallback(
    () => setAperta((i) => (i === null ? i : (i - 1 + foto.length) % foto.length)),
    [foto.length]
  );

  useEffect(() => {
    if (aperta === null) return;
    const tasti = (e: KeyboardEvent) => {
      if (e.key === "Escape") chiudi();
      if (e.key === "ArrowRight") avanti();
      if (e.key === "ArrowLeft") indietro();
    };
    document.addEventListener("keydown", tasti);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tasti);
      document.body.style.overflow = "";
    };
  }, [aperta, chiudi, avanti, indietro]);

  const corrente = aperta !== null ? foto[aperta] : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {foto.map((f, i) => (
          <figure key={f.id} className="overflow-hidden rounded-lg bg-carbon-800">
            <a
              href={f.grande}
              onClick={(e) => {
                e.preventDefault();
                setAperta(i);
              }}
              className="group relative block"
              aria-label={`Ingrandisci: ${f.titolo}`}
            >
              <img
                src={f.anteprima}
                alt={f.alt}
                loading="lazy"
                className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                🔍 Ingrandisci
              </span>
            </a>
            <figcaption className="p-4">
              {f.anno && <p className="text-sm text-racing-yellow">{f.anno}</p>}
              <h2 className="text-lg font-semibold text-white">{f.titolo}</h2>
              {f.descrizione && (
                <p className="mt-2 text-sm text-white/70">{f.descrizione}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      {corrente && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={corrente.titolo}
          onClick={chiudi}
          onTouchStart={(e) => (inizioTocco.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (inizioTocco.current === null) return;
            const diff = e.changedTouches[0].clientX - inizioTocco.current;
            if (diff > 50) indietro();
            if (diff < -50) avanti();
            inizioTocco.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/70">
            <span className="text-sm">
              {aperta! + 1} / {foto.length}
            </span>
            <button
              onClick={chiudi}
              className="text-3xl leading-none text-white hover:text-racing-yellow"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-2 sm:px-16">
            <img
              src={corrente.grande}
              alt={corrente.alt}
              className="max-h-[78vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {foto.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    indietro();
                  }}
                  className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-racing-yellow hover:text-carbon-950 sm:block"
                  aria-label="Foto precedente"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    avanti();
                  }}
                  className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-racing-yellow hover:text-carbon-950 sm:block"
                  aria-label="Foto successiva"
                >
                  ›
                </button>
              </>
            )}
          </div>

          <div
            className="px-4 py-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-white">
              {corrente.titolo}
              {corrente.anno ? ` · ${corrente.anno}` : ""}
            </p>
            {corrente.descrizione && (
              <p className="mx-auto mt-1 max-w-3xl text-sm text-white/70">
                {corrente.descrizione}
              </p>
            )}
            <p className="mt-2 text-xs text-white/40 sm:hidden">
              Scorri a destra o sinistra per cambiare foto
            </p>
          </div>
        </div>
      )}
    </>
  );
}
