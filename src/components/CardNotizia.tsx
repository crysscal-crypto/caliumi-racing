import Link from "next/link";
import { formattaData, type Notizia } from "@/sanity/lib/notizie";
import MiniaturaNotizia from "@/components/MiniaturaNotizia";

type Props = {
  notizia: Notizia;
  commento?: string;
};

export default function CardNotizia({ notizia: n, commento }: Props) {
  return (
    <article className="group flex h-full flex-col rounded-lg border-l-4 border-racing-red bg-carbon-800 p-4 transition hover:bg-carbon-700 sm:p-5">
      <div className="flex gap-4">
        <Link
          href={`/notizie/${n.slug}`}
          aria-label={n.titolo}
          className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-carbon-900 sm:w-36"
        >
          <MiniaturaNotizia src={n.immagine} alt={n.titolo} etichetta={n.campionato} />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-racing-yellow">
            {n.campionato} · {n.fonte}
          </p>
          {n.data && (
            <time dateTime={n.data} className="mb-1 block text-xs text-white/50">
              {formattaData(n.data)}
            </time>
          )}
          <h3 className="line-clamp-4 text-base font-bold leading-snug text-white sm:text-lg">
            <Link href={`/notizie/${n.slug}`} className="group-hover:text-racing-yellow">
              {n.titolo}
            </Link>
          </h3>
        </div>
      </div>

      {n.estratto && (
        <p className="mt-3 line-clamp-3 text-sm text-white/70">{n.estratto}</p>
      )}
      {commento && (
        <p className="mt-3 line-clamp-3 border-l-2 border-racing-yellow pl-4 text-sm italic text-white/85">
          <span className="not-italic font-semibold text-racing-yellow">
            Il commento di Cristian:{" "}
          </span>
          {commento}
        </p>
      )}
      <Link
        href={`/notizie/${n.slug}`}
        className="mt-auto inline-block pt-3 text-sm font-semibold text-racing-yellow hover:underline"
      >
        Leggi →
      </Link>
    </article>
  );
}