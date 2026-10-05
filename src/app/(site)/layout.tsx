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
    <html lang="it">
      <body className="flex min-h-screen flex-col bg-carbon-950">
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
