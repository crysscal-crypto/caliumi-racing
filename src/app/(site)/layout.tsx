import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ADSENSE_CLIENT } from "@/components/Pubblicita";

const SITO = process.env.NEXT_PUBLIC_SITE_URL || "https://caliumiracing.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITO),
  title: "Cristian Caliumi – Pilota Motociclismo | Sport Production, GP, Superbike",
  description:
    "Il sito ufficiale di Cristian Caliumi, pilota motociclistico di Carpi: carriera, gallery storica, classifiche Trofeo Gilera e Sport Production, notizie dal mondo delle corse.",
  applicationName: "Caliumi Racing",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Caliumi Racing",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Caliumi Racing" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.jpg"],
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-carbon-950" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${SITO}/#sito`,
                  url: SITO,
                  name: "Caliumi Racing",
                  inLanguage: "it",
                  publisher: { "@id": `${SITO}/#cristian` },
                },
                {
                  "@type": "Person",
                  "@id": `${SITO}/#cristian`,
                  name: "Cristian Caliumi",
                  url: `${SITO}/chi-sono`,
                  image: `${SITO}/icon-512.png`,
                  birthDate: "1972-08-13",
                  birthPlace: { "@type": "Place", name: "Carpi, Modena, Italia" },
                  jobTitle: "Ex pilota motociclistico e direttore sportivo",
                  description:
                    "Ex pilota di Carpi: Trofeo Gilera, Sport Production, Campionato Italiano ed Europeo GP, wild card nel Motomondiale 125 (Mugello 1995) e nel Mondiale Superbike 2002. Direttore Sportivo del Team Azione Corse dal 2007 al 2014.",
                  sameAs: [
                    "https://www.facebook.com/CaliumiCristianRider",
                    "https://www.instagram.com/crysscal/",
                  ],
                },
              ],
            }),
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {ADSENSE_CLIENT && (
          <Script
            id="adsense"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
      </body>
    </html>
  );
}
