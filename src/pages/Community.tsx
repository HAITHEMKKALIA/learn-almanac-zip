import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Flame, Target, Users, ArrowLeft, Video, Sparkles, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const T = {
  fr: { title: "Communauté", subtitle: "Défis, classement et progression collective", back: "Retour", leaderboard: "Classement XP", challenge: "Défi de la semaine", challengeDesc: "Apprends 30 nouveaux mots cette semaine", participants: "participants", you: "toi", noData: "Aucune donnée pour le moment. Sois le premier !", weeklyGoal: "Objectif hebdo", days: "jours de suite" },
  de: { title: "Community", subtitle: "Herausforderungen, Ranking und gemeinsames Lernen", back: "Zurück", leaderboard: "XP-Rangliste", challenge: "Wochen-Challenge", challengeDesc: "Lerne diese Woche 30 neue Wörter", participants: "Teilnehmer", you: "du", noData: "Noch keine Daten. Sei der Erste!", weeklyGoal: "Wochenziel", days: "Tage in Folge" },
  ar: { title: "المجتمع", subtitle: "تحديات، ترتيب وتقدم جماعي", back: "رجوع", leaderboard: "ترتيب النقاط", challenge: "تحدي الأسبوع", challengeDesc: "تعلّم 30 كلمة جديدة هذا الأسبوع", participants: "مشاركون", you: "أنت", noData: "لا توجد بيانات بعد. كن الأول!", weeklyGoal: "الهدف الأسبوعي", days: "أيام متتالية" },
} as const;

type Row = { user_id: string; total_xp: number; streak: number; display_name: string | null; is_me: boolean };

export default function Community() {
  const { lang } = useI18n();
  const t = T[lang as keyof typeof T] ?? T.fr;
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ xp: number; streak: number; goal: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      const { data: stats } = await supabase
        .from("user_stats")
        .select("user_id,xp,current_streak")
        .order("xp", { ascending: false })
        .limit(20);
      const ids = (stats ?? []).map((s: any) => s.user_id);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,display_name").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((profs ?? []).map((p: any) => [p.id, p.display_name]));
      const out: Row[] = (stats ?? []).map((s: any) => ({
        user_id: s.user_id,
        total_xp: s.xp ?? 0,
        streak: s.current_streak ?? 0,
        display_name: map.get(s.user_id) ?? null,
        is_me: s.user_id === uid,
      }));
      setRows(out);
      const mine = out.find((r) => r.is_me);
      setMe({ xp: mine?.total_xp ?? 0, streak: mine?.streak ?? 0, goal: 30 });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Link>
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> {t.title}
          </h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Link to="/forum"><Card className="p-4 hover:border-primary transition"><div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><div><div className="font-semibold">Forum</div><div className="text-xs text-muted-foreground">Discussions, entraide, questions</div></div></div></Card></Link>
          <Link to="/challenges"><Card className="p-4 hover:border-primary transition"><div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /><div><div className="font-semibold">Défis</div><div className="text-xs text-muted-foreground">Défis hebdomadaires et XP bonus</div></div></div></Card></Link>
          <Link to="/live"><Card className="p-4 hover:border-primary transition"><div className="flex items-center gap-2"><Video className="w-5 h-5 text-primary" /><div><div className="font-semibold">Classe virtuelle</div><div className="text-xs text-muted-foreground">Cours live audio/vidéo + chat</div></div></div></Card></Link>
          <Link to="/avatar"><Card className="p-4 hover:border-primary transition"><div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /><div><div className="font-semibold">Avatar IA 3D</div><div className="text-xs text-muted-foreground">Prof virtuel qui parle allemand</div></div></div></Card></Link>
          <Link to="/voice-coach"><Card className="p-4 hover:border-primary transition"><div className="flex items-center gap-2"><Mic className="w-5 h-5 text-primary" /><div><div className="font-semibold">Coach vocal DE</div><div className="text-xs text-muted-foreground">Prononciation notée par l'IA</div></div></div></Card></Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
            <div className="flex items-center gap-2 mb-3"><Target className="w-5 h-5 text-primary" /><h3 className="font-semibold">{t.challenge}</h3></div>
            <p className="text-sm text-muted-foreground mb-4">{t.challengeDesc}</p>
            <Progress value={me ? Math.min(100, (me.xp % 300) / 3) : 0} />
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{me?.xp ?? 0} XP</span><span>{t.weeklyGoal}: {me?.goal ?? 30}</span>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3"><Flame className="w-5 h-5 text-orange-500" /><h3 className="font-semibold">Streak</h3></div>
            <div className="text-4xl font-bold">{me?.streak ?? 0}</div>
            <p className="text-sm text-muted-foreground mt-1">{t.days}</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4"><Trophy className="w-5 h-5 text-yellow-500" /><h3 className="font-semibold text-lg">{t.leaderboard}</h3></div>
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">{t.noData}</div>
          ) : (
            <ol className="space-y-2">
              {rows.map((r, i) => (
                <li key={r.user_id} className={`flex items-center gap-3 p-3 rounded-lg ${r.is_me ? "bg-primary/10 border border-primary/30" : "bg-muted/30"}`}>
                  <div className="w-8 text-center font-bold text-lg text-muted-foreground">{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium">{r.display_name ?? `#${r.user_id.slice(0, 6)}`}{r.is_me && <Badge className="ms-2" variant="secondary">{t.you}</Badge>}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2"><Flame className="w-3 h-3" /> {r.streak} {t.days}</div>
                  </div>
                  <div className="font-bold text-primary">{r.total_xp} XP</div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
