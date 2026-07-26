import { useMemo, useState } from "react";
import { getAllStats, type LessonStats } from "@/lib/lessonStats";
import { UNITS } from "@/data/curriculum";
import { ExerciseEngine } from "./ExerciseEngine";
import { SpeakBtn } from "./SpeakBtn";
import { AnalogClock } from "./AnalogClock";
import type { Exercise, VocabItem } from "@/data/curriculum";

interface RevisionSheetProps {
  onBack: () => void;
}

interface AggregatedDifficulty {
  weakWords: { word: string; lessonId: string; unitId: string }[];
  weakTimes: { hhmm: string; lessonId: string; unitId: string }[];
  pronunciationKo: string[];
  byLesson: LessonStats[];
}

function aggregate(): AggregatedDifficulty {
  const stats = getAllStats();
  const weakWords: AggregatedDifficulty["weakWords"] = [];
  const weakTimes: AggregatedDifficulty["weakTimes"] = [];
  const pronunciationKo = new Set<string>();
  for (const s of stats) {
    for (const w of s.weakWords ?? []) {
      weakWords.push({ word: w, lessonId: s.lessonId, unitId: s.unitId });
    }
    for (const t of s.weakTimes ?? []) {
      weakTimes.push({ hhmm: t, lessonId: s.lessonId, unitId: s.unitId });
    }
    for (const p of s.pronunciationKo ?? []) pronunciationKo.add(p);
  }
  return {
    weakWords,
    weakTimes,
    pronunciationKo: Array.from(pronunciationKo),
    byLesson: stats,
  };
}

/** Retrouve un VocabItem (de/fr) dans tout le programme à partir du DE. */
function findVocab(de: string): VocabItem | null {
  for (const u of UNITS) {
    for (const l of u.lessons) {
      const m = l.vocab.find(v => v.de.toLowerCase() === de.toLowerCase());
      if (m) return m;
    }
  }
  return null;
}

