import { Outlet, NavLink } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card } from "@/components/ui/card";
import { BookOpen, Library, GraduationCap, FileText, Sparkles, BarChart3, ClipboardList } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AcademicLayout() {
  const { tt } = useI18n();
  const items = [
    { to: "/academic", label: tt({ fr: "Dashboard", de: "Übersicht", ar: "لوحة التحكم" }), icon: BarChart3, end: true },
    { to: "/academic/curriculum", label: tt({ fr: "Curriculum", de: "Lehrplan", ar: "المنهج" }), icon: GraduationCap },
    { to: "/academic/levels", label: tt({ fr: "Niveaux", de: "Niveaus", ar: "المستويات" }), icon: BookOpen },
    { to: "/academic/content-library", label: tt({ fr: "Bibliothèque", de: "Bibliothek", ar: "المكتبة" }), icon: Library },
    { to: "/academic/kapitel", label: tt({ fr: "Kapitel", de: "Kapitel", ar: "الفصول" }), icon: BookOpen },
    { to: "/academic/vocabulary", label: tt({ fr: "Vocabulaire", de: "Wortschatz", ar: "المفردات" }), icon: Sparkles },
    { to: "/academic/question-bank", label: tt({ fr: "Questions", de: "Fragen", ar: "الأسئلة" }), icon: ClipboardList },
    { to: "/academic/exam-templates", label: tt({ fr: "Examens", de: "Prüfungen", ar: "الامتحانات" }), icon: FileText },
    { to: "/academic/ai-validation", label: tt({ fr: "Validation IA", de: "KI-Validierung", ar: "التحقق بالذكاء الاصطناعي" }), icon: Sparkles },
    { to: "/academic/reports", label: tt({ fr: "Rapports", de: "Berichte", ar: "التقارير" }), icon: BarChart3 },
  ];
  return (
    <SchoolLayout
      title={tt({ fr: "Direction pédagogique", de: "Pädagogische Leitung", ar: "الإدارة التربوية" })}
      subtitle={tt({ fr: "Curriculum, contenus et validation IA", de: "Lehrplan, Inhalte und KI-Validierung", ar: "المنهج والمحتوى والتحقق بالذكاء الاصطناعي" })}
    >
      <Card className="p-2 mb-4 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                }`
              }
            >
              <it.icon className="h-4 w-4" />{it.label}
            </NavLink>
          ))}
        </nav>
      </Card>
      <Outlet />
    </SchoolLayout>
  );
}
