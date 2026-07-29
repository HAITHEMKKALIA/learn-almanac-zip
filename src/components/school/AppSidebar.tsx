import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, BookOpen, GraduationCap, Users, ClipboardList, Library,
  BarChart3, MessageSquare, Settings,
  FileText, LogOut, School, Languages, NotebookPen, Sparkles, CalendarDays,
  Award, UserCheck, Baby, CreditCard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { Button } from "@/components/ui/button";
import { useI18n, type Lang } from "@/lib/i18n";
import { highestRole, ROLE_LABELS } from "@/lib/roles";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type L = { fr: string; de: string; ar: string };
type Item = { label: L; url: string; icon: LucideIcon };

const studentItems: Item[] = [
  { label: { fr: "Tableau de bord", de: "Übersicht", ar: "لوحة التحكم" }, url: "/student", icon: LayoutDashboard },
  { label: { fr: "Apprendre", de: "Lernen", ar: "تعلّم" }, url: "/learn", icon: BookOpen },
  { label: { fr: "Professeur IA", de: "KI-Lehrer", ar: "الأستاذ الذكي" }, url: "/avatar", icon: Sparkles },
  { label: { fr: "Devoirs (maison)", de: "Hausaufgaben", ar: "الواجبات المنزلية" }, url: "/student/homework", icon: NotebookPen },
  { label: { fr: "Mes examens", de: "Meine Prüfungen", ar: "امتحاناتي" }, url: "/student#assignments", icon: ClipboardList },
  { label: { fr: "Mon abonnement", de: "Mein Abo", ar: "اشتراكي" }, url: "/student/billing", icon: CreditCard },
  { label: { fr: "Mon profil", de: "Mein Profil", ar: "ملفي" }, url: "/settings", icon: Settings },
];

const teacherItems: Item[] = [
  { label: { fr: "Tableau de bord", de: "Übersicht", ar: "لوحة التحكم" }, url: "/teacher", icon: LayoutDashboard },
  { label: { fr: "Mes classes", de: "Meine Klassen", ar: "صفوفي" }, url: "/teacher/classes", icon: Users },
  { label: { fr: "Mes élèves", de: "Meine Schüler", ar: "تلاميذي" }, url: "/teacher/students", icon: GraduationCap },
  { label: { fr: "Devoirs (maison)", de: "Hausaufgaben", ar: "الواجبات المنزلية" }, url: "/teacher/homework", icon: NotebookPen },
  { label: { fr: "Examens", de: "Prüfungen", ar: "الامتحانات" }, url: "/teacher/assignments", icon: ClipboardList },
  { label: { fr: "Banque de questions", de: "Fragenbank", ar: "بنك الأسئلة" }, url: "/teacher/bank", icon: Library },
  { label: { fr: "Messages", de: "Nachrichten", ar: "الرسائل" }, url: "/messages", icon: MessageSquare },
  { label: { fr: "Mon profil", de: "Mein Profil", ar: "ملفي" }, url: "/settings", icon: Settings },
];

const adminItems: Item[] = [
  { label: { fr: "Tableau école", de: "Schul-Übersicht", ar: "لوحة المدرسة" }, url: "/school-admin", icon: School },
  { label: { fr: "Classes", de: "Klassen", ar: "الصفوف" }, url: "/school-admin/classes", icon: GraduationCap },
  { label: { fr: "Membres", de: "Mitglieder", ar: "الأعضاء" }, url: "/school-admin/teachers", icon: Users },
  { label: { fr: "Rapports", de: "Berichte", ar: "تقارير" }, url: "/school-admin/reports", icon: FileText },
  { label: { fr: "Facturation", de: "Abrechnung", ar: "الفوترة" }, url: "/school-admin/billing", icon: CreditCard },
  { label: { fr: "Paramètres", de: "Einstellungen", ar: "الإعدادات" }, url: "/school-admin/settings", icon: Settings },
];

const academicItems: Item[] = [
  { label: { fr: "Direction pédagogique", de: "Akademische Leitung", ar: "الإدارة الأكاديمية" }, url: "/academic", icon: GraduationCap },
  { label: { fr: "Bibliothèque", de: "Bibliothek", ar: "المكتبة" }, url: "/academic/content-library", icon: Library },
  { label: { fr: "Banque de questions", de: "Fragenbank", ar: "بنك الأسئلة" }, url: "/academic/question-bank", icon: ClipboardList },
  { label: { fr: "Validation IA", de: "KI-Validierung", ar: "التحقق من الذكاء الاصطناعي" }, url: "/academic/ai-validation", icon: Sparkles },
  { label: { fr: "Rapports", de: "Berichte", ar: "تقارير" }, url: "/academic/reports", icon: FileText },
];

