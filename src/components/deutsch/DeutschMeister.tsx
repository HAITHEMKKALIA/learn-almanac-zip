import { useState, useEffect } from "react";
import { loadVoices } from "@/lib/voice";
import { UNITS, SCENARIOS, VERB_TABLES, GRAMMAR_RULES, ALPHABET_FULL, numberToGerman, PRONOUNS_DATA, SELF_INTRO } from "@/data/curriculum";
import { UNITS_A2 } from "@/data/curriculumA2";
import { UNITS_B1 } from "@/data/curriculumB1";
import { UNITS_B2 } from "@/data/curriculumB2";
import "@/data/curriculumExtra";

type LevelKey = "A1" | "A2" | "B1" | "B2";
const LEVEL_UNITS: Record<LevelKey, typeof UNITS> = { A1: UNITS, A2: UNITS_A2 as any, B1: UNITS_B1 as any, B2: UNITS_B2 as any };
const LEVEL_KEY = "dm_level_v1";

function LevelSwitcher({ value, onChange }: { value: LevelKey; onChange: (l: LevelKey) => void }) {
  const opts: LevelKey[] = ["A1","A2","B1","B2"];
  return (
    <div className="flex gap-1 p-1 rounded-full bg-card border border-border">
      {opts.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-2 py-1 rounded-full text-[11px] font-bold transition-colors ${value===o?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
import { AIChat } from "./AIChat";
import { LessonView } from "./LessonView";
import { imageForUnit } from "@/data/lessonImages";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { ProgressDashboard } from "./ProgressDashboard";
import { CourseComplete } from "./CourseComplete";
import { FinalExam } from "./FinalExam";
import { FinalExamBank } from "./FinalExamBank";
import { DialogList } from "./DialogList";
import { Tageschallenge } from "./Tageschallenge";
import { OralA1 } from "./OralA1";
import { VocalIA } from "./VocalIA";
import { QcmExam } from "./QcmExam";
import { MasteryDashboard } from "./MasteryDashboard";
import { HoerenScenes } from "./HoerenScenes";
import { RevisionSheet } from "./RevisionSheet";
import { VerbsDictionary } from "./VerbsDictionary";
import { ArGlossary, ArHealthCheck } from "./ArTools";
import { SpeakBtn } from "./SpeakBtn";
import { useGamification } from "@/hooks/useGamification";
import { useI18n, type Lang, translateFrToAr } from "@/lib/i18n";
import type { Lesson, Scenario } from "@/data/curriculum";
import { getChapterProgress, isLessonCompleted } from "@/lib/lessonProgress";

// Mini composant AR inline (FR → AR sous le texte)
function ArInline({ fr, className = "", forceAr }: { fr: string; className?: string; forceAr?: string }) {
  const { showAr, deOnly } = useI18n();
  if (deOnly || !showAr || !fr) return null;
  const ar = forceAr || translateFrToAr(fr);
  if (!ar) return null;
  return <div dir="rtl" className={`text-emerald-400 text-[10px] mt-0.5 ${className}`}>🇸🇦 {ar}</div>;
}

// Traductions AR fixes pour titres + descriptions des chapitres
const UNIT_AR: Record<string, { title: string; desc: string }> = {
  u1:  { title: "الأبجدية", desc: "الأبجدية كاملة، الأصوات، النطق" },
  u2:  { title: "التحية", desc: "التحيات، التعريف بالنفس، الأدب" },
  u3:  { title: "الأرقام", desc: "الأرقام 0-1000، العمر، السعر، الهاتف" },
  u4:  { title: "أدوات التعريف والحالات", desc: "der/die/das، الرفع، النصب، الجر" },
  u5:  { title: "الأفعال", desc: "sein, haben, werden، الأفعال المساعدة، التصريف الكامل" },
  u6:  { title: "الحياة اليومية", desc: "العائلة، البيت، الروتين، الساعات" },
  u7:  { title: "الأكل والشرب", desc: "الطعام، المشروبات، في المطعم" },
  u8:  { title: "القواعد", desc: "الحالات، التصريفات، بنية الجملة" },
  u9:  { title: "المحادثات", desc: "الحوارات، الاتجاهات، الطوارئ" },
  u10: { title: "الضمائر", desc: "الضمائر، حروف الجر، أدوات الربط" },
  u11: { title: "الساعة ⏰", desc: "قراءة الساعة، المواعيد، الجداول الكاملة 24س" },
};

function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const opts: { v: Lang; label: string; title: string }[] = [
    { v: "de", label: "🇩🇪 DE", title: "Deutsch only — immersion" },
    { v: "fr", label: "🇫🇷 FR", title: "Français" },
    { v: "both", label: "🇫🇷+🇸🇦", title: "FR + AR" },
    { v: "ar", label: "🇸🇦 AR", title: "العربية" },
  ];
  return (
    <div className="flex gap-1 p-1 rounded-full bg-card border border-border flex-wrap">
      {opts.map(o => (
        <button
          key={o.v}
          onClick={() => setLang(o.v)}
          title={o.title}
          className={`px-2 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
            lang === o.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >{o.label}</button>
      ))}
    </div>
  );
}

function VoiceActivator({ onDone }: { onDone: () => void }) {
  const go = async () => {
    await loadVoices();
    const synth = window.speechSynthesis;
    if (synth) { const u = new SpeechSynthesisUtterance(""); u.volume = 0; synth.speak(u); }
    onDone();
  };
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8">
      <div className="text-7xl mb-3">🇩🇪</div>
      <h1 className="text-foreground text-2xl font-extrabold mb-1">DeutschMeister</h1>
      <p className="text-primary text-[12px] font-bold tracking-wider uppercase mb-2">von HAITHEM KALIA</p>
      <p className="text-muted-foreground text-sm mb-1 text-center max-w-[320px] leading-relaxed">
        Votre professeur d'allemand professionnel
      </p>
      <p dir="rtl" className="text-muted-foreground text-sm mb-2 text-center max-w-[320px] leading-relaxed">
        مدرّس اللغة الألمانية الاحترافي
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-6 max-w-xs">
        {["🔤 Alphabet","🔢 1-1000","⚡ 30+ Verbes","📖 Grammaire","🤖 Prof IA","🎤 Micro"].map(t => (
          <span key={t} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{t}</span>
        ))}
      </div>
      <button
        onClick={go}
        className="px-12 py-4 rounded-2xl border-none cursor-pointer bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
      >
        🔊 Commencer
      </button>
      <p className="text-muted-foreground text-[11px] mt-4">Active la voix et le micro</p>
    </div>
  );
}

type NavTab = "learn" | "talk" | "ref" | "tutor" | "stats";
type ViewState = "home" | "unit" | "lesson" | "chat" | "scenario" | "verbs" | "verbsDict" | "grammar" | "alphabet" | "numbers" | "dashboard" | "pronouns" | "intro" | "introDetail" | "courseComplete" | "exam" | "examBank" | "dialogs" | "challenge" | "oralA1" | "vocalIA" | "qcmExam" | "mastery" | "hoerenScenes" | "revision" | "arGlossary" | "arHealth";

export function DeutschMeister() {
  const [on, setOn] = useState(true);
  const [view, setView] = useState<ViewState>("home");
  const [uId, setUId] = useState<string | null>(null);
  const [les, setLes] = useState<Lesson | null>(null);
  const [sc, setSc] = useState<Scenario | null>(null);
  const [nav, setNav] = useState<NavTab>("learn");
  const [selectedVerb, setSelectedVerb] = useState<string | null>(null);
  const [selectedGrammar, setSelectedGrammar] = useState<string | null>(null);
  const [selectedIntro, setSelectedIntro] = useState<string | null>(null);
  const [numberRange, setNumberRange] = useState<string>("1-20");
  const [level, setLevel] = useState<LevelKey>(() => {
    try { return (localStorage.getItem(LEVEL_KEY) as LevelKey) || "A1"; } catch { return "A1"; }
  });
  const ACTIVE_UNITS = LEVEL_UNITS[level];
  useEffect(() => { try { localStorage.setItem(LEVEL_KEY, level); } catch {} }, [level]);
  const { points, streak, level: gameLevel } = useGamification();

  useEffect(() => { loadVoices(); }, []);

  // i18n completeness check : signale chapitres sans traduction AR
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const missing: string[] = [];
    UNITS.forEach(u => {
      const ar = UNIT_AR[u.id];
      if (!ar?.title) missing.push(`${u.id}.title`);
      if (!ar?.desc) missing.push(`${u.id}.desc`);
    });
    if (missing.length) {
      console.warn("[i18n AR] Chapitres sans traduction arabe :", missing);
    } else {
      console.info("[i18n AR] ✅ Tous les chapitres ont une traduction arabe (titre + desc).");
    }
  }, []);

  // Permet à LessonView (et autres) d'ouvrir le tuteur avec contexte de leçon
  useEffect(() => {
    const handler = () => { setSc(null); setView("chat"); setNav("tutor"); };
    window.addEventListener("dm-open-tutor", handler);
    return () => window.removeEventListener("dm-open-tutor", handler);
  }, []);

  // Auto-active la voix au montage (skip écran "Commencer")
  useEffect(() => { loadVoices(); }, []);

  if (!on) return <VoiceActivator onDone={() => setOn(true)} />;
  if (view === "chat") return <AIChat scenario={null} onClose={() => setView("home")} />;
  if (view === "scenario" && sc) return <AIChat scenario={sc} onClose={() => { setView("home"); setNav("talk"); }} />;
  if (view === "dashboard") return <ProgressDashboard onBack={() => { setView("home"); setNav("stats"); }} />;
  if (view === "courseComplete") return <CourseComplete onBack={() => { setView("home"); setNav("ref"); }} />;
  if (view === "exam") return <FinalExam onBack={() => { setView("home"); setNav("learn"); }} />;
  if (view === "examBank") return <FinalExamBank onBack={() => { setView("home"); setNav("learn"); }} />;
  if (view === "dialogs") return <DialogList onBack={() => { setView("home"); setNav("talk"); }} />;
  if (view === "challenge") return <Tageschallenge onBack={() => { setView("home"); setNav("learn"); }} />;
  if (view === "oralA1") return <OralA1 onBack={() => { setView("home"); setNav("learn"); }} />;
  if (view === "vocalIA") return <VocalIA onBack={() => { setView("home"); setNav("talk"); }} />;
  if (view === "qcmExam") return <QcmExam onBack={() => { setView("home"); setNav("learn"); }} />;
  if (view === "mastery") return <MasteryDashboard onBack={() => { setView("home"); setNav("stats"); }} />;
  if (view === "hoerenScenes") return <HoerenScenes onBack={() => { setView("home"); setNav("learn"); }} />;
  if (view === "revision") return <RevisionSheet onBack={() => { setView("home"); setNav("stats"); }} />;
  if (view === "verbsDict") return <VerbsDictionary onBack={() => { setView("home"); setNav("ref"); }} />;
  if (view === "arGlossary") return <ArGlossary onBack={() => { setView("home"); setNav("ref"); }} />;
  if (view === "arHealth") return <ArHealthCheck onBack={() => { setView("home"); setNav("stats"); }} />;
  if (view === "lesson" && les && uId) {
    const u = ACTIVE_UNITS.find(x => x.id === uId);
    return <LessonView lesson={les} unitId={uId} unitTitle={u?.title} color={u?.color} level={level} onBack={() => setView("unit")} />;
  }

  // Unit view (chapitre type manuel scolaire)
  if (view === "unit" && uId) {
    const u = ACTIVE_UNITS.find(x => x.id === uId)!;
    const chapterNum = String(ACTIVE_UNITS.findIndex(x => x.id === uId) + 1).padStart(2, "0");
    return (
      <div className="flex flex-col h-full bg-background">
        <div
          className="px-3.5 py-3 border-b flex items-center gap-2"
          style={{ borderColor: `${u.color}40`, background: `${u.color}10` }}
        >
          <button onClick={() => setView("home")} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: u.color }}>Chapitre {chapterNum} · الفصل {chapterNum}</div>
            <h3 className="text-foreground m-0 text-base font-extrabold truncate">{u.icon} {u.title}</h3>
            <ArInline fr={u.title} forceAr={UNIT_AR[u.id]?.title} />
          </div>
          <span className="text-muted-foreground text-xs">{u.lessons.length} leçons <span dir="rtl">· دروس</span></span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {imageForUnit(u) && (
            <img
              src={imageForUnit(u)}
              alt={`Illustration ${u.title}`}
              loading="lazy"
              width={1024}
              height={576}
              className="w-full aspect-[16/9] object-cover rounded-xl mb-3 border"
              style={{ borderColor: `${u.color}40` }}
            />
          )}
          <div className="rounded-xl p-3 mb-4 border" style={{ background: `${u.color}10`, borderColor: `${u.color}30` }}>
            <p className="text-foreground text-sm leading-snug">{u.desc}</p>
            <ArInline fr={u.desc} forceAr={UNIT_AR[u.id]?.desc} className="mt-1 text-xs" />
          </div>
          <div className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
            <span>📋 Leçons du chapitre</span>
            <span dir="rtl" className="opacity-70">دروس الفصل</span>
          </div>
          {u.lessons.map((l, i) => {
            const enrichedVocab = Math.max(30, l.vocab.length + 28);
            const enrichedExos = Math.max(32, l.exercises.length + 28);
            const lessonNum = `${chapterNum}.${String(i + 1).padStart(2, "0")}`;
            const completed = isLessonCompleted(l.id);
            return (
              <button
                key={i}
                onClick={() => { setLes(l); setView("lesson"); }}
                className="w-full p-0 mb-2 rounded-2xl border-2 bg-card text-foreground text-left cursor-pointer hover:bg-accent/30 transition-colors flex items-stretch overflow-hidden"
                style={{ borderColor: completed ? "hsl(var(--success))" : `${u.color}30` }}
              >
                <div
                  className="flex flex-col items-center justify-center px-3 py-3 min-w-[54px] relative"
                  style={{ background: `${u.color}18` }}
                >
                  <div className="text-[9px] font-bold opacity-70" style={{ color: u.color }}>Leçon</div>
                  <div className="text-base font-extrabold leading-tight" style={{ color: u.color }}>{lessonNum}</div>
                  {completed && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success text-success-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">✓</div>
                  )}
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <div className="text-[14px] font-extrabold mb-1 leading-snug flex items-center gap-1.5">
                    {l.title}
                    {completed && <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/20 text-success font-bold">🏅 Terminé</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">📝 {enrichedVocab}+ mots</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple/15 text-purple font-semibold">🎯 {enrichedExos}+ exos</span>
                    <span className="px-1.5 py-0.5 rounded bg-warning/15 text-warning font-semibold">🎧 Hören</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">🔊🎤</span>
                  </div>
                </div>
                <div className="flex items-center pr-3 text-lg" style={{ color: u.color }}>→</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Verb detail view
  if (view === "verbs" && selectedVerb) {
    const v = VERB_TABLES[selectedVerb as keyof typeof VERB_TABLES];
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => setSelectedVerb(null)} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">⚡ {selectedVerb} ({v.meaning})</h3>
            <ArInline fr={v.meaning} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(v).filter(([k]) => k !== "meaning").map(([tense, conj]) => (
            <div key={tense} className="mb-4">
              <h4 className="text-primary font-bold text-sm mb-2 capitalize">{tense}</h4>
              <ArInline fr={tense} />
              <div className="bg-card rounded-xl border border-border p-3">
                {Object.entries(conj as Record<string, string>).map(([pron, form]) => (
                  <div key={pron} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground text-sm">{pron}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium text-sm">{form}</span>
                      <SpeakBtn text={`${pron} ${form}`} size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Verbs list view
  if (view === "verbs") {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => { setView("home"); setNav("ref"); }} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">⚡ Tous les verbes ({Object.keys(VERB_TABLES).length})</h3>
            <ArInline fr="Tous les verbes" forceAr={`جميع الأفعال (${Object.keys(VERB_TABLES).length})`} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(VERB_TABLES).map(([verb, data]) => (
              <button
                key={verb}
                onClick={() => setSelectedVerb(verb)}
                className="p-3 rounded-xl border border-border bg-card text-left cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="font-bold text-foreground text-sm">{verb}</div>
                <div className="text-muted-foreground text-xs">{data.meaning}</div>
                <ArInline fr={data.meaning} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Grammar detail view
  if (view === "grammar" && selectedGrammar) {
    const g = GRAMMAR_RULES[selectedGrammar as keyof typeof GRAMMAR_RULES];
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => setSelectedGrammar(null)} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">📖 {g.title}</h3>
            <ArInline fr={g.title} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-card rounded-xl border border-border p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {g.content}
            <ArInline fr={g.content} className="mt-3 text-[11px] leading-relaxed" />
          </div>
        </div>
      </div>
    );
  }

  // Grammar list view
  if (view === "grammar") {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => { setView("home"); setNav("ref"); }} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">📖 Grammaire complète</h3>
            <ArInline fr="Grammaire complète" forceAr="القواعد الكاملة" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(GRAMMAR_RULES).map(([key, rule]) => (
            <button
              key={key}
              onClick={() => setSelectedGrammar(key)}
              className="w-full p-4 mb-2 rounded-xl border border-border bg-card text-left cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="font-bold text-foreground text-sm">{rule.title}</div>
              <ArInline fr={rule.title} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Alphabet view
  if (view === "alphabet") {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => { setView("home"); setNav("ref"); }} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">🔤 Alphabet complet (A-Z)</h3>
            <ArInline fr="Alphabet complet" forceAr="الأبجدية الكاملة (A-Z)" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {ALPHABET_FULL.map(a => (
              <div key={a.letter} className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
                <div className="flex flex-col items-center min-w-[40px]">
                  <span className="text-2xl font-bold text-primary">{a.letter}</span>
                  <span className="text-muted-foreground text-[10px]">[{a.sound}]</span>
                </div>
                <div className="flex-1">
                  <div className="text-foreground text-xs">{a.example}</div>
                </div>
                <SpeakBtn text={a.letter} size={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Numbers view - ALL 1-1000
  if (view === "numbers") {
    const ranges: Record<string, number[]> = {
      "1-20": Array.from({ length: 21 }, (_, i) => i),
      "21-100": Array.from({ length: 80 }, (_, i) => i + 21),
      "101-200": Array.from({ length: 100 }, (_, i) => i + 101),
      "201-300": Array.from({ length: 100 }, (_, i) => i + 201),
      "301-500": Array.from({ length: 200 }, (_, i) => i + 301),
      "501-700": Array.from({ length: 200 }, (_, i) => i + 501),
      "701-1000": Array.from({ length: 300 }, (_, i) => i + 701),
    };
    const numbers = ranges[numberRange] || ranges["1-20"];
    
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => { setView("home"); setNav("ref"); }} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">🔢 Nombres 0-1000</h3>
            <ArInline fr="Nombres" forceAr="الأرقام من ٠ إلى ١٠٠٠" />
          </div>
        </div>
        {/* Range selector */}
        <div className="flex overflow-x-auto gap-1.5 px-3 py-2 border-b border-border">
          {Object.keys(ranges).map(r => (
            <button
              key={r}
              onClick={() => setNumberRange(r)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap cursor-pointer border transition-all ${
                numberRange === r 
                  ? "bg-primary text-primary-foreground border-primary font-bold" 
                  : "bg-transparent border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-1">
            {numbers.map(n => (
              <div key={n} className="flex justify-between items-center p-2 rounded-lg border border-border/50 bg-card">
                <span className="text-primary font-bold text-sm min-w-[40px]">{n}</span>
                <span className="text-foreground text-xs text-right flex-1">{numberToGerman(n)}</span>
                <SpeakBtn text={numberToGerman(n)} size={12} />
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-foreground text-xs font-bold mb-1">💡 Règles des nombres :</p>
            <p dir="rtl" className="text-emerald-400 text-[11px] mb-1">🇸🇦 قواعد الأرقام:</p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              • 1-12 : à mémoriser par cœur<br/>
              • 13-19 : unité + zehn (ex: dreizehn)<br/>
              • 21-99 : unité + und + dizaine (ex: einundzwanzig = 1 et 20)<br/>
              • 100+ : hundert + reste (ex: zweihundertfünf = 205)
            </p>
            <p dir="rtl" className="text-emerald-400/80 text-[11px] leading-relaxed mt-1">
              • ١-١٢: تُحفظ غيبًا<br/>
              • ١٣-١٩: الوحدة + zehn (مثال: dreizehn)<br/>
              • ٢١-٩٩: الوحدة + und + العشرات (مثال: einundzwanzig = ١ و ٢٠)<br/>
              • ١٠٠+: hundert + الباقي (مثال: zweihundertfünf = ٢٠٥)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pronouns view
  if (view === "pronouns") {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => { setView("home"); setNav("ref"); }} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">👥 Pronoms (ich, du, er...)</h3>
            <ArInline fr="Pronoms" forceAr="الضمائر (ich, du, er...)" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {/* Personal pronouns with examples */}
          <h4 className="text-primary font-bold text-sm mb-2">{PRONOUNS_DATA.personal.title}</h4>
          <ArInline fr={PRONOUNS_DATA.personal.title} forceAr="الضمائر الشخصية" className="mb-2" />
          <div className="flex flex-col gap-2 mb-5">
            {PRONOUNS_DATA.personal.rows.map((r, i) => (
              <div key={i} className="p-3 bg-card rounded-xl border border-border">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-lg">{r.pronoun}</span>
                    <span className="text-muted-foreground text-xs">= {r.meaning}</span>
                  </div>
                  <SpeakBtn text={r.example} size={16} />
                </div>
                <ArInline fr={r.meaning} />
                <div className="mt-1.5 text-foreground text-xs">🇩🇪 {r.example}</div>
                <div className="text-muted-foreground text-[11px] italic">🇫🇷 {r.exFr}</div>
                <ArInline fr={r.exFr} />
              </div>
            ))}
          </div>

          {/* Possessive pronouns */}
          <h4 className="text-primary font-bold text-sm mb-2">{PRONOUNS_DATA.possessive.title}</h4>
          <ArInline fr={PRONOUNS_DATA.possessive.title} forceAr="ضمائر الملكية" className="mb-2" />
          <div className="flex flex-col gap-2 mb-5">
            {PRONOUNS_DATA.possessive.rows.map((r, i) => (
              <div key={i} className="p-3 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">{r.pronoun} →</span>
                  <span className="text-primary font-bold">{r.possessiv}</span>
                </div>
                <div className="mt-1 text-foreground text-xs">🇩🇪 {r.example}</div>
                <div className="text-muted-foreground text-[11px] italic">🇫🇷 {r.exFr}</div>
                <ArInline fr={r.exFr} />
              </div>
            ))}
          </div>

          {/* Cases table */}
          <h4 className="text-primary font-bold text-sm mb-2">{PRONOUNS_DATA.cases.title}</h4>
          <ArInline fr={PRONOUNS_DATA.cases.title} forceAr="الضمائر حسب الحالات الإعرابية" className="mb-2" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left bg-primary/10 text-primary font-bold rounded-tl-lg">Cas</th>
                  {["ich","du","er","sie","es","wir","ihr","sie","Sie"].map(p => (
                    <th key={p} className="p-2 text-center bg-primary/10 text-primary font-bold">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRONOUNS_DATA.cases.table.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2 font-bold text-foreground">{row.cas}</td>
                    <td className="p-2 text-center text-foreground">{row.ich}</td>
                    <td className="p-2 text-center text-foreground">{row.du}</td>
                    <td className="p-2 text-center text-foreground">{row.er}</td>
                    <td className="p-2 text-center text-foreground">{row.sie}</td>
                    <td className="p-2 text-center text-foreground">{row.es}</td>
                    <td className="p-2 text-center text-foreground">{row.wir}</td>
                    <td className="p-2 text-center text-foreground">{row.ihr}</td>
                    <td className="p-2 text-center text-foreground">{row.siePl}</td>
                    <td className="p-2 text-center text-foreground">{row.SieFormal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Self-introduction detail view
  if (view === "introDetail" && selectedIntro) {
    const item = SELF_INTRO.find(s => s.id === selectedIntro)!;
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => { setSelectedIntro(null); setView("intro"); }} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">{item.icon} {item.questionFr.split("?")[0]}?</h3>
            <ArInline fr={item.questionFr.split("?")[0] + "?"} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {/* Question */}
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mb-4">
            <div className="text-xs text-muted-foreground mb-1">❓ La question :</div>
            <ArInline fr="La question" />
            <div className="flex items-center gap-2">
              <div className="text-foreground font-bold text-base">{item.questionDe}</div>
              <SpeakBtn text={item.questionDe.split("/")[0].trim()} size={18} />
            </div>
            <div className="text-muted-foreground text-xs italic mt-1">🇫🇷 {item.questionFr}</div>
            <ArInline fr={item.questionFr} />
          </div>

          {/* Answer template */}
          <div className="p-4 bg-success/10 rounded-xl border border-success/20 mb-4">
            <div className="text-xs text-muted-foreground mb-1">✅ La réponse :</div>
            <ArInline fr="La réponse" />
            <div className="text-foreground font-bold text-base">{item.answerDe}</div>
            <div className="text-muted-foreground text-xs italic mt-1">🇫🇷 {item.answerFr}</div>
            <ArInline fr={item.answerFr} />
          </div>

          {/* Examples */}
          <h4 className="text-primary font-bold text-sm mb-2">📝 Exemples :</h4>
          <ArInline fr="Exemples" className="mb-2" />
          <div className="flex flex-col gap-2">
            {item.examples.map((ex, i) => (
              <div key={i} className="p-3 bg-card rounded-xl border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-foreground text-sm font-medium">🇩🇪 {ex.de}</span>
                  <SpeakBtn text={ex.de} size={16} />
                </div>
                <div className="text-muted-foreground text-xs italic mt-0.5">🇫🇷 {ex.fr}</div>
                <ArInline fr={ex.fr} />
              </div>
            ))}
          </div>

          {/* Practice button */}
          <button
            onClick={() => setView("chat")}
            className="mt-4 w-full p-3.5 rounded-xl border-none cursor-pointer bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
          >
            🎤 Pratiquer avec le Prof IA
            <div dir="rtl" className="text-[11px] font-normal opacity-90 mt-0.5">🇸🇦 تدرّب مع الأستاذ الذكي</div>
          </button>
        </div>
      </div>
    );
  }

  // Self-introduction list view
  if (view === "intro") {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => { setView("home"); setNav("ref"); }} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <h3 className="text-foreground m-0 text-base">🙋 Se présenter en allemand</h3>
            <ArInline fr="Se présenter en allemand" forceAr="التعريف بالنفس بالألمانية" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-muted-foreground text-xs mb-1">Apprenez à répondre aux questions essentielles</p>
          <ArInline fr="Apprenez à répondre aux questions essentielles" forceAr="تعلّم الإجابة على الأسئلة الأساسية" className="mb-3" />
          <div className="flex flex-col gap-2">
            {SELF_INTRO.map(item => (
              <button
                key={item.id}
                onClick={() => { setSelectedIntro(item.id); setView("introDetail"); }}
                className="w-full p-4 rounded-xl border border-border bg-card text-left cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-foreground text-sm">{item.questionDe.split("/")[0].trim()}</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">{item.questionFr.split("/")[0].trim()}</div>
                    <ArInline fr={item.questionFr.split("/")[0].trim()} />
                  </div>
                  <span className="text-muted-foreground">→</span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setView("chat")}
            className="mt-4 w-full p-3.5 rounded-xl border-none cursor-pointer bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
          >
            🎤 Le Prof IA me teste sur ces questions
            <div dir="rtl" className="text-[11px] font-normal opacity-90 mt-0.5">🇸🇦 الأستاذ الذكي يختبرني في هذه الأسئلة</div>
          </button>
        </div>
      </div>
    );
  }

  const navItems: { id: NavTab; i: string; l: string; ar: string }[] = [
    { id: "learn", i: "📚", l: "Cours", ar: "دروس" },
    { id: "talk", i: "💬", l: "Parler", ar: "تكلّم" },
    { id: "ref", i: "📖", l: "Référence", ar: "مرجع" },
    { id: "stats", i: "📊", l: "Stats", ar: "إحصائيات" },
    { id: "tutor", i: "🎓", l: "Prof IA", ar: "أستاذ" },
  ];

  return (
    <div className="flex flex-col h-full bg-background font-sans">
      <div className="px-4 pt-3.5 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex justify-between items-center mb-3 gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-foreground m-0">
              🇩🇪 Deutsch<span className="text-primary">Meister</span>
            </h1>
            <p className="text-[10px] text-primary font-bold tracking-wider uppercase mt-0.5">von HAITHEM KALIA</p>
            <p className="text-muted-foreground text-[11px] mt-0.5">Niveau {level} • {ACTIVE_UNITS.length} unités • {Object.keys(VERB_TABLES).length} verbes</p>
            <ArInline fr="Votre professeur d'allemand professionnel" forceAr="مدرّس اللغة الألمانية الاحترافي" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <LevelSwitcher value={level} onChange={setLevel} />
            <LangSwitcher />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {nav === "learn" && (
          <div>
            <button
              onClick={() => setView("chat")}
              className="w-full p-3.5 rounded-2xl border-none cursor-pointer mb-3 text-left bg-primary text-primary-foreground flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <ProfessorAvatar size="md" streak={streak} />
              <div className="flex-1">
                <div className="font-bold text-sm">Herr Professor — Tuteur IA</div>
                <ArInline fr="Tuteur IA" forceAr="الأستاذ الذكي" className="text-primary-foreground/80" />
                <div className="text-[11px] opacity-85">⭐ {points} pts • Lv.{gameLevel} • 🔥{streak} jours</div>
              </div>
              <span>→</span>
            </button>

            {/* Tageschallenge - révision quotidienne */}
            <button
              onClick={() => setView("challenge")}
              className="w-full p-3.5 rounded-2xl border-2 border-success cursor-pointer mb-3 text-left bg-gradient-to-br from-success/15 via-success/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-success/20 flex items-center justify-center text-2xl">📅</div>
              <div className="flex-1">
                <div className="text-[10px] text-success font-bold uppercase tracking-wide">⭐ Nouveau · Révision du jour</div>
                <div className="font-bold text-foreground text-sm">Tageschallenge — 5 mots / jour</div>
                <ArInline fr="5 mots par jour" forceAr="٥ كلمات يوميًا" />
                <div className="text-muted-foreground text-[11px] mt-0.5">Audio + QCM · Mots tirés des {ACTIVE_UNITS.length} modules ({level}) · Historique</div>
              </div>
              <span className="text-success">→</span>
            </button>

            {/* Oral A1 - 10 grands sujets */}
            <button
              onClick={() => setView("oralA1")}
              className="w-full p-3.5 rounded-2xl border-2 border-primary cursor-pointer mb-3 text-left bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">🎓</div>
              <div className="flex-1">
                <div className="text-[10px] text-primary font-bold uppercase tracking-wide">⭐ Nouveau · Examen oral {level}</div>
                <div className="font-bold text-foreground text-sm">Oral {level} — 10 grands sujets</div>
                <ArInline fr="10 مواضيع رئيسية" forceAr="١٠ مواضيع رئيسية للامتحان الشفهي" />
                <div className="text-muted-foreground text-[11px] mt-0.5">Texte modèle audio · 30+ mots/sujet · Erreurs · Exercices · Micro 60s</div>
              </div>
              <span className="text-primary">→</span>
            </button>

            {/* Examen final - badge premium */}
            <button
              onClick={() => setView("exam")}
              className="w-full p-3.5 rounded-2xl border-2 border-primary cursor-pointer mb-3 text-left bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">🏆</div>
              <div className="flex-1">
                <div className="text-[10px] text-primary font-bold uppercase tracking-wide">⭐ Examen {level}</div>
                <div className="font-bold text-foreground text-sm">Mini-examen final {level} + Certificat</div>
                <ArInline fr="امتحان نهائي" forceAr="امتحان نهائي مصغّر + شهادة" />
                <div className="text-muted-foreground text-[11px] mt-0.5">15 questions · QCM, audio, traduction · Score & corrections</div>
              </div>
              <span className="text-primary">→</span>
            </button>

            {/* Banque de questions de l'examen final */}
            <button
              onClick={() => setView("examBank")}
              className="w-full p-3.5 rounded-2xl border border-border cursor-pointer mb-3 text-left bg-card flex items-center gap-3 hover:bg-accent/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">📚</div>
              <div className="flex-1">
                <div className="text-[10px] text-primary font-bold uppercase tracking-wide">Gérer · Banque</div>
                <div className="font-bold text-foreground text-sm">Banque de questions — Examen final</div>
                <ArInline fr="بنك الأسئلة" forceAr="بنك أسئلة الامتحان النهائي (إضافة / تعديل)" />
                <div className="text-muted-foreground text-[11px] mt-0.5">Ajouter, éditer, supprimer · QCM / Audio / Traduction · FR + AR · Lecture auto</div>
              </div>
              <span className="text-primary">→</span>
            </button>

            {/* QCM Examen 30 questions */}
            <button
              onClick={() => setView("qcmExam")}
              className="w-full p-3.5 rounded-2xl border-2 border-purple cursor-pointer mb-3 text-left bg-gradient-to-br from-purple/15 via-purple/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-purple/20 flex items-center justify-center text-2xl">📝</div>
              <div className="flex-1">
                <div className="text-[10px] text-purple font-bold uppercase tracking-wide">⭐ Nouveau · QCM Examen</div>
                <div className="font-bold text-foreground text-sm">QCM Examen — 30 questions mixtes</div>
                <ArInline fr="QCM" forceAr="٣٠ سؤال اختياري متنوع" />
                <div className="text-muted-foreground text-[11px] mt-0.5">FR→DE · DE→FR · Traduction · Correction immédiate · Score final</div>
              </div>
              <span className="text-purple">→</span>
            </button>

            {/* Hören réel - scènes audio */}
            <button
              onClick={() => setView("hoerenScenes")}
              className="w-full p-3.5 rounded-2xl border-2 border-warning cursor-pointer mb-3 text-left bg-gradient-to-br from-warning/15 via-warning/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-warning/20 flex items-center justify-center text-2xl">🎧</div>
              <div className="flex-1">
                <div className="text-[10px] text-warning font-bold uppercase tracking-wide">⭐ Nouveau · Hören réel</div>
                <div className="font-bold text-foreground text-sm">Scènes authentiques avec ambiance</div>
                <ArInline fr="مشاهد حقيقية" forceAr="مشاهد حقيقية مع أجواء صوتية" />
                <div className="text-muted-foreground text-[11px] mt-0.5">Rue · Train · Supermarché · Café · Météo · Bruits réels superposés</div>
              </div>
              <span className="text-warning">→</span>
            </button>

            {/* Tableau de maîtrise */}
            <button
              onClick={() => setView("mastery")}
              className="w-full p-3.5 rounded-2xl border-2 border-success cursor-pointer mb-4 text-left bg-gradient-to-br from-success/15 via-success/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-success/20 flex items-center justify-center text-2xl">📊</div>
              <div className="flex-1">
                <div className="text-[10px] text-success font-bold uppercase tracking-wide">⭐ Nouveau · Progression</div>
                <div className="font-bold text-foreground text-sm">Tableau de maîtrise — % par catégorie</div>
                <ArInline fr="جدول الإتقان" forceAr="جدول الإتقان — نسبة كل فئة" />
                <div className="text-muted-foreground text-[11px] mt-0.5">Vocabulaire · Exercices · Hören · Mots à retravailler · Niveau adaptatif</div>
              </div>
              <span className="text-success">→</span>
            </button>

            {/* Fiche de révision */}
            <button
              onClick={() => setView("revision")}
              className="w-full p-3.5 rounded-2xl border-2 border-destructive cursor-pointer mb-4 text-left bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-11 h-11 rounded-xl bg-destructive/20 flex items-center justify-center text-2xl">📋</div>
              <div className="flex-1">
                <div className="text-[10px] text-destructive font-bold uppercase tracking-wide">⭐ Nouveau · Reprise ciblée</div>
                <div className="font-bold text-foreground text-sm">Fiche de révision — vos difficultés</div>
                <ArInline fr="ورقة المراجعة" forceAr="ورقة المراجعة — صعوباتك" />
                <div className="text-muted-foreground text-[11px] mt-0.5">Mots faibles · Heures ratées · Prononciation · Exercices ciblés générés</div>
              </div>
              <span className="text-destructive">→</span>
            </button>

            {/* Outils Arabe : Glossaire + Mode test */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setView("arGlossary")}
                className="p-3 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 cursor-pointer text-left hover:bg-emerald-500/15 transition-colors"
              >
                <div className="text-2xl mb-1">📖</div>
                <div className="font-bold text-foreground text-xs leading-tight">Glossaire AR</div>
                <div dir="rtl" className="text-emerald-400 text-[10px]">🇸🇦 معجم عربي</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">Mots clés par chapitre</div>
              </button>
              <button
                onClick={() => setView("arHealth")}
                className="p-3 rounded-2xl border-2 border-purple/50 bg-purple/10 cursor-pointer text-left hover:bg-purple/15 transition-colors"
              >
                <div className="text-2xl mb-1">🧪</div>
                <div className="font-bold text-foreground text-xs leading-tight">Mode test AR</div>
                <div dir="rtl" className="text-emerald-400 text-[10px]">🇸🇦 فحص الترجمة</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">Vérifier la couverture</div>
              </button>
            </div>

            <div className="mt-2 mb-3 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-sm font-extrabold m-0">📚 Sommaire — {ACTIVE_UNITS.length} chapitres</h3>
                <span dir="rtl" className="text-primary text-xs font-bold">📖 الفهرس — {ACTIVE_UNITS.length} فصول</span>
              </div>
              <p className="text-muted-foreground text-[11px] mt-0.5">Programme complet · Cliquez sur un chapitre</p>
              <ArInline fr="البرنامج الكامل" forceAr="البرنامج الكامل · انقر على فصل" />
            </div>
            <div className="flex flex-col gap-2">
              {ACTIVE_UNITS.map((u, idx) => {
                const chapterNum = String(idx + 1).padStart(2, "0");
                const cp = getChapterProgress(u.lessons.map(l => l.id));
                const fullDone = cp.total > 0 && cp.completed === cp.total;
                return (
                  <button
                    key={u.id}
                    onClick={() => { setUId(u.id); setView("unit"); }}
                    className="relative flex items-stretch gap-0 rounded-2xl border-2 bg-card cursor-pointer text-left hover:bg-accent/30 transition-all overflow-hidden shadow-sm"
                    style={{ borderColor: fullDone ? "hsl(var(--success))" : `${u.color}40` }}
                  >
                    {/* Bandeau numéro chapitre */}
                    <div
                      className="flex flex-col items-center justify-center px-3 py-3 min-w-[56px] relative"
                      style={{ background: `${u.color}20`, borderRight: `1px solid ${u.color}30` }}
                    >
                      <div className="text-[9px] uppercase tracking-wider font-bold opacity-70" style={{ color: u.color }}>Ch.</div>
                      <div className="text-2xl font-extrabold leading-none" style={{ color: u.color }}>{chapterNum}</div>
                      <div className="text-2xl mt-1">{u.icon}</div>
                      {fullDone && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success text-success-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">★</div>
                      )}
                    </div>
                    <div className="flex-1 p-3 min-w-0">
                      <div className="font-extrabold text-foreground text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                        {u.title}
                        {fullDone && <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/20 text-success font-bold">🏆 100%</span>}
                      </div>
                      <ArInline fr={u.title} forceAr={UNIT_AR[u.id]?.title} />
                      <div className="text-muted-foreground text-[11px] mt-1 leading-snug">{u.desc}</div>
                      <ArInline fr={u.desc} forceAr={UNIT_AR[u.id]?.desc} />
                      {cp.hasAny && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${cp.pct}%`, background: fullDone ? "hsl(var(--success))" : u.color }} />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums" style={{ color: fullDone ? "hsl(var(--success))" : u.color }}>{cp.completed}/{cp.total}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background: `${u.color}18`, color: u.color }}>
                          📖 {u.lessons.length} leçons <span dir="rtl">· {u.lessons.length} دروس</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold">📝 Vocab <span dir="rtl">· مفردات</span></span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple/15 text-purple font-semibold">⚙️ Grammaire <span dir="rtl">· قواعد</span></span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-warning/15 text-warning font-semibold">🎧 Hören <span dir="rtl">· استماع</span></span>
                      </div>
                    </div>
                    <div className="flex items-center pr-3 text-xl" style={{ color: u.color }}>→</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {nav === "talk" && (
          <div>
            {/* Vocal IA - coach personnel */}
            <button
              onClick={() => setView("vocalIA")}
              className="w-full p-4 rounded-2xl border-2 border-primary cursor-pointer mb-3 text-left bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-3xl">🎤</div>
              <div className="flex-1">
                <div className="text-[10px] text-primary font-bold uppercase tracking-wide">⭐ Nouveau · IA</div>
                <div className="font-bold text-foreground text-sm">Vocal IA — Coach personnel</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">Parle 10-15 min → Transcription · Traduction · Résumé · Exercices · Corrections</div>
              </div>
              <span className="text-primary">→</span>
            </button>

            {/* Dialogues audio interactifs - feature card */}
            <button
              onClick={() => setView("dialogs")}
              className="w-full p-4 rounded-2xl border-2 border-primary cursor-pointer mb-4 text-left bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-3xl">🎭</div>
              <div className="flex-1">
                <div className="text-[10px] text-primary font-bold uppercase tracking-wide">⭐ 4 dialogues interactifs</div>
                <div className="font-bold text-foreground text-sm">Taxi · Restaurant · Supermarché · Pharmacie</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">Audio synchronisé · Mots surlignés · Traduction FR</div>
              </div>
              <span className="text-primary">→</span>
            </button>

            <h3 className="text-foreground text-sm font-bold mb-1 mt-1">🎭 Scénarios de conversation ({SCENARIOS.length})</h3>
            <p className="text-muted-foreground text-xs mb-3">Pratiquez avec l'IA dans des situations réelles</p>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIOS.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSc(s); setView("scenario"); }}
                  className="p-3.5 rounded-2xl border border-border bg-card text-center cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="text-3xl mb-1.5">{s.icon}</div>
                  <div className="font-bold text-foreground text-sm">{s.title}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {nav === "ref" && (
          <div>
            <h3 className="text-foreground text-sm font-bold mb-3 mt-1">📖 Référence rapide</h3>
            
            <div className="flex flex-col gap-2">
              <button onClick={() => setView("courseComplete")} className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-gradient-to-br from-primary/15 to-primary/5 cursor-pointer text-left hover:opacity-90 transition-opacity">
                <span className="text-3xl">📚</span>
                <div className="flex-1">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wide">⭐ Avec recherche 🔍</div>
                  <div className="font-bold text-foreground text-sm">Cours Complet Approfondi</div>
                  <div className="text-muted-foreground text-xs">23 modules · sein, haben, pluriels, articles, KEIN, directions, hobbys, taxi…</div>
                </div>
                <span className="text-primary">→</span>
              </button>

              <button onClick={() => setView("intro")} className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 cursor-pointer text-left hover:bg-primary/10 transition-colors">
                <span className="text-2xl">🙋</span>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">Se présenter</div>
                  <div className="text-muted-foreground text-xs">Nom, âge, pays, travail, langues...</div>
                  <ArInline fr="Se présenter" forceAr="التعريف بالنفس" />
                  <ArInline fr="Nom, âge, pays, travail, langues" forceAr="الاسم، العمر، البلد، العمل، اللغات…" />
                </div>
              </button>

              <button onClick={() => setView("pronouns")} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer text-left hover:bg-accent/50 transition-colors">
                <span className="text-2xl">👥</span>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">Pronoms (ich, du, er...)</div>
                  <div className="text-muted-foreground text-xs">Personnels, possessifs, cas</div>
                  <ArInline fr="Pronoms" forceAr="الضمائر (ich, du, er...)" />
                  <ArInline fr="Personnels, possessifs, cas" forceAr="ضمائر شخصية، ضمائر ملكية، الحالات الإعرابية" />
                </div>
              </button>

              <button onClick={() => setView("alphabet")} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer text-left hover:bg-accent/50 transition-colors">
                <span className="text-2xl">🔤</span>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">Alphabet complet (A-Z)</div>
                  <div className="text-muted-foreground text-xs">30 lettres avec prononciation 🔊</div>
                  <ArInline fr="Alphabet complet" forceAr="الأبجدية الكاملة (A-Z)" />
                  <ArInline fr="30 lettres avec prononciation" forceAr="٣٠ حرفًا مع النطق 🔊" />
                </div>
              </button>

              <button onClick={() => setView("numbers")} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer text-left hover:bg-accent/50 transition-colors">
                <span className="text-2xl">🔢</span>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">Nombres 1 → 1000</div>
                  <div className="text-muted-foreground text-xs">TOUS les nombres avec audio 🔊</div>
                  <ArInline fr="Nombres" forceAr="الأرقام من ١ إلى ١٠٠٠" />
                  <ArInline fr="Tous les nombres avec audio" forceAr="جميع الأرقام مع الصوت 🔊" />
                </div>
              </button>

              <button onClick={() => setView("verbs")} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer text-left hover:bg-accent/50 transition-colors">
                <span className="text-2xl">⚡</span>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">{Object.keys(VERB_TABLES).length} Verbes conjugués</div>
                  <div className="text-muted-foreground text-xs">heißen, sein, haben, werden, modaux...</div>
                  <ArInline fr="Verbes conjugués" forceAr={`${Object.keys(VERB_TABLES).length} فعل مع التصريف`} />
                  <ArInline fr="modaux" forceAr="heißen, sein, haben, werden، الأفعال الناقصة…" />
                </div>
              </button>

              <button onClick={() => setView("verbsDict")} className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-gradient-to-br from-primary/15 to-primary/5 cursor-pointer text-left hover:opacity-90 transition-opacity">
                <span className="text-3xl">📚</span>
                <div className="flex-1">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wide">⭐ Nouveau · 500+</div>
                  <div className="font-bold text-foreground text-sm">Dictionnaire des verbes (500+)</div>
                  <div className="text-muted-foreground text-xs">Réguliers · irréguliers · modaux · séparables · réfléchis · cas régi</div>
                  <ArInline fr="Dictionnaire des verbes" forceAr="قاموس الأفعال (٥٠٠+)" />
                  <ArInline fr="Réguliers irréguliers modaux séparables réfléchis" forceAr="منتظمة · شاذة · ناقصة · قابلة للفصل · انعكاسية · الحالة الإعرابية" />
                </div>
                <span className="text-primary">→</span>
              </button>

              <button onClick={() => setView("grammar")} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer text-left hover:bg-accent/50 transition-colors">
                <span className="text-2xl">📖</span>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">Grammaire complète</div>
                  <div className="text-muted-foreground text-xs">Cas, articles, ordre des mots, temps...</div>
                  <ArInline fr="Grammaire complète" forceAr="القواعد الكاملة" />
                  <ArInline fr="Cas articles ordre des mots temps" forceAr="الحالات، أدوات التعريف، ترتيب الكلمات، الأزمنة…" />
                </div>
              </button>
            </div>
          </div>
        )}

        {nav === "stats" && (
          <div className="text-center pt-4">
            <h3 className="text-foreground text-lg font-bold mb-2">📊 Progression</h3>
            <p className="text-muted-foreground text-sm mb-4">
              ⭐ {points} pts • Lv.{gameLevel} • 🔥 {streak} jours
            </p>
            <button
              onClick={() => setView("dashboard")}
              className="w-full p-4 rounded-xl border-none cursor-pointer font-bold text-[15px] bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              📊 Voir le dashboard complet
            </button>
          </div>
        )}

        {nav === "tutor" && (
          <div className="text-center pt-4">
            <ProfessorAvatar size="lg" streak={streak} />
            <h3 className="text-foreground text-lg font-bold mb-2 mt-3">Herr Professor</h3>
            <p className="text-muted-foreground text-sm mb-2 max-w-xs mx-auto">
              ⭐ {points} Punkte • Level {gameLevel} • 🔥 {streak} Tage Streak
            </p>
            <p className="text-muted-foreground text-xs mb-5 max-w-xs mx-auto">
              Méthode simple : il pose UNE question, vous répondez, il corrige. Comme un ami !
            </p>
            <div className="flex flex-col gap-2.5 text-left">
              {[
                { i: "❓", t: "Il vous teste", d: "Nom, âge, pays, métier, langues..." },
                { i: "✅", t: "Il corrige simplement", d: "❌ Faux → ✅ Correct + explication" },
                { i: "🎤", t: "Parlez en allemand", d: "Micro + correction de prononciation" },
                { i: "⚡", t: "Conjugaison", d: "Il demande de conjuguer des verbes" },
                { i: "🔢", t: "Nombres", d: "Il teste vos nombres en allemand" },
                { i: "💬", t: `${SCENARIOS.length} scénarios`, d: "Café, hôtel, médecin, entretien..." },
              ].map((f, i) => (
                <div key={i} className="flex gap-2.5 p-3 bg-card rounded-xl border border-border">
                  <span className="text-xl">{f.i}</span>
                  <div>
                    <div className="font-bold text-foreground text-sm">{f.t}</div>
                    <div className="text-muted-foreground text-[11px]">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setView("chat")}
              className="mt-5 w-full p-4 rounded-xl border-none cursor-pointer font-bold text-[15px] bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              🎤 Parler avec Herr Professor
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex border-t border-border bg-background/95 backdrop-blur-xl py-1.5 pb-2 z-[100]">
        {navItems.map(n => (
          <button
            key={n.id}
            onClick={() => setNav(n.id)}
            className={`flex-1 flex flex-col items-center gap-0 bg-transparent border-none cursor-pointer py-1.5 transition-colors ${
              nav === n.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className="text-xl">{n.i}</span>
            <span className={`text-[10px] leading-tight ${nav === n.id ? "font-bold" : "font-normal"}`}>{n.l}</span>
            <span dir="rtl" className="text-[9px] leading-tight opacity-75">{n.ar}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
