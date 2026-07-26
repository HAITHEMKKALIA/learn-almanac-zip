// ====== COURS COMPLET APPROFONDI ======
// Modules organisés du contenu envoyé par l'utilisateur

export interface BilingualItem {
  de: string;
  fr: string;
  pron?: string; // prononciation phonétique
  ex?: string;   // exemple
  exFr?: string; // traduction exemple
  note?: string;
}

export interface CourseModule {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  sections: CourseSection[];
}

export interface CourseSection {
  title: string;
  intro?: string;
  items?: BilingualItem[];
  table?: { cols: string[]; rows: string[][] };
  rule?: string;
}

// MODULE 1 — VERBE SEIN (être) avec prononciation
const M1_SEIN: CourseModule = {
  id: "m1_sein",
  icon: "🔑",
  title: "Verbe SEIN (être)",
  subtitle: "Conjugaison complète + prononciation",
  sections: [
    {
      title: "Conjugaison au présent",
      items: [
        { de: "ich bin", fr: "je suis", pron: "ish bin" },
        { de: "du bist", fr: "tu es", pron: "doo bist" },
        { de: "er ist", fr: "il est", pron: "air ist" },
        { de: "sie ist", fr: "elle est", pron: "zi ist" },
        { de: "es ist", fr: "c'est", pron: "ès ist" },
        { de: "wir sind", fr: "nous sommes", pron: "vir zint" },
        { de: "ihr seid", fr: "vous êtes", pron: "eer zide" },
        { de: "sie sind", fr: "ils/elles sont", pron: "zi zint" },
        { de: "Sie sind", fr: "vous êtes (politesse)", pron: "zi zint", note: "Sie poli = toujours S majuscule" },
      ],
    },
    {
      title: "Phrases types — Se présenter",
      intro: "Dire son nom, son origine, sa profession",
      items: [
        { de: "Ich bin Haithem.", fr: "Je suis Haithem." },
        { de: "Mein Name ist Haithem.", fr: "Mon nom est Haithem." },
        { de: "Ich heiße Haithem.", fr: "Je m'appelle Haithem." },
        { de: "Ich bin aus Tunesien.", fr: "Je suis de Tunisie." },
        { de: "Ich komme aus Tunis.", fr: "Je viens de Tunis." },
        { de: "Ich wohne in Tunis.", fr: "J'habite à Tunis." },
        { de: "Ich bin Informatiker.", fr: "Je suis informaticien." },
        { de: "Ich arbeite als Informatiker.", fr: "Je travaille comme informaticien." },
      ],
    },
  ],
};

// MODULE 2 — PAYS & NATIONALITÉS
const M2_LANDER: CourseModule = {
  id: "m2_lander",
  icon: "🌍",
  title: "Pays & Nationalités",
  subtitle: "Länder und Nationalitäten",
  sections: [
    {
      title: "Pays principaux",
      items: [
        { de: "Tunesien", fr: "Tunisie", ex: "Ich bin Tunesier / Tunesierin", exFr: "Je suis tunisien / tunisienne" },
        { de: "Libyen", fr: "Libye", ex: "Ich bin Libyer / Libyerin", exFr: "Je suis libyen / libyenne" },
        { de: "Frankreich", fr: "France", ex: "Ich bin Franzose / Französin", exFr: "Je suis français / française" },
        { de: "Deutschland", fr: "Allemagne", ex: "Ich bin Deutscher / Deutsche", exFr: "Je suis allemand / allemande" },
        { de: "Marokko", fr: "Maroc", ex: "Ich bin Marokkaner / Marokkanerin", exFr: "Je suis marocain / marocaine" },
        { de: "Algerien", fr: "Algérie", ex: "Ich bin Algerier / Algerierin", exFr: "Je suis algérien / algérienne" },
        { de: "Ägypten", fr: "Égypte", ex: "Ich bin Ägypter / Ägypterin", exFr: "Je suis égyptien / égyptienne" },
        { de: "die Türkei", fr: "Turquie", ex: "Ich komme aus der Türkei.", exFr: "Je viens de Turquie." },
        { de: "Italien", fr: "Italie", ex: "Ich bin Italiener / Italienerin", exFr: "Je suis italien / italienne" },
        { de: "Spanien", fr: "Espagne", ex: "Ich bin Spanier / Spanierin", exFr: "Je suis espagnol / espagnole" },
        { de: "England", fr: "Angleterre", ex: "Ich bin Engländer / Engländerin", exFr: "Je suis anglais / anglaise" },
        { de: "die USA", fr: "États-Unis", ex: "Ich komme aus den USA.", exFr: "Je viens des États-Unis." },
      ],
    },
    {
      title: "Exemples en phrase",
      items: [
        { de: "Ich bin Tunesier.", fr: "Je suis Tunisien (homme)." },
        { de: "Sie ist Tunesierin.", fr: "Elle est Tunisienne." },
        { de: "Ich komme aus Deutschland.", fr: "Je viens d'Allemagne." },
      ],
    },
  ],
};

// MODULE 3 — VERBE HABEN (avoir)
const M3_HABEN: CourseModule = {
  id: "m3_haben",
  icon: "✋",
  title: "Verbe HABEN (avoir)",
  subtitle: "Conjugaison + exemples pratiques",
  sections: [
    {
      title: "Conjugaison au présent",
      items: [
        { de: "ich habe", fr: "j'ai", pron: "ish hah-be" },
        { de: "du hast", fr: "tu as", pron: "doo hast" },
        { de: "er/sie/es hat", fr: "il/elle a", pron: "air/zi/ès hat" },
        { de: "wir haben", fr: "nous avons", pron: "vir hah-ben" },
        { de: "ihr habt", fr: "vous avez", pron: "eer habt" },
        { de: "sie/Sie haben", fr: "ils/elles/vous avez", pron: "zi hah-ben" },
      ],
    },
    {
      title: "Exemples pratiques",
      items: [
        { de: "Ich habe einen Pass.", fr: "J'ai un passeport." },
        { de: "Du hast Zeit.", fr: "Tu as le temps." },
        { de: "Wir haben Hausaufgaben.", fr: "Nous avons des devoirs." },
        { de: "Sie hat Glück.", fr: "Elle a de la chance." },
        { de: "Ich habe einen Bruder.", fr: "J'ai un frère." },
      ],
    },
  ],
};

// MODULE 4 — W-FRAGEN (questions)
const M4_WFRAGEN: CourseModule = {
  id: "m4_wfragen",
  icon: "❓",
  title: "W-Fragen (Questions)",
  subtitle: "Tous les mots interrogatifs",
  sections: [
    {
      title: "Les 8 mots-questions",
      items: [
        { de: "Wer?", fr: "Qui ?", ex: "Wer bist du?", exFr: "Qui es-tu ?" },
        { de: "Was?", fr: "Quoi ?", ex: "Was ist das?", exFr: "Qu'est-ce que c'est ?" },
        { de: "Wo?", fr: "Où ?", ex: "Wo wohnst du?", exFr: "Où habites-tu ?" },
        { de: "Woher?", fr: "D'où ?", ex: "Woher kommst du?", exFr: "D'où viens-tu ?" },
        { de: "Wohin?", fr: "Où (direction) ?", ex: "Wohin gehst du?", exFr: "Où vas-tu ?" },
        { de: "Wann?", fr: "Quand ?", ex: "Wann kommst du?", exFr: "Quand viens-tu ?" },
        { de: "Wie?", fr: "Comment ?", ex: "Wie heißt du?", exFr: "Comment t'appelles-tu ?" },
        { de: "Warum?", fr: "Pourquoi ?", ex: "Warum lernst du Deutsch?", exFr: "Pourquoi apprends-tu l'allemand ?" },
        { de: "Wie viel?", fr: "Combien ?", ex: "Wie viel kostet das?", exFr: "Combien ça coûte ?" },
        { de: "Wie alt?", fr: "Quel âge ?", ex: "Wie alt bist du?", exFr: "Quel âge as-tu ?" },
      ],
    },
  ],
};

