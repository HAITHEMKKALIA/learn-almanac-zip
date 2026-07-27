// === Outils Arabe ===
// 1) ArGlossary : glossaire DE/FR/AR par chapitre (révision rapide)
// 2) ArHealthCheck : mode test pour vérifier la couverture AR sur toute l'app
// 3) exportLessonBilingualHtml : export PDF bilingue FR+AR via window.print
//    (HTML rendu par le navigateur → polices arabes natives, contrairement à jsPDF)

import { useMemo, useState } from "react";
import { getActiveUnits } from "@/data/activeUnits";
import { translateFrToAr, isArTranslationComplete, useI18n } from "@/lib/i18n";
import type { Lesson } from "@/data/curriculum";
import type { EnrichedLesson } from "@/data/lessonEnrichment";

const UNIT_AR: Record<string, { title: string; desc: string }> = {
  u1:  { title: "الأبجدية", desc: "الأبجدية كاملة، الأصوات، النطق" },
  u2:  { title: "التحية", desc: "التحيات، التعريف بالنفس، الأدب" },
  u3:  { title: "الأرقام", desc: "الأرقام 0-1000، العمر، السعر، الهاتف" },
  u4:  { title: "أدوات التعريف والحالات", desc: "der/die/das، الرفع، النصب، الجر" },
  u5:  { title: "الأفعال", desc: "sein, haben, werden، الأفعال المساعدة" },
  u6:  { title: "الحياة اليومية", desc: "العائلة، البيت، الروتين" },
  u7:  { title: "الأكل والشرب", desc: "الطعام، المشروبات، في المطعم" },
  u8:  { title: "القواعد", desc: "الحالات، التصريفات، بنية الجملة" },
  u9:  { title: "المحادثات", desc: "الحوارات، الاتجاهات، الطوارئ" },
  u10: { title: "الضمائر", desc: "الضمائر، حروف الجر، الروابط" },
  u11: { title: "الساعة", desc: "قراءة الساعة، المواعيد، 24س" },
};

