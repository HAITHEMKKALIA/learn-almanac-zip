import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import {
  Sparkles, Flame, Trophy, Target, BookOpen, Library,
  ArrowRight, Settings, Award, ClipboardList, Calendar, Brain, Mic, Users,
} from "lucide-react";

const LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1", "B2.2"];

export default function SoloStudentDashboard() {
  const { user } = useAuth();
  const { activeSchool, activeSpaceType } = useActiveSchool();
  const [solo, setSolo] = useState<any>(null);
  const [stats, setStats] = useState({ certificates: 0, kapitelDone: 0, vocab: 0, xp: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const sid = activeSchool?.id;
      const [soloRes, certRes, kapRes, vocRes, xpRes] = await Promise.all([
        sid ? (supabase as any).from("solo_student_settings").select("*").eq("school_id", sid).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("certificates").select("id", { count: "exact", head: true }).eq("student_id", user.id),
        (supabase as any).from("kapitel_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
        (supabase as any).from("vocab_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_stats").select("xp").eq("user_id", user.id).maybeSingle(),
      ]);
      setSolo(soloRes.data);
      setStats({
        certificates: certRes.count || 0,
        kapitelDone: kapRes.count || 0,
        vocab: vocRes.count || 0,
        xp: (xpRes.data as any)?.xp || 0,
      });
      setLoading(false);
    })();
  }, [user?.id, activeSchool?.id]);

  const isSolo = activeSpaceType === "independent_student";
  const current = solo?.current_level || "A1.1";
  const target = solo?.target_level || "B1.1";
  const currentIdx = Math.max(0, LEVELS.indexOf(current));
  const targetIdx = Math.max(currentIdx, LEVELS.indexOf(target));
  const pathProgress = targetIdx > 0
    ? Math.min(100, Math.round((currentIdx / targetIdx) * 100))
    : 0;

  return (
    <SchoolLayout
      title={isSolo ? (solo?.learning_goal || "Mon parcours d'apprentissage") : "Mon espace"}
      subtitle="Apprenez l'allemand à votre rythme — A1.1 jusqu'à B2.2."
      breadcrumbs={[{ label: "Apprentissage solo" }]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/solo-student/settings"><Settings className="h-4 w-4 mr-2" />Mon parcours</Link></Button>
          <Button asChild size="sm"><Link to="/learn"><Sparkles className="h-4 w-4 mr-2" />Continuer à apprendre</Link></Button>
        </div>
      }
    >
      <div className="grid gap-6">
        {/* Hero progress */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-warm/10 p-6 md:p-8 border-b">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Niveau actuel</div>
                <div className="font-display text-4xl font-bold mt-1">{current}</div>
                <div className="text-sm text-muted-foreground mt-1">Objectif : <span className="font-semibold text-foreground">{target}</span></div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1 text-base px-3 py-1.5"><Flame className="h-4 w-4 text-orange-500" />{stats.xp} XP</Badge>
                <Badge variant="outline" className="gap-1 text-base px-3 py-1.5"><Trophy className="h-4 w-4 text-amber-500" />{stats.certificates}</Badge>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progression du parcours</span>
                <span>{pathProgress}%</span>
              </div>
              <Progress value={pathProgress} className="h-2" />
            </div>
          </div>

          {/* Level path */}
          <CardContent className="p-6">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {LEVELS.map((lvl, i) => {
                const done = i < currentIdx;
                const isCurrent = i === currentIdx;
                const inTarget = i <= targetIdx;
                return (
                  <div
                    key={lvl}
                    className={`text-center rounded-lg border p-3 ${
                      isCurrent ? "border-primary bg-primary/10 shadow-elev"
                      : done ? "border-emerald-500/40 bg-emerald-500/5"
                      : inTarget ? "border-border bg-muted/30"
                      : "border-dashed border-border opacity-50"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Niveau</div>
                    <div className="font-display font-bold mt-0.5">{lvl}</div>
                    {isCurrent && <div className="text-[10px] text-primary font-semibold mt-1">En cours</div>}
                    {done && <div className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Validé</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Kapitel terminés" value={stats.kapitelDone} href="/kapitel" tone="violet" />
          <StatCard icon={Library} label="Mots appris" value={stats.vocab} href="/wortschatz" tone="sky" />
          <StatCard icon={Award} label="Certificats" value={stats.certificates} href="/student/certificates" tone="amber" />
          <StatCard icon={Target} label="Objectif/sem (min)" value={solo?.weekly_goal_minutes || 0} href="/solo-student/settings" tone="emerald" />
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <QuickCard icon={BookOpen} title="Continuer un Kapitel" desc="Reprenez votre dernière leçon." href="/kapitel" />
          <QuickCard icon={Sparkles} title="Réviser le vocabulaire" desc="Flashcards intelligentes." href="/wortschatz/flashcards" />
          <QuickCard icon={ClipboardList} title="Examen blanc" desc={`Préparation ${target}.`} href="/student/homework" />
          {solo?.ai_tutor_enabled !== false && (
            <QuickCard icon={Brain} title="Tuteur IA" desc="Posez une question grammaticale." href="/learn" />
          )}
          <QuickCard icon={Sparkles} title="Avatar IA 3D" desc="Prof virtuel qui parle allemand (lip-sync)." href="/avatar" />
          <QuickCard icon={Mic} title="Coach vocal DE" desc="Prononciation notée par l'IA." href="/voice-coach" />
          <QuickCard icon={Users} title="Communauté" desc="Classement, défis, forum." href="/community" />
          <QuickCard icon={Calendar} title="Calendrier" desc="Vos sessions et objectifs." href="/calendar" />
          <QuickCard icon={Award} title="Mes certificats" desc="Vos preuves de progression." href="/student/certificates" />
        </div>
      </div>
    </SchoolLayout>
  );
}

function StatCard({ icon: Icon, label, value, href, tone }: any) {
  const tones: Record<string, string> = {
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <Link to={href} className="block">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
              <div className="text-3xl font-bold font-display mt-1">{value}</div>
            </div>
            <div className={`h-11 w-11 rounded-xl grid place-items-center ${tones[tone] || "bg-primary/10 text-primary"}`}>
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
    <Card className="hover:border-primary/50 hover:shadow-md transition-all group">
      <Link to={href}>
        <CardHeader>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2 group-hover:scale-110 transition-transform"><Icon className="h-5 w-5" /></div>
          <CardTitle className="text-base flex items-center justify-between">{title}<ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform" /></CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
      </Link>
    </Card>
  );
}
