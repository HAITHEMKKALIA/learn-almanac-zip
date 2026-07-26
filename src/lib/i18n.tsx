// === Système i18n FR/AR pour DeutschMeister ===
// L'utilisateur peut afficher tout en FR seul, FR+AR (par défaut), ou AR seul.
// Chaque chaîne UI a une clé. Pour le contenu pédagogique (vocab/exos),
// on traduit FR→AR à la volée via FR_AR (mots fréquents) et un fallback heuristique.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import React from "react";

export type Lang = "fr" | "ar" | "both" | "de";

const STORAGE_KEY = "dm_lang_v1";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof UI) => string;
  tt: (l: { fr: string; de?: string; ar?: string }) => string;
  ar: (fr: string) => string;
  bi: (fr: string, ar?: string) => string;
  rtl: boolean;
  /** Mode immersion allemand uniquement : masquer FR & AR */
  deOnly: boolean;
  /** Doit-on afficher la traduction française ? */
  showFr: boolean;
  /** Doit-on afficher la traduction arabe ? */
  showAr: boolean;
}

const Ctx = createContext<I18nCtx | null>(null);

function pickLang(l: { fr: string; de?: string; ar?: string }, lang: Lang): string {
  if (lang === "de") return l.de || l.fr;
  if (lang === "ar") return l.ar || l.fr;
  if (lang === "both") return l.de ? `${l.de} — ${l.fr}` : l.fr;
  return l.fr;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as Lang) || "de"; } catch { return "de"; }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  };
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang === "ar" ? "ar" : lang === "de" ? "de" : "fr";
  }, [lang]);

  const deOnly = lang === "de";
  const showFr = lang === "fr" || lang === "both";
  const showAr = lang === "ar" || lang === "both";

  const t = (key: keyof typeof UI) => {
    const e = UI[key];
    if (!e) return String(key);
    if (lang === "de") return (e as any).de || e.fr;
    if (lang === "ar") return e.ar;
    if (lang === "both") return (e as any).de ? `${(e as any).de} — ${e.fr}` : `${e.fr} — ${e.ar}`;
    return e.fr;
  };
  const tt = (l: { fr: string; de?: string; ar?: string }) => pickLang(l, lang);
  const ar = (fr: string) => translateFrToAr(fr);
  const bi = (fr: string, arVal?: string) => {
    const a = arVal || translateFrToAr(fr);
    if (lang === "ar") return a || fr;
    if (lang === "both") return a ? `${fr} — ${a}` : fr;
    return fr;
  };

  return React.createElement(Ctx.Provider, {
    value: { lang, setLang, t, tt, ar, bi, rtl: lang === "ar", deOnly, showFr, showAr },
  }, children);
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) {
    return {
      lang: "fr", setLang: () => {}, t: (k) => UI[k]?.fr ?? String(k),
      tt: (l) => l.fr,
      ar: translateFrToAr, bi: (fr) => fr, rtl: false,
      deOnly: false, showFr: true, showAr: false,
    };
  }
  return c;
}

