// Curriculum B1 — DE/FR/AR
import type { Unit } from "./curriculum";
import { NETZWERK_B1 } from "./netzwerkB1";

const UNITS_B1_BASE: Unit[] = [
  {
    id: "b1_u1", title: "Präteritum — récit littéraire", titleAr: "الماضي البسيط",
    icon: "📜", desc: "Conjugaison forte/faible au passé simple", descAr: "الماضي السردي",
    color: "#0ea5e9", level: "B1",
    lessons: [
      {
        id: "b1_u1_l1", title: "Formation et usage", titleAr: "التكوين والاستعمال",
        content: `**Präteritum** = passé écrit (presse, romans, biographies).

• Faibles : -te → ich lernte, du lerntest, er lernte
• Forts : changement de voyelle → ich ging, du gingst, er ging
• Modaux : ich konnte, musste, durfte, sollte, wollte, mochte

À l'oral, on préfère le **Perfekt**, sauf avec sein/haben/modaux qui restent au Präteritum.`,
        vocab: [
          { de: "lernte", fr: "apprenait", ar: "كان يتعلم", ex: "Er lernte Deutsch." },
          { de: "ging", fr: "allait", ar: "ذهب", ex: "Sie ging spazieren." },
          { de: "konnte", fr: "pouvait", ar: "استطاع", ex: "Ich konnte nicht schlafen." },
          { de: "wollte", fr: "voulait", ar: "أراد", ex: "Er wollte helfen." },
          { de: "musste", fr: "devait", ar: "كان عليه", ex: "Wir mussten warten." },
        ],
        exercises: [
          { type: "qcm", q: "Präteritum de 'können' (ich) ?", opts: ["kannte", "konnte", "könnte", "kunnte"], ans: 1, tip: "konnte." },
          { type: "translate", q: "« Il alla à Berlin. »", ans: "Er ging nach Berlin", tip: "gehen → ging." },
        ],
      },
    ],
  },
  {
    id: "b1_u2", title: "Konjunktiv II — politesse & hypothèse", titleAr: "صيغة الشرط",
    icon: "💭", desc: "würde + infinitif, hätte, wäre, könnte", descAr: "التهذيب والافتراض",
    color: "#8b5cf6", level: "B1",
    lessons: [
      {
        id: "b1_u2_l1", title: "Hypothèse irréelle", titleAr: "الافتراض غير الواقعي",
        content: `**Konjunktiv II** = irréel, souhait, politesse.

• Forme courante : **würde** + infinitif → Ich würde gerne kommen.
• Verbes essentiels : wäre (sein), hätte (haben), könnte (können), müsste, sollte, wollte, möchte.

Ex : Wenn ich Zeit **hätte**, **würde** ich kommen.`,
        vocab: [
          { de: "würde", fr: "(au conditionnel)", ar: "(للشرط)", ex: "Ich würde gerne reisen." },
          { de: "hätte", fr: "aurais", ar: "لو كان لديّ", ex: "Wenn ich Geld hätte..." },
          { de: "wäre", fr: "serais", ar: "لو كنتُ", ex: "Das wäre schön." },
          { de: "könnte", fr: "pourrais", ar: "لو أستطيع", ex: "Könnten Sie helfen?" },
        ],
        exercises: [
          { type: "translate", q: "« Si j'avais le temps, je viendrais. »", ans: "Wenn ich Zeit hätte, würde ich kommen", tip: "hätte + würde + Infinitiv." },
          { type: "qcm", q: "Forme polie de 'kannst du' ?", opts: ["könnst du", "könntest du", "konntest du", "kannst du bitte"], ans: 1, tip: "Konj. II → könntest." },
        ],
      },
    ],
  },
  {
    id: "b1_u3", title: "Passif — Vorgangspassiv", titleAr: "المبني للمجهول",
    icon: "🔄", desc: "werden + Partizip II", descAr: "تكوين المبني للمجهول",
    color: "#10b981", level: "B1",
    lessons: [
      {
        id: "b1_u3_l1", title: "Passif présent et passé", titleAr: "حاضر وماضي المجهول",
        content: `**Passif d'action : werden + Partizip II**

• Présent : Das Haus **wird** gebaut. (La maison est construite.)
• Prétérit : Das Haus **wurde** gebaut.
• Perfekt : Das Haus **ist** gebaut **worden**. (worden, pas geworden!)

Agent introduit par **von** (personne) ou **durch** (moyen).`,
        vocab: [
          { de: "wird gebaut", fr: "est construit(e)", ar: "يُبنى", ex: "Das Haus wird gebaut." },
          { de: "wurde geöffnet", fr: "fut ouvert", ar: "فُتح", ex: "Die Tür wurde geöffnet." },
          { de: "von", fr: "par (personne)", ar: "من قِبَل", ex: "Das Buch wird von Anna gelesen." },
          { de: "durch", fr: "par (moyen)", ar: "عبر", ex: "Die Stadt wurde durch Feuer zerstört." },
        ],
        exercises: [
          { type: "translate", q: "« La lettre est écrite par Anna. »", ans: "Der Brief wird von Anna geschrieben", tip: "wird + Partizip + von." },
          { type: "qcm", q: "Passif passé : « Le mur ___ gebaut worden. »", opts: ["hat", "ist", "wird", "war"], ans: 1, tip: "Passif Perfekt → ist + Partizip + worden." },
        ],
      },
    ],
  },
  {
    id: "b1_u4", title: "Relatives — der/die/das pronoms", titleAr: "الجمل الموصولة",
    icon: "🪢", desc: "Pronoms relatifs et déclinaison", descAr: "الضمائر الموصولة",
    color: "#f59e0b", level: "B1",
    lessons: [
      {
        id: "b1_u4_l1", title: "Pronoms relatifs", titleAr: "الضمائر الموصولة",
        content: `**Pronom relatif = même forme que l'article défini, sauf Dat.Pl = denen et Gen.**

| | M | F | N | Pl |
|---|---|---|---|---|
| Nom | der | die | das | die |
| Akk | den | die | das | die |
| Dat | dem | der | dem | denen |

Le verbe va à la fin de la subordonnée relative.

Ex : Der Mann, **der** dort **steht**, ist mein Vater.`,
        vocab: [
          { de: "der", fr: "qui (M.Nom)", ar: "الذي", ex: "Der Mann, der kommt..." },
          { de: "die", fr: "qui (F/Pl.Nom)", ar: "التي/الذين", ex: "Die Frau, die singt..." },
          { de: "den", fr: "que (M.Akk)", ar: "الذي (مفعول)", ex: "Der Mann, den ich sehe..." },
          { de: "dem", fr: "à qui (M/N.Dat)", ar: "الذي له", ex: "Der Mann, dem ich helfe..." },
        ],
        exercises: [
          { type: "fill", q: "Der Film, ___ ich gesehen habe, war gut. (que)", ans: "den", tip: "Masculin Akk → den." },
          { type: "translate", q: "« La femme qui parle est ma mère. »", ans: "Die Frau, die spricht, ist meine Mutter", tip: "die (F.Nom) + verbe à la fin." },
        ],
      },
    ],
  },
  {
    id: "b1_u5", title: "Plusquamperfekt", titleAr: "الماضي السابق",
    icon: "⏮️", desc: "Action antérieure au passé", descAr: "حدث سابق لحدث ماضٍ",
    color: "#0ea5e9", level: "B1",
    lessons: [{
      id: "b1_u5_l1", title: "hatte/war + Partizip II", titleAr: "hatte/war + اسم المفعول",
      content: `**Plusquamperfekt = hatte/war (Präteritum) + Partizip II**\nSouvent avec **nachdem** : Nachdem ich gegessen hatte, ging ich schlafen.`,
      vocab: [
        { de: "hatte gegessen", fr: "avait mangé", ar: "كان قد أكل", ex: "Er hatte schon gegessen." },
        { de: "war gegangen", fr: "était allé", ar: "كان قد ذهب", ex: "Sie war nach Hause gegangen." },
        { de: "nachdem", fr: "après que", ar: "بعد أن", ex: "Nachdem er kam, aßen wir." },
        { de: "bevor", fr: "avant que", ar: "قبل أن", ex: "Bevor ich ging, rief ich an." },
      ],
      exercises: [
        { type: "fill", q: "Nachdem ich gegessen ___, ging ich schlafen.", ans: "hatte", tip: "Plusquamperfekt." },
        { type: "translate", q: "« Quand il est arrivé, j'étais déjà parti. »", ans: "Als er ankam, war ich schon weg", tip: "war + Partizip." },
      ],
    }],
  },
  {
    id: "b1_u6", title: "Infinitiv mit zu", titleAr: "المصدر مع zu",
    icon: "🎯", desc: "um…zu, ohne…zu, statt…zu", descAr: "بناءات المصدر",
    color: "#f59e0b", level: "B1",
    lessons: [{
      id: "b1_u6_l1", title: "Constructions infinitives", titleAr: "تراكيب المصدر",
      content: `**um…zu + Inf** = afin de · **ohne…zu + Inf** = sans · **statt…zu + Inf** = au lieu de.\nVirgule avant um/ohne/statt. Verbe à l'infinitif à la fin.`,
      vocab: [
        { de: "um zu lernen", fr: "afin d'apprendre", ar: "كي يتعلّم", ex: "Ich lerne, um zu bestehen." },
        { de: "ohne zu fragen", fr: "sans demander", ar: "دون أن يسأل", ex: "Er ging, ohne zu fragen." },
        { de: "statt zu schlafen", fr: "au lieu de dormir", ar: "بدل أن ينام", ex: "Statt zu schlafen, lernte er." },
        { de: "es ist wichtig", fr: "c'est important", ar: "من المهم", ex: "Es ist wichtig zu wissen." },
      ],
      exercises: [
        { type: "fill", q: "Ich lerne, ___ zu bestehen.", ans: "um", tip: "Afin de → um…zu." },
        { type: "translate", q: "« Il est parti sans dire au revoir. »", ans: "Er ging, ohne sich zu verabschieden", tip: "ohne + zu." },
      ],
    }],
  },
  {
    id: "b1_u7", title: "Prépositions + Genitiv", titleAr: "حروف الجرّ مع الإضافة",
    icon: "🧭", desc: "trotz, wegen, während", descAr: "حروف مع المضاف إليه",
    color: "#a855f7", level: "B1",
    lessons: [{
      id: "b1_u7_l1", title: "Génitif & alternatives", titleAr: "الإضافة والبدائل",
      content: `**+ Genitiv** : trotz, wegen, während, statt.\nÀ l'oral on entend souvent + Dativ : wegen dem Regen.\nEx : Trotz **des Regens** gehen wir spazieren.`,
      vocab: [
        { de: "trotz", fr: "malgré", ar: "رغم", ex: "Trotz des Wetters." },
        { de: "wegen", fr: "à cause de", ar: "بسبب", ex: "Wegen des Streiks." },
        { de: "während", fr: "pendant", ar: "خلال", ex: "Während des Unterrichts." },
        { de: "statt", fr: "au lieu de", ar: "بدل", ex: "Statt eines Geschenks." },
      ],
      exercises: [
        { type: "fill", q: "Trotz ___ Regens (article).", ans: "des", tip: "Gen. masc → des." },
        { type: "qcm", q: "Während ___ Pause.", opts: ["der","den","dem","des"], ans: 0, tip: "Gen. fém → der." },
      ],
    }],
  },
  {
    id: "b1_u8", title: "Konnektoren — deshalb, trotzdem", titleAr: "أدوات الربط",
    icon: "🔗", desc: "Cause, conséquence, opposition", descAr: "سبب ونتيجة وتضادّ",
    color: "#22c55e", level: "B1",
    lessons: [{
      id: "b1_u8_l1", title: "Position du verbe", titleAr: "موضع الفعل",
      content: `**deshalb / trotzdem / dann** = adverbes → verbe en 2e position.\n**weil / obwohl** = subordonnants → verbe à la fin.`,
      vocab: [
        { de: "deshalb", fr: "c'est pourquoi", ar: "لذلك", ex: "Es regnet, deshalb bleibe ich." },
        { de: "trotzdem", fr: "malgré tout", ar: "ومع ذلك", ex: "Es regnet, trotzdem gehe ich." },
        { de: "außerdem", fr: "en outre", ar: "علاوة على ذلك", ex: "Es ist teuer; außerdem ist es alt." },
        { de: "sonst", fr: "sinon", ar: "وإلا", ex: "Beeil dich, sonst kommst du zu spät." },
      ],
      exercises: [
        { type: "fill", q: "Es regnet, ___ bleibe ich zu Hause.", ans: "deshalb", tip: "cause→conséquence." },
        { type: "translate", q: "« Il pleut, malgré tout je sors. »", ans: "Es regnet, trotzdem gehe ich raus", tip: "Verbe en 2e." },
      ],
    }],
  },
  {
    id: "b1_u9", title: "Adjectifs forts (sans article)", titleAr: "تصريف الصفة بدون أداة",
    icon: "🧩", desc: "kalter Kaffee, gutes Wetter", descAr: "التصريف القوي",
    color: "#ef4444", level: "B1",
    lessons: [{
      id: "b1_u9_l1", title: "Terminaisons sans article", titleAr: "النهايات بدون أداة",
      content: `Sans article, l'adjectif prend la marque de l'article :\n| | M | F | N | Pl |\n|--|--|--|--|--|\n|Nom|-er|-e|-es|-e|\n|Akk|-en|-e|-es|-e|\n|Dat|-em|-er|-em|-en|`,
      vocab: [
        { de: "kalter Kaffee", fr: "café froid", ar: "قهوة باردة", ex: "Ich mag keinen kalten Kaffee." },
        { de: "gutes Wetter", fr: "beau temps", ar: "طقس جيد", ex: "Heute ist gutes Wetter." },
        { de: "frische Milch", fr: "lait frais", ar: "حليب طازج", ex: "Frische Milch ist gesund." },
      ],
      exercises: [
        { type: "fill", q: "gut___ Wetter (Nom)", ans: "es", tip: "Neutre Nom → -es." },
        { type: "qcm", q: "kalt___ Bier (Akk)", opts: ["e","es","en","er"], ans: 1, tip: "Neutre Akk → -es." },
      ],
    }],
  },
  {
    id: "b1_u10", title: "lassen — faire faire / laisser", titleAr: "lassen",
    icon: "🛠️", desc: "Ich lasse mein Auto reparieren", descAr: "أجعله يفعل / يدع",
    color: "#06b6d4", level: "B1",
    lessons: [{
      id: "b1_u10_l1", title: "Usages de lassen", titleAr: "استعمالات lassen",
      content: `**lassen + Inf** = faire faire (factitif) ou laisser/permettre.\nEx : Ich **lasse** mein Auto **reparieren**. Ich **lasse** dich **gehen**.`,
      vocab: [
        { de: "reparieren lassen", fr: "faire réparer", ar: "أرسله للتصليح", ex: "Ich lasse das Auto reparieren." },
        { de: "schneiden lassen", fr: "se faire couper", ar: "أحلق", ex: "Ich lasse mir die Haare schneiden." },
        { de: "lass mich!", fr: "laisse-moi!", ar: "دعني!", ex: "Lass mich in Ruhe!" },
      ],
      exercises: [
        { type: "fill", q: "Ich ___ mein Auto reparieren.", ans: "lasse", tip: "1ère pers. sg." },
        { type: "translate", q: "« Je me fais couper les cheveux. »", ans: "Ich lasse mir die Haare schneiden", tip: "lassen + Dat + Inf." },
      ],
    }],
  },
];

export const UNITS_B1: import("./curriculum").Unit[] = [...UNITS_B1_BASE, ...NETZWERK_B1];
