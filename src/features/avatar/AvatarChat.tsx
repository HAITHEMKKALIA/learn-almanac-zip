import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface Props {
  onSpeak: (text: string) => Promise<void> | void;
  speaking?: boolean;
}

// Extract just the German portion (before ---FR---) for TTS + display headline
function splitReply(raw: string): { de: string; fr: string } {
  const [de, ...rest] = raw.split(/---FR---/i);
  const afterFr = rest.join("---FR---");
  const [fr] = afterFr.split(/---AR---/i);
  return { de: (de ?? "").trim(), fr: (fr ?? "").trim() };
}

export function AvatarChat({ onSpeak, speaking }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    setSupportsSpeech(Boolean(SR));
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;
    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: clean }];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Votre session a expiré. Reconnectez-vous.");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/deutsch-tutor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: publishableKey,
        },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok || !response.body) {
        const details = await response.text().catch(() => "");
        throw new Error(details || `Le tuteur a répondu ${response.status}.`);
      }

      // Add empty assistant slot we'll fill as tokens arrive
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let assembled = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              assembled += delta;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = { role: "assistant", content: assembled };
                }
                return copy;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }

      const { de } = splitReply(assembled);
      if (de) await onSpeak(de);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Impossible d'atteindre le professeur.";
      toast.error(msg);
      setMessages((prev) => {
        // remove empty assistant slot on failure
        if (prev.length && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setSending(false);
    }
  };

  const toggleMic = () => {
    if (!supportsSpeech) {
      toast.error("La saisie vocale n'est pas prise en charge par ce navigateur. Utilisez Chrome ou Edge.");
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "de-DE";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = (event: any) => {
      toast.error(`Micro : ${event.error ?? "erreur inconnue"}`);
    };
    rec.onend = () => {
      setRecording(false);
      const spoken = finalText.trim();
      if (spoken) void send(spoken);
    };
    recognitionRef.current = rec;
    setRecording(true);
    try {
      rec.start();
    } catch {
      setRecording(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Discuter avec le professeur
          </h2>
          <p className="text-xs text-muted-foreground">
            Écrivez ou parlez en allemand — le professeur répond et l'avatar prononce sa réponse.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">de-DE</Badge>
      </div>

      <div
        ref={scrollerRef}
        className="mb-3 h-64 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3 text-sm"
      >
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-xs text-muted-foreground">
            <div>
              <p>Commencez : « Hallo! Wie heißt du? »</p>
              <p className="mt-1">Le professeur corrige vos erreurs (❌ → ✅).</p>
            </div>
          </div>
        )}
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          const parsed = !isUser ? splitReply(m.content) : null;
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 leading-snug ${
                  isUser ? "bg-primary text-primary-foreground" : "bg-background border"
                }`}
              >
                {isUser ? (
                  <span>{m.content}</span>
                ) : (
                  <div className="space-y-1">
                    <p className="font-medium">{parsed?.de || "…"}</p>
                    {parsed?.fr && (
                      <p className="text-[11px] text-muted-foreground italic">🇫🇷 {parsed.fr}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Le professeur réfléchit…
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={recording ? "destructive" : "outline"}
          size="icon"
          onClick={toggleMic}
          disabled={sending || speaking}
          aria-label={recording ? "Arrêter le micro" : "Parler"}
          title={supportsSpeech ? "Parler en allemand" : "Micro non pris en charge"}
        >
          {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder={recording ? "🎙️ Parlez maintenant…" : "Écrivez en allemand…"}
          disabled={sending}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => void send(input)}
          disabled={sending || !input.trim()}
          aria-label="Envoyer"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {messages.length > 0 && (
        <button
          type="button"
          onClick={() => {
            const last = [...messages].reverse().find((m) => m.role === "assistant");
            if (last) {
              const { de } = splitReply(last.content);
              if (de) void onSpeak(de);
            }
          }}
          disabled={speaking}
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
        >
          <Volume2 className="h-3 w-3" /> Réécouter la dernière réponse
        </button>
      )}
    </Card>
  );
}
