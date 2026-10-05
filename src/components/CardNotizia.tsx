import Link from "next/link";
import { formattaData, type Notizia } from "@/sanity/lib/notizie";

type Props = {
  notizia: Notizia;
  commento?: string;
};

export default function CardNotizia({ notizia: n, commento }: Props) {
  return (
    <article className="flex h-full flex-col rounded-lg border-l-4 border-racing-red bg-carbon-800 p-5 transition hover:bg-carbon-700">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-racing-yellow">
        {n.campionato} · {n.fonte}
        {n.data && (
          <time
            dateTime={n.data}
            className="ml-2 font-normal normal-case text-white/50"
          >
            {formattaData(n.data)}
          </time>
        )}
      </p>
      <h3 className="text-lg font-semibold leading-snug text-white">
        <Link href={`/notizie/${n.slug}`} className="hover:text-racing-yellow">
          {n.titolo}
        </Link>
      </h3>
      {n.estratto && (
        <p className="mt-2 text-sm text-white/70">{n.estratto}</p>
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
