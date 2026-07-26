export interface VocabItem {
  de: string;
  fr: string;
  ex: string;
  ar?: string;        // traduction arabe (optionnelle, sinon i18n auto)
  exAr?: string;      // exemple en arabe
}

export interface Exercise {
  type: "qcm" | "fill" | "translate" | "speak";
  q: string;
  opts?: string[];
  ans: any;
  tip: string;
  qAr?: string;
  tipAr?: string;
}

export interface Lesson {
  id: string;
  title: string;
  titleAr?: string;
  content: string;
  contentAr?: string;
  vocab: VocabItem[];
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  titleAr?: string;
  icon: string;
  desc: string;
  descAr?: string;
  color: string;
  level?: "A1" | "A2" | "B1" | "B2";
  lessons: Lesson[];
}

export interface Scenario {
  id: string;
  title: string;
  icon: string;
  desc: string;
  prompt: string;
}

// ====== NUMBERS HELPER ======
function generateNumbersContent(): string {
  const ones = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
  const teens = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  const tens = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
  const hundreds = ["", "hundert", "zweihundert", "dreihundert", "vierhundert", "fünfhundert", "sechshundert", "siebenhundert", "achthundert", "neunhundert"];

  function numberToGerman(n: number): string {
    if (n === 0) return "null";
    if (n === 1) return "eins";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return o === 0 ? tens[t] : `${ones[o]}und${tens[t]}`;
    }
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const rest = n % 100;
      return rest === 0 ? hundreds[h] : `${hundreds[h]}${numberToGerman(rest)}`;
    }
    if (n === 1000) return "tausend";
    return String(n);
  }

  return numberToGerman.toString(); // We use it in exercises
}

