// Final exam question bank (persisted in localStorage).
// Each question carries FR + AR translations so the bank stays bilingual.

export type QType = "qcm" | "audio" | "translate";

export interface ExamQuestion {
  id: string;
  type: QType;
  module: string;
  module_ar?: string;
  question: string;
  question_ar?: string;
  audio?: string; // German text to be spoken (for type "audio")
  options?: string[]; // FR/DE options (for qcm + audio)
  options_ar?: string[]; // optional AR translations of options
  answer: string;
  explain: string;
  explain_ar?: string;
}

const STORAGE_KEY = "deutschmeister.finalExamBank.v1";

const uid = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_QUESTIONS: ExamQuestion[] = [
  { id: uid(), type: "qcm", module: "Verbe SEIN", module_ar: "الفعل sein", question: "Comment dit-on « tu es » en allemand ?", question_ar: "كيف نقول «أنتَ تكون» بالألمانية؟", options: ["du bin", "du bist", "du ist", "du sind"], answer: "du bist", explain: "Verbe sein → ich bin, du bist, er ist, wir sind, ihr seid, sie sind.", explain_ar: "تصريف sein: ich bin, du bist, er ist, wir sind, ihr seid, sie sind." },
  { id: uid(), type: "qcm", module: "Verbe HABEN", module_ar: "الفعل haben", question: "« Wir ___ Hausaufgaben » (devoirs)", question_ar: "«Wir ___ Hausaufgaben» (واجبات)", options: ["habe", "hast", "hat", "haben"], answer: "haben", explain: "haben → wir haben, ihr habt, sie haben.", explain_ar: "haben: wir haben, ihr habt, sie haben." },
  { id: uid(), type: "translate", module: "Présentation", module_ar: "التعريف بالنفس", question: "Traduisez : « Je viens de Tunisie »", question_ar: "ترجم: «أنا من تونس»", answer: "ich komme aus tunesien", explain: "« Ich komme aus + pays ». Tunesien ne prend pas d'article.", explain_ar: "«Ich komme aus + بلد». Tunesien بدون أداة تعريف." },
  { id: uid(), type: "translate", module: "Présentation", module_ar: "التعريف بالنفس", question: "Traduisez : « Je m'appelle Haithem »", question_ar: "ترجم: «اسمي هيثم»", answer: "ich heisse haithem", explain: "« Ich heiße [nom] » ou « Ich bin [nom] » ou « Mein Name ist [nom] ».", explain_ar: "«Ich heiße [الاسم]» أو «Ich bin [الاسم]» أو «Mein Name ist [الاسم]»." },
  { id: uid(), type: "qcm", module: "Pays", module_ar: "البلدان", question: "« Je viens de Suisse » =", question_ar: "«أنا من سويسرا» =", options: ["Ich komme aus Schweiz", "Ich komme aus die Schweiz", "Ich komme aus der Schweiz", "Ich komme von Schweiz"], answer: "Ich komme aus der Schweiz", explain: "die Schweiz → aus der Schweiz (datif féminin).", explain_ar: "die Schweiz → aus der Schweiz (مؤنث في حالة الجر)." },
  { id: uid(), type: "qcm", module: "Pays", module_ar: "البلدان", question: "« USA » au datif après « aus » :", question_ar: "«USA» بعد «aus» في حالة الجر:", options: ["aus USA", "aus die USA", "aus den USA", "aus der USA"], answer: "aus den USA", explain: "die USA est pluriel → aus den USA (datif pluriel).", explain_ar: "die USA جمع → aus den USA (جمع في حالة الجر)." },
  { id: uid(), type: "qcm", module: "W-Fragen", module_ar: "أسئلة W", question: "« D'où viens-tu ? » =", question_ar: "«من أين أنت؟» =", options: ["Wo kommst du?", "Wer kommst du?", "Woher kommst du?", "Wohin kommst du?"], answer: "Woher kommst du?", explain: "Woher = d'où (origine). Wo = où. Wohin = vers où.", explain_ar: "Woher = من أين. Wo = أين. Wohin = إلى أين." },
  { id: uid(), type: "qcm", module: "W-Fragen", module_ar: "أسئلة W", question: "« Comment t'appelles-tu ? » =", question_ar: "«ما اسمك؟» =", options: ["Was heißt du?", "Wie heißt du?", "Wer heißt du?", "Wo heißt du?"], answer: "Wie heißt du?", explain: "Wie = comment.", explain_ar: "Wie = كيف." },
  { id: uid(), type: "qcm", module: "Nombres", module_ar: "الأعداد", question: "Comment dit-on « 21 » en allemand ?", question_ar: "كيف نقول «21» بالألمانية؟", options: ["zwanzigundeins", "einsundzwanzig", "einundzwanzig", "zwanzigeins"], answer: "einundzwanzig", explain: "21 = ein-und-zwanzig (un-et-vingt).", explain_ar: "21 = ein-und-zwanzig (واحد وعشرون). الآحاد قبل العشرات!" },
  { id: uid(), type: "audio", module: "Nombres", module_ar: "الأعداد", question: "Écoutez et choisissez le nombre :", question_ar: "استمع واختر العدد:", audio: "siebenundvierzig", options: ["27", "47", "74", "57"], answer: "47", explain: "sieben (7) + und + vierzig (40) = 47.", explain_ar: "sieben (7) + und + vierzig (40) = 47." },
  { id: uid(), type: "translate", module: "Famille", module_ar: "العائلة", question: "Traduisez : « Ma mère est professeure »", question_ar: "ترجم: «أمي معلّمة»", answer: "meine mutter ist lehrerin", explain: "Ma mère = meine Mutter (féminin). Lehrer (m) → Lehrerin (f).", explain_ar: "أمي = meine Mutter (مؤنث). Lehrer (مذكر) → Lehrerin (مؤنث)." },
  { id: uid(), type: "qcm", module: "Famille", module_ar: "العائلة", question: "« die Geschwister » signifie :", question_ar: "«die Geschwister» تعني:", options: ["les parents", "les frères et sœurs", "les enfants", "les grands-parents"], options_ar: ["الوالدان", "الإخوة والأخوات", "الأطفال", "الجَدّان"], answer: "les frères et sœurs", explain: "die Geschwister = frères et sœurs.", explain_ar: "die Geschwister = الإخوة والأخوات." },
  { id: uid(), type: "qcm", module: "Salutations", module_ar: "التحيات", question: "Salutation formelle pour le matin :", question_ar: "تحية رسمية للصباح:", options: ["Hallo!", "Tschüss!", "Guten Morgen!", "Auf Wiedersehen!"], answer: "Guten Morgen!", explain: "Guten Morgen jusqu'à 10h, Guten Tag dans la journée, Guten Abend à partir de 18h.", explain_ar: "Guten Morgen حتى الساعة 10، Guten Tag خلال النهار، Guten Abend من الساعة 18." },
  { id: uid(), type: "audio", module: "Prononciation", module_ar: "النطق", question: "Quel mot entendez-vous ?", question_ar: "ما الكلمة التي تسمعها؟", audio: "Schiff", options: ["Schaf", "Schiff", "schief", "schaff"], answer: "Schiff", explain: "Schiff (bateau) = i COURT « shif ».", explain_ar: "Schiff (سفينة) = i قصيرة «شِف»." },
  { id: uid(), type: "qcm", module: "Prononciation", module_ar: "النطق", question: "« ie » en allemand se prononce :", question_ar: "«ie» بالألمانية تُنطق:", options: ["i court", "i long", "i + e séparés", "é"], options_ar: ["i قصيرة", "i طويلة", "i + e منفصلتان", "é"], answer: "i long", explain: "ie = TOUJOURS i long (Sieben, Wie, Vier).", explain_ar: "ie = دائماً i طويلة (Sieben, Wie, Vier)." },
  { id: uid(), type: "qcm", module: "Heure", module_ar: "الساعة", question: "« halb drei » signifie :", question_ar: "«halb drei» تعني:", options: ["3h00", "3h30", "2h30", "2h00"], answer: "2h30", explain: "« halb drei » = 30 min AVANT 3h = 2h30.", explain_ar: "«halb drei» = 30 دقيقة قبل الثالثة = 2:30." },
  { id: uid(), type: "translate", module: "Heure", module_ar: "الساعة", question: "Traduisez : « Il est 8h15 » (parlé)", question_ar: "ترجم: «الساعة 8:15» (محكي)", answer: "es ist viertel nach acht", explain: "Viertel nach acht = un quart après huit.", explain_ar: "Viertel nach acht = ربع بعد الثامنة." },
  { id: uid(), type: "translate", module: "Restaurant", module_ar: "المطعم", question: "Traduisez : « L'addition, s'il vous plaît »", question_ar: "ترجم: «الفاتورة من فضلك»", answer: "die rechnung bitte", explain: "die Rechnung = l'addition.", explain_ar: "die Rechnung = الفاتورة." },
  { id: uid(), type: "qcm", module: "Restaurant", module_ar: "المطعم", question: "« Je voudrais un café » =", question_ar: "«أريد قهوة» =", options: ["Ich will ein Kaffee", "Ich hätte gern einen Kaffee", "Ich möchte das Kaffee", "Ich nehme Kaffee"], answer: "Ich hätte gern einen Kaffee", explain: "« Ich hätte gern... » = forme polie. Kaffee masculin → einen.", explain_ar: "«Ich hätte gern...» = صيغة مهذبة. Kaffee مذكر → einen." },
  { id: uid(), type: "qcm", module: "Directions", module_ar: "الاتجاهات", question: "« Tournez à gauche » =", question_ar: "«انعطف يساراً» =", options: ["Gehen Sie geradeaus", "Biegen Sie rechts ab", "Biegen Sie links ab", "Gehen Sie zurück"], answer: "Biegen Sie links ab", explain: "abbiegen = tourner. links = à gauche.", explain_ar: "abbiegen = ينعطف. links = يسار." },
  { id: uid(), type: "translate", module: "Directions", module_ar: "الاتجاهات", question: "Traduisez : « Où est la gare ? »", question_ar: "ترجم: «أين المحطة؟»", answer: "wo ist der bahnhof", explain: "Wo = où. der Bahnhof = la gare (masculin).", explain_ar: "Wo = أين. der Bahnhof = المحطة (مذكر)." },
  { id: uid(), type: "qcm", module: "Shopping", module_ar: "التسوّق", question: "« Combien ça coûte ? » =", question_ar: "«بكم هذا؟» =", options: ["Wo kostet das?", "Wie viel kostet das?", "Was ist das?", "Wer kostet das?"], answer: "Wie viel kostet das?", explain: "Wie viel = combien.", explain_ar: "Wie viel = كم." },
  { id: uid(), type: "translate", module: "Météo", module_ar: "الطقس", question: "Traduisez : « Il pleut »", question_ar: "ترجم: «إنها تمطر»", answer: "es regnet", explain: "es regnet = il pleut.", explain_ar: "es regnet = إنها تمطر." },
  { id: uid(), type: "qcm", module: "Météo", module_ar: "الطقس", question: "« Il fait froid » =", question_ar: "«الجو بارد» =", options: ["Es ist warm", "Es ist heiß", "Es ist kalt", "Es ist kühl"], answer: "Es ist kalt", explain: "kalt = froid.", explain_ar: "kalt = بارد." },
  { id: uid(), type: "qcm", module: "Pluriels", module_ar: "الجموع", question: "Pluriel de « das Haus » :", question_ar: "جمع «das Haus»:", options: ["die Hause", "die Hauses", "die Häuser", "die Hausen"], answer: "die Häuser", explain: "Haus → Häuser (Umlaut a→ä + er).", explain_ar: "Haus → Häuser (Umlaut + er)." },
  { id: uid(), type: "qcm", module: "Pluriels", module_ar: "الجموع", question: "Pluriel de « der Bus » :", question_ar: "جمع «der Bus»:", options: ["die Bus", "die Buse", "die Busse", "die Büsse"], answer: "die Busse", explain: "Bus → Busse (+se avec deux s).", explain_ar: "Bus → Busse (+se بحرفي s)." },
  { id: uid(), type: "qcm", module: "Négation KEIN", module_ar: "النفي KEIN", question: "« Je n'ai pas de vélo » =", question_ar: "«ليس لدي درّاجة» =", options: ["Ich habe nicht Fahrrad", "Ich habe kein Fahrrad", "Ich habe keine Fahrrad", "Ich habe keinen Fahrrad"], answer: "Ich habe kein Fahrrad", explain: "Fahrrad neutre (das) → kein.", explain_ar: "Fahrrad محايد (das) → kein." },
  { id: uid(), type: "qcm", module: "Articles", module_ar: "أدوات التعريف", question: "Au pluriel, l'article indéfini est :", question_ar: "أداة النكرة في الجمع هي:", options: ["eine", "ein", "einen", "rien (n'existe pas)"], options_ar: ["eine", "ein", "einen", "لا شيء (غير موجودة)"], answer: "rien (n'existe pas)", explain: "❌ Pas d'article indéfini au pluriel.", explain_ar: "❌ لا توجد أداة نكرة في الجمع." },
  { id: uid(), type: "translate", module: "Hobbys", module_ar: "الهوايات", question: "Traduisez : « J'aime cuisiner »", question_ar: "ترجم: «أحبّ الطبخ»", answer: "ich koche gern", explain: "« Ich + verbe + gern » = j'aime + verbe.", explain_ar: "«Ich + فعل + gern» = أحبّ + الفعل." },
  { id: uid(), type: "audio", module: "Vocabulaire", module_ar: "المفردات", question: "Quel mot entendez-vous ?", question_ar: "ما الكلمة التي تسمعها؟", audio: "Entschuldigung", options: ["Entschuldigung", "Einkaufung", "Endschulden", "Empfehlung"], answer: "Entschuldigung", explain: "Entschuldigung = Excusez-moi / Pardon.", explain_ar: "Entschuldigung = عفواً / المعذرة." },
];

