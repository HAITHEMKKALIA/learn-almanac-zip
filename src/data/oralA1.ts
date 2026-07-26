// ============= ORAL A1 — 10 GRANDES PARTIES =============
// Contenu pédagogique complet basé sur le cours envoyé par l'utilisateur

export interface OralExplanation {
  de: string;
  fr: string;
  detail: string;
}

export interface OralError {
  wrong: string;
  right: string;
  explain: string;
}

export interface OralExercise {
  type: "qcm" | "translate" | "fill" | "correct";
  q: string;
  opts?: string[];
  ans: string | number;
  tip: string;
}

export interface OralVocab {
  de: string;
  fr: string;
  ex?: string;
  exFr?: string;
}

export interface OralTopic {
  id: string;
  icon: string;
  number: number;
  title: string;
  titleDe: string;
  intro: string;
  modelDe: string;
  modelFr: string;
  // Découpage en phrases pour surlignage mot-à-mot
  sentences: { de: string; fr: string }[];
  vocabulary: OralVocab[]; // 30+ mots
  explanations: OralExplanation[];
  errors: OralError[];
  usefulPhrases: { de: string; fr: string }[];
  exercises: OralExercise[];
}

// ============= 1. SE PRÉSENTER =============
const T1: OralTopic = {
  id: "presentation",
  icon: "👤",
  number: 1,
  title: "Se présenter",
  titleDe: "Sich vorstellen",
  intro: "Le sujet le plus important pour l'examen oral A1. Maîtrise-le par cœur !",
  modelDe:
    "Hallo! Ich heiße Haithem. Ich komme aus Tunesien. Ich bin 28 Jahre alt. Ich arbeite als Informatiker. Ich wohne in Tunis. Ich spreche Arabisch, Französisch und ein bisschen Deutsch. Ich bin verheiratet. Ich habe keine Kinder.",
  modelFr:
    "Bonjour ! Je m'appelle Haithem. Je viens de Tunisie. J'ai 28 ans. Je travaille comme informaticien. J'habite à Tunis. Je parle arabe, français et un peu allemand. Je suis marié. Je n'ai pas d'enfants.",
  sentences: [
    { de: "Hallo!", fr: "Bonjour !" },
    { de: "Ich heiße Haithem.", fr: "Je m'appelle Haithem." },
    { de: "Ich komme aus Tunesien.", fr: "Je viens de Tunisie." },
    { de: "Ich bin 28 Jahre alt.", fr: "J'ai 28 ans." },
    { de: "Ich arbeite als Informatiker.", fr: "Je travaille comme informaticien." },
    { de: "Ich wohne in Tunis.", fr: "J'habite à Tunis." },
    { de: "Ich spreche Arabisch, Französisch und ein bisschen Deutsch.", fr: "Je parle arabe, français et un peu allemand." },
    { de: "Ich bin verheiratet.", fr: "Je suis marié." },
    { de: "Ich habe keine Kinder.", fr: "Je n'ai pas d'enfants." },
  ],
  vocabulary: [
    { de: "Ich heiße…", fr: "Je m'appelle…" },
    { de: "Ich bin…", fr: "Je suis…" },
    { de: "Mein Name ist…", fr: "Mon nom est…" },
    { de: "Ich komme aus…", fr: "Je viens de…" },
    { de: "Ich wohne in…", fr: "J'habite à…" },
    { de: "Ich arbeite als…", fr: "Je travaille comme…" },
    { de: "Ich spreche…", fr: "Je parle…" },
    { de: "Jahre alt", fr: "ans (âge)" },
    { de: "verheiratet", fr: "marié(e)" },
    { de: "ledig", fr: "célibataire" },
    { de: "geschieden", fr: "divorcé(e)" },
    { de: "verwitwet", fr: "veuf / veuve" },
    { de: "ein bisschen", fr: "un peu" },
    { de: "fließend", fr: "couramment" },
    { de: "die Muttersprache", fr: "la langue maternelle" },
    { de: "der Beruf", fr: "le métier" },
    { de: "der Informatiker", fr: "l'informaticien" },
    { de: "der Lehrer / die Lehrerin", fr: "l'enseignant(e)" },
    { de: "der Arzt / die Ärztin", fr: "le/la médecin" },
    { de: "der Student / die Studentin", fr: "l'étudiant(e)" },
    { de: "der Ingenieur", fr: "l'ingénieur" },
    { de: "die Stadt", fr: "la ville" },
    { de: "das Land", fr: "le pays" },
    { de: "die Nationalität", fr: "la nationalité" },
    { de: "Tunesien", fr: "la Tunisie" },
    { de: "Tunesier / Tunesierin", fr: "Tunisien / Tunisienne" },
    { de: "Deutschland", fr: "l'Allemagne" },
    { de: "Frankreich", fr: "la France" },
    { de: "Arabisch", fr: "l'arabe" },
    { de: "Französisch", fr: "le français" },
    { de: "Deutsch", fr: "l'allemand" },
    { de: "Englisch", fr: "l'anglais" },
    { de: "die Kinder", fr: "les enfants" },
    { de: "kein / keine", fr: "pas de" },
  ],
  explanations: [
    { de: "Ich heiße…", fr: "Je m'appelle…", detail: "Verbe heißen = s'appeler. Conjugaison au nominatif." },
    { de: "Ich komme aus…", fr: "Je viens de…", detail: "Préposition aus + pays/ville (sans article pour la plupart)." },
    { de: "Ich bin … Jahre alt", fr: "J'ai … ans", detail: "Structure FIXE : sein + nombre + Jahre + alt. Ne JAMAIS oublier 'alt' !" },
    { de: "Ich arbeite als…", fr: "Je travaille comme…", detail: "als = comme (pour profession). Pas wie !" },
    { de: "Ich wohne in…", fr: "J'habite à…", detail: "wohnen = habiter. in + ville (datif)." },
    { de: "Ich spreche…", fr: "Je parle…", detail: "sprechen = parler. Verbe irrégulier (ich spreche, du sprichst)." },
    { de: "ein bisschen", fr: "un peu", detail: "Expression indispensable pour dire 'un peu'." },
    { de: "Ich bin verheiratet", fr: "Je suis marié", detail: "verheiratet = participe passé utilisé comme adjectif." },
    { de: "Ich habe keine Kinder", fr: "Je n'ai pas d'enfants", detail: "keine = pas de (négation d'un nom au pluriel)." },
  ],
  errors: [
    { wrong: "Ich bin 28 Jahre", right: "Ich bin 28 Jahre alt", explain: "On dit littéralement 'Je suis 28 ans VIEUX'. Ne jamais oublier 'alt'." },
    { wrong: "Ich komme von Tunesien", right: "Ich komme aus Tunesien", explain: "von = de (personne), aus = de (pays/ville)." },
    { wrong: "Ich arbeite wie Informatiker", right: "Ich arbeite als Informatiker", explain: "als = comme (profession), wie = comme (comparaison)." },
    { wrong: "Ich wohne Tunis", right: "Ich wohne in Tunis", explain: "Ne jamais oublier la préposition 'in' avant une ville." },
    { wrong: "Ich habe nicht Kinder", right: "Ich habe keine Kinder", explain: "kein = pas de (nom). nicht = pas (verbe/adjectif)." },
  ],
  usefulPhrases: [
    { de: "Ich lerne Deutsch seit zwei Jahren.", fr: "J'apprends l'allemand depuis deux ans." },
    { de: "Mein Hobby ist Fußball spielen.", fr: "Mon hobby est de jouer au football." },
    { de: "In meiner Freizeit lese ich gern Bücher.", fr: "Pendant mon temps libre, j'aime lire." },
    { de: "Ich habe einen Bruder und eine Schwester.", fr: "J'ai un frère et une sœur." },
    { de: "Ich bin Tunesier.", fr: "Je suis Tunisien." },
  ],
  exercises: [
    { type: "qcm", q: "Comment dit-on 'J'ai 28 ans' ?", opts: ["Ich habe 28 Jahre", "Ich bin 28 Jahre alt", "Ich bin 28 Jahre", "Ich habe 28 alt"], ans: 1, tip: "Structure : sein + nombre + Jahre + alt." },
    { type: "qcm", q: "'Je viens de Tunisie' ?", opts: ["Ich komme von Tunesien", "Ich gehe aus Tunesien", "Ich komme aus Tunesien", "Ich bin von Tunesien"], ans: 2, tip: "aus + pays." },
    { type: "qcm", q: "'Je travaille comme médecin' ?", opts: ["Ich arbeite wie Arzt", "Ich arbeite als Arzt", "Ich bin wie Arzt", "Ich arbeite als ein Arzt"], ans: 1, tip: "als (profession), pas wie." },
    { type: "translate", q: "Je m'appelle Haithem.", ans: "Ich heiße Haithem", tip: "heißen = s'appeler." },
    { type: "translate", q: "J'habite à Tunis.", ans: "Ich wohne in Tunis", tip: "wohnen + in + ville." },
    { type: "translate", q: "Je n'ai pas d'enfants.", ans: "Ich habe keine Kinder", tip: "keine pour nier un nom pluriel." },
    { type: "fill", q: "Ich __ aus Tunesien.", ans: "komme", tip: "kommen au présent, ich → komme." },
    { type: "fill", q: "Ich bin 28 Jahre __.", ans: "alt", tip: "Structure fixe." },
    { type: "correct", q: "Ich komme von Frankreich.", ans: "Ich komme aus Frankreich", tip: "Pour les pays : aus, pas von." },
    { type: "correct", q: "Ich habe nicht Kinder.", ans: "Ich habe keine Kinder", tip: "kein/keine pour nier un nom." },
  ],
};

