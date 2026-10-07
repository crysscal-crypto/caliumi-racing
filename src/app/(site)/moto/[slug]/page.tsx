import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import { racingFont } from "@/sanity/lib/fonts";
import GalleryGrid from "@/components/GalleryGrid";
import Pubblicita from "@/components/Pubblicita";
import { getMoto, getMotoDaSlug, getFotoMoto, periodoMoto, CAMPI_TECNICI } from "@/sanity/lib/moto";

export const revalidate = 60;

const builder = imageUrlBuilder(client);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMotoDaSlug(slug);
  if (!m) return { title: "Moto non trovata" };
  const dati = [m.cilindrata, m.potenza, m.peso].filter(Boolean).join(", ");
  return {
    title: `${m.nome} (${periodoMoto(m)}): scheda tecnica | Cristian Caliumi`,
    description:
      m.riassunto ||
      `Scheda tecnica della ${m.nome} usata da Cristian Caliumi nel ${periodoMoto(m)}${m.campionati ? ` (${m.campionati})` : ""}${dati ? `: ${dati}` : ""}.`,
    alternates: { canonical: `/moto/${slug}` },
    openGraph: m.foto ? { images: [builder.image(m.foto).width(1200).height(630).url()] } : undefined,
  };
}

export default async function SchedaMotoPage({ params }: Props) {
  const { slug } = await params;
  const m = await getMotoDaSlug(slug);
  if (!m) notFound();

  const [foto, tutte] = await Promise.all([getFotoMoto(m._id), getMoto()]);
  const pos = tutte.findIndex((x) => x._id === m._id);
  const prec = pos > 0 ? tutte[pos - 1] : undefined;
  const succ = pos >= 0 && pos < tutte.length - 1 ? tutte[pos + 1] : undefined;
  const righe = CAMPI_TECNICI.filter(([k]) => m[k]);

  const tutteLeFoto = [
    ...(m.altreFoto ?? [])
      .filter((f) => f.asset)
      .map((f) => ({
        id: f._key,
        titolo: f.didascalia || m.nome,
        anno: m.annoInizio,
        descrizione: undefined as string | undefined,
        alt: f.alt || f.didascalia || `${m.nome} di Cristian Caliumi`,
        anteprima: builder.image(f).width(600).height(450).url(),
        grande: builder.image(f).width(2000).fit("max").auto("format").url(),
      })),
    ...foto.map((f) => ({
      id: f._id,
      titolo: f.title,
      anno: f.year,
      descrizione: f.description,
      alt: f.image?.alt || f.title,
      anteprima: builder.image(f.image).width(600).height(450).url(),
      grande: builder.image(f.image).width(2000).fit("max").auto("format").url(),
    })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: m.nome,
    vehicleModelDate: String(m.annoInizio),
    description: m.riassunto,
    image: m.foto ? builder.image(m.foto).width(1200).url() : undefined,
  };

  return (
    <section className="carbon-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="content-panel mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-white/50">
          <Link href="/moto" className="hover:text-racing-yellow">Le mie moto</Link>
          {" / "}
          <span className="text-white/70">{m.nome}</span>
        </nav>

        <p className={`${racingFont.className} text-center text-2xl text-racing-yellow/80`}>{periodoMoto(m)}</p>
        <h1 className={`${racingFont.className} text-center text-3xl text-racing-yellow sm:text-5xl`}>{m.nome}</h1>
        {(m.campionati || m.team) && (
          <p className="mt-2 text-center text-white/70">
            {[m.campionati, m.team].filter(Boolean).join(" · ")}
          </p>
        )}

        {m.foto && (
          <img
            src={builder.image(m.foto).width(1400).fit("max").url()}
            alt={m.foto.alt || `${m.nome} di Cristian Caliumi`}
            className="mx-auto mt-8 w-full max-w-3xl rounded-lg border border-racing-yellow/30 shadow-2xl"
          />
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            {m.racconto ? (
              <>
                <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>Il mio ricordo</h2>
                {m.racconto.split("\n\n").map((p, i) => (
                  <p key={i} className="mb-3 text-white/85">{p}</p>
                ))}
              </>
            ) : (
              m.riassunto && <p className="text-white/85">{m.riassunto}</p>
            )}
          </div>

          {righe.length > 0 && (
            <aside>
              <h2 className={`${racingFont.className} mb-3 text-2xl text-racing-yellow`}>Scheda tecnica</h2>
              <dl className="overflow-hidden rounded-lg bg-carbon-800 text-sm">
                {righe.map(([k, label], i) => (
                  <div key={k} className={`grid grid-cols-[130px_1fr] gap-3 px-4 py-2.5 ${i % 2 ? "bg-white/[0.03]" : ""}`}>
                    <dt className="text-white/50">{label}</dt>
                    <dd className="font-semibold text-white">{String(m[k])}</dd>
                  </div>
                ))}
              </dl>
              {m.notaDati && <p className="mt-2 text-xs italic text-white/40">{m.notaDati}</p>}
            </aside>
          )}
        </div>

        {tutteLeFoto.length > 0 && (
          <div className="mt-14">
            <h2 className={`${racingFont.className} mb-4 text-2xl text-racing-yellow`}>Foto</h2>
            <GalleryGrid foto={tutteLeFoto} />
          </div>
        )}

        <Pubblicita posizione="articolo-fondo" className="mt-12" />

        <div className="mt-10 flex items-center justify-between gap-4 text-sm font-semibold">
          {prec ? (
            <Link href={`/moto/${prec.slug.current}`} className="text-racing-yellow hover:underline">
              ← {prec.nome}
            </Link>
          ) : <span />}
          <Link href={`/articoli/anno/${m.annoInizio}`} className="text-white/60 hover:text-racing-yellow">
            Articoli del {m.annoInizio}
          </Link>
          {succ ? (
            <Link href={`/moto/${succ.slug.current}`} className="text-racing-yellow hover:underline">
              {succ.nome} →
            </Link>
          ) : <span />}
        </div>
      </div>
    </section>
  );
}
