import { useEffect, useMemo, useState } from "react";
import { ExamQuestion, QType, loadBank, saveBank, resetBank, newBlankQuestion, getAutoPlay, setAutoPlay } from "@/lib/finalExamBank";
import { useI18n, translateFrToAr } from "@/lib/i18n";
import { SpeakBtn } from "./SpeakBtn";

function ArInline({ fr, force, className = "" }: { fr?: string; force?: string; className?: string }) {
  const { showAr, deOnly } = useI18n();
  if (deOnly || !showAr) return null;
  const ar = force ?? (fr ? translateFrToAr(fr) : "");
  if (!ar) return null;
  return <div dir="rtl" className={`text-emerald-400 text-[11px] mt-0.5 ${className}`}>🇸🇦 {ar}</div>;
}

function Field({ label, value, onChange, dir, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; dir?: "rtl" | "ltr"; placeholder?: string; multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-foreground">{label}</span>
      {multiline ? (
        <textarea dir={dir} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="p-2 rounded-lg bg-card border border-border text-foreground text-sm min-h-[64px]" />
      ) : (
        <input dir={dir} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="p-2 rounded-lg bg-card border border-border text-foreground text-sm" />
      )}
    </label>
  );
}

interface Props { onBack: () => void; }

export function FinalExamBank({ onBack }: Props) {
  const [list, setList] = useState<ExamQuestion[]>(() => loadBank());
  const [editing, setEditing] = useState<ExamQuestion | null>(null);
  const [filter, setFilter] = useState<"all" | QType>("all");
  const [auto, setAuto] = useState<boolean>(() => getAutoPlay());

  useEffect(() => { saveBank(list); }, [list]);
  useEffect(() => { setAutoPlay(auto); }, [auto]);

  const filtered = useMemo(
    () => filter === "all" ? list : list.filter(q => q.type === filter),
    [list, filter]
  );

  const counts = useMemo(() => ({
    all: list.length,
    qcm: list.filter(q => q.type === "qcm").length,
    audio: list.filter(q => q.type === "audio").length,
    translate: list.filter(q => q.type === "translate").length,
  }), [list]);

  const save = (q: ExamQuestion) => {
    setList(prev => {
      const i = prev.findIndex(x => x.id === q.id);
      if (i === -1) return [q, ...prev];
      const copy = [...prev]; copy[i] = q; return copy;
    });
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    setList(prev => prev.filter(q => q.id !== id));
  };

  const onReset = () => {
    if (!confirm("Réinitialiser la banque par défaut ? Vos modifications seront perdues.")) return;
    setList(resetBank());
  };

  if (editing) return <Editor q={editing} onSave={save} onCancel={() => setEditing(null)} />;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-base">📚 Banque de questions — Examen Final</h3>
          <ArInline force="📚 بنك الأسئلة — الامتحان النهائي" />
        </div>
        <span className="text-[10px] text-muted-foreground">{list.length}</span>
      </div>

      <div className="p-3 border-b border-border bg-card flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          <span className="font-bold">🔊 Lecture automatique des questions audio</span>
        </label>
        <ArInline force="🔊 تشغيل تلقائي لأسئلة الاستماع" />
        <div className="flex flex-wrap gap-1.5 mt-1">
          {(["all","qcm","audio","translate"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${filter === t ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"}`}>
              {t === "all" ? "Tous" : t === "qcm" ? "✅ QCM" : t === "audio" ? "🔊 Audio" : "✍️ Trad."} ({counts[t]})
            </button>
          ))}
          <button onClick={() => setEditing(newBlankQuestion("qcm"))}
            className="ml-auto px-3 py-1 rounded-full text-[11px] font-bold bg-primary text-primary-foreground border-none cursor-pointer">
            ＋ Ajouter
          </button>
          <button onClick={onReset}
            className="px-3 py-1 rounded-full text-[11px] font-bold bg-background text-foreground border border-border cursor-pointer">
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filtered.map(q => (
          <div key={q.id} className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">{q.module || "—"}</span>
              <span className="px-2 py-0.5 rounded-full bg-background border border-border text-foreground text-[10px] font-bold uppercase">
                {q.type === "qcm" ? "✅ QCM" : q.type === "audio" ? "🔊 Audio" : "✍️ Traduction"}
              </span>
              <div className="ml-auto flex gap-1">
                <button onClick={() => setEditing(q)} className="px-2 py-1 rounded-lg bg-background border border-border text-foreground text-[11px] cursor-pointer">✏️</button>
                <button onClick={() => remove(q.id)} className="px-2 py-1 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[11px] cursor-pointer">🗑️</button>
              </div>
            </div>
            <div className="text-foreground text-sm font-medium">{q.question}</div>
            <ArInline force={q.question_ar} fr={q.question} />
            {q.type === "audio" && q.audio && (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                🎧 <b className="text-foreground">{q.audio}</b>
                <SpeakBtn text={q.audio} size={14} />
              </div>
            )}
            <div className="mt-1 text-[11px] text-success">✅ {q.answer}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground text-sm p-6">Aucune question. Cliquez « ＋ Ajouter ».</div>
        )}
      </div>
    </div>
  );
}

