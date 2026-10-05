// Mostra un testo semplice: riga vuota = nuovo paragrafo, righe che iniziano con "- " = elenco
export default function Testo({ testo, className = "" }: { testo: string; className?: string }) {
  const blocchi = testo.replace(/\r/g, "").split(/\n\s*\n/);
  return (
    <div className={className}>
      {blocchi.map((b, i) => {
        const righe = b.split("\n").filter((r) => r.trim());
        if (righe.length > 0 && righe.every((r) => r.trim().startsWith("- "))) {
          return (
            <ul key={i} className="mb-4 list-disc space-y-1 pl-6">
              {righe.map((r, j) => (
                <li key={j}>{r.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mb-4">
            {righe.join(" ")}
          </p>
        );
      })}
    </div>
  );
}
