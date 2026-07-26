// Helpers pour exprimer l'heure en allemand (formes courantes A1/A2)
import { numberToGerman } from "@/data/curriculum";

export interface TimeValue {
  hour: number;   // 0-23
  minute: number; // 0-59
}

/**
 * Forme "officielle" 24h : "Es ist sieben Uhr dreißig"
 */
export function timeToOfficialDe(t: TimeValue): string {
  const h = numberToGerman(t.hour);
  if (t.minute === 0) return `Es ist ${h} Uhr`;
  const m = numberToGerman(t.minute);
  return `Es ist ${h} Uhr ${m}`;
}

/**
 * Forme parlée courante (12h) : "Viertel vor acht", "halb neun", etc.
 */
export function timeToColloquialDe(t: TimeValue): string {
  const h12 = ((t.hour % 12) || 12);
  const nextH12 = ((h12 % 12) + 1);
  const hourWord = numberToGerman(h12 === 1 ? 1 : h12);
  const nextHourWord = numberToGerman(nextH12 === 1 ? 1 : nextH12);

  if (t.minute === 0) return `Es ist ${hourWord} Uhr`;
  if (t.minute === 15) return `Es ist Viertel nach ${hourWord}`;
  if (t.minute === 30) return `Es ist halb ${nextHourWord}`;
  if (t.minute === 45) return `Es ist Viertel vor ${nextHourWord}`;
  if (t.minute < 30) return `Es ist ${numberToGerman(t.minute)} nach ${hourWord}`;
  return `Es ist ${numberToGerman(60 - t.minute)} vor ${nextHourWord}`;
}

/**
 * Description complète + indicateur jour/nuit
 */
export function timePeriodDe(t: TimeValue): string {
  if (t.hour < 5) return "in der Nacht";
  if (t.hour < 12) return "am Morgen";
  if (t.hour < 14) return "am Mittag";
  if (t.hour < 18) return "am Nachmittag";
  if (t.hour < 22) return "am Abend";
  return "in der Nacht";
}

export function timePeriodFr(t: TimeValue): string {
  if (t.hour < 5) return "la nuit";
  if (t.hour < 12) return "le matin";
  if (t.hour < 14) return "à midi";
  if (t.hour < 18) return "l'après-midi";
  if (t.hour < 22) return "le soir";
  return "la nuit";
}

export function formatDigital(t: TimeValue): string {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

/** Heures clés à entraîner */
export const TIME_PRACTICE: TimeValue[] = [
  { hour: 7, minute: 0 },   { hour: 7, minute: 15 },  { hour: 7, minute: 30 },
  { hour: 7, minute: 45 },  { hour: 8, minute: 5 },   { hour: 8, minute: 20 },
  { hour: 9, minute: 50 },  { hour: 10, minute: 10 }, { hour: 12, minute: 0 },
  { hour: 13, minute: 30 }, { hour: 15, minute: 45 }, { hour: 17, minute: 25 },
  { hour: 18, minute: 0 },  { hour: 19, minute: 15 }, { hour: 20, minute: 30 },
  { hour: 21, minute: 40 }, { hour: 22, minute: 0 },  { hour: 23, minute: 55 },
  { hour: 0, minute: 0 },   { hour: 6, minute: 30 },
];
