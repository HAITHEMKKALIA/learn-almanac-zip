import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mic, Square, Loader2, Volume2, Sparkles } from "lucide-react";

const PROMPTS: Record<string, string[]> = {
  A1: ["Ich heiße Anna und komme aus Tunis.", "Wie geht es dir heute?", "Ich hätte gern einen Kaffee, bitte."],
  A2: ["Am Wochenende gehe ich oft ins Kino mit meinen Freunden.", "Können Sie mir bitte den Weg zum Bahnhof zeigen?", "Gestern habe ich einen sehr interessanten Film gesehen."],
  B1: ["Wenn ich mehr Zeit hätte, würde ich jeden Tag Deutsch lernen.", "Meiner Meinung nach ist Umweltschutz sehr wichtig für unsere Zukunft.", "Obwohl es regnete, sind wir spazieren gegangen."],
  B2: ["Die Digitalisierung verändert unsere Arbeitswelt grundlegend und stellt uns vor neue Herausforderungen.", "Es lässt sich nicht leugnen, dass Bildung der Schlüssel zum Erfolg ist."],
};

type Eval = {
  pronunciation_score?: number;
  grammar_score?: number;
  vocabulary_score?: number;
  overall_score?: number;
  feedback_fr?: string;
  corrected_de?: string;
  next_challenge_de?: string;
};

export default function VoiceCoach() {
  const [level, setLevel] = useState("A2");
  const [mode, setMode] = useState<"repeat" | "free">("repeat");
  const [target, setTarget] = useState(PROMPTS.A2[0]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [evalResult, setEvalResult] = useState<Eval | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    speechSynthesis.speak(u);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 2000) {
          toast.error("Enregistrement trop court, réessayez.");
          return;
        }
        await send(blob, mime);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      toast.error("Micro inaccessible.");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const send = async (blob: Blob, mimeType: string) => {
    setLoading(true);
    setTranscript("");
    setEvalResult(null);
    try {
      const buf = await blob.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const audioBase64 = btoa(bin);
      const { data, error } = await supabase.functions.invoke("voice-coach", {
        body: { audioBase64, mimeType, expected: mode === "repeat" ? target : undefined, mode, level },
      });
      if (error) throw error;
      setTranscript(data.transcript || "");
      setEvalResult(data.evaluation || {});
    } catch (e) {
      toast.error("Analyse échouée: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const nextPrompt = () => {
    const list = PROMPTS[level];
    const cur = list.indexOf(target);
    setTarget(list[(cur + 1) % list.length]);
    setEvalResult(null);
    setTranscript("");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-3xl mx-auto">
      <Link to="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Coach Vocal DE</h1>
          <p className="text-sm text-muted-foreground">Prononciation, grammaire et fluidité notées par l'IA.</p>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground">Niveau</label>
            <Select value={level} onValueChange={(v) => { setLevel(v); setTarget(PROMPTS[v][0]); setEvalResult(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(PROMPTS).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mode</label>
            <Select value={mode} onValueChange={(v: "repeat" | "free") => setMode(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="repeat">Répéter une phrase</SelectItem>
                <SelectItem value="free">Conversation libre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            {mode === "repeat" && (
              <Button variant="outline" className="w-full" onClick={nextPrompt}>Phrase suivante</Button>
            )}
          </div>
        </div>
      </Card>

      {mode === "repeat" && (
        <Card className="p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-1">Phrase cible</div>
          <div className="flex items-start gap-2">
            <div className="text-xl font-semibold flex-1">{target}</div>
            <Button variant="ghost" size="icon" onClick={() => speak(target)}><Volume2 className="w-5 h-5" /></Button>
          </div>
        </Card>
      )}

      <div className="flex justify-center mb-6">
        {!recording ? (
          <Button size="lg" onClick={start} disabled={loading} className="rounded-full w-24 h-24">
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mic className="w-10 h-10" />}
          </Button>
        ) : (
          <Button size="lg" variant="destructive" onClick={stop} className="rounded-full w-24 h-24 animate-pulse">
            <Square className="w-8 h-8" />
          </Button>
        )}
      </div>

      {transcript && (
        <Card className="p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-1">Ce que vous avez dit</div>
          <div className="text-lg">{transcript}</div>
        </Card>
      )}

      {evalResult && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Score global</div>
            <Badge variant="secondary" className="text-lg">{evalResult.overall_score ?? "-"}/100</Badge>
          </div>
          {(["pronunciation_score","grammar_score","vocabulary_score"] as const).map((k) => (
            <div key={k}>
              <div className="flex justify-between text-xs mb-1">
                <span>{k === "pronunciation_score" ? "Prononciation" : k === "grammar_score" ? "Grammaire" : "Vocabulaire"}</span>
                <span>{evalResult[k] ?? 0}/100</span>
              </div>
              <Progress value={evalResult[k] ?? 0} />
            </div>
          ))}
          {evalResult.feedback_fr && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Conseils</div>
              <div className="text-sm">{evalResult.feedback_fr}</div>
            </div>
          )}
          {evalResult.corrected_de && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Version corrigée</div>
              <div className="flex items-start gap-2">
                <div className="text-sm font-medium flex-1">{evalResult.corrected_de}</div>
                <Button variant="ghost" size="icon" onClick={() => speak(evalResult.corrected_de!)}><Volume2 className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
          {evalResult.next_challenge_de && (
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground mb-1">Défi suivant</div>
              <div className="flex items-start gap-2">
                <div className="text-sm flex-1">{evalResult.next_challenge_de}</div>
                <Button variant="ghost" size="icon" onClick={() => speak(evalResult.next_challenge_de!)}><Volume2 className="w-4 h-4" /></Button>
              </div>
              {mode === "repeat" && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => { setTarget(evalResult.next_challenge_de!); setEvalResult(null); setTranscript(""); }}>
                  Essayer ce défi
                </Button>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
