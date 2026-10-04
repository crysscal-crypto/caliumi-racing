import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="carbon-bg mt-16 border-t border-racing-yellow/30">
      <div className="content-panel mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Image
            src="/caliumi-racing-logo.png"
            alt="Caliumi Racing"
            width={150}
            height={62}
          />

          <nav className="flex flex-wrap justify-center gap-4 text-sm text-white/80">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/chi-sono" className="nav-link">Chi Sono</Link>
            <Link href="/gallery" className="nav-link">Gallery</Link>
            <Link href="/articoli" className="nav-link">Articoli</Link>
            <Link href="/notizie" className="nav-link">Notizie</Link>
          </nav>

          <div className="flex gap-4 text-white/80">
            <a href="#" aria-label="Instagram" className="nav-link">Instagram</a>
            <a href="#" aria-label="Facebook" className="nav-link">Facebook</a>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Caliumi Racing — Cristian Caliumi. Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
}