export function numberToGerman(n: number): string {
  const ones = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
  const teens = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  const tens = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
  const hundreds = ["", "hundert", "zweihundert", "dreihundert", "vierhundert", "fünfhundert", "sechshundert", "siebenhundert", "achthundert", "neunhundert"];

  if (n === 0) return "null";
  if (n === 1) return "eins";
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? tens[t] : `${ones[o]}und${tens[t]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return rest === 0 ? hundreds[h] : `${hundreds[h]}${numberToGerman(rest)}`;
  }
  if (n === 1000) return "tausend";
  return String(n);
}

// ====== ALPHABET DATA ======
export const ALPHABET_FULL = [
  { letter: "A", sound: "ah", example: "Apfel (pomme)" },
  { letter: "B", sound: "beh", example: "Buch (livre)" },
  { letter: "C", sound: "tseh", example: "Computer" },
  { letter: "D", sound: "deh", example: "Danke (merci)" },
  { letter: "E", sound: "eh", example: "Essen (manger)" },
  { letter: "F", sound: "eff", example: "Freund (ami)" },
  { letter: "G", sound: "geh", example: "Guten Tag" },
  { letter: "H", sound: "hah", example: "Haus (maison)" },
  { letter: "I", sound: "ih", example: "Ich (je)" },
  { letter: "J", sound: "yott", example: "Ja (oui)" },
  { letter: "K", sound: "kah", example: "Kind (enfant)" },
  { letter: "L", sound: "ell", example: "Liebe (amour)" },
  { letter: "M", sound: "emm", example: "Mutter (mère)" },
  { letter: "N", sound: "enn", example: "Nein (non)" },
  { letter: "O", sound: "oh", example: "Oder (ou)" },
  { letter: "P", sound: "peh", example: "Platz (place)" },
  { letter: "Q", sound: "kuh", example: "Quelle (source)" },
  { letter: "R", sound: "err", example: "Rot (rouge)" },
  { letter: "S", sound: "ess", example: "Schule (école)" },
  { letter: "T", sound: "teh", example: "Tag (jour)" },
  { letter: "U", sound: "uh", example: "Und (et)" },
  { letter: "V", sound: "fau", example: "Vater (père)" },
  { letter: "W", sound: "veh", example: "Wasser (eau)" },
  { letter: "X", sound: "iks", example: "Xylophon" },
  { letter: "Y", sound: "üpsilon", example: "Yoga" },
  { letter: "Z", sound: "tsett", example: "Zimmer (chambre)" },
  { letter: "Ä", sound: "è (comme 'air')", example: "Mädchen (fille)" },
  { letter: "Ö", sound: "eu (comme 'peu')", example: "Schön (beau)" },
  { letter: "Ü", sound: "u français", example: "Über (sur)" },
  { letter: "ß", sound: "ss (eszett)", example: "Straße (rue)" },
];

// ====== PRONOUNS REFERENCE ======
export const PRONOUNS_DATA = {
  personal: {
    title: "Pronoms personnels",
    rows: [
      { pronoun: "ich", meaning: "je", example: "Ich bin Student.", exFr: "Je suis étudiant." },
      { pronoun: "du", meaning: "tu", example: "Du bist nett.", exFr: "Tu es gentil." },
      { pronoun: "er", meaning: "il", example: "Er heißt Max.", exFr: "Il s'appelle Max." },
      { pronoun: "sie", meaning: "elle", example: "Sie ist Lehrerin.", exFr: "Elle est professeur." },
      { pronoun: "es", meaning: "il/ça (neutre)", example: "Es regnet.", exFr: "Il pleut." },
      { pronoun: "wir", meaning: "nous", example: "Wir lernen Deutsch.", exFr: "Nous apprenons l'allemand." },
      { pronoun: "ihr", meaning: "vous (informel pl.)", example: "Ihr seid Freunde.", exFr: "Vous êtes amis." },
      { pronoun: "sie", meaning: "ils/elles", example: "Sie kommen aus Frankreich.", exFr: "Ils/Elles viennent de France." },
      { pronoun: "Sie", meaning: "vous (formel)", example: "Woher kommen Sie?", exFr: "D'où venez-vous ?" },
    ],
  },
  cases: {
    title: "Pronoms dans les cas",
    table: [
      { cas: "Nominativ", ich: "ich", du: "du", er: "er", sie: "sie", es: "es", wir: "wir", ihr: "ihr", siePl: "sie", SieFormal: "Sie" },
      { cas: "Akkusativ", ich: "mich", du: "dich", er: "ihn", sie: "sie", es: "es", wir: "uns", ihr: "euch", siePl: "sie", SieFormal: "Sie" },
      { cas: "Dativ", ich: "mir", du: "dir", er: "ihm", sie: "ihr", es: "ihm", wir: "uns", ihr: "euch", siePl: "ihnen", SieFormal: "Ihnen" },
    ],
  },
  possessive: {
    title: "Pronoms possessifs",
    rows: [
      { pronoun: "ich", possessiv: "mein", example: "Das ist mein Buch.", exFr: "C'est mon livre." },
      { pronoun: "du", possessiv: "dein", example: "Wo ist dein Haus?", exFr: "Où est ta maison ?" },
      { pronoun: "er", possessiv: "sein", example: "Sein Name ist Paul.", exFr: "Son nom est Paul." },
      { pronoun: "sie", possessiv: "ihr", example: "Ihr Auto ist rot.", exFr: "Sa voiture est rouge." },
      { pronoun: "wir", possessiv: "unser", example: "Unser Lehrer ist gut.", exFr: "Notre professeur est bon." },
      { pronoun: "ihr", possessiv: "euer", example: "Euer Hund ist süß.", exFr: "Votre chien est mignon." },
      { pronoun: "sie (pl)", possessiv: "ihr", example: "Ihr Land ist schön.", exFr: "Leur pays est beau." },
      { pronoun: "Sie", possessiv: "Ihr", example: "Wie ist Ihr Name?", exFr: "Quel est votre nom ?" },
    ],
  },
};

// ====== SELF-INTRODUCTION DATA ======
export const SELF_INTRO = [
  {
    id: "name",
    icon: "👤",
    questionDe: "Wie heißen Sie? / Wie heißt du?",
    questionFr: "Comment vous appelez-vous ? / Comment tu t'appelles ?",
    answerDe: "Ich heiße [Name]. / Mein Name ist [Name].",
    answerFr: "Je m'appelle [Nom]. / Mon nom est [Nom].",
    examples: [
      { de: "Ich heiße Mohamed.", fr: "Je m'appelle Mohamed." },
      { de: "Mein Name ist Anna Schmidt.", fr: "Mon nom est Anna Schmidt." },
      { de: "Ich bin der Thomas.", fr: "Je suis Thomas. (familier)" },
    ],
  },
  {
    id: "age",
    icon: "🎂",
    questionDe: "Wie alt sind Sie? / Wie alt bist du?",
    questionFr: "Quel âge avez-vous ? / Quel âge as-tu ?",
    answerDe: "Ich bin [Zahl] Jahre alt.",
    answerFr: "J'ai [nombre] ans.",
    examples: [
      { de: "Ich bin fünfundzwanzig Jahre alt.", fr: "J'ai 25 ans." },
      { de: "Ich bin dreißig.", fr: "J'ai 30 ans. (court)" },
    ],
  },
  {
    id: "country",
    icon: "🌍",
    questionDe: "Woher kommen Sie? / Woher kommst du?",
    questionFr: "D'où venez-vous ? / D'où viens-tu ?",
    answerDe: "Ich komme aus [Land].",
    answerFr: "Je viens de [pays].",
    examples: [
      { de: "Ich komme aus Frankreich.", fr: "Je viens de France." },
      { de: "Ich komme aus Marokko.", fr: "Je viens du Maroc." },
      { de: "Ich komme aus Algerien.", fr: "Je viens d'Algérie." },
      { de: "Ich komme aus Deutschland.", fr: "Je viens d'Allemagne." },
      { de: "Ich komme aus der Türkei.", fr: "Je viens de Turquie." },
    ],
  },
  {
    id: "city",
    icon: "🏙️",
    questionDe: "Wo wohnen Sie? / Wo wohnst du?",
    questionFr: "Où habitez-vous ? / Où habites-tu ?",
    answerDe: "Ich wohne in [Stadt].",
    answerFr: "J'habite à [ville].",
    examples: [
      { de: "Ich wohne in Berlin.", fr: "J'habite à Berlin." },
      { de: "Ich wohne in Paris.", fr: "J'habite à Paris." },
      { de: "Ich lebe in München.", fr: "Je vis à Munich." },
    ],
  },
  {
    id: "job",
    icon: "💼",
    questionDe: "Was sind Sie von Beruf? / Was machst du beruflich?",
    questionFr: "Quelle est votre profession ? / Que fais-tu dans la vie ?",
    answerDe: "Ich bin [Beruf]. / Ich arbeite als [Beruf].",
    answerFr: "Je suis [profession]. / Je travaille comme [profession].",
    examples: [
      { de: "Ich bin Ingenieur.", fr: "Je suis ingénieur." },
      { de: "Ich bin Lehrerin.", fr: "Je suis professeure." },
      { de: "Ich arbeite als Arzt.", fr: "Je travaille comme médecin." },
      { de: "Ich bin Student.", fr: "Je suis étudiant." },
      { de: "Ich bin Informatiker.", fr: "Je suis informaticien." },
    ],
  },
  {
    id: "languages",
    icon: "🗣️",
    questionDe: "Welche Sprachen sprechen Sie? / Welche Sprachen sprichst du?",
    questionFr: "Quelles langues parlez-vous ? / Quelles langues parles-tu ?",
    answerDe: "Ich spreche [Sprache]. Meine Muttersprache ist [Sprache].",
    answerFr: "Je parle [langue]. Ma langue maternelle est [langue].",
    examples: [
      { de: "Meine Muttersprache ist Arabisch.", fr: "Ma langue maternelle est l'arabe." },
      { de: "Ich spreche Französisch und Englisch.", fr: "Je parle français et anglais." },
      { de: "Ich lerne Deutsch.", fr: "J'apprends l'allemand." },
      { de: "Ich spreche ein bisschen Spanisch.", fr: "Je parle un peu espagnol." },
    ],
  },
  {
    id: "hobbies",
    icon: "🎯",
    questionDe: "Was sind Ihre Hobbys? / Was machst du gern?",
    questionFr: "Quels sont vos loisirs ? / Qu'est-ce que tu aimes faire ?",
    answerDe: "Ich [Verb] gern. / Mein Hobby ist [Hobby].",
    answerFr: "J'aime [verbe]. / Mon hobby est [hobby].",
    examples: [
      { de: "Ich lese gern Bücher.", fr: "J'aime lire des livres." },
      { de: "Ich spiele gern Fußball.", fr: "J'aime jouer au football." },
      { de: "Mein Hobby ist Musik.", fr: "Mon hobby est la musique." },
      { de: "Ich koche gern.", fr: "J'aime cuisiner." },
    ],
  },
  {
    id: "family",
    icon: "👨‍👩‍👧‍👦",
    questionDe: "Haben Sie Familie? / Hast du Geschwister?",
    questionFr: "Avez-vous une famille ? / As-tu des frères et sœurs ?",
    answerDe: "Ich habe [Anzahl] [Familienmitglied].",
    answerFr: "J'ai [nombre] [membre de famille].",
    examples: [
      { de: "Ich bin verheiratet.", fr: "Je suis marié(e)." },
      { de: "Ich habe zwei Brüder und eine Schwester.", fr: "J'ai deux frères et une sœur." },
      { de: "Ich habe drei Kinder.", fr: "J'ai trois enfants." },
    ],
  },
];

// ====== VERB CONJUGATION TABLES ======
export const VERB_TABLES = {
  heißen: {
    meaning: "s'appeler",
    present: { ich: "heiße", du: "heißt", "er/sie/es": "heißt", wir: "heißen", ihr: "heißt", "sie/Sie": "heißen" },
    perfect: { ich: "habe geheißen", du: "hast geheißen", "er/sie/es": "hat geheißen", wir: "haben geheißen", ihr: "habt geheißen", "sie/Sie": "haben geheißen" },
  },
  wohnen: {
    meaning: "habiter",
    present: { ich: "wohne", du: "wohnst", "er/sie/es": "wohnt", wir: "wohnen", ihr: "wohnt", "sie/Sie": "wohnen" },
    perfect: { ich: "habe gewohnt", du: "hast gewohnt", "er/sie/es": "hat gewohnt", wir: "haben gewohnt", ihr: "habt gewohnt", "sie/Sie": "haben gewohnt" },
  },
  sein: {
    meaning: "être",
    present: { ich: "bin", du: "bist", "er/sie/es": "ist", wir: "sind", ihr: "seid", "sie/Sie": "sind" },
    perfect: { ich: "bin gewesen", du: "bist gewesen", "er/sie/es": "ist gewesen", wir: "sind gewesen", ihr: "seid gewesen", "sie/Sie": "sind gewesen" },
    preterite: { ich: "war", du: "warst", "er/sie/es": "war", wir: "waren", ihr: "wart", "sie/Sie": "waren" },
  },
  haben: {
    meaning: "avoir",
    present: { ich: "habe", du: "hast", "er/sie/es": "hat", wir: "haben", ihr: "habt", "sie/Sie": "haben" },
    perfect: { ich: "habe gehabt", du: "hast gehabt", "er/sie/es": "hat gehabt", wir: "haben gehabt", ihr: "habt gehabt", "sie/Sie": "haben gehabt" },
    preterite: { ich: "hatte", du: "hattest", "er/sie/es": "hatte", wir: "hatten", ihr: "hattet", "sie/Sie": "hatten" },
  },
  werden: {
    meaning: "devenir",
    present: { ich: "werde", du: "wirst", "er/sie/es": "wird", wir: "werden", ihr: "werdet", "sie/Sie": "werden" },
    perfect: { ich: "bin geworden", du: "bist geworden", "er/sie/es": "ist geworden", wir: "sind geworden", ihr: "seid geworden", "sie/Sie": "sind geworden" },
    preterite: { ich: "wurde", du: "wurdest", "er/sie/es": "wurde", wir: "wurden", ihr: "wurdet", "sie/Sie": "wurden" },
  },
  können: {
    meaning: "pouvoir",
    present: { ich: "kann", du: "kannst", "er/sie/es": "kann", wir: "können", ihr: "könnt", "sie/Sie": "können" },
    preterite: { ich: "konnte", du: "konntest", "er/sie/es": "konnte", wir: "konnten", ihr: "konntet", "sie/Sie": "konnten" },
  },
  müssen: {
    meaning: "devoir",
    present: { ich: "muss", du: "musst", "er/sie/es": "muss", wir: "müssen", ihr: "müsst", "sie/Sie": "müssen" },
    preterite: { ich: "musste", du: "musstest", "er/sie/es": "musste", wir: "mussten", ihr: "musstet", "sie/Sie": "mussten" },
  },
  wollen: {
    meaning: "vouloir",
    present: { ich: "will", du: "willst", "er/sie/es": "will", wir: "wollen", ihr: "wollt", "sie/Sie": "wollen" },
    preterite: { ich: "wollte", du: "wolltest", "er/sie/es": "wollte", wir: "wollten", ihr: "wolltet", "sie/Sie": "wollten" },
  },
  sollen: {
    meaning: "devoir (conseil)",
    present: { ich: "soll", du: "sollst", "er/sie/es": "soll", wir: "sollen", ihr: "sollt", "sie/Sie": "sollen" },
    preterite: { ich: "sollte", du: "solltest", "er/sie/es": "sollte", wir: "sollten", ihr: "solltet", "sie/Sie": "sollten" },
  },
  dürfen: {
    meaning: "avoir le droit",
    present: { ich: "darf", du: "darfst", "er/sie/es": "darf", wir: "dürfen", ihr: "dürft", "sie/Sie": "dürfen" },
    preterite: { ich: "durfte", du: "durftest", "er/sie/es": "durfte", wir: "durften", ihr: "durftet", "sie/Sie": "durften" },
  },
  mögen: {
    meaning: "aimer",
    present: { ich: "mag", du: "magst", "er/sie/es": "mag", wir: "mögen", ihr: "mögt", "sie/Sie": "mögen" },
    preterite: { ich: "mochte", du: "mochtest", "er/sie/es": "mochte", wir: "mochten", ihr: "mochtet", "sie/Sie": "mochten" },
  },
  machen: {
    meaning: "faire",
    present: { ich: "mache", du: "machst", "er/sie/es": "macht", wir: "machen", ihr: "macht", "sie/Sie": "machen" },
    perfect: { ich: "habe gemacht", du: "hast gemacht", "er/sie/es": "hat gemacht", wir: "haben gemacht", ihr: "habt gemacht", "sie/Sie": "haben gemacht" },
  },
  gehen: {
    meaning: "aller",
    present: { ich: "gehe", du: "gehst", "er/sie/es": "geht", wir: "gehen", ihr: "geht", "sie/Sie": "gehen" },
    perfect: { ich: "bin gegangen", du: "bist gegangen", "er/sie/es": "ist gegangen", wir: "sind gegangen", ihr: "seid gegangen", "sie/Sie": "sind gegangen" },
  },
  kommen: {
    meaning: "venir",
    present: { ich: "komme", du: "kommst", "er/sie/es": "kommt", wir: "kommen", ihr: "kommt", "sie/Sie": "kommen" },
    perfect: { ich: "bin gekommen", du: "bist gekommen", "er/sie/es": "ist gekommen", wir: "sind gekommen", ihr: "seid gekommen", "sie/Sie": "sind gekommen" },
  },
  sprechen: {
    meaning: "parler",
    present: { ich: "spreche", du: "sprichst", "er/sie/es": "spricht", wir: "sprechen", ihr: "sprecht", "sie/Sie": "sprechen" },
    perfect: { ich: "habe gesprochen", du: "hast gesprochen", "er/sie/es": "hat gesprochen", wir: "haben gesprochen", ihr: "habt gesprochen", "sie/Sie": "haben gesprochen" },
  },
  essen: {
    meaning: "manger",
    present: { ich: "esse", du: "isst", "er/sie/es": "isst", wir: "essen", ihr: "esst", "sie/Sie": "essen" },
    perfect: { ich: "habe gegessen", du: "hast gegessen", "er/sie/es": "hat gegessen", wir: "haben gegessen", ihr: "habt gegessen", "sie/Sie": "haben gegessen" },
  },
  lesen: {
    meaning: "lire",
    present: { ich: "lese", du: "liest", "er/sie/es": "liest", wir: "lesen", ihr: "lest", "sie/Sie": "lesen" },
    perfect: { ich: "habe gelesen", du: "hast gelesen", "er/sie/es": "hat gelesen", wir: "haben gelesen", ihr: "habt gelesen", "sie/Sie": "haben gelesen" },
  },
  schreiben: {
    meaning: "écrire",
    present: { ich: "schreibe", du: "schreibst", "er/sie/es": "schreibt", wir: "schreiben", ihr: "schreibt", "sie/Sie": "schreiben" },
    perfect: { ich: "habe geschrieben", du: "hast geschrieben", "er/sie/es": "hat geschrieben", wir: "haben geschrieben", ihr: "habt geschrieben", "sie/Sie": "haben geschrieben" },
  },
  fahren: {
    meaning: "conduire/aller (véhicule)",
    present: { ich: "fahre", du: "fährst", "er/sie/es": "fährt", wir: "fahren", ihr: "fahrt", "sie/Sie": "fahren" },
    perfect: { ich: "bin gefahren", du: "bist gefahren", "er/sie/es": "ist gefahren", wir: "sind gefahren", ihr: "seid gefahren", "sie/Sie": "sind gefahren" },
  },
  sehen: {
    meaning: "voir",
    present: { ich: "sehe", du: "siehst", "er/sie/es": "sieht", wir: "sehen", ihr: "seht", "sie/Sie": "sehen" },
    perfect: { ich: "habe gesehen", du: "hast gesehen", "er/sie/es": "hat gesehen", wir: "haben gesehen", ihr: "habt gesehen", "sie/Sie": "haben gesehen" },
  },
  nehmen: {
    meaning: "prendre",
    present: { ich: "nehme", du: "nimmst", "er/sie/es": "nimmt", wir: "nehmen", ihr: "nehmt", "sie/Sie": "nehmen" },
    perfect: { ich: "habe genommen", du: "hast genommen", "er/sie/es": "hat genommen", wir: "haben genommen", ihr: "habt genommen", "sie/Sie": "haben genommen" },
  },
  geben: {
    meaning: "donner",
    present: { ich: "gebe", du: "gibst", "er/sie/es": "gibt", wir: "geben", ihr: "gebt", "sie/Sie": "geben" },
    perfect: { ich: "habe gegeben", du: "hast gegeben", "er/sie/es": "hat gegeben", wir: "haben gegeben", ihr: "habt gegeben", "sie/Sie": "haben gegeben" },
  },
  wissen: {
    meaning: "savoir",
    present: { ich: "weiß", du: "weißt", "er/sie/es": "weiß", wir: "wissen", ihr: "wisst", "sie/Sie": "wissen" },
    preterite: { ich: "wusste", du: "wusstest", "er/sie/es": "wusste", wir: "wussten", ihr: "wusstet", "sie/Sie": "wussten" },
  },
  denken: {
    meaning: "penser",
    present: { ich: "denke", du: "denkst", "er/sie/es": "denkt", wir: "denken", ihr: "denkt", "sie/Sie": "denken" },
    perfect: { ich: "habe gedacht", du: "hast gedacht", "er/sie/es": "hat gedacht", wir: "haben gedacht", ihr: "habt gedacht", "sie/Sie": "haben gedacht" },
  },
  finden: {
    meaning: "trouver",
    present: { ich: "finde", du: "findest", "er/sie/es": "findet", wir: "finden", ihr: "findet", "sie/Sie": "finden" },
    perfect: { ich: "habe gefunden", du: "hast gefunden", "er/sie/es": "hat gefunden", wir: "haben gefunden", ihr: "habt gefunden", "sie/Sie": "haben gefunden" },
  },
  arbeiten: {
    meaning: "travailler",
    present: { ich: "arbeite", du: "arbeitest", "er/sie/es": "arbeitet", wir: "arbeiten", ihr: "arbeitet", "sie/Sie": "arbeiten" },
    perfect: { ich: "habe gearbeitet", du: "hast gearbeitet", "er/sie/es": "hat gearbeitet", wir: "haben gearbeitet", ihr: "habt gearbeitet", "sie/Sie": "haben gearbeitet" },
  },
  spielen: {
    meaning: "jouer",
    present: { ich: "spiele", du: "spielst", "er/sie/es": "spielt", wir: "spielen", ihr: "spielt", "sie/Sie": "spielen" },
    perfect: { ich: "habe gespielt", du: "hast gespielt", "er/sie/es": "hat gespielt", wir: "haben gespielt", ihr: "habt gespielt", "sie/Sie": "haben gespielt" },
  },
  kaufen: {
    meaning: "acheter",
    present: { ich: "kaufe", du: "kaufst", "er/sie/es": "kauft", wir: "kaufen", ihr: "kauft", "sie/Sie": "kaufen" },
    perfect: { ich: "habe gekauft", du: "hast gekauft", "er/sie/es": "hat gekauft", wir: "haben gekauft", ihr: "habt gekauft", "sie/Sie": "haben gekauft" },
  },
  helfen: {
    meaning: "aider",
    present: { ich: "helfe", du: "hilfst", "er/sie/es": "hilft", wir: "helfen", ihr: "helft", "sie/Sie": "helfen" },
    perfect: { ich: "habe geholfen", du: "hast geholfen", "er/sie/es": "hat geholfen", wir: "haben geholfen", ihr: "habt geholfen", "sie/Sie": "haben geholfen" },
  },
  schlafen: {
    meaning: "dormir",
    present: { ich: "schlafe", du: "schläfst", "er/sie/es": "schläft", wir: "schlafen", ihr: "schlaft", "sie/Sie": "schlafen" },
    perfect: { ich: "habe geschlafen", du: "hast geschlafen", "er/sie/es": "hat geschlafen", wir: "haben geschlafen", ihr: "habt geschlafen", "sie/Sie": "haben geschlafen" },
  },
  trinken: {
    meaning: "boire",
    present: { ich: "trinke", du: "trinkst", "er/sie/es": "trinkt", wir: "trinken", ihr: "trinkt", "sie/Sie": "trinken" },
    perfect: { ich: "habe getrunken", du: "hast getrunken", "er/sie/es": "hat getrunken", wir: "haben getrunken", ihr: "habt getrunken", "sie/Sie": "haben getrunken" },
  },
  lernen: {
    meaning: "apprendre",
    present: { ich: "lerne", du: "lernst", "er/sie/es": "lernt", wir: "lernen", ihr: "lernt", "sie/Sie": "lernen" },
    perfect: { ich: "habe gelernt", du: "hast gelernt", "er/sie/es": "hat gelernt", wir: "haben gelernt", ihr: "habt gelernt", "sie/Sie": "haben gelernt" },
  },
  verstehen: {
    meaning: "comprendre",
    present: { ich: "verstehe", du: "verstehst", "er/sie/es": "versteht", wir: "verstehen", ihr: "versteht", "sie/Sie": "verstehen" },
    perfect: { ich: "habe verstanden", du: "hast verstanden", "er/sie/es": "hat verstanden", wir: "haben verstanden", ihr: "habt verstanden", "sie/Sie": "haben verstanden" },
  },
  brauchen: {
    meaning: "avoir besoin",
    present: { ich: "brauche", du: "brauchst", "er/sie/es": "braucht", wir: "brauchen", ihr: "braucht", "sie/Sie": "brauchen" },
    perfect: { ich: "habe gebraucht", du: "hast gebraucht", "er/sie/es": "hat gebraucht", wir: "haben gebraucht", ihr: "habt gebraucht", "sie/Sie": "haben gebraucht" },
  },
  leben: {
    meaning: "vivre",
    present: { ich: "lebe", du: "lebst", "er/sie/es": "lebt", wir: "leben", ihr: "lebt", "sie/Sie": "leben" },
    perfect: { ich: "habe gelebt", du: "hast gelebt", "er/sie/es": "hat gelebt", wir: "haben gelebt", ihr: "habt gelebt", "sie/Sie": "haben gelebt" },
  },
};

// ====== GRAMMAR RULES ======
export const GRAMMAR_RULES = {
  cases: {
    title: "Les 4 cas allemands",
    content: `**Nominativ** (sujet) : Wer? Was? → Der Mann liest.
**Akkusativ** (COD) : Wen? Was? → Ich sehe den Mann.
**Dativ** (COI) : Wem? → Ich gebe dem Mann ein Buch.
**Genitiv** (possession) : Wessen? → Das Buch des Mannes.

| Cas | der → | die → | das → | die (pl) → |
|-----|-------|-------|-------|------------|
| Nom | der   | die   | das   | die        |
| Akk | den   | die   | das   | die        |
| Dat | dem   | der   | dem   | den (+n)   |
| Gen | des (+s/es) | der | des (+s/es) | der |`,
  },
  articles: {
    title: "Articles définis et indéfinis",
    content: `**Définis :** der (masc), die (fém), das (neutre), die (pluriel)
**Indéfinis :** ein (masc/neutre), eine (fém), — (pas de pl)
**Négatifs :** kein, keine, kein, keine

| Cas | ein(m) | eine(f) | ein(n) | kein(pl) |
|-----|--------|---------|--------|----------|
| Nom | ein    | eine    | ein    | keine    |
| Akk | einen  | eine    | ein    | keine    |
| Dat | einem  | einer   | einem  | keinen   |
| Gen | eines  | einer   | eines  | keiner   |`,
  },
  wordOrder: {
    title: "Ordre des mots",
    content: `**Phrase simple :** Sujet + Verbe + Complément
→ Ich lerne Deutsch.

**Inversion (après adverbe/complément) :** Complément + Verbe + Sujet
→ Heute lerne ich Deutsch.

**Subordonnée (dass, weil, wenn, ob) :** Verbe conjugué à la FIN
→ Ich weiß, dass du Deutsch lernst.

**Question W- :** W-Wort + Verbe + Sujet
→ Was lernst du?

**Question oui/non :** Verbe + Sujet
→ Lernst du Deutsch?`,
  },
  prepositions: {
    title: "Prépositions",
    content: `**Akkusativ :** durch, für, gegen, ohne, um, bis, entlang
→ Ich gehe durch den Park.

**Dativ :** aus, bei, mit, nach, seit, von, zu, gegenüber
→ Ich komme aus der Schule.

**Wechselpräpositionen (Akk=mouvement, Dat=position) :**
an, auf, hinter, in, neben, über, unter, vor, zwischen
→ Ich gehe in die Schule. (Akk - mouvement)
→ Ich bin in der Schule. (Dat - position)`,
  },
  adjectives: {
    title: "Déclinaison des adjectifs",
    content: `**Après article défini :**
| Cas | Masc | Fém | Neutre | Pluriel |
|-----|------|-----|--------|---------|
| Nom | -e   | -e  | -e     | -en     |
| Akk | -en  | -e  | -e     | -en     |
| Dat | -en  | -en | -en    | -en     |
| Gen | -en  | -en | -en    | -en     |

→ der große Mann, die schöne Frau, das kleine Kind

**Après article indéfini :**
| Cas | Masc | Fém | Neutre |
|-----|------|-----|--------|
| Nom | -er  | -e  | -es    |
| Akk | -en  | -e  | -es    |
| Dat | -en  | -en | -en    |
| Gen | -en  | -en | -en    |

→ ein großer Mann, eine schöne Frau, ein kleines Kind`,
  },
  negation: {
    title: "La négation",
    content: `**nicht** (ne...pas) → place avant l'adjectif/adverbe, après le verbe conjugué
→ Ich spreche nicht Deutsch.
→ Das ist nicht gut.

**kein/keine** (pas de) → remplace ein/eine
→ Ich habe ein Buch. → Ich habe kein Buch.
→ Ich habe eine Katze. → Ich habe keine Katze.

**Position de nicht :**
- Fin de phrase : Ich verstehe nicht.
- Avant prédicat : Das ist nicht schön.
- Avant préposition : Ich gehe nicht in die Schule.`,
  },
  tenses: {
    title: "Les temps",
    content: `**Präsens (présent) :**
ich mache, du machst, er macht...

**Perfekt (passé composé) :** haben/sein + Partizip II
→ Ich habe gemacht. Ich bin gegangen.

**Partizip II :**
- Régulier : ge- + radical + -t → gemacht, gelernt
- Irrégulier : ge- + radical modifié + -en → gegangen, gesprochen
- Préfixe inséparable : sans ge- → verstanden, bekommen
- Terminaison -ieren : sans ge- → studiert, telefoniert

**Präteritum (prétérit) :** surtout pour sein, haben, modaux
→ Ich war, ich hatte, ich konnte

**Futur I :** werden + infinitif
→ Ich werde Deutsch lernen.`,
  },
  pronouns: {
    title: "Les pronoms",
    content: `**Pronoms personnels :**
| Cas | ich | du | er | sie | es | wir | ihr | sie | Sie |
|-----|-----|----|----|-----|----|-----|-----|-----|-----|
| Nom | ich | du | er | sie | es | wir | ihr | sie | Sie |
| Akk | mich| dich| ihn| sie | es | uns | euch| sie | Sie |
| Dat | mir | dir | ihm| ihr | ihm| uns | euch| ihnen| Ihnen |

**Pronoms possessifs :**
ich → mein, du → dein, er → sein, sie → ihr, wir → unser, ihr → euer, sie → ihr, Sie → Ihr`,
  },
};

// ====== UNITS ======
export const UNITS: Unit[] = [
  // UNIT 1: ALPHABET COMPLET
  { id:"u1", title:"Das Alphabet", icon:"🔤", desc:"Alphabet complet, sons, prononciation", color:"#0ea5e9",
    lessons:[
      { id:"u1l1", title:"A-M : Première moitié",
        content:`**L'alphabet allemand** : 26 lettres + Ä, Ö, Ü, ß

**A** [ah] → Apfel (pomme) | **B** [beh] → Buch (livre)
**C** [tseh] → Computer | **D** [deh] → Danke (merci)
**E** [eh] → Essen (manger) | **F** [eff] → Freund (ami)
**G** [geh] → Guten Tag | **H** [hah] → Haus (maison)
**I** [ih] → Ich (je) | **J** [yott] → Ja (oui) ⚠️ J=Y!
**K** [kah] → Kind (enfant) | **L** [ell] → Liebe (amour)
**M** [emm] → Mutter (mère)

**⚠️ Pièges :**
• J se prononce Y (Ja = Ya)
• H est aspiré (Haus = Haous)`,
        vocab:[
          {de:"der Apfel",fr:"la pomme",ex:"Ich esse einen Apfel."},
          {de:"das Buch",fr:"le livre",ex:"Ich lese ein Buch."},
          {de:"der Freund",fr:"l'ami",ex:"Mein Freund heißt Thomas."},
          {de:"das Haus",fr:"la maison",ex:"Das Haus ist groß."},
          {de:"die Liebe",fr:"l'amour",ex:"Liebe ist schön."},
          {de:"die Mutter",fr:"la mère",ex:"Meine Mutter kocht gut."},
        ],
        exercises:[
          {type:"qcm",q:"Comment se prononce J en allemand ?",opts:["Comme J français","Comme Y","Comme CH","Comme G"],ans:1,tip:"J=Y. Ja se dit 'Ya'."},
          {type:"qcm",q:"Quel mot commence par F ?",opts:["Vater","Freund","Haus","Buch"],ans:1,tip:"Freund = ami. Vater commence par V mais se prononce F!"},
          {type:"fill",q:"H se prononce comme un ___ aspiré",ans:"h",tip:"H est toujours aspiré en allemand."},
          {type:"speak",q:"Prononcez l'alphabet : A, B, C, D, E, F",ans:"A B C D E F",tip:"A=ah, B=beh, C=tseh, D=deh, E=eh, F=eff"},
        ]},
      { id:"u1l2", title:"N-Z : Deuxième moitié",
        content:`**N** [enn] → Nein (non) | **O** [oh] → Oder (ou)
**P** [peh] → Platz (place) | **Q** [kuh] → Quelle (source)
**R** [err] → Rot (rouge) ⚠️ R guttural!
**S** [ess] → Schule (école) | **T** [teh] → Tag (jour)
**U** [uh] → Und (et) | **V** [fau] → Vater (père) ⚠️ V=F!
**W** [veh] → Wasser (eau) ⚠️ W=V!
**X** [iks] → Xylophon | **Y** [üpsilon] → Yoga
**Z** [tsett] → Zimmer (chambre) ⚠️ Z=TS!

**Combinaisons :**
• SCH → "ch" français (Schule)
• CH → guttural (ich) ou dur (Buch)
• ST/SP au début → "cht/chp" (Straße, Sprache)`,
        vocab:[
          {de:"das Wasser",fr:"l'eau",ex:"Ich trinke Wasser."},
          {de:"der Vater",fr:"le père",ex:"Mein Vater arbeitet."},
          {de:"das Zimmer",fr:"la chambre",ex:"Das Zimmer ist klein."},
          {de:"die Straße",fr:"la rue",ex:"Die Straße ist lang."},
          {de:"die Schule",fr:"l'école",ex:"Ich gehe in die Schule."},
          {de:"die Sprache",fr:"la langue",ex:"Deutsch ist eine schöne Sprache."},
        ],
        exercises:[
          {type:"qcm",q:"Comment se prononce W ?",opts:["Comme W anglais","Comme V","Comme F","Comme OU"],ans:1,tip:"W=V. Wasser='Vasser'."},
          {type:"qcm",q:"Comment se prononce V ?",opts:["Comme V","Comme F","Comme W","Comme B"],ans:1,tip:"V=F. Vater='Fater'."},
          {type:"qcm",q:"Comment se prononce Z ?",opts:["Comme Z français","Comme TS","Comme S","Comme CH"],ans:1,tip:"Z=TS. Zimmer='Tsimmer'."},
          {type:"fill",q:"SCH se prononce comme ___ en français",ans:"ch",tip:"SCH = ch. Schule = 'Choule'."},
          {type:"speak",q:"Prononcez : 'Wasser, Vater, Zimmer'",ans:"Wasser Vater Zimmer",tip:"W=V, V=F, Z=TS"},
        ]},
      { id:"u1l3", title:"Ä, Ö, Ü, ß : Lettres spéciales",
        content:`**Les Umlauts (trémas) :**

**Ä** [è] → comme "air" sans le R
• Mädchen (fille), Käse (fromage), Bär (ours)
• Prononciation : ouvrir la bouche comme pour "a", dire "è"

**Ö** [eu] → comme "peu" en français  
• schön (beau), Löwe (lion), böse (méchant)
• Prononciation : bouche en O, dire "eu"

**Ü** [u français] → comme "tu" en français
• über (sur), Tür (porte), Frühstück (petit-déjeuner)
• Prononciation : bouche en O, dire "u"

**ß** [ss] → Eszett, double S
• Straße (rue), groß (grand), heißen (s'appeler)
• Utilisé après voyelle longue ou diphtongue

**Voyelles combinées :**
• EI → "aï" (mein = maïn, Stein = Chtaïn)
• IE → "i" long (Liebe = Libeu, Spiel = Chpil)
• EU/ÄU → "oï" (neu = noï, Häuser = Hoïzer)
• AU → "aou" (Haus = Haous, Frau = Fraou)`,
        vocab:[
          {de:"das Mädchen",fr:"la fille",ex:"Das Mädchen ist klein."},
          {de:"schön",fr:"beau/belle",ex:"Das ist schön!"},
          {de:"die Tür",fr:"la porte",ex:"Bitte, schließen Sie die Tür."},
          {de:"die Straße",fr:"la rue",ex:"Die Straße ist lang."},
          {de:"groß",fr:"grand",ex:"Das Haus ist groß."},
          {de:"das Frühstück",fr:"le petit-déjeuner",ex:"Das Frühstück ist lecker."},
          {de:"der Käse",fr:"le fromage",ex:"Ich esse Käse."},
          {de:"die Übung",fr:"l'exercice",ex:"Die Übung ist wichtig."},
        ],
        exercises:[
          {type:"qcm",q:"Quel son fait Ä ?",opts:["'a'","'è' comme air","'o'","'i'"],ans:1,tip:"Ä = è. Mädchen = 'Mèdçen'."},
          {type:"qcm",q:"Quel son fait Ö ?",opts:["'o'","'ou'","'eu' comme peu","'i'"],ans:2,tip:"Ö = eu. Schön = 'Cheun'."},
          {type:"qcm",q:"EI se prononce comment ?",opts:["'é'","'i' long","'aï'","'oï'"],ans:2,tip:"EI = aï. Mein = 'Maïn'."},
          {type:"fill",q:"ß se prononce comme un double ___",ans:"s",tip:"ß = ss. Straße = 'Chtrasseu'."},
          {type:"speak",q:"Prononcez : 'Schön, Mädchen, Straße'",ans:"Schön Mädchen Straße",tip:"Ö=eu, Ä=è, ß=ss"},
        ]},
    ]},

  // UNIT 2: SALUTATIONS ET PRÉSENTATION
  { id:"u2", title:"Begrüßung", icon:"👋", desc:"Salutations, se présenter, politesse", color:"#10b981",
    lessons:[
      { id:"u2l1", title:"Saluer et dire au revoir",
        content:`**Salutations formelles :**
• Guten Morgen! → Bonjour (matin, avant midi)
• Guten Tag! → Bonjour (journée)
• Guten Abend! → Bonsoir
• Gute Nacht! → Bonne nuit

**Salutations informelles :**
• Hallo! → Salut !
• Hi! → Salut ! (très informel)
• Grüß Gott! → Bonjour (Bavière/Autriche)
• Moin! → Salut (Nord de l'Allemagne)

**Au revoir :**
• Auf Wiedersehen! → Au revoir (formel)
• Tschüss! → Au revoir (informel)
• Bis morgen! → À demain !
• Bis später! → À plus tard !
• Bis bald! → À bientôt !
• Mach's gut! → Porte-toi bien !`,
        vocab:[
          {de:"Guten Morgen",fr:"Bonjour (matin)",ex:"Guten Morgen, Herr Schmidt!"},
          {de:"Guten Tag",fr:"Bonjour",ex:"Guten Tag, wie geht es Ihnen?"},
          {de:"Guten Abend",fr:"Bonsoir",ex:"Guten Abend!"},
          {de:"Auf Wiedersehen",fr:"Au revoir",ex:"Auf Wiedersehen!"},
          {de:"Tschüss",fr:"Au revoir (informel)",ex:"Tschüss, bis morgen!"},
          {de:"Bis bald",fr:"À bientôt",ex:"Bis bald!"},
          {de:"Gute Nacht",fr:"Bonne nuit",ex:"Gute Nacht, schlaf gut!"},
        ],
        exercises:[
          {type:"qcm",q:"'Bonjour' le matin ?",opts:["Guten Tag","Guten Morgen","Guten Abend","Gute Nacht"],ans:1,tip:"Morgen = matin."},
          {type:"qcm",q:"Au revoir formel ?",opts:["Tschüss","Bis bald","Auf Wiedersehen","Mach's gut"],ans:2,tip:"Auf Wiedersehen = formel."},
          {type:"fill",q:"Gute ___! (bonne nuit)",ans:"Nacht",tip:"Nacht = nuit."},
          {type:"speak",q:"Dites : 'Guten Tag, auf Wiedersehen!'",ans:"Guten Tag auf Wiedersehen",tip:"Tag='Tak'."},
        ]},
      { id:"u2l2", title:"Se présenter",
        content:`**Identité :**
• Ich heiße... → Je m'appelle...
• Mein Name ist... → Mon nom est...
• Wie heißen Sie? → Comment vous appelez-vous ? (formel)
• Wie heißt du? → Comment t'appelles-tu ? (informel)

**Âge :**
• Ich bin 25 Jahre alt. → J'ai 25 ans.
• Wie alt bist du? → Quel âge as-tu ?

**Origine :**
• Woher kommen Sie? → D'où venez-vous ?
• Ich komme aus Frankreich. → Je viens de France.
• Ich wohne in Berlin. → J'habite à Berlin.

**Profession :**
• Was machen Sie beruflich? → Que faites-vous ?
• Ich bin Student/Studentin. → Je suis étudiant(e).
• Ich arbeite als Ingenieur. → Je travaille comme ingénieur.

**Langues :**
• Ich spreche Deutsch und Französisch.
• Ich lerne Deutsch seit drei Monaten.`,
        vocab:[
          {de:"Ich heiße...",fr:"Je m'appelle...",ex:"Ich heiße Anna."},
          {de:"Woher kommen Sie?",fr:"D'où venez-vous ?",ex:"Woher kommen Sie?"},
          {de:"Ich komme aus...",fr:"Je viens de...",ex:"Ich komme aus Frankreich."},
          {de:"Ich wohne in...",fr:"J'habite à...",ex:"Ich wohne in Paris."},
          {de:"der Beruf",fr:"la profession",ex:"Was ist Ihr Beruf?"},
          {de:"der Student",fr:"l'étudiant",ex:"Ich bin Student."},
          {de:"Freut mich!",fr:"Enchanté !",ex:"Freut mich, Sie kennenzulernen!"},
        ],
        exercises:[
          {type:"fill",q:"Ich ___ Anna. (s'appeler)",ans:"heiße",tip:"heißen → ich heiße."},
          {type:"translate",q:"'Je viens de Tunisie'",ans:"Ich komme aus Tunesien",tip:"kommen aus + pays."},
          {type:"fill",q:"Ich bin 20 Jahre ___.",ans:"alt",tip:"alt = vieux/âgé. Structure : Ich bin X Jahre alt."},
          {type:"speak",q:"Présentez-vous : nom, âge, origine",ans:"Ich heiße Thomas ich bin zwanzig Jahre alt ich komme aus Frankreich",tip:"heiße, bin...alt, komme aus"},
        ]},
      { id:"u2l3", title:"Comment ça va ? Politesse",
        content:`**Demander comment ça va :**
• Wie geht es Ihnen? → Comment allez-vous ? (formel)
• Wie geht's? / Wie geht es dir? → Comment ça va ? (informel)

**Répondre :**
• Mir geht es sehr gut! → Je vais très bien !
• Mir geht es gut. → Je vais bien.
• Es geht. / So lala. → Ça va.
• Nicht so gut. → Pas très bien.
• Mir geht es schlecht. → Je vais mal.

**Politesse essentielle :**
• Danke / Danke schön / Vielen Dank → Merci
• Bitte / Bitte schön → S'il vous plaît / De rien
• Entschuldigung → Excusez-moi
• Es tut mir leid. → Je suis désolé.
• Kein Problem. → Pas de problème.
• Gern geschehen. → Avec plaisir.`,
        vocab:[
          {de:"Wie geht es Ihnen?",fr:"Comment allez-vous ?",ex:"Wie geht es Ihnen?"},
          {de:"Mir geht es gut",fr:"Je vais bien",ex:"Danke, mir geht es gut!"},
          {de:"Danke schön",fr:"Merci beaucoup",ex:"Danke schön!"},
          {de:"Bitte schön",fr:"De rien / Voilà",ex:"Bitte schön!"},
          {de:"Entschuldigung",fr:"Excusez-moi",ex:"Entschuldigung, wo ist...?"},
          {de:"Es tut mir leid",fr:"Je suis désolé",ex:"Es tut mir leid!"},
          {de:"Kein Problem",fr:"Pas de problème",ex:"Kein Problem!"},
        ],
        exercises:[
          {type:"qcm",q:"'Comment allez-vous ?' formel ?",opts:["Wie geht's?","Wie geht es dir?","Wie geht es Ihnen?","Was geht?"],ans:2,tip:"Ihnen = vous (formel)."},
          {type:"fill",q:"___ geht es gut. (à moi)",ans:"Mir",tip:"Mir = à moi. Dativ."},
          {type:"translate",q:"'Excusez-moi, je suis désolé'",ans:"Entschuldigung es tut mir leid",tip:"Entschuldigung + Es tut mir leid."},
          {type:"speak",q:"Dites : 'Danke schön! Mir geht es gut!'",ans:"Danke schön mir geht es gut",tip:"Danke='Danké', gut='gout'"},
        ]},
    ]},

  // UNIT 3: NOMBRES 0-1000
  { id:"u3", title:"Zahlen", icon:"🔢", desc:"Nombres 0-1000, âge, prix, téléphone", color:"#f59e0b",
    lessons:[
      { id:"u3l1", title:"0-20 : Les bases",
        content:`**0-12 (à mémoriser) :**
0=null, 1=eins, 2=zwei, 3=drei, 4=vier, 5=fünf,
6=sechs, 7=sieben, 8=acht, 9=neun, 10=zehn,
11=elf, 12=zwölf

**13-19 (unité + zehn) :**
13=dreizehn, 14=vierzehn, 15=fünfzehn,
16=sechzehn ⚠️(pas sechszehn!),
17=siebzehn ⚠️(pas siebenzehn!),
18=achtzehn, 19=neunzehn, 20=zwanzig

💡 **Astuce :** 16 et 17 perdent des lettres !
sech**s** → sech**z**ehn | sieb**en** → sieb**z**ehn`,
        vocab:[
          {de:"null",fr:"zéro",ex:"Die Nummer ist null."},
          {de:"eins",fr:"un",ex:"Ich habe eins."},
          {de:"fünf",fr:"cinq",ex:"Fünf Euro, bitte."},
          {de:"zehn",fr:"dix",ex:"Zehn Minuten."},
          {de:"zwölf",fr:"douze",ex:"Es ist zwölf Uhr."},
          {de:"zwanzig",fr:"vingt",ex:"Ich bin zwanzig Jahre alt."},
        ],
        exercises:[
          {type:"qcm",q:"Comment dit-on 16 ?",opts:["sechszehn","sechzehn","sechzehn","sechenzehn"],ans:1,tip:"sechs perd le s → sechzehn."},
          {type:"fill",q:"11 en allemand : ___",ans:"elf",tip:"elf = 11 (irrégulier)."},
          {type:"qcm",q:"17 en allemand ?",opts:["siebenzehn","siebzehn","siebzehn","siebezehn"],ans:1,tip:"sieben perd -en → siebzehn."},
          {type:"speak",q:"Comptez de 1 à 5",ans:"eins zwei drei vier fünf",tip:"eins, zwei, drei, vier, fünf"},
        ]},
      { id:"u3l2", title:"21-100 : Dizaines",
        content:`**Dizaines :**
20=zwanzig, 30=dreißig ⚠️(pas dreizig!),
40=vierzig, 50=fünfzig, 60=sechzig ⚠️(pas sechszig!),
70=siebzig ⚠️(pas siebenzig!), 80=achtzig, 90=neunzig, 100=hundert

**21-99 : INVERSÉ ! Unité + und + dizaine**
21 = ein**und**zwanzig (1 et 20)
35 = fünf**und**dreißig (5 et 30)
47 = sieben**und**vierzig (7 et 40)
68 = acht**und**sechzig (8 et 60)
99 = neun**und**neunzig (9 et 90)

💡 **Astuce mnémonique :** Pensez à l'anglais ancien "four and twenty" !
C'est pareil : unité D'ABORD, puis la dizaine.`,
        vocab:[
          {de:"dreißig",fr:"trente",ex:"Ich bin dreißig Jahre alt."},
          {de:"fünfzig",fr:"cinquante",ex:"Das kostet fünfzig Euro."},
          {de:"hundert",fr:"cent",ex:"Hundert Prozent!"},
          {de:"Wie alt bist du?",fr:"Quel âge as-tu ?",ex:"Wie alt bist du?"},
          {de:"Wie viel kostet das?",fr:"Combien ça coûte ?",ex:"Wie viel kostet das?"},
        ],
        exercises:[
          {type:"qcm",q:"Comment dit-on 25 ?",opts:["zwanzigfünf","fünfundzwanzig","fünfzwanzig","zweicinq"],ans:1,tip:"Unité + und + dizaine = fünfundzwanzig."},
          {type:"qcm",q:"Comment dit-on 43 ?",opts:["vierdreißig","dreiundvierzig","vierunddreizig","dreivierzig"],ans:1,tip:"3 + und + 40 = dreiundvierzig."},
          {type:"fill",q:"30 en allemand : ___",ans:"dreißig",tip:"dreißig (avec ß, pas z!)."},
          {type:"translate",q:"'J'ai 25 ans'",ans:"Ich bin fünfundzwanzig Jahre alt",tip:"Ich bin + nombre + Jahre alt."},
          {type:"speak",q:"Dites : 'siebenundsiebzig' (77)",ans:"siebenundsiebzig",tip:"7 + und + 70"},
        ]},
      { id:"u3l3", title:"100-1000 : Grands nombres",
        content:`**Centaines :**
100=hundert, 200=zweihundert, 300=dreihundert,
400=vierhundert, 500=fünfhundert, 600=sechshundert,
700=siebenhundert, 800=achthundert, 900=neunhundert,
1000=tausend

**Composition :**
123 = hundert**drei**und**zwanzig** (100+23)
456 = vierhundert**sechs**und**fünfzig** (400+56)
789 = siebenhundert**neun**und**achtzig** (700+89)
999 = neunhundert**neun**und**neunzig** (900+99)

**Exemples pratiques :**
• Meine Telefonnummer ist... (Mon numéro est...)
• Die Postleitzahl ist 10115. (Le code postal est...)
• Das kostet 350 Euro. (Ça coûte 350€)`,
        vocab:[
          {de:"zweihundert",fr:"deux cents",ex:"Das kostet zweihundert Euro."},
          {de:"fünfhundert",fr:"cinq cents",ex:"Fünfhundert Kilometer."},
          {de:"tausend",fr:"mille",ex:"Tausend Dank!"},
          {de:"die Telefonnummer",fr:"le numéro de téléphone",ex:"Was ist Ihre Telefonnummer?"},
          {de:"die Postleitzahl",fr:"le code postal",ex:"Die Postleitzahl ist 75001."},
        ],
        exercises:[
          {type:"qcm",q:"Comment dit-on 350 ?",opts:["dreihundertfünfzig","dreifünfzighundert","fünfzigdreihundert","dreihundertfünfundzwanzig"],ans:0,tip:"300+50 = dreihundertfünfzig."},
          {type:"fill",q:"1000 en allemand : ___",ans:"tausend",tip:"tausend = 1000."},
          {type:"qcm",q:"Comment dit-on 275 ?",opts:["zweihundertfünfundsiebzig","siebzigfünfzweihundert","zweihundertsiebzigfünf"],ans:0,tip:"200+75 = zweihundertfünfundsiebzig."},
          {type:"speak",q:"Dites votre numéro : 0-6-1-2-3-4-5-6-7-8",ans:"null sechs eins zwei drei vier fünf sechs sieben acht",tip:"Dictez chiffre par chiffre."},
        ]},
    ]},

  // UNIT 4: ARTICLES ET CAS
  { id:"u4", title:"Artikel & Fälle", icon:"📝", desc:"der/die/das, Nominativ, Akkusativ, Dativ", color:"#ef4444",
    lessons:[
      { id:"u4l1", title:"der, die, das : Les genres",
        content:`**3 genres + pluriel :**
• Masculin : **der** Mann, der Tisch, der Stuhl
• Féminin : **die** Frau, die Lampe, die Tür
• Neutre : **das** Kind, das Buch, das Haus
• Pluriel : toujours **die** (die Kinder, die Bücher)

**Astuces pour deviner le genre :**

🔵 **Masculin (der) :**
- Jours/mois/saisons : der Montag, der Januar, der Sommer
- Terminaisons : -er, -ling, -ismus, -ant, -eur
- Métiers masculins : der Lehrer, der Arzt

🔴 **Féminin (die) :**
- Terminaisons : -e, -ung, -heit, -keit, -tion, -ie, -ik, -tät, -schaft
- die Zeitung, die Freiheit, die Möglichkeit

🟡 **Neutre (das) :**
- Terminaisons : -chen, -lein, -ment, -um, -nis
- das Mädchen ⚠️ (même si c'est une fille!)
- Infinitifs nominalisés : das Essen, das Lernen`,
        vocab:[
          {de:"der Mann",fr:"l'homme",ex:"Der Mann ist groß."},
          {de:"die Frau",fr:"la femme",ex:"Die Frau ist nett."},
          {de:"das Kind",fr:"l'enfant",ex:"Das Kind spielt."},
          {de:"die Zeitung",fr:"le journal",ex:"Ich lese die Zeitung."},
          {de:"die Freiheit",fr:"la liberté",ex:"Freiheit ist wichtig."},
          {de:"das Mädchen",fr:"la fille",ex:"Das Mädchen lacht."},
          {de:"der Lehrer",fr:"le professeur",ex:"Der Lehrer ist streng."},
        ],
        exercises:[
          {type:"qcm",q:"Quel article pour Frau ?",opts:["der","die","das","den"],ans:1,tip:"die Frau = la femme (féminin)."},
          {type:"qcm",q:"Pourquoi 'das Mädchen' et pas 'die' ?",opts:["C'est masculin","Terminaison -chen = neutre","C'est pluriel","Erreur"],ans:1,tip:"-chen = toujours neutre!"},
          {type:"fill",q:"___ Zeitung ist interessant.",ans:"Die",tip:"-ung = féminin = die."},
          {type:"qcm",q:"Quel genre pour -heit/-keit ?",opts:["Masculin","Féminin","Neutre"],ans:1,tip:"-heit/-keit = féminin = die."},
        ]},
      { id:"u4l2", title:"Nominativ et Akkusativ",
        content:`**Nominativ (sujet) — Qui ? Quoi ?**
Der Mann liest. (L'homme lit.)
Die Frau kocht. (La femme cuisine.)
Das Kind spielt. (L'enfant joue.)

**Akkusativ (COD) — Qui ? Quoi ? (complément)**
Ich sehe **den** Mann. ⚠️ der → den !
Ich sehe **die** Frau. (pas de changement)
Ich sehe **das** Kind. (pas de changement)

**⚠️ Seul le masculin change au Akkusativ !**
| | Nominativ | Akkusativ |
|---|-----------|-----------|
| Masc | der/ein | **den/einen** |
| Fém | die/eine | die/eine |
| Neutre | das/ein | das/ein |

**Verbes + Akkusativ :**
haben, sehen, brauchen, kaufen, essen, trinken, lesen, nehmen, finden`,
        vocab:[
          {de:"den Mann",fr:"l'homme (Akk)",ex:"Ich sehe den Mann."},
          {de:"einen Kaffee",fr:"un café (Akk)",ex:"Ich trinke einen Kaffee."},
          {de:"brauchen",fr:"avoir besoin",ex:"Ich brauche einen Stift."},
          {de:"kaufen",fr:"acheter",ex:"Ich kaufe das Buch."},
          {de:"sehen",fr:"voir",ex:"Ich sehe die Frau."},
          {de:"finden",fr:"trouver",ex:"Ich finde das gut."},
        ],
        exercises:[
          {type:"qcm",q:"'Ich sehe ___ Mann.' (Akk)",opts:["der","die","den","dem"],ans:2,tip:"Masculin Akk: der → den."},
          {type:"fill",q:"Ich trinke ein___ Kaffee. (masc Akk)",ans:"en",tip:"ein → einen au masculin Akkusativ."},
          {type:"translate",q:"'J'achète le livre'",ans:"Ich kaufe das Buch",tip:"das Buch = neutre, pas de changement à l'Akk."},
          {type:"qcm",q:"Quel article ne change PAS à l'Akk ?",opts:["der","Tous changent","die et das","Aucun"],ans:2,tip:"Seul der → den. die et das restent identiques."},
        ]},
      { id:"u4l3", title:"Dativ : Le cas indirect",
        content:`**Dativ (COI) — À qui ? Pour qui ?**
Ich gebe **dem** Mann ein Buch. (Je donne un livre à l'homme.)
Ich gebe **der** Frau ein Buch. (à la femme)
Ich gebe **dem** Kind ein Buch. (à l'enfant)
Ich gebe **den** Kindern Bücher. (aux enfants +n!)

| | Nominativ | Akkusativ | **Dativ** |
|---|-----------|-----------|-----------|
| Masc | der | den | **dem** |
| Fém | die | die | **der** |
| Neutre | das | das | **dem** |
| Pluriel | die | die | **den (+n)** |

**Verbes + Dativ :**
helfen (aider), danken (remercier), antworten (répondre), gehören (appartenir), gefallen (plaire)

**Prépositions + Dativ :**
mit (avec), von (de), zu (à/chez), nach (après/vers), aus (de/hors), bei (chez), seit (depuis), gegenüber (en face)

💡 Mnémonique : **MiVoZuNa AusBeiSeiGe** !`,
        vocab:[
          {de:"dem Mann",fr:"à l'homme (Dat)",ex:"Ich gebe dem Mann das Buch."},
          {de:"der Frau",fr:"à la femme (Dat)",ex:"Ich helfe der Frau."},
          {de:"mit dem Bus",fr:"avec le bus",ex:"Ich fahre mit dem Bus."},
          {de:"zu Hause",fr:"à la maison",ex:"Ich bin zu Hause."},
          {de:"helfen",fr:"aider (+Dat)",ex:"Ich helfe dem Kind."},
          {de:"gehören",fr:"appartenir (+Dat)",ex:"Das Buch gehört mir."},
        ],
        exercises:[
          {type:"qcm",q:"'Ich gebe ___ Frau ein Buch.' (Dat fém)",opts:["die","der","dem","den"],ans:1,tip:"Féminin Dativ: die → der."},
          {type:"fill",q:"Ich fahre mit ___ Bus. (masc Dat)",ans:"dem",tip:"mit + Dativ. der → dem."},
          {type:"qcm",q:"Quel verbe prend le Dativ ?",opts:["kaufen","sehen","helfen","trinken"],ans:2,tip:"helfen + Dativ: Ich helfe dir."},
          {type:"translate",q:"'Je donne le livre à l'enfant'",ans:"Ich gebe dem Kind das Buch",tip:"dem Kind (Dat) + das Buch (Akk)."},
        ]},
    ]},

  // UNIT 5: VERBES COMPLETS
  { id:"u5", title:"Verben", icon:"⚡", desc:"sein, haben, werden, modaux, conjugaison complète", color:"#8b5cf6",
    lessons:[
      { id:"u5l1", title:"sein (être) & haben (avoir)",
        content:`**sein (être) — LE verbe le plus important :**
| Pronom | Présent | Prétérit |
|--------|---------|----------|
| ich | bin | war |
| du | bist | warst |
| er/sie/es | ist | war |
| wir | sind | waren |
| ihr | seid | wart |
| sie/Sie | sind | waren |

**haben (avoir) :**
| Pronom | Présent | Prétérit |
|--------|---------|----------|
| ich | habe | hatte |
| du | hast | hattest |
| er/sie/es | hat | hatte |
| wir | haben | hatten |
| ihr | habt | hattet |
| sie/Sie | haben | hatten |

**Usages essentiels :**
• Ich bin Student. (je suis) — identité, état
• Ich habe Hunger. (j'ai faim) — possession
• Ich bin müde. (je suis fatigué) — état
• Ich habe ein Auto. (j'ai une voiture) — possession`,
        vocab:[
          {de:"sein",fr:"être",ex:"Ich bin Student."},
          {de:"haben",fr:"avoir",ex:"Ich habe ein Buch."},
          {de:"müde",fr:"fatigué",ex:"Ich bin müde."},
          {de:"hungrig",fr:"affamé",ex:"Ich bin hungrig."},
          {de:"glücklich",fr:"heureux",ex:"Ich bin glücklich."},
          {de:"Hunger haben",fr:"avoir faim",ex:"Ich habe Hunger."},
        ],
        exercises:[
          {type:"qcm",q:"'Ich ___ Student.' (être)",opts:["habe","bin","ist","bist"],ans:1,tip:"ich bin = je suis."},
          {type:"fill",q:"Du ___ ein Buch. (avoir)",ans:"hast",tip:"du hast = tu as."},
          {type:"qcm",q:"Prétérit de 'ich bin' ?",opts:["ich war","ich wurde","ich hatte","ich wäre"],ans:0,tip:"ich war = j'étais."},
          {type:"translate",q:"'Nous sommes fatigués'",ans:"Wir sind müde",tip:"wir sind = nous sommes."},
          {type:"speak",q:"Conjuguez sein : ich, du, er",ans:"ich bin du bist er ist",tip:"bin, bist, ist"},
        ]},
      { id:"u5l2", title:"Verbes modaux : können, müssen, wollen...",
        content:`**Les 6 verbes modaux :**

**können** (pouvoir) : ich kann, du kannst, er kann
→ Ich kann Deutsch sprechen. (Je sais parler allemand.)

**müssen** (devoir) : ich muss, du musst, er muss
→ Ich muss arbeiten. (Je dois travailler.)

**wollen** (vouloir) : ich will, du willst, er will
→ Ich will nach Berlin fahren. (Je veux aller à Berlin.)

**sollen** (devoir/conseil) : ich soll, du sollst, er soll
→ Du sollst mehr lernen. (Tu devrais plus étudier.)

**dürfen** (avoir le droit) : ich darf, du darfst, er darf
→ Hier darf man nicht rauchen. (On n'a pas le droit de fumer ici.)

**mögen** (aimer) : ich mag, du magst, er mag
→ Ich mag Schokolade. (J'aime le chocolat.)

⚠️ **Structure :** Modal conjugué en position 2, infinitif À LA FIN !
→ Ich **kann** Deutsch **sprechen**.
→ Ich **muss** heute **arbeiten**.`,
        vocab:[
          {de:"können",fr:"pouvoir/savoir",ex:"Ich kann schwimmen."},
          {de:"müssen",fr:"devoir",ex:"Ich muss gehen."},
          {de:"wollen",fr:"vouloir",ex:"Ich will essen."},
          {de:"sollen",fr:"devoir (conseil)",ex:"Du sollst lernen."},
          {de:"dürfen",fr:"avoir le droit",ex:"Darf ich?"},
          {de:"mögen",fr:"aimer",ex:"Ich mag Kaffee."},
        ],
        exercises:[
          {type:"qcm",q:"'Je dois travailler' ?",opts:["Ich will arbeiten","Ich muss arbeiten","Ich kann arbeiten","Ich darf arbeiten"],ans:1,tip:"müssen = devoir (obligation)."},
          {type:"fill",q:"Ich ___ Deutsch sprechen. (pouvoir)",ans:"kann",tip:"können → ich kann."},
          {type:"qcm",q:"Où va l'infinitif avec un modal ?",opts:["Début","Position 2","Milieu","Fin"],ans:3,tip:"Infinitif toujours à la FIN!"},
          {type:"translate",q:"'On n'a pas le droit de fumer ici'",ans:"Hier darf man nicht rauchen",tip:"dürfen + nicht + infinitif à la fin."},
          {type:"speak",q:"Dites : 'Ich kann Deutsch sprechen'",ans:"Ich kann Deutsch sprechen",tip:"kann en position 2, sprechen à la fin"},
        ]},
      { id:"u5l3", title:"Verbes réguliers et irréguliers",
        content:`**Conjugaison régulière (présent) :**
Radical + terminaison : -e, -st, -t, -en, -t, -en

machen (faire) : ich mache, du machst, er macht, wir machen, ihr macht, sie machen
lernen (apprendre) : ich lerne, du lernst, er lernt...
arbeiten ⚠️ : ich arbeite, du arbeit**e**st, er arbeit**e**t (ajout de -e-)

**Verbes forts (changement de voyelle à du/er) :**
• e → i : sprechen → du spr**i**chst, essen → du **i**sst
• e → ie : lesen → du l**ie**st, sehen → du s**ie**hst
• a → ä : fahren → du f**ä**hrst, schlafen → du schl**ä**fst

**Verbes à particule séparable :**
aufstehen (se lever) → Ich **stehe** um 7 Uhr **auf**.
einkaufen (faire les courses) → Ich **kaufe** im Supermarkt **ein**.
anfangen (commencer) → Der Kurs **fängt** um 9 Uhr **an**.
⚠️ La particule va À LA FIN !

**Perfekt (passé composé) :**
haben/sein + Partizip II
• Régulier : ge-___-t → gemacht, gelernt
• Irrégulier : ge-___-en → gegangen, gesprochen
• -ieren : sans ge- → studiert, telefoniert`,
        vocab:[
          {de:"aufstehen",fr:"se lever",ex:"Ich stehe um 7 Uhr auf."},
          {de:"einkaufen",fr:"faire les courses",ex:"Ich kaufe im Supermarkt ein."},
          {de:"anfangen",fr:"commencer",ex:"Der Film fängt um 8 an."},
          {de:"studieren",fr:"étudier",ex:"Ich studiere Medizin."},
          {de:"gemacht",fr:"fait (Partizip II)",ex:"Ich habe es gemacht."},
          {de:"gegangen",fr:"allé (Partizip II)",ex:"Ich bin gegangen."},
        ],
        exercises:[
          {type:"qcm",q:"'du sprichst' — quel changement ?",opts:["a→ä","e→i","e→ie","o→ö"],ans:1,tip:"sprechen: e→i à du/er."},
          {type:"fill",q:"Ich ___ um 7 Uhr auf. (se lever)",ans:"stehe",tip:"aufstehen → ich stehe...auf."},
          {type:"qcm",q:"Partizip II de 'machen' ?",opts:["gemacht","gemachen","machet","machte"],ans:0,tip:"ge- + mach + -t = gemacht."},
          {type:"translate",q:"'Je me suis levé à 7 heures'",ans:"Ich bin um sieben Uhr aufgestanden",tip:"aufstehen → aufgestanden (sein + Partizip II)."},
          {type:"speak",q:"Conjuguez 'fahren' : ich, du, er",ans:"ich fahre du fährst er fährt",tip:"a→ä à du/er: fährst, fährt"},
        ]},
    ]},

  // UNIT 6: VIE QUOTIDIENNE
  { id:"u6", title:"Alltag", icon:"🏠", desc:"Famille, maison, routine, heures", color:"#ec4899",
    lessons:[
      { id:"u6l1", title:"La famille",
        content:`**Famille proche :**
• der Vater / die Mutter → père / mère
• die Eltern → les parents
• der Bruder / die Schwester → frère / sœur
• der Sohn / die Tochter → fils / fille
• der Großvater / die Großmutter → grand-père / grand-mère
• die Großeltern → les grands-parents
• der Onkel / die Tante → oncle / tante
• der Cousin / die Cousine → cousin / cousine

**Possessifs :** mein/meine (mon/ma), dein/deine (ton/ta)
• Mein Vater heißt Hans. → Mon père s'appelle Hans.
• Meine Mutter ist Lehrerin. → Ma mère est enseignante.
• Mein Bruder ist 15 Jahre alt.

**État civil :**
• verheiratet (marié), ledig (célibataire), geschieden (divorcé)`,
        vocab:[
          {de:"die Familie",fr:"la famille",ex:"Meine Familie ist groß."},
          {de:"der Bruder",fr:"le frère",ex:"Mein Bruder heißt Thomas."},
          {de:"die Schwester",fr:"la sœur",ex:"Meine Schwester studiert."},
          {de:"die Eltern",fr:"les parents",ex:"Meine Eltern wohnen in Berlin."},
          {de:"der Sohn",fr:"le fils",ex:"Mein Sohn ist drei Jahre alt."},
          {de:"die Tochter",fr:"la fille",ex:"Meine Tochter geht in die Schule."},
          {de:"verheiratet",fr:"marié(e)",ex:"Ich bin verheiratet."},
        ],
        exercises:[
          {type:"qcm",q:"'la mère' ?",opts:["der Mutter","die Mutter","das Mutter","den Mutter"],ans:1,tip:"die Mutter (féminin)."},
          {type:"fill",q:"Mein___ Schwester ist nett. (possessif fém)",ans:"e",tip:"meine (fém) = ma."},
          {type:"translate",q:"'Mes parents habitent à Berlin'",ans:"Meine Eltern wohnen in Berlin",tip:"Eltern = parents. wohnen = habiter."},
          {type:"speak",q:"Décrivez votre famille",ans:"Meine Familie ist groß ich habe einen Bruder und eine Schwester",tip:"Meine Familie, ich habe + Akkusativ"},
        ]},
      { id:"u6l2", title:"La maison et les heures",
        content:`**Pièces de la maison :**
• die Küche (cuisine) • das Wohnzimmer (salon)
• das Schlafzimmer (chambre) • das Badezimmer (salle de bain)
• der Flur (couloir) • der Garten (jardin)
• das Büro (bureau) • der Keller (cave)
• die Garage • der Balkon (balcon)

**L'heure :**
• Wie spät ist es? → Quelle heure est-il ?
• Es ist drei Uhr. → Il est 3h.
• Es ist halb vier. → Il est 3h30. ⚠️ (demi de 4!)
• Es ist Viertel nach drei. → 3h15.
• Es ist Viertel vor vier. → 3h45.
• Es ist zehn nach drei. → 3h10.
• Es ist fünf vor vier. → 3h55.

**Routine :**
• Ich stehe um 7 Uhr auf. (se lever)
• Ich frühstücke um 8 Uhr. (petit-déjeuner)
• Ich gehe um 9 Uhr zur Arbeit. (aller au travail)
• Ich esse um 12 Uhr zu Mittag. (déjeuner)
• Ich komme um 18 Uhr nach Hause. (rentrer)
• Ich gehe um 23 Uhr ins Bett. (se coucher)`,
        vocab:[
          {de:"die Küche",fr:"la cuisine",ex:"Ich koche in der Küche."},
          {de:"das Wohnzimmer",fr:"le salon",ex:"Wir sitzen im Wohnzimmer."},
          {de:"Wie spät ist es?",fr:"Quelle heure est-il ?",ex:"Wie spät ist es?"},
          {de:"halb",fr:"demi",ex:"Es ist halb drei. (2h30)"},
          {de:"Viertel nach",fr:"et quart",ex:"Es ist Viertel nach zehn."},
          {de:"aufstehen",fr:"se lever",ex:"Ich stehe um 7 Uhr auf."},
          {de:"frühstücken",fr:"prendre le petit-déj",ex:"Ich frühstücke um 8."},
        ],
        exercises:[
          {type:"qcm",q:"'halb drei' = quelle heure ?",opts:["3h30","2h30","3h00","2h00"],ans:1,tip:"halb drei = demi de 3 = 2h30!"},
          {type:"fill",q:"Ich ___ um 7 Uhr auf. (se lever)",ans:"stehe",tip:"aufstehen → ich stehe...auf."},
          {type:"qcm",q:"3h15 en allemand ?",opts:["Viertel vor drei","Viertel nach drei","halb drei","drei Viertel"],ans:1,tip:"nach = après. 3h + quart = Viertel nach drei."},
          {type:"speak",q:"Décrivez votre routine du matin",ans:"Ich stehe um sieben Uhr auf ich frühstücke um acht Uhr",tip:"aufstehen, frühstücken + um...Uhr"},
        ]},
    ]},

  // UNIT 7: NOURRITURE ET RESTAURANT
  { id:"u7", title:"Essen & Trinken", icon:"🍽️", desc:"Nourriture, boissons, au restaurant", color:"#f97316",
    lessons:[
      { id:"u7l1", title:"Aliments et boissons",
        content:`**Pain & petit-déjeuner :**
das Brot (pain), das Brötchen (petit pain), die Butter, die Marmelade, das Ei/die Eier (œuf/s), der Käse (fromage), die Wurst (saucisse), das Müsli (céréales)

**Fruits & légumes :**
der Apfel (pomme), die Banane, die Orange, die Tomate, die Kartoffel (pomme de terre), der Salat (salade), die Gurke (concombre), die Zwiebel (oignon)

**Viandes & poissons :**
das Fleisch (viande), das Hähnchen (poulet), das Schweinefleisch (porc), das Rindfleisch (bœuf), der Fisch (poisson)

**Boissons :**
das Wasser, der Kaffee, der Tee, die Milch, der Saft (jus), das Bier, der Wein, die Limonade

**Repas :**
das Frühstück (petit-déj), das Mittagessen (déjeuner), das Abendessen (dîner)`,
        vocab:[
          {de:"das Brot",fr:"le pain",ex:"Ich esse Brot zum Frühstück."},
          {de:"der Käse",fr:"le fromage",ex:"Ich mag Käse."},
          {de:"das Hähnchen",fr:"le poulet",ex:"Ich esse Hähnchen mit Reis."},
          {de:"der Saft",fr:"le jus",ex:"Einen Orangensaft, bitte."},
          {de:"die Kartoffel",fr:"la pomme de terre",ex:"Kartoffeln sind lecker."},
          {de:"das Frühstück",fr:"le petit-déjeuner",ex:"Was gibt es zum Frühstück?"},
        ],
        exercises:[
          {type:"qcm",q:"'le fromage' ?",opts:["der Käse","die Käse","das Käse","den Käse"],ans:0,tip:"der Käse (masculin)."},
          {type:"fill",q:"Ich trinke einen ___. (jus)",ans:"Saft",tip:"der Saft = le jus."},
          {type:"translate",q:"'Je mange du pain avec du fromage'",ans:"Ich esse Brot mit Käse",tip:"mit = avec (+ Dativ, mais noms seuls sans article)."},
          {type:"speak",q:"Commandez : 'Einen Kaffee und ein Brötchen, bitte'",ans:"Einen Kaffee und ein Brötchen bitte",tip:"einen (Akk masc), ein (Akk neutre)"},
        ]},
      { id:"u7l2", title:"Au restaurant",
        content:`**Arriver :**
• Haben Sie einen Tisch für zwei? (Avez-vous une table pour 2 ?)
• Ich habe reserviert. (J'ai réservé.)

**Commander :**
• Die Speisekarte, bitte. (La carte, svp.)
• Ich hätte gern... (Je voudrais...)
• Ich nehme... (Je prends...)
• Was empfehlen Sie? (Que recommandez-vous ?)
• Für mich bitte... (Pour moi...)

**Pendant le repas :**
• Es schmeckt sehr gut! (C'est très bon !)
• Kann ich noch etwas Brot haben? (Puis-je avoir encore du pain ?)
• Noch ein Wasser, bitte. (Encore une eau, svp.)

**Payer :**
• Die Rechnung, bitte. (L'addition, svp.)
• Zusammen oder getrennt? (Ensemble ou séparé ?)
• Stimmt so. (Gardez la monnaie.)
• Das macht 25 Euro. (Ça fait 25€.)`,
        vocab:[
          {de:"die Speisekarte",fr:"le menu/la carte",ex:"Die Speisekarte, bitte."},
          {de:"Ich hätte gern...",fr:"Je voudrais...",ex:"Ich hätte gern einen Salat."},
          {de:"Es schmeckt gut",fr:"C'est bon",ex:"Es schmeckt sehr gut!"},
          {de:"die Rechnung",fr:"l'addition",ex:"Die Rechnung, bitte."},
          {de:"zusammen",fr:"ensemble",ex:"Zusammen oder getrennt?"},
          {de:"empfehlen",fr:"recommander",ex:"Was empfehlen Sie?"},
        ],
        exercises:[
          {type:"fill",q:"Ich ___ gern einen Salat. (voudrais)",ans:"hätte",tip:"Ich hätte gern = je voudrais."},
          {type:"qcm",q:"'L'addition svp' ?",opts:["Die Speisekarte bitte","Die Rechnung bitte","Das Geld bitte","Der Preis bitte"],ans:1,tip:"die Rechnung = l'addition."},
          {type:"translate",q:"'Ça fait 15 euros'",ans:"Das macht fünfzehn Euro",tip:"Das macht + prix."},
          {type:"speak",q:"Commandez un repas complet",ans:"Ich hätte gern einen Salat und ein Hähnchen mit Kartoffeln bitte",tip:"Ich hätte gern + Akkusativ"},
        ]},
    ]},

  // UNIT 8: GRAMMAIRE AVANCÉE
  { id:"u8", title:"Grammatik", icon:"📖", desc:"Cas, déclinaisons, structure de phrase", color:"#6366f1",
    lessons:[
      { id:"u8l1", title:"Les 4 cas en pratique",
        content:`**Résumé des cas :**

**NOMINATIV** (sujet) — Wer? Was?
→ **Der** Lehrer unterrichtet. (Le prof enseigne.)

**AKKUSATIV** (COD) — Wen? Was?
→ Ich sehe **den** Lehrer. (Je vois le prof.)

**DATIV** (COI) — Wem?
→ Ich gebe **dem** Lehrer ein Buch. (Je donne un livre au prof.)

**GENITIV** (possession) — Wessen?
→ Das Buch **des** Lehrers. (Le livre du prof.)

**Tableau complet :**
|  | Masc | Fém | Neutre | Pluriel |
|--|------|-----|--------|---------|
| Nom | der | die | das | die |
| Akk | den | die | das | die |
| Dat | dem | der | dem | den+n |
| Gen | des+s | der | des+s | der |

**Exemples en contexte :**
• Nom: Der Mann kauft ein Buch.
• Akk: Ich kenne den Mann.
• Dat: Ich helfe dem Mann.
• Gen: Das Auto des Mannes ist neu.`,
        vocab:[
          {de:"der Nominativ",fr:"le nominatif",ex:"Der Mann ist nett. (Nominativ)"},
          {de:"der Akkusativ",fr:"l'accusatif",ex:"Ich sehe den Mann. (Akkusativ)"},
          {de:"der Dativ",fr:"le datif",ex:"Ich helfe dem Mann. (Dativ)"},
          {de:"der Genitiv",fr:"le génitif",ex:"Das Auto des Mannes. (Genitiv)"},
          {de:"kennen",fr:"connaître",ex:"Ich kenne den Mann."},
          {de:"unterrichten",fr:"enseigner",ex:"Der Lehrer unterrichtet Deutsch."},
        ],
        exercises:[
          {type:"qcm",q:"'Ich helfe ___ Frau.' (Dativ fém)",opts:["die","der","dem","den"],ans:1,tip:"die → der au Dativ féminin."},
          {type:"fill",q:"Das Auto ___ Mannes ist neu. (Genitiv)",ans:"des",tip:"der → des au Genitiv masculin."},
          {type:"qcm",q:"Quel cas pour le COD ?",opts:["Nominativ","Akkusativ","Dativ","Genitiv"],ans:1,tip:"Akkusativ = COD (Wen? Was?)."},
          {type:"translate",q:"'Je donne le livre à la femme'",ans:"Ich gebe der Frau das Buch",tip:"der Frau (Dat) + das Buch (Akk)."},
        ]},
      { id:"u8l2", title:"Ordre des mots et négation",
        content:`**Règle d'or : Le verbe conjugué est TOUJOURS en position 2 !**

**Phrase simple :** S + V + C
→ Ich lerne Deutsch.

**Inversion :** C + V + S (quand on commence par autre chose que le sujet)
→ Heute lerne ich Deutsch.
→ In Berlin wohne ich.
→ Morgen fahre ich nach München.

**Subordonnées :** Conjonction + S + ... + V (verbe à la FIN!)
→ Ich weiß, **dass** du Deutsch **lernst**.
→ Ich lerne Deutsch, **weil** es schön **ist**.
→ **Wenn** du **kommst**, rufe ich dich an.

**Questions :**
• W-Frage : Was machst du? (W-mot + V + S)
• Ja/Nein : Lernst du Deutsch? (V + S)

**Négation :**
• nicht → après le verbe, avant l'adjectif
  Ich verstehe nicht. / Das ist nicht gut.
• kein → remplace ein/eine
  Ich habe kein Geld. / Ich habe keine Zeit.`,
        vocab:[
          {de:"heute",fr:"aujourd'hui",ex:"Heute lerne ich Deutsch."},
          {de:"morgen",fr:"demain",ex:"Morgen fahre ich nach Berlin."},
          {de:"weil",fr:"parce que",ex:"Ich lerne Deutsch, weil es schön ist."},
          {de:"dass",fr:"que",ex:"Ich weiß, dass du kommst."},
          {de:"wenn",fr:"quand/si",ex:"Wenn du kommst, rufe ich dich an."},
          {de:"nicht",fr:"ne...pas",ex:"Ich verstehe nicht."},
          {de:"kein/keine",fr:"pas de",ex:"Ich habe kein Geld."},
        ],
        exercises:[
          {type:"qcm",q:"'Heute ___ ich Deutsch.' — quel ordre ?",opts:["lerne","ich lerne","lernen","Deutsch lerne"],ans:0,tip:"Inversion: Heute LERNE ich."},
          {type:"fill",q:"Ich weiß, dass du Deutsch ___. (apprendre)",ans:"lernst",tip:"Subordonnée: verbe à la FIN!"},
          {type:"qcm",q:"'Ich habe ___ Geld.' (pas d'argent)",opts:["nicht","kein","keine","nichts"],ans:1,tip:"kein remplace ein (masculin/neutre)."},
          {type:"translate",q:"'Je n'ai pas le temps'",ans:"Ich habe keine Zeit",tip:"die Zeit (fém) → keine Zeit."},
          {type:"speak",q:"Dites : 'Ich lerne Deutsch, weil es schön ist'",ans:"Ich lerne Deutsch weil es schön ist",tip:"weil + verbe à la fin"},
        ]},
    ]},

  // UNIT 9: CONVERSATIONS
  { id:"u9", title:"Gespräche", icon:"💬", desc:"Dialogues, directions, urgences", color:"#14b8a6",
    lessons:[
      { id:"u9l1", title:"Demander son chemin",
        content:`**Questions :**
• Entschuldigung, wo ist der Bahnhof?
• Wie komme ich zum Krankenhaus?
• Ist es weit von hier?
• Können Sie mir den Weg zeigen?

**Directions :**
• geradeaus → tout droit
• links → à gauche | rechts → à droite
• die erste/zweite/dritte Straße → la 1ère/2ème/3ème rue
• an der Ampel → au feu (rouge)
• an der Kreuzung → au carrefour
• gegenüber → en face
• neben → à côté de

**Transports :**
• der Bus, die U-Bahn (métro), die Straßenbahn (tramway)
• der Bahnhof (gare), die Haltestelle (arrêt)
• Welche Linie fährt zum...? (Quelle ligne va au...?)

**Réponse type :**
"Gehen Sie geradeaus, dann die zweite Straße links.
Der Bahnhof ist gegenüber der Kirche."`,
        vocab:[
          {de:"geradeaus",fr:"tout droit",ex:"Gehen Sie geradeaus."},
          {de:"links",fr:"à gauche",ex:"Dann links abbiegen."},
          {de:"rechts",fr:"à droite",ex:"Die zweite Straße rechts."},
          {de:"die Ampel",fr:"le feu rouge",ex:"An der Ampel links."},
          {de:"der Bahnhof",fr:"la gare",ex:"Wo ist der Bahnhof?"},
          {de:"die U-Bahn",fr:"le métro",ex:"Nehmen Sie die U-Bahn."},
          {de:"gegenüber",fr:"en face",ex:"Gegenüber der Kirche."},
        ],
        exercises:[
          {type:"qcm",q:"'Où est la gare ?'",opts:["Was ist der Bahnhof?","Wo ist der Bahnhof?","Wer ist am Bahnhof?","Wie ist der Bahnhof?"],ans:1,tip:"Wo = où."},
          {type:"fill",q:"Gehen Sie ___, dann links. (tout droit)",ans:"geradeaus",tip:"geradeaus = tout droit."},
          {type:"translate",q:"'Prenez le métro'",ans:"Nehmen Sie die U-Bahn",tip:"nehmen + Akkusativ."},
          {type:"speak",q:"Donnez des directions : tout droit puis à droite",ans:"Gehen Sie geradeaus dann rechts",tip:"geradeaus, dann rechts"},
        ]},
      { id:"u9l2", title:"Situations d'urgence et phrases essentielles",
        content:`**Urgences :**
• Hilfe! → À l'aide !
• Rufen Sie die Polizei! → Appelez la police !
• Ich brauche einen Arzt! → J'ai besoin d'un médecin !
• Wo ist das Krankenhaus? → Où est l'hôpital ?
• Es ist ein Notfall! → C'est une urgence !

**Phrases de survie :**
• Ich verstehe nicht. → Je ne comprends pas.
• Können Sie das wiederholen? → Pouvez-vous répéter ?
• Langsamer, bitte! → Plus lentement !
• Können Sie das buchstabieren? → Pouvez-vous épeler ?
• Sprechen Sie Französisch? → Parlez-vous français ?
• Wie sagt man... auf Deutsch? → Comment dit-on... en allemand ?
• Was bedeutet...? → Que signifie... ?

**Au téléphone :**
• Hallo, hier ist... → Allô, c'est...
• Kann ich mit... sprechen? → Puis-je parler à... ?
• Einen Moment, bitte. → Un moment, svp.`,
        vocab:[
          {de:"Hilfe!",fr:"À l'aide !",ex:"Hilfe! Hilfe!"},
          {de:"Ich verstehe nicht",fr:"Je ne comprends pas",ex:"Entschuldigung, ich verstehe nicht."},
          {de:"Können Sie das wiederholen?",fr:"Pouvez-vous répéter ?",ex:"Können Sie das wiederholen?"},
          {de:"Langsamer, bitte!",fr:"Plus lentement !",ex:"Langsamer, bitte!"},
          {de:"das Krankenhaus",fr:"l'hôpital",ex:"Wo ist das Krankenhaus?"},
          {de:"der Notfall",fr:"l'urgence",ex:"Es ist ein Notfall!"},
        ],
        exercises:[
          {type:"qcm",q:"'Je ne comprends pas' ?",opts:["Ich weiß nicht","Ich verstehe nicht","Ich kann nicht","Ich höre nicht"],ans:1,tip:"verstehen = comprendre."},
          {type:"fill",q:"___, bitte! (plus lentement)",ans:"Langsamer",tip:"Langsamer = plus lentement."},
          {type:"translate",q:"'Parlez-vous français ?'",ans:"Sprechen Sie Französisch",tip:"Sprechen Sie + langue?"},
          {type:"speak",q:"Dites : 'Entschuldigung, ich verstehe nicht. Langsamer, bitte!'",ans:"Entschuldigung ich verstehe nicht langsamer bitte",tip:"Phrases de survie essentielles!"},
        ]},
    ]},

  // UNIT 10: PRONOMS ET PRÉPOSITIONS
  { id:"u10", title:"Pronomen", icon:"🔗", desc:"Pronoms, prépositions, connecteurs", color:"#a855f7",
    lessons:[
      { id:"u10l1", title:"Pronoms personnels et possessifs",
        content:`**Pronoms personnels :**
| | Nom | Akk | Dat |
|---|-----|-----|-----|
| je | ich | mich | mir |
| tu | du | dich | dir |
| il | er | ihn | ihm |
| elle | sie | sie | ihr |
| neutre | es | es | ihm |
| nous | wir | uns | uns |
| vous(pl) | ihr | euch | euch |
| ils/elles | sie | sie | ihnen |
| Vous(form) | Sie | Sie | Ihnen |

**Pronoms possessifs :**
ich → mein | du → dein | er → sein | sie → ihr
es → sein | wir → unser | ihr → euer | sie → ihr | Sie → Ihr

**Accord :** comme ein/eine/ein
• mein Bruder (masc) / meine Schwester (fém) / mein Kind (neutre)
• meinen Bruder (Akk masc) / meinem Bruder (Dat masc)`,
        vocab:[
          {de:"mich",fr:"me (Akk)",ex:"Siehst du mich?"},
          {de:"mir",fr:"me (Dat)",ex:"Kannst du mir helfen?"},
          {de:"ihm",fr:"lui (Dat)",ex:"Ich gebe ihm das Buch."},
          {de:"ihnen",fr:"leur (Dat)",ex:"Ich sage ihnen die Wahrheit."},
          {de:"mein/meine",fr:"mon/ma",ex:"Mein Bruder ist groß."},
          {de:"unser/unsere",fr:"notre",ex:"Unsere Mutter kocht gut."},
        ],
        exercises:[
          {type:"qcm",q:"'Kannst du ___ helfen?' (me, Dat)",opts:["mich","mir","mein","ich"],ans:1,tip:"helfen + Dativ = mir."},
          {type:"fill",q:"Ich gebe ___ das Buch. (à lui)",ans:"ihm",tip:"er → ihm au Dativ."},
          {type:"qcm",q:"'notre mère' ?",opts:["unser Mutter","unsere Mutter","unseren Mutter","unserem Mutter"],ans:1,tip:"die Mutter (fém) → unsere."},
          {type:"translate",q:"'Est-ce que tu me vois ?'",ans:"Siehst du mich",tip:"sehen + Akkusativ = mich."},
        ]},
    ]},
];