// MODULE 5 — PRONONCIATION
const M5_PRON: CourseModule = {
  id: "m5_pron",
  icon: "🗣️",
  title: "Astuces Prononciation",
  subtitle: "Sons spéciaux + voyelles longues/courtes",
  sections: [
    {
      title: "Sons spéciaux",
      items: [
        { de: "ch", fr: "Son 'khhh' (dur)", ex: "ich", exFr: "(se prononce 'ish')" },
        { de: "sch", fr: "Son 'ch' mou", ex: "Deutsch", exFr: "(se prononce 'doitch')" },
        { de: "ü", fr: "Son 'u' arrondi", ex: "Tür", exFr: "(porte)" },
        { de: "ö", fr: "Son 'eu' fermé", ex: "schön", exFr: "(beau)" },
        { de: "ä", fr: "Son 'è' ouvert", ex: "Mädchen", exFr: "(fille)" },
        { de: "w", fr: "Son 'v'", ex: "wo", exFr: "(se prononce 'vo')" },
        { de: "v", fr: "Son 'f'", ex: "Vater", exFr: "(père — 'fater')" },
        { de: "z", fr: "Son 'ts'", ex: "Zeit", exFr: "(temps — 'tsaït')" },
        { de: "ß", fr: "Double S (eszett)", ex: "Straße", exFr: "(rue)" },
        { de: "ei", fr: "Son 'aï'", ex: "mein", exFr: "(mon — 'maïn')" },
        { de: "ie", fr: "Son 'i' long", ex: "Liebe", exFr: "(amour — 'libe')" },
        { de: "eu / äu", fr: "Son 'oï'", ex: "neu", exFr: "(nouveau — 'noï')" },
        { de: "au", fr: "Son 'aou'", ex: "Haus", exFr: "(maison — 'haous')" },
      ],
    },
    {
      title: "Voyelles LONGUES vs COURTES",
      intro: "Règle : double voyelle (aa, ee, oo) ou suivie de h = LONGUE. Voyelle simple suivie de double consonne = COURTE.",
      items: [
        { de: "Mann (court)", fr: "homme — 'man'", note: "voyelle courte" },
        { de: "Haaren (long)", fr: "cheveux — 'haaren'", note: "double a = long" },
        { de: "Schiff (court)", fr: "bateau — 'shif'", note: "double consonne = court" },
        { de: "Sieben (long)", fr: "sept — 'zeeben'", note: "ie = toujours long" },
        { de: "Wie (long)", fr: "comment — 'vee'", note: "ie = long" },
        { de: "Bitte (court)", fr: "s'il vous plaît — 'bit-te'", note: "double t = court" },
        { de: "zehn (long)", fr: "dix — 'zeyyn'", note: "voyelle + h = long" },
        { de: "Uhr (long)", fr: "horloge — 'uur'", note: "u + h = long" },
        { de: "Turm (long)", fr: "tour — 'turm'" },
        { de: "Zug (long)", fr: "train — 'tsoug'" },
        { de: "Fluss (court)", fr: "fleuve — 'flus'" },
        { de: "Buch (court)", fr: "livre — 'boukh'" },
      ],
    },
  ],
};

// MODULE 6 — NOMBRES
const M6_ZAHLEN: CourseModule = {
  id: "m6_zahlen",
  icon: "🔢",
  title: "Les Nombres (Zahlen)",
  subtitle: "0-20 + dizaines + règle de formation",
  sections: [
    {
      title: "0 à 20 (à apprendre par cœur)",
      items: [
        { de: "null", fr: "0" }, { de: "eins", fr: "1" }, { de: "zwei", fr: "2" },
        { de: "drei", fr: "3" }, { de: "vier", fr: "4" }, { de: "fünf", fr: "5" },
        { de: "sechs", fr: "6" }, { de: "sieben", fr: "7" }, { de: "acht", fr: "8" },
        { de: "neun", fr: "9" }, { de: "zehn", fr: "10" }, { de: "elf", fr: "11" },
        { de: "zwölf", fr: "12" }, { de: "dreizehn", fr: "13" }, { de: "vierzehn", fr: "14" },
        { de: "fünfzehn", fr: "15" }, { de: "sechzehn", fr: "16" }, { de: "siebzehn", fr: "17" },
        { de: "achtzehn", fr: "18" }, { de: "neunzehn", fr: "19" }, { de: "zwanzig", fr: "20" },
      ],
    },
    {
      title: "Les dizaines (10-100)",
      items: [
        { de: "zehn", fr: "10" }, { de: "zwanzig", fr: "20" }, { de: "dreißig", fr: "30" },
        { de: "vierzig", fr: "40" }, { de: "fünfzig", fr: "50" }, { de: "sechzig", fr: "60" },
        { de: "siebzig", fr: "70" }, { de: "achtzig", fr: "80" }, { de: "neunzig", fr: "90" },
        { de: "(ein)hundert", fr: "100" },
      ],
    },
    {
      title: "⚠️ Règle 21-99 : Unité AVANT dizaine",
      intro: "En allemand on dit 'un-et-vingt' au lieu de 'vingt-et-un' !",
      items: [
        { de: "einundzwanzig", fr: "21 (1 et 20)" },
        { de: "zweiunddreißig", fr: "32 (2 et 30)" },
        { de: "fünfundvierzig", fr: "45 (5 et 40)" },
        { de: "siebenundsechzig", fr: "67 (7 et 60)" },
        { de: "neunundneunzig", fr: "99 (9 et 90)" },
      ],
    },
    {
      title: "En pratique",
      items: [
        { de: "Ich bin vierundzwanzig Jahre alt.", fr: "J'ai 24 ans." },
        { de: "Es kostet dreiunddreißig Euro.", fr: "Ça coûte 33 euros." },
        { de: "Wir sind fünfzig Leute.", fr: "Nous sommes 50 personnes." },
      ],
    },
  ],
};

// MODULE 7 — JOURS, MOIS, SAISONS
const M7_DATES: CourseModule = {
  id: "m7_dates",
  icon: "📅",
  title: "Jours, Mois & Saisons",
  subtitle: "Wochentage, Monate, Jahreszeiten",
  sections: [
    {
      title: "Les jours (Wochentage)",
      items: [
        { de: "Montag", fr: "Lundi", note: "'Mon'tag = jour de la lune" },
        { de: "Dienstag", fr: "Mardi" },
        { de: "Mittwoch", fr: "Mercredi", note: "Milieu de semaine" },
        { de: "Donnerstag", fr: "Jeudi" },
        { de: "Freitag", fr: "Vendredi" },
        { de: "Samstag", fr: "Samedi" },
        { de: "Sonntag", fr: "Dimanche", note: "Sonne = soleil" },
      ],
    },
    {
      title: "Expressions utiles",
      items: [
        { de: "Heute ist Montag.", fr: "Aujourd'hui c'est lundi." },
        { de: "Morgen ist Dienstag.", fr: "Demain c'est mardi." },
        { de: "Am Wochenende", fr: "Le week-end" },
        { de: "Unter der Woche", fr: "En semaine" },
      ],
    },
    {
      title: "Les mois (Monate)",
      items: [
        { de: "Januar", fr: "Janvier" }, { de: "Februar", fr: "Février" },
        { de: "März", fr: "Mars" }, { de: "April", fr: "Avril" },
        { de: "Mai", fr: "Mai" }, { de: "Juni", fr: "Juin" },
        { de: "Juli", fr: "Juillet" }, { de: "August", fr: "Août" },
        { de: "September", fr: "Septembre" }, { de: "Oktober", fr: "Octobre" },
        { de: "November", fr: "Novembre" }, { de: "Dezember", fr: "Décembre" },
      ],
    },
    {
      title: "Les saisons (Jahreszeiten)",
      items: [
        { de: "der Frühling", fr: "Printemps" },
        { de: "der Sommer", fr: "Été" },
        { de: "der Herbst", fr: "Automne" },
        { de: "der Winter", fr: "Hiver" },
      ],
    },
  ],
};

