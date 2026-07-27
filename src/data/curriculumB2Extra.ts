// Enrichissement massif B2 — vocabulaire académique, exercices supplémentaires,
// unités bonus (Wissenschaft, Wirtschaft, Umweltdebatte, Digitale Welt).
// Sources : Goethe-Zertifikat B2, telc B2, Aspekte Neu B2, Sicher! B2,
// DW Nachrichten leicht, Deutsche Presse (SZ, ZEIT, FAZ).
// Import unique : `import "@/data/curriculumB2Extra";`

import type { Exercise, Unit, VocabItem } from "./curriculum";
import { UNITS_B2 } from "./curriculumB2";

type Pack = { vocab?: VocabItem[]; exercises?: Exercise[] };

// ============================================================
// PACKS D'ENRICHISSEMENT (b2_u1 → b2_u10)
// ============================================================
export const B2_EXTRA_PACKS: Record<string, Pack> = {
  b2_u1_l1: {
    vocab: [
      { de: "obwohl / obgleich", fr: "bien que", ar: "رغم أنّ", ex: "Obwohl es regnet, gehen wir raus." },
      { de: "trotz + Gen", fr: "malgré", ar: "رغم", ex: "Trotz der Kälte joggt er." },
      { de: "infolgedessen", fr: "par conséquent", ar: "بناءً على ذلك", ex: "Es hat geregnet, infolgedessen ist die Straße nass." },
      { de: "sodass", fr: "de sorte que", ar: "بحيث", ex: "Er sprach laut, sodass alle ihn hörten." },
      { de: "damit vs um … zu", fr: "pour que / pour", ar: "لكي", ex: "Ich lerne, damit ich bestehe. / Ich lerne, um zu bestehen." },
      { de: "zwar … aber", fr: "certes … mais", ar: "صحيح … ولكن", ex: "Er ist zwar klug, aber faul." },
      { de: "einerseits … andererseits", fr: "d'une part … d'autre part", ar: "من جهة … ومن جهة أخرى", ex: "Einerseits teuer, andererseits qualitativ." },
      { de: "je … desto", fr: "plus … plus", ar: "كلّما … كلّما", ex: "Je mehr ich lerne, desto besser verstehe ich." },
    ],
    exercises: [
      { type: "translate", q: "« Plus je lis, mieux je comprends. »", ans: "Je mehr ich lese, desto besser verstehe ich", tip: "je + comparatif, desto + comparatif inversé." },
      { type: "qcm", q: "'par conséquent' formel ?", opts: ["deshalb","infolgedessen","also","dann"], ans: 1, tip: "Registre soutenu." },
      { type: "fill", q: "Er sprach laut, ___ alle ihn hörten.", ans: "sodass", tip: "conséquence." },
    ],
  },
  b2_u2_l1: {
    vocab: [
      { de: "die Entwicklung", fr: "le développement", ar: "التطور", ex: "Die Entwicklung der Technik." },
      { de: "die Bedeutung", fr: "la signification", ar: "الأهمية/المعنى", ex: "Die Bedeutung dieses Wortes." },
      { de: "die Erforschung", fr: "la recherche", ar: "البحث/الاستكشاف", ex: "Die Erforschung des Weltalls." },
      { de: "die Verwendung", fr: "l'utilisation", ar: "الاستخدام", ex: "Die Verwendung von KI." },
      { de: "die Auswirkung", fr: "l'impact", ar: "التأثير", ex: "Die Auswirkungen des Klimawandels." },
      { de: "die Zunahme / Abnahme", fr: "augmentation / diminution", ar: "الزيادة/النقصان", ex: "Zunahme der Bevölkerung." },
      { de: "aufgrund + Gen", fr: "en raison de", ar: "بسبب", ex: "Aufgrund des Regens." },
      { de: "hinsichtlich + Gen", fr: "concernant", ar: "فيما يخصّ", ex: "Hinsichtlich der Kosten." },
    ],
    exercises: [
      { type: "translate", q: "« L'impact du changement climatique est énorme. »", ans: "Die Auswirkung des Klimawandels ist enorm", tip: "Nominalisation + Gen." },
      { type: "qcm", q: "Nom formé sur 'entwickeln' ?", opts: ["die Entwicklung","die Entwickelung","die Wicklung","die Entwickung"], ans: 0, tip: "-ung → die Entwicklung." },
    ],
  },
  b2_u3_l1: {
    vocab: [
      { de: "sagen, dass …", fr: "dire que", ar: "يقول إنّ", ex: "Er sagt, dass er komme." },
      { de: "er sei / habe", fr: "qu'il soit / ait (KI)", ar: "أنّه يكون/لديه", ex: "Er sagte, er sei müde." },
      { de: "er komme / gehe", fr: "qu'il vienne / aille", ar: "أنّه يأتي/يذهب", ex: "Sie meinte, er komme später." },
      { de: "laut + Dat/Gen", fr: "selon", ar: "بحسب", ex: "Laut dem Bericht steigen die Preise." },
      { de: "die Studie", fr: "l'étude", ar: "الدراسة", ex: "Eine neue Studie zeigt …" },
      { de: "der Bericht", fr: "le rapport", ar: "التقرير", ex: "Der Bericht wurde veröffentlicht." },
      { de: "behaupten", fr: "prétendre", ar: "يزعم", ex: "Er behauptet, unschuldig zu sein." },
      { de: "bestätigen", fr: "confirmer", ar: "يؤكد", ex: "Die Zeugen bestätigen die Aussage." },
    ],
    exercises: [
      { type: "translate", q: "« Selon l'étude, les prix augmentent. »", ans: "Laut der Studie steigen die Preise", tip: "laut + Dat/Gen + V2." },
      { type: "qcm", q: "Konjunktiv I de 'haben' 3.sg. ?", opts: ["habt","habe","hätte","hat"], ans: 1, tip: "er habe." },
      { type: "fill", q: "Er sagte, er ___ müde. (Konj.I sein)", ans: "sei", tip: "sein → sei." },
    ],
  },
  b2_u4_l1: {
    vocab: [
      { de: "der wartende Mann", fr: "l'homme qui attend", ar: "الرجل المنتظر", ex: "Der wartende Mann liest." },
      { de: "das gekaufte Buch", fr: "le livre acheté", ar: "الكتاب المشترى", ex: "Das gekaufte Buch ist teuer." },
      { de: "die zu lösende Aufgabe", fr: "la tâche à résoudre", ar: "المهمة الواجب حلّها", ex: "Die zu lösende Aufgabe ist schwierig." },
      { de: "das schlafende Kind", fr: "l'enfant qui dort", ar: "الطفل النائم", ex: "Das schlafende Kind lächelt." },
    ],
    exercises: [
      { type: "translate", q: "« Le problème à résoudre est complexe. »", ans: "Das zu lösende Problem ist komplex", tip: "zu + Partizip I." },
      { type: "qcm", q: "'l'homme qui rit' (Partizip I) ?", opts: ["der gelachte Mann","der lachende Mann","der lachte Mann","der lachen Mann"], ans: 1, tip: "-end + adj." },
    ],
  },
  b2_u5_l1: {
    vocab: [
      { de: "hätte gemacht", fr: "aurait fait", ar: "لكان قد فعل", ex: "Ich hätte das anders gemacht." },
      { de: "wäre gegangen", fr: "serait allé", ar: "لكان قد ذهب", ex: "Ich wäre früher gegangen." },
      { de: "hätte … sollen", fr: "aurait dû", ar: "كان يجب أن", ex: "Du hättest anrufen sollen." },
      { de: "hätte … können", fr: "aurait pu", ar: "كان بإمكانه", ex: "Ich hätte helfen können." },
    ],
    exercises: [
      { type: "translate", q: "« Tu aurais dû m'appeler. »", ans: "Du hättest mich anrufen sollen", tip: "hätte + inf + sollen." },
      { type: "fill", q: "Ich ___ das anders gemacht.", ans: "hätte", tip: "hätte + Partizip." },
    ],
  },
  b2_u6_l1: {
    vocab: [
      { de: "müssen (subjectif)", fr: "sûrement", ar: "لا بدّ", ex: "Er muss krank sein." },
      { de: "können (subjectif)", fr: "peut-être", ar: "قد يكون", ex: "Es kann sein, dass er kommt." },
      { de: "sollen (rumeur)", fr: "on dit que", ar: "يُقال إنّ", ex: "Er soll reich sein." },
      { de: "wollen (prétention)", fr: "prétendre", ar: "يزعم", ex: "Er will alles wissen." },
      { de: "mögen (probabilité)", fr: "il se peut", ar: "قد", ex: "Das mag stimmen." },
      { de: "dürfte (supposition polie)", fr: "devrait", ar: "من المرجّح", ex: "Er dürfte schon zu Hause sein." },
    ],
    exercises: [
      { type: "translate", q: "« On dit qu'il est riche. »", ans: "Er soll reich sein", tip: "sollen subjectif = rumeur." },
      { type: "qcm", q: "'il prétend savoir' ?", opts: ["Er soll wissen","Er will wissen","Er muss wissen","Er darf wissen"], ans: 1, tip: "wollen subjectif." },
    ],
  },
  b2_u7_l1: {
    vocab: [
      { de: "sein-Passiv", fr: "passif d'état", ar: "مجهول الحالة", ex: "Die Tür ist geschlossen." },
      { de: "werden-Passiv", fr: "passif d'action", ar: "مجهول الفعل", ex: "Die Tür wird geschlossen." },
      { de: "geöffnet", fr: "ouvert (état)", ar: "مفتوح", ex: "Das Geschäft ist geöffnet." },
      { de: "verboten", fr: "interdit", ar: "ممنوع", ex: "Rauchen ist verboten." },
      { de: "beschädigt", fr: "endommagé", ar: "متضرّر", ex: "Das Auto ist beschädigt." },
    ],
    exercises: [
      { type: "qcm", q: "'Le magasin est ouvert' (état) ?", opts: ["Der Laden wird geöffnet","Der Laden ist geöffnet","Der Laden öffnet","Der Laden hat geöffnet"], ans: 1, tip: "sein-Passiv = état." },
      { type: "translate", q: "« La lettre est écrite (action). »", ans: "Der Brief wird geschrieben", tip: "werden-Passiv = action en cours." },
    ],
  },
  b2_u8_l1: {
    vocab: [
      { de: "daran / darauf / davon", fr: "en / y (pronoms adverbiaux)", ar: "من ذلك/عليه", ex: "Ich denke daran. / Ich freue mich darauf." },
      { de: "worauf / wovon / worüber", fr: "sur quoi / de quoi", ar: "على ماذا/عن ماذا", ex: "Worauf wartest du?" },
      { de: "bestehen aus + Dat", fr: "consister en", ar: "يتكوّن من", ex: "Wasser besteht aus H₂O." },
      { de: "sich beschäftigen mit + Dat", fr: "s'occuper de", ar: "ينشغل بـ", ex: "Ich beschäftige mich mit Musik." },
      { de: "hinweisen auf + Akk", fr: "attirer l'attention sur", ar: "يشير إلى", ex: "Er wies auf das Problem hin." },
      { de: "verzichten auf + Akk", fr: "renoncer à", ar: "يتخلّى عن", ex: "Ich verzichte auf Fleisch." },
      { de: "sich handeln um + Akk", fr: "s'agir de", ar: "يتعلّق الأمر بـ", ex: "Es handelt sich um ein Missverständnis." },
    ],
    exercises: [
      { type: "translate", q: "« Sur quoi attends-tu ? »", ans: "Worauf wartest du", tip: "warten auf + Akk → worauf." },
      { type: "fill", q: "Ich freue mich ___ deinen Besuch.", ans: "auf", tip: "sich freuen auf + Akk (futur)." },
    ],
  },
  b2_u9_l1: {
    vocab: [
      { de: "stolz auf + Akk", fr: "fier de", ar: "فخور بـ", ex: "Ich bin stolz auf meine Kinder." },
      { de: "zufrieden mit + Dat", fr: "satisfait de", ar: "راضٍ عن", ex: "Er ist zufrieden mit der Arbeit." },
      { de: "abhängig von + Dat", fr: "dépendant de", ar: "متعلّق بـ", ex: "Er ist abhängig von seinen Eltern." },
      { de: "verantwortlich für + Akk", fr: "responsable de", ar: "مسؤول عن", ex: "Sie ist verantwortlich für das Projekt." },
      { de: "interessiert an + Dat", fr: "intéressé par", ar: "مهتمّ بـ", ex: "Ich bin interessiert an Kunst." },
      { de: "reich an + Dat", fr: "riche en", ar: "غني بـ", ex: "Deutschland ist reich an Wäldern." },
      { de: "typisch für + Akk", fr: "typique de", ar: "نموذجيّ لـ", ex: "Das ist typisch für ihn." },
    ],
    exercises: [
      { type: "translate", q: "« Elle est fière de son travail. »", ans: "Sie ist stolz auf ihre Arbeit", tip: "stolz auf + Akk." },
      { type: "fill", q: "Er ist zufrieden ___ dem Ergebnis.", ans: "mit", tip: "zufrieden mit + Dat." },
    ],
  },
  b2_u10_l1: {
    vocab: [
      { de: "einleiten", fr: "introduire", ar: "يستهلّ", ex: "Ich möchte den Text einleiten." },
      { de: "die These", fr: "la thèse", ar: "الأطروحة", ex: "Meine These lautet: …" },
      { de: "das Argument", fr: "l'argument", ar: "الحجّة", ex: "Ein starkes Argument." },
      { de: "das Beispiel", fr: "l'exemple", ar: "المثال", ex: "Zum Beispiel: …" },
      { de: "zusammenfassend", fr: "en résumé", ar: "خلاصة القول", ex: "Zusammenfassend lässt sich sagen …" },
      { de: "abschließend", fr: "pour conclure", ar: "ختامًا", ex: "Abschließend möchte ich betonen …" },
      { de: "im Gegensatz zu + Dat", fr: "contrairement à", ar: "على عكس", ex: "Im Gegensatz zu Berlin ist München teuer." },
      { de: "im Vergleich zu + Dat", fr: "comparé à", ar: "مقارنة بـ", ex: "Im Vergleich zu 2020 …" },
    ],
    exercises: [
      { type: "translate", q: "« En conclusion, il faut agir. »", ans: "Abschließend muss man handeln", tip: "abschließend + verbe 2." },
      { type: "qcm", q: "Marqueur de comparaison ?", opts: ["deshalb","im Vergleich zu","obwohl","damit"], ans: 1, tip: "im Vergleich zu + Dat." },
    ],
  },
};

