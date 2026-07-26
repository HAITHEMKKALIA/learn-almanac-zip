// ====== ENRICHISSEUR AUTOMATIQUE DE LEÇONS ======
// Pour chaque leçon, génère :
//  - 30+ mots de vocabulaire (vocab original + pool thématique)
//  - 30+ exercices (originaux + générés depuis le vocab enrichi)
//  - Une estimation de durée d'écoute (Hören) en secondes
import type { Lesson, Exercise, VocabItem } from "./curriculum";
import { getPoolForUnit } from "./vocabPools";

// Mélange déterministe (pour stabilité d'une leçon à l'autre)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Construit 3 distracteurs à partir d'un pool, en évitant la bonne réponse
function pickDistractors(pool: string[], correct: string, seed: number, n = 3): string[] {
  const filtered = pool.filter(x => x.toLowerCase() !== correct.toLowerCase());
  const shuffled = seededShuffle(filtered, seed);
  return shuffled.slice(0, n);
}

// Génère un QCM FR → DE
function makeQcmFrDe(v: VocabItem, allDe: string[], seed: number): Exercise {
  const distractors = pickDistractors(allDe, v.de, seed);
  const opts = seededShuffle([v.de, ...distractors], seed + 1);
  return {
    type: "qcm",
    q: `Comment dit-on "${v.fr}" en allemand ?`,
    opts,
    ans: opts.indexOf(v.de),
    tip: `${v.fr} = ${v.de}.${v.ex ? " Ex : " + v.ex : ""}`,
  };
}

// Génère un QCM DE → FR
function makeQcmDeFr(v: VocabItem, allFr: string[], seed: number): Exercise {
  const distractors = pickDistractors(allFr, v.fr, seed);
  const opts = seededShuffle([v.fr, ...distractors], seed + 7);
  return {
    type: "qcm",
    q: `Que signifie "${v.de}" ?`,
    opts,
    ans: opts.indexOf(v.fr),
    tip: `${v.de} = ${v.fr}.`,
  };
}

// Traduction FR → DE
function makeTranslate(v: VocabItem): Exercise {
  return {
    type: "translate",
    q: `Traduisez : "${v.fr}"`,
    ans: v.de,
    tip: `${v.de} = ${v.fr}.`,
  };
}

// Compléter (cache un mot de l'exemple)
function makeFillFromExample(v: VocabItem): Exercise | null {
  if (!v.ex) return null;
  // Cache le mot allemand principal s'il apparaît dans l'exemple
  const main = v.de.replace(/^(der |die |das |den |dem |des )/i, "").split(" ")[0];
  if (!main || main.length < 2) return null;
  const re = new RegExp(`\\b${main}\\b`, "i");
  if (!re.test(v.ex)) return null;
  return {
    type: "fill",
    q: v.ex.replace(re, "___"),
    ans: main,
    tip: `${v.de} = ${v.fr}.`,
  };
}

// Prononciation
function makeSpeak(v: VocabItem): Exercise {
  return {
    type: "speak",
    q: `Prononcez : "${v.de}"`,
    ans: v.de,
    tip: `${v.fr}.${v.ex ? " Ex : " + v.ex : ""}`,
  };
}

export interface EnrichedLesson extends Lesson {
  estimatedSeconds: number; // durée d'écoute estimée
  hoerenItems: VocabItem[]; // items à écouter en boucle (DE + ex)
}

export function enrichLesson(lesson: Lesson, unitId: string): EnrichedLesson {
  const pool = getPoolForUnit(unitId);
  const seedBase = hashStr(lesson.id);

  // 1) Vocab enrichi : original + pool, dédupliqué, min 30
  const seenDe = new Set(lesson.vocab.map(v => v.de.toLowerCase()));
  const extras: VocabItem[] = [];
  for (const v of pool) {
    if (extras.length + lesson.vocab.length >= 35) break;
    if (!seenDe.has(v.de.toLowerCase())) {
      extras.push(v);
      seenDe.add(v.de.toLowerCase());
    }
  }
  const fullVocab = [...lesson.vocab, ...extras];

  // 2) Exercices enrichis
  const generated: Exercise[] = [];
  const allDe = fullVocab.map(v => v.de);
  const allFr = fullVocab.map(v => v.fr);

  fullVocab.forEach((v, i) => {
    const seed = seedBase + i * 17;
    // Pour chaque vocab, on génère ~3 exercices variés en alternant les types
    const mode = i % 5;
    if (mode === 0) generated.push(makeQcmFrDe(v, allDe, seed));
    else if (mode === 1) generated.push(makeQcmDeFr(v, allFr, seed));
    else if (mode === 2) generated.push(makeTranslate(v));
    else if (mode === 3) {
      const fill = makeFillFromExample(v);
      generated.push(fill ?? makeQcmFrDe(v, allDe, seed));
    }
    else generated.push(makeSpeak(v));
  });

  // On veut au moins 30 exos. Si pas assez, on ajoute des QCM supplémentaires.
  let extraSeed = seedBase + 9999;
  while (lesson.exercises.length + generated.length < 32) {
    const v = fullVocab[(generated.length) % fullVocab.length];
    extraSeed += 13;
    generated.push(makeQcmFrDe(v, allDe, extraSeed));
  }

  // Limite raisonnable (40 max pour ne pas trop fatiguer)
  const maxExtras = 35 - lesson.exercises.length;
  const trimmed = generated.slice(0, Math.max(0, maxExtras));
  const fullExercises = [...lesson.exercises, ...trimmed];

  // 3) Hören items : tout le vocab (DE + exemples) → ~3s par item
  const hoerenItems = fullVocab;
  const estimatedSeconds = fullVocab.reduce((acc, v) => acc + 3 + (v.ex ? 4 : 0), 0);

  return {
    ...lesson,
    vocab: fullVocab,
    exercises: fullExercises,
    estimatedSeconds,
    hoerenItems,
  };
}

