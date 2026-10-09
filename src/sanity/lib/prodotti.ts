import { client } from "@/sanity/lib/client";

export const categorieProdotti: { value: string; label: string }[] = [
  { value: "caschi", label: "Caschi" },
  { value: "guanti", label: "Guanti" },
  { value: "tute", label: "Tute e giacche" },
  { value: "stivali", label: "Stivali" },
  { value: "accessori", label: "Accessori" },
];

export type Prodotto = {
  _id: string;
  nome: string;
  categoria?: string;
  asin: string;
  descrizione?: string;
  immagine?: any;
  immagineAmazon?: string;
  inEvidenza?: boolean;
  ordine?: number;
};

export function linkAmazon(asin: string): string {
  const tag = process.env.NEXT_PUBLIC_AMAZON_TAG;
  const base = `https://www.amazon.it/dp/${encodeURIComponent(asin)}`;
  return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
}

const campi = `_id, nome, categoria, asin, descrizione, immagine, immagineAmazon, inEvidenza, ordine`;

export async function getProdotti(): Promise<Prodotto[]> {
  return client.fetch(
    `*[_type == "prodotto" && defined(asin)] | order(ordine asc, nome asc) { ${campi} }`
  );
}

export async function getProdottiInEvidenza(limite = 3): Promise<Prodotto[]> {
  const tutti: Prodotto[] = await client.fetch(
    `*[_type == "prodotto" && defined(asin) && inEvidenza == true] | order(ordine asc, nome asc) { ${campi} }`
  );
  return tutti.slice(0, limite);
}