// ============================================================
// UNITÉS BONUS B2 — Wissenschaft, Wirtschaft, Umweltdebatte, Digitale Welt
// ============================================================
const BONUS_UNITS_B2: Unit[] = [
  {
    id: "b2_u_bonus_wissenschaft", title: "🔬 Wissenschaft & Forschung", titleAr: "العلوم والبحث",
    icon: "🔬", desc: "Recherche, découvertes, méthode scientifique", descAr: "البحث والاكتشافات",
    color: "#0ea5e9", level: "B2",
    lessons: [
      {
        id: "b2_ub_wissenschaft_l1", title: "Wissenschaftliches Vokabular", titleAr: "مفردات علمية",
        content: `**Méthode :** die Hypothese aufstellen, ein Experiment durchführen, die Ergebnisse auswerten, Schlussfolgerungen ziehen.

**Textstruktur :** Einleitung → Hypothese → Methode → Ergebnisse → Diskussion → Fazit.`,
        vocab: [
          { de: "die Forschung", fr: "la recherche", ar: "البحث", ex: "Die Forschung liefert neue Erkenntnisse." },
          { de: "die Hypothese", fr: "l'hypothèse", ar: "الفرضية", ex: "Die Hypothese wurde bestätigt." },
          { de: "das Experiment", fr: "l'expérience", ar: "التجربة", ex: "Ein wichtiges Experiment." },
          { de: "die Erkenntnis", fr: "la connaissance/découverte", ar: "المعرفة", ex: "Eine bahnbrechende Erkenntnis." },
          { de: "das Ergebnis", fr: "le résultat", ar: "النتيجة", ex: "Die Ergebnisse sind eindeutig." },
          { de: "die Schlussfolgerung", fr: "la conclusion", ar: "الاستنتاج", ex: "Wir ziehen folgende Schlussfolgerung …" },
          { de: "die Wissenschaftlerin", fr: "la scientifique", ar: "العالِمة", ex: "Die Wissenschaftlerin präsentiert ihre Arbeit." },
          { de: "veröffentlichen", fr: "publier", ar: "ينشر", ex: "Die Studie wurde veröffentlicht." },
          { de: "widerlegen / beweisen", fr: "réfuter / prouver", ar: "يدحض/يثبت", ex: "Die Theorie wurde bewiesen." },
        ],
        exercises: [
          { type: "translate", q: "« L'hypothèse a été confirmée. »", ans: "Die Hypothese wurde bestätigt", tip: "werden-Passiv Prät." },
          { type: "qcm", q: "Antonyme de 'beweisen' ?", opts: ["zeigen","widerlegen","betonen","erklären"], ans: 1, tip: "widerlegen = réfuter." },
        ],
      },
    ],
  },
  {
    id: "b2_u_bonus_wirtschaft", title: "💼 Wirtschaft & Globalisierung", titleAr: "الاقتصاد والعولمة",
    icon: "💼", desc: "Marché, entreprises, mondialisation", descAr: "السوق والشركات والعولمة",
    color: "#f59e0b", level: "B2",
    lessons: [
      {
        id: "b2_ub_wirtschaft_l1", title: "Wirtschaftsvokabular", titleAr: "مفردات اقتصادية",
        content: `**Themen :** Konjunktur, Inflation, Arbeitslosigkeit, Import/Export, Aktien, Steuern.

**Diskussionen :** Vor- und Nachteile der Globalisierung, Digitalisierung der Arbeit, Fachkräftemangel.`,
        vocab: [
          { de: "die Wirtschaft", fr: "l'économie", ar: "الاقتصاد", ex: "Die deutsche Wirtschaft ist stark." },
          { de: "die Inflation", fr: "l'inflation", ar: "التضخم", ex: "Die Inflation steigt." },
          { de: "die Arbeitslosigkeit", fr: "le chômage", ar: "البطالة", ex: "Die Arbeitslosigkeit sinkt." },
          { de: "der Umsatz", fr: "le chiffre d'affaires", ar: "رقم الأعمال", ex: "Der Umsatz steigt um 5 %." },
          { de: "der Gewinn / der Verlust", fr: "bénéfice / perte", ar: "الربح/الخسارة", ex: "Ein hoher Gewinn." },
          { de: "die Aktie", fr: "l'action", ar: "السهم", ex: "Die Aktien fallen." },
          { de: "die Steuern", fr: "les impôts", ar: "الضرائب", ex: "Steuern zahlen." },
          { de: "der Fachkräftemangel", fr: "la pénurie de main-d'œuvre", ar: "نقص الكفاءات", ex: "Der Fachkräftemangel wächst." },
          { de: "die Globalisierung", fr: "la mondialisation", ar: "العولمة", ex: "Die Globalisierung verändert alles." },
        ],
        exercises: [
          { type: "translate", q: "« Le chiffre d'affaires augmente de 5 %. »", ans: "Der Umsatz steigt um fünf Prozent", tip: "steigen um + Akk." },
          { type: "qcm", q: "Antonyme de 'der Gewinn' ?", opts: ["der Umsatz","der Verlust","der Preis","die Steuer"], ans: 1, tip: "Verlust = perte." },
        ],
      },
    ],
  },
  {
    id: "b2_u_bonus_umwelt", title: "🌎 Umweltdebatte B2", titleAr: "الجدل البيئي",
    icon: "🌎", desc: "Klimapolitik, Energiewende, Nachhaltigkeit", descAr: "سياسة المناخ والاستدامة",
    color: "#16a34a", level: "B2",
    lessons: [
      {
        id: "b2_ub_umwelt_l1", title: "Klima & Politik", titleAr: "المناخ والسياسة",
        content: `**Debatte :** CO₂-Steuer, Kohleausstieg, Elektromobilität, Fleischkonsum, Massentierhaltung.

**Argumentation :** Man könnte argumentieren, dass … / Ein wichtiger Aspekt ist … / Kritiker warnen davor, dass …`,
        vocab: [
          { de: "der Klimawandel", fr: "le changement climatique", ar: "التغيّر المناخي", ex: "Der Klimawandel ist real." },
          { de: "die Nachhaltigkeit", fr: "la durabilité", ar: "الاستدامة", ex: "Nachhaltigkeit ist wichtig." },
          { de: "der Ausstoß", fr: "l'émission", ar: "الانبعاث", ex: "CO₂-Ausstoß reduzieren." },
          { de: "die Energiewende", fr: "la transition énergétique", ar: "التحوّل الطاقي", ex: "Die Energiewende voranbringen." },
          { de: "erneuerbar", fr: "renouvelable", ar: "متجدّد", ex: "Erneuerbare Energien fördern." },
          { de: "die Massentierhaltung", fr: "l'élevage intensif", ar: "التربية المكثفة", ex: "Massentierhaltung ist umstritten." },
          { de: "fordern", fr: "exiger", ar: "يطالب بـ", ex: "Aktivisten fordern schnelles Handeln." },
          { de: "der Kompromiss", fr: "le compromis", ar: "التسوية", ex: "Wir brauchen einen Kompromiss." },
        ],
        exercises: [
          { type: "translate", q: "« Les critiques mettent en garde contre les conséquences. »", ans: "Kritiker warnen vor den Folgen", tip: "warnen vor + Dat." },
          { type: "qcm", q: "Adjectif signifiant 'durable' ?", opts: ["haltbar","nachhaltig","dauerhaft","beständig"], ans: 1, tip: "Nachhaltigkeit → nachhaltig." },
        ],
      },
    ],
  },
  {
    id: "b2_u_bonus_digital", title: "💻 Digitale Welt & KI", titleAr: "العالم الرقمي والذكاء الاصطناعي",
    icon: "💻", desc: "IA, réseaux sociaux, données personnelles, télétravail", descAr: "الذكاء الاصطناعي والبيانات والعمل عن بُعد",
    color: "#a855f7", level: "B2",
    lessons: [
      {
        id: "b2_ub_digital_l1", title: "Chancen & Risiken der KI", titleAr: "فرص ومخاطر الذكاء الاصطناعي",
        content: `**Chancen :** Automatisierung, medizinische Diagnose, personalisiertes Lernen.
**Risiken :** Datenschutz, Arbeitsplatzverlust, algorithmische Diskriminierung, Fake News.

**Debatte :** Sollten wir KI regulieren? Wer trägt die Verantwortung?`,
        vocab: [
          { de: "die künstliche Intelligenz (KI)", fr: "l'intelligence artificielle", ar: "الذكاء الاصطناعي", ex: "KI verändert die Welt." },
          { de: "der Algorithmus", fr: "l'algorithme", ar: "الخوارزمية", ex: "Der Algorithmus entscheidet." },
          { de: "der Datenschutz", fr: "la protection des données", ar: "حماية البيانات", ex: "Datenschutz ist Grundrecht." },
          { de: "die Automatisierung", fr: "l'automatisation", ar: "الأتمتة", ex: "Die Automatisierung ersetzt Jobs." },
          { de: "das Homeoffice", fr: "le télétravail", ar: "العمل من المنزل", ex: "Ich arbeite im Homeoffice." },
          { de: "die soziale Medien", fr: "les réseaux sociaux", ar: "وسائل التواصل الاجتماعي", ex: "Soziale Medien beeinflussen die Meinung." },
          { de: "die Überwachung", fr: "la surveillance", ar: "المراقبة", ex: "Massenüberwachung ist umstritten." },
          { de: "regulieren", fr: "réguler", ar: "ينظّم", ex: "Wir müssen KI regulieren." },
          { de: "die Verantwortung", fr: "la responsabilité", ar: "المسؤولية", ex: "Wer trägt die Verantwortung?" },
        ],
        exercises: [
          { type: "translate", q: "« Il faut réguler l'IA. »", ans: "Man muss die KI regulieren", tip: "man muss + inf." },
          { type: "qcm", q: "Traduction de 'télétravail' ?", opts: ["Fernstudium","Homeoffice","Werkstatt","Nebenjob"], ans: 1, tip: "Anglicisme courant." },
          { type: "fill", q: "Der ___ ist ein Grundrecht. (protection des données)", ans: "Datenschutz", tip: "Un mot composé." },
        ],
      },
      {
        id: "b2_ub_digital_l2", title: "Soziale Medien & Meinungsbildung", titleAr: "وسائل التواصل وتشكيل الرأي",
        content: `Themen : Filterblase, Echo-Kammer, Cybermobbing, Meinungsfreiheit vs. Hassrede.

Redemittel : "Studien zeigen, dass …", "Es lässt sich nicht leugnen, dass …", "Man sollte bedenken, dass …"`,
        vocab: [
          { de: "die Filterblase", fr: "la bulle de filtre", ar: "فقاعة التصفية", ex: "Die Filterblase verstärkt Meinungen." },
          { de: "das Cybermobbing", fr: "le cyberharcèlement", ar: "التنمّر الإلكتروني", ex: "Cybermobbing ist strafbar." },
          { de: "die Hassrede", fr: "le discours haineux", ar: "خطاب الكراهية", ex: "Hassrede im Netz nimmt zu." },
          { de: "die Meinungsfreiheit", fr: "la liberté d'expression", ar: "حرية التعبير", ex: "Meinungsfreiheit hat Grenzen." },
          { de: "beeinflussen", fr: "influencer", ar: "يؤثر", ex: "Werbung beeinflusst uns." },
          { de: "verbreiten", fr: "propager", ar: "ينشر", ex: "Fake News verbreiten sich schnell." },
        ],
        exercises: [
          { type: "translate", q: "« Les fausses infos se propagent vite. »", ans: "Fake News verbreiten sich schnell", tip: "sich verbreiten." },
        ],
      },
    ],
  },
];

// ============================================================
// APPLICATION EN SIDE-EFFECT
// ============================================================
let applied = false;
export function applyB2Extras() {
  if (applied) return;
  applied = true;
  for (const u of UNITS_B2) {
    for (const l of u.lessons) {
      const pack = B2_EXTRA_PACKS[l.id];
      if (!pack) continue;
      if (pack.vocab) l.vocab.push(...pack.vocab);
      if (pack.exercises) l.exercises.push(...pack.exercises);
    }
  }
  for (const bu of BONUS_UNITS_B2) {
    if (!UNITS_B2.find((u) => u.id === bu.id)) UNITS_B2.push(bu);
  }
}
applyB2Extras();
