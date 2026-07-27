import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic, MicOff, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const T = {
  fr: { title: "Professeur IA", greet: "Bonjour ! Prêt à pratiquer l'allemand ?", listen: "Parlez maintenant…", ask: "Posez une question", speak: "Écouter", close: "Fermer" },
  de: { title: "KI-Lehrer", greet: "Hallo! Bereit zu üben?", listen: "Sprich jetzt…", ask: "Frage stellen", speak: "Anhören", close: "Schließen" },
  ar: { title: "الأستاذ الذكي", greet: "مرحبا! جاهز للتدرب على الألمانية؟", listen: "تكلّم الآن…", ask: "اطرح سؤالاً", speak: "استمع", close: "إغلاق" },
} as const;

type SpeechResultEvent = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

/**
 * Floating AI avatar that greets the user, listens to speech (Web Speech API when available)
 * and speaks back using SpeechSynthesis with a German voice when possible.
 */
export function AIAvatar() {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const t = T[lang as keyof typeof T] ?? T.fr;
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<string>(t.greet);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const visible = [
    "/student",
    "/solo-student",
    "/kapitel",
    "/wortschatz",
    "/adaptive",
    "/voice-coach",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    setMessage(t.greet);
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visible) return;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setListening(false);
    setSpeaking(false);
    setOpen(false);
  }, [visible]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "de-DE";
    const voices = window.speechSynthesis.getVoices();
    const de = voices.find((v) => v.lang?.startsWith("de"));
    if (de) utter.voice = de;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const startListening = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };
    const SR = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SR) {
      setMessage("Speech recognition not supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = "de-DE";
    rec.interimResults = false;
    rec.onresult = (e: SpeechResultEvent) => {
      const text = e.results[0][0].transcript;
      setMessage(`« ${text} » — Sehr gut!`);
      speak(`Ich habe gehört: ${text}. Sehr gut!`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 end-6 z-50 pointer-events-none">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="pointer-events-auto mb-3 w-80"
          >
            <Card className="p-4 shadow-2xl border-primary/40 bg-gradient-to-br from-background to-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ${speaking ? "animate-pulse" : ""}`}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.title}</div>
                    <div className="text-[10px] text-muted-foreground">DE · A1 → B2</div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label={t.close}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm bg-muted/50 rounded-lg p-3 mb-3 min-h-[60px]">{listening ? t.listen : message}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => speak(message)}>
                  <Volume2 className="w-4 h-4 me-1" /> {t.speak}
                </Button>
                <Button size="sm" className="flex-1" onClick={listening ? stopListening : startListening}>
                  {listening ? <MicOff className="w-4 h-4 me-1" /> : <Mic className="w-4 h-4 me-1" />} {t.ask}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={speaking ? { boxShadow: ["0 0 0 0 hsl(var(--primary)/0.4)", "0 0 0 16px hsl(var(--primary)/0)"] } : {}}
        transition={speaking ? { duration: 1.2, repeat: Infinity } : {}}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30"
        aria-label={t.title}
      >
        <Sparkles className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
