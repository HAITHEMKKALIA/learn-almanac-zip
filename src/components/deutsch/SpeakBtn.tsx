import { useState } from "react";
import { speak } from "@/lib/voice";

interface SpeakBtnProps {
  text: string;
  lang?: string;
  size?: number;
  className?: string;
}

export function SpeakBtn({ text, lang = "de-DE", size = 20, className = "" }: SpeakBtnProps) {
  const [playing, setPlaying] = useState(false);
  const play = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) { window.speechSynthesis?.cancel(); setPlaying(false); return; }
    setPlaying(true); await speak(text, lang); setPlaying(false);
  };
  return (
    <button
      onClick={play}
      className={`flex items-center justify-center rounded-lg border cursor-pointer min-w-[36px] min-h-[36px] p-1.5 transition-colors ${
        playing ? "bg-primary/20 border-primary" : "bg-transparent border-transparent hover:bg-card"
      } ${className}`}
      style={{ fontSize: size }}
      title={playing ? "Stop" : "Écouter"}
    >
      {playing ? "⏹️" : "🔊"}
    </button>
  );
}
