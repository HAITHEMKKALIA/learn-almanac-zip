import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, GraduationCap, Building2, School, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { QuoteRequestDialog } from "@/components/pricing/QuoteRequestDialog";


type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const COPY = {
  fr: {
    title: "Tarifs Deutsch Meister AI",
    subtitle: "Des offres pensées pour la Tunisie — payez en TND, sans engagement.",
    monthly: "/ mois",
    yearlyNote: "Économisez ~2 mois avec le paiement annuel",
    badge: "Le plus populaire",
    back: "← Retour",
    plans: [
      { id: "student", name: "Étudiant", price: "25 TND", period: "/ mois", tagline: "Un professeur IA personnel", icon: GraduationCap,
        features: ["IA conversationnelle", "Avatar IA et prononciation", "Exercices adaptatifs", "Parcours A1 → B2", "Certificats personnels"], cta: "Commencer" },
      { id: "teacher", name: "Professeur Indépendant", price: "79 TND", period: "/ mois", tagline: "Ton studio pédagogique privé", icon: Users, highlight: true,
        features: ["Jusqu'à 50 étudiants", "Création de cours et examens", "IA de correction", "Tableau de bord", "Classe virtuelle"], cta: "Essai gratuit" },
      { id: "small_school", name: "Petite École", price: "199 TND", period: "/ mois", tagline: "Pour une structure en croissance",  icon: School,
        features: ["Jusqu'à 200 étudiants", "10 professeurs", "Certificats", "Avatar IA et statistiques", "Communauté privée"], cta: "Choisir" },
      { id: "school", name: "École Premium", price: "399 TND", period: "/ mois", tagline: "Solution IA complète", icon: Building2,
        features: ["Jusqu'à 500 étudiants", "30 professeurs", "Toutes les fonctions IA", "Branding de l'école", "Support prioritaire et sauvegardes"], cta: "Contacter" },
      { id: "institute", name: "Institut", price: "699 TND", period: "/ mois", tagline: "Multi-campus sans limite", icon: Sparkles,
        features: ["Étudiants et professeurs illimités", "Multi-campus", "API", "Certificats personnalisés", "Tableau de bord et IA complète"], cta: "Nous parler" },
    ],
  },
  de: {
    title: "Preise Deutsch Meister AI",
    subtitle: "Für den tunesischen Markt — Zahlung in TND, jederzeit kündbar.",
    monthly: "/ Monat",
    yearlyNote: "Bei Jahreszahlung ca. 2 Monate gratis",
    badge: "Am beliebtesten",
    back: "← Zurück",
    plans: [
      { id: "student", name: "Solo-Lernender", price: "25 TND", period: "/ Monat", tagline: "Lerne Deutsch in deinem Tempo", icon: GraduationCap,
        features: ["Zugang A1 → B2", "KI-Tutor (fair use)", "Vokabelkarten, Probeprüfungen", "Digitale Zertifikate", "Installierbare App (PWA)"], cta: "Starten" },
      { id: "teacher", name: "Freier Lehrer", price: "79 TND", period: "/ Monat", tagline: "Dein privates Lehrstudio", icon: Users, highlight: true,
        features: ["Bis zu 50 Lernende", "Kurse und Prüfungen erstellen", "KI-Korrektur", "Dashboard", "Virtuelles Klassenzimmer"], cta: "Kostenlos testen" },
      { id: "small_school", name: "Kleine Schule", price: "199 TND", period: "/ Monat", tagline: "Bis zu 3 Klassen", icon: School,
        features: ["Bis zu 200 Lernende", "10 Lehrkräfte", "Zertifikate", "KI-Avatar und Statistiken", "Private Community"], cta: "Wählen" },
      { id: "school", name: "Premium-Schule", price: "399 TND", period: "/ Monat", tagline: "Komplette KI-Lösung", icon: Building2,
        features: ["Bis zu 500 Lernende", "30 Lehrkräfte", "Alle KI-Funktionen", "Schul-Branding", "Prioritätssupport und Backups"], cta: "Kontakt" },
      { id: "institute", name: "Institut", price: "699 TND", period: "/ Monat", tagline: "Multi-Standort, unbegrenzt", icon: Sparkles,
        features: ["Unbegrenzt Lernende und Lehrkräfte", "Multi-Campus", "API", "Eigene Zertifikate", "Komplettes Dashboard und KI"], cta: "Sprechen" },
    ],
  },
  ar: {
    title: "أسعار Deutsch Meister AI",
    subtitle: "عروض مصممة لتونس — الدفع بالدينار التونسي، بدون التزام.",
    monthly: "/ شهر",
    yearlyNote: "وفّر شهرين مع الدفع السنوي",
    badge: "الأكثر شعبية",
    back: "← رجوع",
    plans: [
      { id: "student", name: "تلميذ فردي", price: "25 د.ت", period: "/ شهر", tagline: "تعلّم الألمانية بإيقاعك", icon: GraduationCap,
        features: ["الوصول A1 → B2", "مدرّس ذكاء اصطناعي", "بطاقات مفردات، امتحانات تجريبية", "شهادات رقمية", "تطبيق قابل للتثبيت"], cta: "ابدأ" },
      { id: "teacher", name: "أستاذ مستقل", price: "79 د.ت", period: "/ شهر", tagline: "استوديو تعليمي خاص بك", icon: Users, highlight: true,
        features: ["حتى 50 تلميذ", "إنشاء الدروس والامتحانات", "تصحيح بالذكاء الاصطناعي", "لوحة قيادة", "فصل افتراضي"], cta: "تجربة مجانية" },
      { id: "small_school", name: "مدرسة صغيرة", price: "199 د.ت", period: "/ شهر", tagline: "حتى 3 أقسام", icon: School,
        features: ["حتى 200 تلميذ", "10 أساتذة", "شهادات", "أفاتار ذكي وإحصائيات", "مجتمع خاص"], cta: "اختر" },
      { id: "school", name: "مدرسة Premium", price: "399 د.ت", period: "/ شهر", tagline: "حل ذكاء اصطناعي كامل", icon: Building2,
        features: ["حتى 500 تلميذ", "30 أستاذاً", "كل خصائص الذكاء الاصطناعي", "هوية المدرسة", "دعم وأخذ نسخ احتياطية"], cta: "تواصل" },
      { id: "institute", name: "معهد", price: "699 د.ت", period: "/ شهر", tagline: "متعدد المواقع، بلا حدود", icon: Sparkles,
        features: ["تلاميذ وأساتذة بلا حدود", "متعدد الفروع", "API", "شهادات مخصصة", "لوحة قيادة وذكاء اصطناعي كامل"], cta: "تواصل" },
    ],
  },
} as const;

