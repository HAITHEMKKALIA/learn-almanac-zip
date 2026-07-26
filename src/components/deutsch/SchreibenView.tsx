// Schreiben — exercice d'écriture universel (A1/A2/B1/B2)
// + historique, validation B2 (connecteurs/arguments), export PDF/DOCX-like
import { useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "@/data/curriculum";
import { useI18n, translateFrToAr } from "@/lib/i18n";
import jsPDF from "jspdf";

interface Props {
  lesson: Lesson;
  unitId: string;
  level?: "A1" | "A2" | "B1" | "B2";
  color?: string;
  onDone?: () => void;
}

interface Prompt {
  type: "email" | "post" | "essay" | "free";
  titleFr: string;
  titleAr: string;
  instructionFr: string;
  instructionAr: string;
  minWords: number;
  maxWords: number;
}

function buildPrompts(lesson: Lesson, level: "A1" | "A2" | "B1" | "B2"): Prompt[] {
  const topic = lesson.title;
  const cfg = {
    A1: { min: 30, max: 60 },
    A2: { min: 60, max: 100 },
    B1: { min: 100, max: 180 },
    B2: { min: 180, max: 280 },
  }[level];
  return [
    { type: "post", titleFr: `Petit texte sur « ${topic} »`, titleAr: `نص قصير حول « ${topic} »`,
      instructionFr: `Écris un court paragraphe en allemand sur le thème « ${topic} ». Utilise au moins 5 mots du vocabulaire de la leçon.`,
      instructionAr: `اكتب فقرة قصيرة بالألمانية حول « ${topic} » مستخدمًا 5 كلمات من المفردات.`,
      minWords: cfg.min, maxWords: cfg.max },
    { type: "email", titleFr: `E-mail / message — ${topic}`, titleAr: `بريد إلكتروني / رسالة — ${topic}`,
      instructionFr: `Rédige un e-mail à un(e) ami(e) en lien avec « ${topic} ». Salut + corps + formule de politesse.`,
      instructionAr: `اكتب بريدًا إلكترونيًا لصديق(ة) متعلّقًا بـ « ${topic} ». تحية + متن + خاتمة.`,
      minWords: cfg.min, maxWords: cfg.max + 20 },
    { type: level === "B2" ? "essay" : "free",
      titleFr: level === "B2" ? `Mini-rédaction argumentative — ${topic}` : `Texte libre — ${topic}`,
      titleAr: level === "B2" ? `مقال حجاجي مصغّر — ${topic}` : `نص حر — ${topic}`,
      instructionFr: level === "B2"
        ? `Donne ton opinion sur « ${topic} » avec au moins 2 arguments (erstens / zweitens / außerdem) et 2 connecteurs (zwar…aber, einerseits…andererseits, je…desto, deshalb, obwohl).`
        : `Écris librement sur « ${topic} » en utilisant les structures vues dans le cours.`,
      instructionAr: level === "B2" ? `أعطِ رأيك حول « ${topic} » بحجّتين على الأقل ورابطين منطقيين.` : `اكتب نصًّا حرًّا حول « ${topic} » مستخدمًا التراكيب المدروسة.`,
      minWords: cfg.min, maxWords: cfg.max + 40 },
  ];
}

// ---------- B2 connectors & arguments ----------
const B2_CONNECTORS = [
  "zwar", "aber", "einerseits", "andererseits", "je", "desto",
  "deshalb", "deswegen", "obwohl", "trotzdem", "sodass", "damit",
  "außerdem", "infolgedessen", "dennoch", "ferner", "nicht nur", "sondern auch",
];
const B2_ARGUMENT_MARKERS = [
  "erstens", "zweitens", "drittens", "zum einen", "zum anderen",
  "ein argument", "ein weiterer grund", "meiner meinung nach",
  "ich denke", "ich glaube", "ich finde", "ich bin der meinung",
  "vorteil", "nachteil",
];

function findHits(text: string, terms: string[]): string[] {
  const lower = text.toLowerCase();
  const hits = new Set<string>();
  for (const t of terms) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) hits.add(t);
  }
  return [...hits];
}