// ============= 2. LA FAMILLE =============
const T2: OralTopic = {
  id: "famille",
  icon: "👨‍👩‍👧‍👦",
  number: 2,
  title: "La famille",
  titleDe: "Die Familie",
  intro: "Parler de tes proches : parents, frères, sœurs, animaux.",
  modelDe:
    "Meine Familie ist klein, aber sehr nett. Ich habe zwei Brüder und eine Schwester. Meine Mutter arbeitet als Lehrerin. Mein Vater ist Rentner. Meine Eltern wohnen in Sousse. Meine Geschwister wohnen im Ausland. Ich habe auch einen Hund. Er heißt Rex und ist drei Jahre alt.",
  modelFr:
    "Ma famille est petite mais très gentille. J'ai deux frères et une sœur. Ma mère travaille comme enseignante. Mon père est retraité. Mes parents habitent à Sousse. Mes frères et sœurs habitent à l'étranger. J'ai aussi un chien. Il s'appelle Rex et a trois ans.",
  sentences: [
    { de: "Meine Familie ist klein, aber sehr nett.", fr: "Ma famille est petite mais très gentille." },
    { de: "Ich habe zwei Brüder und eine Schwester.", fr: "J'ai deux frères et une sœur." },
    { de: "Meine Mutter arbeitet als Lehrerin.", fr: "Ma mère travaille comme enseignante." },
    { de: "Mein Vater ist Rentner.", fr: "Mon père est retraité." },
    { de: "Meine Eltern wohnen in Sousse.", fr: "Mes parents habitent à Sousse." },
    { de: "Meine Geschwister wohnen im Ausland.", fr: "Mes frères et sœurs vivent à l'étranger." },
    { de: "Ich habe auch einen Hund.", fr: "J'ai aussi un chien." },
    { de: "Er heißt Rex und ist drei Jahre alt.", fr: "Il s'appelle Rex et a trois ans." },
  ],
  vocabulary: [
    { de: "die Familie", fr: "la famille" },
    { de: "die Eltern", fr: "les parents" },
    { de: "der Vater", fr: "le père" },
    { de: "die Mutter", fr: "la mère" },
    { de: "der Bruder / die Brüder", fr: "le frère / les frères" },
    { de: "die Schwester / die Schwestern", fr: "la sœur / les sœurs" },
    { de: "die Geschwister", fr: "les frères et sœurs" },
    { de: "der Sohn", fr: "le fils" },
    { de: "die Tochter", fr: "la fille" },
    { de: "die Kinder", fr: "les enfants" },
    { de: "der Großvater / Opa", fr: "le grand-père" },
    { de: "die Großmutter / Oma", fr: "la grand-mère" },
    { de: "die Großeltern", fr: "les grands-parents" },
    { de: "der Onkel", fr: "l'oncle" },
    { de: "die Tante", fr: "la tante" },
    { de: "der Cousin / die Cousine", fr: "le cousin / la cousine" },
    { de: "der Neffe / die Nichte", fr: "le neveu / la nièce" },
    { de: "der Mann / die Frau", fr: "le mari / la femme" },
    { de: "der Freund / die Freundin", fr: "le copain / la copine" },
    { de: "der Hund", fr: "le chien" },
    { de: "die Katze", fr: "le chat" },
    { de: "Einzelkind", fr: "enfant unique" },
    { de: "groß", fr: "grand" },
    { de: "klein", fr: "petit" },
    { de: "nett", fr: "gentil" },
    { de: "alt", fr: "vieux / âgé" },
    { de: "jung", fr: "jeune" },
    { de: "Rentner / Rentnerin", fr: "retraité(e)" },
    { de: "im Ausland", fr: "à l'étranger" },
    { de: "zusammen", fr: "ensemble" },
    { de: "Mein / Meine", fr: "Mon / Ma / Mes" },
    { de: "leben", fr: "vivre" },
  ],
  explanations: [
    { de: "Mein / Meine", fr: "Mon / Ma", detail: "Mein = masculin/neutre, Meine = féminin/pluriel." },
    { de: "Ich habe…", fr: "J'ai…", detail: "haben au présent. Suivi de l'accusatif (einen Bruder, eine Schwester)." },
    { de: "zwei Brüder", fr: "deux frères", detail: "Pluriel irrégulier : Bruder → Brüder (umlaut)." },
    { de: "Meine Eltern", fr: "Mes parents", detail: "Eltern est toujours pluriel → Meine + verbe au pluriel." },
    { de: "im Ausland", fr: "à l'étranger", detail: "im = in dem (contraction in + dem)." },
    { de: "einen Hund", fr: "un chien", detail: "Accusatif après haben → ein → einen (masculin)." },
  ],
  errors: [
    { wrong: "Mein Mutter", right: "Meine Mutter", explain: "Mutter est féminin → Meine." },
    { wrong: "Meine Vater", right: "Mein Vater", explain: "Vater est masculin → Mein." },
    { wrong: "Ich habe ein Hund", right: "Ich habe einen Hund", explain: "Accusatif masculin : ein → einen." },
    { wrong: "Meine Eltern wohnt", right: "Meine Eltern wohnen", explain: "Eltern = pluriel → wohnen, pas wohnt." },
    { wrong: "Ich habe zwei Schwester", right: "Ich habe zwei Schwestern", explain: "Pluriel : Schwester → Schwestern." },
  ],
  usefulPhrases: [
    { de: "Ich habe eine große Familie.", fr: "J'ai une grande famille." },
    { de: "Meine Großeltern leben noch.", fr: "Mes grands-parents sont encore vivants." },
    { de: "Ich bin Einzelkind.", fr: "Je suis enfant unique." },
    { de: "Meine Frau arbeitet als Ärztin.", fr: "Ma femme travaille comme médecin." },
    { de: "Ich bin der Älteste.", fr: "Je suis l'aîné." },
  ],
  exercises: [
    { type: "qcm", q: "'Ma mère' ?", opts: ["Mein Mutter", "Meine Mutter", "Meiner Mutter", "Meines Mutter"], ans: 1, tip: "Mutter = féminin." },
    { type: "qcm", q: "'Mon père' ?", opts: ["Meine Vater", "Mein Vater", "Meiner Vater", "Meines Vater"], ans: 1, tip: "Vater = masculin." },
    { type: "qcm", q: "'J'ai un chien' ?", opts: ["Ich habe ein Hund", "Ich habe einen Hund", "Ich habe der Hund", "Ich habe einer Hund"], ans: 1, tip: "Accusatif masc : einen." },
    { type: "translate", q: "J'ai deux frères.", ans: "Ich habe zwei Brüder", tip: "Pluriel Bruder → Brüder." },
    { type: "translate", q: "Mes parents habitent à Sousse.", ans: "Meine Eltern wohnen in Sousse", tip: "Eltern pluriel + wohnen." },
    { type: "fill", q: "__ Schwester wohnt in Berlin.", ans: "Meine", tip: "Schwester = féminin." },
    { type: "fill", q: "Ich habe __ Bruder.", ans: "einen", tip: "Accusatif masculin." },
    { type: "correct", q: "Mein Mutter arbeitet als Lehrerin.", ans: "Meine Mutter arbeitet als Lehrerin", tip: "Mutter féminin → Meine." },
    { type: "correct", q: "Ich habe zwei Schwester.", ans: "Ich habe zwei Schwestern", tip: "Pluriel Schwestern." },
  ],
};

