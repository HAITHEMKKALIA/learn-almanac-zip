// Per-lesson completion tracking + chapter badges.
// Stored in localStorage; orthogonal to lessonStats (which is mastery %).
const KEY = "dm_lesson_progress_v1";

export interface LessonProgress {
  lessonId: string;
  unitId: string;
  vocabDone: boolean;
  exercisesDone: boolean;
  hoerenDone: boolean;
  bestScorePct: number; // 0-100, best score on the exercise engine
  lastScorePct: number;
  attempts: number;
  completedAt?: string; // ISO when fully completed
  updatedAt: string;
}

type Store = Record<string, LessonProgress>;

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return typeof p === "object" && p ? p : {};
  } catch { return {}; }
}
function write(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

function empty(lessonId: string, unitId: string): LessonProgress {
  return {
    lessonId, unitId,
    vocabDone: false, exercisesDone: false, hoerenDone: false,
    bestScorePct: 0, lastScorePct: 0, attempts: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function getLessonProgress(lessonId: string, unitId: string): LessonProgress {
  const all = read();
  return all[lessonId] ?? empty(lessonId, unitId);
}

export function getAllLessonProgress(): LessonProgress[] {
  return Object.values(read());
}

function persist(lp: LessonProgress) {
  const all = read();
  lp.updatedAt = new Date().toISOString();
  if (lp.vocabDone && lp.exercisesDone && lp.hoerenDone && !lp.completedAt) {
    lp.completedAt = lp.updatedAt;
  }
  all[lp.lessonId] = lp;
  write(all);
}

export function markVocabDone(lessonId: string, unitId: string) {
  const lp = getLessonProgress(lessonId, unitId);
  lp.vocabDone = true;
  persist(lp);
}

export function markHoerenDone(lessonId: string, unitId: string) {
  const lp = getLessonProgress(lessonId, unitId);
  lp.hoerenDone = true;
  persist(lp);
}

export function recordExerciseRun(
  lessonId: string,
  unitId: string,
  scorePct: number,
) {
  const lp = getLessonProgress(lessonId, unitId);
  lp.attempts += 1;
  lp.lastScorePct = scorePct;
  if (scorePct > lp.bestScorePct) lp.bestScorePct = scorePct;
  if (scorePct >= 60) lp.exercisesDone = true;
  persist(lp);
}

/** Chapter completion = % of lessons fully completed in that chapter. */
export interface ChapterProgress {
  total: number;
  completed: number;
  pct: number;
  hasAny: boolean;
}

export function getChapterProgress(lessonIds: string[]): ChapterProgress {
  const all = read();
  let completed = 0;
  let any = false;
  for (const id of lessonIds) {
    const lp = all[id];
    if (lp) any = true;
    if (lp?.completedAt) completed += 1;
  }
  return {
    total: lessonIds.length,
    completed,
    pct: lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0,
    hasAny: any,
  };
}

export function isLessonCompleted(lessonId: string): boolean {
  return !!read()[lessonId]?.completedAt;
}