// ====== Dictionnaire UI ======
type Pair = { fr: string; ar: string; de?: string };
export const UI = {
  // Tabs
  tabLearn: { fr: "Apprendre", de: "Lernen", ar: "تعلّم" },
  tabTalk: { fr: "Parler", de: "Sprechen", ar: "تكلّم" },
  tabRef: { fr: "Référence", de: "Referenz", ar: "مرجع" },
  tabTutor: { fr: "Prof IA", de: "KI-Lehrer", ar: "الأستاذ الذكي" },
  tabStats: { fr: "Stats", de: "Statistik", ar: "إحصائيات" },
  // Common
  back: { fr: "Retour", de: "Zurück", ar: "رجوع" },
  next: { fr: "Suivant", de: "Weiter", ar: "التالي" },
  start: { fr: "Commencer", de: "Starten", ar: "ابدأ" },
  listen: { fr: "Écouter", de: "Hören", ar: "استمع" },
  speak: { fr: "Parler", de: "Sprechen", ar: "تكلّم" },
  search: { fr: "Recherche", de: "Suche", ar: "بحث" },
  all: { fr: "Tous", de: "Alle", ar: "الكل" },
  vocab: { fr: "Vocabulaire", de: "Wortschatz", ar: "المفردات" },
  exercise: { fr: "Exercice", de: "Übung", ar: "تمرين" },
  exercises: { fr: "Exercices", de: "Übungen", ar: "تمارين" },
  lesson: { fr: "Leçon", de: "Lektion", ar: "درس" },
  lessons: { fr: "Leçons", de: "Lektionen", ar: "دروس" },
  example: { fr: "Exemple", de: "Beispiel", ar: "مثال" },
  translation: { fr: "Traduction", de: "Übersetzung", ar: "ترجمة" },
  correct: { fr: "Correct", de: "Richtig", ar: "صحيح" },
  wrong: { fr: "Incorrect", de: "Falsch", ar: "خطأ" },
  retry: { fr: "Réessayer", de: "Nochmal", ar: "أعد المحاولة" },
  continue: { fr: "Continuer", de: "Weiter", ar: "متابعة" },
  finish: { fr: "Terminer", de: "Beenden", ar: "إنهاء" },
  settings: { fr: "Réglages", de: "Einstellungen", ar: "إعدادات" },
  language: { fr: "Langue", de: "Sprache", ar: "اللغة" },
  french: { fr: "Français", de: "Französisch", ar: "الفرنسية" },
  arabic: { fr: "Arabe", de: "Arabisch", ar: "العربية" },
  both: { fr: "FR + AR", de: "FR + AR", ar: "FR + AR" },
  // App-specific
  appTitle: { fr: "DeutschMeister", de: "DeutschMeister", ar: "ديتش‌مايستر" },
  appSubtitle: { fr: "Votre professeur d'allemand professionnel", de: "Ihr professioneller Deutschlehrer", ar: "مدرّس اللغة الألمانية الاحترافي" },
  startCta: { fr: "🔊 Commencer", de: "🔊 Starten", ar: "🔊 ابدأ" },
  voiceMicHint: { fr: "Active la voix et le micro", de: "Stimme und Mikrofon aktivieren", ar: "فعّل الصوت والميكروفون" },
  hoeren: { fr: "Hören (écoute)", de: "Hören", ar: "Hören (استماع)" },
  pronounce: { fr: "Prononcez", de: "Sprechen Sie", ar: "النطق" },
  verbsDict: { fr: "Dictionnaire des verbes", de: "Verbwörterbuch", ar: "قاموس الأفعال" },
  revisionSheet: { fr: "Fiche de révision", de: "Wiederholungsblatt", ar: "ورقة المراجعة" },
  qcmExam: { fr: "QCM Examen", de: "Multiple-Choice-Prüfung", ar: "امتحان اختياري" },
  finalExam: { fr: "Examen final", de: "Abschlussprüfung", ar: "الامتحان النهائي" },
  dialogs: { fr: "Dialogues", de: "Dialoge", ar: "حوارات" },
  challenge: { fr: "Défi du jour", de: "Tagesherausforderung", ar: "تحدّي اليوم" },
  // Misc
  noResults: { fr: "Aucun résultat", de: "Keine Ergebnisse", ar: "لا توجد نتائج" },
  loading: { fr: "Chargement…", de: "Wird geladen…", ar: "جارٍ التحميل…" },
} as const satisfies Record<string, Pair>;