// ============= 3. JOURNÉE TYPE =============
const T3: OralTopic = {
  id: "tagesablauf",
  icon: "⏰",
  number: 3,
  title: "La journée type",
  titleDe: "Der Tagesablauf",
  intro: "Décrire ses activités du matin au soir avec les heures.",
  modelDe:
    "Ich stehe um 7 Uhr auf. Dann frühstücke ich. Ich trinke Kaffee und esse Brot mit Butter. Um 8 Uhr fahre ich zur Arbeit. Ich arbeite am Computer. Um 12 Uhr esse ich Mittagessen. Nachmittags treffe ich Freunde. Abends koche ich zu Hause. Dann schaue ich Fernsehen oder lese ein Buch. Um 23 Uhr gehe ich ins Bett.",
  modelFr:
    "Je me lève à 7h. Ensuite je prends le petit-déjeuner. Je bois du café et mange du pain avec du beurre. À 8h je vais au travail. Je travaille sur l'ordinateur. À midi je déjeune. L'après-midi je rencontre des amis. Le soir je cuisine à la maison. Puis je regarde la télé ou lis un livre. À 23h je vais au lit.",
  sentences: [
    { de: "Ich stehe um 7 Uhr auf.", fr: "Je me lève à 7h." },
    { de: "Dann frühstücke ich.", fr: "Ensuite je prends le petit-déjeuner." },
    { de: "Ich trinke Kaffee und esse Brot mit Butter.", fr: "Je bois du café et mange du pain avec du beurre." },
    { de: "Um 8 Uhr fahre ich zur Arbeit.", fr: "À 8h je vais au travail." },
    { de: "Ich arbeite am Computer.", fr: "Je travaille sur l'ordinateur." },
    { de: "Um 12 Uhr esse ich Mittagessen.", fr: "À midi je déjeune." },
    { de: "Nachmittags treffe ich Freunde.", fr: "L'après-midi je rencontre des amis." },
    { de: "Abends koche ich zu Hause.", fr: "Le soir je cuisine à la maison." },
    { de: "Dann schaue ich Fernsehen oder lese ein Buch.", fr: "Puis je regarde la télé ou lis un livre." },
    { de: "Um 23 Uhr gehe ich ins Bett.", fr: "À 23h je vais au lit." },
  ],
  vocabulary: [
    { de: "aufstehen", fr: "se lever" },
    { de: "aufwachen", fr: "se réveiller" },
    { de: "frühstücken", fr: "prendre le petit-déjeuner" },
    { de: "Mittagessen essen", fr: "déjeuner" },
    { de: "Abendessen essen", fr: "dîner" },
    { de: "duschen", fr: "se doucher" },
    { de: "die Zähne putzen", fr: "se brosser les dents" },
    { de: "anziehen", fr: "s'habiller" },
    { de: "arbeiten", fr: "travailler" },
    { de: "schlafen", fr: "dormir" },
    { de: "ins Bett gehen", fr: "aller au lit" },
    { de: "kochen", fr: "cuisiner" },
    { de: "essen", fr: "manger" },
    { de: "trinken", fr: "boire" },
    { de: "fahren", fr: "conduire / aller (en transport)" },
    { de: "der Kaffee", fr: "le café" },
    { de: "das Brot", fr: "le pain" },
    { de: "die Butter", fr: "le beurre" },
    { de: "der Computer", fr: "l'ordinateur" },
    { de: "die Arbeit", fr: "le travail" },
    { de: "morgens", fr: "le matin" },
    { de: "nachmittags", fr: "l'après-midi" },
    { de: "abends", fr: "le soir" },
    { de: "nachts", fr: "la nuit" },
    { de: "früh", fr: "tôt" },
    { de: "spät", fr: "tard" },
    { de: "um … Uhr", fr: "à … heures" },
    { de: "dann", fr: "ensuite / puis" },
    { de: "danach", fr: "après cela" },
    { de: "Freunde treffen", fr: "rencontrer des amis" },
    { de: "Fernsehen schauen", fr: "regarder la télé" },
    { de: "lesen", fr: "lire" },
    { de: "ein Buch", fr: "un livre" },
  ],
  explanations: [
    { de: "aufstehen", fr: "se lever", detail: "Verbe SÉPARABLE : la particule 'auf' va à la fin (ich stehe… auf)." },
    { de: "Um 8 Uhr fahre ich…", fr: "À 8h je vais…", detail: "Quand le temps est en début de phrase, INVERSION sujet-verbe." },
    { de: "zur Arbeit", fr: "au travail", detail: "zur = zu + der (datif féminin, contraction obligatoire)." },
    { de: "am Computer", fr: "sur l'ordinateur", detail: "am = an + dem (datif neutre)." },
    { de: "ins Bett", fr: "au lit", detail: "ins = in + das (mouvement, accusatif neutre)." },
  ],
  errors: [
    { wrong: "Ich stehe um 7 Uhr", right: "Ich stehe um 7 Uhr auf", explain: "aufstehen séparable → 'auf' à la fin." },
    { wrong: "Ich frühstücke um 7 Uhr", right: "Um 7 Uhr frühstücke ich", explain: "Temps en tête → inversion sujet-verbe." },
    { wrong: "Ich fahre zu Arbeit", right: "Ich fahre zur Arbeit", explain: "zur = zu der (féminin, contraction obligatoire)." },
    { wrong: "Ich gehe zu Bett", right: "Ich gehe ins Bett", explain: "Mouvement → ins (in + das)." },
    { wrong: "Ich schaue die Fernsehen", right: "Ich schaue Fernsehen", explain: "Fernsehen sans article dans cette expression." },
  ],
  usefulPhrases: [
    { de: "Ich wache um 6 Uhr auf.", fr: "Je me réveille à 6h." },
    { de: "Ich dusche mich.", fr: "Je me douche." },
    { de: "Ich putze mir die Zähne.", fr: "Je me brosse les dents." },
    { de: "Ich gehe spazieren.", fr: "Je fais une promenade." },
    { de: "Ich schlafe um 22 Uhr ein.", fr: "Je m'endors à 22h." },
  ],
  exercises: [
    { type: "qcm", q: "'Je me lève à 7h' ?", opts: ["Ich stehe um 7 Uhr", "Ich stehe um 7 Uhr auf", "Ich aufstehe um 7 Uhr", "Ich auf um 7 Uhr stehe"], ans: 1, tip: "aufstehen séparable." },
    { type: "qcm", q: "'À 8h je vais au travail' ?", opts: ["Um 8 Uhr ich fahre zur Arbeit", "Um 8 Uhr fahre ich zur Arbeit", "Ich um 8 Uhr fahre zur Arbeit", "Fahre ich zur Arbeit um 8 Uhr"], ans: 1, tip: "Inversion sujet-verbe." },
    { type: "translate", q: "Je vais au lit à 23h.", ans: "Ich gehe um 23 Uhr ins Bett", tip: "ins Bett (mouvement)." },
    { type: "fill", q: "Ich stehe um 7 Uhr __.", ans: "auf", tip: "Particule séparable." },
    { type: "fill", q: "Ich fahre __ Arbeit.", ans: "zur", tip: "zu + der = zur." },
    { type: "correct", q: "Ich gehe zu Bett.", ans: "Ich gehe ins Bett", tip: "ins Bett." },
  ],
};

// ============= 4. HOME OFFICE =============
const T4: OralTopic = {
  id: "homeoffice",
  icon: "💻",
  number: 4,
  title: "Le télétravail",
  titleDe: "Home Office",
  intro: "Sujet d'oral fréquent : avantages et inconvénients du télétravail.",
  modelDe:
    "Meiner Meinung nach ist Home Office sehr gut. Ich arbeite gern zu Hause. Das ist sehr praktisch. Ich stehe nicht früh auf. Ich fahre nicht mit dem Bus. Das ist gut für mich. Ich habe mehr Zeit. Ich trinke Kaffee in meiner Küche. Ich arbeite am Computer in meinem Zimmer. Am Abend koche ich zu Hause. Ich bin nicht müde. Ich habe mehr Zeit für meine Familie. Aber es gibt auch ein Problem: Ich sehe meine Kollegen nicht. Das ist schade. Trotzdem ist Home Office super!",
  modelFr:
    "À mon avis, le télétravail est très bien. J'aime bien travailler à la maison. C'est très pratique. Je ne me lève pas tôt. Je ne prends pas le bus. C'est bien pour moi. J'ai plus de temps. Je bois du café dans ma cuisine. Je travaille sur l'ordinateur dans ma chambre. Le soir je cuisine à la maison. Je ne suis pas fatigué. J'ai plus de temps pour ma famille. Mais il y a aussi un problème : Je ne vois pas mes collègues. C'est dommage. Malgré tout, le télétravail est super !",
  sentences: [
    { de: "Meiner Meinung nach ist Home Office sehr gut.", fr: "À mon avis, le télétravail est très bien." },
    { de: "Ich arbeite gern zu Hause.", fr: "J'aime bien travailler à la maison." },
    { de: "Das ist sehr praktisch.", fr: "C'est très pratique." },
    { de: "Ich stehe nicht früh auf.", fr: "Je ne me lève pas tôt." },
    { de: "Ich fahre nicht mit dem Bus.", fr: "Je ne prends pas le bus." },
    { de: "Ich habe mehr Zeit.", fr: "J'ai plus de temps." },
    { de: "Ich trinke Kaffee in meiner Küche.", fr: "Je bois du café dans ma cuisine." },
    { de: "Ich arbeite am Computer in meinem Zimmer.", fr: "Je travaille sur l'ordinateur dans ma chambre." },
    { de: "Am Abend koche ich zu Hause.", fr: "Le soir je cuisine à la maison." },
    { de: "Ich bin nicht müde.", fr: "Je ne suis pas fatigué." },
    { de: "Ich habe mehr Zeit für meine Familie.", fr: "J'ai plus de temps pour ma famille." },
    { de: "Aber es gibt auch ein Problem: Ich sehe meine Kollegen nicht.", fr: "Mais il y a aussi un problème : je ne vois pas mes collègues." },
    { de: "Das ist schade.", fr: "C'est dommage." },
    { de: "Trotzdem ist Home Office super!", fr: "Malgré tout, le télétravail est super !" },
  ],
  vocabulary: [
    { de: "Home Office", fr: "le télétravail" },
    { de: "Meiner Meinung nach", fr: "à mon avis" },
    { de: "Ich denke, dass…", fr: "je pense que…" },
    { de: "Ich finde…", fr: "je trouve…" },
    { de: "praktisch", fr: "pratique" },
    { de: "bequem", fr: "confortable" },
    { de: "die Arbeit", fr: "le travail" },
    { de: "der Kollege / die Kollegin", fr: "le/la collègue" },
    { de: "die Besprechung / das Meeting", fr: "la réunion" },
    { de: "online", fr: "en ligne" },
    { de: "die E-Mail", fr: "l'e-mail" },
    { de: "der Computer", fr: "l'ordinateur" },
    { de: "die Internetverbindung", fr: "la connexion internet" },
    { de: "müde", fr: "fatigué" },
    { de: "die Zeit", fr: "le temps" },
    { de: "mehr", fr: "plus" },
    { de: "weniger", fr: "moins" },
    { de: "die Küche", fr: "la cuisine" },
    { de: "das Zimmer", fr: "la chambre" },
    { de: "der Bus", fr: "le bus" },
    { de: "das Auto", fr: "la voiture" },
    { de: "Trotzdem", fr: "malgré tout" },
    { de: "schade", fr: "dommage" },
    { de: "der Vorteil", fr: "l'avantage" },
    { de: "der Nachteil", fr: "l'inconvénient" },
    { de: "selbstständig", fr: "autonome" },
    { de: "konzentriert", fr: "concentré" },
    { de: "allein", fr: "seul" },
    { de: "schreiben", fr: "écrire" },
    { de: "telefonieren", fr: "téléphoner" },
    { de: "die Pause", fr: "la pause" },
    { de: "das Büro", fr: "le bureau" },
  ],
  explanations: [
    { de: "Meiner Meinung nach", fr: "À mon avis", detail: "Expression FIXE. Meinung = féminin, nach demande le datif → Meiner." },
    { de: "zu Hause", fr: "à la maison (position)", detail: "POSITION = zu Hause. MOUVEMENT = nach Hause (rentrer chez soi)." },
    { de: "mit dem Bus", fr: "en bus", detail: "mit + datif pour les transports (mit dem Auto, mit dem Zug…)." },
    { de: "mehr Zeit", fr: "plus de temps", detail: "mehr = comparatif de viel (beaucoup)." },
    { de: "Trotzdem ist…", fr: "Malgré tout est…", detail: "Trotzdem en début de phrase → inversion sujet-verbe." },
  ],
  errors: [
    { wrong: "Mein Meinung nach", right: "Meiner Meinung nach", explain: "Meinung féminin + nach (datif) → Meiner." },
    { wrong: "Ich arbeite nach Hause", right: "Ich arbeite zu Hause", explain: "zu Hause = position. nach Hause = mouvement." },
    { wrong: "Ich fahre nicht Bus", right: "Ich fahre nicht mit dem Bus", explain: "mit + datif obligatoire pour les transports." },
    { wrong: "Ich habe viel Zeit", right: "Ich habe mehr Zeit", explain: "Pour 'plus' = mehr (comparatif), pas viel." },
    { wrong: "Trotzdem Home Office ist super", right: "Trotzdem ist Home Office super", explain: "Trotzdem → inversion sujet-verbe." },
  ],
  usefulPhrases: [
    { de: "Ich arbeite von Montag bis Freitag.", fr: "Je travaille du lundi au vendredi." },
    { de: "Ich habe eine Besprechung um 10 Uhr.", fr: "J'ai une réunion à 10h." },
    { de: "Ich schreibe E-Mails.", fr: "J'écris des e-mails." },
    { de: "Das Meeting ist online.", fr: "La réunion est en ligne." },
    { de: "Ich habe gute Internetverbindung.", fr: "J'ai une bonne connexion internet." },
  ],
  exercises: [
    { type: "qcm", q: "'À mon avis' ?", opts: ["Mein Meinung nach", "Meiner Meinung nach", "Meine Meinung nach", "Meines Meinung nach"], ans: 1, tip: "Meinung fém + nach datif." },
    { type: "qcm", q: "'Je travaille à la maison' (position) ?", opts: ["Ich arbeite nach Hause", "Ich arbeite zu Hause", "Ich arbeite in Hause", "Ich arbeite bei Hause"], ans: 1, tip: "Position = zu Hause." },
    { type: "translate", q: "Je ne prends pas le bus.", ans: "Ich fahre nicht mit dem Bus", tip: "mit + datif." },
    { type: "translate", q: "J'ai plus de temps.", ans: "Ich habe mehr Zeit", tip: "mehr = plus." },
    { type: "fill", q: "__ Meinung nach ist das gut.", ans: "Meiner", tip: "Datif féminin." },
    { type: "correct", q: "Trotzdem Home Office ist super.", ans: "Trotzdem ist Home Office super", tip: "Inversion." },
  ],
};

