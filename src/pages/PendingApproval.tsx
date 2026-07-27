import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, LogOut, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";

type PendingProfile = {
  display_name: string | null;
  email: string | null;
  approved: boolean;
};

export default function PendingApproval() {
  const { user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PendingProfile | null>(null);
  const { tt } = useI18n();
  const { pendingRequests, refresh, loading: spacesLoading } = useActiveSchool();

  useEffect(() => {
    if (!user) { navigate("/auth", { replace: true }); return; }
    Promise.all([
      supabase.from("profiles").select("display_name, email, approved").eq("user_id", user.id).maybeSingle(),
      refresh(),
    ]).then(([{ data }]) => {
        setProfile(data);
      });
  }, [user, navigate, refresh]);

  useEffect(() => {
    if (profile?.approved && !spacesLoading && pendingRequests.length === 0) {
      navigate("/app", { replace: true });
    }
  }, [profile?.approved, pendingRequests.length, spacesLoading, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-academy-hero p-4">
      <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-card/95 backdrop-blur p-8 shadow-academy-glow">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary grid place-items-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl">
              {tt({ fr: "Compte en attente", de: "Konto ausstehend", ar: "الحساب قيد الانتظار" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tt({
                fr: "Votre accès doit être approuvé par le propriétaire de la plateforme.",
                de: "Ihr Zugang muss vom Plattform-Inhaber freigegeben werden.",
                ar: "يجب أن يوافق مالك المنصة على الوصول إلى حسابك.",
              })}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm bg-muted/40 rounded-lg p-4 mb-4">
          <div className="flex justify-between"><span className="text-muted-foreground">{tt({ fr: "Nom", de: "Name", ar: "الاسم" })}</span><span className="font-medium">{profile?.display_name || "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tt({ fr: "Email", de: "E-Mail", ar: "البريد الإلكتروني" })}</span><span className="font-medium">{profile?.email || user?.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tt({ fr: "Rôles demandés", de: "Angeforderte Rollen", ar: "الأدوار المطلوبة" })}</span><span className="font-medium">{roles.join(", ") || "student"}</span></div>
        </div>

        {pendingRequests.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium">
              {tt({ fr: "Demandes en cours", de: "Offene Anträge", ar: "الطلبات الحالية" })}
            </p>
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{request.name}</div>
                  <div className="text-xs text-muted-foreground">{request.tenant_type}</div>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  {tt({ fr: "En attente", de: "Ausstehend", ar: "قيد الانتظار" })}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">
            {tt({
              fr: "Pour protéger chaque école, aucun espace n'est accessible avant validation centrale. Vous pouvez explorer le mode public pendant l'examen de votre demande.",
              de: "Zum Schutz jeder Schule ist kein Bereich vor der zentralen Freigabe zugänglich. Während der Prüfung können Sie den öffentlichen Modus nutzen.",
              ar: "لحماية كل مدرسة، لا يمكن دخول أي مساحة قبل الموافقة المركزية. يمكنك استخدام الوضع العام أثناء مراجعة طلبك.",
            })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline" className="flex-1">
            <a href="mailto:support@deutschmeister.app"><Mail className="h-4 w-4 mr-2"/>{tt({ fr: "Contacter l'administration", de: "Verwaltung kontaktieren", ar: "الاتصال بالإدارة" })}</a>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/learn">{tt({ fr: "Mode public", de: "Öffentlicher Modus", ar: "الوضع العام" })}</Link>
          </Button>
          <Button variant="ghost" onClick={async () => { await signOut(); navigate("/auth"); }}>
            <LogOut className="h-4 w-4 mr-2"/>{tt({ fr: "Déconnexion", de: "Abmelden", ar: "تسجيل الخروج" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
