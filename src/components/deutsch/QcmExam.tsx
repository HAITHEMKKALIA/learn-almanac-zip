import { useMemo, useState } from "react";
import { type VocabItem } from "@/data/curriculum";
import { getActiveUnits } from "@/data/activeUnits";
import { SpeakBtn } from "./SpeakBtn";
import { FlashcardDeck } from "./FlashcardDeck";
import { useI18n, translateFrToAr } from "@/lib/i18n";

function ArInline({ fr, force, className = "" }: { fr?: string; force?: string; className?: string }) {
  const { showAr, deOnly } = useI18n();
  if (deOnly || !showAr) return null;
  const ar = force ?? (fr ? translateFrToAr(fr) : "");
  if (!ar) return null;
  return <div dir="rtl" className={`text-emerald-400 text-[10px] mt-0.5 ${className}`}>🇸🇦 {ar}</div>;
}

interface QcmExamProps {
  onBack: () => void;
}

type QType = "fr_de" | "de_fr" | "translate";

interface ExamQ {
  type: QType;
  prompt: string;        // texte de la question (fr ou de)
  correct: string;       // bonne réponse
  options: string[];     // 4 choix mélangés (uniquement pour QCM)
  source: VocabItem;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[?.!,;:'"()-]/g, "").replace(/\s+/g, " ");
}

function buildExam(): ExamQ[] {
  // Pool global : tout le vocabulaire de toutes les unités
  const allVocab: VocabItem[] = getActiveUnits().flatMap(u => u.lessons.flatMap(l => l.vocab));
  // Dédup par .de
  const seen = new Set<string>();
  const unique = allVocab.filter(v => {
    const k = v.de.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const pool = shuffle(unique);
  const N = 30;
  const picks = pool.slice(0, N);

  const allDe = unique.map(v => v.de);
  const allFr = unique.map(v => v.fr);

  return picks.map((v, i): ExamQ => {
    const t: QType = i % 3 === 0 ? "fr_de" : i % 3 === 1 ? "de_fr" : "translate";
    if (t === "fr_de") {
      const distractors = shuffle(allDe.filter(x => x.toLowerCase() !== v.de.toLowerCase())).slice(0, 3);
      return {
        type: t,
        prompt: v.fr,
        correct: v.de,
        options: shuffle([v.de, ...distractors]),
        source: v,
      };
    }
    if (t === "de_fr") {
      const distractors = shuffle(allFr.filter(x => x.toLowerCase() !== v.fr.toLowerCase())).slice(0, 3);
      return {
        type: t,
        prompt: v.de,
        correct: v.fr,
        options: shuffle([v.fr, ...distractors]),
        source: v,
      };
    }
    // translate (input libre, FR → DE)
    return {
      type: t,
      prompt: v.fr,
      correct: v.de,
      options: [],
      source: v,
    };
  });
}

export function QcmExam({ onBack }: QcmExamProps) {
  const [exam, setExam] = useState<ExamQ[]>(() => buildExam());
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<{ q: ExamQ; correct: boolean; given: string }[]>([]);
  const [done, setDone] = useState(false);

  const q = exam[idx];

  const isCorrect = useMemo(() => {
    if (!q) return false;
    if (q.type === "translate") return normalize(typed) === normalize(q.correct);
    return selected === q.correct;
  }, [q, typed, selected]);

  const check = () => {
    setChecked(true);
    setResults(r => [...r, { q, correct: isCorrect, given: q.type === "translate" ? typed : selected ?? "" }]);
  };

  const next = () => {
    if (idx + 1 >= exam.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setSelected(null);
    setTyped("");
    setChecked(false);
  };

  const restart = () => {
    setExam(buildExam());
    setIdx(0);
    setSelected(null);
    setTyped("");
    setChecked(false);
    setResults([]);
    setDone(false);
  };

  // === Re-study state (FlashcardDeck for selected wrong vocab) ===
  const [reviewVocab, setReviewVocab] = useState<VocabItem[] | null>(null);

  if (reviewVocab) {
    return (
      <FlashcardDeck
        vocab={reviewVocab}
        onClose={() => setReviewVocab(null)}
      />
    );
  }

  if (done) {
    const score = results.filter(r => r.correct).length;
    const pct = Math.round((score / exam.length) * 100);
    const grade = pct >= 90 ? "🏆 Excellent" : pct >= 75 ? "🥇 Très bien" : pct >= 60 ? "👍 Bien" : pct >= 40 ? "📚 À retravailler" : "🔁 À refaire";
    const wrongVocab = results.filter(r => !r.correct).map(r => r.q.source);

    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-[15px]">📋 Résultats QCM Examen</h3>
            <ArInline force="📋 نتائج الامتحان" />
          </div>
        </div>
        <div className="p-5 text-center">
          <div className="text-6xl mb-3">{grade.split(" ")[0]}</div>
          <div className="text-foreground text-3xl font-extrabold">{pct}%</div>
          <div className="text-muted-foreground text-sm mb-1">{score} / {exam.length} bonnes réponses</div>
          <ArInline force={`${score} / ${exam.length} إجابات صحيحة`} />
          <div className="text-foreground font-semibold">{grade}</div>

          <div className="flex gap-2 mt-5 justify-center flex-wrap">
            <button onClick={restart} className="px-5 py-2.5 rounded-xl border-none bg-primary text-primary-foreground font-bold text-sm cursor-pointer">
              🔄 Recommencer
              <div dir="rtl" className="text-[10px] font-normal opacity-90">🇸🇦 إعادة</div>
            </button>
            {wrongVocab.length > 0 && (
              <button
                onClick={() => setReviewVocab(wrongVocab)}
                className="px-5 py-2.5 rounded-xl border-2 border-warning bg-warning/10 text-warning font-bold text-sm cursor-pointer"
              >
                📖 Réviser ces mots ({wrongVocab.length})
                <div dir="rtl" className="text-[10px] font-normal opacity-90">🇸🇦 راجع هذه الكلمات</div>
              </button>
            )}
            <button onClick={onBack} className="px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm cursor-pointer">
              ← Retour
              <div dir="rtl" className="text-[10px] font-normal opacity-90">🇸🇦 عودة</div>
            </button>
          </div>
        </div>
        <div className="px-4 pb-6">
          <h4 className="text-foreground font-bold text-sm mb-2">Détail des réponses</h4>
          <ArInline force="تفاصيل الإجابات" className="mb-2" />
          <div className="flex flex-col gap-1.5">
            {results.map((r, i) => (
              <div key={i} className={`p-3 rounded-lg border text-xs ${r.correct ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
                <div className="flex gap-2">
                  <span className="text-base">{r.correct ? "✅" : "❌"}</span>
                  <div className="flex-1">
                    <div className="text-foreground font-semibold">
                      Q{i + 1} <span className="text-muted-foreground font-normal">({typeLabel(r.q.type)})</span> : {r.q.prompt}
                    </div>
                    <ArInline fr={r.q.prompt} />
                    <div className="mt-1 grid grid-cols-2 gap-1.5">
                      <div className={`px-2 py-1 rounded ${r.correct ? "bg-success/15" : "bg-destructive/15"}`}>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Votre réponse</div>
                        <div className={`text-foreground ${r.correct ? "" : "line-through opacity-70"}`}>{r.given || "—"}</div>
                      </div>
                      <div className="px-2 py-1 rounded bg-success/15">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Bonne réponse</div>
                        <div className="text-foreground font-semibold flex items-center gap-1">
                          {r.q.correct} <SpeakBtn text={r.q.correct} size={12} />
                        </div>
                      </div>
                    </div>
                    {!r.correct && (
                      <button
                        onClick={() => setReviewVocab([r.q.source])}
                        className="mt-1.5 text-[11px] text-primary underline cursor-pointer bg-transparent border-none p-0"
                      >
                        🔁 Re-étudier ce mot
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-[15px]">📝 QCM Examen</h3>
          <ArInline force="📝 امتحان الاختيار من متعدد" />
          <div className="text-muted-foreground text-[11px]">{exam.length} questions · FR↔DE · correction immédiate</div>
          <ArInline force={`${exam.length} سؤال · فرنسي↔ألماني · تصحيح فوري`} />
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between mb-2.5">
          <span className="text-muted-foreground text-sm">Q {idx + 1}/{exam.length}</span>
          <span className="text-primary text-sm font-semibold">Score : {results.filter(r => r.correct).length}<span dir="rtl" className="ms-1 text-emerald-400 text-xs">· النتيجة</span></span>
        </div>
        <div className="bg-card rounded-md p-0.5 mb-3.5">
          <div className="bg-primary h-1 rounded transition-all" style={{ width: `${((idx + 1) / exam.length) * 100}%` }} />
        </div>

        <div className="bg-card rounded-2xl p-4 mb-3 border border-border">
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold text-primary-foreground bg-primary">
            {typeLabel(q.type)}
          </span>
          <ArInline force={typeLabelAr(q.type)} />
          <div className="flex items-center gap-2 mt-2.5">
            <div className="text-base font-semibold text-foreground flex-1 leading-relaxed">
              {q.type === "de_fr" ? `Que signifie "${q.prompt}" ?` :
                q.type === "fr_de" ? `Comment dit-on "${q.prompt}" en allemand ?` :
                  `Traduisez en allemand : "${q.prompt}"`}
            </div>
            {q.type !== "fr_de" && <SpeakBtn text={q.type === "de_fr" ? q.prompt : q.correct} size={18} />}
          </div>
          <ArInline force={
            q.type === "de_fr" ? `ما معنى "${q.prompt}" ؟` :
            q.type === "fr_de" ? `كيف نقول "${q.prompt}" بالألمانية ؟` :
            `ترجم إلى الألمانية: "${q.prompt}"`
          } className="mt-1" />
          {q.type === "de_fr" && (
            <ArInline fr={q.prompt} className="mt-1" />
          )}
        </div>

        {q.type === "translate" ? (
          <input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !checked && check()}
            disabled={checked}
            placeholder="Tapez votre traduction allemande... · اكتب الترجمة بالألمانية..."
            className={`w-full p-3 rounded-xl text-[15px] outline-none border-2 bg-card text-foreground ${
              checked ? (isCorrect ? "border-success" : "border-destructive") : "border-border"
            }`}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {q.options.map((o, i) => {
              let cls = "bg-card border-border";
              if (checked) {
                if (o === q.correct) cls = "bg-success/15 border-success";
                else if (o === selected) cls = "bg-destructive/15 border-destructive";
              } else if (o === selected) cls = "bg-card-hover border-primary";
              return (
                <button
                  key={i}
                  onClick={() => !checked && setSelected(o)}
                  className={`p-3 rounded-xl border-2 text-foreground text-left text-sm cursor-pointer ${cls}`}
                >
                  <span className="font-semibold mr-2 text-text-dim">{String.fromCharCode(65 + i)}.</span>{o}
                  {q.type === "de_fr" && <ArInline fr={o} />}
                </button>
              );
            })}
          </div>
        )}

        {checked && (
          <div className={`mt-3 p-3.5 rounded-xl border ${isCorrect ? "bg-success/10 border-success" : "bg-destructive/10 border-destructive"}`}>
            <div className={`font-bold mb-1 ${isCorrect ? "text-success" : "text-destructive"}`}>
              {isCorrect ? "✓ Richtig !" : "✗ Falsch"}
              <span dir="rtl" className="ms-2 text-emerald-400 text-xs font-normal">
                🇸🇦 {isCorrect ? "إجابة صحيحة" : "إجابة خاطئة"}
              </span>
            </div>
            {!isCorrect && (
              <div className="text-foreground text-sm flex items-center gap-1">
                Bonne réponse : <strong>{q.correct}</strong> <SpeakBtn text={q.correct} size={14} />
                <span dir="rtl" className="ms-1 text-emerald-400 text-xs">· الإجابة الصحيحة</span>
              </div>
            )}
            {q.source.ex && (
              <>
                <div className="text-xs text-muted-foreground italic mt-1">Ex : "{q.source.ex}"</div>
                <ArInline fr={q.source.ex} />
              </>
            )}
          </div>
        )}

        <div className="mt-4">
          {!checked ? (
            <button
              onClick={check}
              disabled={q.type === "translate" ? !typed.trim() : !selected}
              className={`w-full p-3.5 rounded-xl border-none bg-primary text-primary-foreground font-bold text-[15px] cursor-pointer ${
                (q.type === "translate" ? !typed.trim() : !selected) ? "opacity-50" : ""
              }`}
            >
              Vérifier
              <div dir="rtl" className="text-[11px] font-normal opacity-90 mt-0.5">🇸🇦 تحقّق</div>
            </button>
          ) : (
            <button
              onClick={next}
              className="w-full p-3.5 rounded-xl border-none bg-success text-success-foreground font-bold text-[15px] cursor-pointer"
            >
              {idx + 1 >= exam.length ? "Voir le score" : "Suivant →"}
              <div dir="rtl" className="text-[11px] font-normal opacity-90 mt-0.5">
                🇸🇦 {idx + 1 >= exam.length ? "عرض النتيجة" : "التالي ←"}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function typeLabel(t: QType): string {
  if (t === "fr_de") return "FR → DE";
  if (t === "de_fr") return "DE → FR";
  return "Traduire";
}

function typeLabelAr(t: QType): string {
  if (t === "fr_de") return "فرنسي ← ألماني";
  if (t === "de_fr") return "ألماني ← فرنسي";
  return "ترجمة";
}