// MODULE 8 — FAMILLE
const M8_FAMILIE: CourseModule = {
  id: "m8_familie",
  icon: "👨‍👩‍👧‍👦",
  title: "La Famille (Familie)",
  subtitle: "Membres + phrases types",
  sections: [
    {
      title: "Membres de la famille",
      items: [
        { de: "die Familie", fr: "la famille", note: "pl: die Familien" },
        { de: "die Mutter", fr: "la mère", note: "pl: die Mütter" },
        { de: "der Vater", fr: "le père", note: "pl: die Väter" },
        { de: "die Eltern", fr: "les parents (toujours pluriel)" },
        { de: "die Schwester", fr: "la sœur", note: "pl: die Schwestern" },
        { de: "der Bruder", fr: "le frère", note: "pl: die Brüder" },
        { de: "die Geschwister", fr: "frères et sœurs (pluriel)" },
        { de: "die Tochter", fr: "la fille", note: "pl: die Töchter" },
        { de: "der Sohn", fr: "le fils", note: "pl: die Söhne" },
        { de: "das Kind", fr: "l'enfant", note: "pl: die Kinder" },
        { de: "die Frau", fr: "la femme/épouse" },
        { de: "der Mann", fr: "l'homme/mari" },
        { de: "die Oma", fr: "la grand-mère" },
        { de: "der Opa", fr: "le grand-père" },
      ],
    },
    {
      title: "Phrases utiles",
      items: [
        { de: "Ich habe zwei Geschwister.", fr: "J'ai 2 frères et sœurs." },
        { de: "Meine Mutter ist Lehrerin.", fr: "Ma mère est professeure." },
        { de: "Mein Vater arbeitet als Ingenieur.", fr: "Mon père travaille comme ingénieur." },
        { de: "Wir sind vier Personen in meiner Familie.", fr: "Nous sommes 4 dans ma famille." },
        { de: "Ich bin verheiratet.", fr: "Je suis marié(e)." },
        { de: "Ich bin ledig.", fr: "Je suis célibataire." },
      ],
    },
  ],
};

// MODULE 9 — SALUTATIONS & POLITESSE
const M9_GRUSSE: CourseModule = {
  id: "m9_grusse",
  icon: "👋",
  title: "Salutations & Politesse",
  subtitle: "Tous les mots essentiels",
  sections: [
    {
      title: "Bonjour / Bonsoir",
      items: [
        { de: "Hallo", fr: "Bonjour", note: "Informel, tous les jours" },
        { de: "Guten Morgen", fr: "Bonjour (matin)", note: "Jusqu'à ~10h" },
        { de: "Guten Tag", fr: "Bonjour", note: "Journée (formel)" },
        { de: "Guten Abend", fr: "Bonsoir", note: "À partir de ~18h" },
        { de: "Gute Nacht", fr: "Bonne nuit", note: "Au coucher" },
      ],
    },
    {
      title: "Au revoir",
      items: [
        { de: "Tschüss", fr: "Au revoir", note: "Informel" },
        { de: "Auf Wiedersehen", fr: "Au revoir", note: "Formel" },
        { de: "Bis bald", fr: "À bientôt" },
        { de: "Bis morgen", fr: "À demain" },
      ],
    },
    {
      title: "Politesse",
      items: [
        { de: "Bitte", fr: "S'il vous plaît / Je vous en prie", note: "Double sens !" },
        { de: "Danke", fr: "Merci" },
        { de: "Danke schön", fr: "Merci beaucoup" },
        { de: "Entschuldigung", fr: "Excusez-moi" },
        { de: "Es tut mir leid", fr: "Je suis désolé" },
      ],
    },
    {
      title: "Questions essentielles",
      items: [
        { de: "Wie geht's?", fr: "Ça va ?" },
        { de: "Mir geht's gut.", fr: "Ça va bien." },
        { de: "Mir geht's nicht so gut.", fr: "Ça va pas très bien." },
        { de: "Und dir?", fr: "Et toi ?" },
        { de: "Sprechen Sie Englisch?", fr: "Parlez-vous anglais ?" },
        { de: "Ich verstehe nicht.", fr: "Je ne comprends pas." },
        { de: "Können Sie das wiederholen?", fr: "Pouvez-vous répéter ?" },
        { de: "Wie sagt man das auf Deutsch?", fr: "Comment dit-on ça en allemand ?" },
      ],
    },
  ],
};

// MODULE 10 — BILDGESCHICHTE (vocabulaire de l'histoire en images)
const M10_BILD: CourseModule = {
  id: "m10_bild",
  icon: "📖",
  title: "Bildgeschichte — Histoire",
  subtitle: "Vocabulaire de l'histoire (vélo, bus, métro)",
  sections: [
    {
      title: "Lieux & transports",
      items: [
        { de: "die Bildgeschichte", fr: "l'histoire en images" },
        { de: "das Bild", fr: "l'image / la photo" },
        { de: "die Geschichte", fr: "l'histoire" },
        { de: "der Bus", fr: "le bus" },
        { de: "das Fahrrad", fr: "le vélo" },
        { de: "die U-Bahn", fr: "le métro" },
        { de: "zu Fuß gehen", fr: "aller à pied" },
        { de: "die Reifen", fr: "les pneus" },
        { de: "die Fahrkarte", fr: "le ticket" },
      ],
    },
    {
      title: "Verbes & adjectifs de l'histoire",
      items: [
        { de: "kaputt", fr: "cassé / en panne", ex: "Das Fahrrad ist kaputt.", exFr: "Le vélo est cassé." },
        { de: "verpassen", fr: "rater / manquer", ex: "Sie hat den Bus verpasst.", exFr: "Elle a raté le bus." },
        { de: "losfahren", fr: "partir (véhicule)", ex: "Der Bus ist losgefahren.", exFr: "Le bus est parti." },
        { de: "kaufen", fr: "acheter", ex: "Sie hat keine Fahrkarte gekauft.", exFr: "Elle n'a pas acheté de ticket." },
        { de: "funktionieren", fr: "fonctionner", ex: "Das funktioniert nicht.", exFr: "Ça ne fonctionne pas." },
        { de: "die Verspätung", fr: "le retard", ex: "Sie hat Verspätung.", exFr: "Elle est en retard." },
        { de: "spät", fr: "tard" },
        { de: "das Glück", fr: "la chance", ex: "Sie hat Glück.", exFr: "Elle a de la chance. 🍀" },
        { de: "merken", fr: "remarquer / s'apercevoir", ex: "Sie hat gemerkt, dass...", exFr: "Elle a remarqué que..." },
        { de: "schade", fr: "dommage" },
        { de: "lustig", fr: "drôle / marrant" },
        { de: "leider", fr: "malheureusement" },
        { de: "deswegen", fr: "c'est pourquoi" },
      ],
    },
    {
      title: "Articles : ein / der (cours du prof)",
      intro: "ein/eine = un/une (général). der/die/das = le/la (spécifique).",
      items: [
        { de: "ein Hafen", fr: "un port (n'importe lequel)" },
        { de: "der Hafen", fr: "LE port (celui qu'on connaît)" },
        { de: "eine Straße", fr: "une rue" },
        { de: "die Straße", fr: "LA rue" },
        { de: "ein Turm", fr: "une tour", note: "♂️ masculin — pas 'eine' !" },
        { de: "ein Hotel", fr: "un hôtel", note: "⚪ neutre — pas 'eine' !" },
        { de: "der Kaffee", fr: "le café", note: "♂️" },
        { de: "die Kirche", fr: "l'église", note: "♀️" },
        { de: "das Kino", fr: "le cinéma", note: "⚪ neutre" },
      ],
    },
  ],
};

