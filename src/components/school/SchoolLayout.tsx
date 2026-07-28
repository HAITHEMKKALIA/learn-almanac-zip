import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { NotificationsBell } from "./NotificationsBell";
import { MessagesBell } from "./MessagesBell";
import { FloatingMessenger } from "./FloatingMessenger";
import { SchoolSwitcher } from "./SchoolSwitcher";
import { AcademyMotionPage } from "@/components/academy/AcademyUI";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function SchoolLayout({ children, title, subtitle, breadcrumbs, actions }: Props) {
  const { roles } = useAuth();
  const { activeSchool, activeSpaceType } = useActiveSchool();
  const { tt } = useI18n();
  const { pathname } = useLocation();

  // Identité visuelle dynamique selon le rôle (palette, sidebar, ambiance, motion)
  const membershipRole = activeSchool?.role === "owner" ? "school_admin" : activeSchool?.role;
  const roleTheme: "school-admin" | "teacher" | "student" | "parent" | "academic" =
    roles.includes("super_admin") || membershipRole === "school_admin"
      ? "school-admin"
      : membershipRole === "academic_director" || membershipRole === "pedagogical_coordinator"
      ? "academic"
      : membershipRole === "teacher" || membershipRole === "examiner" || activeSpaceType === "independent_teacher"
      ? "teacher"
      : membershipRole === "parent"
      ? "parent"
      : "student";

  const role = membershipRole === "school_admin"
    ? tt({ fr: "Admin", de: "Admin", ar: "مسؤول" })
    : membershipRole === "academic_director" || membershipRole === "pedagogical_coordinator"
    ? tt({ fr: "Direction pédagogique", de: "Pädagogische Leitung", ar: "الإدارة التربوية" })
    : membershipRole === "examiner"
    ? tt({ fr: "Examinateur", de: "Prüfer", ar: "مُمتحِن" })
    : membershipRole === "staff"
    ? tt({ fr: "Personnel", de: "Mitarbeiter", ar: "الموظفون" })
    : membershipRole === "teacher" || activeSpaceType === "independent_teacher"
    ? tt({ fr: "Professeur", de: "Lehrer", ar: "أستاذ" })
    : membershipRole === "parent"
    ? tt({ fr: "Parent", de: "Eltern", ar: "ولي أمر" })
    : tt({ fr: "Élève", de: "Schüler", ar: "تلميذ" });
  const home = tt({ fr: "Accueil", de: "Startseite", ar: "الرئيسية" });
  const searchPh = tt({ fr: "Rechercher…", de: "Suchen…", ar: "بحث…" });

  return (
    <SidebarProvider defaultOpen={true}>
      <div data-role-theme={roleTheme} className="h-screen max-h-screen flex w-full bg-muted/30 relative overflow-hidden">
        <div className="role-ambient" aria-hidden />
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative z-[1]">
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-14 flex items-center gap-2 border-b bg-background/85 backdrop-blur-xl px-2 sm:px-4">
            <SidebarTrigger className="text-foreground shrink-0" />
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <Link to="/app" className="hover:text-foreground">{home}</Link>
              {breadcrumbs?.map((b, i) => (
                <span key={i} className="flex items-center gap-2 truncate">
                  <ChevronRight className="h-3 w-3 rtl:rotate-180 shrink-0" />
                  {b.href ? <Link to={b.href} className="hover:text-foreground truncate">{b.label}</Link> : <span className="text-foreground truncate">{b.label}</span>}
                </span>
              ))}
            </div>
            <div className="ms-auto flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="relative hidden lg:block">
                <Search className="h-4 w-4 absolute start-2.5 top-2.5 text-muted-foreground" />
                <Input placeholder={searchPh} className="h-9 ps-8 w-56 xl:w-64 bg-muted/50 border-transparent focus-visible:bg-background" />
              </div>
              <NotificationsBell />
              <MessagesBell />
              <SchoolSwitcher />
              <Badge variant="outline" className="hidden sm:inline-flex border-primary/40 text-primary bg-primary/5">{role}</Badge>
            </div>
          </header>

          {/* Page header — bandeau teinté selon le rôle */}
          {(title || actions) && (
            <div className="role-header-tint px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  {title && (
                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-balance bg-gradient-primary bg-clip-text text-transparent break-words">
                      {title}
                    </h1>
                  )}
                  {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
              </div>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 role-page-in overflow-x-hidden" key={pathname}>
            <AcademyMotionPage>{children}</AcademyMotionPage>
          </main>
        </div>
        <FloatingMessenger />
      </div>
    </SidebarProvider>
  );
}
