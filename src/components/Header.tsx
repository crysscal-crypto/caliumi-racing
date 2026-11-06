"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Voce = { href: string; label: string; sotto?: { href: string; label: string }[] };

const navLinks: Voce[] = [
  { href: "/", label: "Home" },
  { href: "/notizie", label: "Notizie" },
  {
    href: "/motogp",
    label: "MotoGP",
    sotto: [
      { href: "/motogp", label: "Risultati e classifiche" },
      { href: "/motogp/orari", label: "Orari del weekend" },
      { href: "/motogp/statistiche", label: "Statistiche" },
    ],
  },
  {
    href: "/superbike",
    label: "WorldSBK",
    sotto: [
      { href: "/superbike", label: "Risultati e classifiche" },
      { href: "/superbike/orari", label: "Orari del weekend" },
      { href: "/superbike/statistiche", label: "Statistiche" },
    ],
  },
  { href: "/civ", label: "CIV" },
  {
    href: "/chi-sono",
    label: "Chi Sono",
    sotto: [
      { href: "/chi-sono", label: "La mia storia" },
      { href: "/articoli", label: "La mia carriera" },
      { href: "/campionati", label: "I miei campionati" },
      { href: "/moto", label: "Le mie moto" },
      { href: "/gallery", label: "Gallery" },
    ],
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="carbon-bg sticky top-0 z-50 border-b border-racing-yellow/30">
      <div className="content-panel mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/caliumi-racing-logo.png"
            alt="Caliumi Racing - Cristian Caliumi pilota motociclismo"
            width={180}
            height={75}
            priority
          />
        </Link>

        <nav className="hidden gap-6 md:flex">
          {navLinks.map((link) =>
            link.sotto ? (
              <div key={link.href} className="group relative">
                <Link
                  href={link.href}
                  className="nav-link text-sm font-semibold uppercase tracking-wide text-white"
                  aria-haspopup="true"
                >
                  {link.label} <span className="text-[10px] text-racing-yellow">▾</span>
                </Link>
                {/* menu a tendina: compare passando sopra o con la tastiera */}
                <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="min-w-[220px] overflow-hidden rounded-md border border-racing-yellow/30 bg-carbon-900 py-1 shadow-xl">
                    {link.sotto.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className="block px-4 py-2.5 text-sm font-semibold text-white hover:bg-carbon-800 hover:text-racing-yellow"
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-sm font-semibold uppercase tracking-wide text-white"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <button
          className="text-3xl leading-none text-racing-yellow md:hidden"
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="content-panel border-t border-racing-yellow/20 md:hidden">
          <ul className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/10 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:text-racing-yellow"
                >
                  {link.label}
                </Link>
                {link.sotto && (
                  <ul className="border-b border-white/10 pb-2 pl-4">
                    {link.sotto.slice(1).map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          onClick={() => setOpen(false)}
                          className="block py-2 text-sm text-white/75 hover:text-racing-yellow"
                        >
                          › {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