// MODULE 11 — MÉTIERS (Berufe)
const M11_BERUFE: CourseModule = {
  id: "m11_berufe",
  icon: "💼",
  title: "Les Métiers (Berufe)",
  subtitle: "Métiers + comment poser la question",
  sections: [
    {
      title: "Métiers communs (m / f)",
      items: [
        { de: "der Lehrer / die Lehrerin", fr: "professeur(e)" },
        { de: "der Arzt / die Ärztin", fr: "médecin" },
        { de: "der Ingenieur / die Ingenieurin", fr: "ingénieur(e)" },
        { de: "der Koch / die Köchin", fr: "cuisinier / cuisinière" },
        { de: "der Verkäufer / die Verkäuferin", fr: "vendeur / vendeuse" },
        { de: "der Student / die Studentin", fr: "étudiant(e)" },
        { de: "der Arbeiter / die Arbeiterin", fr: "ouvrier / ouvrière" },
        { de: "der Manager / die Managerin", fr: "manager" },
        { de: "der Informatiker / die Informatikerin", fr: "informaticien(ne)" },
      ],
    },
    {
      title: "Poser la question",
      items: [
        { de: "Was machst du beruflich?", fr: "Que fais-tu comme métier ?" },
        { de: "Was bist du von Beruf?", fr: "Quelle est ta profession ?" },
        { de: "Ich bin Informatiker.", fr: "Je suis informaticien." },
        { de: "Ich arbeite als Lehrer.", fr: "Je travaille comme professeur." },
        { de: "Ich bin Student.", fr: "Je suis étudiant." },
      ],
    },
    {
      title: "Situation familiale",
      items: [
        { de: "ledig", fr: "célibataire" },
        { de: "verheiratet", fr: "marié(e)" },
        { de: "geschieden", fr: "divorcé(e)" },
        { de: "verwitwet", fr: "veuf / veuve" },
      ],
    },
  ],
};

// MODULE 12 — L'HEURE (Die Uhrzeit)
const M12_UHRZEIT: CourseModule = {
  id: "m12_uhrzeit",
  icon: "🕐",
  title: "L'Heure (Die Uhrzeit)",
  subtitle: "Demander et dire l'heure",
  sections: [
    {
      title: "Demander l'heure",
      items: [
        { de: "Wie spät ist es?", fr: "Quelle heure est-il ?" },
        { de: "Wie viel Uhr ist es?", fr: "Il est quelle heure ?" },
        { de: "Kannst du mir sagen, wie spät es ist?", fr: "Peux-tu me dire l'heure ?" },
      ],
    },
    {
      title: "Heures officielles (24h)",
      items: [
        { de: "Es ist ein Uhr.", fr: "Il est 1h00." },
        { de: "Es ist fünfzehn Uhr.", fr: "Il est 15h00." },
        { de: "Es ist achtzehn Uhr dreißig.", fr: "Il est 18h30." },
      ],
    },
    {
      title: "⚠️ Demi-heures (halb)",
      intro: "ATTENTION : 'halb drei' = 2h30 (une demi-heure AVANT 3h !)",
      items: [
        { de: "Es ist halb drei.", fr: "Il est 2h30 (et demie)." },
        { de: "Es ist halb vier.", fr: "Il est 3h30." },
        { de: "Es ist halb neun.", fr: "Il est 8h30." },
      ],
    },
    {
      title: "Quarts (Viertel) & Minutes",
      items: [
        { de: "Es ist Viertel nach zwei.", fr: "Il est 2h15." },
        { de: "Es ist Viertel vor drei.", fr: "Il est 2h45 (3h moins le quart)." },
        { de: "Es ist fünf nach drei.", fr: "Il est 3h05." },
        { de: "Es ist zehn nach drei.", fr: "Il est 3h10." },
        { de: "Es ist zwanzig vor vier.", fr: "Il est 3h40 (4h moins 20)." },
      ],
    },
    {
      title: "Moments de la journée",
      items: [
        { de: "am Morgen / morgens", fr: "le matin" },
        { de: "am Vormittag", fr: "la matinée" },
        { de: "am Mittag / mittags", fr: "à midi / le midi" },
        { de: "am Nachmittag / nachmittags", fr: "l'après-midi" },
        { de: "am Abend / abends", fr: "le soir" },
        { de: "in der Nacht / nachts", fr: "la nuit" },
        { de: "um Mitternacht", fr: "à minuit" },
      ],
    },
    {
      title: "Phrases pratiques",
      items: [
        { de: "Der Zug fährt um acht Uhr fünfzehn.", fr: "Le train part à 8h15." },
        { de: "Ich stehe um sieben Uhr auf.", fr: "Je me lève à 7h00." },
        { de: "Wir treffen uns um halb neun.", fr: "On se retrouve à 8h30." },
      ],
    },
  ],
};

