import PubblicitaMultiplex from "@/components/PubblicitaMultiplex";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { racingFont } from "@/sanity/lib/fonts";
import CardNotizia from "@/components/CardNotizia";
import { getUltimeRedazione, urlCopertina } from "@/sanity/lib/redazione";
import Pubblicita from "@/components/Pubblicita";
import {
  type Notizia,
  getNotizie,
  getCommenti,
  mappaCommenti,
  pulisciLink,
} from "@/sanity/lib/notizie";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/feed.xml", title: "Caliumi Racing - Notizie" }] } },
};

const AGGIORNATO = "6 novembre 2026";

const DOMANDE: { d: string; r: string }[] = [
  {
    d: "Che cos'è Caliumi Racing?",
    r: "Caliumi Racing è un sito italiano dedicato al motociclismo sportivo. Raccoglie ogni giorno le notizie di MotoGP e Superbike, pubblica risultati e classifiche aggiornate di MotoGP, Mondiale Superbike e CIV e racconta la carriera di Cristian Caliumi, ex pilota di Carpi (Modena).",
  },
  {
    d: "Dove trovo i risultati della MotoGP di oggi?",
    r: "Nella sezione MotoGP di caliumiracing.com trovi i risultati di prove libere, qualifiche, Sprint e gara di ogni Gran Premio, con la classifica piloti aggiornata. I risultati vengono pubblicati in automatico poco dopo la fine di ogni sessione.",
  },
  {
    d: "Dove vedo la classifica del Mondiale Superbike?",
    r: "Nella sezione Superbike ci sono i risultati di Superpole, Gara 1, Superpole Race e Gara 2 di ogni round del Mondiale WorldSBK, insieme alla classifica del campionato.",
  },
  {
    d: "Ci sono i risultati storici della MotoGP?",
    r: "Sì. L'archivio della sezione MotoGP permette di consultare le stagioni passate della classe regina e delle classi minori, Gran Premio per Gran Premio. Quando un risultato manca nell'archivio ufficiale viene integrato da fonti pubbliche, indicate nella pagina.",
  },
  {
    d: "Chi è Cristian Caliumi?",
    r: "Cristian Caliumi è un ex pilota motociclistico nato a Carpi nel 1972. Ha corso nel Trofeo Gilera, nella Sport Production e nel Campionato Italiano ed Europeo GP, con una wild card nel Motomondiale classe 125 al Mugello nel 1995 e alcune gare nel Mondiale Superbike nel 2002. Dal 2007 al 2014 è stato direttore sportivo del Team Azione Corse.",
  },
  {
    d: "Come posso seguire Caliumi Racing sui social?",
    r: "Su Instagram, nel profilo @sblisgass_motorsport, escono in automatico le storie con i risultati di ogni sessione MotoGP e Superbike e gli avvisi dei nuovi articoli. Sulla pagina Facebook Sblisgass Motor Sport vengono pubblicati risultati e articoli.",
  },
  {
    d: "Caliumi Racing è gratuito?",
    r: "Sì, tutti i contenuti del sito sono gratuiti e non serve registrarsi. Il sito si sostiene con la pubblicità e con alcuni link di affiliazione ai prodotti consigliati.",
  },
];

