import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chi-sono", label: "Chi Sono" },
  { href: "/gallery", label: "Gallery" },
  { href: "/articoli", label: "Articoli" },
  { href: "/notizie", label: "Notizie" },
  { href: "/press", label: "Press & Media" },
  { href: "/contatti", label: "Contatti" },
];

export default function Header() {
  return (
    <header className="carbon-bg border-b border-racing-yellow/30 sticky top-0 z-50">
      <div className="content-panel mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
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

        {/* Menu mobile: da completare con toggle hamburger in una fase successiva */}
        <button
          className="text-racing-yellow md:hidden"
          aria-label="Apri menu"
        >
          ☰
        </button>
      </div>
    </header>
  );
}
