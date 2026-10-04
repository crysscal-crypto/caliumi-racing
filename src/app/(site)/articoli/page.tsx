import type { Metadata } from "next";
import Link from "next/link";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import { racingFont } from "@/sanity/lib/fonts";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Articoli e classifiche storiche | Cristian Caliumi",
  description:
    "Articoli e classifiche storiche di Trofeo Gilera, Sport Production, Campionato Italiano ed Europeo GP: le stagioni di Cristian Caliumi raccontate.",
};

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

const categoryLabels: Record<string, string> = {
  "trofeo-gilera": "Trofeo Gilera",
  "sport-production": "Sport Production",
  "gp-italiano": "Campionato Italiano GP",
  "gp-europeo": "Campionato Europeo GP",
};

type Articolo = {
  _id: string;
  title: string;
  slug: { current: string };
  category?: string;
  season?: string;
  coverImage?: any;
};

async function getArticoli(): Promise<Articolo[]> {
  return client.fetch(
    `*[_type == "articolo" && defined(slug.current)] | order(season desc) {
      _id, title, slug, category, season, coverImage
    }`
  );
}

export default async function ArticoliPage() {
  const articoli = await getArticoli();

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1
          className={`${racingFont.className} mb-10 text-center text-3xl text-racing-yellow sm:text-4xl`}
        >
          Articoli
        </h1>

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
                    src={urlFor(articolo.coverImage).width(600).height(400).url()}
                    alt={articolo.coverImage?.alt || articolo.title}
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="text-sm text-racing-yellow">
                    {articolo.category ? categoryLabels[articolo.category] : ""}
                    {articolo.season ? ` · ${articolo.season}` : ""}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white group-hover:text-racing-yellow">
                    {articolo.title}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}