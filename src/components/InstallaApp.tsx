"use client";

import { useEffect, useState } from "react";

type EventoInstallazione = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CHIAVE = "caliumi-installa-chiuso";
const GIORNI_PAUSA = 30;
const RITARDO_MS = 4000;

function chiusoDiRecente(): boolean {
  try {
    const v = localStorage.getItem(CHIAVE);
    return !!v && Date.now() - Number(v) < GIORNI_PAUSA * 86400000;
  } catch {
    return false;
  }
}

function segnaChiuso() {
  try {
    localStorage.setItem(CHIAVE, String(Date.now()));
  } catch {}
}

function giaInstallata(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function eIOS(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

export default function InstallaApp() {
  const [evento, setEvento] = useState<EventoInstallazione | null>(null);
  const [ios, setIos] = useState(false);
  const [visibile, setVisibile] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (giaInstallata() || chiusoDiRecente()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const suPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstallazione);
      timer = setTimeout(() => setVisibile(true), RITARDO_MS);
    };
    const suInstallata = () => {
      setVisibile(false);
      segnaChiuso();
    };

    window.addEventListener("beforeinstallprompt", suPrompt);
    window.addEventListener("appinstalled", suInstallata);

    if (eIOS()) {
      setIos(true);
      timer = setTimeout(() => setVisibile(true), RITARDO_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", suPrompt);
      window.removeEventListener("appinstalled", suInstallata);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const chiudi = () => {
    setVisibile(false);
    segnaChiuso();
  };

  const installa = async () => {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
    chiudi();
  };

  if (!visibile || (!evento && !ios)) return null;

  return (
    <div
      role="dialog"
      aria-label="Installa Caliumi Racing"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-xl border border-racing-yellow/40 bg-carbon-900/95 p-4 shadow-2xl backdrop-blur sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Le notizie sempre a portata di mano</p>
          {ios ? (
            <p className="mt-1 text-sm text-white/75">
              Tocca <span className="font-semibold text-racing-yellow">Condividi</span>{" "}
              <span aria-hidden>⎋</span> in basso e poi{" "}
              <span className="font-semibold text-racing-yellow">Aggiungi alla schermata Home</span>.
            </p>
          ) : (
            <p className="mt-1 text-sm text-white/75">
              Aggiungi Caliumi Racing al telefono o al computer: MotoGP e Superbike con un tocco.
            </p>
          )}
        </div>
        <button
          onClick={chiudi}
          aria-label="Chiudi"
          className="-mr-1 -mt-1 rounded p-1 text-xl leading-none text-white/50 hover:text-white"
        >
          ×
        </button>
      </div>
      {!ios && (
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={chiudi} className="rounded-lg px-4 py-2 text-sm text-white/70 hover:text-white">
            Non ora
          </button>
          <button
            onClick={installa}
            className="rounded-lg bg-racing-yellow px-4 py-2 text-sm font-bold text-black hover:brightness-110"
          >
            Installa
          </button>
        </div>
      )}
    </div>
  );
}
