// Leçon "Die Uhrzeit" — vocabulaire 35+, exercices 35+ générés automatiquement
import type { Lesson, Unit } from "@/data/curriculum";
import { numberToGerman } from "@/data/curriculum";
import {
  TIME_PRACTICE,
  timeToColloquialDe,
  timeToOfficialDe,
  formatDigital,
  type TimeValue,
} from "@/lib/timeGerman";

// Vocabulaire complet du temps (35+ items)
const UHRZEIT_VOCAB = [
  { de: "die Uhr", fr: "l'horloge / la montre", ex: "Die Uhr ist neu." },
  { de: "die Uhrzeit", fr: "l'heure", ex: "Wie spät ist es? Welche Uhrzeit?" },
  { de: "die Stunde", fr: "l'heure (durée)", ex: "Eine Stunde hat 60 Minuten." },
  { de: "die Minute", fr: "la minute", ex: "Warte eine Minute!" },
  { de: "die Sekunde", fr: "la seconde", ex: "Eine Minute hat 60 Sekunden." },
  { de: "der Tag", fr: "le jour", ex: "Ein Tag hat 24 Stunden." },
  { de: "die Nacht", fr: "la nuit", ex: "Gute Nacht!" },
  { de: "der Morgen", fr: "le matin", ex: "Guten Morgen!" },
  { de: "der Vormittag", fr: "la matinée", ex: "Am Vormittag arbeite ich." },
  { de: "der Mittag", fr: "midi", ex: "Wir essen am Mittag." },
  { de: "der Nachmittag", fr: "l'après-midi", ex: "Am Nachmittag schlafe ich." },
  { de: "der Abend", fr: "le soir", ex: "Am Abend lese ich." },
  { de: "die Mitternacht", fr: "minuit", ex: "Es ist Mitternacht." },
  { de: "halb", fr: "et demi", ex: "Es ist halb neun. (8h30)" },
  { de: "Viertel", fr: "quart", ex: "Viertel nach drei. (3h15)" },
  { de: "vor", fr: "avant", ex: "Viertel vor acht. (7h45)" },
  { de: "nach", fr: "après", ex: "Zehn nach sechs. (6h10)" },
  { de: "Punkt", fr: "pile", ex: "Punkt zwölf Uhr." },
  { de: "ungefähr", fr: "environ", ex: "Ungefähr drei Uhr." },
  { de: "spät", fr: "tard", ex: "Es ist schon spät." },
  { de: "früh", fr: "tôt", ex: "Ich stehe früh auf." },
  { de: "pünktlich", fr: "ponctuel", ex: "Sei pünktlich!" },
  { de: "der Wecker", fr: "le réveil", ex: "Mein Wecker klingelt um sechs." },
  { de: "der Termin", fr: "le rendez-vous", ex: "Ich habe einen Termin." },
  { de: "die Verspätung", fr: "le retard", ex: "Der Zug hat Verspätung." },
  { de: "Wie spät ist es?", fr: "Quelle heure est-il ?", ex: "— Wie spät ist es? — Es ist drei Uhr." },
  { de: "Um wie viel Uhr?", fr: "À quelle heure ?", ex: "Um wie viel Uhr beginnt der Film?" },
  { de: "um", fr: "à (heure)", ex: "Wir treffen uns um acht." },
  { de: "von ... bis", fr: "de ... à", ex: "Von neun bis fünf arbeite ich." },
  { de: "ab", fr: "à partir de", ex: "Ab zehn Uhr bin ich da." },
  { de: "gegen", fr: "vers", ex: "Gegen sieben komme ich." },
  { de: "der Zeiger", fr: "l'aiguille", ex: "Der kleine Zeiger zeigt die Stunde." },
  { de: "das Zifferblatt", fr: "le cadran", ex: "Das Zifferblatt ist rund." },
  { de: "digital", fr: "numérique", ex: "Eine digitale Uhr." },
  { de: "analog", fr: "analogique", ex: "Eine analoge Uhr hat Zeiger." },
  { de: "die Armbanduhr", fr: "la montre-bracelet", ex: "Eine schöne Armbanduhr." },
  { de: "Es ist ...", fr: "Il est ...", ex: "Es ist sieben Uhr." },
  { de: "schon", fr: "déjà", ex: "Es ist schon spät!" },
  { de: "noch", fr: "encore", ex: "Es ist noch früh." },
];