// ============= 5. UN BON AMI =============
const T5: OralTopic = {
  id: "freund",
  icon: "🤝",
  number: 5,
  title: "Un bon ami",
  titleDe: "Ein guter Freund",
  intro: "Décrire les qualités d'un bon ami — sujet d'oral classique.",
  modelDe:
    "Meiner Meinung nach ist ein guter Freund sehr wichtig. Ein guter Freund hilft mir. Wenn ich ein Problem habe, ist er da. Er fragt mich: Geht es dir gut? Das ist nett. Ein guter Freund hört mir zu. Ich spreche, er hört. Er sagt nicht immer Nein. Er versteht mich. Ein guter Freund ist ehrlich. Er sagt die Wahrheit. Ein guter Freund hat Zeit für mich. Wir gehen zusammen spazieren. Wir trinken Kaffee. Wir lachen zusammen. Manchmal machen wir Fehler. Aber wir sagen Entschuldigung und alles ist wieder gut. Für mich ist ein guter Freund wie eine Familie.",
  modelFr:
    "À mon avis, un bon ami est très important. Un bon ami m'aide. Quand j'ai un problème, il est là. Il me demande : « Ça va ? » C'est gentil. Un bon ami m'écoute. Je parle, il écoute. Il ne dit pas toujours « Non ». Il me comprend. Un bon ami est honnête. Il dit la vérité. Un bon ami a du temps pour moi. Nous nous promenons ensemble. Nous buvons du café. Nous rions ensemble. Parfois nous faisons des erreurs. Mais nous disons « Excuse-moi » et tout est à nouveau bien. Pour moi, un bon ami est comme une famille.",
  sentences: [
    { de: "Ein guter Freund ist sehr wichtig.", fr: "Un bon ami est très important." },
    { de: "Ein guter Freund hilft mir.", fr: "Un bon ami m'aide." },
    { de: "Wenn ich ein Problem habe, ist er da.", fr: "Quand j'ai un problème, il est là." },
    { de: "Er fragt mich: Geht es dir gut?", fr: "Il me demande : ça va ?" },
    { de: "Ein guter Freund hört mir zu.", fr: "Un bon ami m'écoute." },
    { de: "Er versteht mich.", fr: "Il me comprend." },
    { de: "Ein guter Freund ist ehrlich.", fr: "Un bon ami est honnête." },
    { de: "Er sagt die Wahrheit.", fr: "Il dit la vérité." },
    { de: "Wir gehen zusammen spazieren.", fr: "Nous nous promenons ensemble." },
    { de: "Wir lachen zusammen.", fr: "Nous rions ensemble." },
    { de: "Manchmal machen wir Fehler.", fr: "Parfois nous faisons des erreurs." },
    { de: "Für mich ist ein guter Freund wie eine Familie.", fr: "Pour moi, un bon ami est comme une famille." },
  ],
  vocabulary: [
    { de: "der Freund / die Freundin", fr: "l'ami(e)" },
    { de: "ein guter Freund", fr: "un bon ami" },
    { de: "der beste Freund", fr: "le meilleur ami" },
    { de: "wichtig", fr: "important" },
    { de: "ehrlich", fr: "honnête" },
    { de: "treu", fr: "fidèle" },
    { de: "nett", fr: "gentil" },
    { de: "freundlich", fr: "amical" },
    { de: "lustig", fr: "drôle" },
    { de: "intelligent", fr: "intelligent" },
    { de: "geduldig", fr: "patient" },
    { de: "helfen + datif", fr: "aider qqn" },
    { de: "zuhören + datif", fr: "écouter qqn" },
    { de: "verstehen", fr: "comprendre" },
    { de: "sprechen", fr: "parler" },
    { de: "lachen", fr: "rire" },
    { de: "spazieren gehen", fr: "se promener" },
    { de: "die Wahrheit", fr: "la vérité" },
    { de: "die Lüge", fr: "le mensonge" },
    { de: "der Fehler", fr: "l'erreur" },
    { de: "Entschuldigung", fr: "Pardon / Excuse" },
    { de: "das Problem", fr: "le problème" },
    { de: "die Hilfe", fr: "l'aide" },
    { de: "zusammen", fr: "ensemble" },
    { de: "manchmal", fr: "parfois" },
    { de: "immer", fr: "toujours" },
    { de: "nie", fr: "jamais" },
    { de: "oft", fr: "souvent" },
    { de: "wie", fr: "comme (comparaison)" },
    { de: "vertrauen", fr: "faire confiance" },
    { de: "unterstützen", fr: "soutenir" },
    { de: "die Freundschaft", fr: "l'amitié" },
  ],
  explanations: [
    { de: "Er hilft mir", fr: "Il m'aide", detail: "helfen + DATIF (mir, dir, ihm, ihr, uns…)." },
    { de: "Er hört mir zu", fr: "Il m'écoute", detail: "zuhören = séparable + DATIF. 'zu' à la fin." },
    { de: "Er versteht mich", fr: "Il me comprend", detail: "verstehen + ACCUSATIF (mich, dich, ihn…)." },
    { de: "wie eine Familie", fr: "comme une famille", detail: "wie = comme (comparaison). Pas als !" },
    { de: "Manchmal machen wir…", fr: "Parfois nous faisons…", detail: "Manchmal en début → inversion sujet-verbe." },
  ],
  errors: [
    { wrong: "Er hilft mich", right: "Er hilft mir", explain: "helfen demande le datif (mir)." },
    { wrong: "Er hört mich zu", right: "Er hört mir zu", explain: "zuhören = datif + séparable." },
    { wrong: "Er sagt die wahrheit", right: "Er sagt die Wahrheit", explain: "Tous les noms prennent une majuscule en allemand." },
    { wrong: "Manchmal wir machen Fehler", right: "Manchmal machen wir Fehler", explain: "Manchmal en tête → inversion." },
    { wrong: "Er ist als eine Familie", right: "Er ist wie eine Familie", explain: "wie pour comparaison, als pour égalité après comparatif." },
  ],
  usefulPhrases: [
    { de: "Ich habe viele Freunde.", fr: "J'ai beaucoup d'amis." },
    { de: "Mein bester Freund heißt…", fr: "Mon meilleur ami s'appelle…" },
    { de: "Wir kennen uns seit 10 Jahren.", fr: "Nous nous connaissons depuis 10 ans." },
    { de: "Er wohnt in der Nähe.", fr: "Il habite à proximité." },
    { de: "Wir haben dieselben Hobbys.", fr: "Nous avons les mêmes hobbies." },
  ],
  exercises: [
    { type: "qcm", q: "'Il m'aide' ?", opts: ["Er hilft mich", "Er hilft mir", "Er hilft ich", "Er helft mich"], ans: 1, tip: "helfen + datif." },
    { type: "qcm", q: "'Il m'écoute' ?", opts: ["Er hört mich zu", "Er hört mir zu", "Er zuhört mir", "Er hört mich"], ans: 1, tip: "zuhören + datif." },
    { type: "qcm", q: "'Comme une famille' ?", opts: ["als eine Familie", "wie eine Familie", "so eine Familie", "wenn eine Familie"], ans: 1, tip: "wie = comparaison." },
    { type: "translate", q: "Un bon ami est honnête.", ans: "Ein guter Freund ist ehrlich", tip: "Adjectif fléchi guter (masc nom)." },
    { type: "translate", q: "Nous rions ensemble.", ans: "Wir lachen zusammen", tip: "zusammen = ensemble." },
    { type: "correct", q: "Er hilft mich.", ans: "Er hilft mir", tip: "Datif." },
    { type: "correct", q: "Manchmal wir machen Fehler.", ans: "Manchmal machen wir Fehler", tip: "Inversion." },
  ],
};