function buildTargetedExercises(agg: AggregatedDifficulty): Exercise[] {
  const exos: Exercise[] = [];

  // 1) Exercices ciblés sur les mots faibles (QCM FR→DE)
  const allDe = UNITS.flatMap(u => u.lessons.flatMap(l => l.vocab.map(v => v.de)));
  const seenWords = new Set<string>();
  for (const { word } of agg.weakWords) {
    if (seenWords.has(word.toLowerCase())) continue;
    seenWords.add(word.toLowerCase());
    const v = findVocab(word);
    if (!v) continue;
    const distractors = allDe
      .filter(x => x.toLowerCase() !== v.de.toLowerCase())
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const opts = [v.de, ...distractors].sort(() => Math.random() - 0.5);
    exos.push({
      type: "qcm",
      q: `🔁 [À retravailler] Comment dit-on "${v.fr}" ?`,
      opts,
      ans: opts.indexOf(v.de),
      tip: `${v.fr} = ${v.de}.${v.ex ? " Ex : " + v.ex : ""}`,
    });
  }

  // 2) Exercices ciblés sur les heures ratées (QCM type "À quelle heure ?")
  const seenTimes = new Set<string>();
  for (const { hhmm } of agg.weakTimes) {
    if (seenTimes.has(hhmm)) continue;
    seenTimes.add(hhmm);
    const [hh, mm] = hhmm.split(":").map(n => parseInt(n, 10));
    // simple QCM avec 4 propositions d'heures (officielle)
    const distractH = [(hh + 1) % 24, (hh + 2) % 24, (hh + 3) % 24];
    const opts = [
      hhmm,
      `${String(distractH[0]).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
      `${String(hh).padStart(2, "0")}:${String((mm + 15) % 60).padStart(2, "0")}`,
      `${String(distractH[1]).padStart(2, "0")}:${String((mm + 30) % 60).padStart(2, "0")}`,
    ].sort(() => Math.random() - 0.5);
    exos.push({
      type: "qcm",
      q: `🕐 [À retravailler] Quelle heure indique l'horloge ? (${hhmm})`,
      opts,
      ans: opts.indexOf(hhmm),
      tip: `Format 24h : ${hhmm}.`,
    });

    // 2b) Exercice 12h (am/pm) — généré automatiquement pour s'entraîner aux conversions
    const isPm = hh >= 12;
    const h12 = ((hh % 12) || 12);
    const correct12 = `${h12}:${String(mm).padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
    const wrong12a = `${h12}:${String(mm).padStart(2, "0")} ${isPm ? "AM" : "PM"}`;
    const wrong12b = `${((h12 % 12) + 1)}:${String(mm).padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
    const wrong12c = `${h12}:${String((mm + 30) % 60).padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
    const opts12 = [correct12, wrong12a, wrong12b, wrong12c].sort(() => Math.random() - 0.5);
    exos.push({
      type: "qcm",
      q: `🕐 [Conversion 12h] ${hhmm} (24h) = ?`,
      opts: opts12,
      ans: opts12.indexOf(correct12),
      tip: `${hhmm} en 24h → ${correct12} (12h ${isPm ? "PM" : "AM"}).`,
    });
  }

  return exos.sort(() => Math.random() - 0.5);
}

export function RevisionSheet({ onBack }: RevisionSheetProps) {
  const agg = useMemo(() => aggregate(), []);
  const targeted = useMemo(() => buildTargetedExercises(agg), [agg]);
  const [practice, setPractice] = useState(false);

  if (practice) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => setPractice(false)} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <h3 className="text-foreground m-0 text-[15px]">🎯 Reprise ciblée ({targeted.length})</h3>
        </div>
        <ExerciseEngine
          exercises={targeted}
          onFinish={() => setPractice(false)}
        />
      </div>
    );
  }

  const totalDifficulties = agg.weakWords.length + agg.weakTimes.length + agg.pronunciationKo.length;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-[15px]">📋 Fiche de révision</h3>
          <div className="text-muted-foreground text-[11px]">
            {totalDifficulties} difficulté{totalDifficulties > 1 ? "s" : ""} compilée{totalDifficulties > 1 ? "s" : ""} de toutes vos sessions
          </div>
        </div>
      </div>

      {totalDifficulties === 0 ? (
        <div className="p-8 text-center">
          <div className="text-5xl mb-3">🌟</div>
          <h4 className="text-foreground font-bold mb-2">Aucune difficulté détectée !</h4>
          <p className="text-muted-foreground text-sm">
            Continuez à faire des exercices : la fiche se remplira automatiquement avec vos points faibles.
          </p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {/* CTA Reprise */}
          {targeted.length > 0 && (
            <button
              onClick={() => setPractice(true)}
              className="p-4 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/15 to-primary/5 text-foreground text-left cursor-pointer hover:opacity-90"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">🚀</div>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">Lancer une session ciblée</div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {targeted.length} exercices générés à partir de vos difficultés
                  </div>
                </div>
                <span className="text-primary text-xl">→</span>
              </div>
            </button>
          )}

          {/* Mots à retravailler */}
          {agg.weakWords.length > 0 && (
            <section>
              <h4 className="text-foreground font-bold text-sm mb-2 flex items-center gap-2">
                🔠 Mots à retravailler <span className="text-xs font-normal text-muted-foreground">({agg.weakWords.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {agg.weakWords.slice(0, 40).map(({ word }, i) => {
                  const v = findVocab(word);
                  return (
                    <div key={i} className="px-3 py-1.5 rounded-full bg-warning/15 border border-warning/40 flex items-center gap-1.5">
                      <span className="font-bold text-foreground text-xs">{word}</span>
                      {v && <span className="text-muted-foreground text-[10px]">— {v.fr}</span>}
                      <SpeakBtn text={word} size={12} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Heures à revoir */}
          {agg.weakTimes.length > 0 && (
            <section>
              <h4 className="text-foreground font-bold text-sm mb-2 flex items-center gap-2">
                🕐 Heures à revoir <span className="text-xs font-normal text-muted-foreground">({agg.weakTimes.length})</span>
              </h4>
              <div className="flex flex-wrap gap-3">
                {agg.weakTimes.slice(0, 12).map(({ hhmm }, i) => {
                  const [h, m] = hhmm.split(":").map(n => parseInt(n, 10));
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-card">
                      <AnalogClock time={{ hour: h, minute: m }} size={80} showDigital={false} />
                      <span className="text-xs font-mono font-bold text-primary">{hhmm}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Prononciation KO */}
          {agg.pronunciationKo.length > 0 && (
            <section>
              <h4 className="text-foreground font-bold text-sm mb-2 flex items-center gap-2">
                🎤 Prononciation à reprendre <span className="text-xs font-normal text-muted-foreground">({agg.pronunciationKo.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {agg.pronunciationKo.slice(0, 30).map((w, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/40 flex items-center gap-1.5">
                    <span className="font-bold text-foreground text-xs">○ {w}</span>
                    <SpeakBtn text={w} size={12} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Détail par leçon */}
          <section>
            <h4 className="text-foreground font-bold text-sm mb-2">📚 Détail par leçon</h4>
            <div className="flex flex-col gap-1.5">
              {agg.byLesson.map(s => {
                const total = (s.weakWords?.length ?? 0) + (s.weakTimes?.length ?? 0);
                if (total === 0) return null;
                return (
                  <div key={s.lessonId} className="p-2.5 rounded-lg border border-border bg-card text-xs">
                    <div className="text-foreground font-semibold">{s.lessonId}</div>
                    <div className="text-muted-foreground">
                      {s.weakWords.length} mot{s.weakWords.length > 1 ? "s" : ""} · {s.weakTimes.length} heure{s.weakTimes.length > 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
