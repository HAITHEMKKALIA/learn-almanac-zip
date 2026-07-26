// Deutsch Meister — Cinematic Academy UI · Landing 2026
// Premium dark hero + role sections + A1→B2 timeline + final CTA.
// Conserve i18n FR/DE/AR, n'altère aucune route, additif.
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, BookOpen, ShieldCheck, Sparkles, ArrowRight, Languages,
  School, Users, ClipboardCheck, Award, Brain, BarChart3, MessageSquare, Mic,
  PlayCircle, ChevronRight,
} from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AcademyBadge, AcademyCard, AcademyFeatureCard, AcademyGlassPanel, AcademyLevelCard,
  AcademyMetricCard, AcademyProgressRing, AcademyRoleCard, AcademyStatGrid, AcademyStatItem,
} from "@/components/academy/AcademyUI";
import { fadeIn, slideUp, slideLeft, staggerContainer, staggerItem, useReducedMotionSafe } from "@/lib/motion";

type L = { fr: string; de: string; ar: string };
const pick = (l: L, lang: Lang) => {
  if (lang === "de") return l.de;
  if (lang === "ar") return l.ar;
  if (lang === "both") return `${l.de} — ${l.fr}`;
  return l.fr;
};

const T = {
  heroTitle:    { fr: "Deutsch Meister", de: "Deutsch Meister", ar: "دويتش مايستر" },
  heroLead:     {
    fr: "La plateforme intelligente pour apprendre, enseigner et gérer l'allemand de A1 à B2.",
    de: "Die intelligente Plattform zum Lernen, Lehren und Verwalten von Deutsch A1 bis B2.",
    ar: "المنصة الذكية لتعلّم وتعليم وإدارة اللغة الألمانية من A1 إلى B2.",
  },
  heroSub: {
    fr: "Écoles, professeurs et élèves dans un seul espace moderne : cours, devoirs, examens, présence, IA, progression et certificats.",
    de: "Schulen, Lehrkräfte und Schüler in einem modernen Raum: Kurse, Aufgaben, Prüfungen, Anwesenheit, KI, Fortschritt und Zertifikate.",
    ar: "المدارس والأساتذة والتلاميذ في فضاء حديث واحد: دروس وواجبات وامتحانات وحضور وذكاء اصطناعي وتقدّم وشهادات.",
  },
  start:      { fr: "Commencer", de: "Loslegen", ar: "ابدأ" },
  demoSchool: { fr: "Voir la démo école", de: "Schul-Demo ansehen", ar: "عرض المدرسة" },
  skip:       { fr: "Passer l'intro", de: "Intro überspringen", ar: "تخطّي المقدمة" },
  language:   { fr: "Langue", de: "Sprache", ar: "اللغة" },

  schoolsTitle: { fr: "Une plateforme complète pour les écoles", de: "Eine vollständige Plattform für Schulen", ar: "منصة متكاملة للمدارس" },
  schoolsLead:  { fr: "Gérez plusieurs écoles, classes, sessions, professeurs et élèves depuis un seul tableau de bord.", de: "Verwalten Sie mehrere Schulen, Klassen, Sessions, Lehrkräfte und Schüler von einem Dashboard aus.", ar: "أدر عدة مدارس وصفوف ودورات وأساتذة وتلاميذ من لوحة واحدة." },

  teachersTitle: { fr: "Un espace puissant pour les professeurs", de: "Ein leistungsstarker Bereich für Lehrkräfte", ar: "فضاء قوي للأساتذة" },
  teachersLead:  { fr: "Préparez les cours, donnez les devoirs, corrigez avec l'IA et suivez la progression de chaque élève.", de: "Bereiten Sie Kurse vor, geben Sie Aufgaben, korrigieren Sie mit KI und verfolgen Sie jeden Schüler.", ar: "حضّر الدروس وكلّف الواجبات وصحّح بالذكاء الاصطناعي وتابع تقدّم كل تلميذ." },

  studentsTitle: { fr: "Un parcours motivant pour les élèves", de: "Ein motivierender Lernweg für Schüler", ar: "مسار تحفيزي للتلاميذ" },
  studentsLead:  { fr: "Apprenez l'allemand étape par étape avec cours interactifs, flashcards, oral, devoirs, révisions et examens.", de: "Lernen Sie Schritt für Schritt mit interaktiven Kursen, Flashcards, Sprechen, Aufgaben, Wiederholung und Prüfungen.", ar: "تعلّم الألمانية خطوة بخطوة مع دروس تفاعلية وبطاقات ومحادثة وواجبات ومراجعات وامتحانات." },

  pathTitle:  { fr: "Parcours A1.1 → B2.2", de: "Lernpfad A1.1 → B2.2", ar: "المسار A1.1 → B2.2" },
  ctaTitle:   { fr: "Prêt à transformer l'apprentissage de l'allemand ?", de: "Bereit, das Deutschlernen zu transformieren?", ar: "هل أنت مستعد لتحويل تعلّم الألمانية؟" },
  ctaLead:    { fr: "Rejoignez les écoles qui modernisent leur enseignement avec Deutsch Meister.", de: "Schließen Sie sich Schulen an, die ihren Unterricht modernisieren.", ar: "انضم إلى المدارس التي تطوّر تعليمها." },
};

