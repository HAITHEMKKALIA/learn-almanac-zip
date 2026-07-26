// Statistiques de maîtrise par leçon : Vocabulaire, Exercices, Hören
// Stockées dans localStorage pour fonctionner sans compte.
const KEY = "dm_lesson_stats_v1";

export interface CategoryStats {
  attempts: number;     // nombre de tentatives (ex : exos répondus)
  correct: number;      // nombre de bonnes réponses
  timeSec: number;      // temps cumulé passé sur la catégorie
}

export interface LessonStats {
  lessonId: string;
  unitId: string;
  vocab: CategoryStats;     // basé sur flashcards révisées + écoutes
  exercises: CategoryStats; // basé sur exos vérifiés
  hoeren: CategoryStats;    // basé sur écoutes complétées
  lastDifficulty: 1 | 2 | 3; // 1 = facile, 2 = moyen, 3 = difficile
  weakWords: string[];      // mots à retravailler (mots faux ≥2 fois)
  weakTimes: string[];      // heures HH:MM ratées (pour la fiche de révision)
  pronunciationOk: string[];// mots avec ✓ prononciation
  pronunciationKo: string[];// mots avec ○ prononciation à retravailler
  hoerenLastIdx: number;    // dernière position arrêtée dans Hören
  hoerenElapsed: number;    // temps de session Hören déjà écoulé
  updatedAt: string;
}

function emptyCat(): CategoryStats {
  return { attempts: 0, correct: 0, timeSec: 0 };
}

function emptyStats(lessonId: string, unitId: string): LessonStats {
  return {
    lessonId,
    unitId,
    vocab: emptyCat(),
    exercises: emptyCat(),
    hoeren: emptyCat(),
    lastDifficulty: 2,
    weakWords: [],
    weakTimes: [],
    pronunciationOk: [],
    pronunciationKo: [],
    hoerenLastIdx: 0,
    hoerenElapsed: 0,
    updatedAt: new Date().toISOString(),
  };
}

/** Migration douce : assure que les nouveaux champs existent. */
function migrate(s: LessonStats): LessonStats {
  return {
    ...s,
    weakTimes: s.weakTimes ?? [],
    pronunciationOk: s.pronunciationOk ?? [],
    pronunciationKo: s.pronunciationKo ?? [],
  };
}

function readAll(): Record<string, LessonStats> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, LessonStats>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* quota dépassé : on ignore */
  }
}

export function getLessonStats(lessonId: string, unitId: string): LessonStats {
  const all = readAll();
  return migrate(all[lessonId] ?? emptyStats(lessonId, unitId));
}

/** Note une heure HH:MM comme ratée (pour la fiche de révision). */
export function recordWeakTime(lessonId: string, unitId: string, hhmm: string) {
  const stats = getLessonStats(lessonId, unitId);
  if (!stats.weakTimes.includes(hhmm)) stats.weakTimes.push(hhmm);
  saveLessonStats(stats);
}

/** Marque la prononciation d'un mot : ✓ ou ○. */
export function recordPronunciation(
  lessonId: string,
  unitId: string,
  word: string,
  ok: boolean,
) {
  if (!word) return;
  const stats = getLessonStats(lessonId, unitId);
  if (ok) {
    if (!stats.pronunciationOk.includes(word)) stats.pronunciationOk.push(word);
    stats.pronunciationKo = stats.pronunciationKo.filter(w => w !== word);
  } else {
    if (!stats.pronunciationKo.includes(word)) stats.pronunciationKo.push(word);
  }
  saveLessonStats(stats);
}

export function saveLessonStats(stats: LessonStats) {
  const all = readAll();
  all[stats.lessonId] = { ...stats, updatedAt: new Date().toISOString() };
  writeAll(all);
}

export function recordAnswer(
  lessonId: string,
  unitId: string,
  category: "vocab" | "exercises" | "hoeren",
  correct: boolean,
  word?: string,
) {
  const stats = getLessonStats(lessonId, unitId);
  stats[category].attempts += 1;
  if (correct) stats[category].correct += 1;
  if (!correct && word) {
    if (!stats.weakWords.includes(word)) stats.weakWords.push(word);
  } else if (correct && word) {
    // Si on a réussi 2 fois ce mot → on le sort des faibles
    stats.weakWords = stats.weakWords.filter(w => w !== word);
  }
  saveLessonStats(stats);
}

export function recordTime(
  lessonId: string,
  unitId: string,
  category: "vocab" | "exercises" | "hoeren",
  seconds: number,
) {
  if (seconds <= 0) return;
  const stats = getLessonStats(lessonId, unitId);
  stats[category].timeSec += seconds;
  saveLessonStats(stats);
}

export function setHoerenPosition(
  lessonId: string,
  unitId: string,
  idx: number,
  elapsed: number,
) {
  const stats = getLessonStats(lessonId, unitId);
  stats.hoerenLastIdx = idx;
  stats.hoerenElapsed = elapsed;
  saveLessonStats(stats);
}

export function setDifficulty(lessonId: string, unitId: string, level: 1 | 2 | 3) {
  const stats = getLessonStats(lessonId, unitId);
  stats.lastDifficulty = level;
  saveLessonStats(stats);
}

/**
 * Pourcentage de maîtrise pondéré : précision × engagement.
 * - précision = correct / attempts
 * - engagement = min(1, attempts / target) où target dépend de la catégorie
 */
export function masteryPercent(cat: CategoryStats, target = 20): number {
  if (cat.attempts === 0) return 0;
  const accuracy = cat.correct / cat.attempts;
  const engagement = Math.min(1, cat.attempts / target);
  return Math.round(accuracy * engagement * 100);
}

export function getAllStats(): LessonStats[] {
  return Object.values(readAll());
}

export function resetLessonStats(lessonId: string) {
  const all = readAll();
  delete all[lessonId];
  writeAll(all);
}
