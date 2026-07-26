import { useEffect, useRef, useState } from "react";
import { speak } from "@/lib/voice";
import { SpeakBtn } from "./SpeakBtn";
import { formatSeconds } from "@/data/lessonEnrichment";
import { getLessonStats, recordAnswer, recordTime, setHoerenPosition } from "@/lib/lessonStats";
import type { VocabItem } from "@/data/curriculum";
import { translateFrToAr, useI18n } from "@/lib/i18n";
import { markHoerenDone } from "@/lib/lessonProgress";

interface HoerenPlayerProps {
  items: VocabItem[];
  estimatedSeconds: number;
  color?: string;
  lessonId?: string;
  unitId?: string;
}

/**
 * Lecteur Hören (compréhension orale) :
 * - Lit chaque mot DE puis son exemple
 * - Affiche la transcription FR sur demande
 * - Chronomètre live + temps total estimé
 * - Vitesse 0.7x / 1x / 1.2x
 * - 🆕 Bouton "Répéter Hören" : reprend depuis la dernière position arrêtée
 *   en conservant le temps écoulé de la session (persistant via localStorage).
 */
export function HoerenPlayer({
  items,
  estimatedSeconds,
  color = "hsl(var(--primary))",
  lessonId,
  unitId,
}: HoerenPlayerProps) {
  const { showFr: i18nShowFr, showAr, deOnly } = useI18n();
  // Restaure la position et le temps depuis le storage si la leçon est connue
  const initialState = (() => {
    if (lessonId && unitId) {
      const s = getLessonStats(lessonId, unitId);
      return { idx: Math.min(s.hoerenLastIdx ?? 0, Math.max(0, items.length - 1)), elapsed: s.hoerenElapsed ?? 0 };
    }
    return { idx: 0, elapsed: 0 };
  })();

  const [idx, setIdx] = useState(initialState.idx);
  const [playing, setPlaying] = useState(false);
  const [showFr, setShowFr] = useState(false);
  const [elapsed, setElapsed] = useState(initialState.elapsed);
  const [rate, setRate] = useState(0.85);
  const stopRef = useRef(false);
  const tickRef = useRef<number | null>(null);
  const lastSavedTimeRef = useRef<number>(initialState.elapsed);

  const item = items[idx];

  // Chronomètre live
  useEffect(() => {
    if (playing) {
      tickRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [playing]);

  // Sauvegarde position + temps à chaque arrêt / changement de séquence
  useEffect(() => {
    if (lessonId && unitId) {
      setHoerenPosition(lessonId, unitId, idx, elapsed);
    }
  }, [idx, elapsed, lessonId, unitId]);

  // Sauvegarde du temps cumulé (delta) à la pause
  const persistTimeDelta = () => {
    if (!lessonId || !unitId) return;
    const delta = elapsed - lastSavedTimeRef.current;
    if (delta > 0) {
      recordTime(lessonId, unitId, "hoeren", delta);
      lastSavedTimeRef.current = elapsed;
    }
  };

  const play = async () => {
    if (playing) return;
    setPlaying(true);
    stopRef.current = false;
    for (let i = idx; i < items.length; i++) {
      if (stopRef.current) break;
      setIdx(i);
      setShowFr(false);
      await speak(items[i].de, "de-DE", rate);
      if (stopRef.current) break;
      await new Promise(r => setTimeout(r, 400));
      if (items[i].ex) {
        if (stopRef.current) break;
        await speak(items[i].ex!, "de-DE", rate);
        await new Promise(r => setTimeout(r, 600));
      }
      // Compte chaque séquence écoutée comme "correcte" (engagement)
      if (lessonId && unitId) recordAnswer(lessonId, unitId, "hoeren", true, items[i].de);
    }
    const reachedEnd = !stopRef.current;
    setPlaying(false);
    persistTimeDelta();
    if (reachedEnd && lessonId && unitId) markHoerenDone(lessonId, unitId);
  };

  const pause = () => {
    stopRef.current = true;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    persistTimeDelta();
  };

  const reset = () => {
    pause();
    setIdx(0);
    setElapsed(0);
    setShowFr(false);
    lastSavedTimeRef.current = 0;
  };

  // 🆕 Reprend depuis la dernière position sans réinitialiser le chrono
  const resumeFromLast = async () => {
    if (lessonId && unitId) {
      const s = getLessonStats(lessonId, unitId);
      const restoredIdx = Math.min(s.hoerenLastIdx ?? idx, Math.max(0, items.length - 1));
      setIdx(restoredIdx);
      setElapsed(s.hoerenElapsed ?? elapsed);
      lastSavedTimeRef.current = s.hoerenElapsed ?? elapsed;
    }
    // Petit délai pour laisser React appliquer l'état avant de lancer
    setTimeout(() => { void play(); }, 50);
  };

  const progress = items.length > 0 ? ((idx + 1) / items.length) * 100 : 0;
  const hasSavedPosition = (initialState.idx > 0 || initialState.elapsed > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Header chronomètre */}
      <div className="rounded-2xl p-4 border" style={{ background: `${color}10`, borderColor: `${color}40` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎧</span>
            <div>
              <div className="text-foreground text-sm font-bold">Compréhension orale</div>
              <div className="text-muted-foreground text-xs">{items.length} séquences</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Temps estimé</div>
            <div className="text-foreground font-mono text-base font-bold" style={{ color }}>
              ~{formatSeconds(estimatedSeconds)}
            </div>
          </div>
        </div>

        {/* Chronomètre live */}
        <div className="flex items-center gap-3 mt-3 p-2.5 bg-card rounded-xl border border-border">
          <div className="text-2xl">⏱️</div>
          <div className="flex-1">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Écoulé</div>
            <div className="text-foreground font-mono text-lg font-bold">{formatSeconds(elapsed)}</div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Restant</div>
            <div className="text-foreground font-mono text-lg font-bold">
              {formatSeconds(Math.max(0, estimatedSeconds - elapsed))}
            </div>
          </div>
        </div>

        {/* Barre de progression items */}
        <div className="bg-card rounded-md p-0.5 mt-3">
          <div className="h-1.5 rounded transition-all duration-300" style={{ width: `${progress}%`, background: color }} />
        </div>
        <div className="text-center text-xs text-muted-foreground mt-1">
          Séquence {idx + 1} / {items.length}
        </div>
      </div>

      {/* Bandeau de reprise si position sauvegardée */}
      {hasSavedPosition && !playing && (
        <div className="rounded-xl p-3 border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-between gap-2">
          <div className="text-xs text-foreground">
            🔁 Reprise dispo : séquence {initialState.idx + 1} · ⏱️ {formatSeconds(initialState.elapsed)}
          </div>
          <button
            onClick={resumeFromLast}
            className="px-3 py-1.5 rounded-lg border-none bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
          >
            ▶ Répéter Hören
          </button>
        </div>
      )}

      {/* Carte de l'item actuel */}
      {item && (
        <div className="bg-card rounded-2xl p-5 border-2 border-border min-h-[140px] flex flex-col gap-2">
          <div className="text-[11px] text-text-dim uppercase tracking-widest">Deutsch</div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-foreground flex-1">{item.de}</div>
            <SpeakBtn text={item.de} size={22} />
          </div>
          {!deOnly && showAr && translateFrToAr(item.fr) && (
            <div dir="rtl" className="text-emerald-400 text-xs">🇸🇦 {translateFrToAr(item.fr)}</div>
          )}
          {item.ex && (
            <div className="flex flex-col gap-1 mt-1 p-2 bg-secondary rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary-light italic flex-1">"{item.ex}"</span>
                <SpeakBtn text={item.ex} size={16} />
              </div>
            </div>
          )}
          <button
            onClick={() => setShowFr(s => !s)}
            className="mt-2 text-xs text-muted-foreground underline self-start cursor-pointer bg-transparent border-none"
          >
            {showFr ? "Cacher la traduction" : "Afficher la traduction FR"}
          </button>
          {showFr && i18nShowFr && (
            <div className="text-sm text-foreground bg-success/10 border border-success/30 rounded-md p-2">
              <div>🇫🇷 {item.fr}</div>
              {!deOnly && showAr && translateFrToAr(item.fr) && (
                <div dir="rtl" className="mt-1 text-foreground/90">🇸🇦 {translateFrToAr(item.fr)}</div>
              )}
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
          <button
            onClick={play}
            className="flex-[2] p-3 rounded-xl border-none text-primary-foreground font-bold text-sm cursor-pointer"
            style={{ background: color }}
          >
            ▶ Lecture
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex-[2] p-3 rounded-xl border-none bg-warning text-warning-foreground font-bold text-sm cursor-pointer"
          >
            ⏸ Pause
          </button>
        )}
        <button
          onClick={() => setIdx(i => Math.min(items.length - 1, i + 1))}
          disabled={idx >= items.length - 1}
          className="flex-1 p-2.5 rounded-xl border border-border bg-card text-foreground text-sm cursor-pointer disabled:opacity-40"
        >
          Suivant ⏭
        </button>
      </div>

      {/* Vitesse et reset */}
      <div className="flex items-center gap-2">
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
    </div>
  );
}