// ====== Dictionnaire FR → AR (vocabulaire courant) ======
// Couvre les mots les plus fréquents des leçons. Ajout libre.
const FR_AR: Record<string, string> = {
  // salutations
  "bonjour": "مرحبًا",
  "bonsoir": "مساء الخير",
  "salut": "أهلًا",
  "au revoir": "مع السلامة",
  "merci": "شكرًا",
  "s'il vous plaît": "من فضلك",
  "oui": "نعم",
  "non": "لا",
  "excusez-moi": "اعذرني",
  "pardon": "عفوًا",
  // famille
  "père": "أب",
  "mère": "أم",
  "frère": "أخ",
  "sœur": "أخت",
  "fils": "ابن",
  "fille": "ابنة",
  "enfant": "طفل",
  "famille": "عائلة",
  "homme": "رجل",
  "femme": "امرأة",
  "ami": "صديق",
  "amie": "صديقة",
  // pronoms
  "je": "أنا",
  "tu": "أنت",
  "il": "هو",
  "elle": "هي",
  "nous": "نحن",
  "vous": "أنتم",
  "ils": "هم",
  "elles": "هنّ",
  // verbes courants
  "être": "يكون",
  "avoir": "يمتلك",
  "aller": "يذهب",
  "venir": "يأتي",
  "manger": "يأكل",
  "boire": "يشرب",
  "dormir": "ينام",
  "parler": "يتكلّم",
  "comprendre": "يفهم",
  "apprendre": "يتعلّم",
  "lire": "يقرأ",
  "écrire": "يكتب",
  "voir": "يرى",
  "entendre": "يسمع",
  "écouter": "يستمع",
  "faire": "يفعل",
  "travailler": "يعمل",
  "habiter": "يسكن",
  "vivre": "يعيش",
  "acheter": "يشتري",
  "vendre": "يبيع",
  "donner": "يعطي",
  "prendre": "يأخذ",
  "mettre": "يضع",
  "ouvrir": "يفتح",
  "fermer": "يغلق",
  "commencer": "يبدأ",
  "finir": "ينتهي",
  "aimer": "يحب",
  "détester": "يكره",
  "vouloir": "يريد",
  "pouvoir": "يستطيع",
  "devoir": "يجب",
  "savoir": "يعرف",
  "connaître": "يعرف (شخصًا)",
  "penser": "يفكّر",
  "croire": "يعتقد",
  "demander": "يسأل",
  "répondre": "يجيب",
  "appeler": "يتّصل",
  "rencontrer": "يلتقي",
  "voyager": "يسافر",
  "marcher": "يمشي",
  "courir": "يجري",
  "rester": "يبقى",
  "partir": "يغادر",
  "arriver": "يصل",
  "rentrer": "يعود",
  "sortir": "يخرج",
  "entrer": "يدخل",
  "monter": "يصعد",
  "descendre": "ينزل",
  // école
  "école": "مدرسة",
  "professeur": "أستاذ",
  "élève": "تلميذ",
  "étudiant": "طالب",
  "livre": "كتاب",
  "cahier": "دفتر",
  "stylo": "قلم",
  "crayon": "قلم رصاص",
  "page": "صفحة",
  "leçon": "درس",
  "exercice": "تمرين",
  "examen": "امتحان",
  "question": "سؤال",
  "réponse": "جواب",
  // maison
  "maison": "بيت",
  "appartement": "شقة",
  "chambre": "غرفة",
  "cuisine": "مطبخ",
  "salle de bain": "حمّام",
  "salon": "صالون",
  "table": "طاولة",
  "chaise": "كرسي",
  "lit": "سرير",
  "porte": "باب",
  "fenêtre": "نافذة",
  // ville / lieux
  "ville": "مدينة",
  "rue": "شارع",
  "magasin": "متجر",
  "supermarché": "متجر كبير",
  "boulangerie": "مخبزة",
  "café": "مقهى",
  "restaurant": "مطعم",
  "gare": "محطة",
  "train": "قطار",
  "bus": "حافلة",
  "voiture": "سيارة",
  "vélo": "دراجة",
  "avion": "طائرة",
  "aéroport": "مطار",
  "hôpital": "مستشفى",
  "pharmacie": "صيدلية",
  "banque": "مصرف",
  "poste": "مكتب البريد",
  "église": "كنيسة",
  "mosquée": "مسجد",
  "parc": "حديقة",
  "marché": "سوق",
  "hôtel": "فندق",
  // nourriture
  "pain": "خبز",
  "eau": "ماء",
  "lait": "حليب",
  "café (boisson)": "قهوة",
  "thé": "شاي",
  "jus": "عصير",
  "viande": "لحم",
  "poisson": "سمك",
  "poulet": "دجاج",
  "œuf": "بيض",
  "fromage": "جبن",
  "beurre": "زبدة",
  "fruit": "فاكهة",
  "légume": "خضروات",
  "pomme": "تفاحة",
  "banane": "موزة",
  "tomate": "طماطم",
  "salade": "سلطة",
  "soupe": "حساء",
  "riz": "أرز",
  "pâtes": "معكرونة",
  "sucre": "سكّر",
  "sel": "ملح",
  "petit-déjeuner": "فطور",
  "déjeuner": "غداء",
  "dîner": "عشاء",
  // temps
  "heure": "ساعة",
  "minute": "دقيقة",
  "seconde": "ثانية",
  "jour": "يوم",
  "semaine": "أسبوع",
  "mois": "شهر",
  "année": "سنة",
  "aujourd'hui": "اليوم",
  "demain": "غدًا",
  "hier": "أمس",
  "matin": "صباح",
  "midi": "ظهر",
  "après-midi": "بعد الظهر",
  "soir": "مساء",
  "nuit": "ليل",
  "lundi": "الإثنين",
  "mardi": "الثلاثاء",
  "mercredi": "الأربعاء",
  "jeudi": "الخميس",
  "vendredi": "الجمعة",
  "samedi": "السبت",
  "dimanche": "الأحد",
  // météo
  "soleil": "شمس",
  "pluie": "مطر",
  "neige": "ثلج",
  "vent": "ريح",
  "froid": "بارد",
  "chaud": "حار",
  "beau temps": "طقس جميل",
  // adjectifs
  "grand": "كبير",
  "petit": "صغير",
  "bon": "جيد",
  "mauvais": "سيّئ",
  "nouveau": "جديد",
  "vieux": "قديم",
  "jeune": "شاب",
  "beau": "جميل",
  "joli": "جميل",
  "facile": "سهل",
  "difficile": "صعب",
  "rapide": "سريع",
  "lent": "بطيء",
  "rouge": "أحمر",
  "bleu": "أزرق",
  "vert": "أخضر",
  "jaune": "أصفر",
  "noir": "أسود",
  "blanc": "أبيض",
  "gris": "رمادي",
  // nombres
  "zéro": "صفر",
  "un": "واحد",
  "deux": "اثنان",
  "trois": "ثلاثة",
  "quatre": "أربعة",
  "cinq": "خمسة",
  "six": "ستة",
  "sept": "سبعة",
  "huit": "ثمانية",
  "neuf": "تسعة",
  "dix": "عشرة",
  "vingt": "عشرون",
  "trente": "ثلاثون",
  "cent": "مئة",
  "mille": "ألف",
  // travail
  "travail": "عمل",
  "bureau": "مكتب",
  "ordinateur": "حاسوب",
  "téléphone": "هاتف",
  "argent": "مال",
  "prix": "سعر",
  "billet": "تذكرة",
  "client": "زبون",
  "vendeur": "بائع",
  "médecin": "طبيب",
  "infirmier": "ممرّض",
  // ajouts contextuels (familles, voyages, scènes)
  "petite": "صغيرة",
  "gentille": "لطيفة",
  "gentil": "لطيف",
  "frères": "إخوة",
  "sœurs": "أخوات",
  "et": "و",
  "une": "واحدة",
  "travaille": "تعمل",
  "comme": "ك",
  "enseignante": "معلّمة",
  "enseignant": "معلّم",
  "retraité": "متقاعد",
  "habitent": "يسكنون",
  "vivent": "يعيشون",
  "à": "في",
  "aussi": "أيضًا",
  "chien": "كلب",
  "ans": "سنوات",
  "s'appelle": "اسمه",
  // voyages
  "j'aime": "أحبّ",
  "beaucoup": "كثيرًا",
  "dernière": "الماضية",
  "j'étais": "كنت",
  "allemagne": "ألمانيا",
  "allé": "ذهبت",
  "visité": "زرت",
  "berlin": "برلين",
  "séjourné": "أقمت",
  "gens": "الناس",
  "étaient": "كانوا",
  "prochaine": "القادمة",
  "voudrais": "أودّ",
  "autriche": "النمسا",
  "hâte": "متشوّق",
  "déjà": "سلفًا",
  // scènes
  "chemin": "الطريق",
  "touriste": "سائحة",
  "direction": "اتجاه",
  "passant": "أحد المارة",
  "commander": "الطلب",
  "comptoir": "الكاونتر",
  "berlinois": "البرليني",
  "guichet": "الشباك",
  "munich": "ميونيخ",
  "annonce": "إعلان",
  "bord": "على متن",
  "taxi": "سيارة أجرة",
  "conversation": "محادثة",
  "chauffeur": "السائق",
  "produit": "منتج",
  "payer": "الدفع",
  "caisse": "الصندوق",
  "pâtisseries": "حلويات",
  "bulletin": "نشرة",
  "météo": "الطقس",
  "radio": "الراديو",
  "prévisions": "توقعات",
  "allemandes": "الألمانية",
  "journée": "اليوم",
  "temps": "الطقس",
  "qu'il": "الذي",
  "fait": "يكون",
  "banale": "عادية",
  "voisins": "الجيران",
  "alerte": "تنبيه",
  "orage": "عاصفة",
  "soudain": "مفاجئ",
  "horaire": "الجدول الزمني",
  "haut-parleur": "مكبّر الصوت",
  "horaires": "أوقات",
  "départ": "المغادرة",
  "retard": "تأخير",
  "rendez-vous": "موعد",
  "cabinet": "العيادة",
  "médical": "الطبية",
  "réveil": "المنبّه",
  "sonne": "يرنّ",
  "matinale": "صباحية",
  "excuse": "عذر",
  "arrive": "تصل",
  // grammaire / cours
  "alphabet": "الأبجدية",
  "salutations": "تحيات",
  "présenter": "تقديم",
  "présentation": "تقديم",
  "politesse": "أدب",
  "nombres": "الأعداد",
  "âge": "العمر",
  "couleurs": "ألوان",
  "couleur": "لون",
  "objets": "أغراض",
  "objet": "غرض",
  "quotidien": "اليومي",
  "verbes": "أفعال",
  "verbe": "فعل",
  "essentiels": "أساسية",
  "conjugaison": "تصريف",
  "présent": "حاضر",
  "grammaire": "قواعد",
  "cas": "حالات",
  "déclinaisons": "تصريفات",
  "structure": "بنية",
  "phrase": "جملة",
  "phrases": "جمل",
  "dialogues": "حوارات",
  "directions": "اتجاهات",
  "urgences": "طوارئ",
  "pronoms": "ضمائر",
  "prépositions": "حروف الجر",
  "connecteurs": "روابط",
  "lecture": "قراءة",
  "horaires complets": "جداول كاملة",
  "complets": "كاملة",
  "cours": "الدرس",
  "mots": "كلمات",
  "écoute": "استماع",
  "pratiquer": "تدرّب",
  "flashcards": "بطاقات",
  "réviser": "راجع",
  "compréhension": "فهم",
  "orale": "شفوي",
  "exporter": "تصدير",
  "imprimer": "طباعة",
  "télécharger": "تنزيل",
  "démarrer": "ابدأ",
  "tuteur": "مدرّس",
  "ia": "الذكاء الاصطناعي",
  "contexte": "سياق",
  "chapitre": "فصل",
  "unité": "وحدة",
  "module": "وحدة",
  "thématiques": "موضوعية",
  "essentiel": "أساسي",
  "bonus": "إضافي",
  "questions": "أسئلة",
  "qcm": "اختياري",
  "complétion": "تكميل",
  "prononciation": "نطق",
  "micro": "ميكروفون",
  "séquences": "تسلسلات",
  "final": "نهائي",
  "certificat": "شهادة",
  "défi": "تحدّي",
  "scènes": "مشاهد",
  "ambiance": "أجواء",
  "sonore": "صوتية",
  "tableau": "جدول",
  "maîtrise": "إتقان",
  "fiche": "ورقة",
  "révision": "مراجعة",
  "difficultés": "صعوبات",
  "programme": "برنامج",
  "complet": "كامل",
  "cliquez": "انقر",
  "sur": "على",
  "ou": "أو",
  "avec": "مع",
  "pour": "لـ",
  "sans": "بدون",
  "dans": "في",
  "par": "بـ",
  "très": "جدًا",
  "plus": "أكثر",
  "moins": "أقل",
  "tous": "الكل",
  "toutes": "الكل",
  "chaque": "كل",
  "quelques": "بعض",
  "votre": "خاصتك",
  "vos": "خاصتك",
  "mon": "خاصتي",
  "ma": "خاصتي",
  "mes": "خاصتي",
  "ce": "هذا",
  "cette": "هذه",
  "ces": "هؤلاء",
  "qui": "الذي",
  "que": "أنّ",
  "où": "أين",
  "quand": "متى",
  "comment": "كيف",
  "pourquoi": "لماذا",
  "combien": "كم",
};