// MODULE 13 — NOURRITURE (Essen & Trinken)
const M13_ESSEN: CourseModule = {
  id: "m13_essen",
  icon: "🍽️",
  title: "Nourriture (Essen & Trinken)",
  subtitle: "Restaurant, boissons, aliments",
  sections: [
    {
      title: "Au restaurant (Im Restaurant)",
      items: [
        { de: "die Speisekarte", fr: "le menu / la carte" },
        { de: "die Rechnung", fr: "l'addition" },
        { de: "der Tisch", fr: "la table" },
        { de: "der Kellner / die Kellnerin", fr: "le serveur / la serveuse" },
        { de: "Ich hätte gern...", fr: "Je voudrais..." },
        { de: "Die Rechnung, bitte.", fr: "L'addition, s'il vous plaît." },
        { de: "Zum Mitnehmen, bitte.", fr: "À emporter, s'il vous plaît." },
        { de: "Ist der Tisch frei?", fr: "La table est-elle libre ?" },
      ],
    },
    {
      title: "Boissons (Getränke)",
      items: [
        { de: "das Wasser", fr: "l'eau" },
        { de: "das Mineralwasser", fr: "l'eau minérale" },
        { de: "der Kaffee", fr: "le café" },
        { de: "der Tee", fr: "le thé" },
        { de: "der Orangensaft", fr: "le jus d'orange" },
        { de: "der Apfelsaft", fr: "le jus de pomme" },
        { de: "die Milch", fr: "le lait" },
        { de: "das Bier", fr: "la bière" },
        { de: "der Wein", fr: "le vin" },
        { de: "die Cola", fr: "le coca" },
      ],
    },
    {
      title: "Aliments de base",
      items: [
        { de: "das Brot", fr: "le pain" },
        { de: "die Butter", fr: "le beurre" },
        { de: "der Käse", fr: "le fromage" },
        { de: "das Ei", fr: "l'œuf" },
        { de: "das Fleisch", fr: "la viande" },
        { de: "das Hähnchen", fr: "le poulet" },
        { de: "das Rindfleisch", fr: "le bœuf" },
        { de: "das Schweinefleisch", fr: "le porc" },
        { de: "der Fisch", fr: "le poisson" },
        { de: "der Reis", fr: "le riz" },
        { de: "die Nudeln", fr: "les pâtes" },
        { de: "die Kartoffel", fr: "la pomme de terre" },
        { de: "der Salat", fr: "la salade" },
        { de: "die Suppe", fr: "la soupe" },
      ],
    },
    {
      title: "Fruits & Légumes",
      items: [
        { de: "der Apfel", fr: "la pomme" },
        { de: "die Banane", fr: "la banane" },
        { de: "die Orange", fr: "l'orange" },
        { de: "die Traube", fr: "le raisin" },
        { de: "die Erdbeere", fr: "la fraise" },
        { de: "die Tomate", fr: "la tomate" },
        { de: "die Zwiebel", fr: "l'oignon" },
        { de: "der Knoblauch", fr: "l'ail" },
        { de: "die Karotte", fr: "la carotte" },
      ],
    },
    {
      title: "Faire les courses",
      items: [
        { de: "der Supermarkt", fr: "le supermarché" },
        { de: "der Markt", fr: "le marché" },
        { de: "der Bäcker", fr: "le boulanger" },
        { de: "der Metzger", fr: "le boucher" },
        { de: "Ich möchte ... kaufen.", fr: "Je voudrais acheter..." },
        { de: "Haben Sie ...?", fr: "Avez-vous ... ?" },
        { de: "Wie viel kostet das?", fr: "Combien ça coûte ?" },
        { de: "Das macht ... Euro.", fr: "Ça fait ... euros." },
      ],
    },
    {
      title: "Expressions utiles",
      items: [
        { de: "Ich bin hungrig.", fr: "J'ai faim." },
        { de: "Ich bin durstig.", fr: "J'ai soif." },
        { de: "Das schmeckt gut!", fr: "C'est bon !" },
        { de: "Guten Appetit!", fr: "Bon appétit !" },
        { de: "Prost! / Zum Wohl!", fr: "Santé !" },
      ],
    },
  ],
};

// MODULE 14 — DIRECTIONS (Wegbeschreibung)
const M14_WEG: CourseModule = {
  id: "m14_weg",
  icon: "🧭",
  title: "Directions (Wegbeschreibung)",
  subtitle: "Demander et donner son chemin",
  sections: [
    {
      title: "Points cardinaux",
      items: [
        { de: "Norden", fr: "Nord" },
        { de: "Süden", fr: "Sud" },
        { de: "Osten", fr: "Est" },
        { de: "Westen", fr: "Ouest" },
      ],
    },
    {
      title: "Directions de base",
      items: [
        { de: "geradeaus", fr: "tout droit" },
        { de: "links", fr: "à gauche" },
        { de: "rechts", fr: "à droite" },
        { de: "hier", fr: "ici" },
        { de: "dort", fr: "là-bas" },
        { de: "draußen", fr: "dehors" },
        { de: "drinnen", fr: "dedans" },
        { de: "oben", fr: "en haut" },
        { de: "unten", fr: "en bas" },
      ],
    },
    {
      title: "Demander son chemin",
      items: [
        { de: "Entschuldigung, wo ist ...?", fr: "Excusez-moi, où est ... ?" },
        { de: "Wie komme ich zu ...?", fr: "Comment vais-je à ... ?" },
        { de: "Wo ist die nächste ...?", fr: "Où est le/la ... le plus proche ?" },
        { de: "Ist es weit?", fr: "Est-ce que c'est loin ?" },
        { de: "Ist es in der Nähe?", fr: "Est-ce que c'est près ?" },
        { de: "Können Sie mir helfen?", fr: "Pouvez-vous m'aider ?" },
      ],
    },
    {
      title: "Donner des directions",
      items: [
        { de: "Gehen Sie geradeaus.", fr: "Allez tout droit." },
        { de: "Biegen Sie links ab.", fr: "Tournez à gauche." },
        { de: "Biegen Sie rechts ab.", fr: "Tournez à droite." },
        { de: "An der Ampel ...", fr: "Au feu ..." },
        { de: "An der Kreuzung ...", fr: "Au carrefour ..." },
        { de: "Es ist gleich hier.", fr: "C'est juste ici." },
        { de: "Es ist auf der linken Seite.", fr: "C'est sur le côté gauche." },
        { de: "Es ist auf der rechten Seite.", fr: "C'est sur le côté droit." },
        { de: "Gegenüber von ...", fr: "En face de ..." },
        { de: "Neben ...", fr: "À côté de ..." },
        { de: "Zwischen ... und ...", fr: "Entre ... et ..." },
      ],
    },
    {
      title: "Lieux importants",
      items: [
        { de: "der Bahnhof", fr: "la gare" },
        { de: "der Flughafen", fr: "l'aéroport" },
        { de: "das Krankenhaus", fr: "l'hôpital" },
        { de: "die Polizei", fr: "la police" },
        { de: "die Apotheke", fr: "la pharmacie" },
        { de: "die Bank", fr: "la banque" },
        { de: "das Hotel", fr: "l'hôtel" },
        { de: "das Restaurant", fr: "le restaurant" },
        { de: "die Toilette", fr: "les toilettes" },
        { de: "der Parkplatz", fr: "le parking" },
        { de: "die Bushaltestelle", fr: "l'arrêt de bus" },
      ],
    },
  ],
};

