import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user, roles, loading } = useAuth();
  const loc = useLocation();
  const { tt } = useI18n();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  if (!roles.includes("super_admin")) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/15 text-destructive grid place-items-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-semibold text-lg">
                {tt({ fr: "403 — Réservé Super Admin", de: "403 — Nur für Super Admin", ar: "403 — مخصص للمشرف الأعلى" })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {tt({
                  fr: "Cette zone est strictement réservée au propriétaire de la plateforme.",
                  de: "Dieser Bereich ist ausschließlich dem Plattform-Inhaber vorbehalten.",
                  ar: "هذه المنطقة مخصصة حصرياً لمالك المنصة.",
                })}
              </p>
              <Button asChild className="mt-4">
                <Link to="/app">{tt({ fr: "Retour à l'application", de: "Zurück zur App", ar: "العودة إلى التطبيق" })}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
