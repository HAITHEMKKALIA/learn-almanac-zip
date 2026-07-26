import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Copy, ClipboardList, Library, BarChart3, Upload, GraduationCap, ArrowRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { BigActions } from "@/components/school/BigActions";
import {
  AcademyMotionPage, AcademyStatGrid, AcademyStatItem, AcademyMetricCard,
  AcademyEmptyState, AcademyLoadingState,
} from "@/components/academy/AcademyUI";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { AIQuotaWidget } from "@/components/school/AIQuotaWidget";

type Klass = { id: string; name: string; level: string; invite_code: string; created_at: string };

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [classes, setClasses] = useState<Klass[]>([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<"A1"|"A2"|"B1"|"B2">("A1");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, assignments: 0, pending: 0 });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("classes").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const cls = (data as any) || [];
    setClasses(cls);
    if (cls.length) {
      const ids = cls.map((c:any)=>c.id);
      const [{ count: students }, { data: ass }] = await Promise.all([
        supabase.from("class_members").select("id", { count: "exact", head: true }).in("class_id", ids),
        supabase.from("assignments").select("id, status").in("class_id", ids),
      ]);
      setStats({
        students: students || 0,
        assignments: ass?.length || 0,
        pending: ass?.filter((a:any)=>a.status==="open").length || 0,
      });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createClass = async () => {
    if (!name.trim() || !user) return;
    const { data: schools } = await supabase
      .from("school_members")
      .select("school_id, role")
      .eq("user_id", user.id)
      .in("role", ["teacher", "owner"])
      .limit(1);
    const schoolId = schools?.[0]?.school_id;
    if (!schoolId) {
      toast.error("Aucune école associée. Contactez l'administrateur.");
      return;
    }
    const { error } = await supabase.from("classes").insert({ name, level, teacher_id: user.id, school_id: schoolId });
    if (error) toast.error(error.message);
    else { toast.success("Classe créée"); setName(""); setOpen(false); load(); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié : " + code);
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Espace Professeur", de: "Lehrerbereich", ar: "فضاء الأستاذ" })}
      subtitle={tt({ fr: "Gérez vos classes, devoirs et corrections", de: "Verwalten Sie Klassen, Aufgaben und Korrekturen", ar: "أدر صفوفك وواجباتك وتصحيحاتك" })}
      breadcrumbs={[{ label: tt({ fr: "Professeur", de: "Lehrer", ar: "أستاذ" }) }]}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-warm text-white border-0"><Plus className="w-4 h-4 me-2"/>{tt({ fr: "Nouvelle classe", de: "Neue Klasse", ar: "صف جديد" })}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{tt({ fr: "Créer une classe", de: "Klasse erstellen", ar: "إنشاء صف" })}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{tt({ fr: "Nom", de: "Name", ar: "الاسم" })}</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: A1 — Lycée X"/></div>
              <div><Label>{tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })}</Label>
                <Select value={level} onValueChange={(v:any)=>setLevel(v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1</SelectItem><SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem><SelectItem value="B2">B2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createClass} className="w-full">{tt({ fr: "Créer", de: "Erstellen", ar: "إنشاء" })}</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <AcademyMotionPage>
        <BigActions
          actions={[
            { to: "/teacher", title: "Mes classes", desc: `${classes.length} classe(s) · ${stats.students} élèves`, icon: Users, accent: "bg-primary/10 text-primary" },
            { to: "/teacher/assignments", title: "Devoirs & examens", desc: `${stats.pending} ouvert(s)`, icon: ClipboardList, badge: stats.pending, accent: "bg-secondary/15 text-secondary" },
            { to: "/messages", title: "Messages", desc: "Discuter avec mes élèves", icon: MessageSquare, accent: "bg-accent/15 text-accent-foreground" },
            { to: "/teacher/stats", title: "Statistiques", desc: "Suivi et résultats", icon: BarChart3, accent: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
          ]}
        />

        <AcademyStatGrid className="mt-2 mb-6">
          <AcademyStatItem>
            <AcademyMetricCard icon={<Users className="h-4 w-4"/>} label={tt({ fr: "Classes", de: "Klassen", ar: "الصفوف" })} value={classes.length} hint={tt({ fr: "actives", de: "aktiv", ar: "نشطة" })} accent="primary" />
          </AcademyStatItem>
          <AcademyStatItem>
            <AcademyMetricCard icon={<GraduationCap className="h-4 w-4"/>} label={tt({ fr: "Élèves", de: "Schüler", ar: "التلاميذ" })} value={stats.students} hint={tt({ fr: "inscrits", de: "eingeschrieben", ar: "مسجّلون" })} accent="accent" />
          </AcademyStatItem>
          <AcademyStatItem>
            <AcademyMetricCard icon={<ClipboardList className="h-4 w-4"/>} label={tt({ fr: "Devoirs", de: "Aufgaben", ar: "الواجبات" })} value={stats.assignments} hint={`${stats.pending} ${tt({ fr: "ouverts", de: "offen", ar: "مفتوحة" })}`} accent="warning" />
          </AcademyStatItem>
          <AcademyStatItem>
            <AcademyMetricCard icon={<BarChart3 className="h-4 w-4"/>} label={tt({ fr: "À corriger", de: "Zu korrigieren", ar: "للتصحيح" })} value={stats.pending} hint={tt({ fr: "soumissions", de: "Abgaben", ar: "تسليمات" })} accent="success" />
          </AcademyStatItem>
        </AcademyStatGrid>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <AIQuotaWidget scope="user" title={tt({ fr: "Mon quota IA aujourd'hui", de: "Mein KI-Kontingent heute", ar: "حصتي اليومية من الذكاء الاصطناعي" })} />
          <AIQuotaWidget scope="school" title={tt({ fr: "Quota IA de l'école", de: "KI-Kontingent der Schule", ar: "حصة المدرسة" })} />
        </div>



        <motion.div
          variants={staggerContainer} initial="hidden" animate="show"
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          {[
            { to: "/teacher/bank", icon: Library, label: tt({ fr: "Banque de questions", de: "Fragenbank", ar: "بنك الأسئلة" }) },
            { to: "/teacher/assignments", icon: ClipboardList, label: tt({ fr: "Devoirs & examens", de: "Aufgaben & Prüfungen", ar: "الواجبات والامتحانات" }) },
            { to: "/teacher/import", icon: Upload, label: tt({ fr: "Importer un PDF", de: "PDF importieren", ar: "استيراد PDF" }) },
            { to: "/teacher/stats", icon: BarChart3, label: tt({ fr: "Statistiques", de: "Statistiken", ar: "إحصائيات" }) },
          ].map(a => (
            <motion.div key={a.to} variants={staggerItem}>
              <Link to={a.to}>
                <Card className="hover:bg-card-hover hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center"><a.icon className="h-4 w-4"/></div>
                    <span className="font-medium text-sm flex-1">{a.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Users className="w-5 h-5"/>{tt({ fr: "Mes classes", de: "Meine Klassen", ar: "صفوفي" })}</CardTitle>
            <CardDescription>{tt({ fr: "Partagez le code aux étudiants pour qu'ils rejoignent", de: "Teilen Sie den Code mit den Schülern, damit sie beitreten können", ar: "شارك الرمز مع التلاميذ للانضمام" })}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <AcademyLoadingState /> :
             classes.length === 0 ? (
               <AcademyEmptyState
                 icon={<Users className="h-5 w-5"/>}
                 title={tt({ fr: "Aucune classe pour l'instant", de: "Noch keine Klasse", ar: "لا توجد صفوف حاليًا" })}
                 action={<Button onClick={()=>setOpen(true)}><Plus className="w-4 h-4 me-1"/>{tt({ fr: "Créer ma première classe", de: "Erste Klasse erstellen", ar: "أنشئ أول صف" })}</Button>}
               />
              ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {classes.map(c => (
                  <motion.div key={c.id} variants={staggerItem}>
                    <Card className="border-border/60 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md transition">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-display">{c.name}</CardTitle>
                          <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">{c.level}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 bg-muted rounded-md p-2 text-sm font-mono">
                          <span className="flex-1">{c.invite_code}</span>
                          <Button size="sm" variant="ghost" onClick={()=>copyCode(c.invite_code)} className="h-7 w-7 p-0" aria-label="Copier le code"><Copy className="w-3 h-3"/></Button>
                        </div>
                        <Link to={`/teacher/class/${c.id}`}><Button size="sm" variant="outline" className="w-full">{tt({ fr: "Ouvrir la classe", de: "Klasse öffnen", ar: "افتح الصف" })}<ArrowRight className="h-3 w-3 ms-1 rtl:rotate-180"/></Button></Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </AcademyMotionPage>
    </SchoolLayout>
  );
}