// Helper de format mm:ss
export function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ====== DIFFICULTÉ ADAPTATIVE ======
// Niveau 1 = facile : 2 distracteurs, mots courts privilégiés
// Niveau 2 = moyen : 3 distracteurs (défaut)
// Niveau 3 = difficile : 4 distracteurs, plus de cas/lettres spéciales (ä,ö,ü,ß)

const SPECIAL_CHARS = /[äöüÄÖÜß]/;

/**
 * Renvoie un sous-ensemble d'exercices ajusté à la difficulté.
 * - Niveau 3 : on privilégie les mots avec ß / Umlaut / articles (der/die/das).
 * - Niveau 1 : on retire les exercices "fill" (plus difficiles) et garde les QCM courts.
 * Si `weakWords` est fourni, on remonte en priorité les exos qui portent sur ces mots.
 */
export function applyDifficulty(
  enriched: EnrichedLesson,
  level: 1 | 2 | 3,
  weakWords: string[] = [],
): EnrichedLesson {
  let exos = enriched.exercises.slice();

  if (level === 1) {
    // Facile : QCM et speak en priorité
    exos = exos.filter(e => e.type === "qcm" || e.type === "speak");
    // Réduit chaque QCM à 3 options (correct + 2 distracteurs)
    exos = exos.map(e => {
      if (e.type === "qcm" && e.opts && typeof e.ans === "number") {
        const correct = e.opts[e.ans];
        const others = e.opts.filter((_, i) => i !== e.ans).slice(0, 2);
        const opts = [correct, ...others].sort(() => Math.random() - 0.5);
        return { ...e, opts, ans: opts.indexOf(correct) };
      }
      return e;
    });
  } else if (level === 3) {
    // Difficile : ajouter un 4ᵉ distracteur, prioriser les mots avec spécificités
    exos = exos.map(e => {
      if (e.type === "qcm" && e.opts && typeof e.ans === "number") {
        const correct = e.opts[e.ans];
        // Cherche un distracteur supplémentaire dans le vocab (mot avec umlaut)
        const extra = enriched.vocab
          .map(v => v.de)
          .find(d => SPECIAL_CHARS.test(d) && !e.opts!.includes(d) && d !== correct);
        if (extra) {
          const opts = [...e.opts, extra].sort(() => Math.random() - 0.5);
          return { ...e, opts, ans: opts.indexOf(correct) };
        }
      }
      return e;
    });
    // Trie : mots à caractères spéciaux d'abord
    exos.sort((a, b) => {
      const aSpec = SPECIAL_CHARS.test(JSON.stringify(a.ans)) ? 1 : 0;
      const bSpec = SPECIAL_CHARS.test(JSON.stringify(b.ans)) ? 1 : 0;
      return bSpec - aSpec;
    });
  }

  // Reprises ciblées : remonte en haut les exos qui contiennent un mot faible
  if (weakWords.length > 0) {
    const weakSet = new Set(weakWords.map(w => w.toLowerCase()));
    exos.sort((a, b) => {
      const aw = matchesWeak(a, weakSet) ? 1 : 0;
      const bw = matchesWeak(b, weakSet) ? 1 : 0;
      return bw - aw;
    });
  }

  return { ...enriched, exercises: exos };
}

function matchesWeak(ex: { q: string; ans: any; opts?: string[] }, weakSet: Set<string>): boolean {
  const haystack = [ex.q, String(ex.ans ?? ""), ...(ex.opts ?? [])].join(" ").toLowerCase();
  for (const w of weakSet) {
    if (haystack.includes(w)) return true;
  }
  return false;
}

/** Calcule le prochain niveau de difficulté en fonction de la précision. */
export function nextDifficulty(currentLevel: 1 | 2 | 3, correctRate: number): 1 | 2 | 3 {
  if (correctRate >= 0.85 && currentLevel < 3) return (currentLevel + 1) as 1 | 2 | 3;
  if (correctRate < 0.5 && currentLevel > 1) return (currentLevel - 1) as 1 | 2 | 3;
  return currentLevel;
}
