import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export default function Reports() {
  const { user, isTeacher, isAdmin } = useAuth();
  const { tt } = useI18n();
  const [classes, setClasses] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: cls } = await supabase.from("classes").select("id,name,level").order("created_at", { ascending: false });
      setClasses(cls || []);
      if (cls?.length) {
        const ids = cls.map(c=>c.id);
        const { data: members } = await supabase.from("class_members").select("class_id").in("class_id", ids);
        const { data: ass } = await supabase.from("assignments").select("id,class_id,status").in("class_id", ids);
        const { data: subs } = await supabase.from("submissions").select("id,assignment_id,score,status,total");
        const subsByAss = new Map<string, any[]>();
        (subs||[]).forEach((s:any)=>{ if(!subsByAss.has(s.assignment_id)) subsByAss.set(s.assignment_id, []); subsByAss.get(s.assignment_id)!.push(s); });
        setStats(cls.map((c:any) => {
          const cAss = (ass||[]).filter((a:any)=>a.class_id===c.id);
          const cSubs = cAss.flatMap((a:any)=> subsByAss.get(a.id) || []);
          const graded = cSubs.filter((s:any)=> s.status === "graded" && s.score !== null);
          const avg = graded.length ? Math.round(graded.reduce((a,s)=>a+(s.score/Math.max(s.total||1,1))*100,0) / graded.length) : null;
          return {
            ...c,
            students: (members||[]).filter((m:any)=>m.class_id===c.id).length,
            assignments: cAss.length,
            submissions: cSubs.length,
            avg,
          };
        }));
      }
    })();
  }, []);

  const exportCSV = () => {
    const header = ["Classe","Niveau","Élèves","Devoirs","Soumissions","Moyenne %"];
    const rows = stats.map((s:any)=>[s.name, s.level, s.students, s.assignments, s.submissions, s.avg ?? ""]);
    const csv = [header, ...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `rapport_classes_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url); toast.success(tt({ fr: "Export CSV téléchargé", de: "CSV-Export heruntergeladen", ar: "تم تنزيل CSV" }));
  };

  if (!isTeacher && !isAdmin) {
    return <SchoolLayout title={tt({ fr: "Rapports", de: "Berichte", ar: "التقارير" })} subtitle={tt({ fr: "Réservé aux enseignants", de: "Nur für Lehrer", ar: "خاص بالأساتذة" })}>
      <Card className="max-w-xl"><CardContent className="py-8 text-center text-muted-foreground">{tt({ fr: "Cette section est réservée aux professeurs et administrateurs.", de: "Dieser Bereich ist Lehrern und Administratoren vorbehalten.", ar: "هذا القسم مخصّص للأساتذة والمسؤولين." })}</CardContent></Card>
    </SchoolLayout>;
  }

  return (
    <SchoolLayout
      title={tt({ fr: "Rapports", de: "Berichte", ar: "التقارير" })}
      subtitle={tt({ fr: "Synthèse par classe — devoirs, soumissions, moyennes", de: "Klassenübersicht — Aufgaben, Abgaben, Durchschnitte", ar: "ملخّص حسب الصف — واجبات وتسليمات ومعدّلات" })}
      breadcrumbs={[{ label: tt({ fr: "Rapports", de: "Berichte", ar: "التقارير" }) }]}
      actions={<Button onClick={exportCSV} className="bg-gradient-warm text-white border-0"><Download className="h-4 w-4 me-2"/>{tt({ fr: "Exporter CSV", de: "CSV exportieren", ar: "تصدير CSV" })}</Button>}
    >
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>{tt({ fr: "Synthèse par classe", de: "Klassenübersicht", ar: "ملخّص حسب الصف" })}</CardTitle>
          <CardDescription>{classes.length} {tt({ fr: "classe(s)", de: "Klasse(n)", ar: "صف/صفوف" })}</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? <p className="text-muted-foreground text-sm">{tt({ fr: "Aucune donnée.", de: "Keine Daten.", ar: "لا توجد بيانات." })}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="py-2">{tt({ fr: "Classe", de: "Klasse", ar: "الصف" })}</th>
                    <th>{tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })}</th>
                    <th>{tt({ fr: "Élèves", de: "Schüler", ar: "التلاميذ" })}</th>
                    <th>{tt({ fr: "Devoirs", de: "Aufgaben", ar: "الواجبات" })}</th>
                    <th>{tt({ fr: "Soumissions", de: "Abgaben", ar: "التسليمات" })}</th>
                    <th>{tt({ fr: "Moyenne", de: "Durchschnitt", ar: "المعدّل" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s:any)=>(
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 font-medium">{s.name}</td>
                      <td><Badge variant="outline" className="border-primary/30 text-primary">{s.level}</Badge></td>
                      <td>{s.students}</td>
                      <td>{s.assignments}</td>
                      <td>{s.submissions}</td>
                      <td>{s.avg !== null ? <span className="font-semibold">{s.avg}%</span> : <span className="text-muted-foreground">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </SchoolLayout>
  );
}
