import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionResult {
  transcript: string;
  listening: boolean;
  supported: boolean;
  error: string;
  start: () => void;
  stop: () => void;
  setTranscript: (v: string) => void;
  setError: (v: string) => void;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Navigateur non supporté. Utilisez Chrome ou Edge."); return; }
    setSupported(true);
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = "de-DE"; r.maxAlternatives = 1;
    r.onresult = (e: any) => {
      let f = "", interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) f += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(f || interim);
    };
    r.onend = () => setListening(false);
    r.onerror = (e: any) => {
      setListening(false);
      const msgs: Record<string, string> = {
        "not-allowed": "Micro refusé. Autorisez le micro dans les paramètres.",
        "no-speech": "Aucune voix détectée. Parlez plus fort.",
        "network": "Erreur réseau. Connexion internet requise.",
      };
      setError(msgs[e.error] || "Erreur: " + e.error);
    };
    recRef.current = r;
  }, []);

  const start = useCallback(() => {
    if (!recRef.current || listening) return;
    setTranscript(""); setError(""); setListening(true);
    window.speechSynthesis?.cancel();
    try { recRef.current.start(); } catch { setListening(false); setError("Impossible de démarrer le micro."); }
  }, [listening]);

  const stop = useCallback(() => {
    if (recRef.current && listening) { try { recRef.current.stop(); } catch {} setListening(false); }
  }, [listening]);

  return { transcript, listening, supported, error, start, stop, setTranscript, setError };
}
