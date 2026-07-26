import { useState, useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { SpeakBtn } from "./SpeakBtn";
import { scorePronunciation } from "@/lib/pronunciation";
import type { Exercise } from "@/data/curriculum";

interface SpeakExerciseProps {
  exercise: Exercise;
  onResult?: (success: boolean) => void;
}

export function SpeakExercise({ exercise, onResult }: SpeakExerciseProps) {
  const { transcript, listening, supported, error, start, stop, setTranscript } = useSpeechRecognition();
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [matched, setMatched] = useState<string[]>([]);
  const [missing, setMissing] = useState<string[]>([]);

  // Évaluation tolérante (umlauts normalisés, Levenshtein, mots reconnus)
  useEffect(() => {
    if (transcript && !checked && !listening) {
      const result = scorePronunciation(String(exercise.ans), transcript);
      setScore(result.score);
      setMatched(result.matched);
      setMissing(result.missing);
      setChecked(true);
      // Seuil indulgent : 50% suffit pour valider
      onResult?.(result.score >= 50);
    }
  }, [transcript, listening]);

  const reset = () => {
    setChecked(false);
    setScore(0);
    setMatched([]);
    setMissing([]);
    setTranscript("");
  };

  const skip = () => {
    // Permet de passer même sans avoir réussi : on enregistre comme "non-réussi" mais on continue
    setChecked(true);
    setScore(score || 0);
    onResult?.(false);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="bg-card rounded-2xl p-5 border border-border text-center">
        <div className="text-xs text-muted-foreground mb-2">Écoutez puis répétez :</div>
        <div className="text-lg font-bold text-foreground mb-3.5">{exercise.ans}</div>
        <SpeakBtn text={String(exercise.ans)} size={32} className="mx-auto" />
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 rounded-xl text-destructive-foreground text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {supported ? (
        <div className="flex gap-2">
          <button
            onClick={listening ? stop : start}
            disabled={checked}
            className={`flex-1 p-4 rounded-full border-none cursor-pointer font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all ${
              listening
                ? "bg-gradient-to-br from-destructive to-red-600 text-primary-foreground shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-mic-pulse"
                : "bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
            } ${checked ? "opacity-50 cursor-default" : ""}`}
          >
            {listening ? "🎙️ Parlez... (tap pour arrêter)" : "🎤 Appuyez et parlez"}
          </button>
          {!checked && (
            <button
              onClick={skip}
              title="Passer cet exercice et continuer"
              className="px-4 rounded-full border-2 border-border bg-card text-muted-foreground font-semibold text-sm cursor-pointer hover:border-primary hover:text-primary transition-colors"
            >
              ⏭️ Passer
            </button>
          )}
        </div>
      ) : (
        <div className="p-3.5 bg-warning/10 rounded-xl text-warning-light text-center text-sm">
          ⚠️ Utilisez <strong>Chrome</strong> ou <strong>Edge</strong> pour le micro.
          <button
            onClick={skip}
            className="block mt-2 mx-auto px-4 py-2 rounded-lg border border-primary bg-transparent text-primary font-semibold cursor-pointer text-sm"
          >
            ⏭️ Passer cet exercice
          </button>
        </div>
      )}

      {listening && transcript && (
        <div className="p-2.5 bg-card rounded-xl text-primary-light text-sm text-center">
          🎙️ "{transcript}"
        </div>
      )}

      {checked && (
        <div className={`p-4.5 rounded-2xl border ${
          score >= 50 ? "bg-success/10 border-success" : "bg-warning/10 border-warning"
        }`}>
          <div className="flex justify-between mb-2.5">
            <span className={`font-bold ${score >= 50 ? "text-success" : "text-warning"}`}>
              {score >= 90 ? "🌟 Ausgezeichnet!" : score >= 70 ? "✓ Sehr gut!" : score >= 50 ? "👍 Gut!" : "💪 Continuons"}
            </span>
            <span className={`text-3xl font-extrabold ${score >= 50 ? "text-success" : "text-warning"}`}>
              {score}%
            </span>
          </div>
          {transcript && (
            <div className="text-sm text-muted-foreground">
              Vous : <strong className="text-foreground">"{transcript}"</strong>
            </div>
          )}
          <div className="text-sm text-muted-foreground mt-1">
            Attendu : <strong className="text-foreground">"{exercise.ans}"</strong>
          </div>
          {(matched.length > 0 || missing.length > 0) && (
            <div className="text-xs mt-2 flex flex-wrap gap-1">
              {matched.map((w, i) => (
                <span key={`m-${i}`} className="px-2 py-0.5 rounded-full bg-success/20 text-success">✓ {w}</span>
              ))}
              {missing.map((w, i) => (
                <span key={`x-${i}`} className="px-2 py-0.5 rounded-full bg-warning/20 text-warning">○ {w}</span>
              ))}
            </div>
          )}
          <div className="text-sm text-warning bg-warning/10 p-2 rounded-lg mt-2">
            💡 {exercise.tip}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={reset}
              className="flex-1 px-4 py-2 rounded-lg border border-primary bg-transparent text-primary font-semibold cursor-pointer text-sm"
            >
              🔄 Réessayer
            </button>
            {score < 50 && (
              <div className="flex-1 px-4 py-2 rounded-lg bg-success/10 border border-success text-success font-semibold text-center text-sm">
                Vous pouvez continuer →
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
