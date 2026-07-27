// Enrichissement massif A1 — vocabulaire étendu, exercices supplémentaires,
// unités bonus (Culture, Voyage, Santé, Loisirs). Import à effet de bord :
// `import "@/data/curriculumA1Extra";` une seule fois.
//
// Sources pédagogiques inspirées : Goethe-Institut A1 Fit, DW Learn German (Nicos Weg),
// Netzwerk Neu A1, Menschen A1, Schritte plus Neu A1.

import type { Exercise, Unit, VocabItem } from "./curriculum";
import { UNITS } from "./curriculum";

type Pack = { vocab?: VocabItem[]; exercises?: Exercise[] };

// ============================================================
// PACKS D'ENRICHISSEMENT PAR LEÇON EXISTANTE (u1 → u10)
// ============================================================
export const A1_EXTRA_PACKS: Record<string, Pack> = {
  // ===== U1 — ALPHABET =====
  u1l1: {
    vocab: [
      { de: "der Anfang", fr: "le début", ar: "البداية", ex: "Am Anfang ist es schwer." },
      { de: "die Antwort", fr: "la réponse", ar: "الجواب", ex: "Die Antwort ist richtig." },
      { de: "die Frage", fr: "la question", ar: "السؤال", ex: "Ich habe eine Frage." },
      { de: "der Buchstabe", fr: "la lettre", ar: "الحرف", ex: "A ist der erste Buchstabe." },
      { de: "das Wort", fr: "le mot", ar: "الكلمة", ex: "Das Wort ist neu." },
    ],
    exercises: [
      { type: "qcm", q: "Comment épeler 'Haus' ?", opts: ["H-A-U-S", "H-A-O-S", "H-O-U-S", "H-Ä-U-S"], ans: 0, tip: "H-A-U-S : quatre lettres." },
      { type: "fill", q: "Le premier mot allemand qu'on apprend souvent est 'Guten ___' (Bonjour matin)", ans: "Morgen", tip: "Guten Morgen = Bonjour." },
      { type: "translate", q: "« Comment ça s'écrit ? »", ans: "Wie schreibt man das", tip: "wie = comment, schreiben = écrire." },
    ],
  },
  u1l2: {
    vocab: [
      { de: "der Zug", fr: "le train", ar: "القطار", ex: "Der Zug kommt um 8 Uhr." },
      { de: "der Kaffee", fr: "le café", ar: "القهوة", ex: "Ich trinke Kaffee." },
      { de: "der Wein", fr: "le vin", ar: "النبيذ", ex: "Der Wein ist rot." },
      { de: "die Zeit", fr: "le temps", ar: "الوقت", ex: "Ich habe keine Zeit." },
      { de: "die Woche", fr: "la semaine", ar: "الأسبوع", ex: "Die Woche hat 7 Tage." },
    ],
    exercises: [
      { type: "qcm", q: "Zug se prononce…", opts: ["Zoug", "Tsouk", "Souk", "Djoug"], ans: 1, tip: "Z=TS, U=OU, G final=K." },
      { type: "translate", q: "« Je bois du café. »", ans: "Ich trinke Kaffee", tip: "trinken = boire." },
      { type: "fill", q: "Die Woche hat ___ Tage.", ans: "sieben", tip: "7 = sieben." },
    ],
  },
  u1l3: {
    vocab: [
      { de: "das Öl", fr: "l'huile", ar: "الزيت", ex: "Öl ist gelb." },
      { de: "der Löffel", fr: "la cuillère", ar: "الملعقة", ex: "Der Löffel ist klein." },
      { de: "der Bär", fr: "l'ours", ar: "الدب", ex: "Der Bär ist groß." },
      { de: "der Fuß", fr: "le pied", ar: "القدم", ex: "Mein Fuß tut weh." },
      { de: "süß", fr: "sucré / mignon", ar: "حلو", ex: "Der Kuchen ist süß." },
    ],
    exercises: [
      { type: "qcm", q: "Ü se prononce comme…", opts: ["OU français", "U français (tu)", "IOU", "É"], ans: 1, tip: "Ü ≈ U de 'tu'." },
      { type: "fill", q: "Le mot 'Straße' contient un ___ (lettre spéciale).", ans: "ß", tip: "Eszett = ss." },
      { type: "translate", q: "« Le gâteau est sucré. »", ans: "Der Kuchen ist süß", tip: "süß = doux/sucré." },
    ],
  },

  // ===== U2 — BEGRÜSSUNG =====
  u2l1: {
    vocab: [
      { de: "Servus!", fr: "Salut (Sud)", ar: "أهلاً (جنوب)", ex: "Servus, wie geht's?" },
      { de: "Tschüss!", fr: "Au revoir (informel)", ar: "إلى اللقاء", ex: "Tschüss, bis morgen!" },
      { de: "Auf Wiedersehen!", fr: "Au revoir (formel)", ar: "إلى اللقاء (تأدّب)", ex: "Auf Wiedersehen, Herr Müller!" },
      { de: "Bis später!", fr: "À plus tard !", ar: "إلى اللقاء لاحقًا", ex: "Bis später im Café!" },
      { de: "Bis bald!", fr: "À bientôt !", ar: "إلى قريب", ex: "Bis bald, meine Freundin!" },
    ],
    exercises: [
      { type: "qcm", q: "Que dit-on le matin ?", opts: ["Guten Abend", "Guten Morgen", "Gute Nacht", "Hallo"], ans: 1, tip: "Guten Morgen avant midi." },
      { type: "fill", q: "Au revoir informel : « ___ ! »", ans: "Tschüss", tip: "Très courant entre amis." },
      { type: "translate", q: "« À bientôt ! »", ans: "Bis bald", tip: "bis = jusqu'à." },
    ],
  },
  u2l2: {
    vocab: [
      { de: "Wie geht's?", fr: "Comment ça va ?", ar: "كيف الحال؟", ex: "Hallo! Wie geht's?" },
      { de: "Es geht", fr: "Ça va", ar: "لا بأس", ex: "Es geht, danke." },
      { de: "Nicht so gut", fr: "Pas très bien", ar: "ليس جيدًا", ex: "Heute geht es mir nicht so gut." },
      { de: "Ausgezeichnet!", fr: "Excellent !", ar: "ممتاز!", ex: "Mir geht's ausgezeichnet!" },
      { de: "Danke, gleichfalls!", fr: "Merci, de même !", ar: "شكرًا، وأنت أيضًا!", ex: "— Schönes Wochenende! — Danke, gleichfalls!" },
    ],
    exercises: [
      { type: "translate", q: "« Comment vas-tu ? » (tu)", ans: "Wie geht es dir", tip: "dir = à toi (Dativ)." },
      { type: "translate", q: "« Très bien, merci. »", ans: "Sehr gut, danke", tip: "sehr = très." },
      { type: "qcm", q: "Formule polie ?", opts: ["Wie geht's dir?", "Wie geht es Ihnen?", "Wie geht's?", "Wie bist du?"], ans: 1, tip: "Ihnen = à vous (poli)." },
    ],
  },
  u2l3: {
    vocab: [
      { de: "Es tut mir leid.", fr: "Je suis désolé.", ar: "أنا آسف.", ex: "Es tut mir leid, ich bin spät." },
      { de: "Kein Problem!", fr: "Pas de problème !", ar: "لا مشكلة!", ex: "Kein Problem, alles gut." },
      { de: "Entschuldigen Sie!", fr: "Excusez-moi !", ar: "المعذرة!", ex: "Entschuldigen Sie, wo ist der Bahnhof?" },
      { de: "Verzeihung!", fr: "Pardon !", ar: "عفوًا!", ex: "Verzeihung, das war mein Fehler." },
      { de: "Willkommen!", fr: "Bienvenue !", ar: "مرحبًا!", ex: "Herzlich willkommen in Berlin!" },
    ],
    exercises: [
      { type: "fill", q: "« Pardon » soutenu : « ___ ! »", ans: "Verzeihung", tip: "Plus formel que Entschuldigung." },
      { type: "translate", q: "« Bienvenue chez nous ! »", ans: "Willkommen bei uns", tip: "bei uns = chez nous." },
    ],
  },

  // ===== U3 — PRONOMS & SEIN/HABEN =====
  u3l1: {
    vocab: [
      { de: "ich bin", fr: "je suis", ar: "أنا", ex: "Ich bin müde." },
      { de: "du bist", fr: "tu es", ar: "أنتَ", ex: "Du bist nett." },
      { de: "er ist", fr: "il est", ar: "هو", ex: "Er ist Lehrer." },
      { de: "wir sind", fr: "nous sommes", ar: "نحن", ex: "Wir sind Freunde." },
      { de: "sie sind", fr: "ils sont", ar: "هم", ex: "Sie sind hier." },
    ],
    exercises: [
      { type: "fill", q: "Ich ___ Student. (sein)", ans: "bin", tip: "1ère pers. sg. → bin." },
      { type: "qcm", q: "Sie (Vous poli) ___ nett.", opts: ["ist", "bist", "sind", "seid"], ans: 2, tip: "Sie poli = 3e plur. → sind." },
      { type: "translate", q: "« Nous sommes à la maison. »", ans: "Wir sind zu Hause", tip: "zu Hause = à la maison." },
    ],
  },
  u3l2: {
    vocab: [
      { de: "ich habe", fr: "j'ai", ar: "عندي", ex: "Ich habe Hunger." },
      { de: "hast du?", fr: "as-tu ?", ar: "هل عندك؟", ex: "Hast du Zeit?" },
      { de: "kein / keine", fr: "aucun(e) / pas de", ar: "لا / ليس", ex: "Ich habe keine Zeit." },
      { de: "der Hunger", fr: "la faim", ar: "الجوع", ex: "Ich habe Hunger." },
      { de: "der Durst", fr: "la soif", ar: "العطش", ex: "Hast du Durst?" },
    ],
    exercises: [
      { type: "translate", q: "« Je n'ai pas de voiture. »", ans: "Ich habe kein Auto", tip: "kein pour un nom neutre." },
      { type: "fill", q: "Er ___ eine Schwester. (haben)", ans: "hat", tip: "3e sg. → hat." },
      { type: "qcm", q: "Négation avec 'Zeit' (F) ?", opts: ["kein", "keine", "nicht", "kein e"], ans: 1, tip: "féminin → keine." },
    ],
  },
  u3l3: {
    vocab: [
      { de: "verheiratet", fr: "marié(e)", ar: "متزوج(ة)", ex: "Ich bin verheiratet." },
      { de: "ledig", fr: "célibataire", ar: "أعزب/عزباء", ex: "Er ist ledig." },
      { de: "geschieden", fr: "divorcé(e)", ar: "مطلّق(ة)", ex: "Sie ist geschieden." },
      { de: "der Beruf", fr: "le métier", ar: "المهنة", ex: "Was ist Ihr Beruf?" },
      { de: "arbeiten", fr: "travailler", ar: "يعمل", ex: "Ich arbeite als Lehrer." },
    ],
    exercises: [
      { type: "translate", q: "« Je suis célibataire. »", ans: "Ich bin ledig", tip: "ledig = célibataire." },
      { type: "qcm", q: "Quel est ton métier ? (poli)", opts: ["Was bist du?", "Was machst du?", "Was ist Ihr Beruf?", "Was arbeitest?"], ans: 2, tip: "Ihr = votre (poli)." },
    ],
  },

  // ===== U4 — CHIFFRES =====
  u4l1: {
    vocab: [
      { de: "die Nummer", fr: "le numéro", ar: "الرقم", ex: "Meine Nummer ist 07..." },
      { de: "die Telefonnummer", fr: "le numéro de téléphone", ar: "رقم الهاتف", ex: "Wie ist deine Telefonnummer?" },
      { de: "einundzwanzig", fr: "vingt-et-un", ar: "واحد وعشرون", ex: "Ich bin 21 Jahre alt." },
      { de: "fünfunddreißig", fr: "trente-cinq", ar: "خمسة وثلاثون", ex: "Er ist 35." },
      { de: "hundert", fr: "cent", ar: "مئة", ex: "Das kostet hundert Euro." },
    ],
    exercises: [
      { type: "qcm", q: "42 en allemand ?", opts: ["vierundzwanzig", "zweiundvierzig", "vierzigzwei", "zweiundvierzich"], ans: 1, tip: "Unité + und + dizaine." },
      { type: "fill", q: "17 = sieb___", ans: "zehn", tip: "17 = siebzehn." },
      { type: "translate", q: "« J'ai 28 ans. »", ans: "Ich bin achtundzwanzig Jahre alt", tip: "acht+und+zwanzig." },
    ],
  },
  u4l2: {
    vocab: [
      { de: "der Preis", fr: "le prix", ar: "السعر", ex: "Der Preis ist 10 Euro." },
      { de: "kostet", fr: "coûte", ar: "يكلّف", ex: "Das kostet zwei Euro." },
      { de: "billig", fr: "bon marché", ar: "رخيص", ex: "Das ist billig." },
      { de: "teuer", fr: "cher", ar: "غالٍ", ex: "Das Auto ist teuer." },
      { de: "der Euro", fr: "l'euro", ar: "اليورو", ex: "Zehn Euro, bitte." },
    ],
    exercises: [
      { type: "translate", q: "« Ça coûte combien ? »", ans: "Was kostet das", tip: "was = quoi/combien." },
      { type: "qcm", q: "Contraire de 'teuer' ?", opts: ["groß", "klein", "billig", "gut"], ans: 2, tip: "billig = bon marché." },
    ],
  },
  u4l3: {
    vocab: [
      { de: "die Uhrzeit", fr: "l'heure", ar: "الوقت", ex: "Wie spät ist es?" },
      { de: "halb", fr: "et demie", ar: "والنصف", ex: "halb sieben = 6:30." },
      { de: "Viertel nach", fr: "et quart", ar: "والربع", ex: "Viertel nach acht = 8:15." },
      { de: "Viertel vor", fr: "moins le quart", ar: "إلا الربع", ex: "Viertel vor neun = 8:45." },
      { de: "Punkt", fr: "pile", ar: "تمامًا", ex: "Punkt zehn Uhr." },
    ],
    exercises: [
      { type: "qcm", q: "8:30 en allemand parlé ?", opts: ["acht Uhr dreißig", "halb neun", "halb acht", "acht halb"], ans: 1, tip: "halb neun = « à moitié vers 9 » = 8:30." },
      { type: "translate", q: "« Il est 7h15. »", ans: "Es ist Viertel nach sieben", tip: "Viertel nach + heure." },
    ],
  },

  // ===== U5 — VERBES RÉGULIERS =====
  u5l1: {
    vocab: [
      { de: "wohnen", fr: "habiter", ar: "يسكن", ex: "Ich wohne in Tunis." },
      { de: "lernen", fr: "apprendre", ar: "يتعلم", ex: "Ich lerne Deutsch." },
      { de: "spielen", fr: "jouer", ar: "يلعب", ex: "Kinder spielen." },
      { de: "kaufen", fr: "acheter", ar: "يشتري", ex: "Ich kaufe Brot." },
      { de: "hören", fr: "écouter", ar: "يسمع", ex: "Ich höre Musik." },
    ],
    exercises: [
      { type: "fill", q: "Ich ___ in Berlin. (wohnen)", ans: "wohne", tip: "1ère pers. → -e." },
      { type: "fill", q: "Du ___ Deutsch. (lernen)", ans: "lernst", tip: "2e pers. → -st." },
      { type: "translate", q: "« Nous jouons au football. »", ans: "Wir spielen Fußball", tip: "spielen + accusatif." },
    ],
  },
  u5l2: {
    vocab: [
      { de: "machen", fr: "faire", ar: "يفعل", ex: "Was machst du?" },
      { de: "sagen", fr: "dire", ar: "يقول", ex: "Er sagt nichts." },
      { de: "fragen", fr: "demander", ar: "يسأل", ex: "Ich frage den Lehrer." },
      { de: "antworten", fr: "répondre", ar: "يجيب", ex: "Er antwortet nicht." },
      { de: "brauchen", fr: "avoir besoin", ar: "يحتاج", ex: "Ich brauche Hilfe." },
    ],
    exercises: [
      { type: "qcm", q: "Ihr ___ nichts. (sagen)", opts: ["sagt", "sagen", "sage", "sagst"], ans: 0, tip: "ihr → -t." },
      { type: "translate", q: "« J'ai besoin d'eau. »", ans: "Ich brauche Wasser", tip: "brauchen + Akk." },
    ],
  },
  u5l3: {
    vocab: [
      { de: "arbeiten", fr: "travailler", ar: "يعمل", ex: "Er arbeitet viel." },
      { de: "kochen", fr: "cuisiner", ar: "يطبخ", ex: "Meine Mutter kocht gut." },
      { de: "putzen", fr: "nettoyer", ar: "ينظّف", ex: "Ich putze die Küche." },
      { de: "lesen", fr: "lire", ar: "يقرأ", ex: "Er liest ein Buch." },
      { de: "schreiben", fr: "écrire", ar: "يكتب", ex: "Sie schreibt einen Brief." },
    ],
    exercises: [
      { type: "fill", q: "Er ___ (arbeiten). Attention terminaison !", ans: "arbeitet", tip: "Radical en -t → ajoute -e- : arbeit-e-t." },
    ],
  },

  // ===== U6 — VERBES IRRÉGULIERS =====
  u6l1: {
    vocab: [
      { de: "fahren", fr: "aller (en véhicule)", ar: "يذهب بالسيارة", ex: "Ich fahre nach Berlin." },
      { de: "laufen", fr: "courir / marcher", ar: "يجري", ex: "Er läuft schnell." },
      { de: "schlafen", fr: "dormir", ar: "ينام", ex: "Ich schlafe gut." },
      { de: "essen", fr: "manger", ar: "يأكل", ex: "Ich esse Brot." },
      { de: "geben", fr: "donner", ar: "يعطي", ex: "Er gibt mir das Buch." },
    ],
    exercises: [
      { type: "qcm", q: "Er ___ Auto. (fahren)", opts: ["fahrt", "fährt", "fahrt", "führt"], ans: 1, tip: "a → ä : fährt." },
      { type: "fill", q: "Du ___ Pizza. (essen)", ans: "isst", tip: "essen : ich esse, du isst, er isst." },
      { type: "translate", q: "« Il dort beaucoup. »", ans: "Er schläft viel", tip: "a → ä : schläft." },
    ],
  },
  u6l2: {
    vocab: [
      { de: "sehen", fr: "voir", ar: "يرى", ex: "Ich sehe einen Hund." },
      { de: "lesen", fr: "lire", ar: "يقرأ", ex: "Er liest ein Buch." },
      { de: "sprechen", fr: "parler", ar: "يتكلم", ex: "Sie spricht Deutsch." },
      { de: "nehmen", fr: "prendre", ar: "يأخذ", ex: "Ich nehme den Bus." },
      { de: "helfen", fr: "aider", ar: "يساعد", ex: "Kannst du mir helfen?" },
    ],
    exercises: [
      { type: "fill", q: "Er ___ ein Buch. (lesen)", ans: "liest", tip: "e → ie : liest." },
      { type: "translate", q: "« Elle prend le train. »", ans: "Sie nimmt den Zug", tip: "nehmen : nimmt (3e sg)." },
    ],
  },

  // ===== U7 — MODAUX =====
  u7l1: {
    vocab: [
      { de: "können", fr: "pouvoir/savoir", ar: "يستطيع", ex: "Ich kann schwimmen." },
      { de: "müssen", fr: "devoir", ar: "يجب", ex: "Ich muss gehen." },
      { de: "wollen", fr: "vouloir", ar: "يريد", ex: "Ich will Kaffee." },
      { de: "dürfen", fr: "avoir le droit", ar: "يحقّ", ex: "Darf ich rauchen?" },
      { de: "sollen", fr: "devoir (moral)", ar: "ينبغي", ex: "Du sollst nicht lügen." },
    ],
    exercises: [
      { type: "translate", q: "« Puis-je entrer ? »", ans: "Darf ich reinkommen", tip: "dürfen = permission." },
      { type: "fill", q: "Wir ___ arbeiten. (devoir)", ans: "müssen", tip: "1ère plur. = müssen." },
      { type: "qcm", q: "Position du verbe à l'infinitif ?", opts: ["Au début", "Après le sujet", "Après le modal", "À la fin"], ans: 3, tip: "Structure : Modal (v.2) … Inf (fin)." },
    ],
  },
  u7l2: {
    vocab: [
      { de: "möchten", fr: "aimerais (poli)", ar: "أودّ", ex: "Ich möchte Tee, bitte." },
      { de: "mögen", fr: "aimer", ar: "يحب", ex: "Ich mag Katzen." },
      { de: "die Erlaubnis", fr: "la permission", ar: "الإذن", ex: "Ich habe die Erlaubnis." },
      { de: "verboten", fr: "interdit", ar: "ممنوع", ex: "Hier ist Rauchen verboten." },
      { de: "erlaubt", fr: "autorisé", ar: "مسموح", ex: "Parken ist erlaubt." },
    ],
    exercises: [
      { type: "translate", q: "« J'aimerais un café. »", ans: "Ich möchte einen Kaffee", tip: "möchten = forme polie." },
      { type: "qcm", q: "Différence mögen/möchten ?", opts: ["aucune", "mögen=aimer, möchten=aimerais", "möchten=obligation", "mögen=devoir"], ans: 1, tip: "möchten = souhait poli." },
    ],
  },

  // ===== U8 — ARTICLES / GENRES =====
  u8l1: {
    vocab: [
      { de: "der Tisch", fr: "la table (M)", ar: "الطاولة", ex: "Der Tisch ist rund." },
      { de: "die Blume", fr: "la fleur (F)", ar: "الزهرة", ex: "Die Blume ist schön." },
      { de: "das Fenster", fr: "la fenêtre (N)", ar: "النافذة", ex: "Das Fenster ist offen." },
      { de: "ein Mann", fr: "un homme", ar: "رجل", ex: "Ein Mann kommt." },
      { de: "eine Frau", fr: "une femme", ar: "امرأة", ex: "Eine Frau lacht." },
    ],
    exercises: [
      { type: "qcm", q: "Article de 'Kind' ?", opts: ["der", "die", "das", "ein"], ans: 2, tip: "das Kind (neutre)." },
      { type: "fill", q: "___ Sonne (F).", ans: "die", tip: "die Sonne (le soleil est féminin en allemand !)." },
      { type: "translate", q: "« Un livre est intéressant. »", ans: "Ein Buch ist interessant", tip: "ein pour neutre." },
    ],
  },
  u8l2: {
    vocab: [
      { de: "kein Mann", fr: "aucun homme", ar: "لا رجل", ex: "Es ist kein Mann hier." },
      { de: "keine Frau", fr: "aucune femme", ar: "لا امرأة", ex: "Es ist keine Frau da." },
      { de: "kein Kind", fr: "aucun enfant", ar: "لا طفل", ex: "Es ist kein Kind hier." },
      { de: "mein Bruder", fr: "mon frère", ar: "أخي", ex: "Mein Bruder ist jung." },
      { de: "deine Schwester", fr: "ta sœur", ar: "أختك", ex: "Wo ist deine Schwester?" },
    ],
    exercises: [
      { type: "fill", q: "___ Auto (mon, neutre).", ans: "mein", tip: "mein pour M/N sg." },
      { type: "translate", q: "« Sa mère (à lui) est gentille. »", ans: "Seine Mutter ist nett", tip: "seine (F sg)." },
    ],
  },

  // ===== U9 — ACCUSATIF =====
  u9l1: {
    vocab: [
      { de: "den Hund", fr: "le chien (Akk)", ar: "الكلب (مفعول)", ex: "Ich sehe den Hund." },
      { de: "einen Freund", fr: "un ami (Akk)", ans: "", ar: "صديقًا", ex: "Ich habe einen Freund." },
      { de: "die Katze", fr: "le chat (F Akk = Nom)", ar: "القطة", ex: "Ich sehe die Katze." },
      { de: "das Auto", fr: "la voiture (N)", ar: "السيارة", ex: "Ich kaufe das Auto." },
      { de: "keinen Hund", fr: "aucun chien", ar: "لا كلبَ", ex: "Ich habe keinen Hund." },
    ] as VocabItem[],
    exercises: [
      { type: "fill", q: "Ich sehe ___ Mann. (Akk M)", ans: "den", tip: "M Akk → den." },
      { type: "translate", q: "« J'ai un chat. »", ans: "Ich habe eine Katze", tip: "F Akk = eine." },
      { type: "qcm", q: "Akk neutre indéfini ?", opts: ["das", "ein", "einen", "eine"], ans: 1, tip: "ein Buch (Akk = Nom pour N)." },
    ],
  },
  u9l2: {
    vocab: [
      { de: "ohne", fr: "sans (+Akk)", ar: "بدون", ex: "Ohne Zucker, bitte." },
      { de: "für", fr: "pour (+Akk)", ar: "لأجل", ex: "Ein Geschenk für dich." },
      { de: "gegen", fr: "contre (+Akk)", ar: "ضدّ", ex: "Ich bin gegen den Krieg." },
      { de: "durch", fr: "à travers (+Akk)", ar: "عبر", ex: "Wir gehen durch den Park." },
      { de: "um", fr: "autour de (+Akk)", ar: "حول", ex: "Um die Ecke." },
    ],
    exercises: [
      { type: "fill", q: "Ein Geschenk für ___ (toi, Akk).", ans: "dich", tip: "du → dich (Akk)." },
      { type: "qcm", q: "Ohne toujours suivi de… ?", opts: ["Nom", "Akk", "Dat", "Gen"], ans: 1, tip: "ohne + Akk." },
    ],
  },

  // ===== U10 — CONVERSATION QUOTIDIENNE =====
  u10l1: {
    vocab: [
      { de: "Wie bitte?", fr: "Pardon ? (répéter)", ar: "معذرة؟", ex: "Wie bitte? Ich verstehe nicht." },
      { de: "langsam, bitte", fr: "lentement, s'il vous plaît", ar: "ببطء من فضلك", ex: "Sprechen Sie langsam, bitte." },
      { de: "Ich verstehe nicht.", fr: "Je ne comprends pas.", ar: "لا أفهم.", ex: "Entschuldigung, ich verstehe nicht." },
      { de: "Können Sie wiederholen?", fr: "Pouvez-vous répéter ?", ar: "هل يمكنك الإعادة؟", ex: "Können Sie das wiederholen?" },
      { de: "Was bedeutet das?", fr: "Qu'est-ce que ça veut dire ?", ar: "ماذا يعني ذلك؟", ex: "Was bedeutet 'schön'?" },
    ],
    exercises: [
      { type: "translate", q: "« Je ne comprends pas. »", ans: "Ich verstehe nicht", tip: "verstehen = comprendre." },
      { type: "translate", q: "« Parlez lentement, s'il vous plaît. »", ans: "Sprechen Sie langsam, bitte", tip: "Impératif poli : Sprechen Sie…" },
    ],
  },
};

