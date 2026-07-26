import { Link } from "react-router-dom";
import { UNITS_A2 } from "@/data/curriculumA2";
import { UNITS_B1 } from "@/data/curriculumB1";
import { UNITS_B2 } from "@/data/curriculumB2";
import "@/data/curriculumExtra";
import { getChapterProgress } from "@/lib/lessonProgress";

const LEVELS = [
  { key: "A2", units: UNITS_A2, color: "#0ea5e9" },
  { key: "B1", units: UNITS_B1, color: "#10b981" },
  { key: "B2", units: UNITS_B2, color: "#a855f7" },
] as const;

export default function CoursePlan() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="max-w-5xl mx-auto mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold m-0">📚 Plan du cours</h1>
          <p className="text-muted-foreground text-sm">Programme complet A2 · B1 · B2 — 10 chapitres par niveau</p>
        </div>
        <Link to="/" className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90">← Retour</Link>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {LEVELS.map((lvl) => {
          const totalLessons = lvl.units.reduce((a, u) => a + u.lessons.length, 0);
          const overall = lvl.units.reduce((acc, u) => {
            const cp = getChapterProgress(u.lessons.map((l) => l.id));
            return { done: acc.done + cp.completed, total: acc.total + cp.total };
          }, { done: 0, total: 0 });
          const pct = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;

          return (
            <section key={lvl.key} className="rounded-2xl border bg-card p-4 md:p-5" style={{ borderColor: `${lvl.color}55` }}>
              <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-extrabold m-0" style={{ color: lvl.color }}>Niveau {lvl.key}</h2>
                  <p className="text-muted-foreground text-xs">{lvl.units.length} chapitres · {totalLessons} leçons</p>
                </div>
                <div className="text-xs font-bold">
                  Progression : <span style={{ color: lvl.color }}>{pct}%</span> ({overall.done}/{overall.total})
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-4">
                <div className="h-full" style={{ width: `${pct}%`, background: lvl.color }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lvl.units.map((u, i) => {
                  const cp = getChapterProgress(u.lessons.map((l) => l.id));
                  const upct = cp.total ? Math.round((cp.completed / cp.total) * 100) : 0;
                  const num = String(i + 1).padStart(2, "0");
                  return (
                    <Link
                      key={u.id}
                      to={`/?level=${lvl.key}&unit=${u.id}`}
                      className="block rounded-xl border-2 p-3 bg-background hover:bg-accent/30 transition-colors"
                      style={{ borderColor: `${u.color}55` }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="text-2xl">{u.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: u.color }}>
                            Chapitre {num}
                          </div>
                          <div className="font-bold text-sm leading-snug truncate">{u.title}</div>
                          {u.titleAr && <div dir="rtl" className="text-emerald-500 text-[11px]">{u.titleAr}</div>}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-snug line-clamp-2 mb-2">{u.desc}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{u.lessons.length} leçons</span>
                        <span className="font-bold" style={{ color: u.color }}>{upct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                        <div className="h-full" style={{ width: `${upct}%`, background: u.color }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
