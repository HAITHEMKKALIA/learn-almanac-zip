import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, GraduationCap, Users, UserCheck,
  TreePine, ScrollText, Settings, ShieldCheck, BookOpenCheck, LogOut, Wallet, Menu,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";

export default function PlatformAdminLayout() {
  const { signOut, user } = useAuth();
  const { tt, lang, setLang } = useI18n();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  const langs: { code: "fr" | "de" | "ar"; label: string }[] = [
    { code: "de", label: "DE" },
    { code: "fr", label: "FR" },
    { code: "ar", label: "AR" },
  ];
  const items = [
    { to: "/platform-admin", label: tt({ fr: "Dashboard", de: "Übersicht", ar: "لوحة التحكم" }), icon: LayoutDashboard, end: true },
    { to: "/platform-admin/schools", label: tt({ fr: "Écoles", de: "Schulen", ar: "المدارس" }), icon: Building2 },
    { to: "/platform-admin/classes", label: tt({ fr: "Classes", de: "Klassen", ar: "الفصول" }), icon: BookOpenCheck },
    { to: "/platform-admin/teachers", label: tt({ fr: "Professeurs", de: "Lehrkräfte", ar: "المعلمون" }), icon: GraduationCap },
    { to: "/platform-admin/students", label: tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" }), icon: Users },
    { to: "/platform-admin/approvals", label: tt({ fr: "Approbations", de: "Genehmigungen", ar: "الموافقات" }), icon: UserCheck },
    { to: "/platform-admin/structure", label: tt({ fr: "Structure", de: "Struktur", ar: "الهيكل" }), icon: TreePine },
    { to: "/platform-admin/audit", label: tt({ fr: "Audit", de: "Audit", ar: "السجلات" }), icon: ScrollText },
    { to: "/platform-admin/billing", label: tt({ fr: "Facturation", de: "Abrechnung", ar: "الفوترة" }), icon: Wallet },
    { to: "/platform-admin/gdpr", label: tt({ fr: "RGPD", de: "DSGVO", ar: "GDPR" }), icon: ShieldCheck },
    { to: "/platform-admin/settings", label: tt({ fr: "Paramètres", de: "Einstellungen", ar: "الإعدادات" }), icon: Settings },
  ];

  const SidebarInner = (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-bold leading-tight">Platform Admin</div>
            <div className="text-[11px] text-slate-400">Deutsch Meister</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-white border border-cyan-400/30"
                  : "text-slate-300 hover:bg-white/5"
              }`
            }
          >
            <it.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10 text-xs text-slate-400 space-y-2">
        <div className="flex gap-1">
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition ${
                lang === l.code
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="truncate">{user?.email}</div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/5" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> {tt({ fr: "Déconnexion", de: "Abmelden", ar: "تسجيل الخروج" })}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex w-full overflow-visible bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden">
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-border flex-col h-full">

        {SidebarInner}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh] overflow-visible lg:min-h-0 lg:overflow-hidden">
        <header className="sticky top-0 lg:hidden z-30 flex shrink-0 items-center gap-2 min-h-14 px-3 border-b border-border bg-slate-900 text-slate-100 pt-[env(safe-area-inset-top)]">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-100 hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[min(84vw,18rem)] h-[100dvh] bg-slate-900 border-r border-white/10">
              {SidebarInner}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="font-display font-semibold text-sm">Platform Admin</div>
          </div>
        </header>

        <main data-mobile-scroll className="flex-1 min-w-0 overflow-x-hidden overflow-y-visible touch-pan-y pb-[env(safe-area-inset-bottom)] [-webkit-overflow-scrolling:touch] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          <div key={loc.pathname} className="animate-in fade-in duration-200 min-w-0 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
