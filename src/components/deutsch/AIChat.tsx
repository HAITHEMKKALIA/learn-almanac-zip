import { useState, useEffect, useRef, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { speakGerman } from "@/lib/voice";
import { useGamification } from "@/hooks/useGamification";
import { ProfessorAvatar } from "./ProfessorAvatar";
import type { Scenario } from "@/data/curriculum";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/lib/i18n";

interface AIChatProps {
  scenario: Scenario | null;
  onClose: () => void;
}

type Msg = { role: "user" | "assistant"; content: string; viaVoice?: boolean };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deutsch-tutor`;

interface LessonContext { id: string; title: string; vocab: string[] }


async function streamChat({
  messages,
  scenario,
  lessonContext,
  includeArabic,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  scenario: Scenario | null;
  lessonContext?: LessonContext | null;
  includeArabic?: boolean;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      scenario,
      lessonContext: lessonContext ? { title: lessonContext.title, vocab: lessonContext.vocab.slice(0, 40) } : undefined,
      includeArabic: !!includeArabic,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Netzwerkfehler" }));
    if (resp.status === 429) toast({ title: "⏳ Zu viele Anfragen", description: "Bitte warten Sie.", variant: "destructive" });
    else if (resp.status === 402) toast({ title: "💳 Guthaben aufgebraucht", variant: "destructive" });
    throw new Error(err.error || "Fehler");
  }

  if (!resp.body) throw new Error("No stream body");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim()) continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const json = raw.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {}
    }
  }
  onDone();
}

// Extract follow-up suggestions from assistant text
function extractSuggestions(text: string): string[] {
  const defaults = [
    "Kannst du das wiederholen?",
    "Erkläre mir die Grammatik.",
    "Gib mir ein Beispiel.",
    "Was bedeutet das?",
    "Wie sagt man das anders?",
    "Stell mir eine Frage.",
  ];
  const shuffled = defaults.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// Split German content from French + Arabic translations
function splitTranslation(text: string): { de: string; fr: string | null; ar: string | null } {
  const sepFr = "---FR---";
  const sepAr = "---AR---";
  const idxFr = text.indexOf(sepFr);
  const idxAr = text.indexOf(sepAr);
  if (idxFr === -1 && idxAr === -1) return { de: text, fr: null, ar: null };
  const de = (idxFr !== -1 ? text.slice(0, idxFr) : text.slice(0, idxAr)).trim();
  let fr: string | null = null;
  let ar: string | null = null;
  if (idxFr !== -1) {
    const end = idxAr !== -1 && idxAr > idxFr ? idxAr : text.length;
    fr = text.slice(idxFr + sepFr.length, end).trim();
  }
  if (idxAr !== -1) {
    ar = text.slice(idxAr + sepAr.length).trim();
  }
  return { de, fr, ar };
}

export function AIChat({ scenario, onClose }: AIChatProps) {
  const { lang } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoS, setAutoS] = useState(true);
  const [showTranslation, setShowTranslation] = useState(() => lang !== "ar");
  const [showArabic, setShowArabic] = useState<boolean>(() => lang === "ar" || lang === "both" || localStorage.getItem("dm_chat_ar") === "1");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showPoints, setShowPoints] = useState<{ pts: number; id: number } | null>(null);
  const [lessonPicker, setLessonPicker] = useState(false);
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(() => {
    try { const raw = localStorage.getItem("dm_chat_lesson"); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const { transcript, listening, supported, error, start, stop, setTranscript } = useSpeechRecognition();
  const { points, streak, level, levelProgress, addPoints } = useGamification();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem("dm_chat_ar", showArabic ? "1" : "0"); }, [showArabic]);
  // Sync with global language toggle
  useEffect(() => {
    if (lang === "ar") { setShowArabic(true); setShowTranslation(false); }
    else if (lang === "fr") { setShowArabic(false); setShowTranslation(true); }
    else if (lang === "de") { setShowArabic(false); setShowTranslation(false); }
    else if (lang === "both") { setShowTranslation(true); }
  }, [lang]);
  useEffect(() => {
    if (lessonContext) localStorage.setItem("dm_chat_lesson", JSON.stringify(lessonContext));
    else localStorage.removeItem("dm_chat_lesson");
  }, [lessonContext]);

  useEffect(() => {
    if (scenario) {
      setLoading(true);
      let text = "";
      streamChat({
        messages: [{ role: "user", content: "Beginne das Szenario. Begrüße mich und starte das Gespräch." }],
        scenario,
        lessonContext,
        includeArabic: showArabic,
        onDelta: (chunk) => { text += chunk; setMsgs([{ role: "assistant", content: text }]); },
        onDone: () => {
          setLoading(false);
          setSuggestions(extractSuggestions(text));
          if (autoS && text) {
            setIsSpeaking(true);
            speakGerman(text).finally(() => setIsSpeaking(false));
          }
        },
      }).catch(() => {
        setMsgs([{ role: "assistant", content: "Verbindungsfehler. Bitte versuchen Sie es erneut." }]);
        setLoading(false);
      });
    } else if (lessonContext) {
      // Greeting personnalisé sur la leçon choisie
      const sample = (lessonContext.vocab || []).slice(0, 3).join(", ");
      let recapBlock = "";
      try {
        const raw = localStorage.getItem("dm_pending_recap");
        if (raw) {
          const r = JSON.parse(raw);
          if (r && r.lessonId === lessonContext.id) {
            const mistakesDe = (r.mistakes || []).map((m: any) => `• ${m.q} → **${m.a}**`).join("\n");
            const verdict = r.scorePct >= 80 ? "🏆 Sehr gut!" : r.scorePct >= 60 ? "👍 Gut gemacht." : "📚 Weiter üben!";
            recapBlock = `\n\n---\n📊 **Récap rapide** : tu as obtenu **${r.score}/${r.total}** (${r.scorePct}%). ${verdict}\n${mistakesDe ? "\n❌ À revoir :\n" + mistakesDe + "\n" : "\n✅ Aucune erreur — magnifique !\n"}\n---FR---\n📊 Récap : ${r.score}/${r.total} — ${r.scorePct}%. ${r.scorePct >= 60 ? "Bon travail !" : "On reprend les points faibles ensemble."}\n---AR---\n📊 ملخّص: ${r.score}/${r.total} — ${r.scorePct}%. ${r.scorePct >= 60 ? "عمل جيد!" : "سنراجع النقاط الضعيفة معاً."}`;
            localStorage.removeItem("dm_pending_recap");
          }
        }
      } catch {}
      const greeting = `Hallo! 👋 Ich bin dein Deutschlehrer.\n\n📖 Heute arbeiten wir an: **${lessonContext.title}**.\n\nIch stelle dir Fragen NUR zu dieser Lektion (${sample ? `z.B. ${sample}…` : "Vokabular und Grammatik"}). Bist du bereit? ✅${recapBlock ? "" : "\n\n---FR---\n📖 Aujourd'hui on travaille sur : **" + lessonContext.title + "**. Je te poserai des questions uniquement sur cette leçon. Prêt ?\n---AR---\n📖 اليوم نعمل على: **" + lessonContext.title + "**. سأطرح عليك أسئلة حول هذا الدرس فقط. هل أنت مستعد؟"}${recapBlock}`;
      setMsgs([{ role: "assistant", content: greeting }]);
      setSuggestions(recapBlock
        ? ["Erkläre mir meine Fehler.", "Stell mir die nächste Frage.", "Wiederholen wir das Vokabular."]
        : ["Ja, ich bin bereit!", "Stell mir die erste Frage.", "Erkläre mir das Vokabular."]);
    } else {
      const greeting = "Hallo! 👋 Ich bin dein Deutschlehrer.\n\nWie heißt du? Und warum lernst du Deutsch? 🇩🇪\n\nSchreib mir einfach auf Deutsch — ich helfe dir! ✅❌💡";
      setMsgs([{ role: "assistant", content: greeting }]);
      setSuggestions(["Ich heiße... und ich lerne Deutsch, weil...", "Stell mir eine Frage!", "Ich möchte Grammatik üben."]);
    }
  }, [lessonContext?.id, scenario]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  // Listen for lesson-finished event → append recap inline
  useEffect(() => {
    const handler = (e: Event) => {
      const r: any = (e as CustomEvent).detail;
      if (!r) return;
      const mistakesDe = (r.mistakes || []).map((m: any) => `• ${m.q} → **${m.a}**`).join("\n");
      const verdict = r.scorePct >= 80 ? "🏆 Sehr gut!" : r.scorePct >= 60 ? "👍 Gut gemacht." : "📚 Weiter üben!";
      const recap = `📊 **Lektion beendet** — **${r.score}/${r.total}** (${r.scorePct}%). ${verdict}\n${mistakesDe ? "\n❌ Zu wiederholen:\n" + mistakesDe : "\n✅ Keine Fehler — perfekt!"}\n\n---FR---\n📊 Leçon terminée : ${r.score}/${r.total} — ${r.scorePct}%. ${r.scorePct >= 60 ? "Bon travail !" : "Reprenons les points faibles."}\n---AR---\n📊 انتهى الدرس: ${r.score}/${r.total} — ${r.scorePct}%. ${r.scorePct >= 60 ? "أحسنت!" : "لنراجع النقاط الضعيفة."}`;
      setMsgs(m => [...m, { role: "assistant", content: recap }]);
      setSuggestions(["Erkläre mir meine Fehler.", "Gib mir eine Übung dazu.", "Weiter mit dem nächsten Thema."]);
      try { localStorage.removeItem("dm_pending_recap"); } catch {}
    };
    window.addEventListener("dm-lesson-finished", handler);
    return () => window.removeEventListener("dm-lesson-finished", handler);
  }, []);

  // When speech recognition finishes, auto-send
  useEffect(() => {
    if (transcript && !listening) {
      setInput(transcript);
      // Auto-send after voice input finishes
      setTimeout(() => {
        sendMsg(transcript, true);
        setTranscript("");
      }, 300);
    } else if (transcript && listening) {
      setInput(transcript);
    }
  }, [transcript, listening]);

  const animatePoints = (pts: number) => {
    const id = Date.now();
    setShowPoints({ pts, id });
    setTimeout(() => setShowPoints(null), 1500);
  };

  const sendMsg = useCallback(async (text?: string, viaVoice?: boolean) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: msg, viaVoice };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    setSuggestions([]);

    // Points for sending a message
    addPoints(5, "message");
    if (viaVoice) { addPoints(10, "speak"); animatePoints(15); }
    else animatePoints(5);

    let assistantText = "";
    const upsert = (chunk: string) => {
      assistantText += chunk;
      setMsgs(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === newMsgs.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
        }
        return [...prev, { role: "assistant", content: assistantText }];
      });
    };

    try {
      await streamChat({
        messages: newMsgs.slice(-20),
        scenario,
        lessonContext,
        includeArabic: showArabic,
        onDelta: upsert,
        onDone: () => {
          setLoading(false);
          setSuggestions(extractSuggestions(assistantText));
          // Bonus points if AI says ✅
          if (assistantText.includes("✅")) { addPoints(15, "correct"); animatePoints(15); }
          if (autoS && assistantText) {
            setIsSpeaking(true);
            speakGerman(assistantText).finally(() => setIsSpeaking(false));
          }
        },
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
      setMsgs(m => [...m, { role: "assistant", content: "❌ Verbindungsfehler. Bitte erneut versuchen." }]);
    }
  }, [input, msgs, loading, scenario, autoS, addPoints, lessonContext, showArabic]);

  const send = () => sendMsg();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with gamification */}
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-3 bg-card/50 backdrop-blur-sm">
        <button onClick={onClose} className="bg-transparent border-none text-muted-foreground text-lg cursor-pointer hover:text-foreground transition-colors">
          ←
        </button>
        <ProfessorAvatar speaking={isSpeaking} listening={listening} thinking={loading && !isSpeaking} size="md" streak={streak} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground text-[14px] truncate">
            {scenario ? `${scenario.icon} ${scenario.title}` : "Herr Professor"}
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Online
            </span>
            <span className="text-warning font-bold">⭐ {points}</span>
            <span className="text-muted-foreground">Lv.{level}</span>
            {streak > 0 && <span className="text-warning">🔥{streak}</span>}
          </div>
          {/* Level progress bar */}
          <div className="h-1 bg-border rounded-full mt-0.5 overflow-hidden w-24">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
        <button
          onClick={() => setLessonPicker(true)}
          title="Choisir la leçon"
          className={`rounded-full h-8 px-2 flex items-center gap-1 text-xs cursor-pointer border transition-all ${
            lessonContext ? "bg-success/15 border-success/30 text-success" : "bg-transparent border-border text-muted-foreground"
          }`}
        >
          📖 {lessonContext ? lessonContext.title.slice(0, 12) + (lessonContext.title.length > 12 ? "…" : "") : "Leçon"}
        </button>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`rounded-full w-8 h-8 flex items-center justify-center text-sm cursor-pointer border transition-all ${
            showTranslation ? "bg-blue-500/15 border-blue-500/30 text-blue-400" : "bg-transparent border-border text-muted-foreground"
          }`}
          title={showTranslation ? "Masquer FR" : "Afficher FR"}
        >
          🇫🇷
        </button>
        <button
          onClick={() => setShowArabic(!showArabic)}
          className={`rounded-full w-8 h-8 flex items-center justify-center text-sm cursor-pointer border transition-all ${
            showArabic ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-transparent border-border text-muted-foreground"
          }`}
          title={showArabic ? "Masquer AR" : "Afficher AR (الترجمة العربية)"}
        >
          🇸🇦
        </button>
        <button
          onClick={() => setAutoS(!autoS)}
          className={`rounded-full w-8 h-8 flex items-center justify-center text-sm cursor-pointer border transition-all ${
            autoS ? "bg-primary/15 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground"
          }`}
        >
          {autoS ? "🔊" : "🔇"}
        </button>
      </div>

      {lessonPicker && (
        <LessonPicker
          current={lessonContext}
          onClose={() => setLessonPicker(false)}
          onPick={(c) => { setLessonContext(c); setLessonPicker(false); }}
          onClear={() => { setLessonContext(null); setLessonPicker(false); }}
        />
      )}

      {/* Floating points animation */}
      {showPoints && (
        <div key={showPoints.id} className="fixed top-16 right-4 z-50 text-warning font-bold text-lg animate-slide-up pointer-events-none">
          +{showPoints.pts} ⭐
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2 animate-slide-up`}>
            {m.role === "assistant" && (
              <div className="flex-shrink-0 mt-1">
                <ProfessorAvatar size="sm" speaking={isSpeaking && i === msgs.length - 1} />
              </div>
            )}
            <div className="max-w-[82%]">
              {m.role === "assistant" ? (() => {
                const { de, fr, ar } = splitTranslation(m.content);
                return (
                  <>
                    <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-card border border-border text-foreground rounded-2xl rounded-bl-sm">
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_p+p]:mt-1.5 [&_ul]:mt-1 [&_ol]:mt-1 [&_li]:mt-0.5">
                        <ReactMarkdown>{de}</ReactMarkdown>
                      </div>
                    </div>
                    {fr && showTranslation && (
                      <div className="mt-1 px-3.5 py-2 text-xs leading-relaxed text-muted-foreground bg-muted/30 border border-border/50 rounded-xl italic">
                        🇫🇷 {fr}
                      </div>
                    )}
                    {ar && showArabic && (
                      <div dir="rtl" className="mt-1 px-3.5 py-2 text-sm leading-relaxed text-foreground bg-emerald-500/5 border border-emerald-500/30 rounded-xl">
                        🇸🇦 {ar}
                      </div>
                    )}
                    <div className="flex gap-2 mt-0.5 ml-1">
                      <button onClick={() => { setIsSpeaking(true); speakGerman(de).finally(() => setIsSpeaking(false)); }} className="bg-transparent border-none text-muted-foreground text-[10px] cursor-pointer hover:text-primary transition-colors">
                        🔊 Anhören
                      </button>
                    </div>
                  </>
                );
              })() : (
                <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground rounded-2xl rounded-br-sm">
                  <span className="whitespace-pre-wrap">
                    {m.viaVoice && <span className="mr-1 opacity-70">🎤</span>}
                    {m.content}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && msgs.length > 0 && msgs[msgs.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2 animate-slide-up">
            <div className="flex-shrink-0">
              <ProfessorAvatar size="sm" thinking />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-card border border-border text-muted-foreground text-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions - Pingo style */}
      {suggestions.length > 0 && !loading && (
        <div className="px-3 pb-1.5 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMsg(s)}
              className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs cursor-pointer hover:bg-primary/15 transition-all hover:scale-105"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs text-center">⚠️ {error}</div>
      )}

      {/* Input - enhanced with voice */}
      <div className="px-3 py-2 border-t border-border flex gap-2 items-center bg-card/30">
        {supported && (
          <button
            onClick={listening ? stop : start}
            className={`w-11 h-11 rounded-full border-none cursor-pointer flex items-center justify-center text-lg transition-all ${
              listening
                ? "bg-destructive text-destructive-foreground shadow-[0_0_25px_hsl(var(--destructive)/0.5)] animate-mic-pulse"
                : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
            }`}
          >
            🎤
          </button>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={listening ? "🎙️ Ich höre zu..." : "Schreib auf Deutsch..."}
          className="flex-1 px-4 py-2.5 rounded-full border border-border bg-background text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className={`w-10 h-10 rounded-full border-none cursor-pointer flex items-center justify-center text-base bg-primary text-primary-foreground transition-all ${
            !input.trim() || loading ? "opacity-40" : "hover:opacity-90 shadow-md"
          }`}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ============== Lesson picker for Herr Professor ==============
import { getActiveUnits, getActiveLevel } from "@/data/activeUnits";

function LessonPicker({
  current,
  onPick,
  onClose,
  onClear,
}: {
  current: LessonContext | null;
  onPick: (c: LessonContext) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const UNITS = getActiveUnits();
  const level = getActiveLevel();
  return (
    <div className="fixed inset-0 z-[1000] bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onClose} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-[15px]">📖 Choisir la leçon · Niveau {level}</h3>
          <div className="text-muted-foreground text-[11px]">Le tuteur posera ses questions sur cette leçon uniquement.</div>
        </div>
        <button
          onClick={onClear}
          className="px-3 py-1.5 rounded-full text-xs border border-border bg-card text-foreground cursor-pointer"
        >
          🗑️ Aucune
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {UNITS.map(u => (
          <div key={u.id}>
            <div className="text-foreground font-bold text-sm mb-1.5">{u.icon} {u.title}</div>
            <div className="grid grid-cols-1 gap-1.5">
              {u.lessons.map(l => {
                const active = current?.id === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => onPick({ id: l.id, title: l.title, vocab: l.vocab.map(v => v.de) })}
                    className={`text-left p-2.5 rounded-xl border text-sm cursor-pointer ${
                      active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:bg-accent/40"
                    }`}
                  >
                    {active ? "✓ " : ""}{l.title}
                    <span className="block text-[10px] text-muted-foreground">{l.vocab.length} mots</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
