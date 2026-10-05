import Image from "next/image";
import Link from "next/link";

// Indirizzi social: se uno è vuoto, l'icona non compare
const SOCIAL = {
  facebook: "https://www.facebook.com/CaliumiCristianRider",
  instagram: "",
};

function IconaFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function IconaInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
    </svg>
  );
}

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
            <Link href="/motogp" className="nav-link">MotoGP</Link>
            <Link href="/notizie" className="nav-link">Notizie</Link>
          </nav>

          <div className="flex gap-4 text-white/80">
            {SOCIAL.instagram && (
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label="Instagram di Cristian Caliumi"
                className="flex items-center gap-2 transition hover:text-racing-yellow"
              >
                <IconaInstagram />
                <span className="text-sm">Instagram</span>
              </a>
            )}
            {SOCIAL.facebook && (
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label="Facebook di Cristian Caliumi"
                className="flex items-center gap-2 transition hover:text-racing-yellow"
              >
                <IconaFacebook />
                <span className="text-sm">Facebook</span>
              </a>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Caliumi Racing — Cristian Caliumi. Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
}