// ============= 6. NOURRITURE =============
const T6: OralTopic = {
  id: "essen",
  icon: "🍽️",
  number: 6,
  title: "La nourriture",
  titleDe: "Das Essen",
  intro: "Décrire ses repas et habitudes alimentaires.",
  modelDe:
    "Ich esse gern gesundes Essen. Zum Frühstück esse ich Brot mit Käse und trinke Orangensaft. Zum Mittagessen esse ich oft Reis mit Hähnchen und Salat. Ich trinke Wasser dazu. Zum Abendessen esse ich Suppe oder Nudeln. Ich koche gern. Mein Lieblingsessen ist Pizza. Ich esse nicht gern Fisch. Ich trinke keinen Alkohol. Ich trinke gern Tee mit Zucker.",
  modelFr:
    "J'aime manger sainement. Au petit-déjeuner je mange du pain avec du fromage et je bois du jus d'orange. Au déjeuner je mange souvent du riz avec du poulet et de la salade. Je bois de l'eau avec. Au dîner je mange de la soupe ou des pâtes. J'aime cuisiner. Mon plat préféré est la pizza. Je n'aime pas le poisson. Je ne bois pas d'alcool. J'aime boire du thé avec du sucre.",
  sentences: [
    { de: "Ich esse gern gesundes Essen.", fr: "J'aime manger sainement." },
    { de: "Zum Frühstück esse ich Brot mit Käse.", fr: "Au petit-déjeuner je mange du pain avec du fromage." },
    { de: "Ich trinke Orangensaft.", fr: "Je bois du jus d'orange." },
    { de: "Zum Mittagessen esse ich Reis mit Hähnchen.", fr: "Au déjeuner je mange du riz avec du poulet." },
    { de: "Ich trinke Wasser dazu.", fr: "Je bois de l'eau avec." },
    { de: "Zum Abendessen esse ich Suppe oder Nudeln.", fr: "Au dîner je mange de la soupe ou des pâtes." },
    { de: "Ich koche gern.", fr: "J'aime cuisiner." },
    { de: "Mein Lieblingsessen ist Pizza.", fr: "Mon plat préféré est la pizza." },
    { de: "Ich esse nicht gern Fisch.", fr: "Je n'aime pas le poisson." },
    { de: "Ich trinke keinen Alkohol.", fr: "Je ne bois pas d'alcool." },
  ],
  vocabulary: [
    { de: "das Essen", fr: "la nourriture" },
    { de: "das Frühstück", fr: "le petit-déjeuner" },
    { de: "das Mittagessen", fr: "le déjeuner" },
    { de: "das Abendessen", fr: "le dîner" },
    { de: "das Brot", fr: "le pain" },
    { de: "die Butter", fr: "le beurre" },
    { de: "der Käse", fr: "le fromage" },
    { de: "der Reis", fr: "le riz" },
    { de: "die Nudeln", fr: "les pâtes" },
    { de: "die Suppe", fr: "la soupe" },
    { de: "der Salat", fr: "la salade" },
    { de: "das Hähnchen", fr: "le poulet" },
    { de: "das Fleisch", fr: "la viande" },
    { de: "der Fisch", fr: "le poisson" },
    { de: "das Gemüse", fr: "les légumes" },
    { de: "das Obst", fr: "les fruits" },
    { de: "der Apfel", fr: "la pomme" },
    { de: "die Banane", fr: "la banane" },
    { de: "die Tomate", fr: "la tomate" },
    { de: "die Kartoffel", fr: "la pomme de terre" },
    { de: "das Ei", fr: "l'œuf" },
    { de: "die Milch", fr: "le lait" },
    { de: "das Wasser", fr: "l'eau" },
    { de: "der Kaffee", fr: "le café" },
    { de: "der Tee", fr: "le thé" },
    { de: "der Saft", fr: "le jus" },
    { de: "der Orangensaft", fr: "le jus d'orange" },
    { de: "der Zucker", fr: "le sucre" },
    { de: "das Salz", fr: "le sel" },
    { de: "die Pizza", fr: "la pizza" },
    { de: "Vegetarier / Vegetarierin", fr: "végétarien(ne)" },
    { de: "Hunger haben", fr: "avoir faim" },
    { de: "Durst haben", fr: "avoir soif" },
    { de: "schmecken", fr: "avoir bon goût" },
    { de: "Lieblingsessen", fr: "plat préféré" },
  ],
  explanations: [
    { de: "gesundes Essen", fr: "nourriture saine", detail: "Adjectif neutre fléchi : gesund + es." },
    { de: "Zum Frühstück", fr: "Au petit-déjeuner", detail: "zum = zu + dem (datif neutre, contraction)." },
    { de: "Ich trinke keinen Alkohol", fr: "Je ne bois pas d'alcool", detail: "kein/keinen pour nier un nom (accusatif masc → keinen)." },
    { de: "nicht gern", fr: "pas avec plaisir / ne pas aimer", detail: "Pour 'ne pas aimer' un verbe : nicht gern." },
  ],
  errors: [
    { wrong: "Ich esse gern gesund Essen", right: "Ich esse gern gesundes Essen", explain: "Adjectif avant nom neutre → terminé en -es." },
    { wrong: "Zum Frühstück ich esse Brot", right: "Zum Frühstück esse ich Brot", explain: "Inversion sujet-verbe." },
    { wrong: "Ich trinke nicht Alkohol", right: "Ich trinke keinen Alkohol", explain: "kein pour nier un nom." },
  ],
  usefulPhrases: [
    { de: "Ich bin Vegetarier.", fr: "Je suis végétarien." },
    { de: "Ich habe Hunger.", fr: "J'ai faim." },
    { de: "Ich habe Durst.", fr: "J'ai soif." },
    { de: "Das schmeckt gut!", fr: "C'est bon !" },
    { de: "Die Rechnung, bitte.", fr: "L'addition, s'il vous plaît." },
  ],
  exercises: [
    { type: "qcm", q: "'Au petit-déjeuner' ?", opts: ["Bei Frühstück", "Zum Frühstück", "An Frühstück", "In Frühstück"], ans: 1, tip: "zum = zu + dem." },
    { type: "qcm", q: "'Je ne bois pas d'alcool' ?", opts: ["Ich trinke nicht Alkohol", "Ich trinke kein Alkohol", "Ich trinke keinen Alkohol", "Ich nicht trinke Alkohol"], ans: 2, tip: "Acc masc → keinen." },
    { type: "translate", q: "J'aime cuisiner.", ans: "Ich koche gern", tip: "gern après le verbe." },
    { type: "translate", q: "J'ai faim.", ans: "Ich habe Hunger", tip: "Hunger haben." },
    { type: "fill", q: "Mein Lieblings__ ist Pizza.", ans: "essen", tip: "Lieblingsessen." },
    { type: "correct", q: "Zum Frühstück ich esse Brot.", ans: "Zum Frühstück esse ich Brot", tip: "Inversion." },
  ],
};