/* ============ 1. Glossaire AR par chapitre ============ */
export function ArGlossary({ onBack }: { onBack: () => void }) {
  const UNITS = useMemo(() => getActiveUnits(), []);
  const [uId, setUId] = useState<string>(UNITS[0].id);
  const unit = UNITS.find(u => u.id === uId) || UNITS[0];
  const ar = UNIT_AR[unit.id];

  const rows = useMemo(() => {
    const all: { de: string; fr: string; ar: string; lesson: string }[] = [];
    unit.lessons.forEach(l => {
      l.vocab.forEach(v => {
        all.push({ de: v.de, fr: v.fr, ar: translateFrToAr(v.fr), lesson: l.title });
      });
    });
    // Dédupliquer par "de"
    const seen = new Set<string>();
    return all.filter(r => (seen.has(r.de) ? false : (seen.add(r.de), true)));
  }, [unit]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground m-0 text-base font-bold">📖 Glossaire arabe</h3>
          <div dir="rtl" className="text-emerald-400 text-[11px]">🇸🇦 المعجم العربي للفصول</div>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border overflow-x-auto flex gap-1.5">
        {UNITS.map((u, i) => (
          <button key={u.id} onClick={() => setUId(u.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap font-bold transition-colors ${
              uId === u.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
            }`}
            style={uId === u.id ? { background: u.color } : {}}
          >
            {u.icon} Ch.{String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 border-b border-border" style={{ background: `${unit.color}10` }}>
        <div className="font-extrabold text-foreground text-sm">{unit.icon} {unit.title}</div>
        <div dir="rtl" className="text-emerald-400 text-xs mt-0.5">🇸🇦 {ar?.title} — {ar?.desc}</div>
        <div className="text-muted-foreground text-[11px] mt-1">{rows.length} mots clés <span dir="rtl">· {rows.length} كلمة</span></div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground text-sm truncate">🇩🇪 {r.de}</div>
              <div className="text-muted-foreground text-[11px] truncate">🇫🇷 {r.fr}</div>
              <div dir="rtl" className="text-emerald-400 text-[12px] truncate">🇸🇦 {r.ar}</div>
            </div>
            <span className="text-[9px] text-muted-foreground/70 shrink-0">{r.lesson.slice(0, 14)}…</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ 2. Mode test AR (santé i18n) ============ */
export function ArHealthCheck({ onBack }: { onBack: () => void }) {
  const report = useMemo(() => {
    const items: { unitId: string; label: string; fr: string; ar: string; ok: boolean }[] = [];
    UNITS.forEach(u => {
      const ua = UNIT_AR[u.id];
      items.push({ unitId: u.id, label: "Titre chapitre", fr: u.title, ar: ua?.title || translateFrToAr(u.title), ok: !!ua?.title });
      items.push({ unitId: u.id, label: "Description chapitre", fr: u.desc, ar: ua?.desc || translateFrToAr(u.desc), ok: !!ua?.desc });
      u.lessons.forEach(l => {
        items.push({ unitId: u.id, label: `Leçon: ${l.title}`, fr: l.title, ar: translateFrToAr(l.title), ok: isArTranslationComplete(l.title) });
        l.vocab.slice(0, 3).forEach(v => {
          items.push({ unitId: u.id, label: `Mot: ${v.de}`, fr: v.fr, ar: translateFrToAr(v.fr), ok: isArTranslationComplete(v.fr) });
        });
      });
    });
    return items;
  }, []);

  const total = report.length;
  const ok = report.filter(r => r.ok).length;
  const failing = report.filter(r => !r.ok);
  const pct = Math.round((ok / total) * 100);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-base font-bold">🧪 Mode test arabe</h3>
          <div dir="rtl" className="text-emerald-400 text-[11px]">🇸🇦 فحص الترجمة العربية</div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-extrabold" style={{ color: pct >= 90 ? "hsl(var(--success))" : pct >= 70 ? "hsl(var(--warning))" : "hsl(var(--destructive))" }}>{pct}%</div>
          <div className="text-sm text-muted-foreground">{ok}/{total} traduits · {failing.length} manquants</div>
        </div>
        <div className="h-2 mt-2 rounded-full bg-border overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: pct >= 90 ? "hsl(var(--success))" : pct >= 70 ? "hsl(var(--warning))" : "hsl(var(--destructive))" }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {failing.length === 0 && (
          <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-bold">
            ✅ Toutes les chaînes ont une traduction arabe complète.
          </div>
        )}
        {failing.map((r, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-card border border-destructive/40">
            <div className="text-[10px] text-destructive font-bold uppercase">{r.unitId} · {r.label}</div>
            <div className="text-foreground text-sm">🇫🇷 {r.fr}</div>
            <div dir="rtl" className="text-muted-foreground text-xs">🇸🇦 {r.ar} <span className="text-destructive">⚠️ partiel</span></div>
          </div>
        ))}
        <details className="mt-3">
          <summary className="text-xs text-muted-foreground cursor-pointer">Voir les {ok} traductions OK</summary>
          <div className="flex flex-col gap-1 mt-2">
            {report.filter(r => r.ok).map((r, i) => (
              <div key={i} className="p-2 rounded-lg bg-card border border-border text-[11px]">
                <span className="text-muted-foreground">{r.fr}</span>
                <span className="mx-2">→</span>
                <span dir="rtl" className="text-emerald-400">{r.ar}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

/* ============ 3. Export PDF bilingue (via print HTML) ============ */
export function exportLessonBilingualHtml(lesson: EnrichedLesson | Lesson, unitTitle: string): void {
  const arTitle = translateFrToAr(lesson.title);
  const arUnit = translateFrToAr(unitTitle);
  const lines = lesson.content.split("\n");
  const vocab = lesson.vocab;
  const exos = lesson.exercises || [];

  const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

  const renderLine = (l: string) => {
    if (!l.trim()) return "<br/>";
    const ar = translateFrToAr(l.replace(/^[•⚠️]\s*/, "").replace(/\*\*/g, ""));
    if (l.startsWith("**") && l.endsWith("**")) {
      const clean = l.replace(/\*\*/g, "");
      return `<h3>${escapeHtml(clean)}</h3><div class="ar" dir="rtl">🇸🇦 ${escapeHtml(ar)}</div>`;
    }
    if (l.startsWith("⚠️")) {
      return `<div class="warn">${escapeHtml(l)}<div class="ar" dir="rtl">🇸🇦 ⚠️ ${escapeHtml(ar)}</div></div>`;
    }
    return `<p>${escapeHtml(l.replace(/\*\*/g, ""))}</p><div class="ar" dir="rtl">🇸🇦 ${escapeHtml(ar)}</div>`;
  };

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(lesson.title)} — Bilingue FR/AR</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Inter:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #1a1a1a; max-width: 780px; margin: 24px auto; padding: 0 24px; line-height: 1.55; }
  .ar { font-family: 'Noto Naskh Arabic', 'Amiri', serif; color: #047857; font-size: 14px; margin: 2px 0 10px; }
  header { border-bottom: 3px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { margin: 0; font-size: 26px; }
  h2 { color: #3b82f6; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 28px; }
  h3 { color: #1e40af; margin: 18px 0 4px; font-size: 16px; }
  .sub { color: #555; font-size: 14px; }
  .warn { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 12px; margin: 10px 0; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; }
  td.ar { text-align: right; font-family: 'Noto Naskh Arabic', serif; color: #047857; }
  .exo { padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
  .badge { display: inline-block; background: #3b82f6; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-right: 6px; text-transform: uppercase; }
  @media print { body { margin: 0; padding: 12mm; } button { display: none; } }
  .no-print { text-align: center; margin: 16px 0; }
  button { background: #3b82f6; color: white; border: 0; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; }
</style>
</head>
<body>
  <div class="no-print"><button onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button></div>
  <header>
    <h1>${escapeHtml(lesson.title)}</h1>
    <div class="ar" dir="rtl">🇸🇦 ${escapeHtml(arTitle)}</div>
    <div class="sub">${escapeHtml(unitTitle)}</div>
    <div class="ar" dir="rtl">🇸🇦 ${escapeHtml(arUnit)}</div>
  </header>

  <h2>1. Cours <span class="ar" dir="rtl" style="font-size:14px">— الدرس</span></h2>
  ${lines.map(renderLine).join("")}

  <h2>2. Vocabulaire (${vocab.length}) <span class="ar" dir="rtl" style="font-size:14px">— المفردات</span></h2>
  <table>
    <thead><tr><th>🇩🇪 Allemand</th><th>🇫🇷 Français</th><th dir="rtl">🇸🇦 العربية</th><th>Exemple</th></tr></thead>
    <tbody>
      ${vocab.map(v => `<tr>
        <td><strong>${escapeHtml(v.de)}</strong></td>
        <td>${escapeHtml(v.fr)}</td>
        <td class="ar" dir="rtl">${escapeHtml(translateFrToAr(v.fr))}</td>
        <td><em>${escapeHtml(v.ex || "—")}</em>${v.ex ? `<div class="ar" dir="rtl">${escapeHtml(translateFrToAr(v.ex))}</div>` : ""}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <h2>3. Exercices (${exos.length}) <span class="ar" dir="rtl" style="font-size:14px">— التمارين</span></h2>
  ${exos.map((ex, i) => {
    const arQ = translateFrToAr(ex.q);
    let body = "";
    if (ex.type === "qcm" && ex.opts) {
      body = "<ul>" + ex.opts.map((o, j) => `<li>${String.fromCharCode(65 + j)}. ${escapeHtml(o)} <span class="ar" dir="rtl">— ${escapeHtml(translateFrToAr(o))}</span></li>`).join("") + "</ul>";
    }
    const ans = ex.type === "qcm" && ex.opts ? (ex.opts[ex.ans as number] ?? "") : String(ex.ans ?? "");
    return `<div class="exo">
      <div><span class="badge">${ex.type}</span><strong>${i + 1}.</strong> ${escapeHtml(ex.q)}</div>
      <div class="ar" dir="rtl">🇸🇦 ${escapeHtml(arQ)}</div>
      ${body}
      <div style="font-size:12px;color:#059669;margin-top:4px">✓ ${escapeHtml(ans)} <span class="ar" dir="rtl">— ${escapeHtml(translateFrToAr(ans))}</span></div>
    </div>`;
  }).join("")}

  <footer style="margin-top:32px;padding-top:12px;border-top:1px solid #ddd;font-size:11px;color:#888;text-align:center">
    DeutschMeister — Export bilingue FR / AR · ${new Date().toLocaleDateString("fr-FR")}
  </footer>
  <script>setTimeout(() => window.print(), 600);</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) { alert("Veuillez autoriser les pop-ups pour exporter le PDF bilingue."); return; }
  w.document.write(html);
  w.document.close();
}
