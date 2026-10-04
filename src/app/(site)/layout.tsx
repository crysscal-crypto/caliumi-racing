import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cristian Caliumi – Pilota Motociclismo | Sport Production, GP, Superbike",
  description:
    "Il sito ufficiale di Cristian Caliumi, pilota motociclistico di Carpi: carriera, gallery storica, classifiche Trofeo Gilera e Sport Production, notizie dal mondo delle corse.",
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
      </body>
    </html>
  );
}