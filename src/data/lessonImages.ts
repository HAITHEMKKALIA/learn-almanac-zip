// Mappe thématique : associe chaque chapitre/unité à une illustration locale.
// Les images sont des illustrations IA originales (pas de contenu sous copyright).
import reunion from "@/assets/lessons/reunion.jpg";
import health from "@/assets/lessons/health.jpg";
import couple from "@/assets/lessons/couple.jpg";
import office from "@/assets/lessons/office.jpg";
import apartment from "@/assets/lessons/apartment.jpg";
import memories from "@/assets/lessons/memories.jpg";
import travel from "@/assets/lessons/travel.jpg";
import money from "@/assets/lessons/money.jpg";
import classroom from "@/assets/lessons/classroom.jpg";
import celebration from "@/assets/lessons/celebration.jpg";
import city from "@/assets/lessons/city.jpg";
import media from "@/assets/lessons/media.jpg";
import technology from "@/assets/lessons/technology.jpg";
import science from "@/assets/lessons/science.jpg";
import nature from "@/assets/lessons/nature.jpg";
import politics from "@/assets/lessons/politics.jpg";
import art from "@/assets/lessons/art.jpg";
import food from "@/assets/lessons/food.jpg";
import sport from "@/assets/lessons/sport.jpg";
import time from "@/assets/lessons/time.jpg";

export const SCENE = {
  reunion, health, couple, office, apartment, memories, travel, money,
  classroom, celebration, city, media, technology, science, nature,
  politics, art, food, sport, time,
} as const;

// Mapping explicite par id d'unité → image
const BY_ID: Record<string, keyof typeof SCENE> = {
  // Netzwerk A2
  nw_a2_k1: "reunion", nw_a2_k2: "sport", nw_a2_k3: "couple", nw_a2_k4: "office",
  nw_a2_k5: "apartment", nw_a2_k6: "media", nw_a2_k7: "memories", nw_a2_k8: "travel",
  nw_a2_k9: "celebration", nw_a2_k10: "money", nw_a2_k11: "classroom", nw_a2_k12: "nature",
  // Netzwerk B1
  nw_b1_k1: "time", nw_b1_k2: "apartment", nw_b1_k3: "couple", nw_b1_k4: "office",
  nw_b1_k5: "city", nw_b1_k6: "food", nw_b1_k7: "travel", nw_b1_k8: "media",
  nw_b1_k9: "celebration", nw_b1_k10: "politics", nw_b1_k11: "science", nw_b1_k12: "technology",
  // Netzwerk B2
  nw_b2_k1: "city", nw_b2_k2: "media", nw_b2_k3: "classroom", nw_b2_k4: "couple",
  nw_b2_k5: "money", nw_b2_k6: "technology", nw_b2_k7: "science", nw_b2_k8: "media",
  nw_b2_k9: "city", nw_b2_k10: "art", nw_b2_k11: "politics", nw_b2_k12: "technology",
};

const KEYWORDS: Array<[RegExp, keyof typeof SCENE]> = [
  [/wieder|begrüß|kennen|treff/i, "reunion"],
  [/gesund|krank|körper|arzt|medizin/i, "health"],
  [/sport|fitness|bewegung/i, "sport"],
  [/lieb|paar|beziehung|familie|frauen|männer/i, "couple"],
  [/arbeit|beruf|büro|karriere|job/i, "office"],
  [/wohn|haus|nachbar|zusammen leb/i, "apartment"],
  [/erinner|kindheit|biograf/i, "memories"],
  [/reis|urlaub|hotel|bahnhof|flug/i, "travel"],
  [/glück|fest|feier|wunsch/i, "celebration"],
  [/geld|konsum|kauf|geschäft/i, "money"],
  [/lern|schul|bildung|student/i, "classroom"],
  [/stadt|verkehr|mobilität/i, "city"],
  [/medien|nachricht|information|presse/i, "media"],
  [/digital|technologie|computer|ki|künstlich/i, "technology"],
  [/wissenschaft|forschung|labor/i, "science"],
  [/natur|umwelt|klima|nachhaltig|heimat|land/i, "nature"],
  [/politik|wahl|demokratie|engagement/i, "politics"],
  [/kunst|kultur|musik|theater/i, "art"],
  [/essen|kochen|restaurant|lebensmittel/i, "food"],
  [/zeit|alltag|routine|tag/i, "time"],
  [/sprache|kommunikation|wort/i, "media"],
  [/zukunft|prospektiv/i, "technology"],
];

export function imageForUnit(unit: { id: string; title?: string; desc?: string }): string | undefined {
  if (BY_ID[unit.id]) return SCENE[BY_ID[unit.id]];
  const text = `${unit.title || ""} ${unit.desc || ""}`;
  for (const [rx, key] of KEYWORDS) if (rx.test(text)) return SCENE[key];
  return undefined;
}
