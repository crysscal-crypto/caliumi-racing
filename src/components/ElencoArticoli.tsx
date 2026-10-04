import Link from "next/link";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import { racingFont } from "@/sanity/lib/fonts";
import { categoryLabels, type ArticoloLista } from "@/sanity/lib/articoli";

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

type Props = {
  titolo: string;
  intro?: string;
  tutti: ArticoloLista[];
  articoli: ArticoloLista[];
  campionatoAttivo?: string;
  annoAttivo?: number;
};

function Chip({
  href,
  attivo,
  children,
}: {
  href: string;
  attivo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        attivo
          ? "border-racing-yellow bg-racing-yellow text-carbon-950"
          : "border-white/30 text-white hover:border-racing-yellow hover:text-racing-yellow"
      }`}
    >
      {children}
    </Link>
  );
}

export default function ElencoArticoli({
  titolo,
  intro,
  tutti,
  articoli,
  campionatoAttivo,
  annoAttivo,
}: Props) {
  const campionati = Object.keys(categoryLabels).filter((c) =>
    tutti.some((a) => a.category === c)
  );
  const anni = Array.from(
    new Set(
      tutti
        .map((a) => a.year)
        .filter((y): y is number => typeof y === "number")
    )
  ).sort((a, b) => b - a);

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          {titolo}
        </h1>
        {intro && (
          <p className="mx-auto mb-10 max-w-2xl text-center text-white/70">
            {intro}
          </p>
        )}

        <div className="mb-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 w-24 text-xs uppercase tracking-widest text-white/50">
              Campionato
            </span>
            <Chip href="/articoli" attivo={!campionatoAttivo && !annoAttivo}>
              Tutti
            </Chip>
            {campionati.map((c) => (
              <Chip
                key={c}
                href={`/articoli/campionato/${c}`}
                attivo={campionatoAttivo === c}
              >
                {categoryLabels[c]}
              </Chip>
            ))}
          </div>

          {anni.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 w-24 text-xs uppercase tracking-widest text-white/50">
                Anno
              </span>
              {anni.map((y) => (
                <Chip
                  key={y}
                  href={`/articoli/anno/${y}`}
                  attivo={annoAttivo === y}
                >
                  {y}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {articoli.length === 0 ? (
          <p className="text-center text-white/60">
            Nessun articolo ancora pubblicato.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articoli.map((articolo) => (
              <Link
                key={articolo._id}
                href={`/articoli/${articolo.slug.current}`}
                className="group overflow-hidden rounded-lg bg-carbon-800 transition hover:scale-[1.02]"
              >
                {articolo.coverImage && (
                  <img
                    src={urlFor(articolo.coverImage)
                      .width(600)
                      .height(400)
                      .url()}
                    alt={articolo.coverImage?.alt || articolo.title}
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="text-sm text-racing-yellow">
                    {articolo.category
                      ? (categoryLabels[articolo.category] ?? "")
                      : ""}
                    {articolo.year ? ` · ${articolo.year}` : ""}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white group-hover:text-racing-yellow">
                    {articolo.title}
                  </h2>
                  {articolo.source && (
                    <p className="mt-1 text-sm text-white/60">
                      {articolo.source}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}