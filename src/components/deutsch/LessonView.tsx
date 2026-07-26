import { useEffect, useMemo, useRef, useState } from "react";
import { SpeakBtn } from "./SpeakBtn";
import { ExerciseEngine } from "./ExerciseEngine";
import { FlashcardDeck } from "./FlashcardDeck";
import { HoerenPlayer } from "./HoerenPlayer";
import { SchreibenView } from "./SchreibenView";
import { enrichLesson, applyDifficulty, formatSeconds } from "@/data/lessonEnrichment";
import { exportLessonToPdf } from "@/lib/lessonPdf";
import { exportLessonBilingualHtml } from "./ArTools";
import { getLessonStats, recordAnswer } from "@/lib/lessonStats";
import type { Lesson } from "@/data/curriculum";
import { translateFrToAr, useI18n } from "@/lib/i18n";
import { getLessonProgress } from "@/lib/lessonProgress";
import { imageForUnit, SCENE } from "@/data/lessonImages";

interface LessonViewProps {
  lesson: Lesson;
  unitId?: string;
  unitTitle?: string;
  color?: string;
  level?: "A1" | "A2" | "B1" | "B2";
  onBack: () => void;
}

export function LessonView({ lesson, unitId = "u1", unitTitle = "", color = "hsl(var(--primary))", level = "A1", onBack }: LessonViewProps) {
  const { showFr, showAr, deOnly } = useI18n();
  const [tab, setTab] = useState("cours");
  const [sub, setSub] = useState<string | null>(null);

  // Stats persistantes (difficulté + mots faibles)
  const stats = useMemo(() => getLessonStats(lesson.id, unitId), [lesson.id, unitId]);

  // Enrichissement + ajustement adaptatif
  const enriched = useMemo(() => {
    const base = enrichLesson(lesson, unitId);
    return applyDifficulty(base, stats.lastDifficulty, stats.weakWords);
  }, [lesson, unitId, stats.lastDifficulty, stats.weakWords]);

  // ⏱️ Chronomètre global de la session
  const [sessionSec, setSessionSec] = useState(0);
  const startedRef = useRef<number>(Date.now());
  useEffect(() => {
    startedRef.current = Date.now();
    const id = window.setInterval(() => {
      setSessionSec(Math.floor((Date.now() - startedRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lesson.id]);

  if (sub === "flash") {
    return (
      <FlashcardDeck
        vocab={enriched.vocab}
        onClose={() => {
          enriched.vocab.slice(0, 10).forEach(v => recordAnswer(lesson.id, unitId, "vocab", true, v.de));
          import("@/lib/lessonProgress").then(m => m.markVocabDone(lesson.id, unitId));
          setSub(null);
        }}
      />
    );
  }
  if (sub === "exo") return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={() => setSub(null)} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <h3 className="text-foreground m-0 text-[15px]">🎯 Exercices ({enriched.exercises.length})</h3>
      </div>
      <ExerciseEngine
        exercises={enriched.exercises}
        onFinish={() => setSub(null)}
        lessonId={lesson.id}
        unitId={unitId}
        currentDifficulty={stats.lastDifficulty}
      />
    </div>
  );

  const tabs = [
    { id: "cours", l: "📖 Cours", ar: "الدرس" },
    { id: "vocab", l: `📝 Mots (${enriched.vocab.length})`, ar: `كلمات (${enriched.vocab.length})` },
    { id: "hoeren", l: "🎧 Hören", ar: "استماع" },
    { id: "schreiben", l: "✍️ Schreiben", ar: "كتابة" },
    { id: "pratik", l: "🎯 Pratiquer", ar: "تدرّب" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground m-0 text-[15px] truncate flex items-center gap-1.5">
            {lesson.title}
            {(() => { const lp = getLessonProgress(lesson.id, unitId); return lp.completedAt ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-success text-success-foreground font-bold">🏅</span> : null; })()}
          </h3>
          {!deOnly && showAr && (() => { const a = translateFrToAr(lesson.title); return a ? <div dir="rtl" className="text-emerald-400 text-[11px] leading-tight">🇸🇦 {a}</div> : null; })()}
          <div className="flex gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap items-center">
            <span>📝 {enriched.vocab.length}</span>
            <span>🎯 {enriched.exercises.length}</span>
            <span>🎧 ~{formatSeconds(enriched.estimatedSeconds)}</span>
            <span className="text-warning">⚙️ Niv. {stats.lastDifficulty}/3</span>
            {(() => {
              const lp = getLessonProgress(lesson.id, unitId);
              return (
                <span className="flex items-center gap-0.5 ml-1">
                  <span className={lp.vocabDone ? "text-success" : "opacity-40"}>📝{lp.vocabDone ? "✓" : "·"}</span>
                  <span className={lp.exercisesDone ? "text-success" : "opacity-40"}>🎯{lp.exercisesDone ? "✓" : "·"}</span>
                  <span className={lp.hoerenDone ? "text-success" : "opacity-40"}>🎧{lp.hoerenDone ? "✓" : "·"}</span>
                </span>
              );
            })()}
          </div>
        </div>
        {/* Bouton PDF */}
        <button
          onClick={() => exportLessonToPdf(enriched, unitTitle, unitId)}
          className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground text-xs font-semibold cursor-pointer hover:bg-accent/50 transition-colors"
          title="Télécharger la leçon en PDF imprimable"
        >
          📄 PDF
        </button>
        {/* Bouton PDF bilingue FR + AR */}
        <button
          onClick={() => exportLessonBilingualHtml(enriched, unitTitle)}
          className="px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-semibold cursor-pointer hover:bg-emerald-500/20 transition-colors"
          title="Export bilingue FR + AR (imprimable, polices arabes natives)"
        >
          🇫🇷+🇸🇦
        </button>
        {/* ⏱️ Chrono session */}
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold"
          style={{ background: `${color}20`, color }}
          title="Temps passé sur cette leçon"
        >
          ⏱️ {formatSeconds(sessionSec)}
        </div>
      </div>

      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-fit whitespace-nowrap py-2 px-3 border-none bg-transparent text-xs cursor-pointer transition-colors ${
              tab === t.id ? "font-bold border-b-[3px]" : "font-normal border-b-[3px] border-transparent text-muted-foreground"
            }`}
            style={tab === t.id ? { color, borderBottomColor: color } : {}}
          >
            <div className="leading-tight">{t.l}</div>
            {!deOnly && showAr && <div dir="rtl" className="text-[10px] text-emerald-400 leading-tight">🇸🇦 {t.ar}</div>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "cours" && (
          <div className="text-foreground text-sm leading-[1.85]">
            {(() => {
              const main = imageForUnit({ id: unitId, title: unitTitle, desc: lesson.title });
              const sceneKeys = Object.keys(SCENE) as (keyof typeof SCENE)[];
              const idx = Math.abs([...lesson.id].reduce((a, c) => a + c.charCodeAt(0), 0)) % sceneKeys.length;
              const secondary = SCENE[sceneKeys[idx]];
              return (
                <>
                  {main && (
                    <figure className="mb-3">
                      <img src={main} alt={`Foto · ${lesson.title}`} loading="lazy" width={1024} height={576}
                        className="w-full aspect-[16/9] object-cover rounded-xl border" style={{ borderColor: `${color}40` }} />
                      <figcaption className="text-[10px] text-muted-foreground mt-1 italic">📸 {lesson.title}</figcaption>
                    </figure>
                  )}
                  {secondary && secondary !== main && (
                    <figure className="float-right ml-3 mb-2 w-[42%] max-w-[220px]">
                      <img src={secondary} alt="Illustration thématique" loading="lazy"
                        className="w-full aspect-[4/3] object-cover rounded-lg border" style={{ borderColor: `${color}30` }} />
                      <figcaption className="text-[9px] text-muted-foreground mt-0.5 italic text-center">Bild · صورة</figcaption>
                    </figure>
                  )}
                </>
              );
            })()}
            {lesson.content.split("\n").map((l, i) => {
              const arOf = (txt: string) => !deOnly && showAr ? translateFrToAr(txt) : "";
              if (l.startsWith("**") && l.endsWith("**")) {
                const clean = l.replace(/\*\*/g, "");
                const a = arOf(clean);
                return (
                  <div key={i}>
                    <h4 className="mt-4 mb-0 text-[15px]" style={{ color }}>{clean}</h4>
                    {a && <div dir="rtl" className="text-emerald-400 text-[11px] mb-1.5">🇸🇦 {a}</div>}
                  </div>
                );
              }
              if (l.startsWith("**")) {
                const p = l.split("**");
                const plain = p.map((x, j) => j % 2 === 1 ? x : x).join("");
                const a = arOf(plain);
                return (
                  <div key={i}>
                    <p className="my-0.5">{p.map((x, j) => j % 2 === 1 ? <strong key={j} className="text-warning-light">{x}</strong> : <span key={j}>{x}</span>)}</p>
                    {a && <div dir="rtl" className="text-emerald-400/80 text-[11px] -mt-0.5 mb-0.5">🇸🇦 {a}</div>}
                  </div>
                );
              }
              if (l.startsWith("⚠️")) {
                const a = arOf(l.replace(/^⚠️\s*/, ""));
                return (
                  <div key={i} className="bg-warning/10 border border-warning/30 rounded-lg p-2.5 my-2 text-sm">
                    <div>{l}</div>
                    {a && <div dir="rtl" className="text-emerald-400 text-[11px] mt-1">🇸🇦 ⚠️ {a}</div>}
                  </div>
                );
              }
              if (l.startsWith("•")) {
                const a = arOf(l.replace(/^•\s*/, ""));
                return (
                  <div key={i}>
                    <p className="my-0.5 pl-1">{l}</p>
                    {a && <div dir="rtl" className="text-emerald-400/80 text-[11px] pl-1">🇸🇦 • {a}</div>}
                  </div>
                );
              }
              if (!l) return <br key={i} />;
              const a = arOf(l);
              return (
                <div key={i}>
                  <p className="my-1">{l}</p>
                  {a && <div dir="rtl" className="text-emerald-400/80 text-[11px] -mt-1 mb-1">🇸🇦 {a}</div>}
                </div>
              );
            })}
          </div>
        )}

        {tab === "vocab" && (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground mb-1">
              {enriched.vocab.length} mots ({lesson.vocab.length} essentiels + {enriched.vocab.length - lesson.vocab.length} bonus thématiques)
            </div>
            {enriched.vocab.map((v, i) => {
              const arWord = !deOnly && showAr ? translateFrToAr(v.fr) : "";
              const arEx = !deOnly && showAr && v.ex ? translateFrToAr(v.ex) : "";
              return (
              <div key={i} className="p-3 bg-card rounded-xl border border-border">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-sm">{v.de}</div>
                    {!deOnly && showFr && <div className="text-muted-foreground text-xs mt-0.5">🇫🇷 {v.fr}</div>}
                    {arWord && <div className="text-primary text-xs mt-0.5" dir="rtl">🇸🇦 {arWord}</div>}
                  </div>
                  <SpeakBtn text={v.de} size={20} />
                </div>
                {v.ex && (
                  <div className="mt-1.5 px-2 py-1.5 bg-secondary rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary-light italic">"{v.ex}"</span>
                      <SpeakBtn text={v.ex} size={15} />
                    </div>
                    {arEx && <div className="text-[11px] text-muted-foreground mt-0.5" dir="rtl">{arEx}</div>}
                  </div>
                )}
              </div>
              );
            })}
            <button
              onClick={() => setSub("flash")}
              className="mt-2.5 p-3.5 rounded-xl border-none text-primary-foreground font-bold text-sm cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${color}, hsl(var(--purple)))` }}
            >
              🃏 Flashcards ({enriched.vocab.length})
            </button>
          </div>
        )}

        {tab === "hoeren" && (
          <HoerenPlayer
            items={enriched.hoerenItems}
            estimatedSeconds={enriched.estimatedSeconds}
            color={color}
            lessonId={lesson.id}
            unitId={unitId}
          />
        )}

        {tab === "schreiben" && (
          <SchreibenView lesson={lesson} unitId={unitId} level={level} color={color} onDone={() => setTab("pratik")} />
        )}

        {tab === "pratik" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl p-5 border-2 border-primary bg-gradient-to-br from-primary/15 to-primary/5 text-center">
              <div className="text-4xl mb-2">🎓</div>
              <h4 className="text-foreground m-0 mb-1 text-[15px]">Herr Professor sur cette leçon</h4>
              <p dir="rtl" className="text-muted-foreground text-[11px] mb-1">الأستاذ يركّز على هذا الدرس فقط</p>
              <p className="text-muted-foreground text-xs mb-3">Le tuteur IA chargera automatiquement le vocabulaire de "{lesson.title}"</p>
              <button
                onClick={() => {
                  const ctx = { id: lesson.id, title: lesson.title, vocab: enriched.vocab.map(v => v.de) };
                  try { localStorage.setItem("dm_chat_lesson", JSON.stringify(ctx)); } catch {}
                  // Trigger custom event so other components could react; we navigate via global hash
                  window.location.hash = "#tutor";
                  window.dispatchEvent(new CustomEvent("dm-open-tutor", { detail: ctx }));
                }}
                className="px-6 py-3 rounded-xl border-none bg-primary text-primary-foreground font-bold text-sm cursor-pointer"
              >
                🎤 Démarrer avec ce contexte
              </button>
            </div>
            <div className="rounded-2xl p-5 border text-center" style={{ background: `${color}12`, borderColor: `${color}30` }}>
              <div className="text-4xl mb-2">🎯</div>
              <h4 className="text-foreground m-0 mb-1 text-[15px]">Exercices + 🎤</h4>
              <p dir="rtl" className="text-muted-foreground text-[11px] mb-1">تمارين + ميكروفون</p>
              <p className="text-muted-foreground text-xs mb-3">{enriched.exercises.length} questions (QCM, complétion, traduction, prononciation)</p>
              <button onClick={() => setSub("exo")} className="px-6 py-3 rounded-xl border-none text-primary-foreground font-bold text-sm cursor-pointer" style={{ background: color }}>
                Commencer
              </button>
            </div>
            <div className="rounded-2xl p-5 border border-success/30 bg-success/10 text-center">
              <div className="text-4xl mb-2">🃏</div>
              <h4 className="text-foreground m-0 mb-1 text-[15px]">Flashcards 🔊</h4>
              <p className="text-muted-foreground text-xs mb-3">{enriched.vocab.length} mots</p>
              <button onClick={() => setSub("flash")} className="px-6 py-3 rounded-xl border-none bg-success text-success-foreground font-bold text-sm cursor-pointer">
                Réviser
              </button>
            </div>
            <div className="rounded-2xl p-5 border text-center" style={{ background: `${color}08`, borderColor: `${color}30` }}>
              <div className="text-4xl mb-2">🎧</div>
              <h4 className="text-foreground m-0 mb-1 text-[15px]">Hören (compréhension orale)</h4>
              <p className="text-muted-foreground text-xs mb-3">~{formatSeconds(enriched.estimatedSeconds)} d'écoute, {enriched.hoerenItems.length} séquences</p>
              <button
                onClick={() => setTab("hoeren")}
                className="px-6 py-3 rounded-xl border-none text-primary-foreground font-bold text-sm cursor-pointer"
                style={{ background: color }}
              >
                Écouter
              </button>
            </div>
            <div className="rounded-2xl p-5 border border-border bg-card text-center">
              <div className="text-4xl mb-2">📄</div>
              <h4 className="text-foreground m-0 mb-1 text-[15px]">Exporter en PDF</h4>
              <p className="text-muted-foreground text-xs mb-3">Cours + {enriched.vocab.length} mots + {enriched.exercises.length} exercices imprimables</p>
              <button
                onClick={() => exportLessonToPdf(enriched, unitTitle, unitId)}
                className="px-6 py-3 rounded-xl border-none bg-foreground text-background font-bold text-sm cursor-pointer"
              >
                Télécharger PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
