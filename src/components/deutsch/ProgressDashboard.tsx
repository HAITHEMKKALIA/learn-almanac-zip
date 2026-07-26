import { useGamification } from "@/hooks/useGamification";
import { useEffect, useState } from "react";
import { getChallengeHistory, getChallengeStreak } from "@/lib/challengeHistory";

const HISTORY_KEY = "dm_history";

interface DayEntry {
  date: string;
  points: number;
  messages: number;
  correct: number;
  minutes: number;
}

function getHistory(): DayEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToday(points: number, messages: number, correct: number) {
  const history = getHistory();
  const today = new Date().toISOString().slice(0, 10);
  const existing = history.find(h => h.date === today);
  if (existing) {
    existing.points = points;
    existing.messages = messages;
    existing.correct = correct;
    existing.minutes = Math.max(existing.minutes, Math.round((Date.now() - new Date(today).getTime()) / 60000));
  } else {
    history.push({ date: today, points, messages, correct, minutes: 1 });
  }
  // Keep last 30 days
  const trimmed = history.slice(-30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function ProgressDashboard({ onBack }: { onBack: () => void }) {
  const { points, streak, level, levelProgress, messagesCount, correctCount } = useGamification();
  const [history, setHistory] = useState<DayEntry[]>([]);

  useEffect(() => {
    const h = saveToday(points, messagesCount, correctCount);
    setHistory(h);
  }, [points, messagesCount, correctCount]);

  const last7 = history.slice(-7);
  const maxPts = Math.max(...last7.map(d => d.points), 1);
  const totalMessages = history.reduce((s, d) => s + d.messages, 0);
  const totalCorrect = history.reduce((s, d) => s + d.correct, 0);
  const accuracy = totalMessages > 0 ? Math.round((totalCorrect / totalMessages) * 100) : 0;

  // Streak calendar - last 14 days
  const streakDays: { date: string; active: boolean }[] = [];
  const historyDates = new Set(history.map(h => h.date));
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    streakDays.push({ date: d, active: historyDates.has(d) });
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <h3 className="text-foreground m-0 text-base">📊 Ma progression</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: "⭐", label: "Points", value: points.toLocaleString(), color: "text-warning" },
            { icon: "🔥", label: "Streak", value: `${streak} jours`, color: "text-destructive" },
            { icon: "📈", label: "Niveau", value: `${level}/10`, color: "text-primary" },
            { icon: "💬", label: "Messages", value: totalMessages.toString(), color: "text-foreground" },
            { icon: "✅", label: "Correct", value: totalCorrect.toString(), color: "text-success" },
            { icon: "🎯", label: "Précision", value: `${accuracy}%`, color: "text-primary" },
          ].map((s, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-border bg-card text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-muted-foreground text-[11px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Level progress */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-foreground">📈 Niveau {level}</span>
            <span className="text-xs text-muted-foreground">{Math.round(levelProgress)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            Prochain niveau : encore {Math.round((100 - levelProgress) / 100 * 200)} points
          </div>
        </div>

        {/* Points chart - last 7 days */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <h4 className="text-sm font-bold text-foreground mb-3">📊 Points (7 derniers jours)</h4>
          <div className="flex items-end gap-1.5 h-28">
            {last7.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                Pas encore de données
              </div>
            ) : (
              last7.map((d, i) => {
                const h = Math.max(8, (d.points / maxPts) * 100);
                const dayLabel = new Date(d.date).toLocaleDateString("fr", { weekday: "short" }).slice(0, 2);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted-foreground">{d.points}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/50 transition-all duration-500"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tageschallenge — révision quotidienne */}
        {(() => {
          const challengeHistory = getChallengeHistory().slice(-14).reverse();
          const challengeStreak = getChallengeStreak();
          const totalDone = getChallengeHistory().length;
          const totalCorrect = getChallengeHistory().reduce((s, r) => s + r.score, 0);
          const totalQ = getChallengeHistory().reduce((s, r) => s + r.total, 0);
          const avgPct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
          return (
            <div className="p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-foreground">📅 Tageschallenge</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                  🔥 {challengeStreak} jours
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-card border border-border text-center">
                  <div className="text-lg font-extrabold text-primary">{totalDone}</div>
                  <div className="text-[10px] text-muted-foreground">Sessions</div>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border text-center">
                  <div className="text-lg font-extrabold text-success">{totalCorrect}</div>
                  <div className="text-[10px] text-muted-foreground">Bonnes rép.</div>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border text-center">
                  <div className="text-lg font-extrabold text-foreground">{avgPct}%</div>
                  <div className="text-[10px] text-muted-foreground">Moy.</div>
                </div>
              </div>
              {challengeHistory.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Lance ta première révision quotidienne dans l'onglet Cours !
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {challengeHistory.map(h => {
                    const pct = Math.round((h.score / h.total) * 100);
                    const ok = pct >= 60;
                    return (
                      <div key={h.date} className="flex items-center gap-2 text-[11px]">
                        <span className="text-muted-foreground w-16">{h.date.slice(5)}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${ok ? "bg-success" : "bg-destructive"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`font-bold w-10 text-right ${ok ? "text-success" : "text-destructive"}`}>
                          {h.score}/{h.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Streak calendar */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <h4 className="text-sm font-bold text-foreground mb-3">🔥 Historique de streak (14 jours)</h4>
          <div className="grid grid-cols-7 gap-1.5">
            {streakDays.map((d, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium border ${
                  d.active
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-muted/30 border-border text-muted-foreground/50"
                }`}
                title={d.date}
              >
                {d.active ? "🔥" : new Date(d.date).getDate()}
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
          <h4 className="text-sm font-bold text-foreground mb-1">💡 Conseils</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-none p-0 m-0">
            <li>• Parlez chaque jour pour maintenir votre streak 🔥</li>
            <li>• Utilisez le micro pour +15 pts par message 🎤</li>
            <li>• Les corrections ✅ rapportent +15 pts bonus</li>
            <li>• Essayez tous les scénarios de conversation 🎭</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
