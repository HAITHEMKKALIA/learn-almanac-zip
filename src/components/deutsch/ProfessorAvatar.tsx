import { useEffect, useState } from "react";

interface ProfessorAvatarProps {
  speaking?: boolean;
  listening?: boolean;
  thinking?: boolean;
  size?: "sm" | "md" | "lg";
  streak?: number;
}

export function ProfessorAvatar({ speaking, listening, thinking, size = "md", streak = 0 }: ProfessorAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!speaking) { setMouthOpen(false); return; }
    const id = setInterval(() => setMouthOpen(p => !p), 180);
    return () => clearInterval(id);
  }, [speaking]);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  const sizes = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-20 h-20" };
  const innerSizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Pulse rings */}
      {speaking && (
        <>
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "1.5s" }} />
          <div className="absolute -inset-1 rounded-full bg-primary/10 animate-pulse" />
        </>
      )}
      {listening && (
        <div className="absolute -inset-1 rounded-full border-2 border-destructive/50 animate-mic-pulse" />
      )}
      {thinking && (
        <div className="absolute -inset-1 rounded-full border-2 border-warning/40 animate-pulse" />
      )}

      {/* Avatar body */}
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-accent/10 border-2 border-primary/30 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${speaking ? "shadow-[0_0_20px_hsl(var(--primary)/0.4)]" : ""}`}>
        {/* Face */}
        <div className={`${innerSizes[size]} select-none relative`}>
          {/* Eyes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="relative" style={{ fontSize: size === "lg" ? "2.2rem" : size === "md" ? "1.5rem" : "1rem" }}>
              {blink ? "😑" : speaking ? "😄" : listening ? "🧐" : thinking ? "🤔" : "🎓"}
            </span>
          </div>
        </div>
      </div>

      {/* Streak badge */}
      {streak > 0 && size !== "sm" && (
        <div className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-background shadow-sm">
          🔥{streak}
        </div>
      )}
    </div>
  );
}
