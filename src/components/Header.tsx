"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chi-sono", label: "Chi Sono" },
  { href: "/gallery", label: "Gallery" },
  { href: "/articoli", label: "Articoli" },
  { href: "/motogp", label: "MotoGP" },
  { href: "/notizie", label: "Notizie" },
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link text-sm font-semibold uppercase tracking-wide text-white"
            >
              {link.label}
            </Link>
          ))}
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
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}