// ============= 7. LOISIRS =============
const T7: OralTopic = {
  id: "hobbys",
  icon: "🎨",
  number: 7,
  title: "Les loisirs",
  titleDe: "Die Hobbys",
  intro: "Parler de ce que tu aimes faire pendant ton temps libre.",
  modelDe:
    "In meiner Freizeit mache ich viele Dinge. Ich lese gern Bücher. Ich fahre gern Fahrrad. Ich schwimme im Sommer im Meer. Ich spiele Fußball mit meinen Freunden. Am Wochenende schaue ich gern Filme. Ich reise auch gern. Letztes Jahr war ich in Deutschland. Das war sehr schön. Ich habe viele Fotos gemacht. Mein Hobby ist Fotografieren. Ich habe eine gute Kamera.",
  modelFr:
    "Pendant mon temps libre, je fais beaucoup de choses. J'aime lire des livres. J'aime faire du vélo. Je nage en été dans la mer. Je joue au football avec mes amis. Le week-end j'aime regarder des films. J'aime aussi voyager. L'année dernière j'étais en Allemagne. C'était très beau. J'ai pris beaucoup de photos. Mon hobby est la photographie. J'ai un bon appareil photo.",
  sentences: [
    { de: "In meiner Freizeit mache ich viele Dinge.", fr: "Pendant mon temps libre je fais beaucoup de choses." },
    { de: "Ich lese gern Bücher.", fr: "J'aime lire des livres." },
    { de: "Ich fahre gern Fahrrad.", fr: "J'aime faire du vélo." },
    { de: "Ich schwimme im Sommer im Meer.", fr: "Je nage en été dans la mer." },
    { de: "Ich spiele Fußball mit meinen Freunden.", fr: "Je joue au football avec mes amis." },
    { de: "Am Wochenende schaue ich gern Filme.", fr: "Le week-end j'aime regarder des films." },
    { de: "Ich reise auch gern.", fr: "J'aime aussi voyager." },
    { de: "Mein Hobby ist Fotografieren.", fr: "Mon hobby est la photographie." },
  ],
  vocabulary: [
    { de: "die Freizeit", fr: "le temps libre" },
    { de: "das Hobby", fr: "le hobby" },
    { de: "lesen", fr: "lire" },
    { de: "das Buch / die Bücher", fr: "le livre / les livres" },
    { de: "Fahrrad fahren", fr: "faire du vélo" },
    { de: "schwimmen", fr: "nager" },
    { de: "joggen", fr: "courir" },
    { de: "tanzen", fr: "danser" },
    { de: "singen", fr: "chanter" },
    { de: "Fußball spielen", fr: "jouer au football" },
    { de: "Tennis spielen", fr: "jouer au tennis" },
    { de: "Gitarre spielen", fr: "jouer de la guitare" },
    { de: "Klavier spielen", fr: "jouer du piano" },
    { de: "Filme schauen", fr: "regarder des films" },
    { de: "ins Kino gehen", fr: "aller au cinéma" },
    { de: "Musik hören", fr: "écouter de la musique" },
    { de: "kochen", fr: "cuisiner" },
    { de: "fotografieren", fr: "photographier" },
    { de: "die Kamera", fr: "l'appareil photo" },
    { de: "reisen", fr: "voyager" },
    { de: "der Sport", fr: "le sport" },
    { de: "Sport machen", fr: "faire du sport" },
    { de: "im Internet surfen", fr: "surfer sur internet" },
    { de: "spielen", fr: "jouer" },
    { de: "wandern", fr: "faire de la randonnée" },
    { de: "malen", fr: "peindre / dessiner" },
    { de: "schreiben", fr: "écrire" },
    { de: "das Wochenende", fr: "le week-end" },
    { de: "im Sommer / Winter", fr: "en été / hiver" },
    { de: "das Meer", fr: "la mer" },
    { de: "der Park", fr: "le parc" },
    { de: "spazieren gehen", fr: "se promener" },
  ],
  explanations: [
    { de: "Ich spiele Fußball", fr: "Je joue au football", detail: "PAS d'article devant un sport. Pas 'den Fußball'." },
    { de: "Ich fahre Fahrrad", fr: "Je fais du vélo", detail: "Expression FIXE sans article." },
    { de: "Ich mache Fotos", fr: "Je prends des photos", detail: "En allemand on FAIT des photos (machen, pas nehmen)." },
    { de: "Am Wochenende", fr: "Le week-end", detail: "am = an + dem (contraction)." },
    { de: "im Sommer", fr: "en été", detail: "im = in + dem (datif, saisons)." },
  ],
  errors: [
    { wrong: "Ich spiele den Fußball", right: "Ich spiele Fußball", explain: "Pas d'article devant un sport." },
    { wrong: "Ich fahre das Fahrrad", right: "Ich fahre Fahrrad", explain: "Expression figée, pas d'article." },
    { wrong: "Ich nehme Fotos", right: "Ich mache Fotos", explain: "En allemand on FAIT des photos." },
  ],
  usefulPhrases: [
    { de: "Ich höre gern Musik.", fr: "J'aime écouter de la musique." },
    { de: "Ich spiele Gitarre.", fr: "Je joue de la guitare." },
    { de: "Ich gehe ins Kino.", fr: "Je vais au cinéma." },
    { de: "Ich surfe im Internet.", fr: "Je surfe sur internet." },
    { de: "Ich mache Sport.", fr: "Je fais du sport." },
  ],
  exercises: [
    { type: "qcm", q: "'Je joue au foot' ?", opts: ["Ich spiele den Fußball", "Ich spiele Fußball", "Ich spiele dem Fußball", "Ich spiele am Fußball"], ans: 1, tip: "Pas d'article." },
    { type: "qcm", q: "'Je prends des photos' ?", opts: ["Ich nehme Fotos", "Ich mache Fotos", "Ich habe Fotos", "Ich gebe Fotos"], ans: 1, tip: "machen = faire des photos." },
    { type: "translate", q: "J'aime lire.", ans: "Ich lese gern", tip: "gern après le verbe." },
    { type: "translate", q: "Le week-end je regarde des films.", ans: "Am Wochenende schaue ich Filme", tip: "Inversion." },
    { type: "fill", q: "Ich fahre __ Fahrrad.", ans: "gern", tip: "gern = avec plaisir." },
    { type: "correct", q: "Ich spiele den Tennis.", ans: "Ich spiele Tennis", tip: "Pas d'article." },
  ],
};

// ============= 8. VOYAGES =============
const T8: OralTopic = {
  id: "reisen",
  icon: "✈️",
  number: 8,
  title: "Les voyages",
  titleDe: "Die Reisen",
  intro: "Raconter un voyage passé ou un voyage rêvé.",
  modelDe:
    "Ich reise sehr gern. Letztes Jahr war ich in Deutschland. Ich bin mit dem Flugzeug geflogen. Ich habe Berlin besucht. Das Brandenburger Tor ist sehr schön. Ich habe auch München gesehen. Das Bier dort ist gut. Ich habe in einem Hotel gewohnt. Das Zimmer war klein, aber sauber. Ich habe viele Fotos gemacht. Die Leute waren freundlich. Ich spreche ein bisschen Deutsch. Das hat geholfen. Nächstes Jahr möchte ich nach Österreich fahren. Ich freue mich schon!",
  modelFr:
    "J'aime beaucoup voyager. L'année dernière j'étais en Allemagne. Je suis allé en avion. J'ai visité Berlin. La porte de Brandebourg est très belle. J'ai aussi vu Munich. La bière là-bas est bonne. J'ai séjourné dans un hôtel. La chambre était petite mais propre. J'ai pris beaucoup de photos. Les gens étaient gentils. Je parle un peu allemand. Ça a aidé. L'année prochaine je voudrais aller en Autriche. J'ai déjà hâte !",
  sentences: [
    { de: "Ich reise sehr gern.", fr: "J'aime beaucoup voyager." },
    { de: "Letztes Jahr war ich in Deutschland.", fr: "L'année dernière j'étais en Allemagne." },
    { de: "Ich bin mit dem Flugzeug geflogen.", fr: "Je suis allé en avion." },
    { de: "Ich habe Berlin besucht.", fr: "J'ai visité Berlin." },
    { de: "Ich habe in einem Hotel gewohnt.", fr: "J'ai séjourné dans un hôtel." },
    { de: "Die Leute waren freundlich.", fr: "Les gens étaient gentils." },
    { de: "Nächstes Jahr möchte ich nach Österreich fahren.", fr: "L'année prochaine je voudrais aller en Autriche." },
    { de: "Ich freue mich schon!", fr: "J'ai déjà hâte !" },
  ],
  vocabulary: [
    { de: "die Reise", fr: "le voyage" },
    { de: "der Urlaub", fr: "les vacances" },
    { de: "reisen", fr: "voyager" },
    { de: "fahren", fr: "aller (en transport)" },
    { de: "fliegen", fr: "voler / prendre l'avion" },
    { de: "das Flugzeug", fr: "l'avion" },
    { de: "der Zug", fr: "le train" },
    { de: "das Auto", fr: "la voiture" },
    { de: "das Schiff", fr: "le bateau" },
    { de: "das Hotel", fr: "l'hôtel" },
    { de: "das Zimmer", fr: "la chambre" },
    { de: "buchen", fr: "réserver" },
    { de: "besuchen", fr: "visiter" },
    { de: "sehen", fr: "voir" },
    { de: "die Stadt", fr: "la ville" },
    { de: "das Land", fr: "le pays" },
    { de: "die Hauptstadt", fr: "la capitale" },
    { de: "Deutschland", fr: "l'Allemagne" },
    { de: "Österreich", fr: "l'Autriche" },
    { de: "die Schweiz", fr: "la Suisse" },
    { de: "Berlin", fr: "Berlin" },
    { de: "München", fr: "Munich" },
    { de: "die Leute", fr: "les gens" },
    { de: "freundlich", fr: "amical" },
    { de: "schön", fr: "beau" },
    { de: "interessant", fr: "intéressant" },
    { de: "die Sehenswürdigkeit", fr: "le monument touristique" },
    { de: "das Foto / die Fotos", fr: "la photo / les photos" },
    { de: "letztes Jahr", fr: "l'année dernière" },
    { de: "nächstes Jahr", fr: "l'année prochaine" },
    { de: "möchten", fr: "vouloir (poli)" },
    { de: "sich freuen auf", fr: "avoir hâte de" },
    { de: "der Koffer", fr: "la valise" },
    { de: "der Pass", fr: "le passeport" },
  ],
  explanations: [
    { de: "Ich bin geflogen", fr: "J'ai pris l'avion (passé)", detail: "Parfait avec sein (mouvement) : sein + participe à la fin." },
    { de: "Ich habe besucht", fr: "J'ai visité", detail: "Parfait avec haben : haben + participe à la fin." },
    { de: "mit dem Flugzeug", fr: "en avion", detail: "mit + datif obligatoire pour les transports." },
    { de: "möchte fahren", fr: "voudrais aller", detail: "möchten + verbe à l'infinitif à la fin (modal)." },
    { de: "letztes Jahr", fr: "l'année dernière", detail: "Adjectif neutre fléchi : letzt + es Jahr." },
  ],
  errors: [
    { wrong: "Ich fliege mit Flugzeug", right: "Ich fliege mit dem Flugzeug", explain: "mit + datif → article obligatoire." },
    { wrong: "Ich besuche Berlin (passé)", right: "Ich habe Berlin besucht", explain: "À l'oral, on utilise le parfait pour le passé." },
    { wrong: "Ich will nach Österreich fahren", right: "Ich möchte nach Österreich fahren", explain: "möchten = plus poli que wollen." },
  ],
  usefulPhrases: [
    { de: "Ich habe eine Reise gebucht.", fr: "J'ai réservé un voyage." },
    { de: "Der Urlaub war schön.", fr: "Les vacances étaient belles." },
    { de: "Wie war dein Urlaub?", fr: "Comment étaient tes vacances ?" },
    { de: "Ich möchte ein Zimmer buchen.", fr: "Je voudrais réserver une chambre." },
    { de: "Wie viel kostet das?", fr: "Combien ça coûte ?" },
  ],
  exercises: [
    { type: "qcm", q: "'En avion' ?", opts: ["mit Flugzeug", "mit dem Flugzeug", "mit das Flugzeug", "in Flugzeug"], ans: 1, tip: "mit + datif." },
    { type: "qcm", q: "'J'ai visité Berlin' ?", opts: ["Ich besuche Berlin", "Ich habe Berlin besucht", "Ich war Berlin", "Ich besucht Berlin"], ans: 1, tip: "Parfait : haben + participe." },
    { type: "translate", q: "Je voudrais voyager en Autriche.", ans: "Ich möchte nach Österreich reisen", tip: "möchten + infinitif." },
    { type: "fill", q: "Ich bin __ dem Zug gefahren.", ans: "mit", tip: "mit pour les transports." },
    { type: "correct", q: "Ich fliege mit Flugzeug.", ans: "Ich fliege mit dem Flugzeug", tip: "Article obligatoire." },
  ],
};

