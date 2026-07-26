import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Brain, Sparkles, Target, TrendingUp, Loader2 } from "lucide-react";

type PlacementQ = { level: string; skill: string; prompt_de: string; options: string[]; correct: string };
type Reco = { id: string; kind: string; title: string; description: string; priority: number; status: string };
type Prediction = { probability: number; advice: string; factors: any; computed_at: string };

export default function Adaptive() {
  const [loading, setLoading] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PlacementQ[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [recs, setRecs] = useState<Reco[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const load = async () => {
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("learning_recommendations").select("*").eq("status", "active").order("priority").limit(10),
      supabase.from("exam_predictions").select("*").order("computed_at", { ascending: false }).limit(1),
    ]);
    setRecs((r as any) || []);
    setPrediction((p?.[0] as any) || null);
  };
  useEffect(() => { load(); }, []);

  const startPlacement = async () => {
    setLoading("placement"); setResult(null);
    const { data, error } = await supabase.functions.invoke("ai-adaptive", { body: { mode: "placement" } });
    setLoading(null);
    if (error || !data?.questions) { toast.error("Échec génération du test"); return; }
    setTestId(data.id); setQuestions(data.questions); setAnswers(Array(data.questions.length).fill(""));
  };

  const submitPlacement = async () => {
    setLoading("grade");
    const { data, error } = await supabase.functions.invoke("ai-adaptive", {
      body: { mode: "grade_placement", test_id: testId, answers },
    });
    setLoading(null);
    if (error) { toast.error("Erreur"); return; }
    setResult(data); setQuestions([]); setTestId(null);
    toast.success(`Niveau recommandé : ${data.recommended_level}`);
  };

  const generateRecs = async () => {
    setLoading("recs");
    const { error } = await supabase.functions.invoke("ai-adaptive", { body: { mode: "recommend" } });
    setLoading(null);
    if (error) { toast.error("Erreur"); return; }
    await load(); toast.success("Recommandations mises à jour");
  };

  const computePrediction = async () => {
    setLoading("predict");
    const { error } = await supabase.rpc("compute_exam_prediction", { _target_level: null });
    setLoading(null);
    if (error) { toast.error(error.message); return; }
    await load(); toast.success("Prédiction recalculée");
  };

  const dismissReco = async (id: string) => {
    await supabase.from("learning_recommendations").update({ status: "done" }).eq("id", id);
    load();
  };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Brain className="text-primary" /> IA adaptative</h1>
        <p className="text-muted-foreground">Test de positionnement, recommandations personnalisées, prédiction d'examen.</p>
      </div>

      {/* Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Prédiction de réussite à l'examen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {prediction ? (
            <>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-primary">{Math.round(prediction.probability)}%</div>
                <div className="flex-1">
                  <Progress value={prediction.probability} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">{prediction.advice}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {Object.entries(prediction.factors || {}).map(([k, v]) => (
                  <div key={k} className="p-2 bg-muted rounded">
                    <div className="text-muted-foreground uppercase">{k}</div>
                    <div className="font-semibold">{String(v)}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Aucune prédiction encore calculée.</p>
          )}
          <Button onClick={computePrediction} disabled={loading === "predict"} size="sm">
            {loading === "predict" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Recalculer
          </Button>
        </CardContent>
      </Card>

      {/* Placement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /> Test de positionnement CECRL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!questions.length && !result && (
            <Button onClick={startPlacement} disabled={loading === "placement"}>
              {loading === "placement" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Démarrer le test (15 questions)
            </Button>
          )}

          {questions.length > 0 && (
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="border rounded p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">{q.level}</Badge>
                    <Badge variant="secondary">{q.skill}</Badge>
                    <span className="text-sm font-medium">Q{i + 1}</span>
                  </div>
                  <p className="font-medium">{q.prompt_de}</p>
                  <div className="grid gap-1">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                        <input type="radio" name={`q${i}`} checked={answers[i] === opt}
                          onChange={() => { const n = [...answers]; n[i] = opt; setAnswers(n); }} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={submitPlacement} disabled={loading === "grade" || answers.some((a) => !a)}>
                {loading === "grade" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Soumettre
              </Button>
            </div>
          )}

          {result && (
            <div className="p-4 bg-primary/10 rounded space-y-2">
              <div className="text-2xl font-bold">Niveau recommandé : {result.recommended_level}</div>
              <div>Score : {result.score}%</div>
              {result.strengths?.length > 0 && <div>Forces : {result.strengths.join(", ")}</div>}
              {result.weaknesses?.length > 0 && <div>À travailler : {result.weaknesses.join(", ")}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Recommandations personnalisées</CardTitle>
          <Button size="sm" onClick={generateRecs} disabled={loading === "recs"}>
            {loading === "recs" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Générer
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recs.length === 0 && <p className="text-sm text-muted-foreground">Aucune recommandation active.</p>}
          {recs.map((r) => (
            <div key={r.id} className="border rounded p-3 flex gap-3 items-start">
              <Badge variant={r.priority <= 3 ? "destructive" : r.priority <= 6 ? "default" : "secondary"}>P{r.priority}</Badge>
              <div className="flex-1">
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-muted-foreground">{r.description}</div>
                <Badge variant="outline" className="mt-1 text-xs">{r.kind}</Badge>
              </div>
              <Button size="sm" variant="ghost" onClick={() => dismissReco(r.id)}>Fait</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
