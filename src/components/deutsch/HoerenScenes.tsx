import { useEffect, useRef, useState } from "react";
import { speakAdvanced, guessGenderFromSpeaker, type Gender } from "@/lib/voice";
import { SpeakBtn } from "./SpeakBtn";
import { HOEREN_SCENES, CATEGORY_LABELS, type HoerenScene } from "@/data/hoerenScenes";
import { createAmbiancePlayer, AMBIANCES, type AmbianceId } from "@/lib/ambientAudio";
import { formatSeconds } from "@/data/lessonEnrichment";
import { translateFrToAr, useI18n } from "@/lib/i18n";

const ArLine = ({ fr, className = "", rtl = true }: { fr: string; className?: string; rtl?: boolean }) => {
  const { showAr, deOnly } = useI18n();
  if (deOnly || !showAr) return null;
  const ar = translateFrToAr(fr);
  if (!ar) return null;
  return <div dir={rtl ? "rtl" : undefined} className={`text-emerald-400 text-xs ${className}`}>🇸🇦 {ar}</div>;
};

interface HoerenScenesProps {
  onBack: () => void;
}

// === Mémorisation des réglages audio par ambiance ===
const AUDIO_PREFS_KEY = "dm_hoeren_audio_prefs_v1";
type AudioPrefs = Record<string, { rate: number; ambianceVol: number; ambianceOn: boolean }>;
function loadPrefs(): AudioPrefs {
  try { return JSON.parse(localStorage.getItem(AUDIO_PREFS_KEY) || "{}") as AudioPrefs; } catch { return {}; }
}
function savePref(amb: AmbianceId, p: { rate: number; ambianceVol: number; ambianceOn: boolean }) {
  const all = loadPrefs(); all[amb] = p;
  try { localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(all)); } catch { /* ignore */ }
}
// === Voix manuelle par scène ===
const VOICE_PREFS_KEY = "dm_hoeren_voice_prefs_v1";
type VoicePrefs = Record<string, "auto" | "female" | "male">;
function loadVoicePrefs(): VoicePrefs {
  try { return JSON.parse(localStorage.getItem(VOICE_PREFS_KEY) || "{}") as VoicePrefs; } catch { return {}; }
}
function saveVoicePref(sceneId: string, v: "auto" | "female" | "male") {
  const all = loadVoicePrefs(); all[sceneId] = v;
  try { localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify(all)); } catch { /* ignore */ }
}

/**
 * Mode "Hören réel" : joue des dialogues authentiques avec un fond sonore
 * d'ambiance (rue, train, supermarché, météo, etc.) pour simuler une vraie
 * situation d'écoute.
 */
