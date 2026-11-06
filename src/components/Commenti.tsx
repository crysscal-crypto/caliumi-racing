// Commenti dei lettori sotto le notizie (solo quelli approvati da Cristian) + modulo per scriverne uno
import { client } from "@/sanity/lib/client";
import ModuloCommento from "@/components/ModuloCommento";

type CommentoLettore = { _id: string; nome: string; testo: string; data: string };

async function getCommentiApprovati(pagina: string): Promise<CommentoLettore[]> {
  try {
    return await client.fetch(
      `*[_type == "commentoLettore" && pagina == $pagina && approvato == true && !(_id in path("drafts.**"))] | order(data asc)[0...200]{ _id, nome, testo, data }`,
      { pagina },
      { next: { revalidate: 60 } }
    );
  } catch {
    return [];
  }
}

function formatta(data: string): string {
  return new Date(data).toLocaleDateString("it-IT", {
    timeZone: "Europe/Rome",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function Commenti({ pagina, titolo }: { pagina: string; titolo: string }) {
  const commenti = await getCommentiApprovati(pagina);

  return (
    <section id="commenti" className="mt-12 border-t border-white/10 pt-8">
      <h2 className="text-xl font-bold text-white">
        Commenti {commenti.length > 0 && <span className="text-white/50">({commenti.length})</span>}
      </h2>

      {commenti.length === 0 ? (
        <p className="mt-2 text-sm text-white/60">Nessun commento ancora: scrivi tu il primo.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {commenti.map((c) => (
            <li key={c._id} className="rounded-lg bg-carbon-900 p-4">
              <p className="text-sm">
                <span className="font-semibold text-racing-yellow">{c.nome}</span>
                <time dateTime={c.data} className="ml-2 text-white/40">
                  {formatta(c.data)}
                </time>
              </p>
              <p className="mt-1 whitespace-pre-line text-white/85">{c.testo}</p>
            </li>
          ))}
        </ul>
      )}

      <ModuloCommento pagina={pagina} titolo={titolo} />
    </section>
  );
}
