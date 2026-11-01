import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { racingFont } from "@/sanity/lib/fonts";
import { formattaData } from "@/sanity/lib/notizie";
import { getUltimeRedazione, urlCopertina, type NotiziaRedazione } from "@/sanity/lib/redazione";
import Pubblicita from "@/components/Pubblicita";
import CardRedazione from "@/components/CardRedazione";
import FontePreferitaGoogle from "@/components/FontePreferitaGoogle";

const SITO = "https://www.caliumiracing.com";

const componenti: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-5 leading-relaxed text-white/85">{children}</p>,
    h2: ({ children }) => (
      <h2 className={`${racingFont.className} mb-3 mt-10 text-2xl text-racing-yellow`}>{children}</h2>
    ),
    h3: ({ children }) => <h3 className="mb-2 mt-8 text-xl font-bold text-white">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-racing-yellow pl-5 text-lg italic text-white/90">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mb-5 list-disc space-y-1 pl-6 text-white/85">{children}</ul>,
    number: ({ children }) => <ol className="mb-5 list-decimal space-y-1 pl-6 text-white/85">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    link: ({ value, children }) => {
      const href: string = value?.href ?? "#";
      const interno = href.startsWith("/") || href.includes("caliumiracing.com");
      return interno ? (
        <Link href={href.replace(/^https?:\/\/(www\.)?caliumiracing\.com/, "") || "/"} className="text-racing-yellow underline">
          {children}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-racing-yellow underline">
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const src = urlCopertina(value, 1200);
      if (!src) return null;
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={value.alt || ""} loading="lazy" className="w-full rounded-lg" />
          {value.didascalia && <figcaption className="mt-2 text-center text-sm text-white/50">{value.didascalia}</figcaption>}
        </figure>
      );
    },
  },
};

export default async function ArticoloRedazione({ notizia: n }: { notizia: NotiziaRedazione }) {
  const altre = (await getUltimeRedazione(4)).filter((x) => x._id !== n._id).slice(0, 3);
  const copertina = urlCopertina(n.copertina, 1600, 900);
  const url = `${SITO}/notizie/${n.slug}`;
  const condividi = encodeURIComponent(url);
  const testoCondividi = encodeURIComponent(`${n.titolo} ${url}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.titolo,
    description: n.sommario,
    image: copertina ? [urlCopertina(n.copertina, 1200, 675)] : undefined,
    datePublished: n.data,
    dateModified: n.aggiornato,
    author: n.autore
      ? { "@type": "Person", name: n.autore }
      : { "@type": "Organization", name: "Caliumi Racing", url: SITO },
    publisher: { "@type": "Organization", name: "Caliumi Racing", logo: { "@type": "ImageObject", url: `${SITO}/icon-512.png` } },
    mainEntityOfPage: url,
  };

  return (
    <section className="carbon-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="content-panel mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/" className="hover:text-racing-yellow">Home</Link>
          {" / "}
          <Link href="/notizie" className="hover:text-racing-yellow">Notizie</Link>
          {" / "}
          <span className="text-white/70">{n.campionato}</span>
        </nav>

        <article>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-racing-yellow">
            {n.campionato} · Caliumi Racing
            <time dateTime={n.data} className="ml-2 font-normal normal-case text-white/50">
              {formattaData(n.data)}
            </time>
          </p>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{n.titolo}</h1>
          <p className="mt-4 text-lg text-white/75">{n.sommario}</p>

          {copertina && (
            <figure className="mt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={copertina} alt={n.copertina?.alt || n.titolo} className="w-full rounded-lg" />
              {n.copertina?.credito && (
                <figcaption className="mt-1 text-right text-xs text-white/40">{n.copertina.credito}</figcaption>
              )}
            </figure>
          )}

          <div className="mt-8 text-[1.05rem]">
            {n.testo && <PortableText value={n.testo} components={componenti} />}
          </div>

          <div className="mt-10 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="Caliumi Racing" width={48} height={48} className="rounded-md" />
            {n.autore && (
              <p className="text-sm text-white/75">
                Di <span className="font-semibold text-racing-yellow">{n.autore}</span>
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-white/50">Condividi:</span>
            <a href={`https://wa.me/?text=${testoCondividi}`} target="_blank" rel="noopener noreferrer" className="rounded bg-[#25D366] px-3 py-1.5 font-semibold text-white">
              WhatsApp
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${condividi}`} target="_blank" rel="noopener noreferrer" className="rounded bg-[#1877F2] px-3 py-1.5 font-semibold text-white">
              Facebook
            </a>
            <a href={`https://x.com/intent/post?text=${testoCondividi}`} target="_blank" rel="noopener noreferrer" className="rounded bg-black px-3 py-1.5 font-semibold text-white">
              X
            </a>
          </div>
          <FontePreferitaGoogle className="mt-6" />
        </article>

        <Pubblicita posizione="notizia-sotto-testo" className="mt-10" />

        {altre.length > 0 && (
          <div className="mt-14">
            <h2 className={`${racingFont.className} mb-4 text-2xl text-racing-yellow`}>Altre notizie di Caliumi Racing</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {altre.map((x) => (
                <CardRedazione key={x._id} notizia={x} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/notizie"
            className="inline-block rounded-md border border-racing-yellow px-6 py-3 font-semibold text-racing-yellow transition hover:scale-105"
          >
            Tutte le notizie
          </Link>
        </div>
      </div>
    </section>
  );
}