const parentItems: Item[] = [
  { label: { fr: "Mes enfants", de: "Meine Kinder", ar: "أبنائي" }, url: "/parent", icon: Baby },
  { label: { fr: "Devoirs", de: "Hausaufgaben", ar: "الواجبات" }, url: "/parent/homework", icon: NotebookPen },
  { label: { fr: "Résultats", de: "Ergebnisse", ar: "النتائج" }, url: "/parent/results", icon: BarChart3 },
  { label: { fr: "Messages", de: "Nachrichten", ar: "الرسائل" }, url: "/parent/messages", icon: MessageSquare },
  { label: { fr: "Mon profil", de: "Mein Profil", ar: "ملفي" }, url: "/settings", icon: Settings },
];

const examinerItems: Item[] = [
  { label: { fr: "Examens à corriger", de: "Zu bewertende Prüfungen", ar: "امتحانات للتصحيح" }, url: "/teacher/assignments", icon: ClipboardList },
  { label: { fr: "Certificats", de: "Zertifikate", ar: "الشهادات" }, url: "/teacher/reports", icon: Award },
  { label: { fr: "Banque de questions", de: "Fragenbank", ar: "بنك الأسئلة" }, url: "/teacher/bank", icon: Library },
  { label: { fr: "Calendrier", de: "Kalender", ar: "التقويم" }, url: "/calendar", icon: CalendarDays },
  { label: { fr: "Mon profil", de: "Mein Profil", ar: "ملفي" }, url: "/settings", icon: Settings },
];

const studioItems: Item[] = [
  { label: { fr: "Tableau Studio", de: "Studio-Übersicht", ar: "لوحة الاستوديو" }, url: "/teacher-studio", icon: LayoutDashboard },
  { label: { fr: "Mes classes privées", de: "Meine privaten Klassen", ar: "صفوفي الخاصة" }, url: "/teacher-studio/classes", icon: GraduationCap },
  { label: { fr: "Mes élèves", de: "Meine Schüler", ar: "تلاميذي" }, url: "/teacher-studio/students", icon: Users },
  { label: { fr: "Examens", de: "Prüfungen", ar: "الامتحانات" }, url: "/teacher-studio/exams", icon: ClipboardList },
  { label: { fr: "Facturation", de: "Abrechnung", ar: "الفوترة" }, url: "/teacher-studio/billing", icon: CreditCard },
  { label: { fr: "Paramètres du studio", de: "Studio-Einstellungen", ar: "إعدادات الاستوديو" }, url: "/teacher-studio/settings", icon: Settings },
];

const soloItems: Item[] = [
  { label: { fr: "Mon tableau", de: "Übersicht", ar: "لوحتي" }, url: "/solo-student", icon: LayoutDashboard },
  { label: { fr: "Apprendre", de: "Lernen", ar: "تعلّم" }, url: "/learn", icon: BookOpen },
  { label: { fr: "Professeur IA", de: "KI-Lehrer", ar: "الأستاذ الذكي" }, url: "/avatar", icon: Sparkles },
  { label: { fr: "Wortschatz", de: "Wortschatz", ar: "المفردات" }, url: "/solo-student/wortschatz", icon: Sparkles },
  { label: { fr: "Mon parcours", de: "Mein Weg", ar: "مساري" }, url: "/solo-student/settings", icon: GraduationCap },
  { label: { fr: "Mon abonnement", de: "Mein Abo", ar: "اشتراكي" }, url: "/solo-student/billing", icon: CreditCard },
];

const groupLabels = {
  student: { fr: "Élève", de: "Schüler", ar: "تلميذ" },
  teacher: { fr: "Professeur", de: "Lehrer", ar: "أستاذ" },
  admin: { fr: "Administration", de: "Verwaltung", ar: "إدارة" },
  parent: { fr: "Parent", de: "Eltern", ar: "ولي أمر" },
  examiner: { fr: "Examinateur", de: "Prüfer", ar: "ممتحن" },
  academic: { fr: "Direction pédagogique", de: "Akademische Leitung", ar: "الإدارة الأكاديمية" },
  studio: { fr: "Mon Studio", de: "Mein Studio", ar: "استوديو" },
  solo: { fr: "Apprentissage personnel", de: "Persönliches Lernen", ar: "تعلّم شخصي" },
};

const tr = { fr: "Déconnexion", de: "Abmelden", ar: "تسجيل الخروج" };
const subtitleTr = { fr: "Académie scolaire", de: "Schulakademie", ar: "أكاديمية مدرسية" };
const langLabel = { fr: "Langue", de: "Sprache", ar: "اللغة" };

