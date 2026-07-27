// Enrichissement massif A2 — vocabulaire étendu, exercices supplémentaires,
// unités bonus (Arbeit, Reisen A2, Umwelt & Gesundheit, Medien & Technik).
// Sources pédagogiques inspirées : Goethe A2 Fit, DW Nicos Weg A2, Netzwerk Neu A2,
// Menschen A2, Schritte plus Neu A2.
//
// Import à effet de bord unique : `import "@/data/curriculumA2Extra";`

import type { Exercise, Unit, VocabItem } from "./curriculum";
import { UNITS_A2 } from "./curriculumA2";

type Pack = { vocab?: VocabItem[]; exercises?: Exercise[] };

// ============================================================
// PACKS D'ENRICHISSEMENT PAR LEÇON EXISTANTE (a2_u1 → a2_u10)
// ============================================================
export const A2_EXTRA_PACKS: Record<string, Pack> = {
  a2_u1_l1: {
    vocab: [
      { de: "gemacht", fr: "fait", ar: "فعل", ex: "Was hast du gestern gemacht?" },
      { de: "gearbeitet", fr: "travaillé", ar: "عمل", ex: "Ich habe viel gearbeitet." },
      { de: "aufgestanden", fr: "levé", ar: "استيقظ", ex: "Ich bin um 7 Uhr aufgestanden." },
      { de: "angekommen", fr: "arrivé", ar: "وصل", ex: "Der Zug ist angekommen." },
      { de: "geblieben", fr: "resté", ar: "بقي", ex: "Wir sind zu Hause geblieben." },
      { de: "passiert", fr: "arrivé (événement)", ar: "حدث", ex: "Was ist passiert?" },
      { de: "vergessen", fr: "oublié", ar: "نسي", ex: "Ich habe den Schlüssel vergessen." },
      { de: "verloren", fr: "perdu", ar: "ضاع", ex: "Ich habe mein Handy verloren." },
    ],
    exercises: [
      { type: "qcm", q: "Auxiliaire avec 'aufstehen' ?", opts: ["haben", "sein", "werden", "tun"], ans: 1, tip: "Changement d'état → sein." },
      { type: "fill", q: "Er ___ nach Berlin gefahren.", ans: "ist", tip: "fahren = mouvement → sein." },
      { type: "translate", q: "« Qu'est-ce qui s'est passé ? »", ans: "Was ist passiert", tip: "passieren → sein." },
      { type: "qcm", q: "Partizip II de 'vergessen' ?", opts: ["gevergessen", "vergessen", "vergesst", "vergisst"], ans: 1, tip: "Verbe inséparable, pas de ge-." },
      { type: "fill", q: "Ich ___ mein Handy verloren.", ans: "habe", tip: "verlieren → haben." },
    ],
  },
  a2_u1_l2: {
    vocab: [
      { de: "sprach", fr: "parla", ar: "تكلم", ex: "Er sprach leise." },
      { de: "las", fr: "lut", ar: "قرأ", ex: "Sie las ein Buch." },
      { de: "schrieb", fr: "écrivit", ar: "كتب", ex: "Ich schrieb einen Brief." },
      { de: "trug", fr: "porta", ar: "حمل", ex: "Er trug einen Koffer." },
      { de: "verstand", fr: "comprit", ar: "فهم", ex: "Ich verstand alles." },
      { de: "blieb", fr: "resta", ar: "بقي", ex: "Sie blieb zu Hause." },
      { de: "rief an", fr: "appela", ar: "اتصل", ex: "Er rief mich gestern an." },
    ],
    exercises: [
      { type: "qcm", q: "Partizip II de 'lesen' ?", opts: ["gelest", "gelesen", "geleset", "las"], ans: 1, tip: "Verbe fort : gelesen." },
      { type: "translate", q: "« Il m'a appelé hier. »", ans: "Er hat mich gestern angerufen", tip: "anrufen : sép. → angerufen." },
      { type: "fill", q: "Präteritum de 'schreiben' : ich ___.", ans: "schrieb", tip: "schreiben → schrieb." },
    ],
  },
  a2_u2_l1: {
    vocab: [
      { de: "dürfen", fr: "avoir le droit", ar: "يجوز", ex: "Hier darf man rauchen." },
      { de: "sollen", fr: "devoir (conseil)", ar: "ينبغي", ex: "Du sollst mehr schlafen." },
      { de: "wollen", fr: "vouloir", ar: "يريد", ex: "Ich will nach Berlin fahren." },
      { de: "mögen / möchte", fr: "aimer / voudrais", ar: "يودّ", ex: "Ich möchte einen Kaffee." },
      { de: "können", fr: "pouvoir / savoir", ar: "يستطيع", ex: "Er kann Deutsch." },
      { de: "müssen", fr: "devoir (obligation)", ar: "يجب", ex: "Ich muss arbeiten." },
      { de: "die Erlaubnis", fr: "la permission", ar: "الإذن", ex: "Du hast meine Erlaubnis." },
      { de: "die Pflicht", fr: "le devoir", ar: "الواجب", ex: "Das ist deine Pflicht." },
      { de: "verboten", fr: "interdit", ar: "ممنوع", ex: "Rauchen ist verboten." },
      { de: "erlaubt", fr: "autorisé", ar: "مسموح", ex: "Parken ist erlaubt." },
    ],
    exercises: [
      { type: "qcm", q: "« Je voudrais un thé. »", opts: ["Ich will einen Tee", "Ich möchte einen Tee", "Ich muss einen Tee", "Ich darf einen Tee"], ans: 1, tip: "möchte = poli." },
      { type: "fill", q: "Du ___ mehr Sport machen. (conseil)", ans: "sollst", tip: "sollen → sollst." },
      { type: "translate", q: "« Ici, on ne peut pas fumer. »", ans: "Hier darf man nicht rauchen", tip: "interdiction = dürfen + nicht." },
      { type: "qcm", q: "Structure correcte ?", opts: ["Ich kann sprechen Deutsch", "Ich kann Deutsch sprechen", "Ich Deutsch kann sprechen", "Ich sprechen kann Deutsch"], ans: 1, tip: "Modal en pos.2, infinitif à la fin." },
    ],
  },
  a2_u3_l1: {
    vocab: [
      { de: "weil", fr: "parce que", ar: "لأنّ", ex: "Ich bleibe, weil es regnet." },
      { de: "dass", fr: "que", ar: "أنّ", ex: "Ich denke, dass er kommt." },
      { de: "wenn", fr: "quand / si", ar: "عندما/إذا", ex: "Wenn es regnet, bleibe ich zu Hause." },
      { de: "obwohl", fr: "bien que", ar: "رغم أنّ", ex: "Obwohl er müde ist, arbeitet er." },
      { de: "damit", fr: "pour que", ar: "لكي", ex: "Ich lerne, damit ich bestehe." },
      { de: "während", fr: "pendant que", ar: "بينما", ex: "Während ich koche, liest er." },
      { de: "bevor", fr: "avant que", ar: "قبل أن", ex: "Bevor ich schlafe, lese ich." },
      { de: "nachdem", fr: "après que", ar: "بعد أن", ex: "Nachdem ich gegessen habe, gehe ich." },
    ],
    exercises: [
      { type: "translate", q: "« Je pense qu'il vient demain. »", ans: "Ich denke, dass er morgen kommt", tip: "Verbe à la fin dans la subordonnée." },
      { type: "fill", q: "Ich lerne Deutsch, ___ ich in Berlin arbeiten will.", ans: "weil", tip: "cause = weil." },
      { type: "qcm", q: "Position du verbe après 'weil' ?", opts: ["2e position", "1re position", "à la fin", "après le sujet"], ans: 2, tip: "Subordonnée → verbe fin." },
      { type: "translate", q: "« Quand il pleut, je reste. »", ans: "Wenn es regnet, bleibe ich", tip: "Attention à l'inversion après la subordonnée." },
    ],
  },
  a2_u4_l1: {
    vocab: [
      { de: "das neue Auto", fr: "la nouvelle voiture", ar: "السيارة الجديدة", ex: "Das neue Auto ist rot." },
      { de: "der schöne Tag", fr: "la belle journée", ar: "اليوم الجميل", ex: "Der schöne Tag beginnt." },
      { de: "die kleine Katze", fr: "le petit chat", ar: "القطة الصغيرة", ex: "Die kleine Katze schläft." },
      { de: "das große Haus", fr: "la grande maison", ar: "البيت الكبير", ex: "Das große Haus gehört uns." },
      { de: "der junge Mann", fr: "le jeune homme", ar: "الشاب", ex: "Der junge Mann liest." },
      { de: "die alten Bücher", fr: "les vieux livres", ar: "الكتب القديمة", ex: "Die alten Bücher sind teuer." },
    ],
    exercises: [
      { type: "fill", q: "Der ___ Mann liest. (jung)", ans: "junge", tip: "Nom.masc + article défini → -e." },
      { type: "qcm", q: "Die klein__ Kinder spielen.", opts: ["-e", "-en", "-er", "-es"], ans: 1, tip: "Pluriel défini → -en." },
      { type: "translate", q: "« La nouvelle voiture est rouge. »", ans: "Das neue Auto ist rot", tip: "Auto = das." },
    ],
  },
  a2_u5_l1: {
    vocab: [
      { de: "größer als", fr: "plus grand que", ar: "أكبر من", ex: "Berlin ist größer als München." },
      { de: "am größten", fr: "le plus grand", ar: "الأكبر", ex: "Berlin ist am größten." },
      { de: "besser als", fr: "meilleur que", ar: "أفضل من", ex: "Er ist besser als ich." },
      { de: "am besten", fr: "le mieux", ar: "الأفضل", ex: "Sie spricht am besten." },
      { de: "so … wie", fr: "aussi … que", ar: "مثل … مثل", ex: "Ich bin so groß wie du." },
      { de: "mehr als", fr: "plus que", ar: "أكثر من", ex: "Ich habe mehr als 100 €." },
      { de: "weniger als", fr: "moins que", ar: "أقلّ من", ex: "Weniger als drei Tage." },
    ],
    exercises: [
      { type: "qcm", q: "Comparatif de 'gut' ?", opts: ["guter", "besser", "gutter", "beßer"], ans: 1, tip: "Irrégulier : gut → besser → am besten." },
      { type: "translate", q: "« Elle est plus jeune que moi. »", ans: "Sie ist jünger als ich", tip: "jung → jünger + Umlaut." },
      { type: "fill", q: "Er läuft am ___. (schnell → superlatif)", ans: "schnellsten", tip: "am + -sten." },
    ],
  },
  a2_u6_l1: {
    vocab: [
      { de: "in + Akk", fr: "vers l'intérieur", ar: "إلى داخل", ex: "Ich gehe in die Küche." },
      { de: "in + Dat", fr: "à l'intérieur", ar: "داخل", ex: "Ich bin in der Küche." },
      { de: "auf + Akk", fr: "sur (mouvement)", ar: "على (حركة)", ex: "Ich lege es auf den Tisch." },
      { de: "auf + Dat", fr: "sur (position)", ar: "على (سكون)", ex: "Es liegt auf dem Tisch." },
      { de: "unter", fr: "sous", ar: "تحت", ex: "Die Katze ist unter dem Bett." },
      { de: "zwischen", fr: "entre", ar: "بين", ex: "Zwischen den Häusern." },
      { de: "hinter", fr: "derrière", ar: "خلف", ex: "Hinter dem Haus ist ein Garten." },
      { de: "vor", fr: "devant", ar: "أمام", ex: "Vor der Tür wartet er." },
      { de: "neben", fr: "à côté de", ar: "بجانب", ex: "Neben dem Bahnhof." },
    ],
    exercises: [
      { type: "qcm", q: "Ich stelle die Vase ___ den Tisch.", opts: ["auf (Akk)", "auf (Dat)", "an", "in"], ans: 0, tip: "Mouvement → Akkusativ." },
      { type: "fill", q: "Die Vase steht ___ dem Tisch.", ans: "auf", tip: "Position → auf + Dat." },
      { type: "translate", q: "« Le chat est sous le lit. »", ans: "Die Katze ist unter dem Bett", tip: "Position → Dat." },
    ],
  },
  a2_u7_l1: {
    vocab: [
      { de: "mich / mir", fr: "me (Akk/Dat)", ar: "أنا (مفعول)", ex: "Er sieht mich. Er hilft mir." },
      { de: "dich / dir", fr: "te", ar: "أنت (مفعول)", ex: "Ich liebe dich. Ich gebe dir das Buch." },
      { de: "ihn / ihm", fr: "le / lui (masc.)", ar: "إياه/له", ex: "Ich sehe ihn. Ich helfe ihm." },
      { de: "sie / ihr", fr: "la / lui (fém.)", ar: "إياها/لها", ex: "Ich sehe sie. Ich gebe ihr das Buch." },
      { de: "uns", fr: "nous", ar: "نحن (مفعول)", ex: "Er ruft uns an." },
      { de: "euch", fr: "vous", ar: "أنتم (مفعول)", ex: "Ich helfe euch." },
    ],
    exercises: [
      { type: "fill", q: "Er hilft ___ . (à moi)", ans: "mir", tip: "helfen + Dat." },
      { type: "qcm", q: "« Je te vois. »", opts: ["Ich sehe dir", "Ich sehe dich", "Ich siehe dich", "Ich sehe du"], ans: 1, tip: "sehen + Akk." },
    ],
  },
  a2_u8_l1: {
    vocab: [
      { de: "werden", fr: "devenir (auxiliaire futur)", ar: "سوف/يصبح", ex: "Ich werde arbeiten." },
      { de: "in Zukunft", fr: "à l'avenir", ar: "في المستقبل", ex: "In Zukunft lerne ich mehr." },
      { de: "nächstes Jahr", fr: "l'an prochain", ar: "العام القادم", ex: "Nächstes Jahr fahre ich nach Berlin." },
      { de: "bald", fr: "bientôt", ar: "قريبًا", ex: "Ich komme bald." },
      { de: "vielleicht", fr: "peut-être", ar: "ربّما", ex: "Vielleicht regnet es." },
      { de: "wahrscheinlich", fr: "probablement", ar: "على الأرجح", ex: "Er kommt wahrscheinlich morgen." },
    ],
    exercises: [
      { type: "translate", q: "« Je vais apprendre l'allemand. »", ans: "Ich werde Deutsch lernen", tip: "werden + infinitif à la fin." },
      { type: "fill", q: "Sie ___ morgen kommen.", ans: "wird", tip: "sie (sg) → wird." },
    ],
  },
  a2_u9_l1: {
    vocab: [
      { de: "warten auf + Akk", fr: "attendre", ar: "ينتظر", ex: "Ich warte auf den Bus." },
      { de: "denken an + Akk", fr: "penser à", ar: "يفكّر في", ex: "Ich denke an dich." },
      { de: "sich freuen auf + Akk", fr: "se réjouir de (futur)", ar: "يتطلّع إلى", ex: "Ich freue mich auf den Urlaub." },
      { de: "sich freuen über + Akk", fr: "se réjouir de (passé)", ar: "يفرح بـ", ex: "Ich freue mich über das Geschenk." },
      { de: "sprechen mit + Dat / über + Akk", fr: "parler avec / de", ar: "يتحدّث مع/عن", ex: "Ich spreche mit Anna über die Arbeit." },
      { de: "helfen bei + Dat", fr: "aider à", ar: "يساعد في", ex: "Er hilft mir bei den Hausaufgaben." },
      { de: "Angst haben vor + Dat", fr: "avoir peur de", ar: "يخاف من", ex: "Sie hat Angst vor Hunden." },
    ],
    exercises: [
      { type: "fill", q: "Ich warte ___ den Bus.", ans: "auf", tip: "warten + auf + Akk." },
      { type: "qcm", q: "« J'ai peur des chiens. »", opts: ["Ich habe Angst von Hunden","Ich habe Angst vor Hunden","Ich fürchte für Hunde","Ich Angst habe Hunde"], ans: 1, tip: "Angst haben vor + Dat." },
    ],
  },
  a2_u10_l1: {
    vocab: [
      { de: "sich duschen", fr: "se doucher", ar: "يستحمّ", ex: "Ich dusche mich jeden Morgen." },
      { de: "sich rasieren", fr: "se raser", ar: "يحلق", ex: "Er rasiert sich." },
      { de: "sich kämmen", fr: "se peigner", ar: "يمشّط", ex: "Sie kämmt sich die Haare." },
      { de: "sich beeilen", fr: "se dépêcher", ar: "يسرع", ex: "Beeil dich!" },
      { de: "sich erinnern an + Akk", fr: "se souvenir de", ar: "يتذكّر", ex: "Ich erinnere mich an ihn." },
      { de: "sich interessieren für + Akk", fr: "s'intéresser à", ar: "يهتمّ بـ", ex: "Ich interessiere mich für Musik." },
    ],
    exercises: [
      { type: "translate", q: "« Dépêche-toi ! »", ans: "Beeil dich", tip: "Impératif 2e sg." },
      { type: "fill", q: "Ich interessiere ___ für Kunst.", ans: "mich", tip: "1re pers.sg. Akk." },
    ],
  },
};

