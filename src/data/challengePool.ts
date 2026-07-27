// Pool de mots/phrases pour la révision quotidienne (Tageschallenge).
// Priorité au niveau actif (A1/A2/B1/B2) sélectionné par l'utilisateur,
// avec repli sur les modules complets si le pool actif est trop petit.
import { COURSE_MODULES } from "./courseModules";
import { getActiveUnits, getActiveLevel } from "./activeUnits";

export interface ChallengeWord {
  de: string;
  fr: string;
  moduleTitle: string;
  moduleIcon: string;
  note?: string;
}

// Pool tiré du niveau actif (A1/A2/B1/B2)
function buildActiveLevelPool(): ChallengeWord[] {
  const level = getActiveLevel();
  const pool: ChallengeWord[] = [];
  for (const u of getActiveUnits()) {
    for (const l of u.lessons) {
      for (const v of l.vocab) {
        if (v.de && v.fr) {
          pool.push({
            de: v.de,
            fr: v.fr,
            moduleTitle: `${u.title} · ${level}`,
            moduleIcon: u.icon || "📘",
            note: v.ex,
          });
        }
      }
    }
  }
  return pool;
}

// Construit le pool complet à partir de tous les modules (fallback)
export function buildChallengePool(): ChallengeWord[] {
  const active = buildActiveLevelPool();
  if (active.length >= 30) return active;
  const pool: ChallengeWord[] = [...active];
  for (const m of COURSE_MODULES) {
    for (const sec of m.sections) {
      if (sec.items) {
        for (const it of sec.items) {
          if (it.de && it.fr && it.de.trim() && it.fr.trim()) {
            pool.push({
              de: it.de.trim(),
              fr: it.fr.trim(),
              moduleTitle: m.title,
              moduleIcon: m.icon,
              note: it.note,
            });
          }
        }
      }
    }
  }
  return pool;
}


// Sélection déterministe basée sur la date (même set toute la journée)
function dateSeed(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return h;
}

function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyWords(dateStr: string, count = 5): ChallengeWord[] {
  const pool = buildChallengePool();
  if (pool.length === 0) return [];
  const rand = mulberry32(dateSeed(dateStr));
  const used = new Set<number>();
  const out: ChallengeWord[] = [];
  let safety = 0;
  while (out.length < Math.min(count, pool.length) && safety < 500) {
    const idx = Math.floor(rand() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      out.push(pool[idx]);
    }
    safety++;
  }
  return out;
}

// Génère 3 mauvaises options + la bonne pour un QCM
export function buildOptions(correct: ChallengeWord, dateStr: string, qIdx: number): string[] {
  const pool = buildChallengePool().filter(w => w.fr !== correct.fr);
  const rand = mulberry32(dateSeed(dateStr) + qIdx * 97);
  const opts = new Set<string>([correct.fr]);
  let safety = 0;
  while (opts.size < 4 && safety < 200) {
    const idx = Math.floor(rand() * pool.length);
    opts.add(pool[idx].fr);
    safety++;
  }
  // Mélange
  const arr = Array.from(opts);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
