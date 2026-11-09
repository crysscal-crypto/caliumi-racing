// Link di approfondimento in fondo agli articoli: aiutano Google a capire il sito e fanno leggere più pagine
import Link from "next/link";

const LINK: Record<string, { href: string; label: string }[]> = {
  MotoGP: [
    { href: "/motogp", label: "Risultati e classifica MotoGP" },
    { href: "/motogp/orari", label: "Orari del prossimo GP" },
    { href: "/motogp/statistiche", label: "Statistiche e record MotoGP" },
    { href: "/notizie?categoria=motogp", label: "Tutte le notizie MotoGP" },
  ],
  "Moto2 / Moto3": [
    { href: "/motogp", label: "Risultati Moto2 e Moto3" },
    { href: "/motogp/statistiche", label: "Statistiche del Motomondiale" },
    { href: "/notizie?categoria=moto2-moto3", label: "Notizie Moto2 e Moto3" },
  ],
  Superbike: [
    { href: "/superbike", label: "Risultati e classifica WorldSBK" },
    { href: "/superbike/orari", label: "Orari del prossimo round" },
    { href: "/superbike/statistiche", label: "Statistiche e record Superbike" },
    { href: "/notizie?categoria=superbike", label: "Tutte le notizie Superbike" },
  ],
  CIV: [
    { href: "/civ", label: "Risultati e classifiche CIV" },
    { href: "/notizie?categoria=corse-moto", label: "Notizie dalle altre corse" },
  ],
  Tecnica: [
    { href: "/notizie?categoria=tecnica", label: "Tutti gli articoli di tecnica" },
    { href: "/motogp/statistiche", label: "Statistiche e record MotoGP" },
    { href: "/moto", label: "Le moto di Cristian Caliumi" },
  ],
  Motocross: [{ href: "/notizie?categoria=off-road", label: "Notizie motocross e off-road" }],
};

const SEMPRE = [
  { href: "/notizie", label: "Ultime notizie" },
  { href: "/chi-sono", label: "Chi è Cristian Caliumi" },
];

export default function Approfondisci({ campionato }: { campionato?: string }) {
  const link = [...(LINK[campionato ?? ""] ?? LINK.MotoGP), ...SEMPRE];
  return (
    <nav aria-label="Approfondisci" className="mt-8 rounded-lg border border-white/10 bg-carbon-900 p-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-racing-yellow">Approfondisci</h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {link.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-white/85 hover:text-racing-yellow hover:underline">
              › {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
