import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import { racingFont } from "@/sanity/lib/fonts";
import GalleryGrid from "@/components/GalleryGrid";
import Pubblicita from "@/components/Pubblicita";
import Testo from "@/components/Testo";
import { getCampionato, getCollegati } from "@/sanity/lib/campionati";

export const revalidate = 60;

const builder = imageUrlBuilder(client);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCampionato(slug);
  if (!c) return { title: "Campionato non trovato" };
  return {
    title: `${c.nome}${c.periodo ? ` (${c.periodo})` : ""}: storia, moto e albo d'oro | Caliumi Racing`,
    description: c.riassunto || `${c.nome}: com'era, con che moto si correva e chi lo ha vinto.`,
    alternates: { canonical: `/campionati/${slug}` },
    openGraph: c.foto ? { images: [builder.image(c.foto).width(1200).height(630).url()] } : undefined,
  };
}

export default async function CampionatoPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCampionato(slug);
  if (!c) notFound();

  const { articoli, foto } = await getCollegati(c.categorie ?? []);
  const albo = [...(c.alboDoro ?? [])].sort((a, b) => (a.anno ?? 0) - (b.anno ?? 0));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${c.nome}: storia, moto e albo d'oro`,
    description: c.riassunto,
    inLanguage: "it",
    author: { "@type": "Person", name: "Cristian Caliumi" },
    image: c.foto ? builder.image(c.foto).width(1200).url() : undefined,
  };

  return (
    <section className="carbon-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="content-panel mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/campionati" className="hover:text-racing-yellow">Campionati</Link>
          {" / "}
          <span className="text-white/70">{c.nome}</span>
        </nav>

        <h1 className={`${racingFont.className} text-center text-3xl text-racing-yellow sm:text-5xl`}>{c.nome}</h1>
        {(c.sottotitolo || c.periodo) && (
          <p className="mt-2 text-center text-white/70">{[c.sottotitolo, c.periodo].filter(Boolean).join(" · ")}</p>
        )}

        {c.foto && (
          <img
            src={builder.image(c.foto).width(1400).fit("max").url()}
            alt={c.foto.alt || c.nome}
            className="mx-auto mt-8 w-full max-w-3xl rounded-lg border border-racing-yellow/30 shadow-2xl"
          />
        )}

        <div className="mx-auto mt-10 max-w-3xl text-white/85">
          {c.riassunto && <p className="mb-8 text-lg text-white">{c.riassunto}</p>}

          {(c.sezioni ?? []).map((s) => (
            <div key={s._key} className="mb-8">
              {s.titolo && <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>{s.titolo}</h2>}
              {s.testo && <Testo testo={s.testo} />}
            </div>
          ))}

          {c.esperienza && (
            <div className="mb-10 rounded-lg border border-racing-yellow/40 bg-carbon-900 p-5">
              <h2 className={`${racingFont.className} mb-2 text-xl text-racing-yellow`}>La mia esperienza</h2>
              <Testo testo={c.esperienza} className="italic" />
            </div>
          )}
        </div>

        {albo.length > 0 && (
          <div className="mx-auto mb-12 max-w-3xl">
            <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>Albo d&apos;oro</h2>
            <div className="overflow-hidden rounded-lg bg-carbon-800">
              <table className="w-full text-sm text-white">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-white/50">Anno</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-white/50">Vincitore</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-white/50">Moto</th>
                  </tr>
                </thead>
                <tbody>
                  {albo.map((r) => {
                    const io = r.pilota?.toLowerCase().includes("caliumi");
                    return (
                      <tr key={r._key} className={`border-b border-white/5 ${io ? "bg-racing-yellow/10" : ""}`}>
                        <td className="px-3 py-2 font-bold text-racing-yellow">{r.anno}</td>
                        <td className={`px-3 py-2 ${io ? "font-bold text-racing-yellow" : ""}`}>{r.pilota}</td>
                        <td className="px-3 py-2 text-white/70">{r.moto}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(c.moto?.length ?? 0) > 0 && (
          <div className="mx-auto mb-12 max-w-3xl">
            <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>Le mie moto</h2>
            <div className="flex flex-wrap gap-3">
              {c.moto!.map((m) => (
                <Link
                  key={m._id}
                  href={`/moto/${m.slug.current}`}
                  className="rounded-lg bg-carbon-800 px-4 py-3 text-white transition hover:bg-carbon-700 hover:text-racing-yellow"
                >
                  <span className="block text-xs text-racing-yellow">
                    {m.annoFine && m.annoFine !== m.annoInizio ? `${m.annoInizio}–${m.annoFine}` : m.annoInizio}
                  </span>
                  <span className="font-semibold">{m.nome} →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Pubblicita posizione="articolo-fondo" className="mb-12" />

        {articoli.length > 0 && (
          <div className="mx-auto mb-12 max-w-3xl">
            <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>Articoli di giornale</h2>
            <ul className="space-y-2">
              {articoli.map((a) => (
                <li key={a._id}>
                  <Link href={`/articoli/${a.slug.current}`} className="block rounded-lg bg-carbon-800 px-4 py-3 transition hover:bg-carbon-700">
                    <span className="text-xs text-racing-yellow">{[a.year, a.source].filter(Boolean).join(" · ")}</span>
                    <span className="block font-semibold text-white">{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {foto.length > 0 && (
          <div>
            <h2 className={`${racingFont.className} mb-4 text-2xl text-racing-yellow`}>Foto</h2>
            <GalleryGrid
              foto={foto.map((f) => ({
                id: f._id,
                titolo: f.title,
                anno: f.year,
                descrizione: f.description,
                alt: f.image?.alt || f.title,
                anteprima: builder.image(f.image).width(600).height(450).url(),
                grande: builder.image(f.image).width(2000).fit("max").auto("format").url(),
              }))}
            />
          </div>
        )}
      </div>
    </section>
  );
}