export function loadBank(): ExamQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_QUESTIONS;
    const parsed = JSON.parse(raw) as ExamQuestion[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_QUESTIONS;
    return parsed;
  } catch {
    return DEFAULT_QUESTIONS;
  }
}

export function saveBank(qs: ExamQuestion[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(qs)); } catch { /* noop */ }
}

export function resetBank(): ExamQuestion[] {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  return DEFAULT_QUESTIONS;
}

export function newBlankQuestion(type: QType = "qcm"): ExamQuestion {
  return {
    id: uid(),
    type,
    module: "",
    module_ar: "",
    question: "",
    question_ar: "",
    audio: type === "audio" ? "" : undefined,
    options: type === "translate" ? undefined : ["", "", "", ""],
    options_ar: type === "translate" ? undefined : ["", "", "", ""],
    answer: "",
    explain: "",
    explain_ar: "",
  };
}

export const AUTOPLAY_KEY = "deutschmeister.finalExam.autoPlay.v1";
export function getAutoPlay(): boolean {
  try { return localStorage.getItem(AUTOPLAY_KEY) === "1"; } catch { return false; }
}
export function setAutoPlay(v: boolean) {
  try { localStorage.setItem(AUTOPLAY_KEY, v ? "1" : "0"); } catch { /* noop */ }
}
