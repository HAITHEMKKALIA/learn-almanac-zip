import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useActiveSchool, type SpaceType } from "@/contexts/ActiveSchoolContext";
import { isSpaceAllowed } from "@/lib/spaceAccess";

type RequireAuthProps = {
  children: React.ReactNode;
  role?: AppRole | AppRole[];
  requireLegal?: boolean;
  requireSpace?: boolean;
  spaceType?: SpaceType | SpaceType[];
  spaceRole?: string | string[];
};

export function RequireAuth({
  children,
  role,
  requireLegal = true,
  requireSpace = false,
  spaceType,
  spaceRole,
}: RequireAuthProps) {
  const { user, roles, approved, legalAccepted, loading } = useAuth();
  const {
    activeSchool,
    pendingRequests,
    loading: spaceLoading,
  } = useActiveSchool();
  const loc = useLocation();
  const { tt } = useI18n();
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  if (!user) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  if (approved === false && !roles.includes("super_admin")) return <Navigate to="/pending-approval" replace />;
  if (requireLegal && legalAccepted === false && !roles.includes("super_admin")) {
    return <Navigate to="/legal-consent" replace state={{ from: loc.pathname }} />;
  }

  const isSuperAdmin = roles.includes("super_admin");
  const needsTenant = requireSpace || !!spaceType || !!spaceRole;
  if (needsTenant && !isSuperAdmin) {
    if (spaceLoading) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
    }
    if (!activeSchool) {
      return <Navigate to={pendingRequests.length > 0 ? "/pending-approval" : "/onboarding"} replace />;
    }
    const allowedTypes = spaceType
      ? (Array.isArray(spaceType) ? spaceType : [spaceType])
      : null;
    const allowedRoles = spaceRole
      ? (Array.isArray(spaceRole) ? spaceRole : [spaceRole])
      : null;
    const tenantAllowed = isSpaceAllowed(activeSchool, {
      types: allowedTypes ?? undefined,
      roles: allowedRoles ?? undefined,
    });
    if (!tenantAllowed) {
      return <Navigate to="/app" replace />;
    }
  }

  if (role) {
    const need = Array.isArray(role) ? role : [role];
    // Strict tenant isolation: the ONLY role that matters for page access is the
    // role of the currently active learning space. Global roles are ignored so a
    // user who is student in school A and teacher in school B cannot mix menus
    // or pages within the same session. Super-admin remains a platform override.
    const activeRole = activeSchool?.role === "owner" ? "school_admin" : activeSchool?.role;
    const allowed = isSuperAdmin || (activeRole ? need.includes(activeRole as AppRole) : false);
    if (!allowed) {
      if (loc.pathname !== "/app") return <Navigate to="/app" replace />;
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
