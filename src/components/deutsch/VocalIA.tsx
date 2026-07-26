import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SpeakBtn } from "./SpeakBtn";

interface Props { onBack: () => void; }

interface DebugStep {
  name: string;
  status: "ok" | "error" | "info";
  ms?: number;
  detail?: string;
}

interface VoiceAnalysis {
  transcription_de: string;
  traduction_fr: string;
  resume_fr: string;
  vocabulaire: { de: string; fr: string }[];
  exercices: { question: string; reponse: string; explication: string }[];
  corrections: { erreur: string; correction: string; pourquoi: string }[];
  conseils: string[];
}

type Mode = "menu" | "recording" | "uploading" | "analyzing" | "result" | "error";

export function VocalIA({ onBack }: Props) {
  const [mode, setMode] = useState<Mode>("menu");
  const [recTime, setRecTime] = useState(0);
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState("");
  const [debugRequestId, setDebugRequestId] = useState<string>("");
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { stopRec(); if (timerRef.current) clearInterval(timerRef.current); }, []);

  const stopRec = () => {
    try { mediaRef.current?.stop(); mediaRef.current?.stream.getTracks().forEach(t => t.stop()); } catch {}
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob, "audio/webm");
      };
      mr.start(); mediaRef.current = mr; setMode("recording"); setRecTime(0);
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } catch (e) {
      setErrorMsg("Impossible d'accéder au micro. Autorise l'accès au micro dans ton navigateur."); setMode("error");
    }
  };

  const stopRecording = () => {
    stopRec();
    setMode("uploading");
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      setErrorMsg("Fichier trop gros (max 50 MB)."); setMode("error"); return;
    }
    setMode("uploading");
    await processAudio(f, f.type || "audio/mpeg");
  };

  const processAudio = async (blob: Blob | File, mimeType: string) => {
    try {
      // 1) Upload to storage
      setProgress("📤 Envoi de l'audio…");
      const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "mp3" : mimeType.includes("wav") ? "wav" : mimeType.includes("m4a") || mimeType.includes("mp4") ? "m4a" : "webm";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("voice-uploads").upload(filename, blob, {
        contentType: mimeType, upsert: false,
      });
      if (upErr) { setErrorMsg("Échec d'upload : " + upErr.message); setMode("error"); return; }

      const { data: urlData } = supabase.storage.from("voice-uploads").getPublicUrl(filename);

      // 2) Call edge function
      setMode("analyzing");
      setProgress("🤖 Le professeur IA analyse ton audio (1-2 min)…");
      const { data, error } = await supabase.functions.invoke("voice-coach", {
        body: { audioUrl: urlData.publicUrl, mimeType },
      });

      // Capture debug info from response (present even on errors)
      const payload = (data as any) ?? {};
      if (payload.requestId) setDebugRequestId(payload.requestId);
      if (Array.isArray(payload.steps)) setDebugSteps(payload.steps);

      if (error) {
        setErrorMsg("Erreur IA : " + error.message);
        setMode("error");
        return;
      }
      if (payload.error) {
        setErrorMsg(payload.error);
        setMode("error");
        return;
      }

      setAnalysis(data as VoiceAnalysis);
      setMode("result");
    } catch (e: any) {
      setErrorMsg(String(e?.message || e));
      setMode("error");
    }
  };

  const reset = () => {
    setAnalysis(null); setErrorMsg(""); setMode("menu"); setShowAnswers({});
    setDebugRequestId(""); setDebugSteps([]); setDebugOpen(false);
  };

  // ===== UI =====
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={mode === "result" || mode === "error" ? reset : onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <h3 className="text-foreground m-0 text-base flex-1">🎤 Vocal IA — Coach personnel</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {mode === "menu" && (
          <div>
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4">
              <div className="text-foreground text-sm font-bold mb-1">🎯 Comment ça marche ?</div>
              <div className="text-muted-foreground text-xs leading-relaxed">
                Parle en allemand pendant 10 à 15 minutes (ou envoie un audio existant). Le professeur IA va :
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>📝 <b>Transcrire</b> ce que tu as dit en allemand</li>
                  <li>🇫🇷 <b>Traduire</b> tout en français</li>
                  <li>📋 <b>Résumer</b> les idées principales</li>
                  <li>📚 Extraire le <b>vocabulaire clé</b></li>
                  <li>🎯 Créer 5 <b>exercices</b> personnalisés</li>
                  <li>✅ <b>Corriger</b> tes erreurs</li>
                  <li>💡 Te donner des <b>conseils</b> pour t'améliorer</li>
                </ul>
              </div>
            </div>

            <button
              onClick={startRecording}
              className="w-full p-5 mb-3 rounded-2xl border-none bg-primary text-primary-foreground font-bold text-base cursor-pointer flex flex-col items-center gap-1"
            >
              <span className="text-3xl">🎤</span>
              <span>Enregistrer maintenant</span>
              <span className="text-xs opacity-80 font-normal">10-15 minutes en allemand</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-5 rounded-2xl border-2 border-primary bg-card text-foreground font-bold text-base cursor-pointer flex flex-col items-center gap-1"
            >
              <span className="text-3xl">📁</span>
              <span>Envoyer un fichier audio</span>
              <span className="text-xs opacity-70 font-normal">.mp3, .m4a, .wav, .webm (max 50 MB)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg"
              className="hidden"
              onChange={e => onFile(e.target.files?.[0])}
            />
          </div>
        )}

        {mode === "recording" && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="text-7xl mb-4 animate-pulse">🔴</div>
            <div className="text-4xl font-bold text-primary mb-2">{Math.floor(recTime / 60)}:{String(recTime % 60).padStart(2, "0")}</div>
            <div className="text-muted-foreground text-sm mb-6">Parle en allemand…</div>
            <button onClick={stopRecording} className="px-8 py-3 rounded-2xl bg-destructive text-destructive-foreground font-bold cursor-pointer">
              ⏹️ Stop & Analyser
            </button>
            <div className="text-muted-foreground text-[11px] mt-4 text-center max-w-xs">
              Conseil : parle de ta journée, ta famille, ton travail, tes voyages…
            </div>
          </div>
        )}

        {(mode === "uploading" || mode === "analyzing") && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="text-6xl mb-4 animate-spin">⚙️</div>
            <div className="text-foreground font-bold text-base mb-2">{progress || "En cours…"}</div>
            <div className="text-muted-foreground text-xs text-center max-w-xs">
              Cela peut prendre 1 à 2 minutes pour un audio long. Ne ferme pas la page.
            </div>
          </div>
        )}

        {mode === "error" && (
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">😕</div>
              <div className="text-foreground font-bold text-base mb-2">Erreur</div>
              <div className="text-muted-foreground text-sm mb-4 max-w-xs mx-auto">{errorMsg}</div>
              <button onClick={reset} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold cursor-pointer">
                Réessayer
              </button>
            </div>

            {(debugRequestId || debugSteps.length > 0) && (
              <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setDebugOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 cursor-pointer border-none text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔍</span>
                    <span className="text-foreground text-sm font-bold">Détails techniques (debug)</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{debugOpen ? "▲" : "▼"}</span>
                </button>

                {debugOpen && (
                  <div className="p-3 space-y-3">
                    {debugRequestId && (
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wide mb-1">Request ID</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-foreground text-xs font-mono bg-muted px-2 py-1.5 rounded break-all">
                            {debugRequestId}
                          </code>
                          <button
                            onClick={() => navigator.clipboard?.writeText(debugRequestId)}
                            className="text-primary text-xs font-bold cursor-pointer px-2 py-1.5 rounded hover:bg-muted border-none bg-transparent"
                            title="Copier"
                          >
                            📋
                          </button>
                        </div>
                        <div className="text-muted-foreground text-[10px] mt-1">
                          Donne cet ID au support pour retrouver les logs.
                        </div>
                      </div>
                    )}

                    {debugSteps.length > 0 && (
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wide mb-1.5">
                          Étapes ({debugSteps.length})
                        </div>
                        <div className="space-y-1">
                          {debugSteps.map((s, i) => {
                            const isErr = s.status === "error";
                            const isOk = s.status === "ok";
                            const icon = isErr ? "❌" : isOk ? "✅" : "ℹ️";
                            const colorClass = isErr
                              ? "border-destructive/40 bg-destructive/5"
                              : isOk
                              ? "border-success/30 bg-success/5"
                              : "border-border bg-background";
                            return (
                              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${colorClass}`}>
                                <span className="text-sm leading-none mt-0.5">{icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-foreground text-xs font-medium truncate">{s.name}</div>
                                    {typeof s.ms === "number" && (
                                      <div className="text-muted-foreground text-[10px] font-mono shrink-0">{s.ms}ms</div>
                                    )}
                                  </div>
                                  {s.detail && (
                                    <div className={`text-[11px] mt-0.5 break-words ${isErr ? "text-destructive" : "text-muted-foreground"}`}>
                                      {s.detail}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const txt = `Request ID: ${debugRequestId}\nError: ${errorMsg}\n\nSteps:\n` +
                          debugSteps.map((s, i) => `${i + 1}. [${s.status.toUpperCase()}] ${s.name}${s.ms ? ` (${s.ms}ms)` : ""}${s.detail ? ` — ${s.detail}` : ""}`).join("\n");
                        navigator.clipboard?.writeText(txt);
                      }}
                      className="w-full text-xs font-bold text-primary cursor-pointer py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10"
                    >
                      📋 Copier tout le rapport
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "result" && analysis && (
          <div className="space-y-4">
            {/* Résumé */}
            <Section icon="📋" title="Résumé en français">
              <p className="text-foreground text-sm leading-relaxed">{analysis.resume_fr}</p>
            </Section>

            {/* Transcription DE */}
            <Section icon="🇩🇪" title="Transcription (allemand)">
              <div className="flex gap-2 items-start">
                <p className="text-foreground text-sm leading-relaxed flex-1">{analysis.transcription_de}</p>
                <SpeakBtn text={analysis.transcription_de} size={16} />
              </div>
            </Section>

            {/* Traduction FR */}
            <Section icon="🇫🇷" title="Traduction française">
              <p className="text-foreground text-sm leading-relaxed italic">{analysis.traduction_fr}</p>
            </Section>

            {/* Vocabulaire */}
            <Section icon="📝" title={`Vocabulaire clé (${analysis.vocabulaire?.length || 0})`}>
              <div className="space-y-1.5">
                {analysis.vocabulaire?.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="text-foreground text-sm font-medium">{v.de}</div>
                      <div className="text-muted-foreground text-xs">{v.fr}</div>
                    </div>
                    <SpeakBtn text={v.de} size={14} />
                  </div>
                ))}
              </div>
            </Section>

            {/* Corrections */}
            {analysis.corrections?.length > 0 && (
              <Section icon="⚠️" title={`Erreurs corrigées (${analysis.corrections.length})`}>
                <div className="space-y-2">
                  {analysis.corrections.map((c, i) => (
                    <div key={i} className="p-2.5 bg-background rounded-lg border border-border">
                      <div className="text-destructive text-sm font-bold mb-1">❌ {c.erreur}</div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="text-success text-sm font-bold flex-1">✅ {c.correction}</div>
                        <SpeakBtn text={c.correction} size={14} />
                      </div>
                      <div className="text-muted-foreground text-xs italic">💡 {c.pourquoi}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Exercices */}
            {analysis.exercices?.length > 0 && (
              <Section icon="🎯" title={`Exercices (${analysis.exercices.length})`}>
                <div className="space-y-2">
                  {analysis.exercices.map((ex, i) => (
                    <div key={i} className="p-3 bg-background rounded-lg border border-border">
                      <div className="text-foreground text-sm font-medium mb-2">Q{i + 1}. {ex.question}</div>
                      <button
                        onClick={() => setShowAnswers(s => ({ ...s, [i]: !s[i] }))}
                        className="text-primary text-xs font-bold cursor-pointer hover:underline"
                      >
                        {showAnswers[i] ? "🙈 Cacher la réponse" : "👀 Voir la réponse"}
                      </button>
                      {showAnswers[i] && (
                        <div className="mt-2 p-2 bg-success/10 border border-success/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="text-success text-sm font-bold flex-1">✅ {ex.reponse}</div>
                            <SpeakBtn text={ex.reponse} size={14} />
                          </div>
                          <div className="text-muted-foreground text-xs italic mt-1">💡 {ex.explication}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Conseils */}
            {analysis.conseils?.length > 0 && (
              <Section icon="💡" title="Conseils du prof">
                <ul className="space-y-1.5">
                  {analysis.conseils.map((c, i) => (
                    <li key={i} className="text-foreground text-sm leading-relaxed flex gap-2">
                      <span className="text-primary">•</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <button onClick={reset} className="w-full p-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm cursor-pointer">
              🎤 Nouvel enregistrement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div className="text-primary font-bold text-sm mb-2 flex items-center gap-2">
        <span>{icon}</span><span>{title}</span>
      </div>
      {children}
    </div>
  );
}
