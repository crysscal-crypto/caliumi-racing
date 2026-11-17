import Image from "next/image";

// Piccolo banner con gli altri siti/app di Cristian (Nightwave Studio), in fondo a ogni pagina
const UTM = "utm_source=caliumiracing&utm_medium=banner&utm_campaign=siti_amici";

const SITI = [
  {
    nome: "My VibeOn",
    testo: "Radio da tutto il mondo gratis, podcast e DJ set. Ascolta e vota la tua radio preferita!",
    cta: "Ascolta gratis",
    url: `https://myvibeon.com/it/?${UTM}`,
    logo: "/promo/myvibeon.webp",
    colore: "from-fuchsia-600/30 to-violet-700/20 border-fuchsia-500/40",
  },
  {
    nome: "Antivirus Scout",
    testo: "Trova l’antivirus giusto per te con un quiz gratuito: confronta i migliori in 1 minuto.",
    cta: "Fai il quiz",
    url: `https://www.antivirusscout.com/?${UTM}`,
    logo: "/promo/antivirusscout.png",
    colore: "from-sky-600/30 to-emerald-700/20 border-sky-500/40",
  },
];

export default function SitiAmici() {
  return (
    <section aria-label="Siti consigliati" className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
      <p className="mb-3 text-xs uppercase tracking-widest text-white/40">Consigliati da Caliumi Racing</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SITI.map((s) => (
          <a
            key={s.nome}
            href={s.url}
            target="_blank"
            rel="noopener"
            className={`group flex items-center gap-4 rounded-2xl border bg-gradient-to-r p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${s.colore}`}
          >
            <Image src={s.logo} alt="" width={56} height={56} className="h-14 w-14 flex-none rounded-xl object-contain" />
            <span className="min-w-0 flex-1">
              <strong className="block text-base text-white">{s.nome}</strong>
              <span className="block text-sm leading-snug text-white/75">{s.testo}</span>
            </span>
            <span className="flex-none rounded-full bg-racing-yellow px-4 py-2 text-sm font-bold text-black transition group-hover:scale-105">
              {s.cta} →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
