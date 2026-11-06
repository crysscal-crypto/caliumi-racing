"use client";

import { useEffect, useState } from "react";

export default function ModuloCommento({ pagina, titolo }: { pagina: string; titolo: string }) {
  const [aperto, setAperto] = useState(0);
  const [nome, setNome] = useState("");
  const [testo, setTesto] = useState("");
  const [sito, setSito] = useState("");
  const [stato, setStato] = useState<"" | "invio" | "ok" | "errore">("");
  const [messaggio, setMessaggio] = useState("");

  useEffect(() => {
    setAperto(Date.now());
    try {
      const salvato = localStorage.getItem("commento-nome");
      if (salvato) setNome(salvato);
    } catch {
      // niente memoria del nome: pazienza
    }
  }, []);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    setStato("invio");
    setMessaggio("");
    try {
      const r = await fetch("/api/commenti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, testo, pagina, titolo, sito, t: aperto }),
      });
      const j = (await r.json()) as { ok?: boolean; errore?: string };
      if (!r.ok || !j.ok) throw new Error(j.errore ?? "Invio non riuscito, riprova.");
      try {
        localStorage.setItem("commento-nome", nome);
      } catch {
        // ok lo stesso
      }
      setTesto("");
      setStato("ok");
    } catch (err) {
      setStato("errore");
      setMessaggio((err as Error).message);
    }
  }

  if (stato === "ok") {
    return (
      <p className="mt-6 rounded-lg border border-racing-yellow/40 bg-carbon-900 p-4 text-white/85">
        Grazie! Il tuo commento è stato inviato e comparirà dopo l&apos;approvazione.
      </p>
    );
  }

  return (
    <form onSubmit={invia} className="mt-6 space-y-3">
      <h3 className="font-semibold text-white">Lascia un commento</h3>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Il tuo nome"
        maxLength={40}
        required
        className="w-full rounded-md border border-white/15 bg-carbon-900 px-3 py-2 text-white placeholder:text-white/40 focus:border-racing-yellow focus:outline-none"
      />
      <textarea
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder="Cosa ne pensi?"
        maxLength={1500}
        rows={4}
        required
        className="w-full rounded-md border border-white/15 bg-carbon-900 px-3 py-2 text-white placeholder:text-white/40 focus:border-racing-yellow focus:outline-none"
      />
      {/* campo trappola per i bot: le persone non lo vedono */}
      <input
        type="text"
        value={sito}
        onChange={(e) => setSito(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={stato === "invio"}
          className="rounded-md bg-racing-yellow px-5 py-2 font-semibold text-carbon-950 transition hover:scale-105 disabled:opacity-60"
        >
          {stato === "invio" ? "Invio…" : "Invia commento"}
        </button>
        <p className="text-xs text-white/50">
          Nome e commento vengono pubblicati dopo l&apos;approvazione. Niente link. Vedi la{" "}
          <a href="/privacy" className="underline hover:text-racing-yellow">privacy</a>.
        </p>
      </div>
      {stato === "errore" && <p className="text-sm text-red-400">{messaggio}</p>}
    </form>
  );
}
