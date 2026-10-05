import Link from "next/link";
import { categorieGallery } from "@/sanity/lib/gallery";

function Chip({
  href,
  attivo,
  children,
}: {
  href: string;
  attivo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        attivo
          ? "border-racing-yellow bg-racing-yellow text-carbon-950"
          : "border-white/30 text-white hover:border-racing-yellow hover:text-racing-yellow"
      }`}
    >
      {children}
    </Link>
  );
}

export default function FiltriGallery({
  anni,
  categorie,
  annoAttivo,
  categoriaAttiva,
}: {
  anni: number[];
  categorie: string[];
  annoAttivo?: number;
  categoriaAttiva?: string;
}) {
  return (
    <div className="mb-10 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 w-24 text-xs uppercase tracking-widest text-white/50">
          Anno
        </span>
        <Chip href="/gallery" attivo={!annoAttivo && !categoriaAttiva}>
          Tutti
        </Chip>
        {anni.map((a) => (
          <Chip key={a} href={`/gallery/anno/${a}`} attivo={annoAttivo === a}>
            {a}
          </Chip>
        ))}
      </div>
      {categorie.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 w-24 text-xs uppercase tracking-widest text-white/50">
            Campionato
          </span>
          {categorie.map((c) => (
            <Chip
              key={c}
              href={`/gallery/categoria/${c}`}
              attivo={categoriaAttiva === c}
            >
              {categorieGallery[c]}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
