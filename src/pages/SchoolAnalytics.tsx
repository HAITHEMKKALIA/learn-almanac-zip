import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, GraduationCap, BookOpen, TrendingUp, AlertTriangle, Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { toast } from "sonner";

type ClassRow = { id: string; name: string; level: string | null };
type MemberRow = { user_id: string; role: string };
type StatRow = { user_id: string; xp: number; level: number; current_streak: number; last_activity_date: string | null };
type ProfileRow = { user_id: string; display_name: string | null; email: string | null };

const LEVEL_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

export default function SchoolAnalytics() {
  const { activeSchoolId, activeSchool } = useActiveSchool();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [homework, setHomework] = useState<{ status: string }[]>([]);
  const [attendance, setAttendance] = useState<{ status: string }[]>([]);

  useEffect(() => {
    if (!activeSchoolId) return;
    (async () => {
      setLoading(true);
      try {
        const [cls, mem] = await Promise.all([
          supabase.from("classes").select("id,name,level").eq("school_id", activeSchoolId),
          supabase.from("school_members").select("user_id,role").eq("school_id", activeSchoolId),
        ]);
        const classList = (cls.data || []) as ClassRow[];
        const memberList = (mem.data || []) as MemberRow[];
        setClasses(classList);
        setMembers(memberList);

        const studentIds = memberList.filter(m => m.role === "student").map(m => m.user_id);
        const allIds = memberList.map(m => m.user_id);
        const classIds = classList.map(c => c.id);

        const sb = supabase as any;
        const [st, prof, hw, att] = await Promise.all([
          studentIds.length
            ? sb.from("user_stats").select("user_id,xp,level,current_streak,last_activity_date").in("user_id", studentIds)
            : Promise.resolve({ data: [] }),
          allIds.length
            ? sb.from("profiles").select("user_id,display_name,email").in("user_id", allIds)
            : Promise.resolve({ data: [] }),
          classIds.length
            ? sb.from("homework_submissions").select("status,class_id").in("class_id", classIds)
            : Promise.resolve({ data: [] }),
          classIds.length
            ? sb.from("attendance_sessions").select("class_id,attendance_records(status)").in("class_id", classIds)
            : Promise.resolve({ data: [] }),
        ]);
        setStats((st.data || []) as StatRow[]);
        setProfiles((prof.data || []) as ProfileRow[]);
        setHomework((hw.data || []) as any);
        const attFlat: { status: string }[] = [];
        (att.data || []).forEach((s: any) => (s.attendance_records || []).forEach((r: any) => attFlat.push({ status: r.status })));
        setAttendance(attFlat);
      } catch (e: any) {
        toast.error(e.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [activeSchoolId]);

  const kpis = useMemo(() => {
    const students = members.filter(m => m.role === "student").length;
    const teachers = members.filter(m => ["teacher", "owner"].includes(m.role)).length;
    const totalXP = stats.reduce((a, s) => a + (s.xp || 0), 0);
    const avgXP = stats.length ? Math.round(totalXP / stats.length) : 0;
    const avgStreak = stats.length ? Math.round(stats.reduce((a, s) => a + (s.current_streak || 0), 0) / stats.length) : 0;
    const hwSubmitted = homework.filter(h => ["submitted", "graded"].includes(h.status)).length;
    const hwRate = homework.length ? Math.round((hwSubmitted / homework.length) * 100) : 0;
    const attPresent = attendance.filter(a => a.status === "present").length;
    const attRate = attendance.length ? Math.round((attPresent / attendance.length) * 100) : 0;
    return { students, teachers, classes: classes.length, avgXP, avgStreak, hwRate, attRate };
  }, [members, stats, classes, homework, attendance]);

  const levelDistribution = useMemo(() => {
    const map = new Map<string, number>();
    classes.forEach(c => {
      const k = c.level || "N/A";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [classes]);

  const topStudents = useMemo(() => {
    return [...stats]
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 8)
      .map(s => ({
        name: profiles.find(p => p.user_id === s.user_id)?.display_name?.slice(0, 18) || "—",
        xp: s.xp || 0,
        streak: s.current_streak || 0,
      }));
  }, [stats, profiles]);

  const dropoutRisk = useMemo(() => {
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 3600 * 1000;
    return stats
      .filter(s => !s.last_activity_date || now - new Date(s.last_activity_date).getTime() > SEVEN_DAYS)
      .map(s => ({
        ...s,
        profile: profiles.find(p => p.user_id === s.user_id),
        daysInactive: s.last_activity_date
          ? Math.floor((now - new Date(s.last_activity_date).getTime()) / (24 * 3600 * 1000))
          : null,
      }))
      .sort((a, b) => (b.daysInactive || 999) - (a.daysInactive || 999))
      .slice(0, 10);
  }, [stats, profiles]);

  const exportCSV = () => {
    const rows = [
      ["Métrique", "Valeur"],
      ["École", activeSchool?.name || ""],
      ["Étudiants", kpis.students],
      ["Professeurs", kpis.teachers],
      ["Classes", kpis.classes],
      ["XP moyen", kpis.avgXP],
      ["Streak moyen", kpis.avgStreak],
      ["Taux devoirs (%)", kpis.hwRate],
      ["Taux présence (%)", kpis.attRate],
      [""],
      ["Top étudiants", "XP", "Streak"],
      ...topStudents.map(s => [s.name, s.xp, s.streak]),
      [""],
      ["Étudiants à risque de décrochage", "Jours d'inactivité"],
      ...dropoutRisk.map(d => [d.profile?.display_name || d.profile?.email || "—", d.daysInactive ?? "Jamais actif"]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${activeSchool?.slug || "ecole"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  if (!activeSchoolId) {
    return <div className="p-6 text-muted-foreground">Sélectionnez un espace pour voir les analytics.</div>;
  }

  if (loading) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics école</h1>
          <p className="text-muted-foreground">{activeSchool?.name} · vue directeur</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Users className="h-5 w-5" />} label="Étudiants" value={kpis.students} />
        <KpiCard icon={<GraduationCap className="h-5 w-5" />} label="Professeurs" value={kpis.teachers} />
        <KpiCard icon={<BookOpen className="h-5 w-5" />} label="Classes" value={kpis.classes} />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="XP moyen" value={kpis.avgXP} />
        <KpiCard label="Streak moyen" value={`${kpis.avgStreak} j`} />
        <KpiCard label="Taux devoirs" value={`${kpis.hwRate}%`} />
        <KpiCard label="Taux présence" value={`${kpis.attRate}%`} />
        <KpiCard label="À risque" value={dropoutRisk.length} tone={dropoutRisk.length > 0 ? "warn" : "ok"} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Top 8 étudiants par XP</CardTitle></CardHeader>
          <CardContent className="h-72">
            {topStudents.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStudents}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="xp" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Répartition des classes par niveau</CardTitle></CardHeader>
          <CardContent className="h-72">
            {levelDistribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelDistribution} dataKey="value" nameKey="name" outerRadius={90} label>
                    {levelDistribution.map((_, i) => <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertes de décrochage
            <Badge variant="secondary">{dropoutRisk.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dropoutRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun étudiant à risque — tous actifs cette semaine 🎉</p>
          ) : (
            <div className="divide-y">
              {dropoutRisk.map(d => (
                <div key={d.user_id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{d.profile?.display_name || d.profile?.email || d.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{d.profile?.email}</div>
                  </div>
                  <Badge variant={d.daysInactive && d.daysInactive > 14 ? "destructive" : "secondary"}>
                    {d.daysInactive != null ? `${d.daysInactive} j inactif` : "Jamais actif"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value, tone }: { icon?: React.ReactNode; label: string; value: React.ReactNode; tone?: "ok" | "warn" }) {
  return (
    <Card className={tone === "warn" ? "border-amber-500/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
          {icon}{label}
        </div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Pas encore de données</div>;
}
