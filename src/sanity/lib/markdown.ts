// Conversione da Markdown semplice a Portable Text (il formato dei testi di Sanity)

const chiave = () => Math.random().toString(36).slice(2, 12);

export function slugDa(titolo: string): string {
  return titolo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/, "");
}

type Span = { _type: "span"; _key: string; text: string; marks: string[] };
type Blocco = {
  _type: "block";
  _key: string;
  style: string;
  markDefs: { _type: "link"; _key: string; href: string }[];
  children: Span[];
  listItem?: "bullet" | "number";
  level?: number;
};

function inline(testo: string): Pick<Blocco, "children" | "markDefs"> {
  const children: Span[] = [];
  const markDefs: Blocco["markDefs"] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(testo))) {
    if (m.index > ultimo) children.push({ _type: "span", _key: chiave(), text: testo.slice(ultimo, m.index), marks: [] });
    if (m[1] !== undefined) {
      children.push({ _type: "span", _key: chiave(), text: m[1], marks: ["strong"] });
    } else {
      const k = chiave();
      markDefs.push({ _type: "link", _key: k, href: m[3] });
      children.push({ _type: "span", _key: chiave(), text: m[2], marks: [k] });
    }
    ultimo = re.lastIndex;
  }
  if (ultimo < testo.length) children.push({ _type: "span", _key: chiave(), text: testo.slice(ultimo), marks: [] });
  if (children.length === 0) children.push({ _type: "span", _key: chiave(), text: "", marks: [] });
  return { children, markDefs };
}

export function daMarkdown(md: string): Blocco[] {
  const blocchi: Blocco[] = [];
  const paragrafi = md.replace(/\r/g, "").split(/\n\s*\n/);
  for (const p of paragrafi) {
    const righe = p.split("\n").map((r) => r.trim()).filter(Boolean);
    if (righe.length === 0) continue;

    if (righe.every((r) => /^[-*•]\s+/.test(r) || /^\d+[.)]\s+/.test(r))) {
      for (const r of righe) {
        const numerata = /^\d+[.)]\s+/.test(r);
        blocchi.push({
          _type: "block",
          _key: chiave(),
          style: "normal",
          listItem: numerata ? "number" : "bullet",
          level: 1,
          ...inline(r.replace(/^([-*•]|\d+[.)])\s+/, "")),
        });
      }
      continue;
    }

    const prima = righe[0];
    // Titolo (## o ###): è SOLO la prima riga; le righe dopo sono testo normale
    if (/^#{1,3}\s+/.test(prima)) {
      const style = /^###\s+/.test(prima) ? "h3" : "h2";
      blocchi.push({ _type: "block", _key: chiave(), style, ...inline(prima.replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "")) });
      if (righe.length > 1) blocchi.push(...daMarkdown(righe.slice(1).join("\n")));
      continue;
    }

    let style = "normal";
    let testo = righe.join(" ");
    if (/^>\s?/.test(prima)) {
      style = "blockquote";
      testo = righe.map((r) => r.replace(/^>\s?/, "")).join(" ");
    }
    blocchi.push({ _type: "block", _key: chiave(), style, ...inline(testo) });
  }
  return blocchi;
}

