import { bandiera } from "@/sanity/lib/motogp";
import {
  tempoGara,
  distacco,
  type CategoriaSBK,
  type RigaClassificaSBK,
  type RigaCostruttoriSBK,
  type RigaRisultatoSBK,
} from "@/sanity/lib/sbk";

export function linguetteClassiSBK(categorie: CategoriaSBK[], attiva: CategoriaSBK, base: string, extra = "") {
  return categorie.map((c, i) => ({
    href: i === 0 ? `${base}${extra ? `?${extra}` : ""}` : `${base}?classe=${c.slug}${extra ? `&${extra}` : ""}`,
    label: c.nome,
    attiva: c.id === attiva.id,
  }));
}

const th = "px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white/50";
const td = "px-2 py-2";

export function TabellaClassificaSBK({
  righe,
  vittorie,
}: {
  righe: RigaClassificaSBK[];
  vittorie?: Map<string, { v: number; p: number }>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg bg-carbon-800">
      <table className="w-full min-w-[520px] text-sm text-white">
        <thead className="border-b border-white/10">
          <tr>
            <th className={th}>Pos.</th>
            <th className={th}>Pilota</th>
            <th className={`${th} hidden sm:table-cell`}>Team</th>
            {vittorie && <th className={`${th} text-center`}>Vitt.</th>}
            {vittorie && <th className={`${th} text-center`}>Podi</th>}
            <th className={`${th} text-right`}>Punti</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => {
            const vp = vittorie?.get(r.pilota.id);
            return (
              <tr key={r.id} className={`border-b border-white/5 ${i < 3 ? "bg-white/[0.03]" : ""}`}>
                <td className={`${td} font-bold ${i === 0 ? "text-racing-yellow" : ""}`}>{r.pos || "-"}</td>
                <td className={td}>
                  <span className="mr-1">{bandiera(r.pilota.iso)}</span>
                  <span className="font-semibold">{r.pilota.nome}</span>
                  {r.numero ? <span className="ml-1 text-white/40">#{r.numero}</span> : null}
                  <span className="block text-xs text-white/50 sm:hidden">{r.team}</span>
                </td>
                <td className={`${td} hidden text-white/70 sm:table-cell`}>{r.team}</td>
                {vittorie && <td className={`${td} text-center`}>{vp?.v ?? 0}</td>}
                {vittorie && <td className={`${td} text-center`}>{vp?.p ?? 0}</td>}
                <td className={`${td} text-right font-bold text-racing-yellow`}>{r.punti}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TabellaCostruttoriSBK({ righe }: { righe: RigaCostruttoriSBK[] }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-carbon-800">
      <table className="w-full text-sm text-white">
        <thead className="border-b border-white/10">
          <tr>
            <th className={th}>Pos.</th>
            <th className={th}>Costruttore</th>
            <th className={`${th} text-right`}>Punti</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className={`${td} font-bold ${i === 0 ? "text-racing-yellow" : ""}`}>{r.pos || "-"}</td>
              <td className={td}>
                {r.iso ? <span className="mr-1">{bandiera(r.iso)}</span> : null}
                <span className="font-semibold">{r.nome}</span>
              </td>
              <td className={`${td} text-right font-bold text-racing-yellow`}>{r.punti}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabellaSessioneSBK({ righe, gara }: { righe: RigaRisultatoSBK[]; gara: boolean }) {
  const primo = righe.find((r) => r.pos === 1) ?? righe[0];
  const giroMigliore = gara ? Math.min(...righe.map((r) => r.giroVeloce).filter((x) => x > 0)) : 0;

  return (
    <div className="overflow-x-auto rounded-lg bg-carbon-800">
      <table className="w-full min-w-[560px] text-sm text-white">
        <thead className="border-b border-white/10">
          <tr>
            <th className={th}>Pos.</th>
            <th className={th}>Pilota</th>
            {gara ? (
              <>
                <th className={`${th} text-right`}>Tempo / Distacco</th>
                <th className={`${th} hidden text-right sm:table-cell`}>Giro veloce</th>
              </>
            ) : (
              <>
                <th className={`${th} text-right`}>Miglior giro</th>
                <th className={`${th} text-right`}>Distacco</th>
              </>
            )}
            <th className={`${th} hidden text-right md:table-cell`}>Vel. max</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((r) => {
            const ritirato = r.pos === null;
            let colonna: string;
            if (gara) {
              if (ritirato) colonna = `${r.giri} ${r.giri === 1 ? "giro" : "giri"}`;
              else if (r === primo) colonna = tempoGara(r.tempo);
              else if (primo && r.giri < primo.giri) {
                const d = primo.giri - r.giri;
                colonna = `+${d} ${d === 1 ? "giro" : "giri"}`;
              } else colonna = distacco(r.tempo - (primo?.tempo ?? 0));
            } else colonna = r.tempo ? tempoGara(r.tempo) : "-";

            return (
              <tr key={r.id} className={`border-b border-white/5 ${ritirato ? "text-white/40" : ""}`}>
                <td className={`${td} font-bold ${r.pos === 1 ? "text-racing-yellow" : ""}`}>
                  {ritirato ? (/retired/i.test(r.stato) ? "Rit." : "N.C.") : r.pos}
                </td>
                <td className={td}>
                  <span className="mr-1">{bandiera(r.pilota.iso)}</span>
                  <span className="font-semibold">{r.pilota.nome}</span>
                  {r.numero ? <span className="ml-1 text-white/40">#{r.numero}</span> : null}
                  <span className="block text-xs text-white/50">{r.team}</span>
                </td>
                {gara ? (
                  <>
                    <td className={`${td} text-right font-mono`}>{colonna}</td>
                    <td
                      className={`${td} hidden text-right font-mono sm:table-cell ${r.giroVeloce && r.giroVeloce === giroMigliore ? "font-bold text-racing-yellow" : "text-white/70"}`}
                    >
                      {r.giroVeloce ? tempoGara(r.giroVeloce) : "-"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`${td} text-right font-mono`}>{colonna}</td>
                    <td className={`${td} text-right font-mono text-white/70`}>
                      {r === primo || !r.tempo || !primo?.tempo ? "" : distacco(r.tempo - primo.tempo)}
                    </td>
                  </>
                )}
                <td className={`${td} hidden text-right md:table-cell`}>{r.velocita ? `${r.velocita} km/h` : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FonteDatiSBK() {
  return (
    <p className="mt-10 text-center text-xs text-white/40">
      Dati: WorldSBK / Dorna WSBK Organization, aggiornati automaticamente. Caliumi Racing non è affiliato a Dorna o WorldSBK.
    </p>
  );
}
