import Link from "next/link";
import { formattaData } from "@/sanity/lib/notizie";
import { urlCopertina, type NotiziaRedazione } from "@/sanity/lib/redazione";

// Anteprima di una notizia scritta da Cristian (più grande e in evidenza rispetto a quelle delle testate)
export default function CardRedazione({ notizia: n, grande = false }: { notizia: NotiziaRedazione; grande?: boolean }) {
  const img = urlCopertina(n.copertina, grande ? 1200 : 800, grande ? 675 : 450);
  return (
    <article className={`group flex h-full flex-col overflow-hidden rounded-lg border border-racing-yellow/40 bg-carbon-900 transition hover:border-racing-yellow ${grande ? "md:flex-row" : ""}`}>
      <Link
        href={`/notizie/${n.slug}`}
        className={`relative block aspect-video shrink-0 overflow-hidden bg-carbon-800 ${grande ? "md:w-3/5" : ""}`}
      >
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={n.copertina?.alt || n.titolo}
            loading={grande ? "eager" : "lazy"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3 rounded bg-racing-red px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
          {n.campionato}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-racing-yellow">
          Caliumi Racing
          <time dateTime={n.data} className="ml-2 font-normal normal-case text-white/50">
            {formattaData(n.data)}
          </time>
        </p>
        <h3 className={`font-bold leading-snug text-white group-hover:text-racing-yellow ${grande ? "text-2xl" : "text-lg"}`}>
          <Link href={`/notizie/${n.slug}`}>{n.titolo}</Link>
        </h3>
        <p className={`mt-2 text-sm text-white/75 ${grande ? "line-clamp-4" : "line-clamp-3"}`}>{n.sommario}</p>
        <Link
          href={`/notizie/${n.slug}`}
          className="mt-auto inline-block pt-3 text-sm font-semibold text-racing-yellow hover:underline"
        >
          Leggi l&apos;articolo →
        </Link>
      </div>
    </article>
  );
}
