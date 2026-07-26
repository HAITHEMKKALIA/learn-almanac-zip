import { useState, useMemo, useEffect, useRef } from "react";
import { SpeakBtn } from "./SpeakBtn";
import { useI18n, translateFrToAr } from "@/lib/i18n";
import { loadBank, getAutoPlay, type ExamQuestion } from "@/lib/finalExamBank";
import { speak } from "@/lib/voice";

function ArInline({ fr, force, className = "" }: { fr?: string; force?: string; className?: string }) {
  const { showAr, deOnly } = useI18n();
  if (deOnly || !showAr) return null;
  const ar = force ?? (fr ? translateFrToAr(fr) : "");
  if (!ar) return null;
  return <div dir="rtl" className={`text-emerald-400 text-[10px] mt-0.5 ${className}`}>🇸🇦 {ar}</div>;
}

interface Props {
  onBack: () => void;
}

type Question = ExamQuestion;

interface Answer {
  q: Question;
  given: string;
  correct: boolean;
}

export function FinalExam({ onBack }: Props) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [done, setDone] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const autoPlay = useRef(getAutoPlay()).current;

  // Shuffle 15 questions from the persisted bank
  const exam = useMemo(() => {
    const bank = loadBank();
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const current = exam[idx];
  const score = answers.filter(a => a.correct).length;
  const pct = Math.round((score / exam.length) * 100);

  // Auto-play audio questions when they appear (if enabled)
  useEffect(() => {
    if (!started || done || checked) return;
    if (!autoPlay) return;
    if (current?.type === "audio" && current.audio) {
      const t = setTimeout(() => { speak(current.audio!, "de-DE").catch(() => {}); }, 350);
      return () => clearTimeout(t);
    }
  }, [started, done, checked, idx, current, autoPlay]);

  const norm = (s: string) =>
    s.toLowerCase().trim().replace(/[?.!,;:'"]/g, "").replace(/ß/g, "ss").replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/\s+/g, " ");

  const check = () => {
    const given = current.type === "translate" ? text : selected;
    if (!given) return;
    const isCorrect =
      current.type === "translate"
        ? norm(given) === norm(current.answer) || norm(current.answer).includes(norm(given)) && norm(given).length > 5
        : given === current.answer;
    setAnswers([...answers, { q: current, given, correct: isCorrect }]);
    setChecked(true);
  };

  const next = () => {
    if (idx + 1 >= exam.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setSelected("");
      setText("");
      setChecked(false);
    }
  };

  const restart = () => {
    setStarted(false);
    setIdx(0);
    setSelected("");
    setText("");
    setChecked(false);
    setAnswers([]);
    setDone(false);
    setShowCert(false);
  };

  // ===== INTRO =====
  if (!started) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">🎓 Examen Final A1</h3>
            <ArInline force="🎓 الامتحان النهائي A1" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center">
          <div className="text-7xl mb-4">🏆</div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2 text-center">Prêt pour l'examen ?</h2>
          <ArInline force="هل أنت مستعد للامتحان؟" className="text-center text-sm mb-2" />
          <p className="text-muted-foreground text-sm text-center mb-1 max-w-xs">
            15 questions tirées des 23 modules. Mélange QCM, écoute audio et traduction.
          </p>
          <ArInline force="15 سؤال من أصل 23 وحدة. مزيج من الاختيار من متعدد، والاستماع، والترجمة." className="text-center mb-5 max-w-xs" />
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-4 mb-5">
            <h4 className="text-foreground font-bold text-sm mb-1">📋 Format de l'examen :</h4>
            <ArInline force="📋 صيغة الامتحان:" className="mb-2" />
            <div className="flex flex-col gap-2 text-xs">
              <div><div className="flex items-center gap-2"><span className="text-lg">✅</span> <span className="text-muted-foreground"><b className="text-foreground">QCM</b> — choisissez la bonne réponse</span></div><ArInline force="اختيار من متعدد — اختر الإجابة الصحيحة" /></div>
              <div><div className="flex items-center gap-2"><span className="text-lg">🔊</span> <span className="text-muted-foreground"><b className="text-foreground">Audio</b> — écoutez et identifiez</span></div><ArInline force="استماع — اسمع وحدّد" /></div>
              <div><div className="flex items-center gap-2"><span className="text-lg">✍️</span> <span className="text-muted-foreground"><b className="text-foreground">Traduction</b> — écrivez en allemand</span></div><ArInline force="ترجمة — اكتب بالألمانية" /></div>
            </div>
            <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
              🎯 <b className="text-foreground">Note de réussite : 70%</b> pour obtenir le certificat A1.
              <ArInline force="🎯 درجة النجاح: 70٪ للحصول على شهادة A1." />
            </div>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="w-full max-w-sm p-4 rounded-2xl border-none cursor-pointer bg-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
          >
            🚀 Commencer l'examen
            <ArInline force="🚀 ابدأ الامتحان" className="text-center" />
          </button>
        </div>
      </div>
    );
  }

  // ===== CERTIFICAT =====
  if (showCert) {
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => setShowCert(false)} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <h3 className="text-foreground m-0 text-base">🏆 Certificat de réussite</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <div className="w-full max-w-md bg-card border-4 border-primary rounded-3xl p-6 shadow-2xl text-center">
            <div className="flex justify-between items-start mb-2">
              <span className="text-4xl">🇩🇪</span>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Niveau</div>
                <div className="text-primary font-extrabold text-xl">A1</div>
              </div>
            </div>
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-foreground text-2xl font-extrabold mb-1">CERTIFICAT</h1>
            <h2 className="text-primary text-base font-bold mb-4 uppercase tracking-wider">DE RÉUSSITE</h2>
            <div className="border-t-2 border-b-2 border-primary/30 py-4 my-4">
              <div className="text-muted-foreground text-xs mb-1">Décerné à</div>
              <div className="text-foreground text-xl font-extrabold mb-3">— Élève de DeutschMeister —</div>
              <div className="text-muted-foreground text-xs mb-1">pour avoir validé l'examen</div>
              <div className="text-foreground text-sm font-bold">Allemand A1 Débutant</div>
              <div className="text-muted-foreground text-xs mt-1">avec un score de</div>
              <div className="text-primary text-3xl font-extrabold mt-1">{pct}%</div>
              <div className="text-muted-foreground text-xs">({score}/{exam.length} réponses correctes)</div>
            </div>
            <div className="text-muted-foreground text-[11px] mb-4">
              23 modules validés · Vocabulaire, grammaire, prononciation, scénarios
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <div>
                <div>Délivré le</div>
                <div className="text-foreground font-bold">{today}</div>
              </div>
              <div>
                <div>Signature</div>
                <div className="text-primary font-bold italic text-sm">Herr Professor 🎓</div>
              </div>
            </div>
            <div className="mt-4 text-[10px] text-muted-foreground italic">
              DeutschMeister · App d'apprentissage de l'allemand
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-border">
          <button
            onClick={restart}
            className="w-full p-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            🔄 Refaire l'examen
          </button>
        </div>
      </div>
    );
  }

  // ===== RÉSULTATS =====
  if (done) {
    const passed = pct >= 70;
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">📊 Résultats de l'examen</h3>
            <ArInline force="📊 نتائج الامتحان" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {/* Score header */}
          <div className={`p-5 rounded-2xl text-center mb-4 ${passed ? "bg-success/10 border-2 border-success" : "bg-destructive/10 border-2 border-destructive"}`}>
            <div className="text-6xl mb-2">{passed ? "🏆" : "💪"}</div>
            <div className={`text-5xl font-extrabold mb-1 ${passed ? "text-success" : "text-destructive"}`}>{pct}%</div>
            <div className="text-foreground text-base font-bold">{score} / {exam.length} bonnes réponses</div>
            <ArInline force={`${score} / ${exam.length} إجابات صحيحة`} className="text-center" />
            <div className="text-muted-foreground text-xs mt-1">
              {passed ? "✅ Examen réussi !" : "❌ Pas encore... Continuez à pratiquer !"}
            </div>
            <ArInline force={passed ? "✅ نجحت في الامتحان!" : "❌ ليس بعد... واصل التدرّب!"} className="text-center" />
            {passed && (
              <button
                onClick={() => setShowCert(true)}
                className="mt-3 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity"
              >
                🎓 Voir mon certificat
                <ArInline force="🎓 عرض شهادتي" className="text-center" />
              </button>
            )}
          </div>

          {/* Détail des réponses */}
          <h4 className="text-foreground font-bold text-sm mb-1">📝 Corrections détaillées :</h4>
          <ArInline force="📝 تصحيحات مفصّلة:" className="mb-2" />
          <div className="flex flex-col gap-2">
            {answers.map((a, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${a.correct ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-lg">{a.correct ? "✅" : "❌"}</span>
                  <div className="flex-1">
                    <div className="text-[10px] text-primary font-bold uppercase mb-0.5">{a.q.module} · {a.q.type}</div>
                    <div className="text-foreground text-xs font-medium">{a.q.question}</div>
                    <ArInline fr={a.q.question} force={a.q.question_ar} />
                  </div>
                </div>
                <div className="ml-7 text-[11px] space-y-0.5">
                  <div className="text-muted-foreground">Votre réponse : <span className={a.correct ? "text-success font-bold" : "text-destructive font-bold"}>{a.given || "—"}</span></div>
                  {!a.correct && (
                    <>
                      <div className="text-muted-foreground">Bonne réponse : <span className="text-success font-bold">{a.q.answer}</span></div>
                      <ArInline force={`الإجابة الصحيحة: ${a.q.answer}`} />
                    </>
                  )}
                  <div className="text-foreground text-[11px] mt-1 italic bg-card p-2 rounded-lg border border-border">💡 {a.q.explain}<ArInline fr={a.q.explain} force={a.q.explain_ar} /></div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={restart}
            className="mt-4 w-full p-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            🔄 Refaire un nouvel examen
            <ArInline force="🔄 إعادة امتحان جديد" className="text-center" />
          </button>
        </div>
      </div>
    );
  }

  // ===== QUESTION =====
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-base">🎓 Examen Final</h3>
          <ArInline force="🎓 الامتحان النهائي" />
        </div>
        <span className="text-muted-foreground text-xs">{idx + 1}/{exam.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-card">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((idx + (checked ? 1 : 0)) / exam.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Module + type badge */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">{current.module}</span>
          <span className="px-2 py-0.5 rounded-full bg-card border border-border text-foreground text-[10px] font-bold uppercase">
            {current.type === "qcm" ? "✅ QCM" : current.type === "audio" ? "🔊 Audio" : "✍️ Traduction"}
          </span>
          <ArInline force={current.type === "qcm" ? "اختيار من متعدد" : current.type === "audio" ? "استماع" : "ترجمة"} className="basis-full" />
        </div>

        {/* Question */}
        <div className="p-4 bg-card border border-border rounded-2xl mb-4">
          <p className="text-foreground text-base font-medium leading-relaxed">{current.question}</p>
          <ArInline fr={current.question} force={current.question_ar} className="text-sm mt-2" />
          {current.type === "audio" && current.audio && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-primary/10 rounded-xl border border-primary/30">
              <div className="flex-1">
                <span className="text-foreground text-sm font-bold">🎧 Cliquez pour écouter</span>
                <ArInline force="🎧 اضغط للاستماع" />
              </div>
              <SpeakBtn text={current.audio} size={20} />
            </div>
          )}
        </div>

        {/* QCM / Audio options */}
        {(current.type === "qcm" || current.type === "audio") && current.options && (
          <div className="flex flex-col gap-2 mb-4">
            {current.options.map((opt, oi) => {
              const isPicked = selected === opt;
              const isCorrect = checked && opt === current.answer;
              const isWrong = checked && isPicked && opt !== current.answer;
              const optAr = current.options_ar?.[oi];
              return (
                <button
                  key={opt}
                  onClick={() => !checked && setSelected(opt)}
                  disabled={checked}
                  className={`p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all cursor-pointer ${
                    isCorrect
                      ? "border-success bg-success/10 text-success"
                      : isWrong
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : isPicked
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-foreground hover:bg-accent/50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>{opt}</span>
                    {isCorrect && <span>✅</span>}
                    {isWrong && <span>❌</span>}
                  </span>
                  <ArInline force={optAr} fr={opt} />
                </button>
              );
            })}
          </div>
        )}

        {/* Translate input */}
        {current.type === "translate" && (
          <div className="mb-4">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={checked}
              placeholder="Tapez votre réponse en allemand..."
              dir="ltr"
              onKeyDown={(e) => e.key === "Enter" && !checked && check()}
              className={`w-full p-3.5 rounded-xl border-2 bg-card text-foreground text-sm outline-none transition-colors ${
                checked
                  ? answers[answers.length - 1]?.correct
                    ? "border-success"
                    : "border-destructive"
                  : "border-border focus:border-primary"
              }`}
            />
            {checked && !answers[answers.length - 1]?.correct && (
              <div className="mt-2 p-3 rounded-xl bg-success/10 border border-success/30">
                <div className="text-[10px] text-success font-bold uppercase">Bonne réponse</div>
                <ArInline force="الإجابة الصحيحة" />
                <div className="text-foreground text-sm font-bold">{current.answer}</div>
              </div>
            )}
          </div>
        )}

        {/* Explication */}
        {checked && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="text-[10px] text-primary font-bold uppercase mb-1">💡 Explication</div>
            <ArInline force="💡 شرح" />
            <p className="text-foreground text-xs leading-relaxed">{current.explain}</p>
            <ArInline fr={current.explain} force={current.explain_ar} className="mt-1" />
          </div>
        )}
      </div>

      {/* Footer action */}
      <div className="p-3 border-t border-border bg-background">
        {!checked ? (
          <button
            onClick={check}
            disabled={current.type === "translate" ? !text.trim() : !selected}
            className="w-full p-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✅ Vérifier
            <ArInline force="✅ تحقّق" className="text-center" />
          </button>
        ) : (
          <button
            onClick={next}
            className="w-full p-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            {idx + 1 >= exam.length ? "🏁 Voir les résultats" : "Suivant →"}
            <ArInline force={idx + 1 >= exam.length ? "🏁 عرض النتائج" : "التالي ←"} className="text-center" />
          </button>
        )}
      </div>
    </div>
  );
}