export function HoerenScenes({ onBack }: HoerenScenesProps) {
  const [selected, setSelected] = useState<HoerenScene | null>(null);
  const [filter, setFilter] = useState<HoerenScene["category"] | "all">("all");

  const scenes = filter === "all" ? HOEREN_SCENES : HOEREN_SCENES.filter(s => s.category === filter);

  if (selected) {
    return <ScenePlayer scene={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-[15px]">🎧 Hören réel — Scènes authentiques</h3>
          <ArLine fr="Scènes authentiques d'écoute" className="mt-0.5" />
          <div className="text-muted-foreground text-[11px]">{HOEREN_SCENES.length} scènes avec bruits d'ambiance</div>
        </div>
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-1.5 p-3 overflow-x-auto border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
            filter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
          }`}
        >
          Toutes ({HOEREN_SCENES.length})
        </button>
        {Object.entries(CATEGORY_LABELS).map(([cat, meta]) => {
          const count = HOEREN_SCENES.filter(s => s.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat as HoerenScene["category"])}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
                filter === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
              }`}
            >
              {meta.emoji} {meta.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="p-3 flex flex-col gap-2">
        {scenes.map(scene => {
          const ambiance = AMBIANCES.find(a => a.id === scene.ambiance);
          return (
            <button
              key={scene.id}
              onClick={() => setSelected(scene)}
              className="text-left p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-accent/40 transition-colors flex gap-3 items-center"
            >
              <div className="text-3xl">{scene.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground text-sm">{scene.title}</div>
                <ArLine fr={scene.title} />
                <div className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{scene.description}</div>
                <ArLine fr={scene.description} className="mt-0.5" />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">{scene.level}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground">
                    {ambiance?.emoji} {ambiance?.label}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">
                    {scene.lines.length} répliques
                  </span>
                </div>
              </div>
              <div className="text-primary text-xl">›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ Lecteur d'une scène ============
function ScenePlayer({ scene, onBack }: { scene: HoerenScene; onBack: () => void }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showFr, setShowFr] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const initial = loadPrefs()[scene.ambiance];
  const [rate, setRate] = useState(initial?.rate ?? 0.9);
  const [ambianceVol, setAmbianceVol] = useState(initial?.ambianceVol ?? 0.25);
  const [ambianceOn, setAmbianceOn] = useState(initial?.ambianceOn ?? true);
  const [voiceMode, setVoiceMode] = useState<"auto" | "female" | "male">(loadVoicePrefs()[scene.id] ?? "auto");
  // persiste les réglages
  useEffect(() => { savePref(scene.ambiance, { rate, ambianceVol, ambianceOn }); }, [scene.ambiance, rate, ambianceVol, ambianceOn]);
  useEffect(() => { saveVoicePref(scene.id, voiceMode); }, [scene.id, voiceMode]);
  const stopRef = useRef(false);
  const tickRef = useRef<number | null>(null);
  const ambianceRef = useRef<HTMLAudioElement | null>(null);

  // Init / cleanup ambiance
  useEffect(() => {
    if (!ambianceOn) {
      ambianceRef.current?.pause();
      return;
    }
    if (!ambianceRef.current) {
      ambianceRef.current = createAmbiancePlayer(scene.ambiance, ambianceVol);
    }
    if (ambianceRef.current) {
      ambianceRef.current.volume = ambianceVol;
      if (playing) ambianceRef.current.play().catch(() => undefined);
    }
    return () => {
      ambianceRef.current?.pause();
    };
  }, [ambianceOn, ambianceVol, playing, scene.ambiance]);

  // Stop tout au démontage
  useEffect(() => {
    return () => {
      stopRef.current = true;
      window.speechSynthesis?.cancel();
      ambianceRef.current?.pause();
      ambianceRef.current = null;
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Chrono
  useEffect(() => {
    if (playing) {
      tickRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [playing]);

  const play = async (fromIdx?: number) => {
    if (playing) return;
    setPlaying(true);
    stopRef.current = false;
    const startAt = typeof fromIdx === "number" ? fromIdx : idx;
    if (ambianceOn && ambianceRef.current) {
      ambianceRef.current.volume = ambianceVol;
      await ambianceRef.current.play().catch(() => undefined);
    }
    for (let i = startAt; i < scene.lines.length; i++) {
      if (stopRef.current) break;
      setIdx(i);
      setShowFr(false);
      const line = scene.lines[i];
      const gender: Gender = voiceMode === "auto" ? guessGenderFromSpeaker(line.speaker) : voiceMode;
      await speakAdvanced(line.de, { lang: "de-DE", rate, gender });
      if (stopRef.current) break;
      await new Promise(r => setTimeout(r, 700));
    }
    setPlaying(false);
    ambianceRef.current?.pause();
  };

  const pause = () => {
    stopRef.current = true;
    window.speechSynthesis?.cancel();
    ambianceRef.current?.pause();
    setPlaying(false);
  };

  const reset = () => {
    pause();
    setIdx(0);
    setElapsed(0);
    setShowFr(false);
  };

  /** Réécoute toute la scène depuis le début avec le même contexte sonore. */
  const replayScene = () => {
    pause();
    setIdx(0);
    setShowFr(false);
    setTimeout(() => { play(0); }, 200);
  };

  /** Lance une session timée (60s par défaut) et arrête tout à l'échéance. */
  const playTimed = (seconds = 60) => {
    pause();
    setTimeout(() => {
      play(idx);
      setTimeout(() => pause(), seconds * 1000);
    }, 200);
  };

  const ambiance = AMBIANCES.find(a => a.id === scene.ambiance);
  const line = scene.lines[idx];
  const progress = ((idx + 1) / scene.lines.length) * 100;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground m-0 text-[15px] truncate">{scene.emoji} {scene.title}</h3>
          <ArLine fr={scene.title} />
          <div className="text-muted-foreground text-[11px]">{scene.description}</div>
          <ArLine fr={scene.description} />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="rounded-2xl p-3 border bg-primary/10 border-primary/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ambiance?.emoji ?? "🔊"}</span>
              <div>
                <div className="text-foreground text-sm font-bold">Ambiance : {ambiance?.label}</div>
                <div className="text-muted-foreground text-[11px]">Voix allemande superposée au bruit réel</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Chrono</div>
              <div className="font-mono text-base font-bold text-primary">{formatSeconds(elapsed)}</div>
            </div>
          </div>
          <div className="bg-card rounded-md p-0.5 mt-3">
            <div className="h-1.5 rounded bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-center text-xs text-muted-foreground mt-1">
            Réplique {idx + 1} / {scene.lines.length}
          </div>
        </div>

        {/* Réplique courante */}
        {line && (
          <div className="bg-card rounded-2xl p-5 border-2 border-border min-h-[140px] flex flex-col gap-2">
            <div className="text-[11px] text-text-dim uppercase tracking-widest">{line.speaker}</div>
            <div className="flex items-start gap-2">
              <div className="text-lg font-bold text-foreground flex-1">{line.de}</div>
              <SpeakBtn text={line.de} size={22} />
            </div>
            <button
              onClick={() => setShowFr(s => !s)}
              className="mt-2 text-xs text-muted-foreground underline self-start cursor-pointer bg-transparent border-none"
            >
              {showFr ? "Cacher la traduction" : "Afficher la traduction FR"}
            </button>
            {showFr && (
              <div className="text-sm text-foreground bg-success/10 border border-success/30 rounded-md p-2">
                🇫🇷 {line.fr}
                <ArLine fr={line.fr} className="mt-1" />
              </div>
            )}
          </div>
        )}

        {/* Contrôles */}
        <div className="flex gap-2">
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="flex-1 p-2.5 rounded-xl border border-border bg-card text-foreground text-sm cursor-pointer disabled:opacity-40"
          >
            ⏮ Précédent
          </button>
          {!playing ? (
            <button onClick={() => play()} className="flex-[2] p-3 rounded-xl border-none bg-primary text-primary-foreground font-bold text-sm cursor-pointer">
              ▶ Lecture
            </button>
          ) : (
            <button onClick={pause} className="flex-[2] p-3 rounded-xl border-none bg-warning text-warning-foreground font-bold text-sm cursor-pointer">
              ⏸ Pause
            </button>
          )}
          <button
            onClick={() => setIdx(i => Math.min(scene.lines.length - 1, i + 1))}
            disabled={idx >= scene.lines.length - 1}
            className="flex-1 p-2.5 rounded-xl border border-border bg-card text-foreground text-sm cursor-pointer disabled:opacity-40"
          >
            Suivant ⏭
          </button>
        </div>

        {/* Actions Réécouter / Session 60s */}
        <div className="flex gap-2">
          <button
            onClick={replayScene}
            className="flex-1 p-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary font-bold text-sm cursor-pointer"
            title="Rejouer toute la scène depuis le début avec le même fond sonore"
          >
            🔁 Réécouter la scène
          </button>
          <button
            onClick={() => playTimed(60)}
            className="flex-1 p-2.5 rounded-xl border border-warning/40 bg-warning/10 text-warning font-bold text-sm cursor-pointer"
            title="Joue la scène pendant 60 secondes puis arrête automatiquement"
          >
            ⏱️ Session 60s
          </button>
        </div>

        {/* Vitesse */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Vitesse :</span>
          {[0.7, 0.85, 1.0, 1.2].map(r => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border ${
                rate === r ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
              }`}
            >
              {r}×
            </button>
          ))}
          <button
            onClick={reset}
            className="ml-auto px-3 py-1 rounded-md text-xs font-semibold bg-card border border-border text-foreground cursor-pointer"
          >
            🔄 Reset
          </button>
        </div>

        {/* Contrôles ambiance */}
        <div className="rounded-xl p-3 border border-border bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <input
                type="checkbox"
                checked={ambianceOn}
                onChange={e => setAmbianceOn(e.target.checked)}
                className="cursor-pointer"
              />
              {ambiance?.emoji} Bruit d'ambiance
            </label>
            <span className="text-xs text-muted-foreground">{Math.round(ambianceVol * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.05}
            value={ambianceVol}
            disabled={!ambianceOn}
            onChange={e => setAmbianceVol(parseFloat(e.target.value))}
            className="w-full cursor-pointer disabled:opacity-40"
          />
          <div className="text-[10px] text-muted-foreground">
            Astuce : pour un son personnel, déposez un MP3 dans <code>public/sounds/{scene.ambiance}.mp3</code>. Réglages mémorisés par ambiance.
          </div>

          {/* Sélecteur de voix manuel/auto */}
          <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">🎙️ Voix :</span>
            {([
              { v: "auto", l: "Auto (selon locuteur)" },
              { v: "female", l: "♀ Femme" },
              { v: "male", l: "♂ Homme" },
            ] as const).map(o => (
              <button
                key={o.v}
                onClick={() => setVoiceMode(o.v)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border ${
                  voiceMode === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Transcript complet */}
        <details className="rounded-xl p-3 border border-border bg-card">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">📜 Transcript complet</summary>
          <div className="mt-2 flex flex-col gap-1.5">
            {scene.lines.map((l, i) => (
              <div key={i} className={`text-xs p-2 rounded-md ${i === idx ? "bg-primary/15 border border-primary/40" : "bg-secondary"}`}>
                <span className="font-bold text-primary">{l.speaker} :</span> {l.de}
                <div className="text-muted-foreground italic mt-0.5">🇫🇷 {l.fr}</div>
                <ArLine fr={l.fr} />
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
