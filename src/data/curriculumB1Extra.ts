// Enrichissement massif B1 — vocabulaire étendu, exercices supplémentaires,
// unités bonus (Arbeitswelt, Gesellschaft, Studium, Kultur & Medien).
// Sources : Goethe-Zertifikat B1, DW Nicos Weg B1, Netzwerk Neu B1,
// Aspekte Neu B1+, Sicher! B1+.
// Import unique : `import "@/data/curriculumB1Extra";`

import type { Exercise, Unit, VocabItem } from "./curriculum";
import { UNITS_B1 } from "./curriculumB1";

type Pack = { vocab?: VocabItem[]; exercises?: Exercise[] };

// ============================================================
// PACKS D'ENRICHISSEMENT PAR LEÇON EXISTANTE (b1_u1 → b1_u10)
// ============================================================
export const B1_EXTRA_PACKS: Record<string, Pack> = {
  b1_u1_l1: {
    vocab: [
      { de: "ging", fr: "allait", ar: "ذهب", ex: "Er ging jeden Morgen zur Arbeit." },
      { de: "sagte", fr: "disait", ar: "قال", ex: "Sie sagte kein Wort." },
      { de: "dachte", fr: "pensait", ar: "فكّر", ex: "Ich dachte an dich." },
      { de: "wusste", fr: "savait", ar: "كان يعلم", ex: "Er wusste die Antwort." },
      { de: "brachte", fr: "apportait", ar: "أحضر", ex: "Sie brachte Blumen." },
      { de: "verlor", fr: "perdait", ar: "خسر", ex: "Er verlor den Schlüssel." },
      { de: "gewann", fr: "gagnait", ar: "فاز", ex: "Sie gewann den Preis." },
      { de: "verließ", fr: "quittait", ar: "غادر", ex: "Er verließ das Haus." },
    ],
    exercises: [
      { type: "qcm", q: "Präteritum de 'wissen' ?", opts: ["wusste", "weißte", "wisste", "wiste"], ans: 0, tip: "wissen → wusste." },
      { type: "fill", q: "Sie ___ die Antwort. (wissen, Prät.)", ans: "wusste", tip: "Irrégulier." },
      { type: "translate", q: "« Il quitta la maison à 8 heures. »", ans: "Er verließ das Haus um acht Uhr", tip: "verlassen → verließ." },
      { type: "qcm", q: "Registre du Präteritum ?", opts: ["oral familier","récits écrits","argot","commandes"], ans: 1, tip: "Presse, romans, biographies." },
    ],
  },
  b1_u2_l1: {
    vocab: [
      { de: "würde", fr: "je ferais", ar: "لكنتُ سأفعل", ex: "Ich würde gerne kommen." },
      { de: "hätte", fr: "j'aurais", ar: "لكان لديّ", ex: "Ich hätte Zeit." },
      { de: "wäre", fr: "je serais", ar: "لكنتُ", ex: "Ich wäre glücklich." },
      { de: "könnte", fr: "pourrais", ar: "أستطيع (شرط)", ex: "Könntest du mir helfen?" },
      { de: "sollte", fr: "devrais", ar: "ينبغي", ex: "Du solltest schlafen." },
      { de: "an deiner Stelle", fr: "à ta place", ar: "لو كنت مكانك", ex: "An deiner Stelle würde ich bleiben." },
      { de: "wenn … wäre/hätte", fr: "si (irréel)", ar: "لو أنّ", ex: "Wenn ich reich wäre, würde ich reisen." },
    ],
    exercises: [
      { type: "translate", q: "« Je voudrais un café, s'il vous plaît. »", ans: "Ich hätte gerne einen Kaffee, bitte", tip: "Poli : hätte gerne." },
      { type: "fill", q: "Wenn ich Zeit ___ , würde ich kommen.", ans: "hätte", tip: "haben → hätte." },
      { type: "qcm", q: "Conseil poli ?", opts: ["Du musst schlafen","Du solltest schlafen","Du willst schlafen","Du darfst schlafen"], ans: 1, tip: "sollte = conseil." },
    ],
  },
  b1_u3_l1: {
    vocab: [
      { de: "werden", fr: "être (passif)", ar: "يُصبح (مبني للمجهول)", ex: "Das Haus wird gebaut." },
      { de: "wurde", fr: "était (passif prét.)", ar: "بُنِيَ", ex: "Das Haus wurde gebaut." },
      { de: "von + Dat", fr: "par (agent)", ar: "من قِبَل", ex: "Der Brief wurde von Anna geschrieben." },
      { de: "durch + Akk", fr: "par (moyen)", ar: "بواسطة", ex: "Der Baum wurde durch den Sturm zerstört." },
      { de: "hergestellt", fr: "fabriqué", ar: "صُنِع", ex: "Autos werden in Deutschland hergestellt." },
      { de: "geliefert", fr: "livré", ar: "سُلِّم", ex: "Die Ware wird morgen geliefert." },
    ],
    exercises: [
      { type: "translate", q: "« La lettre est écrite par Anna. »", ans: "Der Brief wird von Anna geschrieben", tip: "wird + Partizip II + von." },
      { type: "qcm", q: "'par le vent' (moyen) ?", opts: ["von dem Wind","durch den Wind","mit dem Wind","aus dem Wind"], ans: 1, tip: "Moyen → durch." },
      { type: "fill", q: "Das Auto ___ 2020 gebaut. (Prät. passif)", ans: "wurde", tip: "Passif prét. → wurde." },
    ],
  },
  b1_u4_l1: {
    vocab: [
      { de: "der Mann, der …", fr: "l'homme qui", ar: "الرجل الذي", ex: "Der Mann, der dort steht, ist mein Vater." },
      { de: "die Frau, die …", fr: "la femme qui", ar: "المرأة التي", ex: "Die Frau, die ich kenne, ist Ärztin." },
      { de: "das Kind, das …", fr: "l'enfant qui", ar: "الطفل الذي", ex: "Das Kind, das spielt, ist glücklich." },
      { de: "dem/der (Dat)", fr: "à qui", ar: "الذي (المجرور)", ex: "Der Mann, dem ich helfe, ist alt." },
      { de: "dessen / deren (Gen)", fr: "dont", ar: "الذي (ملكية)", ex: "Der Mann, dessen Auto rot ist." },
      { de: "mit dem / mit der", fr: "avec lequel", ar: "الذي معه", ex: "Der Freund, mit dem ich lerne." },
    ],
    exercises: [
      { type: "fill", q: "Der Mann, ___ dort steht, ist mein Onkel.", ans: "der", tip: "Nom.masc." },
      { type: "translate", q: "« La femme dont la voiture est rouge. »", ans: "Die Frau, deren Auto rot ist", tip: "fém. Gen → deren." },
      { type: "qcm", q: "'les enfants qui…' ?", opts: ["die Kinder, das","die Kinder, den","die Kinder, die","die Kinder, denen"], ans: 2, tip: "Pluriel Nom. → die." },
    ],
  },
  b1_u5_l1: {
    vocab: [
      { de: "hatte gemacht", fr: "avait fait", ar: "كان قد فعل", ex: "Ich hatte schon gegessen, als er kam." },
      { de: "war gegangen", fr: "était allé", ar: "كان قد ذهب", ex: "Er war schon gegangen." },
      { de: "nachdem", fr: "après que", ar: "بعد أن", ex: "Nachdem ich gegessen hatte, ging ich schlafen." },
      { de: "vorher", fr: "avant", ar: "قبل ذلك", ex: "Vorher hatte ich gelernt." },
    ],
    exercises: [
      { type: "translate", q: "« Après avoir mangé, je suis parti. »", ans: "Nachdem ich gegessen hatte, bin ich gegangen", tip: "Plusquamperfekt dans la subordonnée." },
      { type: "fill", q: "Er ___ schon gegangen, als ich ankam.", ans: "war", tip: "gehen → sein → war." },
    ],
  },
  b1_u6_l1: {
    vocab: [
      { de: "es ist wichtig zu …", fr: "il est important de", ar: "من المهم أن", ex: "Es ist wichtig, Deutsch zu lernen." },
      { de: "ich habe vor zu …", fr: "j'ai l'intention de", ar: "أنوي", ex: "Ich habe vor, nach Berlin zu ziehen." },
      { de: "ich versuche zu …", fr: "j'essaie de", ar: "أحاول", ex: "Ich versuche, früh aufzustehen." },
      { de: "ohne zu …", fr: "sans", ar: "دون أن", ex: "Er ging, ohne zu sprechen." },
      { de: "um … zu", fr: "afin de", ar: "لكي", ex: "Ich lerne, um zu bestehen." },
      { de: "anstatt zu", fr: "au lieu de", ar: "بدلاً من", ex: "Anstatt zu arbeiten, schläft er." },
    ],
    exercises: [
      { type: "translate", q: "« J'apprends pour réussir. »", ans: "Ich lerne, um zu bestehen", tip: "um … zu + inf." },
      { type: "qcm", q: "Verbe séparable avec 'zu' ?", opts: ["aufzustehen","zuaufstehen","aufzustehent","auf zu stehen"], ans: 0, tip: "zu s'insère : auf-zu-stehen." },
    ],
  },
  b1_u7_l1: {
    vocab: [
      { de: "während + Gen", fr: "pendant", ar: "خلال", ex: "Während des Sommers reisen wir." },
      { de: "wegen + Gen", fr: "à cause de", ar: "بسبب", ex: "Wegen des Regens bleiben wir." },
      { de: "trotz + Gen", fr: "malgré", ar: "رغم", ex: "Trotz der Kälte gehen wir raus." },
      { de: "statt + Gen", fr: "au lieu de", ar: "بدلاً من", ex: "Statt eines Autos hat er ein Fahrrad." },
      { de: "innerhalb + Gen", fr: "à l'intérieur de", ar: "داخل/في غضون", ex: "Innerhalb einer Woche." },
      { de: "außerhalb + Gen", fr: "à l'extérieur de", ar: "خارج", ex: "Außerhalb der Stadt." },
    ],
    exercises: [
      { type: "translate", q: "« Malgré la pluie, nous sortons. »", ans: "Trotz des Regens gehen wir raus", tip: "trotz + Gen." },
      { type: "fill", q: "___ des Sommers reisen wir. (pendant)", ans: "Während", tip: "während + Gen." },
    ],
  },
  b1_u8_l1: {
    vocab: [
      { de: "deshalb", fr: "c'est pourquoi", ar: "لهذا السبب", ex: "Es regnet, deshalb bleibe ich zu Hause." },
      { de: "trotzdem", fr: "malgré tout", ar: "رغم ذلك", ex: "Es regnet, trotzdem gehe ich raus." },
      { de: "außerdem", fr: "de plus", ar: "علاوة على ذلك", ex: "Er ist klug, außerdem fleißig." },
      { de: "sonst", fr: "sinon", ar: "وإلا", ex: "Beeil dich, sonst kommst du zu spät." },
      { de: "trotzdem / dennoch", fr: "cependant", ar: "مع ذلك", ex: "Es ist teuer, dennoch kaufe ich es." },
      { de: "einerseits … andererseits", fr: "d'une part … d'autre part", ar: "من جهة … ومن جهة أخرى", ex: "Einerseits ist es teuer, andererseits ist es schön." },
    ],
    exercises: [
      { type: "qcm", q: "Position du verbe après 'deshalb' ?", opts: ["à la fin","2e position","1re position","après le sujet"], ans: 1, tip: "Konnektor coordonnant → verbe 2." },
      { type: "translate", q: "« Il pleut, c'est pourquoi je reste. »", ans: "Es regnet, deshalb bleibe ich zu Hause", tip: "deshalb + verbe inversé." },
    ],
  },
  b1_u9_l1: {
    vocab: [
      { de: "kaltes Wasser", fr: "eau froide", ar: "ماء بارد", ex: "Ich trinke kaltes Wasser." },
      { de: "guter Kaffee", fr: "bon café", ar: "قهوة جيدة", ex: "Guter Kaffee ist wichtig." },
      { de: "frische Milch", fr: "lait frais", ar: "حليب طازج", ex: "Frische Milch aus dem Kühlschrank." },
      { de: "alte Freunde", fr: "vieux amis", ar: "أصدقاء قدامى", ex: "Alte Freunde sind wertvoll." },
    ],
    exercises: [
      { type: "fill", q: "Ich trinke ___ Wasser. (kalt, sans article)", ans: "kaltes", tip: "Neutre Akk sans article → -es." },
      { type: "qcm", q: "'bon café' (Nom.) ?", opts: ["gute Kaffee","guter Kaffee","gutes Kaffee","guten Kaffee"], ans: 1, tip: "Masc. Nom. sans art. → -er." },
    ],
  },
  b1_u10_l1: {
    vocab: [
      { de: "sich schneiden lassen", fr: "se faire couper", ar: "يقصّ (شعره)", ex: "Ich lasse mir die Haare schneiden." },
      { de: "reparieren lassen", fr: "faire réparer", ar: "يُصلَح", ex: "Ich lasse das Auto reparieren." },
      { de: "lass mich in Ruhe", fr: "laisse-moi tranquille", ar: "دعني وشأني", ex: "Lass mich in Ruhe!" },
      { de: "lass uns gehen", fr: "allons-y", ar: "لنذهب", ex: "Lass uns gehen!" },
    ],
    exercises: [
      { type: "translate", q: "« Je fais réparer ma voiture. »", ans: "Ich lasse mein Auto reparieren", tip: "lassen + inf." },
      { type: "qcm", q: "'allons-y' ?", opts: ["Lasst uns gehen","Lass uns gehen","Lässt uns gehen","Ließ uns gehen"], ans: 1, tip: "Impératif inclusif." },
    ],
  },
};

