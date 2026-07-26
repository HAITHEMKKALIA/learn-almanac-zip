import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Heart, Plus, GraduationCap, Award, Bell, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type Child = {
  link_id: string;
  student_id: string;
  relationship: string;
  status: string;
  display_name: string | null;
  email: string | null;
  school_name: string | null;
  xp: number;
  level: number;
  current_streak: number;
  certificates: number;
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: links, error } = await (supabase as any)
      .from("guardian_links")
      .select("id, student_id, relationship, status, school_id")
      .eq("guardian_id", user.id);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const studentIds = (links || []).map((l: any) => l.student_id);
    if (!studentIds.length) { setChildren([]); setLoading(false); return; }

    const [profs, stats, certs, schools] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email").in("user_id", studentIds),
      (supabase as any).from("user_stats").select("user_id, xp, level, current_streak").in("user_id", studentIds),
      (supabase as any).from("certificates").select("student_id").in("student_id", studentIds).eq("status", "issued"),
      (supabase as any).from("schools").select("id, name").in("id", (links || []).map((l: any) => l.school_id).filter(Boolean)),
    ]);
    const profMap = new Map((profs.data || []).map((p: any) => [p.user_id, p]));
    const statMap = new Map((stats.data || []).map((s: any) => [s.user_id, s]));
    const certCounts = new Map<string, number>();
    (certs.data || []).forEach((c: any) => certCounts.set(c.student_id, (certCounts.get(c.student_id) || 0) + 1));
    const schoolMap = new Map((schools.data || []).map((s: any) => [s.id, s.name]));

    setChildren((links || []).map((l: any) => {
      const p = profMap.get(l.student_id) as any;
      const s = statMap.get(l.student_id) as any;
      return {
        link_id: l.id,
        student_id: l.student_id,
        relationship: l.relationship,
        status: l.status,
        display_name: p?.display_name || null,
        email: p?.email || null,
        school_name: schoolMap.get(l.school_id) || null,
        xp: s?.xp ?? 0,
        level: s?.level ?? 1,
        current_streak: s?.current_streak ?? 0,
        certificates: certCounts.get(l.student_id) || 0,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const requestLink = async () => {
    if (!user || !addEmail.trim()) return;
    setBusy(true);
    const { data: prof } = await supabase.from("profiles").select("user_id").eq("email", addEmail.trim().toLowerCase()).maybeSingle();
    if (!prof) { toast.error(tt({ fr: "Aucun élève trouvé avec cet email.", de: "Kein Schüler mit dieser E-Mail gefunden.", ar: "لم يتم العثور على طالب بهذا البريد." })); setBusy(false); return; }
    const { error } = await (supabase as any).from("guardian_links").insert({
      guardian_id: user.id,
      student_id: prof.user_id,
      relationship: "parent",
      status: "pending",
    });
    if (error) toast.error(error.message);
    else { toast.success(tt({ fr: "Demande envoyée à l'école pour validation.", de: "Anfrage zur Validierung an die Schule gesendet.", ar: "تم إرسال الطلب إلى المدرسة للتحقق." })); setAddEmail(""); load(); }
    setBusy(false);
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Espace Parent", de: "Eltern-Bereich", ar: "فضاء الوالدين" })}
      subtitle={tt({ fr: "Suivez la progression, la présence et les résultats de vos enfants.", de: "Verfolgen Sie Fortschritt, Anwesenheit und Ergebnisse Ihrer Kinder.", ar: "تابع تقدم وحضور ونتائج أبنائك." })}
      breadcrumbs={[{ label: tt({ fr: "Parent", de: "Eltern", ar: "الوالدان" }) }]}
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> {tt({ fr: "Lier un enfant", de: "Kind verknüpfen", ar: "ربط طفل" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder={tt({ fr: "Email de l'élève inscrit à une école", de: "E-Mail des an einer Schule eingeschriebenen Schülers", ar: "بريد الطالب المسجل في مدرسة" })}
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={requestLink} disabled={busy || !addEmail}>
            {tt({ fr: "Demander le lien", de: "Verknüpfung anfragen", ar: "طلب الربط" })}
          </Button>
        </CardContent>
      </Card>

      <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" /> {tt({ fr: "Mes enfants", de: "Meine Kinder", ar: "أبنائي" })} ({children.length})
      </h2>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-40" /><Skeleton className="h-40" />
        </div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Heart className="h-10 w-10 mx-auto mb-3 opacity-50" />
            {tt({ fr: "Aucun enfant lié pour le moment. Utilisez le formulaire ci-dessus pour en ajouter un.", de: "Noch keine Kinder verknüpft. Verwenden Sie das Formular oben, um eines hinzuzufügen.", ar: "لا يوجد أبناء مرتبطون بعد. استخدم النموذج أعلاه لإضافة طفل." })}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {children.map((c) => (
            <Card key={c.link_id} className={c.status !== "approved" ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">{c.display_name || c.email}</CardTitle>
                  <Badge variant={c.status === "approved" ? "default" : c.status === "pending" ? "outline" : "destructive"}>
                    {c.status === "approved" ? tt({ fr: "Validé", de: "Bestätigt", ar: "موافق" }) : c.status === "pending" ? tt({ fr: "En attente", de: "Ausstehend", ar: "قيد الانتظار" }) : tt({ fr: "Révoqué", de: "Widerrufen", ar: "ملغى" })}
                  </Badge>
                </div>
                {c.school_name && <p className="text-xs text-muted-foreground">{c.school_name}</p>}
              </CardHeader>
              <CardContent>
                {c.status === "approved" ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-lg bg-muted/40 p-3 text-center">
                        <GraduationCap className="h-4 w-4 mx-auto text-primary mb-1" />
                        <div className="text-lg font-bold">{tt({ fr: "Niv.", de: "St.", ar: "م." })} {c.level}</div>
                        <div className="text-xs text-muted-foreground">{c.xp} XP</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3 text-center">
                        <Bell className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                        <div className="text-lg font-bold">{c.current_streak}</div>
                        <div className="text-xs text-muted-foreground">{tt({ fr: "jours suivis", de: "Tage in Folge", ar: "أيام متتالية" })}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3 text-center">
                        <Award className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                        <div className="text-lg font-bold">{c.certificates}</div>
                        <div className="text-xs text-muted-foreground">{tt({ fr: "certificats", de: "Zertifikate", ar: "الشهادات" })}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to={`/messages?to=${c.student_id}`}><Bell className="h-3 w-3 mr-1" />{tt({ fr: "Messages", de: "Nachrichten", ar: "الرسائل" })}</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to={`/certificates?student=${c.student_id}`}><Award className="h-3 w-3 mr-1" />{tt({ fr: "Certificats", de: "Zertifikate", ar: "الشهادات" })}</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    {tt({ fr: "La demande est en attente de validation par l'école.", de: "Die Anfrage wartet auf Bestätigung durch die Schule.", ar: "الطلب في انتظار موافقة المدرسة." })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SchoolLayout>
  );
}
