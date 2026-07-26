import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, Clock, Volume2, PlayCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Kapitel = { id: string; level: string; number: number; slug: string; title_de: string; title_fr: string|null; subtitle: string|null; objectives: any; icon: string|null; color: string|null };
type Section = { id: string; kapitel_id: string; kind: string; title: string; position: number; content: any; estimated_minutes: number|null };
type Progress = { section_id: string; completed: boolean };

const KIND_ICONS: Record<string,string> = {
  intro: "🚀", wortschatz: "📚", grammatik: "🧩", hoeren: "🎧", lesen: "📖",
  sprechen: "🗣️", schreiben: "✍️", uebung: "🏋️", minitest: "✅",
};

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

export default function KapitelDetail() {
  const { level, slug } = useParams();
  const { user, isTeacher, isAdmin } = useAuth();
  const [kap, setKap] = useState<Kapitel|null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeId, setActiveId] = useState<string|null>(null);

  async function load() {
    setLoading(true);
    const { data: k } = await supabase.from("kapitel").select("*").eq("level", level!).eq("slug", slug!).maybeSingle();
    if (!k) { setLoading(false); return; }
    setKap(k as any);
    const { data: secs } = await supabase.from("kapitel_sections").select("*").eq("kapitel_id", (k as any).id).order("position");
    setSections((secs as any) || []);
    if (user) {
      const { data: pr } = await supabase.from("kapitel_progress").select("section_id,completed").eq("user_id", user.id).eq("kapitel_id", (k as any).id);
      const map: Record<string, boolean> = {};
      (pr || []).forEach((p: any) => { map[p.section_id] = p.completed; });
      setProgress(map);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [level, slug, user?.id]);

  async function generate() {
    if (!kap) return;
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("kapitel-generate", { body: { kapitel_id: kap.id } });
      if (error) throw error;
      toast.success("Contenu généré ✨");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erreur génération");
    } finally { setGenerating(false); }
  }

  async function markDone(s: Section) {
    if (!user) return;
    const newVal = !progress[s.id];
    setProgress((p) => ({ ...p, [s.id]: newVal }));
    await supabase.from("kapitel_progress").upsert({
      user_id: user.id, section_id: s.id, kapitel_id: s.kapitel_id, completed: newVal,
    }, { onConflict: "user_id,section_id" });
  }

  const total = sections.length || 1;
  const done = Object.values(progress).filter(Boolean).length;
  const pct = Math.round((done / total) * 100);
  const active = sections.find((s) => s.id === activeId) || sections[0];

  if (loading) return <SchoolLayout><div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div></SchoolLayout>;
  if (!kap) return <SchoolLayout><div className="container py-10">Kapitel introuvable. <Link to="/kapitel" className="text-primary underline">Retour</Link></div></SchoolLayout>;

  return (
    <SchoolLayout>
      <div className="container max-w-6xl py-6 space-y-6">
        <Link to="/kapitel" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 mr-1" /> Tous les chapitres</Link>

        <Card className="p-6 border-l-4" style={{ borderLeftColor: kap.color || "hsl(var(--primary))" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{kap.icon || "📘"}</div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge>{kap.level}</Badge>
                  <Badge variant="outline">Kapitel {kap.number}</Badge>
                </div>
                <h1 className="text-2xl font-bold mt-2">{kap.title_de}</h1>
                {kap.title_fr && <p className="text-muted-foreground italic">{kap.title_fr}</p>}
                {kap.subtitle && <p className="mt-1">{kap.subtitle}</p>}
              </div>
            </div>
            {(isTeacher || isAdmin) && sections.length === 0 && (
              <Button onClick={generate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Sparkles className="h-4 w-4 mr-2" />}
                Générer le contenu (IA)
              </Button>
            )}
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Progression</span><span>{done}/{total} sections</span></div>
            <Progress value={pct} />
          </div>
        </Card>

        {sections.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Ce chapitre n'a pas encore de contenu. {isTeacher || isAdmin ? "Cliquez sur « Générer le contenu » ci-dessus." : "Reviens bientôt — l'enseignant va le préparer."}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
            <div className="space-y-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${(active?.id===s.id) ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{KIND_ICONS[s.kind] || "📄"}</span>
                      <span className="font-medium text-sm">{s.title}</span>
                    </div>
                    {progress[s.id] && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </div>
                  {s.estimated_minutes && <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{s.estimated_minutes} min</div>}
                </button>
              ))}
            </div>

            <div>
              {active && <SectionView section={active} done={!!progress[active.id]} onToggle={() => markDone(active)} />}
            </div>
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}

function SectionView({ section, done, onToggle }: { section: Section; done: boolean; onToggle: () => void }) {
  const c = section.content || {};
  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">{KIND_ICONS[section.kind]}</span> {section.title}
        </h2>
        <Button size="sm" variant={done ? "secondary" : "default"} onClick={onToggle}>
          {done ? <><CheckCircle2 className="h-4 w-4 mr-1" /> Terminé</> : "Marquer terminé"}
        </Button>
      </div>

      {Array.isArray(c.objectives) && c.objectives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Objectifs</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {c.objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      )}

      {c.intro_de && (
        <div>
          <p className="text-base">{c.intro_de}</p>
          {c.intro_fr && <p className="text-sm text-muted-foreground italic mt-1">{c.intro_fr}</p>}
        </div>
      )}

      {Array.isArray(c.key_phrases) && c.key_phrases.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Wortschatz</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {c.key_phrases.map((p: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border bg-card flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{p.de}</div>
                  {p.fr && <div className="text-xs text-muted-foreground">{p.fr}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => speak(p.de)}><Volume2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(c.grammar_rules) && c.grammar_rules.map((g: any, i: number) => (
        <div key={i} className="p-4 rounded-lg border bg-muted/30 space-y-2">
          <h4 className="font-semibold">{g.title}</h4>
          {g.explanation_fr && <p className="text-sm">{g.explanation_fr}</p>}
          {Array.isArray(g.examples) && (
            <ul className="text-sm space-y-1">
              {g.examples.map((e: string, j: number) => (
                <li key={j} className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => speak(e)}><Volume2 className="h-3 w-3" /></Button>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {Array.isArray(c.dialogue) && c.dialogue.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dialog</h3>
          {c.dialogue.map((d: any, i: number) => (
            <div key={i} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-primary">{d.speaker}</div>
                  <div>{d.de}</div>
                  {d.fr && <div className="text-xs text-muted-foreground italic">{d.fr}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => speak(d.de)}><Volume2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {c.reading_text && (
        <div className="p-4 rounded-lg border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Text</h3>
            <Button size="sm" variant="outline" onClick={() => speak(c.reading_text)}><PlayCircle className="h-4 w-4 mr-1" /> Lire</Button>
          </div>
          <p className="whitespace-pre-line">{c.reading_text}</p>
          {c.reading_translation_fr && <p className="text-sm text-muted-foreground italic mt-2">{c.reading_translation_fr}</p>}
        </div>
      )}

      {c.speaking_prompt && (
        <div className="p-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5">
          <h3 className="font-semibold mb-1">🗣️ Sprechen</h3>
          <p>{c.speaking_prompt}</p>
        </div>
      )}

      {c.writing_prompt && (
        <div className="p-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5">
          <h3 className="font-semibold mb-1">✍️ Schreiben</h3>
          <p>{c.writing_prompt}</p>
        </div>
      )}

      {Array.isArray(c.exercises) && c.exercises.length > 0 && (
        <Exercises items={c.exercises} />
      )}
    </Card>
  );
}

function Exercises({ items }: { items: any[] }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Übungen</h3>
      {items.map((q: any, i: number) => {
        const userAns = answers[i] ?? "";
        const isOk = checked && userAns.trim().toLowerCase() === String(q.answer).trim().toLowerCase();
        const isWrong = checked && userAns && !isOk;
        return (
          <div key={i} className={`p-3 rounded-lg border ${isOk ? "border-emerald-500/50 bg-emerald-500/5" : isWrong ? "border-rose-500/50 bg-rose-500/5" : "bg-card"}`}>
            <div className="font-medium text-sm mb-2">{i + 1}. {q.prompt}</div>
            {q.type === "mcq" && Array.isArray(q.options) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {q.options.map((o: string, j: number) => (
                  <label key={j} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent cursor-pointer">
                    <input type="radio" name={`q-${i}`} checked={userAns === o} onChange={() => setAnswers({ ...answers, [i]: o })} />
                    {o}
                  </label>
                ))}
              </div>
            ) : (
              <input className="w-full px-3 py-2 rounded-md border bg-background text-sm" value={userAns} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} placeholder="Réponse…" />
            )}
            {checked && (
              <div className="text-xs mt-2">
                <span className="font-semibold">Réponse :</span> {q.answer}
                {q.explanation_fr && <span className="text-muted-foreground"> — {q.explanation_fr}</span>}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex gap-2">
        <Button onClick={() => setChecked(true)}>Vérifier</Button>
        {checked && <Button variant="outline" onClick={() => { setChecked(false); setAnswers({}); }}>Recommencer</Button>}
      </div>
    </div>
  );
}
