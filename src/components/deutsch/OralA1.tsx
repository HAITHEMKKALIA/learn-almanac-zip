import { useState, useRef, useEffect } from "react";
import { ORAL_A1_TOPICS, type OralTopic, type OralExercise } from "@/data/oralA1";
import { SpeakBtn } from "./SpeakBtn";
import { speak } from "@/lib/voice";
import { translateFrToAr, useI18n } from "@/lib/i18n";

const ArLine = ({ fr, className = "" }: { fr: string; className?: string }) => {
  const { showAr, deOnly } = useI18n();
  if (deOnly || !showAr) return null;
  const ar = translateFrToAr(fr);
  if (!ar) return null;
  return <div dir="rtl" className={`text-emerald-400 text-xs mt-0.5 ${className}`}>🇸🇦 {ar}</div>;
};

interface Props { onBack: () => void; }
type Tab = "model" | "vocab" | "grammar" | "errors" | "phrases" | "ex" | "mic";

export function OralA1({ onBack }: Props) {
  const [topic, setTopic] = useState<OralTopic | null>(null);
  const [tab, setTab] = useState<Tab>("model");

  if (!topic) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <h3 className="text-foreground m-0 text-base flex-1">🎓 Oral A1 — 10 grands sujets</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30">
            <p className="text-sm text-foreground font-bold mb-1">📋 Préparation à l'examen oral A1</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chaque sujet contient : texte modèle audio mot-par-mot, 30+ mots de vocabulaire, explications grammaticales,
              erreurs corrigées, phrases utiles, exercices et entraînement micro 60s.
            </p>
          </div>
          {ORAL_A1_TOPICS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTopic(t); setTab("model"); }}
              className="w-full p-4 mb-2 rounded-2xl border border-border bg-card text-left cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">{t.number}. {t.title}</div>
                  <ArLine fr={t.title} />
                  <div className="text-muted-foreground text-xs italic">{t.titleDe}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">📝 {t.vocabulary.length} mots</span>
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">⚠️ {t.errors.length} erreurs</span>
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">🎯 {t.exercises.length} exercices</span>
                  </div>
                </div>
                <span className="text-muted-foreground">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "model", label: "Texte", icon: "📖" },
    { id: "vocab", label: "Vocab", icon: "📝" },
    { id: "grammar", label: "Grammaire", icon: "📚" },
    { id: "errors", label: "Erreurs", icon: "⚠️" },
    { id: "phrases", label: "Phrases", icon: "💡" },
    { id: "ex", label: "Exercices", icon: "🎯" },
    { id: "mic", label: "Micro 60s", icon: "🎤" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={() => setTopic(null)} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <h3 className="text-foreground m-0 text-base flex-1">{topic.icon} {topic.title}</h3>
        <ArLine fr={topic.title} className="text-[10px]" />
      </div>
      <div className="flex overflow-x-auto gap-1.5 px-3 py-2 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap cursor-pointer border transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground border-primary font-bold" : "bg-transparent border-border text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "model" && <ModelTab topic={topic} />}
        {tab === "vocab" && <VocabTab topic={topic} />}
        {tab === "grammar" && <GrammarTab topic={topic} />}
        {tab === "errors" && <ErrorsTab topic={topic} />}
        {tab === "phrases" && <PhrasesTab topic={topic} />}
        {tab === "ex" && <ExercisesTab topic={topic} />}
        {tab === "mic" && <MicTab topic={topic} />}
      </div>
    </div>
  );
}

