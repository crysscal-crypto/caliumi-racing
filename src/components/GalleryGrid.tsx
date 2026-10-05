"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type FotoGallery = {
  id: string;
  titolo: string;
  anno?: number;
  descrizione?: string;
  alt: string;
  anteprima: string;
  grande: string;
};

const ANIMAZIONI = `
@keyframes lb-sfondo { from { opacity: 0 } to { opacity: 1 } }
@keyframes lb-foto { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: scale(1) } }
@keyframes lb-entra-sx { from { opacity: 0; transform: translateX(-16px) } to { opacity: 1; transform: translateX(0) } }
.lb-sfondo { animation: lb-sfondo .25s ease-out both }
.lb-foto { animation: lb-foto .3s cubic-bezier(.2,.8,.2,1) both }
.lb-back { animation: lb-entra-sx .35s .1s cubic-bezier(.2,.8,.2,1) both }
.lb-back:hover .lb-freccia { transform: translateX(-4px) }
`;

export default function GalleryGrid({ foto }: { foto: FotoGallery[] }) {
  const [aperta, setAperta] = useState<number | null>(null);
  const [montato, setMontato] = useState(false);
  const inizioTocco = useRef<number | null>(null);
  const daStorico = useRef(false);

  useEffect(() => setMontato(true), []);

  const apri = (i: number) => {
    setAperta(i);
    // così il tasto "indietro" del telefono/browser chiude la foto invece di lasciare la pagina
    window.history.pushState({ lightbox: true }, "");
    daStorico.current = true;
  };

  const chiudi = useCallback(() => {
    if (daStorico.current) {
      daStorico.current = false;
      window.history.back(); // il popstate chiude la foto
    } else {
      setAperta(null);
    }
  }, []);

  const avanti = useCallback(
    () => setAperta((i) => (i === null ? i : (i + 1) % foto.length)),
    [foto.length]
  );
  const indietro = useCallback(
    () => setAperta((i) => (i === null ? i : (i - 1 + foto.length) % foto.length)),
    [foto.length]
  );

  useEffect(() => {
    const onPop = () => {
      daStorico.current = false;
      setAperta(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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

  const lightbox = corrente && (
    <div
      className="lb-sfondo fixed inset-0 z-[1000] flex flex-col bg-black/95 backdrop-blur-sm"
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
      <style>{ANIMAZIONI}</style>

      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={chiudi}
          className="lb-back group flex items-center gap-2 rounded-full border border-racing-yellow/60 bg-carbon-900/80 py-2 pl-3 pr-5 font-semibold text-racing-yellow shadow-lg transition hover:bg-racing-yellow hover:text-carbon-950"
          aria-label="Torna alla gallery"
        >
          <span className="lb-freccia inline-block text-xl leading-none transition-transform">←</span>
          <span className="text-sm uppercase tracking-wider">Torna alla gallery</span>
        </button>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
          {aperta! + 1} / {foto.length}
        </span>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-20">
        <img
          key={corrente.id}
          src={corrente.grande}
          alt={corrente.alt}
          className="lb-foto max-h-[74vh] max-w-full rounded object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        {foto.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                indietro();
              }}
              className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:scale-110 hover:bg-racing-yellow hover:text-carbon-950 sm:flex"
              aria-label="Foto precedente"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                avanti();
              }}
              className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:scale-110 hover:bg-racing-yellow hover:text-carbon-950 sm:flex"
              aria-label="Foto successiva"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="font-semibold text-white">
          {corrente.titolo}
          {corrente.anno ? <span className="text-racing-yellow"> · {corrente.anno}</span> : ""}
        </p>
        {corrente.descrizione && (
          <p className="mx-auto mt-1 max-w-3xl text-sm text-white/70">{corrente.descrizione}</p>
        )}
        <p className="mt-2 text-xs text-white/40 sm:hidden">Scorri per cambiare foto · tocca fuori per tornare</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {foto.map((f, i) => (
          <figure key={f.id} className="overflow-hidden rounded-lg bg-carbon-800">
            <a
              href={f.grande}
              onClick={(e) => {
                e.preventDefault();
                apri(i);
              }}
              className="group relative block overflow-hidden"
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
              {f.descrizione && <p className="mt-2 text-sm text-white/70">{f.descrizione}</p>}
            </figcaption>
          </figure>
        ))}
      </div>

      {montato && lightbox ? createPortal(lightbox, document.body) : null}
    </>
  );
}
