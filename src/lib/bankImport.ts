// Helpers d'import/export pour la banque de questions
// Format CSV attendu (en-tête) :
// source,level,skill,kind,prompt_de,prompt_fr,prompt_ar,audio_text,options_de,options_fr,options_ar,correct_answer,explanation_fr,explanation_ar,points,tags
// options_* sont des JSON arrays ou séparées par "|"
// tags séparés par "|"

export type BankRow = {
  source: "goethe" | "oesd" | "custom";
  level: "A1" | "A2" | "B1" | "B2";
  skill: "lesen" | "hoeren" | "schreiben" | "sprechen" | "wortschatz" | "grammatik";
  kind: "qcm" | "audio" | "translate" | "write" | "speak";
  prompt_de: string;
  prompt_fr?: string;
  prompt_ar?: string;
  audio_text?: string;
  options_de?: string[] | null;
  options_fr?: string[] | null;
  options_ar?: string[] | null;
  correct_answer: string;
  explanation_fr?: string;
  explanation_ar?: string;
  points?: number;
  tags?: string[];
  is_public?: boolean;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function parseList(v: string | undefined): string[] | null {
  if (!v || !v.trim()) return null;
  const s = v.trim();
  if (s.startsWith("[")) { try { return JSON.parse(s); } catch { return null; } }
  return s.split("|").map(x => x.trim()).filter(Boolean);
}

export function parseCsv(text: string): BankRow[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const rows: BankRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: any = {};
    headers.forEach((h, idx) => row[h] = cells[idx]);
    if (!row.prompt_de || !row.correct_answer) continue;
    rows.push({
      source: (row.source || "custom").toLowerCase(),
      level: (row.level || "A1").toUpperCase(),
      skill: (row.skill || "wortschatz").toLowerCase(),
      kind: (row.kind || "qcm").toLowerCase(),
      prompt_de: row.prompt_de,
      prompt_fr: row.prompt_fr || null,
      prompt_ar: row.prompt_ar || null,
      audio_text: row.audio_text || null,
      options_de: parseList(row.options_de),
      options_fr: parseList(row.options_fr),
      options_ar: parseList(row.options_ar),
      correct_answer: String(row.correct_answer),
      explanation_fr: row.explanation_fr || null,
      explanation_ar: row.explanation_ar || null,
      points: row.points ? Number(row.points) : 1,
      tags: row.tags ? row.tags.split("|").map((x:string)=>x.trim()).filter(Boolean) : [],
      is_public: row.is_public ? row.is_public !== "false" : true,
    });
  }
  return rows;
}

export function parseJson(text: string): BankRow[] {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data.questions || []);
  return arr.map((r: any) => ({
    source: r.source || "custom",
    level: r.level || "A1",
    skill: r.skill || "wortschatz",
    kind: r.kind || "qcm",
    prompt_de: r.prompt_de,
    prompt_fr: r.prompt_fr,
    prompt_ar: r.prompt_ar,
    audio_text: r.audio_text,
    options_de: r.options_de,
    options_fr: r.options_fr,
    options_ar: r.options_ar,
    correct_answer: String(r.correct_answer),
    explanation_fr: r.explanation_fr,
    explanation_ar: r.explanation_ar,
    points: r.points ?? 1,
    tags: r.tags || [],
    is_public: r.is_public ?? true,
  })).filter((r: BankRow) => r.prompt_de && r.correct_answer);
}

export function toCsv(rows: any[]): string {
  const headers = ["source","level","skill","kind","prompt_de","prompt_fr","prompt_ar","audio_text","options_de","options_fr","options_ar","correct_answer","explanation_fr","explanation_ar","points","tags"];
  const esc = (v: any) => {
    if (v == null) return "";
    const s = Array.isArray(v) ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const out = [headers.join(",")];
  for (const r of rows) out.push(headers.map(h => esc((r as any)[h])).join(","));
  return out.join("\n");
}