// ---------- Storage ----------
const DRAFT_KEY = "dm_schreiben_v1";
const HISTORY_KEY = "dm_schreiben_history_v1";

function loadDraft(lessonId: string, idx: number): string {
  try { return (JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"))[`${lessonId}:${idx}`] || ""; } catch { return ""; }
}
function saveDraft(lessonId: string, idx: number, text: string) {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    all[`${lessonId}:${idx}`] = text;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  } catch {}
}

export interface SchreibenEntry {
  id: string;
  date: string;             // ISO
  lessonId: string;
  lessonTitle: string;
  unitId: string;
  level: "A1" | "A2" | "B1" | "B2";
  promptIndex: number;
  promptTitle: string;
  promptInstruction: string;
  text: string;
  words: number;
  scorePct: number;
  validated: boolean;
  feedback: string[];       // bullet feedback
}
function loadHistory(): SchreibenEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(list: SchreibenEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-200))); } catch {}
}

// ---------- Exports ----------
function exportEntryPdf(e: SchreibenEntry) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const w = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(16);
  pdf.text(`Schreiben — ${e.level} · ${e.lessonTitle}`, margin, y); y += 22;
  pdf.setFontSize(10); pdf.setFont("helvetica", "normal");
  pdf.text(`${new Date(e.date).toLocaleString()}  ·  ${e.words} mots  ·  Score ${e.scorePct}%${e.validated ? "  ·  ✓ Validé" : ""}`, margin, y); y += 18;
  const block = (label: string, body: string) => {
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.text(label, margin, y); y += 14;
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(body || "—", w);
    for (const ln of lines) {
      if (y > pdf.internal.pageSize.getHeight() - margin) { pdf.addPage(); y = margin; }
      pdf.text(ln, margin, y); y += 14;
    }
    y += 6;
  };
  block("Consigne", `${e.promptTitle}\n${e.promptInstruction}`);
  block("Ma rédaction", e.text);
  block("Feedback de correction", e.feedback.map(f => "• " + f).join("\n") || "Aucun retour.");
  pdf.save(`schreiben_${e.level}_${e.lessonId}_${e.id.slice(0, 6)}.pdf`);
}

function exportEntryDocx(e: SchreibenEntry) {
  // Minimal Word-compatible .doc (HTML payload — Word opens it natively)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Schreiben ${e.level}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111;line-height:1.5;}
h1{font-size:16pt;margin:0 0 6pt;} h2{font-size:12pt;margin:14pt 0 4pt;color:#1f4e79;}
.meta{color:#555;font-size:10pt;margin-bottom:10pt}
.box{border:1px solid #ccc;padding:10pt;background:#fafafa;white-space:pre-wrap}</style></head>
<body>
<h1>Schreiben — ${e.level} · ${escapeHtml(e.lessonTitle)}</h1>
<div class="meta">${new Date(e.date).toLocaleString()} · ${e.words} mots · Score ${e.scorePct}%${e.validated ? " · ✓ Validé" : ""}</div>
<h2>Consigne</h2><div class="box"><strong>${escapeHtml(e.promptTitle)}</strong>\n${escapeHtml(e.promptInstruction)}</div>
<h2>Ma rédaction</h2><div class="box">${escapeHtml(e.text)}</div>
<h2>Feedback de correction</h2><div class="box">${e.feedback.map(f => "• " + escapeHtml(f)).join("<br>") || "—"}</div>
</body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `schreiben_${e.level}_${e.lessonId}_${e.id.slice(0, 6)}.doc`;
  a.click(); URL.revokeObjectURL(url);
}

function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]!);
}