// ============= 9. MAISON =============
const T9: OralTopic = {
  id: "wohnung",
  icon: "🏠",
  number: 9,
  title: "La maison / l'appartement",
  titleDe: "Das Haus / Die Wohnung",
  intro: "Décrire ton logement, les pièces, le voisinage.",
  modelDe:
    "Ich wohne in einer Wohnung in Tunis. Meine Wohnung hat drei Zimmer. Das Wohnzimmer ist groß und hell. Die Küche ist klein, aber praktisch. Das Schlafzimmer hat ein großes Bett. Das Badezimmer hat eine Dusche. Ich habe einen Balkon. Dort trinke ich morgens Kaffee. Die Miete ist nicht teuer. Ich wohne im zweiten Stock. Der Nachbar ist nett. Ich fahre mit dem Aufzug. Ich mag meine Wohnung.",
  modelFr:
    "J'habite dans un appartement à Tunis. Mon appartement a trois pièces. Le salon est grand et lumineux. La cuisine est petite mais pratique. La chambre a un grand lit. La salle de bain a une douche. J'ai un balcon. J'y bois du café le matin. Le loyer n'est pas cher. J'habite au deuxième étage. Le voisin est gentil. Je prends l'ascenseur. J'aime mon appartement.",
  sentences: [
    { de: "Ich wohne in einer Wohnung in Tunis.", fr: "J'habite dans un appartement à Tunis." },
    { de: "Meine Wohnung hat drei Zimmer.", fr: "Mon appartement a trois pièces." },
    { de: "Das Wohnzimmer ist groß und hell.", fr: "Le salon est grand et lumineux." },
    { de: "Die Küche ist klein, aber praktisch.", fr: "La cuisine est petite mais pratique." },
    { de: "Das Schlafzimmer hat ein großes Bett.", fr: "La chambre a un grand lit." },
    { de: "Ich habe einen Balkon.", fr: "J'ai un balcon." },
    { de: "Ich wohne im zweiten Stock.", fr: "J'habite au deuxième étage." },
    { de: "Der Nachbar ist nett.", fr: "Le voisin est gentil." },
  ],
  vocabulary: [
    { de: "die Wohnung", fr: "l'appartement" },
    { de: "das Haus", fr: "la maison" },
    { de: "das Zimmer", fr: "la pièce / la chambre" },
    { de: "das Wohnzimmer", fr: "le salon" },
    { de: "das Schlafzimmer", fr: "la chambre" },
    { de: "die Küche", fr: "la cuisine" },
    { de: "das Badezimmer", fr: "la salle de bain" },
    { de: "die Toilette", fr: "les toilettes" },
    { de: "der Flur", fr: "le couloir" },
    { de: "der Balkon", fr: "le balcon" },
    { de: "der Garten", fr: "le jardin" },
    { de: "die Tür", fr: "la porte" },
    { de: "das Fenster", fr: "la fenêtre" },
    { de: "das Bett", fr: "le lit" },
    { de: "der Tisch", fr: "la table" },
    { de: "der Stuhl", fr: "la chaise" },
    { de: "das Sofa", fr: "le canapé" },
    { de: "der Schrank", fr: "l'armoire" },
    { de: "der Kühlschrank", fr: "le réfrigérateur" },
    { de: "die Dusche", fr: "la douche" },
    { de: "die Badewanne", fr: "la baignoire" },
    { de: "der Stock / das Stockwerk", fr: "l'étage" },
    { de: "der Aufzug", fr: "l'ascenseur" },
    { de: "die Treppe", fr: "l'escalier" },
    { de: "der Nachbar / die Nachbarin", fr: "le voisin / la voisine" },
    { de: "die Miete", fr: "le loyer" },
    { de: "teuer", fr: "cher" },
    { de: "billig", fr: "bon marché" },
    { de: "groß / klein", fr: "grand / petit" },
    { de: "hell / dunkel", fr: "lumineux / sombre" },
    { de: "modern / alt", fr: "moderne / vieux" },
    { de: "umziehen", fr: "déménager" },
    { de: "mieten", fr: "louer" },
  ],
  explanations: [
    { de: "in einer Wohnung", fr: "dans un appartement", detail: "in + datif → einer (féminin)." },
    { de: "im zweiten Stock", fr: "au deuxième étage", detail: "Ordinaux au datif : zweit + en." },
    { de: "ein großes Bett", fr: "un grand lit", detail: "Adjectif + nom neutre : groß + es." },
    { de: "einen Balkon", fr: "un balcon", detail: "Accusatif masculin → einen." },
  ],
  errors: [
    { wrong: "Ich wohne im zweite Stock", right: "Ich wohne im zweiten Stock", explain: "Ordinal au datif : zweiten." },
    { wrong: "Ich habe ein groß Bett", right: "Ich habe ein großes Bett", explain: "Adjectif fléchi devant nom neutre." },
    { wrong: "Ich habe ein Balkon", right: "Ich habe einen Balkon", explain: "Accusatif masc → einen." },
  ],
  usefulPhrases: [
    { de: "Wo wohnst du?", fr: "Où habites-tu ?" },
    { de: "Wie ist deine Wohnung?", fr: "Comment est ton appartement ?" },
    { de: "Ich suche eine Wohnung.", fr: "Je cherche un appartement." },
    { de: "Die Wohnung hat zwei Schlafzimmer.", fr: "L'appartement a deux chambres." },
    { de: "Ich möchte umziehen.", fr: "Je voudrais déménager." },
  ],
  exercises: [
    { type: "qcm", q: "'Au deuxième étage' ?", opts: ["im zweite Stock", "im zweiten Stock", "in zweiter Stock", "am zweite Stock"], ans: 1, tip: "Ordinal datif : zweiten." },
    { type: "qcm", q: "'J'ai un balcon' ?", opts: ["Ich habe ein Balkon", "Ich habe einen Balkon", "Ich habe der Balkon", "Ich habe dem Balkon"], ans: 1, tip: "Accusatif masc → einen." },
    { type: "translate", q: "La cuisine est petite.", ans: "Die Küche ist klein", tip: "Küche = féminin." },
    { type: "translate", q: "J'ai un grand lit.", ans: "Ich habe ein großes Bett", tip: "Bett neutre, adjectif fléchi en -es." },
    { type: "fill", q: "Ich wohne in __ Wohnung.", ans: "einer", tip: "in + datif fém." },
    { type: "correct", q: "Ich habe ein groß Bett.", ans: "Ich habe ein großes Bett", tip: "Adjectif fléchi." },
  ],
};

