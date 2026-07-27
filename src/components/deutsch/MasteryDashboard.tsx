import { useMemo } from "react";
import { getAllStats, masteryPercent, type LessonStats } from "@/lib/lessonStats";
import { UNITS } from "@/data/curriculum";
import { UNITS_A2 } from "@/data/curriculumA2";
import { UNITS_B1 } from "@/data/curriculumB1";
import { UNITS_B2 } from "@/data/curriculumB2";
const ALL_UNITS = [...UNITS, ...UNITS_A2, ...UNITS_B1, ...UNITS_B2];
import { formatSeconds } from "@/data/lessonEnrichment";

interface MasteryDashboardProps {
  onBack: () => void;
}

/**
 * Tableau de maîtrise : pourcentage par catégorie (Vocab / Exercices / Hören)
 * basé sur les bonnes réponses pondérées par l'engagement (nb de tentatives).
 */
export function MasteryDashboard({ onBack }: MasteryDashboardProps) {
  const stats = getAllStats();

  const overall = useMemo(() => {
    const sum = (cat: keyof Pick<LessonStats, "vocab" | "exercises" | "hoeren">) => {
      const totalAttempts = stats.reduce((a, s) => a + s[cat].attempts, 0);
      const totalCorrect = stats.reduce((a, s) => a + s[cat].correct, 0);
      const totalTime = stats.reduce((a, s) => a + s[cat].timeSec, 0);
      return {
        attempts: totalAttempts,
        correct: totalCorrect,
        timeSec: totalTime,
        pct: masteryPercent({ attempts: totalAttempts, correct: totalCorrect, timeSec: totalTime }, 60),
      };
    };
    return {
      vocab: sum("vocab"),
      exercises: sum("exercises"),
      hoeren: sum("hoeren"),
    };
  }, [stats]);

  const lessonRows = useMemo(() => {
    return stats
      .map(s => {
        const unit = ALL_UNITS.find(u => u.id === s.unitId);
        const lesson = unit?.lessons.find(l => l.id === s.lessonId);
        return {
          stats: s,
          unit,
          lesson,
          vocabPct: masteryPercent(s.vocab),
          exoPct: masteryPercent(s.exercises),
          hoerenPct: masteryPercent(s.hoeren, 10),
        };
      })
      .filter(r => r.lesson)
      .sort((a, b) => (a.unit?.id ?? "").localeCompare(b.unit?.id ?? ""));
  }, [stats]);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <h3 className="text-foreground m-0 text-[15px]">📊 Tableau de maîtrise</h3>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Vue globale */}
        <div className="grid grid-cols-3 gap-2">
          <CatCard emoji="📝" label="Vocabulaire" pct={overall.vocab.pct} attempts={overall.vocab.attempts} time={overall.vocab.timeSec} color="hsl(var(--primary))" />
          <CatCard emoji="🎯" label="Exercices" pct={overall.exercises.pct} attempts={overall.exercises.attempts} time={overall.exercises.timeSec} color="hsl(var(--purple))" />
          <CatCard emoji="🎧" label="Hören" pct={overall.hoeren.pct} attempts={overall.hoeren.attempts} time={overall.hoeren.timeSec} color="hsl(var(--success))" />
        </div>

        {/* Légende */}
        <div className="text-xs text-muted-foreground p-3 rounded-xl bg-card border border-border">
          💡 Le pourcentage combine <strong>précision</strong> (% de bonnes réponses) et <strong>engagement</strong> (nombre d'essais). Plus vous pratiquez correctement, plus il monte.
        </div>

        {/* Détail par leçon */}
        <div>
          <h4 className="text-foreground font-bold text-sm mb-2">Détail par leçon</h4>
          {lessonRows.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm bg-card rounded-xl border border-border">
              Aucune statistique pour le moment.<br />
              Commencez une leçon pour voir vos progrès ici.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {lessonRows.map(r => (
                <div key={r.stats.lessonId} className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{r.unit?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground font-semibold text-sm truncate">{r.lesson?.title}</div>
                      <div className="text-muted-foreground text-[11px]">{r.unit?.title}</div>
                    </div>
                    {r.stats.lastDifficulty && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-semibold">
                        Niveau {r.stats.lastDifficulty}/3
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniBar label="Vocab" pct={r.vocabPct} color="hsl(var(--primary))" />
                    <MiniBar label="Exos" pct={r.exoPct} color="hsl(var(--purple))" />
                    <MiniBar label="Hören" pct={r.hoerenPct} color="hsl(var(--success))" />
                  </div>
                  {r.stats.weakWords.length > 0 && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      ⚠️ À retravailler : <span className="text-warning font-semibold">{r.stats.weakWords.slice(0, 5).join(", ")}{r.stats.weakWords.length > 5 ? "..." : ""}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatCard({ emoji, label, pct, attempts, time, color }: { emoji: string; label: string; pct: number; attempts: number; time: number; color: string }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: `${color}15`, borderColor: `${color}40` }}>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-foreground font-bold text-xl" style={{ color }}>{pct}%</div>
      <div className="text-foreground text-[11px] font-semibold">{label}</div>
      <div className="text-muted-foreground text-[10px] mt-0.5">{attempts} essais · {formatSeconds(time)}</div>
    </div>
  );
}

function MiniBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