// ============================================================
// UNITÉS BONUS A2 — Arbeit, Reisen A2, Umwelt/Gesundheit, Medien/Technik
// ============================================================
const BONUS_UNITS_A2: Unit[] = [
  {
    id: "a2_u_bonus_arbeit", title: "🧑‍💼 Arbeit & Beruf", titleAr: "العمل والمهنة",
    icon: "🧑‍💼", desc: "Métiers, entretien, e-mails professionnels", descAr: "المهن والمقابلات والبريد المهني",
    color: "#0ea5e9", level: "A2",
    lessons: [
      {
        id: "a2_ub_arbeit_l1", title: "Métiers et lieux de travail", titleAr: "المهن وأماكن العمل",
        content: `**Berufe :** Lehrer/in, Arzt/Ärztin, Ingenieur/in, Verkäufer/in, Krankenpfleger/in, Programmierer/in, Kellner/in, Koch/Köchin, Handwerker/in.

**Arbeitsplätze :** das Büro, die Schule, das Krankenhaus, die Werkstatt, das Restaurant, die Fabrik.

**Fragen :** Was sind Sie von Beruf? — Ich arbeite als … / Ich bin …`,
        vocab: [
          { de: "der Beruf", fr: "la profession", ar: "المهنة", ex: "Was ist Ihr Beruf?" },
          { de: "die Firma", fr: "l'entreprise", ar: "الشركة", ex: "Ich arbeite in einer Firma." },
          { de: "der Kollege / die Kollegin", fr: "le/la collègue", ar: "الزميل", ex: "Meine Kollegin heißt Anna." },
          { de: "der Chef / die Chefin", fr: "le patron / la patronne", ar: "المدير", ex: "Mein Chef ist streng." },
          { de: "das Gehalt", fr: "le salaire", ar: "الراتب", ex: "Das Gehalt ist gut." },
          { de: "die Bewerbung", fr: "la candidature", ar: "الترشيح", ex: "Ich schreibe eine Bewerbung." },
          { de: "das Vorstellungsgespräch", fr: "l'entretien", ar: "مقابلة العمل", ex: "Morgen habe ich ein Vorstellungsgespräch." },
          { de: "der Lebenslauf", fr: "le CV", ar: "السيرة الذاتية", ex: "Bitte schicken Sie Ihren Lebenslauf." },
          { de: "die Teilzeit / Vollzeit", fr: "temps partiel / plein", ar: "دوام جزئي/كامل", ex: "Ich arbeite Teilzeit." },
          { de: "verdienen", fr: "gagner (argent)", ar: "يكسب", ex: "Er verdient 3000 € im Monat." },
        ],
        exercises: [
          { type: "translate", q: "« Quelle est votre profession ? »", ans: "Was sind Sie von Beruf", tip: "Forme figée." },
          { type: "fill", q: "Ich arbeite ___ Lehrer.", ans: "als", tip: "als + métier sans article." },
          { type: "qcm", q: "Le CV en allemand ?", opts: ["die Bewerbung", "der Lebenslauf", "das Gehalt", "das Zeugnis"], ans: 1, tip: "Lebenslauf = CV." },
        ],
      },
      {
        id: "a2_ub_arbeit_l2", title: "E-mail professionnel", titleAr: "بريد إلكتروني رسمي",
        content: `**Structure standard :**

Sehr geehrte Damen und Herren,
… (contenu poli, verbes modaux : ich möchte, könnten Sie …)
Mit freundlichen Grüßen,
[Name]

**Formules utiles :**
• Ich schreibe Ihnen bezüglich …
• Könnten Sie mir bitte … schicken?
• Vielen Dank im Voraus.
• Ich freue mich auf Ihre Antwort.`,
        vocab: [
          { de: "Sehr geehrte Damen und Herren", fr: "Madame, Monsieur", ar: "السادة المحترمون", ex: "Sehr geehrte Damen und Herren, …" },
          { de: "Mit freundlichen Grüßen", fr: "Cordialement", ar: "مع أطيب التحيات", ex: "…Mit freundlichen Grüßen, Anna." },
          { de: "bezüglich + Gen", fr: "concernant", ar: "بخصوص", ex: "Bezüglich Ihrer Anfrage." },
          { de: "die Anfrage", fr: "la demande", ar: "الاستفسار", ex: "Ihre Anfrage vom 5. Mai." },
          { de: "der Anhang", fr: "la pièce jointe", ar: "المرفق", ex: "Im Anhang finden Sie den Vertrag." },
          { de: "der Termin", fr: "le rendez-vous", ar: "الموعد", ex: "Ich brauche einen Termin." },
        ],
        exercises: [
          { type: "translate", q: "« Cordialement »", ans: "Mit freundlichen Grüßen", tip: "Formule standard." },
          { type: "qcm", q: "Formule d'ouverture formelle ?", opts: ["Hallo Leute","Sehr geehrte Damen und Herren","Hi","Liebe Freunde"], ans: 1, tip: "Formel neutre." },
        ],
      },
    ],
  },
  {
    id: "a2_u_bonus_reisen", title: "✈️ Reisen A2 — voyager mieux", titleAr: "السفر — مستوى A2",
    icon: "✈️", desc: "Réservation, plaintes, itinéraires détaillés", descAr: "الحجز والشكاوى والمسارات",
    color: "#22c55e", level: "A2",
    lessons: [
      {
        id: "a2_ub_reisen_l1", title: "Réserver un hôtel", titleAr: "حجز فندق",
        content: `**Types de chambres :** das Einzelzimmer, das Doppelzimmer, die Suite.
**Avec/sans :** mit Frühstück, mit Halbpension, mit Vollpension.

**Phrases utiles :**
• Ich möchte ein Doppelzimmer für zwei Nächte reservieren.
• Ist das Frühstück inklusive?
• Haben Sie WLAN?
• Um wie viel Uhr ist der Check-out?`,
        vocab: [
          { de: "das Doppelzimmer", fr: "chambre double", ar: "غرفة مزدوجة", ex: "Ein Doppelzimmer, bitte." },
          { de: "die Reservierung", fr: "la réservation", ar: "الحجز", ex: "Ich habe eine Reservierung." },
          { de: "das Frühstück", fr: "le petit-déjeuner", ar: "الفطور", ex: "Frühstück ist inklusive." },
          { de: "der Aufenthalt", fr: "le séjour", ar: "الإقامة", ex: "Schönen Aufenthalt!" },
          { de: "das WLAN", fr: "le wifi", ar: "الواي فاي", ex: "Wie ist das WLAN-Passwort?" },
          { de: "der Check-in / Check-out", fr: "arrivée / départ", ar: "تسجيل الدخول/الخروج", ex: "Check-in ab 15 Uhr." },
        ],
        exercises: [
          { type: "translate", q: "« Je voudrais réserver une chambre double. »", ans: "Ich möchte ein Doppelzimmer reservieren", tip: "möchte + inf. à la fin." },
          { type: "fill", q: "Ist das Frühstück ___ ?", ans: "inklusive", tip: "inclus." },
        ],
      },
      {
        id: "a2_ub_reisen_l2", title: "Faire une réclamation", titleAr: "تقديم شكوى",
        content: `• Entschuldigung, das Zimmer ist zu laut.
• Die Klimaanlage funktioniert nicht.
• Können Sie mir bitte ein anderes Zimmer geben?
• Ich hätte gerne den Manager gesprochen.`,
        vocab: [
          { de: "die Klimaanlage", fr: "la climatisation", ar: "المكيّف", ex: "Die Klimaanlage ist kaputt." },
          { de: "funktionieren", fr: "fonctionner", ar: "يعمل", ex: "Der TV funktioniert nicht." },
          { de: "kaputt", fr: "cassé / en panne", ar: "معطّل", ex: "Die Dusche ist kaputt." },
          { de: "sich beschweren", fr: "se plaindre", ar: "يشتكي", ex: "Ich möchte mich beschweren." },
          { de: "der Manager", fr: "le manager", ar: "المدير", ex: "Ich möchte den Manager sprechen." },
          { de: "laut / leise", fr: "bruyant / silencieux", ar: "صاخب/هادئ", ex: "Das Zimmer ist zu laut." },
        ],
        exercises: [
          { type: "translate", q: "« La climatisation ne fonctionne pas. »", ans: "Die Klimaanlage funktioniert nicht", tip: "nicht à la fin." },
          { type: "qcm", q: "« Je voudrais me plaindre. »", opts: ["Ich möchte mich beschweren","Ich will mich freuen","Ich muss mich beeilen","Ich darf mich setzen"], ans: 0, tip: "sich beschweren." },
        ],
      },
    ],
  },
  {
    id: "a2_u_bonus_gesundheit", title: "🌱 Umwelt & Gesundheit", titleAr: "البيئة والصحة",
    icon: "🌱", desc: "Écologie, alimentation, mode de vie sain", descAr: "البيئة والغذاء ونمط حياة صحي",
    color: "#16a34a", level: "A2",
    lessons: [
      {
        id: "a2_ub_gesundheit_l1", title: "Vie saine", titleAr: "حياة صحية",
        content: `• sich gesund ernähren — se nourrir sainement
• Sport treiben — faire du sport
• genug schlafen — dormir assez
• Stress vermeiden — éviter le stress

**Aliments :** Obst, Gemüse, Vollkornbrot, Fisch, wenig Zucker.`,
        vocab: [
          { de: "gesund", fr: "sain", ar: "صحي", ex: "Obst ist gesund." },
          { de: "ungesund", fr: "malsain", ar: "غير صحي", ex: "Fastfood ist ungesund." },
          { de: "die Ernährung", fr: "l'alimentation", ar: "التغذية", ex: "Gesunde Ernährung ist wichtig." },
          { de: "sich bewegen", fr: "bouger", ar: "يتحرّك", ex: "Bewege dich mehr!" },
          { de: "die Vorsorge", fr: "la prévention", ar: "الوقاية", ex: "Vorsorge ist besser als Heilung." },
          { de: "abnehmen / zunehmen", fr: "maigrir / grossir", ar: "ينقص/يزيد وزنًا", ex: "Ich möchte abnehmen." },
        ],
        exercises: [
          { type: "translate", q: "« Je veux perdre du poids. »", ans: "Ich möchte abnehmen", tip: "abnehmen = maigrir." },
          { type: "qcm", q: "Antonyme de 'gesund' ?", opts: ["krank", "ungesund", "müde", "stark"], ans: 1, tip: "ungesund = malsain." },
        ],
      },
      {
        id: "a2_ub_gesundheit_l2", title: "Environnement & tri", titleAr: "البيئة والفرز",
        content: `**Umweltschutz :** Müll trennen, Strom sparen, mit dem Fahrrad fahren, weniger Fleisch essen.
**Behälter :** Papier, Glas, Plastik, Bio.
**Klimaschutz :** CO₂ reduzieren, erneuerbare Energien.`,
        vocab: [
          { de: "die Umwelt", fr: "l'environnement", ar: "البيئة", ex: "Wir schützen die Umwelt." },
          { de: "der Müll", fr: "les déchets", ar: "النفايات", ex: "Müll trennen ist wichtig." },
          { de: "recyceln", fr: "recycler", ar: "يعيد التدوير", ex: "Wir recyceln Papier." },
          { de: "sparen", fr: "économiser", ar: "يوفّر", ex: "Strom sparen!" },
          { de: "der Klimawandel", fr: "le changement climatique", ar: "التغيّر المناخي", ex: "Der Klimawandel ist real." },
          { de: "erneuerbare Energien", fr: "énergies renouvelables", ar: "الطاقات المتجددة", ex: "Wir nutzen erneuerbare Energien." },
        ],
        exercises: [
          { type: "translate", q: "« Il faut trier les déchets. »", ans: "Man muss den Müll trennen", tip: "man muss + inf." },
          { type: "fill", q: "Wir müssen Strom ___ .", ans: "sparen", tip: "économiser." },
        ],
      },
    ],
  },
  {
    id: "a2_u_bonus_medien", title: "📱 Medien & Technik", titleAr: "الإعلام والتكنولوجيا",
    icon: "📱", desc: "Internet, réseaux sociaux, smartphone", descAr: "الإنترنت ووسائل التواصل والهاتف",
    color: "#a855f7", level: "A2",
    lessons: [
      {
        id: "a2_ub_medien_l1", title: "Vie numérique", titleAr: "الحياة الرقمية",
        content: `• Ich surfe im Internet.
• Ich schicke eine Nachricht per WhatsApp.
• Ich poste ein Foto auf Instagram.
• Ich sehe ein Video auf YouTube.
• Ich mache einen Videoanruf.`,
        vocab: [
          { de: "das Internet", fr: "l'internet", ar: "الإنترنت", ex: "Ich surfe im Internet." },
          { de: "die Nachricht", fr: "le message", ar: "الرسالة", ex: "Ich habe eine Nachricht bekommen." },
          { de: "das Foto", fr: "la photo", ar: "الصورة", ex: "Ein schönes Foto." },
          { de: "das Video", fr: "la vidéo", ar: "الفيديو", ex: "Sieh dir das Video an." },
          { de: "der Videoanruf", fr: "l'appel vidéo", ar: "مكالمة فيديو", ex: "Wir machen einen Videoanruf." },
          { de: "hochladen / herunterladen", fr: "téléverser / télécharger", ar: "رفع/تنزيل", ex: "Ich lade eine Datei hoch." },
          { de: "die App", fr: "l'application", ar: "التطبيق", ex: "Eine neue App." },
          { de: "das Passwort", fr: "le mot de passe", ar: "كلمة المرور", ex: "Mein Passwort ist geheim." },
        ],
        exercises: [
          { type: "translate", q: "« J'envoie un message. »", ans: "Ich schicke eine Nachricht", tip: "schicken = envoyer." },
          { type: "qcm", q: "'télécharger' en allemand ?", opts: ["hochladen","herunterladen","aufmachen","zumachen"], ans: 1, tip: "herunter = vers le bas." },
        ],
      },
    ],
  },
];

// ============================================================
// APPLICATION EN SIDE-EFFECT
// ============================================================
let applied = false;
export function applyA2Extras() {
  if (applied) return;
  applied = true;
  for (const u of UNITS_A2) {
    for (const l of u.lessons) {
      const pack = A2_EXTRA_PACKS[l.id];
      if (!pack) continue;
      if (pack.vocab) l.vocab.push(...pack.vocab);
      if (pack.exercises) l.exercises.push(...pack.exercises);
    }
  }
  for (const bu of BONUS_UNITS_A2) {
    if (!UNITS_A2.find((u) => u.id === bu.id)) UNITS_A2.push(bu);
  }
}
applyA2Extras();
