import Link from "next/link";
import {
  bandiera,
  type Categoria,
  type RigaClassifica,
  type RigaSessione,
} from "@/sanity/lib/motogp";

export function Linguette({
  voci,
}: {
  voci: { href: string; label: string; attiva: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {voci.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          scroll={false}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
            v.attiva
              ? "border-racing-yellow bg-racing-yellow text-carbon-950"
              : "border-white/30 text-white hover:border-racing-yellow hover:text-racing-yellow"
          }`}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}

export function linguetteClassi(categorie: Categoria[], attiva: Categoria, base: string, extra = "") {
  return categorie.map((c, i) => ({
    href: i === 0 ? `${base}${extra ? `?${extra}` : ""}` : `${base}?classe=${c.slug}${extra ? `&${extra}` : ""}`,
    label: c.nome,
    attiva: c.id === attiva.id,
  }));
}

const th = "px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white/50";
const td = "px-2 py-2";

export function TabellaClassifica({ righe, limite }: { righe: RigaClassifica[]; limite?: number }) {
  const elenco = limite ? righe.slice(0, limite) : righe;
  return (
    <div className="overflow-x-auto rounded-lg bg-carbon-800">
      <table className="w-full min-w-[520px] text-sm text-white">
        <thead className="border-b border-white/10">
          <tr>
            <th className={th}>Pos.</th>
            <th className={th}>Pilota</th>
            <th className={`${th} hidden sm:table-cell`}>Team</th>
            <th className={`${th} text-center`}>Vitt.</th>
            <th className={`${th} text-center`}>Podi</th>
            <th className={`${th} text-right`}>Punti</th>
          </tr>
        </thead>
        <tbody>
          {elenco.map((r, i) => (
            <tr key={r.id} className={`border-b border-white/5 ${i < 3 ? "bg-white/[0.03]" : ""}`}>
              <td className={`${td} font-bold ${i === 0 ? "text-racing-yellow" : ""}`}>{r.position ?? "-"}</td>
              <td className={td}>
                <span className="mr-1">{bandiera(r.rider.country?.iso)}</span>
                <span className="font-semibold">{r.rider.full_name}</span>
                {r.rider.number ? <span className="ml-1 text-white/40">#{r.rider.number}</span> : null}
                <span className="block text-xs text-white/50 sm:hidden">{r.team?.name}</span>
              </td>
              <td className={`${td} hidden text-white/70 sm:table-cell`}>{r.team?.name ?? r.constructor?.name}</td>
              <td className={`${td} text-center`}>{r.race_wins ?? "-"}</td>
              <td className={`${td} text-center`}>{r.podiums ?? "-"}</td>
              <td className={`${td} text-right font-bold text-racing-yellow`}>{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabellaSessione({ righe, gara }: { righe: RigaSessione[]; gara: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-carbon-800">
      <table className="w-full min-w-[560px] text-sm text-white">
        <thead className="border-b border-white/10">
          <tr>
            <th className={th}>Pos.</th>
            <th className={th}>Pilota</th>
            <th className={`${th} hidden md:table-cell`}>Moto</th>
            {gara ? (
              <>
                <th className={`${th} text-right`}>Tempo / Distacco</th>
                <th className={`${th} text-right`}>Punti</th>
              </>
            ) : (
              <>
                <th className={`${th} text-right`}>Miglior giro</th>
                <th className={`${th} text-right`}>Distacco</th>
                <th className={`${th} hidden text-right sm:table-cell`}>Vel. max</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => {
            const ritirato = r.position === null;
            const distacco =
              i === 0 || ritirato
                ? r.time
                : r.gap?.lap && r.gap.lap !== "0"
                  ? `+${r.gap.lap} ${r.gap.lap === "1" ? "giro" : "giri"}`
                  : `+${r.gap?.first}`;
            return (
              <tr key={r.id} className={`border-b border-white/5 ${ritirato ? "text-white/40" : ""}`}>
                <td className={`${td} font-bold ${r.position === 1 ? "text-racing-yellow" : ""}`}>
                  {ritirato ? "Rit." : r.position}
                </td>
                <td className={td}>
                  <span className="mr-1">{bandiera(r.rider.country?.iso)}</span>
                  <span className="font-semibold">{r.rider.full_name}</span>
                  {r.rider.number ? <span className="ml-1 text-white/40">#{r.rider.number}</span> : null}
                  <span className="block text-xs text-white/50">{r.team?.name}</span>
                </td>
                <td className={`${td} hidden text-white/70 md:table-cell`}>{r.constructor?.name}</td>
                {gara ? (
                  <>
                    <td className={`${td} text-right font-mono`}>
                      {ritirato ? `${r.total_laps ?? 0} giri` : distacco}
                    </td>
                    <td className={`${td} text-right font-bold text-racing-yellow`}>{r.points || ""}</td>
                  </>
                ) : (
                  <>
                    <td className={`${td} text-right font-mono`}>{r.best_lap?.time ?? "-"}</td>
                    <td className={`${td} text-right font-mono text-white/70`}>
                      {i === 0 ? "" : r.gap?.first ? `+${r.gap.first}` : "-"}
                    </td>
                    <td className={`${td} hidden text-right sm:table-cell`}>
                      {r.top_speed ? `${r.top_speed} km/h` : "-"}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FonteDati() {
  return (
    <p className="mt-10 text-center text-xs text-white/40">
      Dati: MotoGP™ / Dorna Sports, aggiornati automaticamente. Caliumi Racing non è
      affiliato a Dorna o MotoGP™.
    </p>
  );
}
