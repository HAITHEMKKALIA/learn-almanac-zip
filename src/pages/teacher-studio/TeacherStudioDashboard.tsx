import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import {
  GraduationCap, Users, ClipboardList, Award, Sparkles,
  Plus, Settings, ArrowRight, BookOpen, Copy,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherStudioDashboard() {
  const { user } = useAuth();
  const { activeSchool, activeSpaceType } = useActiveSchool();
  const [stats, setStats] = useState({ classes: 0, students: 0, assignments: 0, certificates: 0 });
  const [studio, setStudio] = useState<any>(null);

  useEffect(() => {
    if (!activeSchool?.id || !user) return;
    (async () => {
      const sid = activeSchool.id;
      const [{ count: classCount }, { data: classRows }, { data: studioRow }] = await Promise.all([
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", sid),
        supabase.from("classes").select("id").eq("school_id", sid),
        (supabase as any).from("teacher_studio_settings").select("*").eq("school_id", sid).maybeSingle(),
      ]);
      const ids = (classRows || []).map((c: any) => c.id);
      let studentCount = 0, assignCount = 0, certCount = 0;
      if (ids.length) {
        const [s, a] = await Promise.all([
          supabase.from("class_members").select("student_id", { count: "exact", head: true }).in("class_id", ids),
          supabase.from("assignments").select("id", { count: "exact", head: true }).in("class_id", ids),
        ]);
        studentCount = s.count || 0;
        assignCount = a.count || 0;
      }
      const c = await supabase.from("certificates").select("id", { count: "exact", head: true }).eq("school_id", sid);
      certCount = c.count || 0;
      setStats({ classes: classCount || 0, students: studentCount, assignments: assignCount, certificates: certCount });
      setStudio(studioRow);
    })();
  }, [activeSchool?.id, user?.id]);

  const isStudio = activeSpaceType === "independent_teacher";

  return (
    <SchoolLayout
      title={activeSchool?.name || "Mon Studio"}
      subtitle={isStudio
        ? "Votre espace privé : classes, élèves, devoirs, examens et attestations."
        : "Vue d'ensemble de votre activité d'enseignement."
      }
      breadcrumbs={[{ label: "Teacher Studio" }]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/teacher-studio/settings"><Settings className="h-4 w-4 mr-2" />Paramètres</Link></Button>
          <Button asChild size="sm"><Link to="/teacher-studio/classes"><Plus className="h-4 w-4 mr-2" />Nouvelle classe</Link></Button>
        </div>
      }
    >
      <div className="grid gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} label="Classes" value={stats.classes} href="/teacher-studio/classes" />
          <StatCard icon={Users} label="Élèves" value={stats.students} href="/teacher-studio/students" />
          <StatCard icon={ClipboardList} label="Devoirs & Examens" value={stats.assignments} href="/teacher-studio/exams" />
          <StatCard icon={Award} label="Attestations" value={stats.certificates} href="/teacher-studio/certificates" />
        </div>

        {/* Studio identity */}
        {isStudio && studio && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Mon Studio</CardTitle>
              <CardDescription>Identité publique et règles d'inscription.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <Info label="Nom du studio" value={studio.studio_name} />
              <Info label="Auto-inscription" value={studio.allow_student_self_join ? "Activée" : "Désactivée"} />
              <Info label="Approbation requise" value={studio.require_teacher_approval ? "Oui" : "Non"} />
              <Info label="Niveau par défaut" value={studio.default_level || "—"} />
              <Info label="Élèves max / classe" value={String(studio.max_students_per_class || 30)} />
              <Info label="Profil public" value={studio.public_profile_enabled ? "Visible" : "Privé"} />
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <QuickCard icon={ClipboardList} title="Créer un devoir" desc="Pour une classe privée." href="/teacher-studio/homework" />
          <QuickCard icon={BookOpen} title="Créer un examen" desc="Examen blanc ou évaluation." href="/teacher-studio/exams" />
          <QuickCard icon={Award} title="Émettre une attestation" desc="Certificat privé du studio." href="/teacher-studio/certificates" />
        </div>
      </div>
    </SchoolLayout>
  );
}

function StatCard({ icon: Icon, label, value, href }: any) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <Link to={href} className="block">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
              <div className="text-3xl font-bold font-display mt-1">{value}</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

function QuickCard({ icon: Icon, title, desc, href }: any) {
  return (
    <Card className="hover:border-primary/50 hover:shadow-md transition-all">
      <Link to={href}>
        <CardHeader>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2"><Icon className="h-5 w-5" /></div>
          <CardTitle className="text-base flex items-center justify-between">{title}<ArrowRight className="h-4 w-4 opacity-60" /></CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
      </Link>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