// ===== TEXTE MODÈLE avec lecture mot-à-mot =====
function ModelTab({ topic }: { topic: OralTopic }) {
  const [showFr, setShowFr] = useState(true);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const playAll = async () => {
    if (playing) { window.speechSynthesis?.cancel(); setPlaying(false); setHighlightIdx(-1); return; }
    setPlaying(true);
    for (let i = 0; i < topic.sentences.length; i++) {
      setHighlightIdx(i);
      await speak(topic.sentences[i].de, "de-DE", 0.78);
    }
    setHighlightIdx(-1); setPlaying(false);
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={playAll}
          className="flex-1 p-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm cursor-pointer"
        >
          {playing ? "⏹️ Stop" : "▶️ Tout écouter"}
        </button>
        <button
          onClick={() => setShowFr(s => !s)}
          className="px-3 rounded-xl border border-border bg-card text-foreground text-xs cursor-pointer"
        >
          {showFr ? "🇫🇷 ON" : "🇫🇷 OFF"}
        </button>
      </div>
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <p className="text-xs text-muted-foreground mb-2 italic">{topic.intro}</p>
        <ArLine fr={topic.intro} />
      </div>
      {topic.sentences.map((s, i) => (
        <div
          key={i}
          className={`p-3 mb-2 rounded-xl border transition-all ${
            highlightIdx === i ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-primary text-xs font-bold mt-0.5">{i + 1}</span>
            <div className="flex-1">
              <div className="text-foreground text-sm font-medium">🇩🇪 {s.de}</div>
              {showFr && <div className="text-muted-foreground text-xs mt-1 italic">🇫🇷 {s.fr}</div>}
              {showFr && <ArLine fr={s.fr} />}
            </div>
            <SpeakBtn text={s.de} size={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== VOCABULAIRE =====
function VocabTab({ topic }: { topic: OralTopic }) {
  const [search, setSearch] = useState("");
  const filtered = topic.vocabulary.filter(v =>
    v.de.toLowerCase().includes(search.toLowerCase()) || v.fr.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Rechercher un mot…"
        className="w-full p-2 mb-3 rounded-lg border border-border bg-card text-foreground text-sm"
      />
      <div className="text-xs text-muted-foreground mb-2">{filtered.length} / {topic.vocabulary.length} mots</div>
      {filtered.map((v, i) => (
        <div key={i} className="p-2.5 mb-1.5 rounded-lg border border-border bg-card flex items-center gap-2">
          <div className="flex-1">
            <div className="text-foreground text-sm font-medium">{v.de}</div>
            <div className="text-muted-foreground text-xs">{v.fr}</div>
            <ArLine fr={v.fr} />
            {v.ex && <div className="text-primary text-[11px] mt-1 italic">"{v.ex}" → {v.exFr}</div>}
            {v.ex && <ArLine fr={v.exFr} />}
          </div>
          <SpeakBtn text={v.de} size={14} />
        </div>
      ))}
    </div>
  );
}

// ===== GRAMMAIRE =====
function GrammarTab({ topic }: { topic: OralTopic }) {
  return (
    <div>
      {topic.explanations.map((e, i) => (
        <div key={i} className="p-3 mb-2 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary font-bold text-sm">🇩🇪 {e.de}</span>
            <SpeakBtn text={e.de} size={14} />
          </div>
          <div className="text-muted-foreground text-xs italic mb-1.5">🇫🇷 {e.fr}</div>
          <ArLine fr={e.fr} className="mb-1.5" />
          <div className="text-foreground text-xs leading-relaxed bg-primary/5 p-2 rounded-lg border border-primary/20">
            💡 {e.detail}
          </div>
          <ArLine fr={e.detail} className="mt-1" />
        </div>
      ))}
    </div>
  );
}

// ===== ERREURS =====
function ErrorsTab({ topic }: { topic: OralTopic }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-3 italic">⚠️ Évite ces erreurs fréquentes !</div>
      {topic.errors.map((e, i) => (
        <div key={i} className="p-3 mb-2 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-destructive text-sm font-bold">❌ {e.wrong}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-success text-sm font-bold">✅ {e.right}</span>
            <SpeakBtn text={e.right} size={14} />
          </div>
          <div className="text-foreground text-xs leading-relaxed bg-primary/5 p-2 rounded-lg border border-primary/20">
            💡 {e.explain}
          </div>
          <ArLine fr={e.explain} className="mt-1" />
        </div>
      ))}
    </div>
  );
}

// ===== PHRASES UTILES =====
function PhrasesTab({ topic }: { topic: OralTopic }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-3 italic">💡 Phrases bonus pour briller à l'oral</div>
      {topic.usefulPhrases.map((p, i) => (
        <div key={i} className="p-3 mb-2 rounded-xl border border-border bg-card flex items-center gap-2">
          <div className="flex-1">
            <div className="text-foreground text-sm font-medium">🇩🇪 {p.de}</div>
            <div className="text-muted-foreground text-xs italic mt-0.5">🇫🇷 {p.fr}</div>
            <ArLine fr={p.fr} />
          </div>
          <SpeakBtn text={p.de} size={16} />
        </div>
      ))}
    </div>
  );
}

// ===== EXERCICES =====
function ExercisesTab({ topic }: { topic: OralTopic }) {
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState<string | number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const ex = topic.exercises[idx];

  const isCorrect = () => {
    if (ex.type === "qcm") return val === ex.ans;
    return String(val).trim().toLowerCase().replace(/[?.!,]/g, "") === String(ex.ans).toLowerCase().replace(/[?.!,]/g, "");
  };

  const check = () => {
    const c = isCorrect();
    if (c) setScore(s => s + 1);
    setChecked(true);
  };

  const next = () => {
    if (idx + 1 >= topic.exercises.length) { setDone(true); return; }
    setIdx(i => i + 1); setVal(null); setChecked(false);
  };

  if (done) {
    const p = Math.round((score / topic.exercises.length) * 100);
    return (
      <div className="text-center p-4">
        <div className="text-6xl mb-3">{p >= 80 ? "🏆" : p >= 50 ? "👍" : "📚"}</div>
        <div className="text-2xl font-bold text-foreground">{p}%</div>
        <div className="text-muted-foreground text-sm mb-4">{score} / {topic.exercises.length}</div>
        <button
          onClick={() => { setIdx(0); setVal(null); setChecked(false); setScore(0); setDone(false); }}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm cursor-pointer"
        >
          🔄 Recommencer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">Question {idx + 1}/{topic.exercises.length} — Score : {score}</div>
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <div className="text-[11px] text-primary uppercase font-bold mb-1.5">{ex.type}</div>
        <div className="text-foreground text-sm font-medium mb-3">{ex.q}</div>
        <ArLine fr={ex.q} className="mb-2 -mt-2" />
        {ex.type === "qcm" && ex.opts && (
          <div className="flex flex-col gap-1.5">
            {ex.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => !checked && setVal(i)}
                className={`p-2.5 rounded-lg border text-left text-sm cursor-pointer transition-all ${
                  checked && i === ex.ans ? "border-success bg-success/20 text-foreground" :
                  checked && val === i ? "border-destructive bg-destructive/20 text-foreground" :
                  val === i ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        {(ex.type === "translate" || ex.type === "fill" || ex.type === "correct") && (
          <input
            value={val as string || ""}
            onChange={e => setVal(e.target.value)}
            disabled={checked}
            placeholder="Ta réponse…"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
          />
        )}
        {checked && (
          <div className={`mt-3 p-2.5 rounded-lg text-xs ${isCorrect() ? "bg-success/10 border border-success/40" : "bg-destructive/10 border border-destructive/40"}`}>
            <div className="font-bold mb-1 text-foreground">{isCorrect() ? "✅ Correct !" : `❌ Réponse : ${ex.type === "qcm" ? ex.opts![ex.ans as number] : ex.ans}`}</div>
            <div className="text-muted-foreground">💡 {ex.tip}</div>
            <ArLine fr={ex.tip} />
          </div>
        )}
      </div>
      {!checked ? (
        <button onClick={check} disabled={val === null || val === ""} className="w-full p-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm cursor-pointer disabled:opacity-50">
          Vérifier
        </button>
      ) : (
        <button onClick={next} className="w-full p-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm cursor-pointer">
          {idx + 1 >= topic.exercises.length ? "Voir le résultat" : "Suivant →"}
        </button>
      )}
    </div>
  );
}

// ===== MICRO 60s =====
function MicTab({ topic }: { topic: OralTopic }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [time, setTime] = useState(60);
  const recRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const start = () => {
    const W: any = window;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) { alert("Reconnaissance vocale non supportée sur ce navigateur (Chrome recommandé)."); return; }
    const rec = new SR();
    rec.lang = "de-DE"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (ev: any) => {
      let txt = "";
      for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript + " ";
      setTranscript(txt);
    };
    rec.onend = () => setRecording(false);
    rec.start(); recRef.current = rec; setRecording(true); setTranscript(""); setTime(60);
    timerRef.current = setInterval(() => {
      setTime(t => {
        if (t <= 1) { stop(); return 0; }
        return t - 1;
      });
    }, 1000);
  };
  const stop = () => {
    try { recRef.current?.stop(); } catch {}
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };
  useEffect(() => () => stop(), []);

  return (
    <div>
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-3">
        <div className="text-foreground text-sm font-bold mb-1">🎯 Entraînement oral 60 secondes</div>
        <ArLine fr="Entraînement oral 60 secondes" className="mb-1" />
        <div className="text-muted-foreground text-xs leading-relaxed">
          Lance le micro et parle 60 secondes sur le sujet <b>{topic.title}</b>. Le système transcrit ce que tu dis pour que tu puisses comparer avec le texte modèle.
        </div>
        <ArLine fr={`Lance le micro et parle 60 secondes sur le sujet ${topic.title}.`} className="mt-1" />
      </div>

      <div className="text-center mb-4">
        <div className="text-5xl font-bold text-primary mb-2">{time}s</div>
        {!recording ? (
          <button onClick={start} className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-base cursor-pointer">
            🎤 Démarrer
          </button>
        ) : (
          <button onClick={stop} className="px-8 py-3 rounded-2xl bg-destructive text-destructive-foreground font-bold text-base cursor-pointer animate-pulse">
            ⏹️ Stop
          </button>
        )}
      </div>

      {transcript && (
        <div className="bg-card rounded-xl border border-border p-3 mb-3">
          <div className="text-[11px] text-primary uppercase font-bold mb-1">📝 Tu as dit :</div>
          <div className="text-foreground text-sm leading-relaxed">{transcript}</div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-3">
        <div className="text-[11px] text-success uppercase font-bold mb-2 flex items-center justify-between">
          <span>✅ Texte modèle (à imiter)</span>
          <SpeakBtn text={topic.modelDe} size={14} />
        </div>
        <div className="text-foreground text-sm leading-relaxed">{topic.modelDe}</div>
        <div className="text-muted-foreground text-xs italic mt-2">{topic.modelFr}</div>
        <ArLine fr={topic.modelFr} className="mt-1" />
      </div>
    </div>
  );
}