function Editor({ q, onSave, onCancel }: { q: ExamQuestion; onSave: (q: ExamQuestion) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<ExamQuestion>(q);

  const set = <K extends keyof ExamQuestion>(k: K, v: ExamQuestion[K]) => setDraft(d => ({ ...d, [k]: v }));

  const setOpt = (i: number, v: string, ar = false) => {
    const key = ar ? "options_ar" : "options";
    const arr = [...((draft[key] as string[] | undefined) || ["", "", "", ""])];
    arr[i] = v;
    setDraft(d => ({ ...d, [key]: arr }));
  };

  const changeType = (t: QType) => {
    setDraft(d => ({
      ...d,
      type: t,
      audio: t === "audio" ? (d.audio ?? "") : undefined,
      options: t === "translate" ? undefined : (d.options ?? ["", "", "", ""]),
      options_ar: t === "translate" ? undefined : (d.options_ar ?? ["", "", "", ""]),
    }));
  };

  const valid = draft.module.trim() && draft.question.trim() && draft.answer.trim()
    && (draft.type === "translate" || (draft.options && draft.options.every(o => o.trim())))
    && (draft.type !== "audio" || (draft.audio && draft.audio.trim()));

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onCancel} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-base">✏️ Question</h3>
          <ArInline force="✏️ سؤال" />
        </div>
        <button disabled={!valid} onClick={() => onSave(draft)}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold border-none cursor-pointer disabled:opacity-40">
          💾 Enregistrer
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <div className="flex gap-1.5">
          {(["qcm","audio","translate"] as const).map(t => (
            <button key={t} onClick={() => changeType(t)}
              className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold border ${draft.type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
              {t === "qcm" ? "✅ QCM" : t === "audio" ? "🔊 Audio" : "✍️ Trad."}
            </button>
          ))}
        </div>

        <Field label="Module (FR)" value={draft.module} onChange={v => set("module", v)} placeholder="Ex: Verbe SEIN" />
        <Field label="Module (AR)" value={draft.module_ar || ""} onChange={v => set("module_ar", v)} dir="rtl" placeholder="مثال: الفعل sein" />

        <Field label="Question (FR)" value={draft.question} onChange={v => set("question", v)} multiline placeholder="Question en français" />
        <Field label="Question (AR)" value={draft.question_ar || ""} onChange={v => set("question_ar", v)} dir="rtl" multiline placeholder="السؤال بالعربية" />

        {draft.type === "audio" && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Audio (texte allemand)" value={draft.audio || ""} onChange={v => set("audio", v)} placeholder="Ex: siebenundvierzig" />
            </div>
            {draft.audio && <SpeakBtn text={draft.audio} size={18} />}
          </div>
        )}

        {(draft.type === "qcm" || draft.type === "audio") && (
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-foreground">Options (4)</div>
            {[0,1,2,3].map(i => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <input value={draft.options?.[i] || ""} onChange={e => setOpt(i, e.target.value)}
                  placeholder={`Option ${i+1} (FR/DE)`}
                  className="p-2 rounded-lg bg-card border border-border text-foreground text-sm" />
                <input dir="rtl" value={draft.options_ar?.[i] || ""} onChange={e => setOpt(i, e.target.value, true)}
                  placeholder={`خيار ${i+1} (AR)`}
                  className="p-2 rounded-lg bg-card border border-border text-foreground text-sm" />
              </div>
            ))}
          </div>
        )}

        <Field label={draft.type === "translate" ? "Réponse correcte (allemand, minuscule)" : "Réponse correcte (doit matcher une option)"}
          value={draft.answer} onChange={v => set("answer", v)} placeholder="Réponse exacte" />

        <Field label="Explication (FR)" value={draft.explain} onChange={v => set("explain", v)} multiline placeholder="Explication en français" />
        <Field label="Explication (AR)" value={draft.explain_ar || ""} onChange={v => set("explain_ar", v)} dir="rtl" multiline placeholder="الشرح بالعربية" />
      </div>
    </div>
  );
}
