import type { Metadata } from "next";
import Link from "next/link";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import { racingFont } from "@/sanity/lib/fonts";
import { getMoto, periodoMoto } from "@/sanity/lib/moto";

export const revalidate = 60;

const builder = imageUrlBuilder(client);

export const metadata: Metadata = {
  title: "Le mie moto: schede tecniche 1989–2002 | Cristian Caliumi",
  description:
    "Le moto da corsa di Cristian Caliumi, dalla Aprilia AF1 125 alla Ducati 996 RS: schede tecniche, potenza, cilindrata, peso e racconti di pista.",
  alternates: { canonical: "/moto" },
};

export default async function MotoPage() {
  const moto = await getMoto();

  return (
    <section className="carbon-bg">
      <div className="content-panel mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className={`${racingFont.className} mb-3 text-center text-3xl text-racing-yellow sm:text-4xl`}>
          Le mie moto
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-white/70">
          Le moto con cui ho corso dal 1989 al 2002, con le schede tecniche e qualche ricordo di pista.
        </p>

        {moto.length === 0 ? (
          <p className="text-center text-white/60">Schede in preparazione.</p>
        ) : (
          <ol className="relative space-y-6 border-l-2 border-racing-yellow/30 pl-6 sm:pl-8">
            {moto.map((m) => (
              <li key={m._id} className="relative">
                <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-2 border-racing-yellow bg-carbon-950 sm:-left-[41px]" />
                <Link
                  href={`/moto/${m.slug.current}`}
                  className="group grid overflow-hidden rounded-lg bg-carbon-800 transition hover:bg-carbon-700 sm:grid-cols-[260px_1fr]"
                >
                  {m.foto ? (
                    <img
                      src={builder.image(m.foto).width(520).height(360).url()}
                      alt={m.foto.alt || `${m.nome} di Cristian Caliumi`}
                      loading="lazy"
                      className="h-48 w-full object-cover sm:h-full"
                    />
                  ) : (
                    <div className={`${racingFont.className} flex h-32 items-center justify-center bg-carbon-900 text-4xl text-racing-yellow/40 sm:h-full`}>
                      {periodoMoto(m)}
                    </div>
                  )}
                  <div className="p-5">
                    <p className={`${racingFont.className} text-2xl text-racing-yellow`}>{periodoMoto(m)}</p>
                    <h2 className="text-xl font-bold text-white group-hover:text-racing-yellow">{m.nome}</h2>
                    {m.campionati && <p className="mt-1 text-sm text-white/70">{m.campionati}</p>}
                    {m.team && <p className="text-sm text-white/50">{m.team}</p>}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {[m.cilindrata, m.potenza, m.peso].filter(Boolean).map((v) => (
                        <span key={v} className="rounded bg-white/10 px-2 py-1 text-white/80">{v}</span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-racing-yellow">Scheda tecnica →</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