// ====== Phrases multi-mots (priorité longueur) ======
// Permet de gérer expressions complexes avant le mot-à-mot.
const FR_AR_PHRASES: Record<string, string> = {
  "s'il vous plaît": "من فضلك",
  "s'il te plaît": "من فضلك",
  "au revoir": "مع السلامة",
  "bonne journée": "نهارك سعيد",
  "bonne nuit": "ليلة سعيدة",
  "à bientôt": "إلى اللقاء",
  "à demain": "إلى الغد",
  "merci beaucoup": "شكرًا جزيلًا",
  "de rien": "العفو",
  "comment ça va": "كيف الحال",
  "ça va": "بخير",
  "je m'appelle": "اسمي",
  "comment tu t'appelles": "ما اسمك",
  "j'ai faim": "أنا جائع",
  "j'ai soif": "أنا عطشان",
  "j'habite à": "أسكن في",
  "je viens de": "أنا من",
  "je voudrais": "أودّ",
  "je peux": "أستطيع",
  "je dois": "يجب عليّ",
  "je ne sais pas": "لا أعرف",
  "je ne comprends pas": "لا أفهم",
  "parlez plus lentement": "تكلّم ببطء",
  "salle de bain": "حمّام",
  "petit-déjeuner": "فطور",
  "rendez-vous": "موعد",
  "haut-parleur": "مكبّر الصوت",
  "fiche de révision": "ورقة المراجعة",
  "compréhension orale": "الفهم الشفوي",
  "examen final": "امتحان نهائي",
  "défi du jour": "تحدّي اليوم",
  "scènes hören": "مشاهد استماع",
  "programme complet": "برنامج كامل",
  "cliquez sur un chapitre": "انقر على فصل",
  "tableau de maîtrise": "جدول الإتقان",
  "lire l'heure": "قراءة الساعة",
  "horaires complets": "جداول كاملة",
  "tous les verbes": "كل الأفعال",
  "structure de phrase": "بنية الجملة",
};