// Unité "Die Uhrzeit" injectée depuis un module séparé pour éviter
// d'alourdir ce fichier déjà très long.
import { UHRZEIT_UNIT } from "./uhrzeitLesson";
UNITS.push(UHRZEIT_UNIT);

export const SCENARIOS: Scenario[] = [
  {id:"s1",title:"Au café",icon:"☕",desc:"Commander des boissons",prompt:"Tu es serveur dans un café allemand. Commence par 'Guten Tag! Was darf es sein?'. Guide l'élève pour commander. Corrige chaque erreur avec traduction FR. Max 120 mots."},
  {id:"s2",title:"À l'hôtel",icon:"🏨",desc:"Réserver une chambre",prompt:"Tu es réceptionniste d'hôtel. Commence par 'Guten Abend! Willkommen im Hotel. Wie kann ich Ihnen helfen?'. Demande les dates, type de chambre, nombre de personnes. Corrige chaque erreur. Max 120 mots."},
  {id:"s3",title:"Chez le médecin",icon:"🏥",desc:"Décrire ses symptômes",prompt:"Tu es médecin allemand. Commence par 'Guten Tag! Was fehlt Ihnen?'. Guide l'élève pour décrire ses symptômes. Enseigne le vocabulaire médical. Corrige chaque erreur. Max 120 mots."},
  {id:"s4",title:"Entretien d'embauche",icon:"💼",desc:"Se présenter professionnellement",prompt:"Tu fais passer un entretien d'embauche. Commence par 'Guten Tag! Bitte, nehmen Sie Platz. Erzählen Sie mir über sich.'. Pose des questions sur l'expérience, les compétences, la motivation. Corrige chaque erreur. Max 120 mots."},
  {id:"s5",title:"Au supermarché",icon:"🛒",desc:"Faire ses courses",prompt:"Tu es vendeur au supermarché. Commence par 'Hallo! Brauchen Sie Hilfe?'. Guide l'élève pour trouver des produits, demander les prix. Corrige chaque erreur. Max 120 mots."},
  {id:"s6",title:"Demander son chemin",icon:"🗺️",desc:"Naviguer en ville",prompt:"Un touriste te demande son chemin dans une ville allemande. Donne des directions claires en allemand. Utilise geradeaus, links, rechts, Ampel, Kreuzung. Corrige chaque erreur. Max 120 mots."},
  {id:"s7",title:"Nouveau voisin",icon:"🏘️",desc:"Se présenter, small talk",prompt:"Tu es un voisin allemand sympa. Commence par 'Hallo! Ich bin neu hier. Ich heiße Klaus. Und Sie?'. Fais la conversation : d'où vient-il, famille, travail. Corrige chaque erreur. Max 120 mots."},
  {id:"s8",title:"À l'aéroport",icon:"✈️",desc:"Check-in, douane",prompt:"Tu es agent à l'aéroport. Commence par 'Guten Tag! Ihren Reisepass und Ihre Bordkarte, bitte.'. Guide pour l'enregistrement, les bagages, la porte d'embarquement. Corrige chaque erreur. Max 120 mots."},
  {id:"s9",title:"Cours d'allemand",icon:"📚",desc:"Poser des questions de grammaire",prompt:"Tu es un professeur d'allemand en cours. L'élève peut te poser N'IMPORTE QUELLE question de grammaire, vocabulaire ou conjugaison. Explique avec des exemples clairs. Corrige les erreurs. Max 150 mots."},
  {id:"s10",title:"Appel téléphonique",icon:"📞",desc:"Prendre rendez-vous",prompt:"Tu es secrétaire dans un cabinet médical. Commence par 'Praxis Dr. Müller, guten Tag!'. L'élève doit prendre rendez-vous. Guide-le avec les jours, heures, informations nécessaires. Corrige chaque erreur. Max 120 mots."},
];