// ============= 10. EXPRESSIONS ESSENTIELLES =============
const T10: OralTopic = {
  id: "expressions",
  icon: "💬",
  number: 10,
  title: "Expressions essentielles",
  titleDe: "Wichtige Redewendungen",
  intro: "Salutations, questions de base et politesse pour tous les jours.",
  modelDe:
    "Guten Morgen! Wie geht es Ihnen? Mir geht es gut, danke. Wie heißen Sie? Ich heiße Haithem. Woher kommen Sie? Ich komme aus Tunesien. Sprechen Sie Deutsch? Ja, ein bisschen. Wie spät ist es? Es ist zehn Uhr. Entschuldigung, wo ist die Toilette? Vielen Dank! Auf Wiedersehen!",
  modelFr:
    "Bonjour ! Comment allez-vous ? Je vais bien, merci. Comment vous appelez-vous ? Je m'appelle Haithem. D'où venez-vous ? Je viens de Tunisie. Parlez-vous allemand ? Oui, un peu. Quelle heure est-il ? Il est dix heures. Excusez-moi, où sont les toilettes ? Merci beaucoup ! Au revoir !",
  sentences: [
    { de: "Guten Morgen!", fr: "Bonjour ! (matin)" },
    { de: "Wie geht es Ihnen?", fr: "Comment allez-vous ?" },
    { de: "Mir geht es gut, danke.", fr: "Je vais bien, merci." },
    { de: "Wie heißen Sie?", fr: "Comment vous appelez-vous ?" },
    { de: "Woher kommen Sie?", fr: "D'où venez-vous ?" },
    { de: "Sprechen Sie Deutsch?", fr: "Parlez-vous allemand ?" },
    { de: "Wie spät ist es?", fr: "Quelle heure est-il ?" },
    { de: "Entschuldigung!", fr: "Excusez-moi !" },
    { de: "Vielen Dank!", fr: "Merci beaucoup !" },
    { de: "Auf Wiedersehen!", fr: "Au revoir !" },
  ],
  vocabulary: [
    { de: "Guten Morgen", fr: "Bonjour (matin)" },
    { de: "Guten Tag", fr: "Bonjour (journée)" },
    { de: "Guten Abend", fr: "Bonsoir" },
    { de: "Gute Nacht", fr: "Bonne nuit" },
    { de: "Hallo", fr: "Salut" },
    { de: "Tschüss", fr: "Salut (au revoir)" },
    { de: "Auf Wiedersehen", fr: "Au revoir (formel)" },
    { de: "Bis später", fr: "À plus tard" },
    { de: "Bis bald", fr: "À bientôt" },
    { de: "Bis morgen", fr: "À demain" },
    { de: "Bitte", fr: "S'il vous plaît / Je vous en prie" },
    { de: "Danke", fr: "Merci" },
    { de: "Danke schön", fr: "Merci beaucoup" },
    { de: "Vielen Dank", fr: "Merci beaucoup" },
    { de: "Bitte schön", fr: "Je vous en prie" },
    { de: "Entschuldigung", fr: "Excusez-moi / Pardon" },
    { de: "Es tut mir leid", fr: "Je suis désolé" },
    { de: "Kein Problem", fr: "Pas de problème" },
    { de: "Gern geschehen", fr: "Avec plaisir" },
    { de: "Ja", fr: "Oui" },
    { de: "Nein", fr: "Non" },
    { de: "Vielleicht", fr: "Peut-être" },
    { de: "Wie geht's?", fr: "Ça va ?" },
    { de: "Mir geht's gut", fr: "Je vais bien" },
    { de: "Es geht", fr: "Ça va (moyen)" },
    { de: "Wie heißt du?", fr: "Comment t'appelles-tu ?" },
    { de: "Woher kommst du?", fr: "D'où viens-tu ?" },
    { de: "Wie alt bist du?", fr: "Quel âge as-tu ?" },
    { de: "Wo wohnst du?", fr: "Où habites-tu ?" },
    { de: "Was machst du?", fr: "Que fais-tu ?" },
    { de: "Verstehst du?", fr: "Tu comprends ?" },
    { de: "Ich verstehe nicht", fr: "Je ne comprends pas" },
    { de: "Wiederholen Sie bitte", fr: "Répétez s'il vous plaît" },
    { de: "Langsamer bitte", fr: "Plus lentement s'il vous plaît" },
    { de: "Wie viel kostet das?", fr: "Combien ça coûte ?" },
  ],
  explanations: [
    { de: "Sie / du", fr: "Vous / tu", detail: "Sie (formel, S majuscule) — du (informel)." },
    { de: "Wie geht es Ihnen?", fr: "Comment allez-vous ?", detail: "Ihnen = datif de Sie (formel)." },
    { de: "Wie geht's dir?", fr: "Comment vas-tu ?", detail: "dir = datif de du (informel)." },
    { de: "Bitte", fr: "S'il vous plaît / je vous en prie", detail: "Bitte sert AUSSI à répondre 'de rien' à danke." },
  ],
  errors: [
    { wrong: "Wie geht es Sie?", right: "Wie geht es Ihnen?", explain: "Datif → Ihnen, pas Sie (nominatif)." },
    { wrong: "Mir geht gut", right: "Mir geht es gut", explain: "Ne pas oublier 'es'." },
  ],
  usefulPhrases: [
    { de: "Sprechen Sie Französisch?", fr: "Parlez-vous français ?" },
    { de: "Wo ist die Toilette?", fr: "Où sont les toilettes ?" },
    { de: "Können Sie mir helfen?", fr: "Pouvez-vous m'aider ?" },
    { de: "Ich habe eine Frage.", fr: "J'ai une question." },
    { de: "Schönes Wochenende!", fr: "Bon week-end !" },
  ],
  exercises: [
    { type: "qcm", q: "'Comment allez-vous ?' (formel)", opts: ["Wie geht es du?", "Wie geht es Ihnen?", "Wie geht es Sie?", "Wie ist es Ihnen?"], ans: 1, tip: "Datif Ihnen." },
    { type: "qcm", q: "Réponse à 'Danke' ?", opts: ["Danke", "Bitte", "Ja", "Tschüss"], ans: 1, tip: "Bitte = de rien." },
    { type: "translate", q: "Je ne comprends pas.", ans: "Ich verstehe nicht", tip: "verstehen + nicht." },
    { type: "translate", q: "Excusez-moi !", ans: "Entschuldigung", tip: "Mot unique, féminin." },
    { type: "fill", q: "__ Morgen!", ans: "Guten", tip: "Guten Morgen." },
    { type: "fill", q: "Mir __ es gut.", ans: "geht", tip: "es geht mir gut." },
  ],
};

const RAW_TOPICS: OralTopic[] = [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10];

// ============= ENRICHISSEUR AUTOMATIQUE =============
// Génère des exercices supplémentaires depuis vocab + phrases utiles + erreurs
// pour atteindre minimum 30 exercices par thème.
function enrichExercises(t: OralTopic): OralExercise[] {
  const base = [...t.exercises];
  const seen = new Set(base.map(e => `${e.type}|${e.q}`));
  const push = (ex: OralExercise) => {
    const k = `${ex.type}|${ex.q}`;
    if (!seen.has(k)) {
      seen.add(k);
      base.push(ex);
    }
  };

  // 1) Traduction FR → DE pour chaque mot du vocab
  t.vocabulary.forEach(v => {
    if (v.fr && v.de) {
      push({
        type: "translate",
        q: v.fr,
        ans: v.de,
        tip: v.ex ? `Exemple : ${v.ex}` : `Vocabulaire ${t.title}.`,
      });
    }
  });

  // 2) Traduction DE → FR pour chaque phrase utile
  t.usefulPhrases.forEach(p => {
    push({
      type: "translate",
      q: `Traduis : "${p.de}"`,
      ans: p.fr,
      tip: `Phrase clé du thème ${t.title}.`,
    });
  });

  // 3) Correction depuis chaque erreur fréquente
  t.errors.forEach(er => {
    push({
      type: "correct",
      q: `Corrige : "${er.wrong}"`,
      ans: er.right,
      tip: er.explain,
    });
  });

  // 4) QCM rapide depuis explications
  t.explanations.forEach(ex => {
    if (ex.de && ex.fr) {
      push({
        type: "qcm",
        q: `Que signifie "${ex.de}" ?`,
        opts: [ex.fr, "Je ne sais pas", "Bonjour", "Merci"].slice(0, 4),
        ans: 0,
        tip: ex.detail || "Voir l'explication grammaticale.",
      });
    }
  });

  // 5) Fill depuis sentences (premier mot caché)
  t.sentences.slice(0, 5).forEach(s => {
    const words = s.de.split(" ");
    if (words.length >= 2) {
      const first = words[0].replace(/[!.,?]/g, "");
      const masked = "__ " + words.slice(1).join(" ");
      push({
        type: "fill",
        q: masked,
        ans: first,
        tip: `Phrase modèle : ${s.fr}`,
      });
    }
  });

  return base;
}

export const ORAL_A1_TOPICS: OralTopic[] = RAW_TOPICS.map(t => ({
  ...t,
  exercises: enrichExercises(t),
}));

// ============= EXPORT POOL ENRICHISSEMENT =============
// Tous les exercices regroupés (300+ exercices) pour Pratiquer
export const ALL_ORAL_EXERCISES = ORAL_A1_TOPICS.flatMap(t =>
  t.exercises.map(ex => ({ ...ex, topicId: t.id, topicTitle: t.title }))
);

// Tout le vocabulaire regroupé (300+ mots)
export const ALL_ORAL_VOCAB = ORAL_A1_TOPICS.flatMap(t =>
  t.vocabulary.map(v => ({ ...v, topicId: t.id, topicTitle: t.title, topicIcon: t.icon }))
);