// MODULE 15 — SHOPPING (Einkaufen)
const M15_SHOPPING: CourseModule = {
  id: "m15_shopping",
  icon: "🛒",
  title: "Shopping (Einkaufen)",
  subtitle: "Magasins, tailles, couleurs, vêtements",
  sections: [
    {
      title: "Au magasin",
      items: [
        { de: "der Laden / das Geschäft", fr: "le magasin" },
        { de: "das Kaufhaus", fr: "le grand magasin" },
        { de: "der Einkaufswagen", fr: "le caddie" },
        { de: "der Einkaufskorb", fr: "le panier" },
        { de: "die Kasse", fr: "la caisse" },
        { de: "die Quittung", fr: "le reçu" },
        { de: "bar zahlen", fr: "payer en espèces" },
        { de: "mit Karte zahlen", fr: "payer par carte" },
      ],
    },
    {
      title: "Tailles & mesures",
      items: [
        { de: "die Größe", fr: "la taille" },
        { de: "die Schuhgröße", fr: "la pointure" },
        { de: "klein", fr: "petit" },
        { de: "groß", fr: "grand" },
        { de: "eng", fr: "serré" },
        { de: "weit / locker", fr: "large" },
        { de: "kurz", fr: "court" },
        { de: "lang", fr: "long" },
      ],
    },
    {
      title: "Couleurs (Farben)",
      items: [
        { de: "weiß", fr: "blanc" },
        { de: "schwarz", fr: "noir" },
        { de: "rot", fr: "rouge" },
        { de: "blau", fr: "bleu" },
        { de: "grün", fr: "vert" },
        { de: "gelb", fr: "jaune" },
        { de: "braun", fr: "marron" },
        { de: "grau", fr: "gris" },
        { de: "orange", fr: "orange" },
        { de: "rosa / pink", fr: "rose" },
        { de: "lila / violett", fr: "violet" },
      ],
    },
    {
      title: "Vêtements (Kleidung)",
      items: [
        { de: "das Hemd", fr: "la chemise" },
        { de: "die Bluse", fr: "le chemisier" },
        { de: "das T-Shirt", fr: "le T-shirt" },
        { de: "die Hose", fr: "le pantalon" },
        { de: "der Rock", fr: "la jupe" },
        { de: "das Kleid", fr: "la robe" },
        { de: "der Anzug", fr: "le costume" },
        { de: "die Jacke", fr: "la veste" },
        { de: "der Mantel", fr: "le manteau" },
        { de: "der Pullover", fr: "le pull" },
        { de: "die Schuhe", fr: "les chaussures" },
        { de: "der Hut", fr: "le chapeau" },
        { de: "die Mütze", fr: "le bonnet" },
        { de: "der Schal", fr: "l'écharpe" },
        { de: "die Handschuhe", fr: "les gants" },
      ],
    },
    {
      title: "Expressions utiles",
      items: [
        { de: "Ich suche ...", fr: "Je cherche ..." },
        { de: "Haben Sie das in Größe ...?", fr: "Avez-vous ça en taille ... ?" },
        { de: "Kann ich das anprobieren?", fr: "Est-ce que je peux essayer ?" },
        { de: "Wo ist die Umkleidekabine?", fr: "Où sont les cabines d'essayage ?" },
        { de: "Das ist zu teuer.", fr: "C'est trop cher." },
        { de: "Gibt es Rabatt?", fr: "Y a-t-il une réduction ?" },
        { de: "Ich nehme es.", fr: "Je le prends." },
        { de: "Ich möchte es zurückgeben.", fr: "Je voudrais le retourner." },
      ],
    },
  ],
};

// MODULE 16 — MÉTÉO (Das Wetter)
const M16_WETTER: CourseModule = {
  id: "m16_wetter",
  icon: "🌤️",
  title: "La Météo (Das Wetter)",
  subtitle: "Conditions, températures, saisons",
  sections: [
    {
      title: "Demander la météo",
      items: [
        { de: "Wie ist das Wetter heute?", fr: "Quel temps fait-il aujourd'hui ?" },
        { de: "Wie wird das Wetter morgen?", fr: "Quel temps fera-t-il demain ?" },
        { de: "Ist es kalt / warm?", fr: "Est-ce qu'il fait froid / chaud ?" },
      ],
    },
    {
      title: "Conditions météo",
      items: [
        { de: "die Sonne", fr: "le soleil" },
        { de: "sonnig", fr: "ensoleillé" },
        { de: "die Wolke", fr: "le nuage" },
        { de: "wolkig / bewölkt", fr: "nuageux" },
        { de: "der Regen", fr: "la pluie" },
        { de: "es regnet", fr: "il pleut" },
        { de: "der Schnee", fr: "la neige" },
        { de: "es schneit", fr: "il neige" },
        { de: "der Wind", fr: "le vent" },
        { de: "windig", fr: "venteux" },
        { de: "der Nebel", fr: "le brouillard" },
        { de: "neblig", fr: "brumeux" },
        { de: "der Sturm", fr: "l'orage / la tempête" },
        { de: "es gewittert", fr: "il y a de l'orage" },
      ],
    },
    {
      title: "Températures",
      items: [
        { de: "heiß", fr: "très chaud" },
        { de: "warm", fr: "chaud / doux" },
        { de: "mild", fr: "doux" },
        { de: "kühl", fr: "frais" },
        { de: "kalt", fr: "froid" },
        { de: "eiskalt", fr: "glacial" },
        { de: "die Temperatur", fr: "la température" },
        { de: "Grad Celsius", fr: "degrés Celsius" },
      ],
    },
    {
      title: "Phrases météo",
      items: [
        { de: "Es ist sonnig.", fr: "Il fait soleil." },
        { de: "Es regnet.", fr: "Il pleut." },
        { de: "Es schneit.", fr: "Il neige." },
        { de: "Es ist bewölkt.", fr: "Il est nuageux." },
        { de: "Es ist windig.", fr: "Il fait du vent." },
        { de: "Es ist 20 Grad warm.", fr: "Il fait 20 degrés." },
        { de: "Es ist unter null.", fr: "Il est sous zéro." },
      ],
    },
    {
      title: "Saisons & météo",
      items: [
        { de: "Im Frühling wird es wärmer.", fr: "Au printemps, il fait plus chaud." },
        { de: "Im Sommer ist es sehr heiß.", fr: "En été, il fait très chaud." },
        { de: "Im Herbst regnet es oft.", fr: "En automne, il pleut souvent." },
        { de: "Im Winter schneit es.", fr: "En hiver, il neige." },
      ],
    },
  ],
};

// MODULE 17 — LEXIQUE A-Z
const M17_LEXIQUE: CourseModule = {
  id: "m17_lexique",
  icon: "📚",
  title: "Lexique rapide A-Z",
  subtitle: "Petits mots essentiels du quotidien",
  sections: [
    {
      title: "Mots de liaison & adverbes essentiels",
      items: [
        { de: "auch", fr: "aussi" },
        { de: "bald", fr: "bientôt" },
        { de: "bitte", fr: "s'il vous plaît" },
        { de: "da", fr: "là" },
        { de: "dann", fr: "alors" },
        { de: "dort", fr: "là-bas" },
        { de: "für", fr: "pour" },
        { de: "gern", fr: "volontiers" },
        { de: "gut", fr: "bien" },
        { de: "hier", fr: "ici" },
        { de: "immer", fr: "toujours" },
        { de: "ja", fr: "oui" },
        { de: "jetzt", fr: "maintenant" },
        { de: "mit", fr: "avec" },
        { de: "nein", fr: "non" },
        { de: "nicht", fr: "ne ... pas" },
        { de: "nur", fr: "seulement" },
        { de: "oder", fr: "ou" },
        { de: "oft", fr: "souvent" },
        { de: "sehr", fr: "très" },
        { de: "und", fr: "et" },
        { de: "viel", fr: "beaucoup" },
        { de: "von", fr: "de" },
        { de: "vor", fr: "avant" },
        { de: "wann", fr: "quand" },
        { de: "warum", fr: "pourquoi" },
        { de: "was", fr: "quoi" },
        { de: "wer", fr: "qui" },
        { de: "wie", fr: "comment" },
        { de: "wo", fr: "où" },
      ],
    },
  ],
};

