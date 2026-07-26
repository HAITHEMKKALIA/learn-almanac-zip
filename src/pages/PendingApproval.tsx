import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, LogOut, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function PendingApproval() {
  const { user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const { tt } = useI18n();

  useEffect(() => {
    if (!user) { navigate("/auth", { replace: true }); return; }
    supabase.from("profiles").select("display_name, email, approved").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        if (data?.approved) navigate("/app", { replace: true });
      });
  }, [user, navigate]);

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
                fr: "Votre accès doit être approuvé par un administrateur.",
                de: "Ihr Zugang muss von einem Administrator genehmigt werden.",
                ar: "يجب أن يوافق المسؤول على الوصول إلى حسابك.",
              })}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm bg-muted/40 rounded-lg p-4 mb-4">
          <div className="flex justify-between"><span className="text-muted-foreground">{tt({ fr: "Nom", de: "Name", ar: "الاسم" })}</span><span className="font-medium">{profile?.display_name || "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tt({ fr: "Email", de: "E-Mail", ar: "البريد الإلكتروني" })}</span><span className="font-medium">{profile?.email || user?.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{tt({ fr: "Rôles demandés", de: "Angeforderte Rollen", ar: "الأدوار المطلوبة" })}</span><span className="font-medium">{roles.join(", ") || "student"}</span></div>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">
            {tt({
              fr: "Pour des raisons de sécurité, votre compte doit être validé par l'administration de l'école avant d'accéder aux espaces protégés. Vous pouvez toujours explorer le mode public en attendant.",
              de: "Aus Sicherheitsgründen muss Ihr Konto von der Schulverwaltung bestätigt werden, bevor Sie auf geschützte Bereiche zugreifen können. Den öffentlichen Modus können Sie in der Zwischenzeit weiter erkunden.",
              ar: "لأسباب أمنية، يجب أن تتم المصادقة على حسابك من قبل إدارة المدرسة قبل الوصول إلى المساحات المحمية. يمكنك دائمًا استكشاف الوضع العام في غضون ذلك.",
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
