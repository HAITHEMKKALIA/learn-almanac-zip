// Extra exercises (QCM + translation) and vocabulary appended at runtime
// to the new chapters added in A2/B1/B2 (units 5–10) for richer training.
// Side-effect import: just `import "@/data/curriculumExtra"` once.

import type { Exercise, VocabItem } from "./curriculum";
import { UNITS_A2 } from "./curriculumA2";
import { UNITS_B1 } from "./curriculumB1";
import { UNITS_B2 } from "./curriculumB2";

type Pack = { vocab?: VocabItem[]; exercises?: Exercise[] };

export const EXTRA_PACKS: Record<string, Pack> = {
  // ===== A2 =====
  a2_u5_l1: {
    vocab: [
      { de: "schneller", fr: "plus rapide", ar: "أسرع", ex: "Das Auto ist schneller." },
      { de: "am schnellsten", fr: "le plus rapide", ar: "الأسرع", ex: "Er läuft am schnellsten." },
      { de: "lieber", fr: "plutôt / préférer", ar: "أحبّ أكثر", ex: "Ich trinke lieber Tee." },
    ],
    exercises: [
      { type: "qcm", q: "Comparatif de 'gut' ?", opts: ["guter","besser","mehr","am besten"], ans: 1, tip: "Irrégulier." },
      { type: "qcm", q: "Superlatif de 'viel' ?", opts: ["am vielsten","am mehrsten","am meisten","mehrer"], ans: 2, tip: "viel → mehr → am meisten." },
      { type: "translate", q: "« J'aime le mieux le café. »", ans: "Am liebsten trinke ich Kaffee", tip: "am liebsten + verbe." },
      { type: "fill", q: "Mein Bruder ist ___ als ich. (jung)", ans: "jünger", tip: "Umlaut + -er." },
    ],
  },
  a2_u6_l1: {
    vocab: [
      { de: "unter dem Tisch", fr: "sous la table", ar: "تحت الطاولة", ex: "Die Katze ist unter dem Tisch." },
      { de: "vor das Haus", fr: "devant la maison (vers)", ar: "أمام البيت (حركة)", ex: "Er fährt vor das Haus." },
      { de: "an die Wand", fr: "au mur (vers)", ar: "إلى الحائط", ex: "Ich hänge das Bild an die Wand." },
    ],
    exercises: [
      { type: "qcm", q: "Wo? → Akk ou Dat ?", opts: ["Akkusativ","Dativ","Nominativ","Genitiv"], ans: 1, tip: "Position → Dativ." },
      { type: "fill", q: "Ich hänge das Bild an ___ Wand. (Akk)", ans: "die", tip: "Wohin → Akk fém → die." },
      { type: "translate", q: "« Le livre est sur la table. »", ans: "Das Buch ist auf dem Tisch", tip: "Wo → Dat masc → dem." },
    ],
  },
  a2_u7_l1: {
    vocab: [
      { de: "euch", fr: "vous (Akk/Dat)", ar: "ـكم", ex: "Ich sehe euch." },
      { de: "Ihnen", fr: "à vous (poli)", ar: "لكم/لكِ (تأدّب)", ex: "Ich danke Ihnen." },
      { de: "ihm", fr: "à lui", ar: "له", ex: "Ich gebe ihm das Buch." },
    ],
    exercises: [
      { type: "qcm", q: "Dat. de 'er' ?", opts: ["ihn","ihm","sein","es"], ans: 1, tip: "ihm." },
      { type: "fill", q: "Ich danke ___ (à vous, poli).", ans: "Ihnen", tip: "Forme polie." },
      { type: "translate", q: "« Il nous voit. »", ans: "Er sieht uns", tip: "Akk pluriel." },
    ],
  },
  a2_u8_l1: {
    vocab: [
      { de: "ihr werdet", fr: "vous allez (futur)", ar: "ستـ(أنتم)", ex: "Ihr werdet lernen." },
      { de: "sie werden", fr: "ils vont", ar: "سيـ(هم)", ex: "Sie werden ankommen." },
      { de: "nächste Woche", fr: "la semaine prochaine", ar: "الأسبوع القادم", ex: "Nächste Woche werde ich reisen." },
    ],
    exercises: [
      { type: "qcm", q: "Conjuguez : 'er ___ kommen.' (Futur I)", opts: ["wird","werde","werden","wirst"], ans: 0, tip: "3e pers. → wird." },
      { type: "translate", q: "« Nous irons à Berlin. »", ans: "Wir werden nach Berlin fahren", tip: "werden + Inf." },
      { type: "fill", q: "Ihr ___ es schaffen.", ans: "werdet", tip: "2e pers. plur." },
    ],
  },
  a2_u9_l1: {
    vocab: [
      { de: "sich erinnern an", fr: "se souvenir de", ar: "يتذكّر", ex: "Ich erinnere mich an dich." },
      { de: "träumen von", fr: "rêver de", ar: "يحلم بـ", ex: "Sie träumt von Italien." },
      { de: "sprechen über", fr: "parler de", ar: "يتحدّث عن", ex: "Wir sprechen über das Buch." },
    ],
    exercises: [
      { type: "qcm", q: "Ich denke ___ dich.", opts: ["auf","an","für","mit"], ans: 1, tip: "denken + an + Akk." },
      { type: "translate", q: "« Je rêve de voyager. »", ans: "Ich träume vom Reisen", tip: "träumen + von + Dat." },
      { type: "fill", q: "Wir sprechen ___ das Wetter.", ans: "über", tip: "sprechen + über + Akk." },
    ],
  },
  a2_u10_l1: {
    vocab: [
      { de: "sich entspannen", fr: "se détendre", ar: "يسترخي", ex: "Ich entspanne mich am Wochenende." },
      { de: "sich beeilen", fr: "se dépêcher", ar: "يستعجل", ex: "Beeil dich!" },
      { de: "sich erkälten", fr: "s'enrhumer", ar: "يصاب بالبرد", ex: "Ich habe mich erkältet." },
    ],
    exercises: [
      { type: "qcm", q: "Pronom Akk de 'er' ?", opts: ["sich","ihn","ihm","sein"], ans: 0, tip: "réfléchi 3e pers → sich." },
      { type: "fill", q: "Beeil ___ ! (toi)", ans: "dich", tip: "Akk 2e pers." },
      { type: "translate", q: "« Nous nous reposons. »", ans: "Wir ruhen uns aus", tip: "sich ausruhen — uns." },
    ],
  },

  // ===== B1 =====
  b1_u5_l1: {
    vocab: [
      { de: "war gefahren", fr: "était parti(e) (en voiture)", ar: "كان قد سافر", ex: "Er war nach Köln gefahren." },
      { de: "schon", fr: "déjà", ar: "مسبقًا", ex: "Ich hatte schon gegessen." },
      { de: "noch nicht", fr: "pas encore", ar: "ليس بعد", ex: "Wir waren noch nicht angekommen." },
    ],
    exercises: [
      { type: "qcm", q: "Auxiliaire au Plusquamperfekt avec 'fahren' ?", opts: ["hatte","war","wurde","ist"], ans: 1, tip: "Mouvement → war." },
      { type: "translate", q: "« Après qu'il fut parti, j'ai téléphoné. »", ans: "Nachdem er gegangen war, rief ich an", tip: "Plusquamperfekt + Präteritum." },
      { type: "fill", q: "Bevor wir ankamen, ___ es schon angefangen.", ans: "hatte", tip: "Plusquamperfekt." },
    ],
  },
  b1_u6_l1: {
    vocab: [
      { de: "anstatt zu", fr: "au lieu de", ar: "بدل أن", ex: "Anstatt zu lernen, spielt er." },
      { de: "ohne dass", fr: "sans que", ar: "دون أن", ex: "Er ging, ohne dass ich es merkte." },
      { de: "es ist nötig", fr: "il est nécessaire", ar: "من الضروري", ex: "Es ist nötig zu üben." },
    ],
    exercises: [
      { type: "qcm", q: "Forme correcte : 'um die Prüfung ___'", opts: ["bestanden","zu bestehen","bestehen","besteht"], ans: 1, tip: "um…zu + Inf." },
      { type: "translate", q: "« Au lieu de dormir, il a appris. »", ans: "Statt zu schlafen, hat er gelernt", tip: "statt…zu + Inf." },
      { type: "fill", q: "Es ist wichtig, jeden Tag ___ üben.", ans: "zu", tip: "infinitif avec zu." },
    ],
  },
  b1_u7_l1: {
    vocab: [
      { de: "anstatt", fr: "au lieu de", ar: "بدل", ex: "Anstatt eines Buches." },
      { de: "innerhalb", fr: "à l'intérieur de", ar: "داخل", ex: "Innerhalb der Stadt." },
      { de: "außerhalb", fr: "en dehors de", ar: "خارج", ex: "Außerhalb der Arbeit." },
    ],
    exercises: [
      { type: "qcm", q: "« ___ des Wetters bleiben wir. » (à cause de)", opts: ["Wegen","Trotz","Statt","Während"], ans: 0, tip: "wegen = à cause de." },
      { type: "fill", q: "Während ___ Sommers (article).", ans: "des", tip: "Gen masc → des." },
      { type: "translate", q: "« Malgré la pluie, je sors. »", ans: "Trotz des Regens gehe ich raus", tip: "trotz + Gen." },
    ],
  },
  b1_u8_l1: {
    vocab: [
      { de: "denn", fr: "car", ar: "لأنّ (تعطف)", ex: "Ich bleibe, denn ich bin müde." },
      { de: "obwohl", fr: "bien que", ar: "رغم أن", ex: "Obwohl es regnet, gehe ich." },
      { de: "darum", fr: "c'est pourquoi", ar: "لذلك", ex: "Es ist spät, darum gehe ich." },
    ],
    exercises: [
      { type: "qcm", q: "Place du verbe avec 'obwohl' ?", opts: ["Position 2","À la fin","Position 1","Libre"], ans: 1, tip: "Subordonnant." },
      { type: "translate", q: "« Bien qu'il pleuve, je sors. »", ans: "Obwohl es regnet, gehe ich raus", tip: "Verbe à la fin." },
      { type: "fill", q: "Es ist kalt, ___ ziehe ich einen Mantel an.", ans: "deshalb", tip: "conséquence." },
    ],
  },
  b1_u9_l1: {
    vocab: [
      { de: "heißer Tee", fr: "thé chaud", ar: "شاي ساخن", ex: "Ich trinke heißen Tee." },
      { de: "kaltes Wasser", fr: "eau froide", ar: "ماء بارد", ex: "Gib mir kaltes Wasser." },
      { de: "mit gutem Wein", fr: "avec un bon vin", ar: "مع نبيذ جيد", ex: "Wir essen mit gutem Wein." },
    ],
    exercises: [
      { type: "fill", q: "kalt___ Bier (Nom)", ans: "es", tip: "Neutre Nom → -es." },
      { type: "qcm", q: "« mit gut___ Wein » (Dat masc)", opts: ["em","en","er","es"], ans: 0, tip: "Dat masc → -em." },
      { type: "translate", q: "« J'aime le café chaud. »", ans: "Ich mag heißen Kaffee", tip: "Akk masc → -en." },
    ],
  },
  b1_u10_l1: {
    vocab: [
      { de: "lassen + Inf.", fr: "faire faire", ar: "يجعل/يدع يفعل", ex: "Ich lasse das Auto reparieren." },
      { de: "stehen lassen", fr: "laisser (en place)", ar: "يترك", ex: "Lass die Tasche stehen." },
      { de: "fallen lassen", fr: "laisser tomber", ar: "يُسقط", ex: "Er hat das Glas fallen lassen." },
    ],
    exercises: [
      { type: "qcm", q: "« Ich ___ mein Handy reparieren. »", opts: ["mache","lasse","gebe","habe"], ans: 1, tip: "lassen factitif." },
      { type: "translate", q: "« Laisse-moi tranquille ! »", ans: "Lass mich in Ruhe", tip: "lassen impératif." },
      { type: "fill", q: "Sie ___ die Haare schneiden.", ans: "lässt", tip: "3e pers sg." },
    ],
  },

  // ===== B2 =====
  b2_u5_l1: {
    vocab: [
      { de: "wäre gewesen", fr: "aurait été", ar: "كان سيكون", ex: "Es wäre besser gewesen." },
      { de: "hätte gemacht", fr: "aurait fait", ar: "كان قد فعل", ex: "Ich hätte es gemacht." },
      { de: "beinahe", fr: "presque", ar: "تقريبًا", ex: "Ich wäre beinahe gefallen." },
    ],
    exercises: [
      { type: "qcm", q: "Forme : « Ich ___ es gemacht. » (regret)", opts: ["habe","hätte","wäre","würde"], ans: 1, tip: "Konj II passé." },
      { type: "translate", q: "« À ta place, je serais resté. »", ans: "An deiner Stelle wäre ich geblieben", tip: "wäre + Partizip." },
      { type: "fill", q: "Wenn er gewusst ___, wäre er gekommen.", ans: "hätte", tip: "Konj II." },
    ],
  },
  b2_u6_l1: {
    vocab: [
      { de: "dürfte", fr: "il se peut que", ar: "ربّما", ex: "Er dürfte zu Hause sein." },
      { de: "mag … sein", fr: "il se peut", ar: "قد يكون", ex: "Das mag wahr sein." },
      { de: "soll … haben", fr: "on dit qu'il a", ar: "يُقال إنه يملك", ex: "Er soll viel Geld haben." },
    ],
    exercises: [
      { type: "qcm", q: "« Er ___ Millionär sein. » (prétend)", opts: ["soll","will","muss","kann"], ans: 1, tip: "wollen subjectif = prétendre." },
      { type: "translate", q: "« Il doit être chez lui (forte certitude). »", ans: "Er muss zu Hause sein", tip: "müssen subjectif." },
      { type: "fill", q: "Das ___ wahr sein. (peut-être)", ans: "kann", tip: "können subjectif." },
    ],
  },
  b2_u7_l1: {
    vocab: [
      { de: "ist erledigt", fr: "est réglé", ar: "تمّ إنجازه", ex: "Die Aufgabe ist erledigt." },
      { de: "ist verkauft", fr: "est vendu", ar: "مباع", ex: "Das Auto ist verkauft." },
      { de: "wird verkauft", fr: "est vendu (action)", ar: "يُباع", ex: "Das Haus wird verkauft." },
    ],
    exercises: [
      { type: "qcm", q: "État/résultat → quel auxiliaire ?", opts: ["werden","sein","haben","bleiben"], ans: 1, tip: "Zustandspassiv = sein." },
      { type: "translate", q: "« Le travail est fait (état). »", ans: "Die Arbeit ist gemacht", tip: "sein + Partizip." },
      { type: "fill", q: "Die Tür ___ gerade geöffnet. (action)", ans: "wird", tip: "werden = action." },
    ],
  },
  b2_u8_l1: {
    vocab: [
      { de: "davon", fr: "de cela", ar: "عن ذلك", ex: "Ich spreche davon." },
      { de: "wofür", fr: "pour quoi", ar: "لماذا/لأجل ماذا", ex: "Wofür ist das?" },
      { de: "darüber", fr: "à ce sujet", ar: "حول ذلك", ex: "Wir reden darüber." },
    ],
    exercises: [
      { type: "qcm", q: "« ___ wartest du? » (sur quoi)", opts: ["Worauf","Wofür","Wovon","Womit"], ans: 0, tip: "warten auf → worauf." },
      { type: "translate", q: "« Cela dépend de toi. »", ans: "Das hängt von dir ab", tip: "abhängen von." },
      { type: "fill", q: "Ich denke oft ___. (à cela)", ans: "daran", tip: "denken an → daran." },
    ],
  },
  b2_u9_l1: {
    vocab: [
      { de: "verantwortlich für", fr: "responsable de", ar: "مسؤول عن", ex: "Er ist verantwortlich für das Projekt." },
      { de: "interessiert an", fr: "intéressé par", ar: "مهتم بـ", ex: "Sie ist interessiert an Kunst." },
      { de: "verheiratet mit", fr: "marié à", ar: "متزوج من", ex: "Er ist verheiratet mit Anna." },
    ],
    exercises: [
      { type: "qcm", q: "« Sie ist interessiert ___ Musik. »", opts: ["an","auf","für","von"], ans: 0, tip: "interessiert + an + Dat." },
      { type: "translate", q: "« Je suis fier de toi. »", ans: "Ich bin stolz auf dich", tip: "stolz auf + Akk." },
      { type: "fill", q: "Wir sind abhängig ___ dem Wetter.", ans: "von", tip: "abhängig + von + Dat." },
    ],
  },
  b2_u10_l1: {
    vocab: [
      { de: "infolgedessen", fr: "par conséquent", ar: "بناءً على ذلك", ex: "Es regnete; infolgedessen blieben wir zu Hause." },
      { de: "dennoch", fr: "néanmoins", ar: "ومع ذلك", ex: "Es war schwer, dennoch hat er es geschafft." },
      { de: "ferner", fr: "en outre", ar: "علاوة على ذلك", ex: "Ferner muss man beachten…" },
    ],
    exercises: [
      { type: "qcm", q: "« ___ es kalt war, ___ war es sonnig. »", opts: ["Zwar/aber","Weil/aber","Ob/und","Damit/aber"], ans: 0, tip: "zwar…aber." },
      { type: "translate", q: "« Non seulement intelligent, mais aussi gentil. »", ans: "Nicht nur klug, sondern auch nett", tip: "nicht nur…sondern auch." },
      { type: "fill", q: "Je mehr man übt, ___ besser wird man.", ans: "desto", tip: "je…desto." },
    ],
  },
};

// Apply once at module load (singleton).
let applied = false;
export function applyExtras() {
  if (applied) return;
  applied = true;
  const all = [...UNITS_A2, ...UNITS_B1, ...UNITS_B2];
  for (const u of all) {
    for (const l of u.lessons) {
      const pack = EXTRA_PACKS[l.id];
      if (!pack) continue;
      if (pack.vocab) l.vocab.push(...pack.vocab);
      if (pack.exercises) l.exercises.push(...pack.exercises);
    }
  }
}
applyExtras();
