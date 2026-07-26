// Horloge analogique SVG (12h ou 24h) — utilisée dans la leçon "Die Uhrzeit"
import type { TimeValue } from "@/lib/timeGerman";

interface AnalogClockProps {
  time: TimeValue;
  size?: number;
  show24?: boolean;     // affiche un anneau intérieur 13-24
  showDigital?: boolean;
}

export function AnalogClock({ time, size = 180, show24 = false, showDigital = true }: AnalogClockProps) {
  const r = size / 2;
  const cx = r;
  const cy = r;

  // Angles : 12h en haut → -90° offset
  const hourAngle = ((time.hour % 12) + time.minute / 60) * 30 - 90;
  const minuteAngle = time.minute * 6 - 90;

  const polar = (angleDeg: number, radius: number) => ({
    x: cx + Math.cos((angleDeg * Math.PI) / 180) * radius,
    y: cy + Math.sin((angleDeg * Math.PI) / 180) * radius,
  });

  const hourEnd = polar(hourAngle, r * 0.5);
  const minEnd = polar(minuteAngle, r * 0.78);

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-md">
        {/* Cadran */}
        <circle cx={cx} cy={cy} r={r - 2} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        {/* Heures 1-12 */}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const a = n * 30 - 90;
          const p = polar(a, r * 0.82);
          return (
            <text
              key={n}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.09}
              fontWeight="700"
              fill="hsl(var(--foreground))"
            >
              {n}
            </text>
          );
        })}
        {/* Anneau 24h optionnel */}
        {show24 &&
          Array.from({ length: 12 }, (_, i) => {
            const n = i + 13;
            const a = (i + 1) * 30 - 90;
            const p = polar(a, r * 0.62);
            return (
              <text
                key={n}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.055}
                fill="hsl(var(--primary))"
                opacity="0.7"
              >
                {n}
              </text>
            );
          })}
        {/* Marques minutes */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = i * 6 - 90;
          const p1 = polar(a, r * 0.92);
          const p2 = polar(a, r * 0.97);
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={i % 5 === 0 ? 2 : 0.5}
            />
          );
        })}
        {/* Aiguille heures */}
        <line x1={cx} y1={cy} x2={hourEnd.x} y2={hourEnd.y} stroke="hsl(var(--foreground))" strokeWidth="4" strokeLinecap="round" />
        {/* Aiguille minutes */}
        <line x1={cx} y1={cy} x2={minEnd.x} y2={minEnd.y} stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
        {/* Centre */}
        <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" />
      </svg>
      {showDigital && (
        <div className="px-3 py-1 rounded-lg bg-muted text-foreground font-mono text-sm tabular-nums">
          {String(time.hour).padStart(2, "0")}:{String(time.minute).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