// ============================================================
// UNITÉS BONUS A1 : CULTURE, VOYAGE, SANTÉ, LOISIRS
// ============================================================
const BONUS_UNITS: Unit[] = [
  {
    id: "u11", title: "Reisen — Voyager", titleAr: "السفر",
    icon: "✈️", desc: "Aéroport, hôtel, transports, itinéraire",
    color: "#0ea5e9", level: "A1",
    lessons: [
      {
        id: "u11l1", title: "À l'aéroport et à la gare",
        content: `**Vocabulaire du voyage** — situations concrètes A1.

**À l'aéroport (der Flughafen) :**
• der Flug — le vol · der Koffer — la valise
• der Pass — le passeport · das Ticket — le billet
• einchecken — s'enregistrer · das Gepäck — les bagages

**À la gare (der Bahnhof) :**
• der Zug — le train · das Gleis — la voie
• der Fahrplan — les horaires · die Fahrkarte — le billet
• einsteigen / aussteigen — monter / descendre
• Der Zug fährt ab um 10 Uhr. — Le train part à 10h.

**Phrases utiles :**
• Eine Fahrkarte nach München, bitte.
• Von welchem Gleis fährt der Zug?
• Wann kommt der Zug an?`,
        vocab: [
          { de: "der Flughafen", fr: "l'aéroport", ar: "المطار", ex: "Der Flughafen ist groß." },
          { de: "der Bahnhof", fr: "la gare", ar: "المحطة", ex: "Wo ist der Bahnhof?" },
          { de: "die Fahrkarte", fr: "le billet", ar: "التذكرة", ex: "Eine Fahrkarte, bitte." },
          { de: "der Koffer", fr: "la valise", ar: "الحقيبة", ex: "Mein Koffer ist schwer." },
          { de: "einsteigen", fr: "monter (dans)", ar: "يصعد", ex: "Bitte einsteigen!" },
          { de: "aussteigen", fr: "descendre", ar: "ينزل", ex: "Ich steige in Berlin aus." },
          { de: "das Gleis", fr: "la voie", ar: "الرصيف", ex: "Gleis fünf." },
          { de: "abfahren", fr: "partir", ar: "يغادر", ex: "Der Zug fährt ab." },
          { de: "ankommen", fr: "arriver", ar: "يصل", ex: "Wir kommen um 20 Uhr an." },
          { de: "die Verspätung", fr: "le retard", ar: "التأخير", ex: "10 Minuten Verspätung." },
        ],
        exercises: [
          { type: "qcm", q: "Un billet pour Munich, s'il vous plaît.", opts: ["Ein Ticket München", "Eine Fahrkarte nach München, bitte", "Ich gehe München", "Zug bitte"], ans: 1, tip: "nach + ville sans article." },
          { type: "fill", q: "Der Zug ___ ab um 10 Uhr.", ans: "fährt", tip: "abfahren : sépare : fährt … ab." },
          { type: "translate", q: "« De quelle voie part le train ? »", ans: "Von welchem Gleis fährt der Zug", tip: "von + Dat." },
          { type: "qcm", q: "Contraire de 'einsteigen' ?", opts: ["ausgehen", "aussteigen", "abfahren", "ankommen"], ans: 1, tip: "aus- = out." },
        ],
      },
      {
        id: "u11l2", title: "À l'hôtel",
        content: `**À l'hôtel (das Hotel) :**

• das Einzelzimmer — chambre simple
• das Doppelzimmer — chambre double
• das Frühstück inklusive — petit-déj. inclus
• die Rezeption — la réception
• der Schlüssel — la clé
• checken ein / aus — arrivée / départ

**Dialogues types :**
— Ich habe ein Zimmer reserviert.
— Auf welchen Namen?
— Auf den Namen Müller.
— Hier ist Ihr Schlüssel, Zimmer 204.`,
        vocab: [
          { de: "das Einzelzimmer", fr: "chambre simple", ar: "غرفة فردية", ex: "Ein Einzelzimmer, bitte." },
          { de: "das Doppelzimmer", fr: "chambre double", ar: "غرفة مزدوجة", ex: "Doppelzimmer mit Bad." },
          { de: "reservieren", fr: "réserver", ar: "يحجز", ex: "Ich möchte reservieren." },
          { de: "der Schlüssel", fr: "la clé", ar: "المفتاح", ex: "Der Schlüssel, bitte." },
          { de: "die Rezeption", fr: "la réception", ar: "الاستقبال", ex: "An der Rezeption." },
          { de: "inklusive", fr: "inclus", ar: "شامل", ex: "Frühstück inklusive." },
          { de: "die Nacht", fr: "la nuit", ar: "الليلة", ex: "Für drei Nächte." },
          { de: "das Bad", fr: "la salle de bain", ar: "الحمام", ex: "Zimmer mit Bad." },
        ],
        exercises: [
          { type: "translate", q: "« J'ai réservé une chambre. »", ans: "Ich habe ein Zimmer reserviert", tip: "Perfekt : haben + Part.II." },
          { type: "fill", q: "Ich möchte ___ Doppelzimmer.", ans: "ein", tip: "Zimmer = neutre." },
          { type: "qcm", q: "Pour combien de nuits ?", opts: ["Wie viele Nächte?", "Für wie viele Nächte?", "Wann Nächte?", "Was Nächte?"], ans: 1, tip: "für + Akk." },
        ],
      },
      {
        id: "u11l3", title: "Demander son chemin",
        content: `**Sich orientieren — S'orienter :**

• geradeaus — tout droit
• links / rechts — à gauche / à droite
• um die Ecke — au coin
• neben — à côté de
• gegenüber — en face de
• bis zur Kreuzung — jusqu'au carrefour

**Phrases clés :**
• Entschuldigung, wo ist der Bahnhof?
• Wie komme ich zum Zentrum?
• Gehen Sie geradeaus, dann links.
• Ist es weit? — Nein, nur 5 Minuten zu Fuß.`,
        vocab: [
          { de: "geradeaus", fr: "tout droit", ar: "مباشرة", ex: "Gehen Sie geradeaus." },
          { de: "links", fr: "à gauche", ar: "يسارًا", ex: "Nach links." },
          { de: "rechts", fr: "à droite", ar: "يمينًا", ex: "Nach rechts." },
          { de: "die Ecke", fr: "le coin", ar: "الزاوية", ex: "Um die Ecke." },
          { de: "die Kreuzung", fr: "le carrefour", ar: "التقاطع", ex: "An der Kreuzung." },
          { de: "die Ampel", fr: "le feu tricolore", ar: "إشارة المرور", ex: "Bei der Ampel." },
          { de: "zu Fuß", fr: "à pied", ar: "مشيًا", ex: "5 Minuten zu Fuß." },
          { de: "weit", fr: "loin", ar: "بعيد", ex: "Ist es weit?" },
          { de: "in der Nähe", fr: "près", ar: "قريب", ex: "In der Nähe vom Bahnhof." },
        ],
        exercises: [
          { type: "translate", q: "« Excusez-moi, où est la gare ? »", ans: "Entschuldigung, wo ist der Bahnhof", tip: "Formule polie." },
          { type: "fill", q: "Gehen Sie ___ und dann links.", ans: "geradeaus", tip: "tout droit." },
          { type: "qcm", q: "Est-ce loin ?", opts: ["Ist weit?", "Ist es weit?", "Weit ist?", "Es weit ist?"], ans: 1, tip: "es en 2e position." },
        ],
      },
    ],
  },
  {
    id: "u12", title: "Gesundheit — Santé", titleAr: "الصحة",
    icon: "🏥", desc: "Corps, douleurs, chez le médecin, pharmacie",
    color: "#ef4444", level: "A1",
    lessons: [
      {
        id: "u12l1", title: "Le corps humain",
        content: `**Der Körper — Le corps :**

**Tête (der Kopf) :** das Auge (œil) · die Nase · der Mund · das Ohr · der Zahn · das Haar
**Tronc :** der Hals (cou) · die Schulter · der Rücken (dos) · der Bauch (ventre) · die Brust
**Membres :** der Arm · die Hand · der Finger · das Bein · der Fuß

**Astuce pluriels :** die Augen, die Ohren, die Zähne, die Hände, die Füße.`,
        vocab: [
          { de: "der Kopf", fr: "la tête", ar: "الرأس", ex: "Mein Kopf tut weh." },
          { de: "das Auge", fr: "l'œil", ar: "العين", ex: "Ich habe blaue Augen." },
          { de: "die Nase", fr: "le nez", ar: "الأنف", ex: "Meine Nase läuft." },
          { de: "der Mund", fr: "la bouche", ar: "الفم", ex: "Öffne den Mund!" },
          { de: "der Zahn", fr: "la dent", ar: "السن", ex: "Der Zahn tut weh." },
          { de: "der Bauch", fr: "le ventre", ar: "البطن", ex: "Ich habe Bauchschmerzen." },
          { de: "die Hand", fr: "la main", ar: "اليد", ex: "Gib mir deine Hand." },
          { de: "das Bein", fr: "la jambe", ar: "الساق", ex: "Mein Bein ist gebrochen." },
        ],
        exercises: [
          { type: "qcm", q: "Pluriel de 'Fuß' ?", opts: ["Fußen", "Füße", "Fusse", "Füßer"], ans: 1, tip: "Umlaut + -e : Füße." },
          { type: "translate", q: "« J'ai mal à la tête. »", ans: "Ich habe Kopfschmerzen", tip: "Kopf + Schmerzen (composé)." },
        ],
      },
      {
        id: "u12l2", title: "Chez le médecin",
        content: `**Beim Arzt — Chez le médecin :**

• Ich habe … Schmerzen. — J'ai mal à …
• Mir ist schlecht. — J'ai la nausée.
• Ich habe Fieber. — J'ai de la fièvre.
• Husten (m.) — la toux · Schnupfen — rhume · Grippe — grippe

**Dialogue :**
— Was fehlt Ihnen? / Wo tut es weh?
— Ich habe Halsschmerzen und Fieber.
— Öffnen Sie den Mund, bitte.
— Sie brauchen ein Antibiotikum.`,
        vocab: [
          { de: "der Arzt / die Ärztin", fr: "le/la médecin", ar: "الطبيب(ة)", ex: "Ich gehe zum Arzt." },
          { de: "die Praxis", fr: "le cabinet", ar: "العيادة", ex: "Die Praxis ist offen." },
          { de: "das Fieber", fr: "la fièvre", ar: "الحمى", ex: "Ich habe Fieber." },
          { de: "die Grippe", fr: "la grippe", ar: "الإنفلونزا", ex: "Er hat Grippe." },
          { de: "der Husten", fr: "la toux", ar: "السعال", ex: "Ich habe Husten." },
          { de: "das Rezept", fr: "l'ordonnance", ar: "الوصفة", ex: "Ein Rezept, bitte." },
          { de: "die Tablette", fr: "le comprimé", ar: "قرص", ex: "Drei Tabletten pro Tag." },
          { de: "krank", fr: "malade", ar: "مريض", ex: "Ich bin krank." },
          { de: "gesund", fr: "en bonne santé", ar: "بصحة جيدة", ex: "Jetzt bin ich gesund." },
        ],
        exercises: [
          { type: "translate", q: "« J'ai mal à la gorge. »", ans: "Ich habe Halsschmerzen", tip: "Hals + Schmerzen." },
          { type: "fill", q: "Ich habe ___ (fièvre) und Husten.", ans: "Fieber", tip: "das Fieber." },
          { type: "qcm", q: "« Où avez-vous mal ? »", opts: ["Wie geht?", "Wo tut es weh?", "Was ist?", "Wie krank?"], ans: 1, tip: "wehtun = faire mal." },
        ],
      },
    ],
  },
  {
    id: "u13", title: "Freizeit — Loisirs & culture", titleAr: "أوقات الفراغ والثقافة",
    icon: "🎭", desc: "Hobbies, sports, cinéma, fêtes",
    color: "#a855f7", level: "A1",
    lessons: [
      {
        id: "u13l1", title: "Hobbies et sports",
        content: `**Freizeitaktivitäten :**

• Was machst du in deiner Freizeit? — Que fais-tu de ton temps libre ?
• Ich spiele gern … — J'aime bien jouer à/de …
• Ich mag … — J'aime …
• Ich liebe … — J'adore …
• Ich hasse … — Je déteste …

**Sports & activités :**
Fußball · Basketball · Tennis · Schwimmen · Laufen · Yoga · Lesen · Musik hören · fernsehen · kochen · reisen · fotografieren

**Instruments (spielen + article) :**
Ich spiele Klavier / Gitarre / Geige.`,
        vocab: [
          { de: "die Freizeit", fr: "le temps libre", ar: "وقت الفراغ", ex: "In meiner Freizeit lese ich." },
          { de: "das Hobby", fr: "le hobby", ar: "الهواية", ex: "Mein Hobby ist Musik." },
          { de: "Fußball spielen", fr: "jouer au football", ar: "يلعب كرة القدم", ex: "Er spielt Fußball." },
          { de: "schwimmen", fr: "nager", ar: "يسبح", ex: "Ich schwimme gern." },
          { de: "reisen", fr: "voyager", ar: "يسافر", ex: "Wir reisen viel." },
          { de: "fernsehen", fr: "regarder la TV", ar: "يشاهد التلفاز", ex: "Abends sehe ich fern." },
          { de: "das Kino", fr: "le cinéma", ar: "السينما", ex: "Ins Kino gehen." },
          { de: "das Konzert", fr: "le concert", ar: "الحفلة", ex: "Ein Konzert besuchen." },
          { de: "gern", fr: "volontiers / aimer bien", ar: "بسرور", ex: "Ich lese gern." },
        ],
        exercises: [
          { type: "translate", q: "« J'aime bien jouer au tennis. »", ans: "Ich spiele gern Tennis", tip: "gern après le verbe conjugué." },
          { type: "qcm", q: "Verbe séparable ?", opts: ["schwimmen", "reisen", "fernsehen", "spielen"], ans: 2, tip: "fern|sehen : ich sehe fern." },
          { type: "fill", q: "Ich ___ ins Kino. (aller)", ans: "gehe", tip: "gehen : ich gehe." },
        ],
      },
      {
        id: "u13l2", title: "Fêtes et traditions allemandes",
        content: `**Deutsche Feste :**

• Weihnachten (25 déc.) — Noël · Frohe Weihnachten!
• Silvester (31 déc.) — Réveillon · Prosit Neujahr!
• Ostern — Pâques
• Oktoberfest — fête de la bière (Munich)
• Karneval / Fasching — Carnaval (Cologne, Mayence)
• der Geburtstag — anniversaire · Herzlichen Glückwunsch!

**Culture pratique :**
• On se serre la main pour dire bonjour formel.
• On dit "Mahlzeit!" avant de manger au bureau.
• "Prost!" en trinquant (regarder dans les yeux !).`,
        vocab: [
          { de: "Weihnachten", fr: "Noël", ar: "عيد الميلاد", ex: "Frohe Weihnachten!" },
          { de: "Ostern", fr: "Pâques", ar: "الفصح", ex: "Frohe Ostern!" },
          { de: "der Geburtstag", fr: "l'anniversaire", ar: "عيد الميلاد", ex: "Alles Gute zum Geburtstag!" },
          { de: "das Geschenk", fr: "le cadeau", ar: "الهدية", ex: "Ein schönes Geschenk." },
          { de: "feiern", fr: "fêter", ar: "يحتفل", ex: "Wir feiern zusammen." },
          { de: "Prost!", fr: "Santé !", ar: "بصحتك!", ex: "Prost, meine Freunde!" },
          { de: "Herzlichen Glückwunsch", fr: "Toutes mes félicitations", ar: "تهانينا", ex: "Herzlichen Glückwunsch zur Hochzeit!" },
        ],
        exercises: [
          { type: "translate", q: "« Joyeux anniversaire ! »", ans: "Alles Gute zum Geburtstag", tip: "Formule standard." },
          { type: "qcm", q: "Quelle fête a lieu à Munich ?", opts: ["Karneval", "Oktoberfest", "Ostern", "Silvester"], ans: 1, tip: "Oktoberfest = Munich." },
        ],
      },
    ],
  },
];

// ============================================================
// APPLICATION EN SIDE-EFFECT
// ============================================================
let applied = false;
export function applyA1Extras() {
  if (applied) return;
  applied = true;
  // 1) Enrichir les leçons existantes
  for (const u of UNITS) {
    for (const l of u.lessons) {
      const pack = A1_EXTRA_PACKS[l.id];
      if (!pack) continue;
      if (pack.vocab) l.vocab.push(...pack.vocab);
      if (pack.exercises) l.exercises.push(...pack.exercises);
    }
  }
  // 2) Ajouter les unités bonus (si pas déjà présentes)
  for (const bu of BONUS_UNITS) {
    if (!UNITS.find((u) => u.id === bu.id)) UNITS.push(bu);
  }
}
applyA1Extras();
