import { useEffect, useRef, useState } from "react";
import { speak } from "@/lib/voice";
import { SpeakBtn } from "./SpeakBtn";
import { SpeakExercise } from "./SpeakExercise";
import { AnalogClock } from "./AnalogClock";
import { normalizeDe } from "@/lib/pronunciation";
import {
  recordAnswer,
  setDifficulty as persistDifficulty,
  recordWeakTime,
} from "@/lib/lessonStats";
import { nextDifficulty } from "@/data/lessonEnrichment";
import { timeToColloquialDe, timeToOfficialDe } from "@/lib/timeGerman";
import type { Exercise } from "@/data/curriculum";
import { translateFrToAr, useI18n } from "@/lib/i18n";
import { recordExerciseRun } from "@/lib/lessonProgress";

// Mini helper local pour afficher la traduction AR sous un texte FR
function ArInline({ fr, className = "" }: { fr: string; className?: string }) {
  const { showAr, deOnly } = useI18n();
  if (deOnly || !showAr || !fr) return null;
  const ar = translateFrToAr(fr);
  if (!ar) return null;
  return <div dir="rtl" className={`text-emerald-400 text-xs mt-0.5 ${className}`}>🇸🇦 {ar}</div>;
}

// Détecte HH:MM dans une question pour afficher l'horloge analogique
function extractTime(q: string): { hour: number; minute: number } | null {
  const m = q.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

interface ExerciseEngineProps {
  exercises: Exercise[];
  onFinish: () => void;
  lessonId?: string;
  unitId?: string;
  /** Niveau de difficulté courant (pour ajustement adaptatif). */
  currentDifficulty?: 1 | 2 | 3;
}

const TIMER_LS_KEY = "dm_session_timer_seconds_v1";

export function ExerciseEngine({
  exercises,
  onFinish,
  lessonId,
  unitId,
  currentDifficulty = 2,
}: ExerciseEngineProps) {
  const { showFr, showAr, deOnly } = useI18n();
  const [ci, setCi] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [fa, setFa] = useState("");
  const [ta, setTa] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [res, setRes] = useState<{ q: string; c: boolean; a: string }[]>([]);

  // Format horaire (12h colloquial vs 24h officiel) — persistant
  const [clockFormat, setClockFormat] = useState<"12h" | "24h">(() => {
    return (localStorage.getItem("dm_clock_format") as "12h" | "24h") || "24h";
  });
  useEffect(() => {
    localStorage.setItem("dm_clock_format", clockFormat);
  }, [clockFormat]);

  // ⏱️ Minuteur de session par question (60s par défaut, configurable)
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false);
  const [timerSec, setTimerSec] = useState<number>(60);
  const [remaining, setRemaining] = useState<number>(60);
  const tickRef = useRef<number | null>(null);
  const checkedRef = useRef(checked);
  checkedRef.current = checked;

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(TIMER_LS_KEY) || "60", 10);
    if (!isNaN(saved) && saved > 0) setTimerSec(saved);
    setTimerEnabled(localStorage.getItem("dm_timer_enabled") === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem(TIMER_LS_KEY, String(timerSec));
    localStorage.setItem("dm_timer_enabled", timerEnabled ? "1" : "0");
  }, [timerSec, timerEnabled]);

  const ex = exercises[ci];
  const t = ex ? extractTime(ex.q) : null;

  // (Re)démarre le compte à rebours à chaque question
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!timerEnabled || done || !ex) return;
    setRemaining(timerSec);
    tickRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          // Si pas vérifié → marque comme faux automatiquement et passe
          if (!checkedRef.current) {
            handleTimeout();
          } else {
            // Déjà vérifié → passe au suivant
            doNext();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ci, timerEnabled, timerSec, done]);

  const answerWord = ex && ex.type === "qcm" && ex.opts ? ex.opts[ex.ans as number] : ex?.ans ? String(ex.ans) : undefined;

  const ok = () => {
    if (!ex) return false;
    if (ex.type === "qcm") return sel === ex.ans;
    if (ex.type === "fill") return normalizeDe(fa) === normalizeDe(String(ex.ans));
    if (ex.type === "translate") return normalizeDe(ta) === normalizeDe(String(ex.ans));
    return false;
  };

  const persistResult = (correct: boolean) => {
    if (lessonId && unitId) {
      recordAnswer(lessonId, unitId, "exercises", correct, answerWord);
      // Si question de temps ratée → ajoute aux heures faibles
      if (!correct && t && lessonId) {
        const hhmm = `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
        recordWeakTime(lessonId, unitId, hhmm);
      }
    }
  };

  const correctionPhrase = (): string | null => {
    if (!t) return null;
    return clockFormat === "12h" ? timeToColloquialDe(t) : timeToOfficialDe(t);
  };

  const check = () => {
    const c = ok();
    if (c) setScore(s => s + 1);
    setRes(r => [...r, { q: ex.q, c, a: ex.type === "qcm" ? ex.opts![ex.ans] : ex.ans }]);
    setChecked(true);
    persistResult(c);
    speak(ex.type === "qcm" ? ex.opts![ex.ans] : ex.ans);
  };

  const handleTimeout = () => {
    // L'utilisateur n'a pas répondu à temps : faux + on passe
    setRes(r => [...r, { q: ex.q, c: false, a: ex.type === "qcm" ? ex.opts![ex.ans] : ex.ans }]);
    setChecked(true);
    persistResult(false);
    setTimeout(() => doNext(), 800);
  };

  const doNext = () => {
    if (ci + 1 >= exercises.length) {
      const finalScore = score;
      const pct = Math.round((finalScore / exercises.length) * 100);
      if (lessonId && unitId) {
        const newLevel = nextDifficulty(currentDifficulty, finalScore / exercises.length);
        if (newLevel !== currentDifficulty) {
          persistDifficulty(lessonId, unitId, newLevel);
        }
        recordExerciseRun(lessonId, unitId, pct);
        // Notify the tutor (Herr Professor) so it can give a recap next time
        const recap = {
          lessonId,
          unitId,
          scorePct: pct,
          score: finalScore,
          total: exercises.length,
          mistakes: res.filter(r => !r.c).slice(0, 5).map(r => ({ q: r.q, a: r.a })),
        };
        try { localStorage.setItem("dm_pending_recap", JSON.stringify(recap)); } catch {}
        try { window.dispatchEvent(new CustomEvent("dm-lesson-finished", { detail: recap })); } catch {}
      }
      setDone(true);
      return;
    }
    setCi(c => c + 1); setSel(null); setFa(""); setTa(""); setChecked(false);
  };

  const next = () => doNext();

  const speakRes = (c: boolean) => {
    if (c) setScore(s => s + 1);
    setRes(r => [...r, { q: ex.q, c, a: ex.ans }]);
    setChecked(true);
    persistResult(c);
  };

  if (done) {
    const p = Math.round((score / exercises.length) * 100);
    const newLevel = lessonId && unitId ? nextDifficulty(currentDifficulty, score / exercises.length) : currentDifficulty;
    const levelChanged = newLevel !== currentDifficulty;
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">{p >= 80 ? "🏆" : p >= 50 ? "👍" : "📚"}</div>
        <h2 className="text-foreground text-2xl">{p}%</h2>
        <div className="text-muted-foreground mb-4">{score}/{exercises.length}</div>

        {levelChanged && (
          <div className={`mb-4 p-3 rounded-xl border text-sm ${newLevel > currentDifficulty ? "bg-success/10 border-success/40 text-success" : "bg-warning/10 border-warning/40 text-warning"}`}>
            {newLevel > currentDifficulty
              ? `🚀 Difficulté augmentée → niveau ${newLevel}/3`
              : `🔁 Reprise ciblée → niveau ${newLevel}/3 (mots faibles d'abord)`}
          </div>
        )}

        <div className="text-left">
          {res.map((r, i) => (
            <div key={i} className="flex gap-2 py-1.5 border-b border-border text-sm">
              <span>{r.c ? "✅" : "❌"}</span>
              <div className="flex-1">
                <div className="text-foreground">{r.q}</div>
                <ArInline fr={r.q} />
                {!r.c && <div className="text-warning">→ {r.a}</div>}
                {!r.c && <ArInline fr={String(r.a)} />}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onFinish} className="mt-5 px-8 py-3.5 rounded-xl border-none bg-primary text-primary-foreground font-bold cursor-pointer">
          Retour
        </button>
      </div>
    );
  }

  const isDisabled = (sel === null && ex.type === "qcm") || (!fa.trim() && ex.type === "fill") || (!ta.trim() && ex.type === "translate");

  // Couleur du timer selon l'urgence
  const timerColor = remaining <= 10 ? "text-destructive" : remaining <= 20 ? "text-warning" : "text-primary";

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-2.5 gap-2 flex-wrap">
        <span className="text-muted-foreground text-sm">Q {ci + 1}/{exercises.length}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Format horaire — visible uniquement si question de temps */}
          {t && (
            <div className="inline-flex rounded-full bg-card border border-border overflow-hidden text-[10px] font-bold">
              {(["12h", "24h"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setClockFormat(f)}
                  className={`px-2 py-0.5 cursor-pointer border-none ${clockFormat === f ? "bg-primary text-primary-foreground" : "bg-transparent text-foreground"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
          {/* Toggle minuteur 60s */}
          <button
            onClick={() => setTimerEnabled(v => !v)}
            title="Activer/désactiver le minuteur"
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border cursor-pointer ${timerEnabled ? "bg-warning/20 border-warning text-warning" : "bg-card border-border text-muted-foreground"}`}
          >
            ⏱️ {timerEnabled ? `${remaining}s` : "Off"}
          </button>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-semibold">
            Niv. {currentDifficulty}/3
          </span>
          <span className="text-primary text-sm font-semibold">Score: {score}</span>
        </div>
      </div>

      {/* Barre du minuteur */}
      {timerEnabled && (
        <div className="bg-card rounded-md p-0.5 mb-2">
          <div
            className={`h-1 rounded transition-all ${remaining <= 10 ? "bg-destructive" : remaining <= 20 ? "bg-warning" : "bg-primary"}`}
            style={{ width: `${(remaining / timerSec) * 100}%` }}
          />
        </div>
      )}

      <div className="bg-card rounded-md p-0.5 mb-3.5">
        <div className="bg-primary h-1 rounded" style={{ width: `${((ci + 1) / exercises.length) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div className="bg-card rounded-2xl p-4.5 mb-3.5 border border-border">
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold text-primary-foreground ${
          ex.type === "qcm" ? "bg-primary" : ex.type === "fill" ? "bg-purple" : ex.type === "translate" ? "bg-warning" : "bg-success"
        }`}>
          {ex.type === "qcm" ? "QCM" : ex.type === "fill" ? "Compléter" : ex.type === "translate" ? "Traduire" : "🎤 Parler"}
        </span>
        <div className="text-base font-semibold text-foreground mt-2.5 leading-relaxed">{ex.q}</div>
        {!deOnly && showAr && (() => { const arQ = translateFrToAr(ex.q); return arQ ? <div dir="rtl" className="text-sm text-emerald-400 mt-1 leading-relaxed">🇸🇦 {arQ}</div> : null; })()}
        {t && (
          <div className="mt-3 flex justify-center">
            <AnalogClock
              time={t}
              size={160}
              show24={clockFormat === "24h" && t.hour >= 13}
            />
          </div>
        )}
      </div>

      {ex.type === "speak" ? (
        <>
          <SpeakExercise exercise={ex} onResult={speakRes} />
          {checked && (
            <button
              onClick={next}
              className="w-full mt-3.5 p-3.5 rounded-xl border-none bg-success text-success-foreground font-bold text-[15px] cursor-pointer"
            >
              {ci + 1 >= exercises.length ? "Résultat" : "Suivant →"}
            </button>
          )}
        </>
      ) : (
        <>
          {ex.type === "qcm" && (
            <div className="flex flex-col gap-2">
              {ex.opts!.map((o, i) => {
                let classes = "bg-card border-border";
                if (checked) {
                  if (i === ex.ans) classes = "bg-success/15 border-success";
                  else if (i === sel && i !== ex.ans) classes = "bg-destructive/15 border-destructive";
                } else if (i === sel) {
                  classes = "bg-card-hover border-primary";
                }
                return (
                  <button key={i} onClick={() => !checked && setSel(i)}
                    className={`p-3 rounded-xl border-2 text-foreground text-left text-sm cursor-pointer ${classes}`}>
                    <span className="font-semibold mr-2 text-text-dim">{String.fromCharCode(65 + i)}.</span>{o}
                  </button>
                );
              })}
            </div>
          )}

          {(ex.type === "fill" || ex.type === "translate") && (
            <input
              value={ex.type === "fill" ? fa : ta}
              onChange={e => ex.type === "fill" ? setFa(e.target.value) : setTa(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !checked && check()}
              disabled={checked}
              placeholder={ex.type === "fill" ? "Réponse..." : "Traduction..."}
              className={`w-full p-3 rounded-xl text-[15px] outline-none border-2 bg-card text-foreground ${
                checked ? (ok() ? "border-success" : "border-destructive") : "border-border"
              }`}
            />
          )}

          {checked && (
            <div className={`mt-3 p-3.5 rounded-xl border ${ok() ? "bg-success/10 border-success" : "bg-destructive/10 border-destructive"}`}>
              <div className={`font-bold mb-1.5 ${ok() ? "text-success" : "text-destructive"}`}>
                {ok() ? "✓ Richtig!" : "✗ Falsch"}
              </div>
              {!ok() && (
                <div className="text-foreground mb-1.5 text-sm">
                  <div className="flex items-center gap-1">
                    → <strong>{ex.type === "qcm" ? ex.opts![ex.ans] : ex.ans}</strong>
                    <SpeakBtn text={ex.type === "qcm" ? ex.opts![ex.ans] : ex.ans} size={14} />
                  </div>
                  <ArInline fr={String(ex.type === "qcm" ? ex.opts![ex.ans] : ex.ans)} />
                </div>
              )}
              {/* Phrase de correction adaptée au format 12h/24h pour les heures */}
              {t && (
                <div className="text-xs text-foreground bg-primary/10 border border-primary/30 rounded-md p-2 mb-1.5 flex items-center gap-1">
                  🕐 <strong>{clockFormat === "12h" ? "Forme parlée" : "Forme officielle"} :</strong>{" "}
                  {correctionPhrase()}
                  <SpeakBtn text={correctionPhrase() ?? ""} size={14} />
                </div>
              )}
              <div className="text-sm text-warning bg-warning/10 p-2 rounded-lg">
                💡 {ex.tip}
                <ArInline fr={ex.tip} className="text-warning/80" />
              </div>
            </div>
          )}

          <div className="mt-3.5">
            {!checked ? (
              <button onClick={check} disabled={isDisabled}
                className={`w-full p-3.5 rounded-xl border-none bg-primary text-primary-foreground font-bold text-[15px] cursor-pointer ${isDisabled ? "opacity-50" : ""}`}>
                Vérifier
              </button>
            ) : (
              <button onClick={next}
                className="w-full p-3.5 rounded-xl border-none bg-success text-success-foreground font-bold text-[15px] cursor-pointer">
                {ci + 1 >= exercises.length ? "Résultat" : "Suivant →"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
