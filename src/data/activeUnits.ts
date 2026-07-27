// Helper : renvoie les UNITS correspondant au niveau A1/A2/B1/B2
// choisi par l'utilisateur (LevelSwitcher dans DeutschMeister).
// Toutes les sous-vues (Tageschallenge, QCM, Herr Professor,
// MasteryDashboard, RevisionSheet, ArTools, etc.) doivent utiliser
// getActiveUnits() au lieu d'importer UNITS directement, afin que le
// contenu suive dynamiquement le niveau sélectionné.

import { UNITS } from "./curriculum";
import { UNITS_A2 } from "./curriculumA2";
import { UNITS_B1 } from "./curriculumB1";
import { UNITS_B2 } from "./curriculumB2";
import type { Unit } from "./curriculum";

export type LevelKey = "A1" | "A2" | "B1" | "B2";
export const LEVEL_KEY = "dm_level_v1";

export function getActiveLevel(): LevelKey {
  try {
    const v = localStorage.getItem(LEVEL_KEY);
    if (v === "A1" || v === "A2" || v === "B1" || v === "B2") return v;
  } catch {}
  return "A1";
}

export function unitsForLevel(level: LevelKey): Unit[] {
  switch (level) {
    case "A2": return UNITS_A2 as Unit[];
    case "B1": return UNITS_B1 as Unit[];
    case "B2": return UNITS_B2 as Unit[];
    default:   return UNITS;
  }
}

export function getActiveUnits(): Unit[] {
  return unitsForLevel(getActiveLevel());
}