// ---------- Main view ----------
export function SchreibenView({ lesson, unitId, level = "A1", color = "hsl(var(--primary))", onDone }: Props) {
  const { showAr, deOnly } = useI18n();
  const prompts = useMemo(() => buildPrompts(lesson, level), [lesson, level]);
  const [active, setActive] = useState(0);
  const [text, setText] = useState("");
  const [history, setHistory] = useState<SchreibenEntry[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { setText(loadDraft(lesson.id, active)); }, [lesson.id, active]);
  useEffect(() => { saveDraft(lesson.id, active, text); }, [lesson.id, active, text]);

  const p = prompts[active];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lengthOk = words >= p.minWords && words <= p.maxWords;
  const usedKeywords = lesson.vocab.filter(v =>
    new RegExp(`\\b${v.de.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)
  );
  const kwOk = usedKeywords.length >= Math.min(5, lesson.vocab.length);
  const hasUmlaut = /[äöüßÄÖÜ]/.test(text);
  const startsCap = /^[A-ZÄÖÜ]/.test(text.trim());
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  // B2 specifics
  const isB2 = level === "B2";
  const connectorHits = isB2 ? findHits(text, B2_CONNECTORS) : [];
  const argumentHits = isB2 ? findHits(text, B2_ARGUMENT_MARKERS) : [];
  const connectorsOk = !isB2 || connectorHits.length >= 2;
  const argumentsOk = !isB2 || argumentHits.length >= 2;

  // Build feedback
  const buildFeedback = (): string[] => {
    const fb: string[] = [];
    fb.push(`Longueur : ${words} mots (cible ${p.minWords}–${p.maxWords}) — ${lengthOk ? "OK" : "à ajuster"}.`);
    fb.push(`Mots-clés utilisés : ${usedKeywords.length}/${Math.min(5, lesson.vocab.length)}${usedKeywords.length ? " (" + usedKeywords.map(v => v.de).join(", ") + ")" : ""}.`);
    fb.push(hasUmlaut ? "Umlauts/ß présents." : "Pense à utiliser ä/ö/ü/ß.");
    fb.push(startsCap ? "Bonne ponctuation initiale." : "Commence ta rédaction par une majuscule.");
    fb.push(`Phrases détectées : ${sentences}.`);
    if (isB2) {
      fb.push(`Connecteurs (≥ 2) : ${connectorHits.length} trouvés${connectorHits.length ? " (" + connectorHits.join(", ") + ")" : ""}.`);
      fb.push(`Arguments (≥ 2) : ${argumentHits.length} trouvés${argumentHits.length ? " (" + argumentHits.join(", ") + ")" : ""}.`);
    }
    return fb;
  };

  const fullyValid = lengthOk && kwOk && connectorsOk && argumentsOk;
  const scorePct = Math.min(100, Math.round(
    (lengthOk ? 30 : 15 * Math.min(1, words / Math.max(1, p.minWords))) +
    (kwOk ? 30 : (usedKeywords.length / Math.max(1, Math.min(5, lesson.vocab.length))) * 30) +
    (hasUmlaut ? 10 : 0) + (startsCap ? 10 : 0) +
    (isB2 ? ((connectorsOk ? 10 : (connectorHits.length / 2) * 10) + (argumentsOk ? 10 : (argumentHits.length / 2) * 10)) : 20)
  ));

  const focusEditor = () => { taRef.current?.focus(); taRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const insertHelper = (snippet: string) => {
    const el = taRef.current; if (!el) return;
    const v = el.value;
    const start = el.selectionStart ?? v.length;
    const end = el.selectionEnd ?? v.length;
    const next = v.slice(0, start) + snippet + v.slice(end);
    setText(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + snippet.length, start + snippet.length); }, 30);
  };

  const copy = () => navigator.clipboard?.writeText(text);
  const reset = () => { if (confirm("Réinitialiser le brouillon ?")) setText(""); };

  const markDone = () => {
    if (!lengthOk) return;
    const entry: SchreibenEntry = {
      id: crypto.randomUUID(), date: new Date().toISOString(),
      lessonId: lesson.id, lessonTitle: lesson.title, unitId, level,
      promptIndex: active, promptTitle: p.titleFr, promptInstruction: p.instructionFr,
      text, words, scorePct, validated: fullyValid, feedback: buildFeedback(),
    };
    const next = [...history, entry];
    setHistory(next); saveHistory(next);
    import("@/lib/lessonProgress").then(m => m.recordExerciseRun(lesson.id, unitId, scorePct));
    onDone?.();
  };

  const reopen = (e: SchreibenEntry) => {
    setActive(e.promptIndex); setText(e.text); setShowHistory(false); focusEditor();
  };
  const deleteEntry = (id: string) => {
    if (!confirm("Supprimer cette rédaction ?")) return;
    const next = history.filter(h => h.id !== id);
    setHistory(next); saveHistory(next);
  };

  return (
    <div className="space-y-3">
      {/* Tabs prompts + history toggle */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 items-center">
        {prompts.map((pr, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); setShowHistory(false); }}
            className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${active === i && !showHistory ? "text-primary-foreground" : "bg-card text-foreground"}`}
            style={active === i && !showHistory ? { background: color, borderColor: color } : { borderColor: `${color}40` }}
          >
            {pr.titleFr}
          </button>
        ))}
        <button
          onClick={() => setShowHistory(s => !s)}
          className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${showHistory ? "bg-foreground text-background" : "bg-card text-foreground border-border"}`}
        >
          📜 Historique ({history.filter(h => h.lessonId === lesson.id).length})
        </button>
      </div>

      {showHistory ? (
        <HistoryView
          history={history}
          currentLessonId={lesson.id}
          color={color}
          onReopen={reopen}
          onDelete={deleteEntry}
        />
      ) : (
        <>
          {/* Instruction */}
          <div className="rounded-xl border p-3" style={{ borderColor: `${color}40`, background: `${color}10` }}>
            <div className="text-xs font-bold mb-1" style={{ color }}>📝 Consigne · {level} · {p.minWords}–{p.maxWords} mots</div>
            <p className="text-foreground text-sm leading-snug m-0">{p.instructionFr}</p>
            {!deOnly && showAr && <p dir="rtl" className="text-emerald-500 text-xs leading-snug mt-1 m-0">🇸🇦 {p.instructionAr || translateFrToAr(p.instructionFr)}</p>}
          </div>

          {/* Mots-clés */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-1.5">💡 Mots-clés à utiliser ({usedKeywords.length}/{Math.min(5, lesson.vocab.length)})</div>
            <div className="flex flex-wrap gap-1.5">
              {lesson.vocab.slice(0, 12).map((v, i) => {
                const used = usedKeywords.some(k => k.de === v.de);
                return (
                  <button
                    key={i}
                    onClick={() => insertHelper((text.endsWith(" ") || !text ? "" : " ") + v.de + " ")}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${used ? "bg-success/20 border-success text-success" : "bg-muted/30 border-border text-foreground hover:bg-accent/40"}`}
                    title={`Insérer « ${v.de} » — ${v.fr}`}
                  >
                    {used ? "✓ " : "+ "}{v.de}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor */}
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Schreib hier deinen Text auf Deutsch…"
            className="w-full min-h-[200px] rounded-xl border border-border bg-card p-3 text-foreground text-sm font-sans leading-relaxed focus:outline-none focus:ring-2"
          />

          {/* Checklist */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <Check ok={lengthOk} label={`Longueur ${words}/${p.minWords}–${p.maxWords}`} onFix={focusEditor} />
            <Check ok={kwOk} label={`Mots-clés (${usedKeywords.length})`} onFix={focusEditor} />
            <Check ok={hasUmlaut} label="Umlauts/ß présents" onFix={() => insertHelper("ä")} />
            <Check ok={startsCap} label="Majuscule au début" onFix={focusEditor} />
            {isB2 && (
              <Check
                ok={connectorsOk}
                label={`Connecteurs ≥ 2 (${connectorHits.length})`}
                onFix={() => insertHelper(" einerseits … andererseits ")}
                hint="Cliquer pour insérer un connecteur"
              />
            )}
            {isB2 && (
              <Check
                ok={argumentsOk}
                label={`Arguments ≥ 2 (${argumentHits.length})`}
                onFix={() => insertHelper(" Erstens, … Zweitens, … ")}
                hint="Cliquer pour insérer une structure d'arguments"
              />
            )}
          </div>

          {isB2 && (!connectorsOk || !argumentsOk) && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
              <div className="font-bold text-warning mb-1">⚠️ Validation B2 incomplète</div>
              {!connectorsOk && (
                <button onClick={() => insertHelper(" zwar … aber ")} className="block text-left underline text-warning hover:no-underline">
                  → Cliquer pour ajouter un connecteur (ex. zwar…aber, einerseits…andererseits)
                </button>
              )}
              {!argumentsOk && (
                <button onClick={() => insertHelper(" Erstens, … Zweitens, … ")} className="block text-left underline text-warning hover:no-underline mt-1">
                  → Cliquer pour ajouter des marqueurs d'arguments (Erstens, Zweitens)
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-muted/40">Score estimé : <span style={{ color }}>{scorePct}%</span></span>
            <button onClick={copy} className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold hover:bg-accent/40">📋 Copier</button>
            <button onClick={reset} className="px-3 py-1.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20">🗑 Réinitialiser</button>
            <button
              onClick={markDone}
              disabled={!lengthOk}
              className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
              style={{ background: color, color: "hsl(var(--primary-foreground))" }}
            >
              {fullyValid ? "✅ Valider mon texte" : "💾 Enregistrer (partiel)"}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">💾 Brouillon sauvegardé automatiquement. Les rédactions enregistrées apparaissent dans l'historique.</p>
        </>
      )}
    </div>
  );
}

