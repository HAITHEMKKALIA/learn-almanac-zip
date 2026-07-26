import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export function RequireAuth({ children, role }: { children: React.ReactNode; role?: AppRole | AppRole[] }) {
  const { user, roles, approved, loading, isAdmin, isTeacher } = useAuth();
  const loc = useLocation();
  const { tt } = useI18n();
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  if (!user) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  if (approved === false && !roles.includes("super_admin")) return <Navigate to="/pending-approval" replace />;
  if (role) {
    const need = Array.isArray(role) ? role : [role];
    if (!need.some(r => roles.includes(r))) {
      const home = isAdmin ? "/admin/school" : isTeacher ? "/teacher" : "/student";
      if (loc.pathname !== home) return <Navigate to={home} replace />;
      const noneLabel = tt({ fr: "aucun", de: "keine", ar: "لا شيء" });
      return (
        <SchoolLayout
          title={tt({ fr: "Accès refusé", de: "Zugriff verweigert", ar: "تم رفض الوصول" })}
          subtitle={tt({
            fr: "Vous n'avez pas les permissions requises pour cette page.",
            de: "Sie haben nicht die erforderlichen Berechtigungen für diese Seite.",
            ar: "ليس لديك الأذونات المطلوبة لهذه الصفحة.",
          })}
        >
          <div className="max-w-xl">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/15 text-destructive grid place-items-center"><ShieldAlert className="h-5 w-5"/></div>
                <div className="flex-1">
                  <div className="font-display font-semibold text-lg">
                    {tt({ fr: "403 — Permission refusée", de: "403 — Berechtigung verweigert", ar: "403 — تم رفض الإذن" })}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tt({
                      fr: "Cette zone est réservée aux rôles :",
                      de: "Dieser Bereich ist reserviert für die Rollen:",
                      ar: "هذه المنطقة مخصصة للأدوار:",
                    })}{" "}
                    <b>{need.join(", ")}</b>.{" "}
                    {tt({
                      fr: "Vos rôles actuels :",
                      de: "Ihre aktuellen Rollen:",
                      ar: "أدوارك الحالية:",
                    })}{" "}
                    <b>{roles.join(", ") || noneLabel}</b>.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button asChild>
                      <Link to="/student">
                        {tt({ fr: "Espace étudiant", de: "Schülerbereich", ar: "مساحة الطالب" })}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SchoolLayout>
      );
    }
  }
  return <>{children}</>;
}