// MODULE 18 — PLURIELS (Stadt & Transport)
const M18_PLURIELS: CourseModule = {
  id: "m18_pluriels",
  icon: "🔢",
  title: "Pluriels — Noms communs",
  subtitle: "Règles +n, +en, +e, +er, +s, Umlaut",
  sections: [
    {
      title: "🏛️ Monuments & lieux de la ville",
      items: [
        { de: "die Kirche → die Kirchen", fr: "l'église → les églises", note: "+n" },
        { de: "der Hafen → die Häfen", fr: "le port → les ports", note: "Umlaut a→ä + e (ici déjà -en)" },
        { de: "das Konzerthaus → die Konzerthäuser", fr: "la salle de concert → ...", note: "Umlaut + er" },
        { de: "der Bahnhof → die Bahnhöfe", fr: "la gare → les gares", note: "Umlaut o→ö + e" },
        { de: "der Markt → die Märkte", fr: "le marché → les marchés", note: "Umlaut + e" },
        { de: "das Hotel → die Hotels", fr: "l'hôtel → les hôtels", note: "+s" },
        { de: "die Straße → die Straßen", fr: "la rue → les rues", note: "+n" },
        { de: "der Weg → die Wege", fr: "le chemin → les chemins", note: "+e" },
        { de: "die Ampel → die Ampeln", fr: "le feu → les feux", note: "+n" },
        { de: "das Rathaus → die Rathäuser", fr: "la mairie → les mairies", note: "Umlaut + er" },
      ],
    },
    {
      title: "🚲 Moyens de transport",
      items: [
        { de: "das Fahrrad → die Fahrräder", fr: "le vélo → les vélos", note: "Umlaut a→ä + er" },
        { de: "der Bus → die Busse", fr: "le bus → les bus", note: "+se (double s)" },
        { de: "das Auto → die Autos", fr: "la voiture → les voitures", note: "+s" },
        { de: "der Fluss → die Flüsse", fr: "le fleuve → les fleuves", note: "Umlaut u→ü + e" },
        { de: "der Zug → die Züge", fr: "le train → les trains", note: "Umlaut u→ü + e" },
        { de: "das Schiff → die Schiffe", fr: "le bateau → les bateaux", note: "+e" },
      ],
    },
    {
      title: "👥 Personnes",
      items: [
        { de: "der Mensch → die Menschen", fr: "la personne → les personnes", note: "+en" },
        { de: "der Student → die Studenten", fr: "l'étudiant → les étudiants", note: "+en" },
        { de: "der Besucher → die Besucher", fr: "le visiteur → les visiteurs", note: "pas de changement" },
        { de: "die Stadt → die Städte", fr: "la ville → les villes", note: "Umlaut + e" },
        { de: "das Land → die Länder", fr: "le pays → les pays", note: "Umlaut + er" },
      ],
    },
    {
      title: "💡 Règles d'or à retenir",
      rule: "Pas de règle fixe : il FAUT apprendre chaque pluriel.\n• -heit, -keit, -ung → die (féminin)\n• -er, -el → der (masculin)\n• Mots composés : pluriel sur le 2e nom (Rathaus → Rathäuser)\n• Umlaut fréquent : a→ä, o→ö, u→ü",
    },
  ],
};

// MODULE 19 — ARTICLES INDÉFINIS vs DÉFINIS
const M19_ARTICLES: CourseModule = {
  id: "m19_articles",
  icon: "📌",
  title: "Articles ein/eine vs der/die/das",
  subtitle: "Indéfini (un/une) vs défini (le/la)",
  sections: [
    {
      title: "🎯 Règle d'or",
      rule: "INDÉFINI au pluriel n'existe PAS !\n❌ \"eine Schiffe\" → ✅ \"Das sind Schiffe\"\n❌ \"eine Türme\" → ✅ \"Die Türme sind hoch\"",
    },
    {
      title: "Tableau récapitulatif",
      table: {
        cols: ["Genre", "Défini", "Indéfini", "Exemple"],
        rows: [
          ["♂️ Masc.", "der", "ein", "der/ein Film"],
          ["♀️ Fém.", "die", "eine", "die/eine Freundin"],
          ["⚪ Neutre", "das", "ein", "das/ein Hotel"],
          ["🔢 Pluriel", "die", "— (rien!)", "die Schiffe"],
        ],
      },
    },
    {
      title: "Phrases d'exemple",
      items: [
        { de: "Das ist ein Schiff.", fr: "C'est un bateau.", note: "Singulier → ein" },
        { de: "Das Schiff heißt Maria.", fr: "Le bateau s'appelle Maria.", note: "Défini → das" },
        { de: "Bremen ist eine Stadt.", fr: "Brême est une ville.", note: "Singulier fém → eine" },
        { de: "Die Stadt ist sehr interessant.", fr: "La ville est très intéressante.", note: "Défini → die" },
        { de: "Das sind Schiffe.", fr: "Ce sont des bateaux.", note: "⚠️ Pluriel : pas d'article" },
        { de: "Die Elbe und die Weser sind Flüsse.", fr: "L'Elbe et la Weser sont des fleuves.", note: "⚠️ Pluriel" },
      ],
    },
  ],
};

// MODULE 20 — NÉGATION KEIN
const M20_KEIN: CourseModule = {
  id: "m20_kein",
  icon: "🚫",
  title: "Négation KEIN / KEINE",
  subtitle: "Comment dire « ne ... pas un / pas de »",
  sections: [
    {
      title: "🎯 Concept",
      rule: "On utilise KEIN pour nier un nom (au lieu de ein/eine).\nKEIN se conjugue comme EIN/EINE !",
    },
    {
      title: "Tableau KEIN",
      table: {
        cols: ["Genre", "Indéfini", "Négation", "Exemple"],
        rows: [
          ["♂️ Masc.", "ein Zug", "kein Zug", "Das ist kein Zug."],
          ["♀️ Fém.", "eine Kirsche", "keine Kirsche", "Das ist keine Kirsche."],
          ["⚪ Neutre", "ein Fahrrad", "kein Fahrrad", "Ich habe kein Fahrrad."],
          ["🔢 Pluriel", "— (rien)", "keine Autos", "Das sind keine Autos."],
        ],
      },
    },
    {
      title: "Phrases positives → négatives",
      items: [
        { de: "Ich habe Geld. → Ich habe kein Geld.", fr: "J'ai de l'argent. → Je n'ai pas d'argent." },
        { de: "Ich habe eine Flasche. → Ich habe keine Flasche.", fr: "J'ai une bouteille. → Je n'ai pas de bouteille." },
        { de: "Das ist ein Bus. → Das ist kein Bus.", fr: "C'est un bus. → Ce n'est pas un bus." },
        { de: "Das sind Autos. → Das sind keine Autos.", fr: "Ce sont des voitures. → Ce ne sont pas des voitures." },
      ],
    },
    {
      title: "⚠️ Erreur fréquente",
      rule: "On ne peut JAMAIS omettre l'article en allemand !\n❌ \"Ist Fahrrad\" → ✅ \"Ist das ein Fahrrad?\"\n❌ \"Nein, ist Bus\" → ✅ \"Nein, das ist kein Bus.\"",
    },
  ],
};

