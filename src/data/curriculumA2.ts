// Curriculum A2 — DE/FR/AR
// Structure identique à A1 (curriculum.ts) pour réutiliser toute la UI Phase 3.
import type { Unit } from "./curriculum";
import { NETZWERK_A2 } from "./netzwerkA2";

const UNITS_A2_BASE: Unit[] = [
  {
    id: "a2_u1", title: "Perfekt — passé composé", titleAr: "الماضي المركّب",
    icon: "⏪", desc: "haben/sein + Partizip II", descAr: "تكوين الزمن الماضي المركّب",
    color: "#0ea5e9", level: "A2",
    lessons: [
      {
        id: "a2_u1_l1", title: "Construction du Perfekt", titleAr: "بناء الماضي المركّب",
        content: `**Perfekt = haben/sein (présent) + Partizip II (à la fin)**

• Verbes réguliers : ge + radical + (e)t → spielen → gespielt
• Verbes forts : ge + radical modifié + en → singen → gesungen
• Verbes en -ieren : pas de "ge-" → studieren → studiert
• Verbes inséparables (be-, ver-, ent-) : pas de "ge-" → besuchen → besucht

**Choisir HABEN ou SEIN ?**
• SEIN : verbes de mouvement (gehen, fahren, kommen) + changement d'état (werden, sterben, einschlafen)
• HABEN : tous les autres (transitifs, etc.)`,
        contentAr: `الماضي المركّب = haben أو sein + اسم المفعول في آخر الجملة.\nأفعال الحركة وتغيير الحالة تأخذ sein، والباقي haben.`,
        vocab: [
          { de: "gespielt", fr: "joué", ar: "لَعِبَ", ex: "Ich habe Fußball gespielt.", exAr: "لعبتُ كرة القدم." },
          { de: "gegangen", fr: "allé", ar: "ذهب", ex: "Wir sind nach Hause gegangen.", exAr: "ذهبنا إلى البيت." },
          { de: "gefahren", fr: "(s')est déplacé", ar: "سافر/قاد", ex: "Er ist nach Berlin gefahren." },
          { de: "gesehen", fr: "vu", ar: "رأى", ex: "Hast du den Film gesehen?" },
          { de: "gegessen", fr: "mangé", ar: "أكل", ex: "Wir haben Pizza gegessen." },
          { de: "getrunken", fr: "bu", ar: "شرب", ex: "Ich habe Kaffee getrunken." },
          { de: "gelesen", fr: "lu", ar: "قرأ", ex: "Sie hat ein Buch gelesen." },
          { de: "geschrieben", fr: "écrit", ar: "كتب", ex: "Ich habe eine E-Mail geschrieben." },
          { de: "studiert", fr: "étudié", ar: "درس (جامعة)", ex: "Er hat Medizin studiert." },
          { de: "besucht", fr: "visité", ar: "زار", ex: "Ich habe meine Oma besucht." },
        ],
        exercises: [
          { type: "qcm", q: "Quel auxiliaire avec 'gehen' ?", opts: ["haben", "sein", "werden", "tun"], ans: 1, tip: "Mouvement → sein.", qAr: "ما الفعل المساعد مع gehen؟", tipAr: "أفعال الحركة → sein" },
          { type: "fill", q: "Ich ___ Pizza gegessen.", ans: "habe", tip: "essen → haben." },
          { type: "translate", q: "« Hier soir, j'ai vu un film. »", ans: "Gestern Abend habe ich einen Film gesehen", tip: "Verbe conjugué en 2e position, Partizip à la fin." },
          { type: "qcm", q: "Partizip II de 'sprechen' ?", opts: ["gesprecht", "gesprochen", "gespricht", "sprechen"], ans: 1, tip: "Verbe fort." },
        ],
      },
      {
        id: "a2_u1_l2", title: "Verbes forts fréquents", titleAr: "الأفعال الشاذة الشائعة",
        content: `**Top 20 verbes forts (Infinitiv → Präteritum → Partizip II)**

• sein → war → gewesen
• haben → hatte → gehabt
• werden → wurde → geworden
• gehen → ging → gegangen
• kommen → kam → gekommen
• fahren → fuhr → gefahren
• sehen → sah → gesehen
• essen → aß → gegessen
• trinken → trank → getrunken
• schlafen → schlief → geschlafen`,
        vocab: [
          { de: "war", fr: "était", ar: "كان", ex: "Ich war müde." },
          { de: "hatte", fr: "avait", ar: "كان لديه", ex: "Er hatte Hunger." },
          { de: "wurde", fr: "devint", ar: "أصبح", ex: "Sie wurde Ärztin." },
          { de: "kam", fr: "vint", ar: "أتى", ex: "Er kam spät." },
          { de: "schlief", fr: "dormait", ar: "نام", ex: "Das Kind schlief." },
          { de: "fand", fr: "trouvait", ar: "وجد", ex: "Ich fand das gut." },
          { de: "gab", fr: "donnait", ar: "أعطى", ex: "Er gab mir Geld." },
          { de: "nahm", fr: "prenait", ar: "أخذ", ex: "Sie nahm den Bus." },
        ],
        exercises: [
          { type: "qcm", q: "Präteritum de 'haben' ?", opts: ["habte", "hatte", "hat", "habe"], ans: 1, tip: "hatte." },
          { type: "fill", q: "Gestern ___ ich krank. (sein)", ans: "war", tip: "sein → war." },
          { type: "translate", q: "« Il est venu à 8 heures. »", ans: "Er ist um acht Uhr gekommen", tip: "kommen → sein + gekommen." },
        ],
      },
    ],
  },
  {
    id: "a2_u2", title: "Modalverben — verbes modaux", titleAr: "الأفعال الناقصة",
    icon: "🔧", desc: "können, müssen, dürfen, sollen, wollen, mögen", descAr: "الأفعال الناقصة الستة",
    color: "#8b5cf6", level: "A2",
    lessons: [
      {
        id: "a2_u2_l1", title: "Les 6 modaux + structure", titleAr: "الأفعال الناقصة الستة",
        content: `**Structure : modal conjugué (pos. 2) + verbe à l'infinitif (à la fin)**

• können = pouvoir (capacité)
• müssen = devoir (obligation)
• dürfen = avoir le droit (permission)
• sollen = devoir (conseil/ordre extérieur)
• wollen = vouloir
• mögen / möchten = aimer / aimerais

Ex : Ich **kann** Deutsch **sprechen**. → Je peux parler allemand.`,
        vocab: [
          { de: "können", fr: "pouvoir", ar: "يستطيع", ex: "Ich kann schwimmen." },
          { de: "müssen", fr: "devoir", ar: "يجب", ex: "Du musst lernen." },
          { de: "dürfen", fr: "avoir le droit", ar: "يُسمح", ex: "Darf ich rauchen?" },
          { de: "sollen", fr: "être censé", ar: "يجب (نصيحة)", ex: "Du sollst mehr trinken." },
          { de: "wollen", fr: "vouloir", ar: "يريد", ex: "Ich will nach Berlin." },
          { de: "möchten", fr: "aimerais", ar: "أودّ", ex: "Ich möchte Tee." },
        ],
        exercises: [
          { type: "qcm", q: "« Ich ___ Deutsch sprechen. » (capacité)", opts: ["muss", "kann", "darf", "soll"], ans: 1, tip: "können = pouvoir/capacité." },
          { type: "fill", q: "Ich ___ jetzt nach Hause gehen. (devoir)", ans: "muss", tip: "müssen 1ère pers = muss." },
          { type: "translate", q: "« Puis-je ouvrir la fenêtre ? »", ans: "Darf ich das Fenster öffnen", tip: "Permission → dürfen." },
        ],
      },
    ],
  },
  {
    id: "a2_u3", title: "Subordonnées — weil/dass/wenn", titleAr: "الجمل التابعة",
    icon: "🔗", desc: "Verbe à la fin", descAr: "الفعل في نهاية الجملة التابعة",
    color: "#10b981", level: "A2",
    lessons: [
      {
        id: "a2_u3_l1", title: "weil, dass, wenn", titleAr: "weil / dass / wenn",
        content: `**Conjonction de subordination → verbe à la FIN**

• weil = parce que → Ich lerne Deutsch, **weil** ich in Berlin **wohne**.
• dass = que → Ich denke, **dass** das gut **ist**.
• wenn = si/quand → **Wenn** es regnet, bleibe ich zu Hause.
• ob = si (interrogatif) → Ich weiß nicht, **ob** er **kommt**.`,
        vocab: [
          { de: "weil", fr: "parce que", ar: "لأن", ex: "Ich bleibe, weil ich krank bin." },
          { de: "dass", fr: "que", ar: "أن", ex: "Ich glaube, dass er kommt." },
          { de: "wenn", fr: "quand/si", ar: "إذا/عندما", ex: "Wenn ich Zeit habe, lese ich." },
          { de: "ob", fr: "si (question)", ar: "إن كان", ex: "Ich frage, ob du kommst." },
        ],
        exercises: [
          { type: "qcm", q: "Place du verbe après 'weil' ?", opts: ["Position 1", "Position 2", "À la fin", "N'importe où"], ans: 2, tip: "Subordonnée → verbe à la fin." },
          { type: "translate", q: "« Je reste parce que je suis malade. »", ans: "Ich bleibe, weil ich krank bin", tip: "Verbe 'bin' à la fin." },
        ],
      },
    ],
  },
  {
    id: "a2_u4", title: "Adjectifs — déclinaison de base", titleAr: "تصريف الصفات",
    icon: "🎨", desc: "Après der/die/das et ein/eine", descAr: "بعد أدوات التعريف والتنكير",
    color: "#f59e0b", level: "A2",
    lessons: [
      {
        id: "a2_u4_l1", title: "Déclinaison faible (der/die/das)", titleAr: "التصريف الضعيف",
        content: `**Après l'article défini, l'adjectif prend -e ou -en**

| Cas | M (der) | F (die) | N (das) | Pl (die) |
|-----|---------|---------|---------|----------|
| Nom | -e      | -e      | -e      | -en      |
| Akk | -en     | -e      | -e      | -en      |
| Dat | -en     | -en     | -en     | -en      |

Ex : der **groß**e Mann, die **schön**e Frau, das **klein**e Kind, die **neu**en Bücher.`,
        vocab: [
          { de: "groß", fr: "grand", ar: "كبير", ex: "der große Mann" },
          { de: "klein", fr: "petit", ar: "صغير", ex: "das kleine Kind" },
          { de: "schön", fr: "beau", ar: "جميل", ex: "die schöne Frau" },
          { de: "neu", fr: "nouveau", ar: "جديد", ex: "das neue Buch" },
          { de: "alt", fr: "vieux", ar: "قديم", ex: "der alte Mann" },
        ],
        exercises: [
          { type: "fill", q: "der groß___ Mann (Nom)", ans: "e", tip: "Masculin Nom → -e." },
          { type: "fill", q: "die schön___ Frau (Akk)", ans: "e", tip: "Féminin Akk → -e." },
          { type: "qcm", q: "« das klein__ Kind » (Nom)", opts: ["e", "en", "er", "es"], ans: 0, tip: "Neutre Nom → -e." },
        ],
      },
    ],
  },
  {
    id: "a2_u5", title: "Comparatif & superlatif", titleAr: "المقارنة والتفضيل",
    icon: "📊", desc: "größer als, am größten", descAr: "صيغ المقارنة والتفضيل",
    color: "#22c55e", level: "A2",
    lessons: [{
      id: "a2_u5_l1", title: "Comparer", titleAr: "المقارنة",
      content: `**Comparatif** : adjectif + -er + als → Anna ist **größer als** Tom.\n**Superlatif** : am + adjectif + -sten → Sie ist **am größten**.\nIrréguliers : gut → besser → am besten ; viel → mehr → am meisten ; gern → lieber → am liebsten.`,
      contentAr: `المقارن: صفة + -er + als. التفضيل: am + صفة + -sten. شواذ: gut/besser/am besten.`,
      vocab: [
        { de: "größer", fr: "plus grand", ar: "أكبر", ex: "Er ist größer als ich." },
        { de: "kleiner", fr: "plus petit", ar: "أصغر", ex: "Mein Bruder ist kleiner." },
        { de: "besser", fr: "meilleur", ar: "أفضل", ex: "Heute ist es besser." },
        { de: "am besten", fr: "le mieux", ar: "الأفضل", ex: "Sie singt am besten." },
        { de: "mehr", fr: "plus", ar: "أكثر", ex: "Ich brauche mehr Zeit." },
        { de: "am liebsten", fr: "préféré", ar: "الأحبّ", ex: "Am liebsten esse ich Pizza." },
      ],
      exercises: [
        { type: "fill", q: "Anna ist ___ als Tom. (alt)", ans: "älter", tip: "Umlaut + -er." },
        { type: "qcm", q: "Superlatif de 'gut' ?", opts: ["am gutesten","am besten","am bester","am gut"], ans: 1, tip: "Irrégulier." },
        { type: "translate", q: "« Berlin est plus grand que Munich. »", ans: "Berlin ist größer als München", tip: "comparatif + als" },
      ],
    }],
  },
  {
    id: "a2_u6", title: "Prépositions Wechselpräpositionen", titleAr: "حروف الجرّ المتغيّرة",
    icon: "🧭", desc: "in/an/auf + Akk ou Dat", descAr: "حسب الحركة أو السكون",
    color: "#a855f7", level: "A2",
    lessons: [{
      id: "a2_u6_l1", title: "Mouvement vs position", titleAr: "حركة أم سكون",
      content: `**Wohin? → Akkusativ** (mouvement) : Ich gehe **in die** Schule.\n**Wo? → Dativ** (position) : Ich bin **in der** Schule.\nLes 9 prépos : an, auf, hinter, in, neben, über, unter, vor, zwischen.`,
      vocab: [
        { de: "in die Stadt", fr: "en ville (vers)", ar: "إلى المدينة", ex: "Ich fahre in die Stadt." },
        { de: "in der Stadt", fr: "en ville (à)", ar: "في المدينة", ex: "Ich bin in der Stadt." },
        { de: "auf den Tisch", fr: "sur la table (vers)", ar: "على الطاولة (حركة)", ex: "Ich lege es auf den Tisch." },
        { de: "auf dem Tisch", fr: "sur la table (à)", ar: "على الطاولة (سكون)", ex: "Es liegt auf dem Tisch." },
        { de: "neben", fr: "à côté de", ar: "بجانب", ex: "Neben dem Bett." },
        { de: "zwischen", fr: "entre", ar: "بين", ex: "Zwischen den Häusern." },
      ],
      exercises: [
        { type: "qcm", q: "Ich gehe ___ Kino.", opts: ["in dem","ins","im","in den"], ans: 1, tip: "Wohin → Akk → ins." },
        { type: "fill", q: "Das Buch liegt auf ___ Tisch.", ans: "dem", tip: "Wo? → Dat masc → dem." },
      ],
    }],
  },
  {
    id: "a2_u7", title: "Pronoms personnels Akk/Dat", titleAr: "الضمائر في النصب والمجرور",
    icon: "👥", desc: "mich/mir, dich/dir…", descAr: "صور الضمائر",
    color: "#ef4444", level: "A2",
    lessons: [{
      id: "a2_u7_l1", title: "Tableau complet", titleAr: "الجدول الكامل",
      content: `| Nom | Akk | Dat |\n|-----|-----|-----|\n| ich | mich | mir |\n| du  | dich | dir |\n| er/sie/es | ihn/sie/es | ihm/ihr/ihm |\n| wir | uns | uns |\n| ihr | euch | euch |\n| sie/Sie | sie/Sie | ihnen/Ihnen |`,
      vocab: [
        { de: "mich", fr: "me", ar: "ـي", ex: "Er sieht mich." },
        { de: "mir", fr: "à moi", ar: "لي", ex: "Er gibt mir das Buch." },
        { de: "ihn", fr: "le", ar: "ـه", ex: "Ich sehe ihn." },
        { de: "ihr", fr: "lui (à elle)", ar: "لها", ex: "Ich helfe ihr." },
        { de: "uns", fr: "nous", ar: "نا", ex: "Er ruft uns an." },
        { de: "ihnen", fr: "leur", ar: "لهم", ex: "Ich danke ihnen." },
      ],
      exercises: [
        { type: "qcm", q: "Er hilft ___. (moi)", opts: ["mich","mir","ich","meiner"], ans: 1, tip: "helfen + Dat." },
        { type: "fill", q: "Ich sehe ___ (lui).", ans: "ihn", tip: "Akk masculin." },
        { type: "translate", q: "« Il me donne le livre. »", ans: "Er gibt mir das Buch", tip: "geben + Dat + Akk." },
      ],
    }],
  },
  {
    id: "a2_u8", title: "Futur I — werden + infinitif", titleAr: "المستقبل",
    icon: "🚀", desc: "Prédiction et intention", descAr: "التنبّؤ والنيّة",
    color: "#06b6d4", level: "A2",
    lessons: [{
      id: "a2_u8_l1", title: "Construire le Futur I", titleAr: "بناء المستقبل",
      content: `**Futur I = werden (conjugué) + infinitif (à la fin)**\nIch **werde** morgen nach Berlin **fahren**.\nSouvent remplacé par le présent + adverbe (morgen, bald).`,
      vocab: [
        { de: "ich werde", fr: "je vais (futur)", ar: "سأ", ex: "Ich werde lernen." },
        { de: "du wirst", fr: "tu vas", ar: "سـ(أنت)", ex: "Du wirst sehen." },
        { de: "er/sie wird", fr: "il/elle va", ar: "سيـ/ستـ", ex: "Sie wird kommen." },
        { de: "wir werden", fr: "nous allons", ar: "سنـ", ex: "Wir werden gewinnen." },
        { de: "morgen", fr: "demain", ar: "غدًا", ex: "Morgen werde ich arbeiten." },
        { de: "bald", fr: "bientôt", ar: "قريبًا", ex: "Bald wird es regnen." },
      ],
      exercises: [
        { type: "fill", q: "Ich ___ morgen kommen.", ans: "werde", tip: "1ère pers. sg." },
        { type: "translate", q: "« Demain, il va pleuvoir. »", ans: "Morgen wird es regnen", tip: "wird + infinitif." },
      ],
    }],
  },
  {
    id: "a2_u9", title: "Verbes à préposition", titleAr: "أفعال مع حرف جرّ",
    icon: "🔗", desc: "warten auf, denken an…", descAr: "أفعال ثابتة مع حرف",
    color: "#84cc16", level: "A2",
    lessons: [{
      id: "a2_u9_l1", title: "Liste essentielle", titleAr: "قائمة أساسية",
      content: `Apprendre le verbe **avec** sa préposition + cas :\n• warten **auf** + Akk (attendre)\n• denken **an** + Akk (penser à)\n• sich freuen **auf** + Akk (se réjouir de)\n• sich interessieren **für** + Akk\n• Angst haben **vor** + Dat\n• helfen **bei** + Dat`,
      vocab: [
        { de: "warten auf", fr: "attendre", ar: "ينتظر", ex: "Ich warte auf den Bus." },
        { de: "denken an", fr: "penser à", ar: "يفكّر في", ex: "Ich denke an dich." },
        { de: "sich freuen auf", fr: "se réjouir de", ar: "يتشوّق إلى", ex: "Ich freue mich auf das Wochenende." },
        { de: "sich interessieren für", fr: "s'intéresser à", ar: "يهتمّ بـ", ex: "Er interessiert sich für Musik." },
        { de: "Angst haben vor", fr: "avoir peur de", ar: "يخاف من", ex: "Sie hat Angst vor Hunden." },
        { de: "helfen bei", fr: "aider pour", ar: "يساعد في", ex: "Er hilft mir bei den Hausaufgaben." },
      ],
      exercises: [
        { type: "qcm", q: "Ich warte ___ den Bus.", opts: ["an","auf","für","mit"], ans: 1, tip: "warten + auf + Akk." },
        { type: "fill", q: "Sie hat Angst ___ Spinnen.", ans: "vor", tip: "Angst haben vor + Dat." },
      ],
    }],
  },
  {
    id: "a2_u10", title: "Reflexive Verben", titleAr: "الأفعال الانعكاسية",
    icon: "🪞", desc: "sich waschen, sich freuen…", descAr: "أفعال مع ضمير انعكاسي",
    color: "#ec4899", level: "A2",
    lessons: [{
      id: "a2_u10_l1", title: "Pronoms réfléchis", titleAr: "الضمائر الانعكاسية",
      content: `**Akkusativ** : mich, dich, sich, uns, euch, sich.\n**Dativ** (quand il y a un COD) : mir, dir, sich, uns, euch, sich.\nEx : Ich wasche **mich** (Akk). Ich wasche **mir** die Hände (Dat + Akk).`,
      vocab: [
        { de: "sich waschen", fr: "se laver", ar: "يغتسل", ex: "Ich wasche mich." },
        { de: "sich freuen", fr: "se réjouir", ar: "يفرح", ex: "Wir freuen uns." },
        { de: "sich setzen", fr: "s'asseoir", ar: "يجلس", ex: "Setz dich!" },
        { de: "sich ausruhen", fr: "se reposer", ar: "يستريح", ex: "Ich ruhe mich aus." },
        { de: "sich anziehen", fr: "s'habiller", ar: "يلبس", ex: "Sie zieht sich an." },
        { de: "sich treffen", fr: "se rencontrer", ar: "يلتقي", ex: "Wir treffen uns morgen." },
      ],
      exercises: [
        { type: "fill", q: "Ich wasche ___ die Hände.", ans: "mir", tip: "Dat + COD." },
        { type: "qcm", q: "Wir freuen ___.", opts: ["mich","uns","sich","euch"], ans: 1, tip: "1ère pers. plur." },
      ],
    }],
  },
];

export const UNITS_A2: import("./curriculum").Unit[] = [...UNITS_A2_BASE, ...NETZWERK_A2];
