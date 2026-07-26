import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, GraduationCap, BookOpenCheck, UserCheck, ScrollText, ShieldAlert, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { AIQuotaWidget } from "@/components/school/AIQuotaWidget";
import { useI18n } from "@/lib/i18n";

type Stats = {
  schools: number;
  schoolsActive: number;
  schoolsPending: number;
  schoolsSuspended: number;
  classes: number;
  teachers: number;
  students: number;
  pendingApprovals: number;
  certificates: number;
};

function Kpi({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className="text-3xl font-display font-bold mt-1">{value}</div>
        </div>
        <div className={`h-10 w-10 rounded-xl grid place-items-center ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function PlatformDashboard() {
  const { tt } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const [
        schoolsAll, schoolsActive, schoolsPending, schoolsSuspended,
        classes, teachers, students, pending, certs, recentSchools,
      ] = await Promise.all([
        sb.from("schools").select("id", { count: "exact", head: true }),
        sb.from("schools").select("id", { count: "exact", head: true }).eq("status", "active"),
        sb.from("schools").select("id", { count: "exact", head: true }).eq("status", "pending"),
        sb.from("schools").select("id", { count: "exact", head: true }).eq("status", "suspended"),
        sb.from("classes").select("id", { count: "exact", head: true }),
        sb.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "teacher"),
        sb.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
        sb.from("profiles").select("user_id", { count: "exact", head: true }).eq("approved", false),
        sb.from("certificates").select("id", { count: "exact", head: true }).eq("status", "issued"),
        sb.from("schools").select("id,name,city,status,created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      setStats({
        schools: schoolsAll.count ?? 0,
        schoolsActive: schoolsActive.count ?? 0,
        schoolsPending: schoolsPending.count ?? 0,
        schoolsSuspended: schoolsSuspended.count ?? 0,
        classes: classes.count ?? 0,
        teachers: teachers.count ?? 0,
        students: students.count ?? 0,
        pendingApprovals: pending.count ?? 0,
        certificates: certs.count ?? 0,
      });
      setRecent(recentSchools.data || []);
    })();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-medium mb-3">
          <Activity className="h-3 w-3" /> {tt({ fr: "Vue plateforme globale", de: "Globale Plattformansicht", ar: "عرض المنصة الشامل" })}
        </div>
        <h1 className="text-3xl font-display font-bold">{tt({ fr: "Dashboard Super Admin", de: "Super-Admin Übersicht", ar: "لوحة المشرف العام" })}</h1>
        <p className="text-muted-foreground mt-1">{tt({ fr: "Vue d'ensemble de toutes les écoles, classes, professeurs et élèves.", de: "Übersicht aller Schulen, Klassen, Lehrkräfte und Schüler.", ar: "نظرة عامة على جميع المدارس والفصول والمعلمين والطلاب." })}</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Building2} label={tt({ fr: "Écoles", de: "Schulen", ar: "المدارس" })} value={stats?.schools ?? "…"} accent="bg-blue-500/15 text-blue-600" />
        <Kpi icon={Activity} label={tt({ fr: "Écoles actives", de: "Aktive Schulen", ar: "مدارس نشطة" })} value={stats?.schoolsActive ?? "…"} accent="bg-emerald-500/15 text-emerald-600" />
        <Kpi icon={ShieldAlert} label={tt({ fr: "En attente", de: "Ausstehend", ar: "قيد الانتظار" })} value={stats?.schoolsPending ?? "…"} accent="bg-amber-500/15 text-amber-600" />
        <Kpi icon={ShieldAlert} label={tt({ fr: "Suspendues", de: "Gesperrt", ar: "موقوفة" })} value={stats?.schoolsSuspended ?? "…"} accent="bg-rose-500/15 text-rose-600" />
        <Kpi icon={BookOpenCheck} label={tt({ fr: "Classes", de: "Klassen", ar: "الفصول" })} value={stats?.classes ?? "…"} accent="bg-indigo-500/15 text-indigo-600" />
        <Kpi icon={GraduationCap} label={tt({ fr: "Professeurs", de: "Lehrkräfte", ar: "المعلمون" })} value={stats?.teachers ?? "…"} accent="bg-violet-500/15 text-violet-600" />
        <Kpi icon={Users} label={tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" })} value={stats?.students ?? "…"} accent="bg-cyan-500/15 text-cyan-600" />
        <Kpi icon={UserCheck} label={tt({ fr: "Approbations", de: "Genehmigungen", ar: "الموافقات" })} value={stats?.pendingApprovals ?? "…"} accent="bg-orange-500/15 text-orange-600" />
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <AIQuotaWidget scope="platform" title={tt({ fr: "Quota IA plateforme aujourd'hui", de: "KI-Kontingent Plattform heute", ar: "حصة الذكاء الاصطناعي للمنصة اليوم" })} />
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">{tt({ fr: "Dernières écoles", de: "Neueste Schulen", ar: "أحدث المدارس" })}</h2>
            <Link to="/platform-admin/schools" className="text-xs text-primary hover:underline">{tt({ fr: "Tout voir →", de: "Alle anzeigen →", ar: "عرض الكل ←" })}</Link>
          </div>
          <div className="divide-y">
            {recent.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">{tt({ fr: "Aucune école pour le moment.", de: "Noch keine Schulen.", ar: "لا توجد مدارس بعد." })}</div>}
            {recent.map((s) => (
              <Link key={s.id} to={`/platform-admin/schools/${s.id}`} className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 -mx-2 rounded">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.city || "—"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === "active" ? "bg-emerald-500/15 text-emerald-700" :
                    s.status === "pending" ? "bg-amber-500/15 text-amber-700" :
                    s.status === "suspended" ? "bg-rose-500/15 text-rose-700" :
                    "bg-slate-500/15 text-slate-700"
                  }`}>{s.status}</span>
                  <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-display font-semibold text-lg mb-4">{tt({ fr: "Actions rapides", de: "Schnellaktionen", ar: "إجراءات سريعة" })}</h2>
          <div className="space-y-2">
            <Link to="/platform-admin/schools/new" className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/40 transition">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div><div className="font-medium text-sm">{tt({ fr: "Créer une école", de: "Schule erstellen", ar: "إنشاء مدرسة" })}</div><div className="text-xs text-muted-foreground">{tt({ fr: "Nouvel espace tenant", de: "Neuer Mandantenbereich", ar: "مساحة مستأجر جديدة" })}</div></div>
            </Link>
            <Link to="/platform-admin/approvals" className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/40 transition">
              <UserCheck className="h-5 w-5 text-orange-600" />
              <div><div className="font-medium text-sm">{tt({ fr: "Approbations", de: "Genehmigungen", ar: "الموافقات" })}</div><div className="text-xs text-muted-foreground">{stats?.pendingApprovals ?? 0} {tt({ fr: "en attente", de: "ausstehend", ar: "قيد الانتظار" })}</div></div>
            </Link>
            <Link to="/platform-admin/audit" className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/40 transition">
              <ScrollText className="h-5 w-5 text-slate-600" />
              <div><div className="font-medium text-sm">{tt({ fr: "Logs sécurité", de: "Sicherheitsprotokolle", ar: "سجلات الأمان" })}</div><div className="text-xs text-muted-foreground">{tt({ fr: "Activité récente", de: "Letzte Aktivität", ar: "النشاط الأخير" })}</div></div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
