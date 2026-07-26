import { useMemo, useState } from "react";
import { getDailyWords, buildOptions, type ChallengeWord } from "@/data/challengePool";
import { getTodayChallenge, saveChallengeRecord, getChallengeStreak, getChallengeHistory } from "@/lib/challengeHistory";
import { SpeakBtn } from "./SpeakBtn";
import { useGamification } from "@/hooks/useGamification";

interface Props {
  onBack: () => void;
}

const COUNT = 5;

export function Tageschallenge({ onBack }: Props) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const words = useMemo(() => getDailyWords(today, COUNT), [today]);
  const [started, setStarted] = useState(false);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const previous = getTodayChallenge();
  const streak = getChallengeStreak();
  const history = getChallengeHistory().slice(-7).reverse();
  const { addPoints } = useGamification();

  const current: ChallengeWord | undefined = words[qi];
  const options = useMemo(
    () => (current ? buildOptions(current, today, qi) : []),
    [current, today, qi]
  );

  const start = () => {
    setStarted(true);
    setQi(0); setSelected(null); setChecked(false); setScore(0); setDone(false);
  };

  const check = () => {
    if (!current || !selected) return;
    setChecked(true);
    if (selected === current.fr) {
      setScore(s => s + 1);
      addPoints(10, "correct");
    }
  };

  const next = () => {
    if (qi + 1 >= words.length) {
      const finalScore = score; // déjà incrémenté dans check
      const rec = {
        date: today,
        score: finalScore,
        total: words.length,
        completedAt: new Date().toISOString(),
      };
      saveChallengeRecord(rec);
      setDone(true);
    } else {
      setQi(qi + 1);
      setSelected(null);
      setChecked(false);
    }
  };

  // ---------- Écran d'accueil ----------
  if (!started && !done) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <h3 className="text-foreground m-0 text-base">📅 Tageschallenge — Révision du jour</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/30 text-center mb-4">
            <div className="text-5xl mb-2">📅</div>
            <div className="text-foreground font-extrabold text-lg">Révision quotidienne</div>
            <div className="text-muted-foreground text-xs mt-1">{COUNT} mots tirés des 23 modules · différents chaque jour</div>
            <div className="mt-3 flex items-center justify-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-card border border-border text-foreground">🔥 {streak} jours</span>
              <span className="px-2.5 py-1 rounded-full bg-card border border-border text-foreground">📆 {today}</span>
            </div>
          </div>

          {previous && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/30 mb-4">
              <div className="text-success font-bold text-sm">✅ Déjà fait aujourd'hui</div>
              <div className="text-foreground text-xs mt-0.5">
                Score : <strong>{previous.score}/{previous.total}</strong> · Tu peux refaire pour t'entraîner.
              </div>
            </div>
          )}

          <h4 className="text-foreground font-bold text-sm mb-2">Les mots du jour</h4>
          <div className="flex flex-col gap-2 mb-4">
            {words.map((w, i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border flex items-center gap-2">
                <span className="text-lg">{w.moduleIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-bold text-sm truncate">🇩🇪 {w.de}</div>
                  <div className="text-muted-foreground text-[11px] truncate">📘 {w.moduleTitle}</div>
                </div>
                <SpeakBtn text={w.de} size={14} />
              </div>
            ))}
          </div>

          {history.length > 0 && (
            <>
              <h4 className="text-foreground font-bold text-sm mb-2">📊 Historique récent</h4>
              <div className="flex flex-col gap-1.5 mb-4">
                {history.map(h => {
                  const pct = Math.round((h.score / h.total) * 100);
                  const ok = pct >= 60;
                  return (
                    <div key={h.date} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                      <span className="text-xs text-muted-foreground w-20">{h.date}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${ok ? "bg-success" : "bg-destructive"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${ok ? "text-success" : "text-destructive"}`}>
                        {h.score}/{h.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <button
            onClick={start}
            className="w-full p-4 rounded-xl bg-primary text-primary-foreground font-bold text-base border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            🚀 Commencer la révision (audio + QCM)
          </button>
        </div>
      </div>
    );
  }

  // ---------- Écran final ----------
  if (done) {
    const pct = Math.round((score / words.length) * 100);
    const ok = pct >= 60;
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <h3 className="text-foreground m-0 text-base">📅 Résultat — {today}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className={`p-5 rounded-2xl border-2 text-center mb-4 ${
            ok ? "bg-gradient-to-br from-success/15 to-success/5 border-success/40" : "bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/40"
          }`}>
            <div className="text-5xl mb-2">{ok ? "🎉" : "💪"}</div>
            <div className="text-foreground font-extrabold text-2xl">{score}/{words.length}</div>
            <div className="text-muted-foreground text-sm mt-1">{pct}% · {ok ? "Bravo, série continuée !" : "Continue, tu progresses !"}</div>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-foreground">
              🔥 {getChallengeStreak()} jours de série
            </div>
          </div>

          <h4 className="text-foreground font-bold text-sm mb-2">📋 Corrigé</h4>
          <div className="flex flex-col gap-2 mb-4">
            {words.map((w, i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2">
                  <span>{w.moduleIcon}</span>
                  <span className="text-foreground font-bold text-sm flex-1">🇩🇪 {w.de}</span>
                  <SpeakBtn text={w.de} size={14} />
                </div>
                <div className="text-muted-foreground text-xs mt-1">🇫🇷 {w.fr}</div>
                {w.note && <div className="text-[11px] text-foreground/80 mt-1">💡 {w.note}</div>}
              </div>
            ))}
          </div>

          <button
            onClick={onBack}
            className="w-full p-3.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm cursor-pointer hover:bg-accent/50 transition-colors"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  // ---------- Quiz en cours ----------
  if (!current) return null;
  const isCorrect = checked && selected === current.fr;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <h3 className="text-foreground m-0 text-base flex-1">📅 Tageschallenge</h3>
        <span className="text-xs text-muted-foreground">{qi + 1}/{words.length}</span>
      </div>

      {/* Progress */}
      <div className="px-3 pt-3">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((qi + (checked ? 1 : 0)) / words.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-[10px] text-primary font-bold uppercase tracking-wide mb-1">
          {current.moduleIcon} {current.moduleTitle}
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 mb-4 text-center">
          <div className="text-xs text-muted-foreground mb-2">Que signifie ce mot allemand ?</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-foreground font-extrabold text-2xl">{current.de}</div>
            <SpeakBtn text={current.de} size={20} />
          </div>
          <div className="text-[11px] text-muted-foreground">🔊 Écoute, puis choisis la traduction</div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {options.map(opt => {
            const isSel = selected === opt;
            const isRight = opt === current.fr;
            let cls = "border-border bg-card hover:bg-accent/40";
            if (checked) {
              if (isRight) cls = "border-success bg-success/15 text-success";
              else if (isSel) cls = "border-destructive bg-destructive/15 text-destructive";
              else cls = "border-border bg-card opacity-60";
            } else if (isSel) {
              cls = "border-primary bg-primary/10";
            }
            return (
              <button
                key={opt}
                onClick={() => !checked && setSelected(opt)}
                disabled={checked}
                className={`p-3.5 rounded-xl border-2 text-left text-sm font-medium cursor-pointer transition-all ${cls} ${checked ? "cursor-default" : ""}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {checked && (
          <div className={`p-3 rounded-xl border mb-3 ${isCorrect ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
            <div className={`font-bold text-sm ${isCorrect ? "text-success" : "text-destructive"}`}>
              {isCorrect ? "✅ Bonne réponse !" : "❌ Incorrect"}
            </div>
            <div className="text-foreground text-xs mt-1">
              <strong>{current.de}</strong> = {current.fr}
            </div>
            {current.note && <div className="text-[11px] text-muted-foreground mt-1">💡 {current.note}</div>}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background p-3">
        {!checked ? (
          <button
            onClick={check}
            disabled={!selected}
            className="w-full p-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Vérifier
          </button>
        ) : (
          <button
            onClick={next}
            className="w-full p-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            {qi + 1 >= words.length ? "Voir le résultat 🎯" : "Question suivante →"}
          </button>
        )}
      </div>
    </div>
  );
}
