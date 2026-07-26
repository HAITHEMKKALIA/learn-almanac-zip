import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, GraduationCap, ClipboardList, BarChart3, CalendarDays, Settings as SettingsIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SchoolClassDetail() {
  const { classId } = useParams();
  const [klass, setKlass] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { tt } = useI18n();

  useEffect(() => {
    (async () => {
      if (!classId) return;
      const { data: c } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
      setKlass(c);
      const { data: r } = await supabase.rpc("get_class_roster", { _class_id: classId });
      setRoster(r || []);
      setLoading(false);
    })();
  }, [classId]);

  const L = {
    classe: tt({ fr: "Classe", de: "Klasse", ar: "الفصل" }),
    eleves: tt({ fr: "élève(s)", de: "Schüler", ar: "طالب/طلاب" }),
    loading: tt({ fr: "Chargement…", de: "Laden…", ar: "جارٍ التحميل…" }),
    back: tt({ fr: "Retour aux classes", de: "Zurück zu den Klassen", ar: "العودة إلى الفصول" }),
    overview: tt({ fr: "Vue d'ensemble", de: "Übersicht", ar: "نظرة عامة" }),
    students: tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" }),
    teachers: tt({ fr: "Professeurs", de: "Lehrkräfte", ar: "المعلمون" }),
    attendance: tt({ fr: "Présence", de: "Anwesenheit", ar: "الحضور" }),
    homework: tt({ fr: "Devoirs", de: "Hausaufgaben", ar: "الواجبات" }),
    exams: tt({ fr: "Examens", de: "Prüfungen", ar: "الامتحانات" }),
    settings: tt({ fr: "Paramètres", de: "Einstellungen", ar: "الإعدادات" }),
    level: tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" }),
    status: tt({ fr: "Statut", de: "Status", ar: "الحالة" }),
    studentList: tt({ fr: "Liste des élèves", de: "Schülerliste", ar: "قائمة الطلاب" }),
    noStudents: tt({ fr: "Aucun élève inscrit.", de: "Keine Schüler eingeschrieben.", ar: "لا يوجد طلاب مسجلون." }),
    approved: tt({ fr: "Approuvé", de: "Genehmigt", ar: "موافق عليه" }),
    pending: tt({ fr: "En attente", de: "Ausstehend", ar: "قيد الانتظار" }),
    teachersHint: tt({ fr: "Affectations professeurs gérées depuis l'onglet école.", de: "Lehrerzuweisungen werden im Schul-Tab verwaltet.", ar: "تتم إدارة تعيينات المعلمين من علامة تبويب المدرسة." }),
    teacherSpace: tt({ fr: "espace professeur", de: "Lehrerbereich", ar: "مساحة المعلم" }),
    attHint: tt({ fr: "pour prendre la présence.", de: ", um die Anwesenheit zu erfassen.", ar: "لتسجيل الحضور." }),
    seeHw: tt({ fr: "devoirs", de: "Hausaufgaben", ar: "الواجبات" }),
    seeExams: tt({ fr: "examens", de: "Prüfungen", ar: "الامتحانات" }),
    settingsSoon: tt({ fr: "Paramètres de classe à venir.", de: "Klasseneinstellungen folgen in Kürze.", ar: "إعدادات الفصل قادمة قريباً." }),
    see: tt({ fr: "Voir", de: "Siehe", ar: "انظر" }),
  };

  return (
    <SchoolLayout
      title={klass?.name || L.classe}
      subtitle={klass ? `${klass.level || "—"} · ${roster.length} ${L.eleves}` : L.loading}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/school-admin/classes"><ArrowLeft className="h-4 w-4 me-1" />{L.back}</Link>
        </Button>
      }
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 me-1" />{L.overview}</TabsTrigger>
          <TabsTrigger value="students"><Users className="h-4 w-4 me-1" />{L.students}</TabsTrigger>
          <TabsTrigger value="teachers"><GraduationCap className="h-4 w-4 me-1" />{L.teachers}</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarDays className="h-4 w-4 me-1" />{L.attendance}</TabsTrigger>
          <TabsTrigger value="homework"><ClipboardList className="h-4 w-4 me-1" />{L.homework}</TabsTrigger>
          <TabsTrigger value="exams">{L.exams}</TabsTrigger>
          <TabsTrigger value="settings"><SettingsIcon className="h-4 w-4 me-1" />{L.settings}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid md:grid-cols-3 gap-4">
          <Card><CardHeader><CardDescription>{L.students}</CardDescription><CardTitle className="text-3xl">{roster.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>{L.level}</CardDescription><CardTitle className="text-3xl">{klass?.level || "—"}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>{L.status}</CardDescription><CardTitle><Badge>{klass?.status || "active"}</Badge></CardTitle></CardHeader></Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader><CardTitle>{L.studentList}</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">{L.loading}</p> :
               roster.length === 0 ? <p className="text-sm text-muted-foreground">{L.noStudents}</p> :
               <ul className="divide-y">
                 {roster.map((s: any) => (
                   <li key={s.student_id} className="py-2 flex items-center justify-between">
                     <div>
                       <div className="font-medium">{s.display_name || s.email}</div>
                       <div className="text-xs text-muted-foreground">{s.email}</div>
                     </div>
                     {s.approved ? <Badge variant="secondary">{L.approved}</Badge> : <Badge variant="outline">{L.pending}</Badge>}
                   </li>
                 ))}
               </ul>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-4">
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{L.teachersHint}</CardContent></Card>
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{L.see} <Link to="/teacher" className="text-primary underline">{L.teacherSpace}</Link> {L.attHint}</CardContent></Card>
        </TabsContent>
        <TabsContent value="homework" className="mt-4">
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{L.see} <Link to="/teacher/homework" className="text-primary underline">{L.seeHw}</Link>.</CardContent></Card>
        </TabsContent>
        <TabsContent value="exams" className="mt-4">
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{L.see} <Link to="/teacher/assignments" className="text-primary underline">{L.seeExams}</Link>.</CardContent></Card>
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{L.settingsSoon}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </SchoolLayout>
  );
}
