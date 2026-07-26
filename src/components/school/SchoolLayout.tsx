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
// NotificationsBell deprecated; merged into MessagesBell (Phase 1)
import { MessagesBell } from "./MessagesBell";
import { FloatingMessenger } from "./FloatingMessenger";
import { SchoolSwitcher } from "./SchoolSwitcher";
import { AcademyMotionPage } from "@/components/academy/AcademyUI";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function SchoolLayout({ children, title, subtitle, breadcrumbs, actions }: Props) {
  const { roles } = useAuth();
  const { tt } = useI18n();
  const { pathname } = useLocation();

  // Identité visuelle dynamique selon le rôle (palette, sidebar, ambiance, motion)
  const roleTheme: "school-admin" | "teacher" | "student" | "parent" | "academic" =
    roles.includes("super_admin") || roles.includes("admin") || roles.includes("school_admin")
      ? "school-admin"
      : roles.includes("academic_director") || roles.includes("pedagogical_coordinator")
      ? "academic"
      : roles.includes("teacher") || roles.includes("examiner")
      ? "teacher"
      : roles.includes("parent")
      ? "parent"
      : "student";

  const role = roles.includes("admin") || roles.includes("school_admin")
    ? tt({ fr: "Admin", de: "Admin", ar: "مسؤول" })
    : roles.includes("teacher")
    ? tt({ fr: "Professeur", de: "Lehrer", ar: "أستاذ" })
    : roles.includes("parent")
    ? tt({ fr: "Parent", de: "Eltern", ar: "ولي أمر" })
    : tt({ fr: "Élève", de: "Schüler", ar: "تلميذ" });
  const home = tt({ fr: "Accueil", de: "Startseite", ar: "الرئيسية" });
  const searchPh = tt({ fr: "Rechercher…", de: "Suchen…", ar: "بحث…" });

  return (
    <SidebarProvider defaultOpen={true}>
      <div data-role-theme={roleTheme} className="min-h-screen flex w-full bg-muted/30 relative">
        <div className="role-ambient" aria-hidden />
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 relative z-[1]">
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b bg-background/85 backdrop-blur-xl px-4">
            <SidebarTrigger className="text-foreground" />
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/app" className="hover:text-foreground">{home}</Link>
              {breadcrumbs?.map((b, i) => (
                <span key={i} className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                  {b.href ? <Link to={b.href} className="hover:text-foreground">{b.label}</Link> : <span className="text-foreground">{b.label}</span>}
                </span>
              ))}
            </div>
            <div className="ms-auto flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="h-4 w-4 absolute start-2.5 top-2.5 text-muted-foreground" />
                <Input placeholder={searchPh} className="h-9 ps-8 w-64 bg-muted/50 border-transparent focus-visible:bg-background" />
              </div>
              <MessagesBell />
              <SchoolSwitcher />
              <Badge variant="outline" className="hidden sm:inline-flex border-primary/40 text-primary bg-primary/5">{role}</Badge>
            </div>
          </header>

          {/* Page header — bandeau teinté selon le rôle */}
          {(title || actions) && (
            <div className="role-header-tint px-6 py-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  {title && (
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-balance bg-gradient-primary bg-clip-text text-transparent">
                      {title}
                    </h1>
                  )}
                  {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
              </div>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 role-page-in" key={pathname}>
            <AcademyMotionPage>{children}</AcademyMotionPage>
          </main>
        </div>
        <FloatingMessenger />
      </div>
    </SidebarProvider>
  );
}
