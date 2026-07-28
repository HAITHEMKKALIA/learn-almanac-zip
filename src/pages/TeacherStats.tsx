import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, FileSpreadsheet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export default function TeacherStats() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("id, status, score, total, started_at, submitted_at, student_id, assignments!inner(id, title, level, teacher_id, passing_score)")
      .eq("assignments.teacher_id", user?.id || "")
      .order("submitted_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    const rows = data || [];
    const ids = Array.from(new Set(rows.map((s: any) => s.student_id).filter(Boolean)));
    let profMap: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", ids);
      (profs || []).forEach((p: any) => { profMap[p.user_id] = p; });
    }
    setSubs(rows.map((s: any) => ({ ...s, profiles: profMap[s.student_id] || null })));
    setLoading(false);
  })(); }, [user?.id]);

  const stats = useMemo(() => {
    const submitted = subs.filter(s => s.status === "submitted" || s.status === "graded");
    const avg = submitted.length ? submitted.reduce((a,s)=>a + (s.total ? (s.score||0)/s.total*100 : 0), 0) / submitted.length : 0;
    const pass = submitted.filter(s => s.total && (s.score||0)/s.total*100 >= (s.assignments?.passing_score ?? 60)).length;
    const byLevel: Record<string, { name: string; avg: number; n: number; sum: number }> = {};
    for (const s of submitted) {
      const l = s.assignments?.level || "?";
      byLevel[l] ||= { name: l, avg: 0, n: 0, sum: 0 };
      byLevel[l].n++; byLevel[l].sum += s.total ? (s.score||0)/s.total*100 : 0;
    }
    Object.values(byLevel).forEach(r => r.avg = Math.round(r.sum / r.n));
    return { submitted: submitted.length, avg: Math.round(avg), pass, byLevel: Object.values(byLevel) };
  }, [subs]);

  const exportCsv = () => {
    const headers = ["étudiant","devoir","niveau","note","total","pourcentage","statut","soumis_le"];
    const rows = subs.map(s => [
      (s.profiles as any)?.display_name || s.student_id,
      s.assignments?.title || "",
      s.assignments?.level || "",
      s.score ?? "", s.total ?? "",
      s.total ? Math.round((s.score||0)/s.total*100) : "",
      s.status, s.submitted_at || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `resultats_${Date.now()}.csv`; a.click();
  };

  const exportXlsx = async () => {
    // minimal xlsx via SheetJS-free approach: write CSV with .xls extension (Excel ouvre)
    const headers = ["étudiant","devoir","niveau","note","total","pourcentage","statut","soumis_le"];
    const rows = subs.map(s => [
      (s.profiles as any)?.display_name || s.student_id,
      s.assignments?.title || "", s.assignments?.level || "",
      s.score ?? "", s.total ?? "",
      s.total ? Math.round((s.score||0)/s.total*100) : "",
      s.status, s.submitted_at || "",
    ]);
    const html = `<table><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>${rows.map(r=>`<tr>${r.map(v=>`<td>${v ?? ""}</td>`).join("")}</tr>`).join("")}</table>`;
    const blob = new Blob([`<html><head><meta charset="utf-8"/></head><body>${html}</body></html>`], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `resultats_${Date.now()}.xls`; a.click();
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Rapport des résultats", 14, 18);
    doc.setFontSize(10);
    doc.text(`Soumissions: ${stats.submitted} · Moyenne: ${stats.avg}% · Réussite: ${stats.pass}`, 14, 28);
    let y = 40;
    doc.setFontSize(9);
    doc.text("Étudiant | Devoir | Niveau | Note | %", 14, y); y += 6;
    for (const s of subs.slice(0, 80)) {
      const pct = s.total ? Math.round((s.score||0)/s.total*100) : "-";
      const line = `${(s.profiles as any)?.display_name || "-"} | ${s.assignments?.title?.slice(0,30) || ""} | ${s.assignments?.level || ""} | ${s.score ?? "-"}/${s.total ?? "-"} | ${pct}%`;
      doc.text(line, 14, y); y += 5;
      if (y > 280) { doc.addPage(); y = 20; }
    }
    doc.save(`resultats_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <Link to="/teacher" className="text-sm text-muted-foreground hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3 rtl:rotate-180"/>{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}</Link>
            <h1 className="text-3xl font-bold mt-1">📊 {tt({ fr: "Statistiques & résultats", de: "Statistiken & Ergebnisse", ar: "إحصائيات ونتائج" })}</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 me-2"/>CSV</Button>
            <Button variant="outline" onClick={exportXlsx}><FileSpreadsheet className="w-4 h-4 me-2"/>Excel</Button>
            <Button variant="outline" onClick={exportPdf}><FileText className="w-4 h-4 me-2"/>PDF</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Card><CardHeader><CardDescription>{tt({ fr: "Soumissions", de: "Abgaben", ar: "التسليمات" })}</CardDescription><CardTitle className="text-3xl">{stats.submitted}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>{tt({ fr: "Moyenne", de: "Durchschnitt", ar: "المعدّل" })}</CardDescription><CardTitle className="text-3xl">{stats.avg}%</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>{tt({ fr: "Réussites", de: "Bestanden", ar: "الناجحون" })}</CardDescription><CardTitle className="text-3xl">{stats.pass}</CardTitle></CardHeader></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>{tt({ fr: "Moyenne par niveau", de: "Durchschnitt pro Niveau", ar: "المعدّل حسب المستوى" })}</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            {stats.byLevel.length === 0 ? <p className="text-muted-foreground">{tt({ fr: "Aucune donnée.", de: "Keine Daten.", ar: "لا توجد بيانات." })}</p> :
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byLevel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip/>
                <Bar dataKey="avg" fill="hsl(var(--primary))"/>
              </BarChart>
            </ResponsiveContainer>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tt({ fr: "Soumissions récentes", de: "Letzte Abgaben", ar: "آخر التسليمات" })}</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</p> :
             subs.length === 0 ? <p className="text-muted-foreground">{tt({ fr: "Aucune soumission.", de: "Keine Abgaben.", ar: "لا توجد تسليمات." })}</p> :
            <div className="space-y-1 text-sm">
              {subs.slice(0, 50).map(s => {
                const pct = s.total ? Math.round((s.score||0)/s.total*100) : null;
                return (
                  <div key={s.id} className="border rounded p-2 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{(s.profiles as any)?.display_name || s.student_id.slice(0,8)} — {s.assignments?.title}</div>
                      <div className="text-xs text-muted-foreground">{s.submitted_at?.slice(0,16) || s.started_at?.slice(0,16) || "-"}</div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Badge variant="outline">{s.assignments?.level}</Badge>
                      <Badge variant={s.status==="submitted"||s.status==="graded"?"default":"secondary"}>{s.status}</Badge>
                      {pct !== null && <Badge variant={pct >= (s.assignments?.passing_score ?? 60)?"default":"destructive"}>{pct}%</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
