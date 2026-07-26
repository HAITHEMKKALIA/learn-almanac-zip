import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Volume2, Check, X, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Entry = { id:string; word:string; article:string|null; plural:string|null; level:string;
  theme_slug:string|null; translation_fr:string|null; example_de:string|null; };
type Progress = { vocab_id:string; box:number; next_review_at:string };

const LEVELS = ["A1","A2","B1","B2"] as const;
const SRS_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60];

function speak(text:string){
  try { const u = new SpeechSynthesisUtterance(text); u.lang="de-DE"; u.rate=.9; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch{}
}

export default function WortschatzFlashcards() {
  const { user } = useAuth();
  const [level, setLevel] = useState<typeof LEVELS[number]>("A1");
  const [pool, setPool] = useState<Entry[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });

  async function load() {
    setLoading(true);
    const { data: entries } = await supabase.from("vocab_entries").select("*").eq("level", level).limit(500);
    const list = (entries as Entry[]) || [];
    let prog: Record<string, Progress> = {};
    if (user && list.length) {
      const { data: pr } = await supabase
        .from("vocab_progress").select("vocab_id,box,next_review_at")
        .eq("user_id", user.id).in("vocab_id", list.map(e => e.id));
      (pr || []).forEach(p => { prog[p.vocab_id] = p as Progress; });
    }
    // Due first (no progress = due now), then by box ASC, shuffle within group
    const now = Date.now();
    const due = list.filter(e => {
      const p = prog[e.id];
      return !p || new Date(p.next_review_at).getTime() <= now;
    }).sort(() => Math.random() - 0.5);
    const fallback = list.filter(e => !due.includes(e)).sort(() => Math.random() - 0.5);
    setPool([...due, ...fallback]);
    setProgress(prog);
    setIdx(0);
    setRevealed(false);
    setStats({ correct: 0, wrong: 0 });
    setLoading(false);
  }
  useEffect(() => { load(); }, [level, user?.id]);

  const current = pool[idx];

  async function answer(correct: boolean) {
    if (!user || !current) return;
    const prev = progress[current.id];
    const newBox = correct ? Math.min((prev?.box || 1) + 1, SRS_INTERVAL_DAYS.length - 1) : 1;
    const next = new Date(Date.now() + SRS_INTERVAL_DAYS[newBox] * 86400_000).toISOString();
    const row = {
      user_id: user.id, vocab_id: current.id, box: newBox, next_review_at: next,
      correct_count: (prev as any)?.correct_count ? (prev as any).correct_count + (correct?1:0) : (correct?1:0),
      wrong_count: (prev as any)?.wrong_count ? (prev as any).wrong_count + (correct?0:1) : (correct?0:1),
    };
    await supabase.from("vocab_progress").upsert(row, { onConflict: "user_id,vocab_id" });
    setProgress(p => ({ ...p, [current.id]: { vocab_id: current.id, box: newBox, next_review_at: next } }));
    setStats(s => ({ correct: s.correct + (correct?1:0), wrong: s.wrong + (correct?0:1) }));
    setRevealed(false);
    setIdx(i => i + 1);
  }

  return (
    <SchoolLayout
      title="Flashcards Wortschatz"
      subtitle="Répétition espacée (Leitner) — niveau & boîte par mot"
      actions={
        <Link to="/wortschatz"><Button size="sm" variant="outline"><ArrowLeft className="w-4 h-4 mr-1"/>Liste</Button></Link>
      }
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <Tabs value={level} onValueChange={(v) => setLevel(v as any)}>
          <TabsList>{LEVELS.map(l => <TabsTrigger key={l} value={l}>{l}</TabsTrigger>)}</TabsList>
        </Tabs>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Carte {Math.min(idx+1, pool.length)} / {pool.length}</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">✓ {stats.correct}</Badge>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">✗ {stats.wrong}</Badge>
            <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="w-4 h-4"/></Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/></div>
        ) : !current ? (
          <Card className="p-12 text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <div className="font-bold text-lg">Session terminée</div>
            <div className="text-sm text-muted-foreground">{stats.correct} bonnes · {stats.wrong} à revoir</div>
            <Button onClick={load} className="mt-2"><RefreshCw className="w-4 h-4 mr-1"/>Rejouer</Button>
            {pool.length === 0 && <div className="text-xs text-muted-foreground">Aucun vocabulaire pour ce niveau. Demande à un professeur de générer le contenu via la page Wortschatz.</div>}
          </Card>
        ) : (
          <Card className="p-8 min-h-[320px] flex flex-col items-center justify-center text-center cursor-pointer select-none"
                onClick={() => setRevealed(true)}>
            {current.article && (
              <Badge variant="outline" className="mb-3">{current.article}</Badge>
            )}
            <div className="text-4xl font-bold mb-2 flex items-center gap-3">
              {current.word}
              <button onClick={(e) => { e.stopPropagation(); speak((current.article? current.article+" ":"") + current.word); }}
                      className="text-muted-foreground hover:text-primary">
                <Volume2 className="w-6 h-6"/>
              </button>
            </div>
            {current.plural && <div className="text-sm text-muted-foreground mb-3">Pl. {current.plural}</div>}

            {revealed ? (
              <div className="space-y-3 mt-4">
                <div className="text-2xl text-primary font-semibold">{current.translation_fr}</div>
                {current.example_de && <div className="text-sm italic text-muted-foreground">„{current.example_de}"</div>}
                <div className="flex gap-3 justify-center pt-4">
                  <Button size="lg" variant="outline" className="border-rose-500/50 text-rose-600 hover:bg-rose-500/10"
                          onClick={(e) => { e.stopPropagation(); answer(false); }}>
                    <X className="w-5 h-5 mr-1"/>À revoir
                  </Button>
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={(e) => { e.stopPropagation(); answer(true); }}>
                    <Check className="w-5 h-5 mr-1"/>Su
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-6">Clique pour révéler</div>
            )}
          </Card>
        )}
      </div>
    </SchoolLayout>
  );
}