/** Préserve la ponctuation finale (. , ! ? ; :) lors de la traduction. */
function splitTrailingPunct(s: string): [string, string] {
  const m = s.match(/^([\s\S]*?)([.,!?;:]+)\s*$/);
  return m ? [m[1], m[2]] : [s, ""];
}

/** Translate a French string to Arabic. Always returns a non-empty string when input is non-empty:
 *  unknown words pass through so the user always sees something under the AR flag.
 *  Améliorations : phrases multi-mots prioritaires, ponctuation conservée. */
export function translateFrToAr(fr: string): string {
  if (!fr) return "";
  const raw = fr.trim();
  if (!raw) return "";
  const [body, punct] = splitTrailingPunct(raw);
  const stripArt = (s: string) => s
    .replace(/^(le |la |les |l'|un |une |des |du |de la |de l')/i, "")
    .replace(/[.,!?;:]+$/g, "");
  const lowFull = body.toLowerCase();
  const low = stripArt(lowFull);

  // 1) Phrase exacte
  if (FR_AR_PHRASES[lowFull]) return FR_AR_PHRASES[lowFull] + punct;
  if (FR_AR_PHRASES[low]) return FR_AR_PHRASES[low] + punct;
  if (FR_AR[low]) return FR_AR[low] + punct;

  // 2) Substitutions de phrases imbriquées (longueur décroissante)
  let working = " " + lowFull + " ";
  const phrasesByLen = Object.keys(FR_AR_PHRASES).sort((a, b) => b.length - a.length);
  for (const p of phrasesByLen) {
    const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    if (re.test(working)) working = working.replace(re, ` ${FR_AR_PHRASES[p]} `);
  }

  // 3) Mot-à-mot (passthrough)
  const parts = working.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1 && !/[\u0600-\u06FF]/.test(parts[0])) {
    return (FR_AR[parts[0]] || parts[0]) + punct;
  }
  const mapped = parts.map(p => {
    if (/[\u0600-\u06FF]/.test(p)) return p; // déjà arabe
    const cleaned = p.replace(/[«»"'(),.;:!?]/g, "");
    return FR_AR[cleaned] ?? FR_AR[stripArt(cleaned)] ?? cleaned;
  });
  return mapped.filter(Boolean).join(" ") + punct;
}

/** Diagnostic : retourne true si la traduction est "complète" (au moins un mot trouvé). */
export function isArTranslationComplete(fr: string): boolean {
  if (!fr) return true;
  const ar = translateFrToAr(fr);
  // au moins un caractère arabe
  return /[\u0600-\u06FF]/.test(ar);
}