// Génère 35+ exercices à partir de TIME_PRACTICE + vocab
function generateUhrzeitExercises() {
  const exos: Lesson["exercises"] = [];

  // 1) Questions QCM "quelle heure ?" (forme officielle) — 6
  TIME_PRACTICE.slice(0, 6).forEach(t => {
    const correct = timeToOfficialDe(t);
    const wrong1 = timeToOfficialDe({ hour: (t.hour + 1) % 24, minute: t.minute });
    const wrong2 = timeToOfficialDe({ hour: t.hour, minute: (t.minute + 15) % 60 });
    const wrong3 = timeToOfficialDe({ hour: (t.hour + 2) % 24, minute: 0 });
    const opts = shuffle([correct, wrong1, wrong2, wrong3]);
    exos.push({
      type: "qcm",
      q: `Quelle est la traduction officielle de ${formatDigital(t)} ?`,
      opts,
      ans: opts.indexOf(correct),
      tip: `${formatDigital(t)} → ${correct}`,
    });
  });

  // 2) QCM forme parlée — 6
  TIME_PRACTICE.slice(6, 12).forEach(t => {
    const correct = timeToColloquialDe(t);
    const wrongT: TimeValue = { hour: t.hour, minute: (t.minute + 15) % 60 };
    const wrong1 = timeToColloquialDe(wrongT);
    const wrong2 = timeToColloquialDe({ hour: (t.hour + 1) % 24, minute: t.minute });
    const wrong3 = timeToOfficialDe(t);
    const opts = shuffle([correct, wrong1, wrong2, wrong3]);
    exos.push({
      type: "qcm",
      q: `Forme parlée pour ${formatDigital(t)} ?`,
      opts,
      ans: opts.indexOf(correct),
      tip: `${formatDigital(t)} (parlé) → ${correct}`,
    });
  });

  // 3) Fill — moitiés / quarts — 6
  const fills: Array<{ q: string; ans: string; tip: string }> = [
    { q: "8h30 = halb ___ (suivant)", ans: "neun", tip: "halb = la moitié vers l'heure suivante. 8h30 = halb neun." },
    { q: "7h45 = Viertel vor ___", ans: "acht", tip: "Viertel vor = quart avant l'heure suivante. 7h45 = vor acht." },
    { q: "3h15 = Viertel nach ___", ans: "drei", tip: "Viertel nach = un quart après l'heure." },
    { q: "12h00 (midi) = ___ Uhr", ans: "zwölf", tip: "12 = zwölf." },
    { q: "Une heure a ___ minutes (en lettres)", ans: "sechzig", tip: "60 = sechzig." },
    { q: "On dit 'Es ist Punkt fünf Uhr' = il est ___ heures", ans: "5", tip: "Punkt = pile. 5h00 pile." },
  ];
  fills.forEach(f => exos.push({ type: "fill", ...f }));

  // 4) Translate FR→DE — 6
  const translates: Array<{ q: string; ans: string; tip: string }> = [
    { q: "'Quelle heure est-il ?'", ans: "Wie spät ist es?", tip: "Forme la plus courante." },
    { q: "'Il est trois heures'", ans: "Es ist drei Uhr", tip: "Es ist + nombre + Uhr." },
    { q: "'À huit heures'", ans: "Um acht Uhr", tip: "um = à (heure précise)." },
    { q: "'Le train a du retard'", ans: "Der Zug hat Verspätung", tip: "die Verspätung = le retard." },
    { q: "'Sois ponctuel !'", ans: "Sei pünktlich!", tip: "pünktlich = ponctuel." },
    { q: "'Mon réveil sonne à six heures'", ans: "Mein Wecker klingelt um sechs", tip: "der Wecker, klingeln = sonner." },
  ];
  translates.forEach(t => exos.push({ type: "translate", ...t }));

  // 5) Speak — 6 (lire l'heure à voix haute en allemand)
  TIME_PRACTICE.slice(12, 18).forEach(t => {
    const phrase = timeToColloquialDe(t);
    exos.push({
      type: "speak",
      q: `Lisez à voix haute en allemand : ${formatDigital(t)}`,
      ans: phrase,
      tip: `Modèle : ${phrase}`,
    });
  });

  // 6) QCM vocabulaire général — 5
  exos.push(
    { type: "qcm", q: "Que signifie 'der Wecker' ?", opts: ["Le réveil", "L'horloge murale", "La montre", "Le cadran"], ans: 0, tip: "der Wecker = le réveil." },
    { type: "qcm", q: "'Mitternacht' signifie :", opts: ["Midi", "Minuit", "Le matin", "Le soir"], ans: 1, tip: "Mitter = milieu, Nacht = nuit → minuit." },
    { type: "qcm", q: "'Pünktlich' veut dire :", opts: ["En retard", "Tôt", "Ponctuel", "Tard"], ans: 2, tip: "pünktlich = à l'heure, ponctuel." },
    { type: "qcm", q: "'Um wie viel Uhr?' signifie :", opts: ["Quelle heure est-il ?", "Quand ?", "À quelle heure ?", "Combien de temps ?"], ans: 2, tip: "um wie viel Uhr = à quelle heure." },
    { type: "qcm", q: "Quel mot signifie 'environ' ?", opts: ["Punkt", "ungefähr", "pünktlich", "spät"], ans: 1, tip: "ungefähr = environ. Punkt = pile." },
  );

  return exos;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const UHRZEIT_LESSON_1: Lesson = {
  id: "uhr_l1",
  title: "Lire l'heure : officiel + parlé",
  content: `**Die Uhrzeit — l'heure en allemand**

Il existe **deux façons** de dire l'heure :

### 1️⃣ Officiel (24h, gare, école, TV)
Structure : **Es ist [heure] Uhr [minutes]**
- 07:30 → Es ist sieben Uhr dreißig
- 14:45 → Es ist vierzehn Uhr fünfundvierzig
- 20:00 → Es ist zwanzig Uhr

### 2️⃣ Parlé (12h, vie quotidienne)
On utilise **halb, Viertel, vor, nach** :
- 7:00 → Es ist sieben Uhr
- 7:15 → Viertel **nach** sieben (un quart après 7)
- 7:30 → **halb acht** ⚠️ (la moitié VERS 8 !)
- 7:45 → Viertel **vor** acht (un quart avant 8)
- 7:10 → zehn nach sieben
- 7:50 → zehn vor acht

### ⚠️ Pièges importants
- **halb neun = 8h30** (PAS 9h30 !) — moitié vers 9
- **Wie spät ist es?** = "Quelle heure est-il ?" (littéralement "comme tard")
- **Um wie viel Uhr?** = "À quelle heure ?"
- À l'heure pile : **Punkt drei Uhr** = 3h pile

### Périodes de la journée
- 00–05 : in der Nacht (la nuit)
- 05–12 : am Morgen / Vormittag (matin)
- 12–14 : am Mittag (midi)
- 14–18 : am Nachmittag (après-midi)
- 18–22 : am Abend (soir)
- 22–24 : in der Nacht`,
  vocab: UHRZEIT_VOCAB,
  exercises: generateUhrzeitExercises(),
};

const UHRZEIT_LESSON_2: Lesson = {
  id: "uhr_l2",
  title: "Rendez-vous, horaires et durées",
  content: `**Parler de ses horaires en allemand**

### Prépositions du temps
- **um** + heure → à (heure précise)
  *Wir treffen uns um acht.* (On se voit à 8h)
- **von ... bis** → de ... à
  *Von neun bis fünf arbeite ich.* (Je travaille de 9h à 17h)
- **ab** → à partir de
  *Ab Montag bin ich frei.*
- **gegen** → vers (approximatif)
  *Ich komme gegen sieben.*

### Demander un horaire
- **Wann?** → quand ?
- **Um wie viel Uhr?** → à quelle heure ?
- **Wie lange?** → combien de temps ?
- **Bis wann?** → jusqu'à quand ?

### Vocabulaire des rendez-vous
- der Termin → rendez-vous
- die Verabredung → rdv social
- die Verspätung → le retard
- pünktlich sein → être à l'heure
- zu spät kommen → arriver en retard

### Exemples de phrases utiles
- *Ich habe einen Termin um zehn Uhr.* (J'ai rdv à 10h)
- *Der Zug fährt um 8:42 Uhr ab.* (Le train part à 8h42)
- *Entschuldigung, ich bin zu spät.* (Désolé, je suis en retard)
- *Wann beginnt der Film?* (Quand commence le film ?)`,
  vocab: UHRZEIT_VOCAB,
  exercises: generateUhrzeitExercises(),
};

export const UHRZEIT_UNIT: Unit = {
  id: "uhr",
  title: "Die Uhrzeit ⏰",
  icon: "⏰",
  desc: "Lire l'heure, rendez-vous, horaires complets 24h",
  color: "#f59e0b",
  lessons: [UHRZEIT_LESSON_1, UHRZEIT_LESSON_2],
};