const LEVELS: { code: string; title: L; lessons: number; skills: string[] }[] = [
  { code: "A1.1", title: { fr: "Premiers pas", de: "Erste Schritte", ar: "الخطوات الأولى" }, lessons: 12, skills: ["Hören", "Wortschatz"] },
  { code: "A1.2", title: { fr: "Conversations simples", de: "Einfache Gespräche", ar: "محادثات بسيطة" }, lessons: 14, skills: ["Sprechen", "Lesen"] },
  { code: "A2.1", title: { fr: "Vie quotidienne", de: "Alltag", ar: "الحياة اليومية" }, lessons: 16, skills: ["Schreiben", "Grammatik"] },
  { code: "A2.2", title: { fr: "Échanges courants", de: "Alltagsdialoge", ar: "تبادلات يومية" }, lessons: 16, skills: ["Hören", "Sprechen"] },
  { code: "B1.1", title: { fr: "Autonomie", de: "Selbstständigkeit", ar: "الاستقلالية" }, lessons: 18, skills: ["Lesen", "Schreiben"] },
  { code: "B1.2", title: { fr: "Expression libre", de: "Freie Ausdrucksweise", ar: "التعبير الحرّ" }, lessons: 18, skills: ["Grammatik", "Sprechen"] },
  { code: "B2.1", title: { fr: "Argumentation", de: "Argumentation", ar: "الحجاج" }, lessons: 20, skills: ["Schreiben", "Lesen"] },
  { code: "B2.2", title: { fr: "Maîtrise", de: "Beherrschung", ar: "الإتقان" }, lessons: 20, skills: ["Hören", "Sprechen", "Schreiben"] },
];