// ============================================================
// UNITÉS BONUS B1 — Arbeitswelt, Gesellschaft, Studium, Kultur/Medien
// ============================================================
const BONUS_UNITS_B1: Unit[] = [
  {
    id: "b1_u_bonus_arbeit", title: "🏢 Arbeitswelt B1", titleAr: "عالم العمل",
    icon: "🏢", desc: "Bewerbung, Vorstellungsgespräch, Konflikte im Team", descAr: "الترشيح والمقابلات والنزاعات",
    color: "#0ea5e9", level: "B1",
    lessons: [
      {
        id: "b1_ub_arbeit_l1", title: "Bewerbung schreiben", titleAr: "كتابة رسالة ترشيح",
        content: `**Struktur Bewerbungsbrief :**

1. Anrede formelle : Sehr geehrte Frau …, sehr geehrter Herr …
2. Motivation : "Mit großem Interesse habe ich Ihre Stellenanzeige gelesen."
3. Erfahrungen : "Seit … arbeite ich als …"
4. Motivation persönlich : "Ich möchte gerne in Ihrem Team arbeiten, weil …"
5. Abschluss : "Über eine Einladung zum Vorstellungsgespräch würde ich mich sehr freuen."`,
        vocab: [
          { de: "die Stellenanzeige", fr: "l'annonce d'emploi", ar: "إعلان وظيفة", ex: "Ich habe Ihre Stellenanzeige gelesen." },
          { de: "sich bewerben um + Akk", fr: "postuler à", ar: "يتقدّم لـ", ex: "Ich bewerbe mich um die Stelle." },
          { de: "die Erfahrung", fr: "l'expérience", ar: "الخبرة", ex: "Ich habe 5 Jahre Erfahrung." },
          { de: "die Qualifikation", fr: "la qualification", ar: "المؤهل", ex: "Meine Qualifikationen passen." },
          { de: "das Praktikum", fr: "le stage", ar: "التدريب", ex: "Ich habe ein Praktikum gemacht." },
          { de: "die Fähigkeit", fr: "la compétence", ar: "المهارة", ex: "Meine Fähigkeiten sind vielseitig." },
          { de: "der Arbeitgeber", fr: "l'employeur", ar: "صاحب العمل", ex: "Mein Arbeitgeber ist zufrieden." },
          { de: "die Kündigung", fr: "la démission / licenciement", ar: "الاستقالة/الفصل", ex: "Ich habe die Kündigung geschrieben." },
        ],
        exercises: [
          { type: "translate", q: "« Je postule au poste de vendeur. »", ans: "Ich bewerbe mich um die Stelle als Verkäufer", tip: "als + métier sans article." },
          { type: "qcm", q: "Formule de clôture appropriée ?", opts: ["Tschüss!","Über eine Einladung würde ich mich freuen","Bis bald","Alles klar"], ans: 1, tip: "Formule Konjunktiv II." },
        ],
      },
      {
        id: "b1_ub_arbeit_l2", title: "Konflikte am Arbeitsplatz", titleAr: "نزاعات في مكان العمل",
        content: `**Diplomatie :** Ich sehe das anders. / Vielleicht könnten wir … / Ich würde vorschlagen, dass …

**Konflikt lösen :** offen sprechen, zuhören, Kompromiss suchen, Mediator einbeziehen.`,
        vocab: [
          { de: "der Konflikt", fr: "le conflit", ar: "النزاع", ex: "Ein Konflikt im Team." },
          { de: "der Kompromiss", fr: "le compromis", ar: "التسوية", ex: "Wir suchen einen Kompromiss." },
          { de: "die Kritik", fr: "la critique", ar: "النقد", ex: "Konstruktive Kritik ist wichtig." },
          { de: "der Vorschlag", fr: "la proposition", ar: "الاقتراح", ex: "Ich habe einen Vorschlag." },
          { de: "die Meinung", fr: "l'opinion", ar: "الرأي", ex: "Meiner Meinung nach…" },
          { de: "sich einigen auf + Akk", fr: "se mettre d'accord sur", ar: "يتفقان على", ex: "Wir einigen uns auf einen Termin." },
        ],
        exercises: [
          { type: "translate", q: "« À mon avis, il faut discuter. »", ans: "Meiner Meinung nach müssen wir diskutieren", tip: "Meiner Meinung nach + verbe 2." },
        ],
      },
    ],
  },
  {
    id: "b1_u_bonus_gesellschaft", title: "🌍 Gesellschaft & Politik", titleAr: "المجتمع والسياسة",
    icon: "🌍", desc: "Débat, opinions, actualité, migration", descAr: "النقاش والرأي والأخبار والهجرة",
    color: "#f59e0b", level: "B1",
    lessons: [
      {
        id: "b1_ub_gesellschaft_l1", title: "Meinung äußern", titleAr: "التعبير عن الرأي",
        content: `**Formules pour exprimer une opinion :**
• Ich bin der Meinung, dass … / Ich finde, dass …
• Meiner Ansicht nach … / Aus meiner Sicht …
• Ich stimme zu / Ich stimme nicht zu.
• Das sehe ich anders. / Da bin ich anderer Meinung.
• Einerseits …, andererseits …`,
        vocab: [
          { de: "die Meinung", fr: "l'opinion", ar: "الرأي", ex: "Was ist deine Meinung?" },
          { de: "die Diskussion", fr: "la discussion", ar: "النقاش", ex: "Eine interessante Diskussion." },
          { de: "der Vorteil / der Nachteil", fr: "avantage / inconvénient", ar: "ميزة/عيب", ex: "Es gibt Vor- und Nachteile." },
          { de: "die Gesellschaft", fr: "la société", ar: "المجتمع", ex: "Die moderne Gesellschaft." },
          { de: "das Problem", fr: "le problème", ar: "المشكلة", ex: "Ein großes Problem." },
          { de: "die Lösung", fr: "la solution", ar: "الحلّ", ex: "Es gibt keine einfache Lösung." },
          { de: "diskutieren über + Akk", fr: "débattre de", ar: "يناقش", ex: "Wir diskutieren über Politik." },
          { de: "argumentieren", fr: "argumenter", ar: "يحاجج", ex: "Er argumentiert überzeugend." },
        ],
        exercises: [
          { type: "translate", q: "« À mon avis, l'école doit changer. »", ans: "Meiner Meinung nach muss die Schule sich ändern", tip: "Meiner Meinung nach + V2." },
          { type: "qcm", q: "Marquer un désaccord ?", opts: ["Ich stimme zu","Das sehe ich anders","Genau","Absolut"], ans: 1, tip: "Désaccord poli." },
        ],
      },
      {
        id: "b1_ub_gesellschaft_l2", title: "Migration & Integration", titleAr: "الهجرة والاندماج",
        content: `Themen : Sprache lernen, Arbeit finden, Kultur verstehen, Freunde machen.
Vokabular : der Migrant, die Migrantin, der Flüchtling, die Integration, die Heimat, das Heimweh.`,
        vocab: [
          { de: "die Heimat", fr: "la patrie", ar: "الوطن", ex: "Meine Heimat ist Tunesien." },
          { de: "das Heimweh", fr: "le mal du pays", ar: "الحنين إلى الوطن", ex: "Ich habe Heimweh." },
          { de: "sich integrieren", fr: "s'intégrer", ar: "يندمج", ex: "Er integriert sich schnell." },
          { de: "der Ausländer", fr: "l'étranger", ar: "الأجنبي", ex: "Ausländer willkommen." },
          { de: "die Staatsangehörigkeit", fr: "la nationalité", ar: "الجنسية", ex: "Ich habe die deutsche Staatsangehörigkeit." },
          { de: "der Ausweis", fr: "la carte d'identité", ar: "الهوية", ex: "Zeigen Sie Ihren Ausweis." },
        ],
        exercises: [
          { type: "translate", q: "« Il s'intègre rapidement. »", ans: "Er integriert sich schnell", tip: "sich integrieren." },
        ],
      },
    ],
  },
  {
    id: "b1_u_bonus_studium", title: "🎓 Studium & Ausbildung", titleAr: "الدراسة والتكوين",
    icon: "🎓", desc: "Université, matières, examens, vie étudiante", descAr: "الجامعة والمواد والامتحانات",
    color: "#8b5cf6", level: "B1",
    lessons: [
      {
        id: "b1_ub_studium_l1", title: "An der Uni", titleAr: "في الجامعة",
        content: `**Universitätswortschatz :** die Vorlesung, das Seminar, das Referat, die Hausarbeit, die Prüfung, die Klausur, die Note, der Professor.

**Studieren :** sich einschreiben, an Kursen teilnehmen, eine Prüfung ablegen, bestehen / durchfallen.`,
        vocab: [
          { de: "die Vorlesung", fr: "le cours magistral", ar: "المحاضرة", ex: "Die Vorlesung beginnt um 10." },
          { de: "das Seminar", fr: "le séminaire", ar: "الحلقة الدراسية", ex: "Ein Seminar in Linguistik." },
          { de: "das Referat", fr: "l'exposé", ar: "العرض", ex: "Ich halte ein Referat." },
          { de: "die Prüfung ablegen", fr: "passer un examen", ar: "يجتاز امتحانًا", ex: "Ich lege eine Prüfung ab." },
          { de: "bestehen", fr: "réussir", ar: "ينجح", ex: "Ich habe bestanden!" },
          { de: "durchfallen", fr: "échouer", ar: "يرسب", ex: "Er ist durchgefallen." },
          { de: "der Abschluss", fr: "le diplôme", ar: "الشهادة", ex: "Ich habe meinen Abschluss." },
          { de: "das Stipendium", fr: "la bourse", ar: "المنحة", ex: "Ich habe ein Stipendium bekommen." },
        ],
        exercises: [
          { type: "translate", q: "« J'ai passé l'examen. »", ans: "Ich habe die Prüfung abgelegt", tip: "ablegen : sép." },
          { type: "qcm", q: "Antonyme de 'bestehen' ?", opts: ["schaffen","gewinnen","durchfallen","erreichen"], ans: 2, tip: "durchfallen = échouer." },
        ],
      },
    ],
  },
  {
    id: "b1_u_bonus_kultur", title: "🎭 Kultur & Medien B1", titleAr: "الثقافة والإعلام",
    icon: "🎭", desc: "Film, Literatur, Nachrichten, Fake News", descAr: "الأفلام والأدب والأخبار",
    color: "#ec4899", level: "B1",
    lessons: [
      {
        id: "b1_ub_kultur_l1", title: "Filme & Literatur besprechen", titleAr: "مناقشة الأفلام والأدب",
        content: `• Der Film handelt von …
• Die Hauptfigur ist … / Die Handlung spielt in …
• Ich finde den Film spannend / langweilig / rührend.
• Das Buch hat mich beeindruckt.`,
        vocab: [
          { de: "die Handlung", fr: "l'intrigue", ar: "الأحداث", ex: "Die Handlung ist spannend." },
          { de: "die Hauptfigur", fr: "le personnage principal", ar: "الشخصية الرئيسية", ex: "Die Hauptfigur ist ein Detektiv." },
          { de: "der Regisseur", fr: "le réalisateur", ar: "المخرج", ex: "Ein deutscher Regisseur." },
          { de: "der Autor / die Autorin", fr: "l'auteur", ar: "المؤلف", ex: "Die Autorin heißt Herta Müller." },
          { de: "spannend", fr: "captivant", ar: "مشوّق", ex: "Ein spannender Roman." },
          { de: "rührend", fr: "émouvant", ar: "مؤثر", ex: "Eine rührende Geschichte." },
          { de: "empfehlen", fr: "recommander", ar: "يوصي بـ", ex: "Ich empfehle dir das Buch." },
        ],
        exercises: [
          { type: "translate", q: "« Le film parle d'un voyage. »", ans: "Der Film handelt von einer Reise", tip: "handeln von + Dat." },
        ],
      },
      {
        id: "b1_ub_kultur_l2", title: "Nachrichten & Fake News", titleAr: "الأخبار والأخبار الزائفة",
        content: `**Quellen prüfen :** seriöse Zeitungen (FAZ, Süddeutsche, ZEIT), öffentlich-rechtliche Sender (ARD, ZDF).
**Fake News erkennen :** Quelle prüfen, Fakten vergleichen, Datum kontrollieren.`,
        vocab: [
          { de: "die Nachricht", fr: "l'information", ar: "الخبر", ex: "Eine wichtige Nachricht." },
          { de: "die Zeitung", fr: "le journal", ar: "الصحيفة", ex: "Ich lese die Zeitung." },
          { de: "die Quelle", fr: "la source", ar: "المصدر", ex: "Prüfe die Quelle!" },
          { de: "die Fakenews", fr: "les fausses infos", ar: "الأخبار الزائفة", ex: "Fake News sind gefährlich." },
          { de: "recherchieren", fr: "faire des recherches", ar: "يبحث", ex: "Ich recherchiere im Internet." },
          { de: "die Tatsache", fr: "le fait", ar: "الحقيقة", ex: "Das ist eine Tatsache." },
        ],
        exercises: [
          { type: "translate", q: "« Il faut vérifier la source. »", ans: "Man muss die Quelle prüfen", tip: "man muss + inf." },
        ],
      },
    ],
  },
];

// ============================================================
// APPLICATION EN SIDE-EFFECT
// ============================================================
let applied = false;
export function applyB1Extras() {
  if (applied) return;
  applied = true;
  for (const u of UNITS_B1) {
    for (const l of u.lessons) {
      const pack = B1_EXTRA_PACKS[l.id];
      if (!pack) continue;
      if (pack.vocab) l.vocab.push(...pack.vocab);
      if (pack.exercises) l.exercises.push(...pack.exercises);
    }
  }
  for (const bu of BONUS_UNITS_B1) {
    if (!UNITS_B1.find((u) => u.id === bu.id)) UNITS_B1.push(bu);
  }
}
applyB1Extras();
