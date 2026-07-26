import { useState, useRef, useEffect } from "react";
import { speak } from "@/lib/voice";
import type { InteractiveDialog as DialogData } from "@/data/dialogs";
import { translateFrToAr, useI18n } from "@/lib/i18n";

interface Props {
  dialog: DialogData;
  onBack: () => void;
}

export function InteractiveDialog({ dialog, onBack }: Props) {
  const { showAr, deOnly } = useI18n();
  const [currentLine, setCurrentLine] = useState(-1);
  const [currentWord, setCurrentWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showFrench, setShowFrench] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const stoppedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (currentLine >= 0 && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-line="${currentLine}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLine]);

  const playLine = async (lineIdx: number, continueAuto = false) => {
    if (stoppedRef.current) return;
    const line = dialog.lines[lineIdx];
    if (!line) return;

    setCurrentLine(lineIdx);
    setPlaying(true);

    const fullText = line.de.join(" ");
    const wordCount = line.de.length;
    const estPerWord = Math.max(280, (fullText.length * 75) / wordCount);

    const ttsPromise = speak(fullText, "de-DE", 0.78);

    for (let w = 0; w < wordCount; w++) {
      if (stoppedRef.current) break;
      setCurrentWord(w);
      await new Promise(r => setTimeout(r, estPerWord));
    }

    await ttsPromise;
    setCurrentWord(-1);

    if (stoppedRef.current) {
      setPlaying(false);
      return;
    }

    if (continueAuto && lineIdx + 1 < dialog.lines.length) {
      await new Promise(r => setTimeout(r, 600));
      if (!stoppedRef.current) playLine(lineIdx + 1, true);
    } else {
      setPlaying(false);
      if (lineIdx + 1 >= dialog.lines.length) setAutoPlay(false);
    }
  };

  const playAll = () => {
    stoppedRef.current = false;
    setAutoPlay(true);
    playLine(0, true);
  };

  const stop = () => {
    stoppedRef.current = true;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setAutoPlay(false);
    setCurrentWord(-1);
  };

  const reset = () => {
    stop();
    setCurrentLine(-1);
    stoppedRef.current = false;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={() => { stop(); onBack(); }} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-base">{dialog.icon} {dialog.title}</h3>
          {!deOnly && showAr && (() => { const ar = translateFrToAr(dialog.title); return ar ? <div dir="rtl" className="text-emerald-400 text-[10px]">🇸🇦 {ar}</div> : null; })()}
          <p className="text-muted-foreground text-[10px] m-0">{dialog.subtitle}</p>
          {!deOnly && showAr && (() => { const ar = translateFrToAr(dialog.subtitle); return ar ? <div dir="rtl" className="text-emerald-400 text-[10px]">🇸🇦 {ar}</div> : null; })()}
        </div>
        <button
          onClick={() => setShowFrench(!showFrench)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
            showFrench ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
          }`}
        >
          🇫🇷 {showFrench ? "ON" : "OFF"}
        </button>
      </div>

      <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <p className="text-foreground text-xs font-medium m-0">{dialog.intro}</p>
        {!deOnly && showAr && (() => { const ar = translateFrToAr(dialog.intro); return ar ? <p dir="rtl" className="text-emerald-400 text-xs m-0 mt-1">🇸🇦 {ar}</p> : null; })()}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 pb-2">
        {dialog.lines.map((line, li) => {
          const isActive = li === currentLine;
          const isPast = li < currentLine || (li === currentLine && !playing);
          const isRight = line.side === "right";

          return (
            <div
              key={li}
              data-line={li}
              className={`mb-2.5 transition-opacity ${currentLine === -1 || isActive || isPast ? "opacity-100" : "opacity-50"}`}
            >
              <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[88%]">
                  <div className={`flex items-center gap-1.5 mb-1 text-[10px] font-bold ${isRight ? "justify-end" : "justify-start"}`}>
                    <span style={{ color: line.speakerColor }}>{line.speaker}</span>
                    {isActive && playing && <span className="text-primary animate-pulse">● en cours</span>}
                  </div>

                  <div
                    onClick={() => !playing && playLine(li, false)}
                    className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      isRight ? "rounded-br-sm bg-primary/10" : "rounded-bl-sm bg-card"
                    } ${isActive ? "border-primary shadow-lg" : "border-border hover:border-primary/40"}`}
                    style={isActive ? { boxShadow: "0 0 0 3px hsl(var(--primary) / 0.15)" } : {}}
                  >
                    <div className="text-foreground text-[15px] font-medium leading-relaxed flex flex-wrap gap-x-1 gap-y-0.5">
                      {line.de.map((word, wi) => {
                        const highlighted = isActive && wi === currentWord;
                        const spoken = isActive && wi < currentWord;
                        return (
                          <span
                            key={wi}
                            className={`transition-all duration-150 px-0.5 rounded ${
                              highlighted
                                ? "bg-primary text-primary-foreground font-bold scale-110 inline-block shadow-md"
                                : spoken
                                ? "text-primary font-bold"
                                : ""
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>

                    {showFrench && !deOnly && (
                      <div className="mt-2 pt-2 border-t border-border/50 text-muted-foreground text-xs italic leading-snug">
                        🇫🇷 {line.fr}
                        {showAr && (() => { const ar = translateFrToAr(line.fr); return ar ? <div dir="rtl" className="text-emerald-400 mt-0.5 not-italic">🇸🇦 {ar}</div> : null; })()}
                      </div>
                    )}

                    {line.note && isActive && (
                      <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20 text-[11px] text-foreground">
                        💡 {line.note}
                        {!deOnly && showAr && (() => { const ar = translateFrToAr(line.note!); return ar ? <div dir="rtl" className="text-emerald-400 mt-0.5">🇸🇦 {ar}</div> : null; })()}
                      </div>
                    )}

                    <div className="absolute -bottom-1 -right-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-background ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                      }`}>
                        🔊
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {currentLine + 1 >= dialog.lines.length && !playing && currentLine >= 0 && (
          <div className="my-4 p-4 bg-gradient-to-br from-success/15 to-success/5 border-2 border-success/30 rounded-2xl text-center">
            <div className="text-3xl mb-1">🎉</div>
            <div className="text-foreground font-bold text-sm">Dialogue terminé !</div>
            <div className="text-muted-foreground text-xs">Vous avez écouté tout le dialogue · {dialog.title}.</div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background p-3">
        <div className="flex items-center gap-2">
          {!autoPlay && !playing ? (
            <button
              onClick={playAll}
              className="flex-1 p-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              ▶️ Lire tout le dialogue
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex-1 p-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              ⏹️ Stop
            </button>
          )}
          <button
            onClick={reset}
            disabled={playing}
            className="px-4 py-3 rounded-xl bg-card border border-border text-foreground font-bold text-sm cursor-pointer hover:bg-accent/50 transition-colors disabled:opacity-40"
          >
            🔄
          </button>
        </div>
        <p className="text-muted-foreground text-[10px] text-center mt-2">
          💡 Cliquez sur une bulle pour la rejouer · Mots surlignés en temps réel
        </p>
      </div>
    </div>
  );
}