export default function Landing() {
  const { lang, setLang } = useI18n();
  const reduced = useReducedMotionSafe();
  const [introDone, setIntroDone] = useState<boolean>(true);

  useEffect(() => {
    if (reduced) { setIntroDone(true); return; }
    const seen = typeof window !== "undefined" ? localStorage.getItem("dm:intro_seen") : "1";
    setIntroDone(!!seen);
  }, [reduced]);

  const skipIntro = () => {
    try { localStorage.setItem("dm:intro_seen", "1"); } catch { /* noop */ }
    setIntroDone(true);
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="academy-bg min-h-dvh academy-text-primary overflow-x-hidden">
      {/* Cinematic intro overlay */}
      {!introDone && (
        <motion.div
          initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.6, delay: 3.4 }}
          onAnimationComplete={skipIntro}
          className="fixed inset-0 z-[60] academy-bg grid place-items-center"
        >
          <div className="text-center space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
              className="mx-auto h-14 w-14 rounded-2xl bg-academy-glow grid place-items-center shadow-academy-glow">
              <GraduationCap className="h-7 w-7 text-white" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="font-display text-2xl font-bold tracking-tight">Deutsch Meister</motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="font-mono text-xs academy-text-muted tracking-[0.3em]">A1 · A2 · B1 · B2</motion.div>
            <button onClick={skipIntro} className="mt-6 text-xs academy-text-muted hover:academy-text-primary underline-offset-4 hover:underline">
              {pick(T.skip, lang)}
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-academy-glow grid place-items-center shadow-academy-glow">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg">Deutsch Meister</span>
        </Link>
        <div className="flex items-center gap-3">
          <Languages className="h-4 w-4 academy-text-muted hidden sm:block" />
          <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <SelectTrigger className="h-9 w-[140px] bg-white/5 border-white/10 text-white hover:bg-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="ar">🇹🇳 العربية</SelectItem>
              <SelectItem value="both">DE + FR</SelectItem>
            </SelectContent>
          </Select>
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-sm border border-white/10"
          >
            {pick({ fr: "Se connecter", de: "Anmelden", ar: "تسجيل الدخول" }, lang)}
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div aria-hidden className="absolute inset-0 bg-academy-hero" />
        <div aria-hidden className="absolute inset-0 academy-grid opacity-[0.25]" />
        <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 h-[480px] w-[900px] rounded-full bg-academy-glow opacity-20 blur-3xl academy-glow-blob" />

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={fadeIn}>
              <AcademyBadge tone="info">
                <Sparkles className="h-3 w-3" /> Cinematic Academy UI · 2026
              </AcademyBadge>
            </motion.div>
            <motion.h1 variants={slideUp}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-balance">
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-[hsl(var(--academy-accent))]">
                {pick(T.heroTitle, lang)}
              </span>
            </motion.h1>
            <motion.p variants={slideUp} className="text-lg md:text-xl academy-text-muted max-w-xl text-balance">
              {pick(T.heroLead, lang)}
            </motion.p>
            <motion.p variants={fadeIn} className="text-sm academy-text-muted max-w-xl">
              {pick(T.heroSub, lang)}
            </motion.p>
            <motion.div variants={slideUp} className="flex flex-wrap gap-3 pt-2">
              <Link to="/auth"
                className="group inline-flex items-center gap-2 rounded-xl bg-academy-glow px-5 py-3 font-semibold text-white shadow-academy-glow hover:brightness-110 transition">
                {pick(T.start, lang)}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/admin/school"
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 font-medium">
                <PlayCircle className="h-4 w-4" /> {pick(T.demoSchool, lang)}
              </Link>
              <Link to="/learn"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm academy-text-muted hover:academy-text-primary">
                {pick({ fr: "Découvrir les cours", de: "Kurse entdecken", ar: "اكتشف الدروس" }, lang)}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — floating mini dashboard */}
          <motion.div variants={slideLeft} initial="hidden" animate="show" className="relative">
            <div aria-hidden className="absolute -inset-6 bg-academy-glow opacity-20 blur-3xl rounded-3xl academy-glow-blob" />
            <AcademyGlassPanel className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--academy-success))]" />
                  <span className="text-xs academy-text-muted">Live dashboard · École Berlin</span>
                </div>
                <AcademyBadge tone="success">+12%</AcademyBadge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["A1", "A2", "B1", "B2"].map((lvl, i) => (
                  <motion.div key={lvl}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i*0.08 }}
                    className="col-span-1 rounded-xl bg-white/5 border border-white/10 p-3"
                  >
                    <div className="text-[10px] academy-text-muted">{lvl}</div>
                    <div className="font-display text-xl font-bold">{[78, 64, 42, 18][i]}%</div>
                  </motion.div>
                ))}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
                  className="col-span-3 row-span-1 flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 p-3">
                  <AcademyProgressRing value={72} size={72} stroke={7} />
                  <div className="flex-1">
                    <div className="text-xs academy-text-muted">Progression école</div>
                    <div className="font-display text-lg font-semibold">348 / 480 leçons</div>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-white/5 p-2"><div className="academy-text-muted">Élèves</div><div className="font-semibold">412</div></div>
                <div className="rounded-lg bg-white/5 p-2"><div className="academy-text-muted">Profs</div><div className="font-semibold">18</div></div>
                <div className="rounded-lg bg-white/5 p-2"><div className="academy-text-muted">Présence</div><div className="font-semibold">94%</div></div>
              </div>
            </AcademyGlassPanel>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <AcademyStatGrid>
          <AcademyStatItem><AcademyMetricCard label="Niveaux CEFR" value="A1 → B2" hint="8 sous-niveaux" icon={<BookOpen className="h-4 w-4" />} accent="primary" /></AcademyStatItem>
          <AcademyStatItem><AcademyMetricCard label="Multi-écoles" value="∞" hint="Sessions, classes, équipes" icon={<School className="h-4 w-4" />} accent="accent" /></AcademyStatItem>
          <AcademyStatItem><AcademyMetricCard label="IA pédagogique" value="24/7" hint="Correction & génération" icon={<Brain className="h-4 w-4" />} accent="warning" /></AcademyStatItem>
          <AcademyStatItem><AcademyMetricCard label="Certificats" value="vérifiables" hint="QR public" icon={<Award className="h-4 w-4" />} accent="success" /></AcademyStatItem>
        </AcademyStatGrid>
      </section>

      {/* ÉCOLES */}
      <Section title={pick(T.schoolsTitle, lang)} lead={pick(T.schoolsLead, lang)} kicker="Pour les écoles">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <AcademyFeatureCard icon={<School className="h-5 w-5" />} title="Multi-écoles" description="Tableau central pour gérer plusieurs établissements." />
          <AcademyFeatureCard icon={<Users className="h-5 w-5" />} title="Classes & sessions" description="Années scolaires, semestres, niveaux CEFR." />
          <AcademyFeatureCard icon={<ClipboardCheck className="h-5 w-5" />} title="Présence" description="Sessions de présence formelles et rapports." />
          <AcademyFeatureCard icon={<BarChart3 className="h-5 w-5" />} title="Rapports" description="Progression, attendance, badges, certifications." />
          <AcademyFeatureCard icon={<Award className="h-5 w-5" />} title="Certificats" description="Émission numérotée et vérification publique." />
        </motion.div>
      </Section>

      {/* PROFS */}
      <Section title={pick(T.teachersTitle, lang)} lead={pick(T.teachersLead, lang)} kicker="Pour les professeurs">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 md:grid-cols-3">
          <AcademyRoleCard icon={<Users className="h-5 w-5" />} title="Mes classes" subtitle="Vue d'ensemble + détail élève" accent="primary"
            items={["Devoirs personnalisés", "Banque de questions", "Examens surveillés"]} />
          <AcademyRoleCard icon={<Brain className="h-5 w-5" />} title="Correction IA" subtitle="Assistant pédagogique contrôlé" accent="accent"
            items={["Génération validée draft → publié", "Quotas par école", "Logs d'audit"]} />
          <AcademyRoleCard icon={<BarChart3 className="h-5 w-5" />} title="Élèves en difficulté" subtitle="Signaux et recommandations" accent="warning"
            items={["Présence basse", "XP en baisse", "Devoirs en retard"]} />
        </motion.div>
      </Section>

      {/* ÉLÈVES */}
      <Section title={pick(T.studentsTitle, lang)} lead={pick(T.studentsLead, lang)} kicker="Pour les élèves">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AcademyFeatureCard icon={<BookOpen className="h-5 w-5" />} title="Cours interactifs" description="Lecture, écoute, vocabulaire, grammaire." />
          <AcademyFeatureCard icon={<BarChart3 className="h-5 w-5" />} title="Progression" description="XP, streak, niveau et badges synchronisés." />
          <AcademyFeatureCard icon={<Sparkles className="h-5 w-5" />} title="Flashcards" description="Wortschatz avec répétition espacée." />
          <AcademyFeatureCard icon={<Mic className="h-5 w-5" />} title="Oral IA" description="Pratique de la prononciation accompagnée." />
          <AcademyFeatureCard icon={<MessageSquare className="h-5 w-5" />} title="Messagerie" description="Dialogue direct avec le professeur." />
          <AcademyFeatureCard icon={<Award className="h-5 w-5" />} title="Certificats" description="Vérifiables publiquement avec un numéro." />
        </motion.div>
      </Section>

      {/* PARCOURS A1→B2 */}
      <Section title={pick(T.pathTitle, lang)} lead="Hören · Lesen · Sprechen · Schreiben · Grammatik · Wortschatz" kicker="Parcours CEFR">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((l) => (
            <AcademyLevelCard key={l.code} code={l.code} title={pick(l.title, lang)} lessons={l.lessons} skills={l.skills} />
          ))}
        </motion.div>
      </Section>

      {/* SÉCURITÉ */}
      <Section title="Sécurité, confidentialité et audit" lead="RLS Postgres, rôles isolés, logs d'audit, vérification publique de certificats." kicker="Conformité">
        <div className="grid gap-4 md:grid-cols-3">
          <AcademyFeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="RLS stricte" description="Chaque table protégée par règles d'accès Postgres." />
          <AcademyFeatureCard icon={<Brain className="h-5 w-5" />} title="IA cadrée" description="Quotas, validation draft→publié, traçabilité complète." />
          <AcademyFeatureCard icon={<Award className="h-5 w-5" />} title="Certificats vérifiables" description="Numérotation unique + page publique /verify/:numéro." />
        </div>
      </Section>

      {/* CTA FINAL */}
      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border academy-border bg-academy-card p-10 md:p-14 text-center">
          <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 h-72 w-[600px] bg-academy-glow opacity-25 blur-3xl academy-glow-blob" />
          <motion.h2 variants={slideUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative font-display text-3xl md:text-5xl font-bold text-balance">
            {pick(T.ctaTitle, lang)}
          </motion.h2>
          <motion.p variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative mt-4 text-base md:text-lg academy-text-muted max-w-2xl mx-auto">
            {pick(T.ctaLead, lang)}
          </motion.p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-academy-glow px-6 py-3 font-semibold text-white shadow-academy-glow hover:brightness-110 transition">
              {pick(T.start, lang)} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 font-medium">
              {pick({ fr: "Tester un cours", de: "Kurs testen", ar: "جرّب درسًا" }, lang)}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-xs academy-text-muted">
        <div>© {new Date().getFullYear()} Deutsch Meister · Cinematic Academy UI</div>
        <div className="flex items-center gap-4">
          <Link to="/learn" className="hover:academy-text-primary">Cours</Link>
          <Link to="/auth" className="hover:academy-text-primary">Connexion</Link>
          <Link to="/verify/CERT-XXXXXXXX" className="hover:academy-text-primary">Vérifier un certificat</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, lead, kicker, children }: { title: string; lead?: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-16">
      <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
        className="mb-8 max-w-3xl space-y-3">
        {kicker && <motion.div variants={fadeIn}><AcademyBadge tone="info">{kicker}</AcademyBadge></motion.div>}
        <motion.h2 variants={slideUp} className="font-display text-3xl md:text-4xl font-bold tracking-tight text-balance">{title}</motion.h2>
        {lead && <motion.p variants={fadeIn} className="academy-text-muted text-base md:text-lg text-balance">{lead}</motion.p>}
      </motion.div>
      {children}
    </section>
  );
}