// MODULE 21 — DIRECTIONS EN VILLE (Wegbeschreibung)
const M21_WEGE: CourseModule = {
  id: "m21_wege",
  icon: "🧭",
  title: "Demander son chemin (Wegbeschreibung)",
  subtitle: "Phrases types pour s'orienter",
  sections: [
    {
      title: "💬 Demander son chemin",
      items: [
        { de: "Entschuldigung, wo ist die Friedrichstraße?", fr: "Excusez-moi, où est la rue Friedrich ?" },
        { de: "Wie komme ich zum Alexanderplatz?", fr: "Comment vais-je à Alexanderplatz ?" },
        { de: "Wir suchen ein Café / eine Bank.", fr: "Nous cherchons un café / une banque." },
        { de: "Wo geht es zur Schlossbrücke?", fr: "Comment va-t-on au pont du château ?" },
        { de: "Ist es weit? / Ist es in der Nähe?", fr: "Est-ce loin ? / Est-ce près d'ici ?" },
      ],
    },
    {
      title: "✅ Donner des directions",
      items: [
        { de: "Gehen Sie geradeaus.", fr: "Allez tout droit." },
        { de: "Gehen Sie hier links / rechts.", fr: "Tournez ici à gauche / à droite." },
        { de: "Gehen Sie bis zur Ampel.", fr: "Allez jusqu'au feu." },
        { de: "Gehen Sie bis zur Kreuzung.", fr: "Allez jusqu'au carrefour." },
        { de: "Gehen Sie an der Kirche vorbei.", fr: "Passez devant l'église." },
        { de: "Gehen Sie die Straße entlang.", fr: "Suivez la rue." },
        { de: "Gehen Sie über den Platz.", fr: "Traversez la place." },
        { de: "Nehmen Sie die zweite Straße links.", fr: "Prenez la deuxième rue à gauche." },
        { de: "Zuerst..., dann...", fr: "D'abord..., ensuite..." },
      ],
    },
    {
      title: "📝 Vocabulaire clé",
      items: [
        { de: "die Straße", fr: "la rue" },
        { de: "die Ampel", fr: "le feu tricolore" },
        { de: "die Kreuzung", fr: "le carrefour" },
        { de: "der Platz", fr: "la place" },
        { de: "die Kirche", fr: "l'église" },
        { de: "die Richtung", fr: "la direction" },
        { de: "rechts / links / geradeaus", fr: "à droite / à gauche / tout droit" },
        { de: "entlang / vorbei / über / bis zu", fr: "le long / devant / à travers / jusqu'à" },
      ],
    },
    {
      title: "💡 Astuces",
      rule: "• \"bis zur\" = contraction de \"bis zu der\"\n• \"an der Kirche vorbei\" = passer devant l'église\n• \"Gehen Sie...\" = forme polie (vous)",
    },
  ],
};

// MODULE 22 — HOBBYS & TEMPS LIBRE (Freizeit)
const M22_HOBBYS: CourseModule = {
  id: "m22_hobbys",
  icon: "🎨",
  title: "Hobbys & Temps libre (Freizeit)",
  subtitle: "Parler de ses loisirs",
  sections: [
    {
      title: "🎯 Question clé",
      items: [
        { de: "Was machst du gern?", fr: "Qu'est-ce que tu aimes faire ?", ex: "Ich lese gern.", exFr: "J'aime lire." },
        { de: "Was sind deine Hobbys?", fr: "Quels sont tes hobbys ?" },
        { de: "Ich [verbe] gern", fr: "J'aime [faire]...", note: "structure: sujet + verbe + gern" },
      ],
    },
    {
      title: "🎨 Activités courantes",
      items: [
        { de: "die Fotografie", fr: "la photographie", ex: "Ich mache gern Fotografie.", exFr: "J'aime faire de la photo." },
        { de: "singen", fr: "chanter", ex: "Ich singe gern.", exFr: "J'aime chanter." },
        { de: "kochen", fr: "cuisiner", ex: "Ich koche gern.", exFr: "J'aime cuisiner." },
        { de: "schwimmen", fr: "nager", ex: "Ich schwimme gern.", exFr: "J'aime nager." },
        { de: "reisen", fr: "voyager", ex: "Ich reise gern.", exFr: "J'aime voyager." },
        { de: "tanzen", fr: "danser", ex: "Ich tanze gern.", exFr: "J'aime danser." },
        { de: "joggen", fr: "courir / faire du jogging", ex: "Ich jogge gern.", exFr: "J'aime courir." },
        { de: "Musik hören", fr: "écouter de la musique", ex: "Ich höre gern Musik.", exFr: "J'aime écouter de la musique." },
        { de: "ins Kino gehen", fr: "aller au cinéma", ex: "Ich gehe gern ins Kino.", exFr: "J'aime aller au cinéma." },
        { de: "lesen", fr: "lire", ex: "Ich lese gern Bücher.", exFr: "J'aime lire des livres." },
      ],
    },
    {
      title: "💡 Bonus — fréquence",
      items: [
        { de: "oft", fr: "souvent" },
        { de: "manchmal", fr: "parfois" },
        { de: "selten", fr: "rarement" },
        { de: "nie", fr: "jamais" },
        { de: "jeden Tag", fr: "tous les jours" },
        { de: "am Wochenende", fr: "le week-end" },
      ],
    },
  ],
};

// MODULE 23 — PERSONNES TYPES (présentations courtes)
const M23_PERSONEN: CourseModule = {
  id: "m23_personen",
  icon: "👤",
  title: "Présentations de personnes",
  subtitle: "Lire et comprendre des fiches biographiques",
  sections: [
    {
      title: "🧩 Verbes essentiels",
      items: [
        { de: "kommen aus + Land", fr: "venir de + pays", ex: "Er kommt aus Brasilien.", exFr: "Il vient du Brésil." },
        { de: "wohnen in + Stadt", fr: "habiter à + ville", ex: "Sie wohnt in Berlin.", exFr: "Elle habite à Berlin." },
        { de: "sprechen + Sprache", fr: "parler + langue", ex: "Er spricht Deutsch und Englisch.", exFr: "Il parle allemand et anglais." },
        { de: "lernen + Sprache", fr: "apprendre + langue", ex: "Sie lernt Arabisch.", exFr: "Elle apprend l'arabe." },
      ],
    },
    {
      title: "🌍 Pays avec article (Dativ : aus + ...)",
      table: {
        cols: ["Pays", "Article", "aus + Dativ"],
        rows: [
          ["die USA (pl.)", "die", "aus den USA"],
          ["die Schweiz", "die", "aus der Schweiz"],
          ["die Türkei", "die", "aus der Türkei"],
          ["der Iran", "der", "aus dem Iran"],
          ["Deutschland", "—", "aus Deutschland"],
          ["Österreich", "—", "aus Österreich"],
          ["Tunesien", "—", "aus Tunesien"],
          ["Brasilien", "—", "aus Brasilien"],
        ],
      },
    },
    {
      title: "📋 Exemples de fiches",
      items: [
        { de: "Saki kommt aus Japan, wohnt in Berlin, spricht Japanisch und Deutsch, lernt Englisch.", fr: "Saki vient du Japon, habite à Berlin, parle japonais et allemand, apprend l'anglais." },
        { de: "Khadija kommt aus Algerien, wohnt in Paris, spricht Arabisch und Französisch, lernt Deutsch.", fr: "Khadija vient d'Algérie, habite à Paris, parle arabe et français, apprend l'allemand." },
        { de: "Boris kommt aus Österreich, wohnt in Salzburg, spricht Deutsch und Englisch, lernt Arabisch.", fr: "Boris vient d'Autriche, habite à Salzbourg, parle allemand et anglais, apprend l'arabe." },
      ],
    },
    {
      title: "💡 Règle des pays",
      rule: "90% des pays sont SANS article : aus Tunesien, aus Frankreich.\nMais : die USA → aus DEN USA / die Schweiz → aus DER Schweiz / der Iran → aus DEM Iran.",
    },
  ],
};

// EXPORT TOUS LES MODULES
export const COURSE_MODULES: CourseModule[] = [
  M1_SEIN, M2_LANDER, M3_HABEN, M4_WFRAGEN, M5_PRON,
  M6_ZAHLEN, M7_DATES, M8_FAMILIE, M9_GRUSSE, M10_BILD,
  M11_BERUFE, M12_UHRZEIT, M13_ESSEN, M14_WEG, M15_SHOPPING,
  M16_WETTER, M17_LEXIQUE,
  M18_PLURIELS, M19_ARTICLES, M20_KEIN, M21_WEGE, M22_HOBBYS, M23_PERSONEN,
];
