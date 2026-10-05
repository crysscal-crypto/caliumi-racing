import { client } from "@/sanity/lib/client";

export type Moto = {
  _id: string;
  nome: string;
  slug: { current: string };
  annoInizio: number;
  annoFine?: number;
  campionati?: string;
  team?: string;
  riassunto?: string;
  racconto?: string;
  foto?: any;
  notaDati?: string;
  motore?: string;
  cilindrata?: string;
  alesaggioCorsa?: string;
  potenza?: string;
  coppia?: string;
  alimentazione?: string;
  raffreddamento?: string;
  cambio?: string;
  telaio?: string;
  sospAnt?: string;
  sospPost?: string;
  freni?: string;
  pneumatici?: string;
  peso?: string;
  velocita?: string;
};

export const CAMPI_TECNICI: [keyof Moto, string][] = [
  ["motore", "Motore"],
  ["cilindrata", "Cilindrata"],
  ["alesaggioCorsa", "Alesaggio x corsa"],
  ["potenza", "Potenza"],
  ["coppia", "Coppia"],
  ["alimentazione", "Alimentazione"],
  ["raffreddamento", "Raffreddamento"],
  ["cambio", "Cambio"],
  ["telaio", "Telaio"],
  ["sospAnt", "Sospensione anteriore"],
  ["sospPost", "Sospensione posteriore"],
  ["freni", "Freni"],
  ["pneumatici", "Pneumatici"],
  ["peso", "Peso"],
  ["velocita", "Velocità massima"],
];

export function periodoMoto(m: Moto): string {
  return m.annoFine && m.annoFine !== m.annoInizio ? `${m.annoInizio}–${m.annoFine}` : `${m.annoInizio}`;
}

export async function getMoto(): Promise<Moto[]> {
  return client.fetch(`*[_type == "moto" && defined(slug.current)] | order(annoInizio asc, nome asc)`);
}

export async function getMotoDaSlug(slug: string): Promise<Moto | null> {
  return client.fetch(`*[_type == "moto" && slug.current == $slug][0]`, { slug });
}

export async function getFotoMoto(id: string): Promise<{ _id: string; title: string; year?: number; description?: string; image: any }[]> {
  return client.fetch(
    `*[_type == "galleryItem" && moto._ref == $id && defined(image)] | order(year asc) { _id, title, year, description, image }`,
    { id }
  );
}
