const CATEGORIE_RICERCA = [
  { label: "Caschi", query: "casco moto" },
  { label: "Guanti", query: "guanti moto" },
  { label: "Giacche e tute", query: "giacca moto" },
  { label: "Stivali", query: "stivali moto" },
  { label: "Interfoni", query: "interfono moto" },
  { label: "Antifurto", query: "antifurto moto" },
];

function linkRicerca(query: string): string {
  const tag = process.env.NEXT_PUBLIC_AMAZON_TAG;
  const base = `https://www.amazon.it/s?k=${encodeURIComponent(query)}`;
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
}

export default function CercaAmazon({
  compatto = false,
}: {
  compatto?: boolean;
}) {
  const tag = process.env.NEXT_PUBLIC_AMAZON_TAG;
  const Titolo = compatto ? "p" : "h2";

  return (
    <div
      className={`rounded-lg border border-racing-yellow/20 bg-carbon-800 ${
        compatto ? "p-4" : "mb-12 p-5"
      }`}
    >
      <Titolo
        className={`font-semibold text-white ${
          compatto ? "mb-2 text-base" : "mb-3 text-lg"
        }`}
      >
        {compatto ? "Cerca la tua attrezzatura su Amazon" : "Cerca su Amazon"}
      </Titolo>

      <form
        action="https://www.amazon.it/s"
        method="get"
        target="_blank"
        className="flex flex-col gap-3 sm:flex-row"
      >
        {tag && <input type="hidden" name="tag" value={tag} />}
        <input
          type="search"
          name="k"
          required
          aria-label="Cerca su Amazon"
          placeholder="Casco, guanti, tuta, catena antifurto..."
          className="flex-1 rounded-md border border-white/20 bg-carbon-950 px-4 py-2 text-white placeholder:text-white/40 focus:border-racing-yellow focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-racing-yellow px-6 py-2 font-semibold text-carbon-950 transition hover:scale-105"
        >
          Cerca
        </button>
      </form>

      {!compatto && (
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIE_RICERCA.map((c) => (
            <a
              key={c.query}
              href={linkRicerca(c.query)}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-semibold text-white transition hover:border-racing-yellow hover:text-racing-yellow"
            >
              {c.label}
            </a>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-white/40">Link affiliato Amazon</p>
    </div>
  );
}