function Check({ ok, label, onFix, hint }: { ok: boolean; label: string; onFix?: () => void; hint?: string }) {
  return (
    <button
      onClick={onFix}
      title={hint || (ok ? "" : "Cliquer pour corriger")}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left ${ok ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer"}`}
    >
      <span>{ok ? "✓" : "○"}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function HistoryView({ history, currentLessonId, color, onReopen, onDelete }:
  { history: SchreibenEntry[]; currentLessonId: string; color: string;
    onReopen: (e: SchreibenEntry) => void; onDelete: (id: string) => void }) {
  const [filter, setFilter] = useState<"current" | "all">("current");
  const list = (filter === "current" ? history.filter(h => h.lessonId === currentLessonId) : history)
    .slice().sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button onClick={() => setFilter("current")} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${filter === "current" ? "text-primary-foreground" : "bg-card text-foreground border-border"}`} style={filter === "current" ? { background: color, borderColor: color } : {}}>
          Cette leçon ({history.filter(h => h.lessonId === currentLessonId).length})
        </button>
        <button onClick={() => setFilter("all")} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${filter === "all" ? "text-primary-foreground" : "bg-card text-foreground border-border"}`} style={filter === "all" ? { background: color, borderColor: color } : {}}>
          Toutes ({history.length})
        </button>
      </div>
      {list.length === 0 && <p className="text-muted-foreground text-sm">Aucune rédaction enregistrée pour le moment.</p>}
      <div className="flex flex-col gap-2">
        {list.map(e => (
          <div key={e.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary">{e.level}</span>
                  <span className="truncate">{e.lessonTitle}</span>
                  {e.validated
                    ? <span className="px-1.5 py-0.5 rounded bg-success/20 text-success">✓ Validé</span>
                    : <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning">Partiel</span>}
                  <span className="text-muted-foreground font-normal">{new Date(e.date).toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{e.promptTitle} · {e.words} mots · Score {e.scorePct}%</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => onReopen(e)} className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-bold">↩️ Rouvrir</button>
                <button onClick={() => exportEntryPdf(e)} className="px-2 py-1 rounded-md bg-card border border-border text-[11px] font-bold hover:bg-accent/40">📄 PDF</button>
                <button onClick={() => exportEntryDocx(e)} className="px-2 py-1 rounded-md bg-card border border-border text-[11px] font-bold hover:bg-accent/40">📝 DOCX</button>
                <button onClick={() => onDelete(e.id)} className="px-2 py-1 rounded-md bg-destructive/10 border border-destructive/40 text-destructive text-[11px] font-bold">🗑</button>
              </div>
            </div>
            <details className="mt-2">
              <summary className="text-[11px] text-muted-foreground cursor-pointer">Voir le texte et le feedback</summary>
              <div className="mt-2 text-xs whitespace-pre-wrap bg-muted/30 rounded-lg p-2">{e.text}</div>
              {e.feedback?.length > 0 && (
                <ul className="mt-2 text-[11px] text-muted-foreground list-disc pl-5 space-y-0.5">
                  {e.feedback.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
