import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, LogIn, ClipboardList, Trophy, Sparkles, ArrowRight, MessageSquare, NotebookPen, Award, Flame } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { BigActions } from "@/components/school/BigActions";
import {
  AcademyMotionPage, AcademyStatGrid, AcademyStatItem, AcademyMetricCard,
  AcademyEmptyState, AcademyLoadingState, AcademyBadge,
} from "@/components/academy/AcademyUI";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [mySubs, setMySubs] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: members } = await supabase.from("class_members").select("class_id, classes(*)").eq("student_id", user!.id);
    const cls = (members || []).map((m: any) => m.classes).filter(Boolean);
    setClasses(cls);
    if (cls.length) {
      const { data: ass } = await supabase.from("assignments").select("*").in("class_id", cls.map((c:any)=>c.id)).in("status", ["open","scheduled","closed"]).order("created_at", { ascending: false });
      setAssignments(ass || []);
    }
    const { data: subs } = await supabase.from("submissions").select("id, assignment_id, status, score, total, released_at, submitted_at, assignments(title)").eq("student_id", user!.id).order("submitted_at", { ascending: false });
    setMySubs(subs || []);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`student:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "class_members", filter: `student_id=eq.${user.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions", filter: `student_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const join = async () => {
    if (!code.trim() || !user) return;
    const { error } = await supabase.rpc("join_class_by_code", { _code: code.trim() });
    if (error) {
      const msg = (error.message || "").includes("invalid_code")
        ? tt({ fr: "Code invalide", de: "Ungültiger Code", ar: "رمز غير صالح" })
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success(tt({ fr: "Classe rejointe ✓", de: "Klasse beigetreten ✓", ar: "تم الانضمام للصف ✓" })); setCode(""); load();
  };

  const open = assignments.filter(a => a.status === "open");
  const graded = mySubs.filter(s => s.released_at && s.total);
  const avg = graded.length ? Math.round(graded.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / graded.length) : null;

  return (
    <SchoolLayout
      title={tt({ fr: "Espace étudiant", de: "Schülerbereich", ar: "فضاء التلميذ" })}
      subtitle={tt({ fr: "Vos classes, vos devoirs, votre progression", de: "Ihre Klassen, Ihre Aufgaben, Ihr Fortschritt", ar: "صفوفك وواجباتك وتقدّمك" })}
      breadcrumbs={[{ label: tt({ fr: "Élève", de: "Schüler", ar: "تلميذ" }) }]}
      actions={
        <Button asChild className="bg-gradient-warm text-white border-0">
          <Link to="/learn"><Sparkles className="h-4 w-4 me-2"/>{tt({ fr: "Reprendre le cours", de: "Kurs fortsetzen", ar: "متابعة الدرس" })}</Link>
        </Button>
      }
    >
      <AcademyMotionPage>
        <BigActions
          actions={[
            { to: "/student#assignments", title: "Mes classes", desc: `${classes.length} classe(s)`, icon: GraduationCap, accent: "bg-primary/10 text-primary" },
            { to: "/student/homework", title: "Devoirs maison", desc: "Exercices à rendre", icon: NotebookPen, badge: open.length, accent: "bg-secondary/15 text-secondary" },
            { to: "/messages", title: "Messages", desc: "Discuter avec ma classe", icon: MessageSquare, accent: "bg-accent/15 text-accent-foreground" },
            { to: "/student#assignments", title: "Mes notes", desc: "Résultats et corrigés", icon: Award, accent: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
          ]}
        />

        <AcademyStatGrid className="mt-2 mb-6">
          <AcademyStatItem>
            <AcademyMetricCard icon={<GraduationCap className="h-4 w-4"/>} label={tt({ fr: "Classes", de: "Klassen", ar: "الصفوف" })} value={classes.length} hint={tt({ fr: "rejointes", de: "beigetreten", ar: "منضمّ إليها" })} accent="primary" />
          </AcademyStatItem>
          <AcademyStatItem>
            <AcademyMetricCard icon={<ClipboardList className="h-4 w-4"/>} label={tt({ fr: "Devoirs ouverts", de: "Offene Aufgaben", ar: "واجبات مفتوحة" })} value={open.length} hint={tt({ fr: "à faire", de: "zu erledigen", ar: "للقيام بها" })} accent="accent" />
          </AcademyStatItem>
          <AcademyStatItem>
            <AcademyMetricCard icon={<Trophy className="h-4 w-4"/>} label={tt({ fr: "Score moyen", de: "Durchschnitt", ar: "المعدل" })} value={avg !== null ? `${avg}%` : "—"} hint={`${graded.length} ${tt({ fr: "corrigé(s)", de: "korrigiert", ar: "مصحح" })}`} accent="success" />
          </AcademyStatItem>
          <AcademyStatItem>
            <AcademyMetricCard icon={<Flame className="h-4 w-4"/>} label={tt({ fr: "Soumissions", de: "Abgaben", ar: "التسليمات" })} value={mySubs.length} hint={tt({ fr: "au total", de: "insgesamt", ar: "إجمالًا" })} accent="warning" />
          </AcademyStatItem>
        </AcademyStatGrid>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 border-border/60 academy-glass">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><LogIn className="w-5 h-5 text-primary"/>{tt({ fr: "Rejoindre une classe", de: "Klasse beitreten", ar: "انضم إلى صف" })}</CardTitle>
              <CardDescription>{tt({ fr: "Entrez le code donné par votre professeur", de: "Geben Sie den Code Ihres Lehrers ein", ar: "أدخل الرمز الذي قدّمه أستاذك" })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="Ex: A1B2C3" className="font-mono text-center text-lg tracking-widest"/>
              <Button onClick={join} className="w-full">{tt({ fr: "Rejoindre", de: "Beitreten", ar: "انضم" })}</Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border/60">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary"/>{tt({ fr: "Mes classes", de: "Meine Klassen", ar: "صفوفي" })} ({classes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <AcademyLoadingState /> :
               classes.length === 0 ? (
                 <AcademyEmptyState
                   icon={<GraduationCap className="h-5 w-5"/>}
                   title={tt({ fr: "Aucune classe", de: "Keine Klasse", ar: "لا توجد صفوف" })}
                   description={tt({ fr: "Rejoignez-en une avec un code donné par votre professeur.", de: "Treten Sie einer mit einem Code bei.", ar: "انضم إلى واحد برمز." })}
                 />
               ) :
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-3">
                  {classes.map((c:any) => (
                    <motion.div key={c.id} variants={staggerItem}>
                      <Card className="border-border/60 hover:border-primary/40 transition hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-display">{c.name}</CardTitle>
                            <Badge className="bg-primary/10 text-primary border-primary/30">{c.level}</Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              }
            </CardContent>
          </Card>
        </div>

        <Card id="assignments" className="border-border/60 mt-6">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary"/>{tt({ fr: "Mes devoirs / examens", de: "Meine Aufgaben / Prüfungen", ar: "واجباتي / امتحاناتي" })}</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <AcademyEmptyState
                icon={<ClipboardList className="h-5 w-5"/>}
                title={tt({ fr: "Aucun devoir disponible", de: "Keine Aufgabe verfügbar", ar: "لا توجد واجبات" })}
              />
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
                {assignments.map((a:any) => {
                  const mySub = mySubs.find((s) => s.assignment_id === a.id);
                  return (
                  <motion.div key={a.id} variants={staggerItem} className="flex items-center justify-between border rounded-lg p-3 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm transition">
                    <div>
                      <div className="font-semibold flex items-center gap-2 flex-wrap">
                        {a.title}
                        <AcademyBadge tone="info">{a.level}</AcademyBadge>
                        <AcademyBadge tone={a.status==="open" ? "success" : "neutral"}>{a.status}</AcademyBadge>
                        {mySub?.released_at && <AcademyBadge tone="success">{mySub.score}/{mySub.total}</AcademyBadge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{a.duration_minutes} min · {a.max_attempts} {tt({ fr: "tentative(s)", de: "Versuch(e)", ar: "محاولة/محاولات" })}</div>
                    </div>
                    <div className="flex gap-2">
                      {mySub?.released_at ? (
                        <Link to={`/student/result/${mySub.id}`}>
                          <Button size="sm" variant="default">{tt({ fr: "Voir corrigé", de: "Korrektur ansehen", ar: "عرض التصحيح" })}<ArrowRight className="h-3 w-3 ms-1 rtl:rotate-180"/></Button>
                        </Link>
                      ) : mySub?.status === "submitted" ? (
                        <Button size="sm" variant="outline" disabled>{tt({ fr: "En correction…", de: "Korrektur läuft…", ar: "قيد التصحيح…" })}</Button>
                      ) : (
                        <Link to={`/student/exam/${a.id}`}>
                          <Button size="sm" disabled={a.status !== "open"}>{tt({ fr: "Commencer", de: "Beginnen", ar: "ابدأ" })}<ArrowRight className="h-3 w-3 ms-1 rtl:rotate-180"/></Button>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );})}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </AcademyMotionPage>
    </SchoolLayout>
  );
}