export default function Pricing() {
  const { lang } = useI18n();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = COPY[lang as keyof typeof COPY] ?? COPY.fr;
  const [quotePlan, setQuotePlan] = useState<{ id: string; label: string } | null>(null);
  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-4"><Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t.back}</Link></div>
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t.title}</h1>
          <p className="text-xl text-muted-foreground">{t.subtitle}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.yearlyNote}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {(t.plans as unknown as Plan[]).map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.id} className={`relative p-6 flex flex-col ${p.highlight ? "border-primary shadow-xl shadow-primary/20 scale-[1.02]" : ""}`}>
                {p.highlight && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{t.badge}</Badge>}
                <div className="flex items-center gap-2 mb-2"><Icon className="w-5 h-5 text-primary" /><h3 className="font-semibold">{p.name}</h3></div>
                <p className="text-xs text-muted-foreground mb-4">{p.tagline}</p>
                <div className="mb-5"><span className="text-3xl font-bold">{p.price}</span><span className="text-sm text-muted-foreground">{p.period}</span></div>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span>{f}</span></li>
                  ))}
                </ul>
                <Button variant={p.highlight ? "default" : "outline"} className="w-full" onClick={() => setQuotePlan({ id: p.id, label: p.name })}>
                  {p.cta}
                </Button>
              </Card>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-10">
          Paiement en TND : virement bancaire, chèque, ou espèces. Activation manuelle sous 24h après réception.
        </p>
      </div>
      {quotePlan && (
        <QuoteRequestDialog
          open={!!quotePlan}
          onOpenChange={(o) => !o && setQuotePlan(null)}
          plan={quotePlan.id}
          planLabel={quotePlan.label}
        />
      )}
    </div>
  );
}
