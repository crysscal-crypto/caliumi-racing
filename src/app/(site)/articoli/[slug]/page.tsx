import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import { newsBodyFont, newsHeadlineFont } from "@/sanity/lib/fonts";
import Pubblicita from "@/components/Pubblicita";

export const revalidate = 60;

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

const categoryLabels: Record<string, string> = {
  "trofeo-gilera": "Trofeo Gilera",
  "sport-production": "Sport Production",
  "gp-italiano": "Campionato Italiano GP",
  "gp-europeo": "Campionato Europeo GP",
  motomondiale: "Motomondiale",
  superbike: "Superbike",
  superstock: "Superstock",
};

type Articolo = {
  _id: string;
  title: string;
  slug: { current: string };
  category?: string;
  year?: number;
  season?: string;
  source?: string;
  publishedAt?: string;
  summary?: string;
  coverImage?: any;
  body?: any[];
  scans?: any[];
  standings?: {
    position?: number;
    rider?: string;
    points?: number;
    race?: string;
  }[];
};

const query = `*[_type == "articolo" && slug.current == $slug][0]{
  _id, title, slug, category, year, season, source, publishedAt, summary,
  coverImage, body, scans, standings
}`;

async function getArticolo(slug: string): Promise<Articolo | null> {
  return client.fetch(query, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const articolo = await getArticolo(slug);
  if (!articolo) return { title: "Articolo non trovato" };

  const campionato = articolo.category ? categoryLabels[articolo.category] : "";
  const title = `${articolo.title} | Cristian Caliumi`;
  const description =
    articolo.summary ||
    `${campionato} ${articolo.year ?? ""} — articolo storico su Cristian Caliumi`.trim();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: articolo.coverImage
        ? [urlFor(articolo.coverImage).width(1200).height(630).url()]
        : undefined,
    },
  };
}

const paperStyle = {
  backgroundColor: "#eadfc4",
  backgroundImage:
    "radial-gradient(ellipse at top, rgba(255,255,255,0.35), transparent 60%), radial-gradient(ellipse at bottom, rgba(120,80,30,0.2), transparent 60%)",
};

const bodyComponents = {
  block: {
    normal: ({ children }: any) => (
      <p className="mb-3 first:first-letter:float-left first:first-letter:pr-2 first:first-letter:text-5xl first:first-letter:font-bold first:first-letter:leading-[0.85]">
        {children}
      </p>
    ),
    h2: ({ children }: any) => (
      <h2
        className={`${newsHeadlineFont.className} mb-2 mt-4 text-xl font-bold`}
      >
        {children}
      </h2>
    ),
  },
  types: {
    image: ({ value }: any) => (
      <img
        src={urlFor(value).width(900).url()}
        alt={value.alt || ""}
        className="my-4 w-full border border-[#2a1f14]/30 [break-inside:avoid]"
        loading="lazy"
      />
    ),
  },
};

export default async function ArticoloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const articolo = await getArticolo(slug);

  if (!articolo) notFound();

  const campionato = articolo.category ? categoryLabels[articolo.category] : "";
  const dataOriginale = articolo.publishedAt
    ? new Date(articolo.publishedAt).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articolo.title,
    description: articolo.summary,
    datePublished: articolo.publishedAt,
    inLanguage: "it",
    about: { "@type": "Person", name: "Cristian Caliumi" },
    image: articolo.coverImage
      ? urlFor(articolo.coverImage).width(1200).url()
      : undefined,
    isBasedOn: articolo.source
      ? { "@type": "CreativeWork", name: articolo.source }
      : undefined,
  };

  return (
    <section className="carbon-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link
          href="/articoli"
          className="mb-6 inline-block text-sm text-racing-yellow hover:underline"
        >
          ← Tutti gli articoli
        </Link>

        <article
          className={`${newsBodyFont.className} relative mx-auto rounded-sm px-6 py-10 text-[#2a1f14] shadow-2xl sm:px-12`}
          style={paperStyle}
        >
          {/* Testata */}
          <div className="border-y-4 border-double border-[#2a1f14]/70 py-2 text-center text-xs font-bold uppercase tracking-[0.3em]">
            {articolo.source || "Dall'archivio di Cristian Caliumi"}
            {dataOriginale ? ` — ${dataOriginale}` : ""}
          </div>

          <p className="mt-3 text-center text-sm uppercase tracking-widest">
            {campionato}
            {articolo.year ? ` · ${articolo.year}` : ""}
          </p>

          <h1
            className={`${newsHeadlineFont.className} mt-4 text-center text-3xl font-black leading-tight sm:text-5xl`}
          >
            {articolo.title}
          </h1>

          {articolo.summary && (
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg italic">
              {articolo.summary}
            </p>
          )}

          <hr className="my-6 border-t-2 border-[#2a1f14]/60" />

          {/* Testo trascritto: visibile e indicizzabile */}
          {articolo.body && articolo.body.length > 0 && (
            <div className="text-justify text-[17px] leading-relaxed hyphens-auto md:columns-2 md:gap-10 [column-rule:1px_solid_rgba(42,31,20,0.35)]">
              <PortableText
                value={articolo.body}
                components={bodyComponents}
              />
            </div>
          )}

          {/* Classifica */}
          {articolo.standings && articolo.standings.length > 0 && (
            <div className="mt-10">
              <h2
                className={`${newsHeadlineFont.className} mb-3 text-2xl font-bold`}
              >
                Classifica
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-y-2 border-[#2a1f14]/70 text-left uppercase tracking-wider">
                      <th className="py-2 pr-4">Pos.</th>
                      <th className="py-2 pr-4">Pilota</th>
                      <th className="py-2 pr-4">Punti</th>
                      <th className="py-2">Gara</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articolo.standings.map((row, i) => (
                      <tr key={i} className="border-b border-[#2a1f14]/25">
                        <td className="py-1 pr-4">{row.position}</td>
                        <td className="py-1 pr-4">{row.rider}</td>
                        <td className="py-1 pr-4">{row.points}</td>
                        <td className="py-1">{row.race}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ritaglio originale */}
          {articolo.scans && articolo.scans.length > 0 && (
            <div className="mt-12 border-t-4 border-double border-[#2a1f14]/70 pt-6">
              <h2
                className={`${newsHeadlineFont.className} mb-1 text-center text-2xl font-bold`}
              >
                Il ritaglio originale
              </h2>
              <p className="mb-6 text-center text-sm italic">
                Scansione dell&apos;articolo
                {articolo.source ? ` pubblicato su ${articolo.source}` : ""}.
                Clicca per ingrandire.
              </p>
              <div className="space-y-8">
                {articolo.scans.map((scan, i) => (
                  <a
                    key={i}
                    href={urlFor(scan).width(2400).url()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={urlFor(scan).width(1400).url()}
                      alt={
                        scan.alt || `${articolo.title} — scansione originale`
                      }
                      className={`mx-auto w-full max-w-3xl border border-[#2a1f14]/40 bg-white p-2 shadow-lg transition hover:scale-[1.01] ${
                        i % 2 === 0 ? "-rotate-1" : "rotate-1"
                      }`}
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>

        <Pubblicita posizione="articolo-fondo" className="mt-10" />
      </div>
    </section>
  );
}