export default async function HomePage() {
  const [esterne, commenti, nostre] = await Promise.all([getNotizie(9, "moto"), getCommenti(), getUltimeRedazione(3)]);

  // Le ultime 3 notizie di Caliumi Racing insieme a quelle delle testate, stesso formato
  const mie: Notizia[] = nostre.map((n) => ({
    id: n._id,
    slug: n.slug,
    titolo: n.titolo,
    link: `https://www.caliumiracing.com/notizie/${n.slug}`,
    estratto: n.sommario,
    data: n.data,
    fonte: "Caliumi Racing",
    campionato: n.campionato,
    immagine: urlCopertina(n.copertina, 400, 300),
  }));
  // Precedenza alle nostre: quelle degli ultimi 3 giorni stanno in cima, poi tutto il resto in ordine di data
  const IN_EVIDENZA = 3 * 24 * 3600 * 1000;
  const quando = (n: Notizia) => Date.parse(n.data ?? "0");
  const inCima = mie.filter((n) => Date.now() - quando(n) < IN_EVIDENZA);
  const resto = [...mie.filter((n) => !inCima.includes(n)), ...esterne.slice(0, 9 - mie.length)].sort(
    (a, b) => quando(b) - quando(a)
  );
  const notizie = [...inCima, ...resto];
  const commentiPerLink = mappaCommenti(commenti);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[45vh] min-h-[320px] w-full">
          <Image
            src="/hero.jpg"
            alt="Cristian Caliumi in pista"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon-950 via-carbon-950/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-12 text-center sm:px-6">
            <h1 className={`${racingFont.className} text-3xl tracking-wide text-white sm:text-5xl`}>
              Cristian Caliumi
            </h1>
            <p className="mt-2 text-white/80">
              Pilota motociclistico
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/chi-sono"
                className="rounded-md bg-racing-yellow px-6 py-3 font-semibold text-carbon-950 transition hover:scale-105"
              >
                La mia storia
              </Link>
              <Link
                href="/gallery"
                className="rounded-md border border-white/40 px-6 py-3 font-semibold text-white transition hover:scale-105"
              >
                Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ultime notizie */}
      {notizie.length > 0 && (
        <section className="carbon-bg">
          <div className="content-panel mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className={`${racingFont.className} text-2xl text-racing-yellow sm:text-3xl`}>
                Ultime notizie MotoGP e Superbike
              </h2>
              <Link
                href="/notizie"
                className="text-sm font-semibold text-racing-yellow hover:underline"
              >
                Tutte le notizie →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notizie.map((n) => (
                <CardNotizia
                  key={n.id}
                  notizia={n}
                  commento={commentiPerLink.get(pulisciLink(n.link))?.commento}
                />
              ))}
            </div>
            <Pubblicita posizione="home-notizie" className="mt-8" />
          </div>
        </section>
      )}

      {/* Breve intro */}
      <section className="carbon-bg">
        <div className="content-panel mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-white/80">
            Una passione per le moto vissuta in pista per anni, tra
            campionati nazionali, trofei ed esperienze internazionali —
            compresa una wild card nel Motomondiale classe 125 e alcune gare
            nel Campionato Mondiale Superbike. Qui racconto la mia storia,
            le foto e le classifiche delle stagioni vissute in sella.
          </p>
          <Link
            href="/articoli"
            className="mt-6 inline-block rounded-md border border-racing-yellow px-6 py-3 font-semibold text-racing-yellow transition hover:scale-105"
          >
            Scopri la carriera
          </Link>
        </div>
      </section>

      {/* Cosa trovi sul sito */}
      <section className="carbon-bg">
        <div className="content-panel mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h2 className={`${racingFont.className} text-2xl text-racing-yellow sm:text-3xl`}>
            Cosa trovi su Caliumi Racing
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 text-white/80 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-white">
                <Link href="/notizie" className="hover:text-racing-yellow">Notizie MotoGP e Superbike</Link>
              </h3>
              <p className="mt-1">
                Le notizie più importanti dal paddock raccolte ogni giorno, più gli articoli della
                redazione su gare, piloti e curiosità del motociclismo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">
                <Link href="/motogp" className="hover:text-racing-yellow">Risultati e classifiche MotoGP</Link>
              </h3>
              <p className="mt-1">
                Calendario, tempi di prove, qualifiche, Sprint e gara, classifica piloti e un archivio
                storico con le stagioni passate del Motomondiale.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">
                <Link href="/superbike" className="hover:text-racing-yellow">Mondiale Superbike e CIV</Link>
              </h3>
              <p className="mt-1">
                Risultati di ogni round del WorldSBK e del{" "}
                <Link href="/civ" className="text-racing-yellow hover:underline">Campionato Italiano Velocità</Link>,
                con le classifiche sempre aggiornate.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">
                <Link href="/gallery" className="hover:text-racing-yellow">La storia di un pilota</Link>
              </h3>
              <p className="mt-1">
                Foto storiche, le{" "}
                <Link href="/moto" className="text-racing-yellow hover:underline">moto usate in carriera</Link>{" "}
                e le{" "}
                <Link href="/campionati" className="text-racing-yellow hover:underline">classifiche</Link>{" "}
                del Trofeo Gilera e della Sport Production.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="carbon-bg">
        <div className="content-panel mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <PubblicitaMultiplex />
        </div>
      </section>

      {/* Domande frequenti */}
      <section className="carbon-bg">
        <div className="content-panel mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className={`${racingFont.className} text-2xl text-racing-yellow sm:text-3xl`}>
            Domande frequenti
          </h2>
          <div className="mt-6 space-y-6">
            {DOMANDE.map((q) => (
              <div key={q.d}>
                <h3 className="font-semibold text-white">{q.d}</h3>
                <p className="mt-1 text-white/80">{q.r}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-white/50">Aggiornato il {AGGIORNATO}</p>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: DOMANDE.map((q) => ({
                "@type": "Question",
                name: q.d,
                acceptedAnswer: { "@type": "Answer", text: q.r },
              })),
            }),
          }}
        />
      </section>
    </>
  );
}