function pick(l: L, lang: Lang): string {
  if (lang === "de") return l.de;
  if (lang === "ar") return l.ar;
  if (lang === "both") return `${l.de} — ${l.fr}`;
  return l.fr;
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { pathname } = useLocation();
  const { roles, signOut, user } = useAuth();
  const { activeSpaceType, activeSchool } = useActiveSchool();
  const { lang, setLang } = useI18n();
  const collapsed = state === "collapsed";

  const isActive = (url: string) =>
    pathname === url.split("#")[0] || (url !== "/" && pathname.startsWith(url.split("#")[0] + "/"));

  const renderGroup = (label: L, items: Item[]) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] tracking-wider">{pick(label, lang)}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((it) => {
            const title = pick(it.label, lang);
            return (
              <SidebarMenuItem key={title + it.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(it.url)}
                  tooltip={collapsed ? title : undefined}
                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold hover:bg-sidebar-accent/60"
                >
                  <NavLink
                    to={it.url}
                    className="flex items-center gap-3"
                    onClick={() => { if (isMobile) setOpenMobile(false); }}
                  >
                    <it.icon className="h-4 w-4 shrink-0" />
                    {(!collapsed || isMobile) && <span className="truncate">{title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  // Strict tenant isolation: menus are driven ONLY by the active learning space
  // role. Global roles never leak into the sidebar (except platform super-admin).
  const membershipRole = activeSchool?.role === "owner"
    ? "school_admin"
    : activeSchool?.role;
  const top = roles.includes("super_admin")
    ? "super_admin"
    : (membershipRole && membershipRole in ROLE_LABELS
      ? membershipRole as keyof typeof ROLE_LABELS
      : null);
  let primary: "admin" | "teacher" | "student" | "parent" | "examiner" | "academic" | "studio" | "solo" = "student";
  if (activeSpaceType === "independent_teacher") {
    primary = "studio";
  } else if (activeSpaceType === "independent_student") {
    primary = "solo";
  } else if (top === "super_admin" || top === "admin" || top === "school_admin") {
    primary = "admin";
  } else if (top === "academic_director" || top === "pedagogical_coordinator") {
    primary = "academic";
  } else if (top === "examiner") {
    primary = "examiner";
  } else if (top === "teacher" || top === "staff") {
    primary = "teacher";
  } else if (top === "parent") {
    primary = "parent";
  }

  const roleLabel = top ? ROLE_LABELS[top] : null;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-warm grid place-items-center shrink-0 shadow-elev overflow-hidden">
            <School className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              {activeSchool?.logo_url && (
                <img
                  src={activeSchool.logo_url}
                  alt={activeSchool.name}
                  className="h-9 w-9 rounded-lg object-contain bg-white/90 shrink-0 shadow-elev"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div className="overflow-hidden">
                <div className="font-display font-bold text-sidebar-foreground leading-tight">Deutsch Meister</div>
                <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider truncate">
                  {pick(subtitleTr, lang)}{activeSchool?.name ? ` · ${activeSchool.name}` : ""}
                </div>
                {roleLabel && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[9px] text-sidebar-primary font-semibold uppercase tracking-wider">
                    <UserCheck className="h-3 w-3" />
                    {pick(roleLabel, lang)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {primary === "student" && renderGroup(groupLabels.student, studentItems)}
        {primary === "teacher" && renderGroup(groupLabels.teacher, teacherItems)}
        {primary === "admin" && renderGroup(groupLabels.admin, adminItems)}
        {primary === "parent" && renderGroup(groupLabels.parent, parentItems)}
        {primary === "examiner" && renderGroup(groupLabels.examiner, examinerItems)}
        {primary === "academic" && renderGroup(groupLabels.academic, academicItems)}
        {primary === "studio" && renderGroup(groupLabels.studio, studioItems)}
        {primary === "solo" && renderGroup(groupLabels.solo, soloItems)}
      </SidebarContent>


      <SidebarFooter className="border-t border-sidebar-border/50 p-2 space-y-2">
        {!collapsed && (
          <div className="px-1">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/60 mb-1">
              <Languages className="h-3 w-3" />
              {pick(langLabel, lang)}
            </div>
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="h-8 bg-sidebar-accent/40 border-sidebar-border/50 text-sidebar-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="ar">🇹🇳 العربية</SelectItem>
                <SelectItem value="both">DE + FR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {!collapsed && user && (
          <div className="px-2 text-xs text-sidebar-foreground/70 truncate">{user.email}</div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && pick(tr, lang)}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
