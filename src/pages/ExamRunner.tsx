import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, Lock, Send, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { startProctor, type ProctorHandle, DEFAULT_PROCTOR } from "@/lib/proctor";
import { useI18n } from "@/lib/i18n";

type Question = {
  id: string;
  kind: "mcq" | "true_false" | "translation" | "open" | "audio";
  prompt_de: string;
  prompt_fr?: string;
  prompt_ar?: string;
  options_de?: any;
  options_fr?: any;
  options_ar?: any;
  audio_text?: string;
  points: number;
};

const fmt = (s: number) => {
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export default function ExamRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tt } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [violations, setViolations] = useState(0);
  const [confirmStart, setConfirmStart] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ score: number; total: number; pending?: boolean } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const proctorRef = useRef<ProctorHandle | null>(null);

  // ---- log a strict-mode violation
  const logEvent = useCallback(async (type: string, meta?: any) => {
    if (!submission?.id) return;
    setViolations(v => v + 1);
    await supabase.from("exam_events").insert({ submission_id: submission.id, event_type: type, meta });
  }, [submission?.id]);

  // ---- start session
  const start = async () => {
    setConfirmStart(false);
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("exam-start", { body: { assignment_id: id } });
    if (error || (data as any)?.error) { setError((data as any)?.error || error?.message || "Erreur"); setLoading(false); return; }
    const d: any = data;
    setAssignment(d.assignment);
    setSubmission(d.submission);
    setQuestions(d.questions);
    const ans: Record<string, string> = {};
    (d.answers || []).forEach((a: any) => { ans[a.question_id] = a.answer ?? ""; });
    setAnswers(ans);
    const ms = new Date(d.submission.expires_at).getTime() - new Date(d.server_now).getTime();
    setRemaining(Math.max(0, Math.floor(ms / 1000)));
    setLoading(false);
    if (d.assignment.lockdown_strict) {
      const settings = d.assignment.proctor_settings || DEFAULT_PROCTOR;
      proctorRef.current = startProctor({
        submissionId: d.submission.id,
        settings,
        onViolation: () => setViolations(v => v + 1),
      });
    }
  };

  // ---- timer
  useEffect(() => {
    if (!submission || done) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [submission, done]);

  // ---- auto submit when time up
  useEffect(() => {
    if (submission && !done && remaining === 0 && questions.length) {
      doSubmit(true);
    }
  }, [remaining]);

  // ---- proctor cleanup on unmount
  useEffect(() => () => { proctorRef.current?.stop(); }, []);

  // ---- save answer (debounced)
  const saveTimer = useRef<any>(null);
  const setAnswer = (qid: string, val: string) => {
    setAnswers(a => ({ ...a, [qid]: val }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.functions.invoke("exam-answer", { body: { submission_id: submission.id, question_id: qid, answer: val } });
    }, 400);
  };

  // ---- audio auto-play for audio questions
  const q = questions[idx];
  useEffect(() => {
    if (!q || q.kind !== "audio" || !q.audio_text) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts?text=${encodeURIComponent(q.audio_text)}&lang=de`;
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    }
  }, [q?.id]);

  const doSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("exam-submit", { body: { submission_id: submission.id } });
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message); setSubmitting(false); return; }
    const d: any = data;
    setDone({ score: d.score, total: d.total, pending: d.hasPending });
    proctorRef.current?.stop();
    if (auto) toast.warning(tt({ fr: "⏰ Temps écoulé — examen soumis automatiquement", de: "⏰ Zeit abgelaufen — Prüfung automatisch eingereicht", ar: "⏰ انتهى الوقت — تم تسليم الامتحان تلقائيًا" }));
    else toast.success(tt({ fr: "Examen envoyé ✓", de: "Prüfung gesendet ✓", ar: "تم إرسال الامتحان ✓" }));
  };

  // ---- screens
  if (confirmStart) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-primary"/>{tt({ fr: "Examen surveillé", de: "Überwachte Prüfung", ar: "امتحان مراقب" })}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>⚠️ {tt({ fr: "Cet examen est en mode verrouillage strict :", de: "Diese Prüfung läuft im strengen Sperrmodus:", ar: "هذا الامتحان في وضع القفل الصارم:" })}</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>{tt({ fr: "Plein écran obligatoire", de: "Vollbild erforderlich", ar: "ملء الشاشة إلزامي" })}</li>
              <li>{tt({ fr: "Copier/coller, clic-droit et raccourcis bloqués", de: "Kopieren/Einfügen, Rechtsklick und Shortcuts gesperrt", ar: "النسخ/اللصق والنقر الأيمن والاختصارات محظورة" })}</li>
              <li>{tt({ fr: "Tout changement d'onglet est enregistré et envoyé au professeur", de: "Jeder Tabwechsel wird aufgezeichnet und an den Lehrer gesendet", ar: "كل تغيير في علامة التبويب يُسجَّل ويُرسَل للأستاذ" })}</li>
              <li>{tt({ fr: "Minuteur côté serveur — vous ne pouvez pas le tricher", de: "Server-Timer — nicht manipulierbar", ar: "المؤقت من جهة الخادم — لا يمكن التلاعب به" })}</li>
              <li>{tt({ fr: "À la fin du temps, l'examen est soumis automatiquement", de: "Am Ende der Zeit wird die Prüfung automatisch eingereicht", ar: "عند انتهاء الوقت يُسلَّم الامتحان تلقائيًا" })}</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => navigate("/student")}>{tt({ fr: "Annuler", de: "Abbrechen", ar: "إلغاء" })}</Button>
              <Button onClick={start}>{tt({ fr: "Je comprends, commencer", de: "Verstanden, starten", ar: "فهمت، ابدأ" })}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">{tt({ fr: "Chargement…", de: "Wird geladen…", ar: "جارٍ التحميل…" })}</div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md"><CardContent className="p-6 space-y-3">
        <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5"/><b>{tt({ fr: "Impossible de démarrer", de: "Start nicht möglich", ar: "تعذّر البدء" })}</b></div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => navigate("/student")}>{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}</Button>
      </CardContent></Card>
    </div>
  );

  if (done) {
    const pct = done.total ? Math.round((done.score / done.total) * 100) : 0;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>{tt({ fr: "Examen terminé ✓", de: "Prüfung beendet ✓", ar: "انتهى الامتحان ✓" })}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-center">
            <div className="text-5xl font-bold">{done.score}<span className="text-xl text-muted-foreground"> / {done.total}</span></div>
            <Progress value={pct} />
            <p className="text-sm">{pct}% {pct >= (assignment?.passing_score ?? 60) ? tt({ fr: "— Réussi 🎉", de: "— Bestanden 🎉", ar: "— ناجح 🎉" }) : tt({ fr: "— Non atteint", de: "— Nicht bestanden", ar: "— لم يُحقَّق" })}</p>
            {done.pending && <p className="text-xs text-muted-foreground">{tt({ fr: "Certaines questions (traduction/audio) seront notées par le professeur.", de: "Einige Fragen (Übersetzung/Audio) werden vom Lehrer benotet.", ar: "بعض الأسئلة (الترجمة/الصوت) سيقوم المعلّم بتصحيحها." })}</p>}
            {violations > 0 && <p className="text-xs text-destructive">{violations} {tt({ fr: "incident(s) anti-triche enregistré(s).", de: "Anti-Cheating-Vorfälle aufgezeichnet.", ar: "حادثة/حوادث مكافحة الغش مسجَّلة." })}</p>}
            <Button onClick={() => navigate("/student")} className="w-full">{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!q) return null;
  const opts = q.options_fr || q.options_de || q.options_ar || (q.kind === "true_false" ? [tt({ fr: "Vrai", de: "Wahr", ar: "صحيح" }), tt({ fr: "Faux", de: "Falsch", ar: "خطأ" })] : null);
  const answered = Object.values(answers).filter(Boolean).length;

  return (
    <div className="min-h-[100dvh] bg-background select-none pb-[env(safe-area-inset-bottom)]" onCopy={e=>e.preventDefault()}>
      <header className="sticky top-0 z-10 border-b bg-card px-2 sm:px-3 py-2 flex items-center justify-between gap-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-4 h-4 text-primary shrink-0"/>
          <span className="font-semibold text-xs sm:text-sm truncate">{assignment?.title}</span>
          <Badge variant="outline" className="hidden sm:inline-flex">{assignment?.level}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {violations > 0 && <Badge variant="destructive" className="text-xs">⚠ {violations}</Badge>}
          <div className={`flex items-center gap-1 font-mono text-base sm:text-lg ${remaining < 60 ? "text-destructive animate-pulse" : ""}`}>
            <Clock className="w-4 h-4"/>{fmt(remaining)}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>{tt({ fr: "Question", de: "Frage", ar: "سؤال" })} {idx + 1} / {questions.length}</span>
          <span>{answered} {tt({ fr: "répondu(es)", de: "beantwortet", ar: "تمت الإجابة" })}</span>
        </div>
        <Progress value={((idx + 1) / questions.length) * 100} />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-base" dir="ltr">🇩🇪 {q.prompt_de}</CardTitle>
                {q.prompt_fr && <p className="text-sm text-muted-foreground">🇫🇷 {q.prompt_fr}</p>}
                {q.prompt_ar && <p className="text-sm text-emerald-500" dir="rtl">🇸🇦 {q.prompt_ar}</p>}
              </div>
              <Badge>{q.kind}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.kind === "audio" && (
              <div className="flex items-center gap-2">
                <audio ref={audioRef} controls autoPlay className="w-full"/>
                <Button size="sm" variant="outline" onClick={() => audioRef.current?.play()}><Volume2 className="w-4 h-4"/></Button>
              </div>
            )}

            {opts && Array.isArray(opts) ? (
              <div className="grid gap-2">
                {(opts as string[]).map((o, i) => {
                  const fr = Array.isArray(q.options_fr) ? q.options_fr[i] : null;
                  const ar = Array.isArray(q.options_ar) ? q.options_ar[i] : null;
                  return (
                    <Button key={o+i} variant={answers[q.id] === o ? "default" : "outline"}
                            className="justify-start h-auto py-3 text-left whitespace-normal flex-col items-start gap-0.5"
                            onClick={() => setAnswer(q.id, o)}>
                      <span dir="ltr" className="font-semibold">🇩🇪 {o}</span>
                      {fr && <span className="text-xs opacity-80">🇫🇷 {fr}</span>}
                      {ar && <span className="text-xs opacity-80" dir="rtl">🇸🇦 {ar}</span>}
                    </Button>
                  );
                })}
              </div>
            ) : q.kind === "translation" || q.kind === "open" || q.kind === "audio" ? (
              <Textarea value={answers[q.id] ?? ""} onChange={e => setAnswer(q.id, e.target.value)}
                        placeholder={tt({ fr: "Votre réponse…", de: "Ihre Antwort…", ar: "إجابتك…" })} rows={4} onPaste={e=>e.preventDefault()}/>
            ) : (
              <Input value={answers[q.id] ?? ""} onChange={e => setAnswer(q.id, e.target.value)}
                     onPaste={e=>e.preventDefault()} placeholder={tt({ fr: "Votre réponse…", de: "Ihre Antwort…", ar: "إجابتك…" })}/>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>← {tt({ fr: "Précédent", de: "Zurück", ar: "السابق" })}</Button>
          {idx < questions.length - 1 ? (
            <Button onClick={() => setIdx(i => i + 1)}>{tt({ fr: "Suivant", de: "Weiter", ar: "التالي" })} →</Button>
          ) : (
            <Button onClick={() => doSubmit(false)} disabled={submitting} className="bg-primary">
              <Send className="w-4 h-4 mr-1"/>{submitting ? tt({ fr: "Envoi…", de: "Senden…", ar: "إرسال…" }) : tt({ fr: "Terminer l'examen", de: "Prüfung beenden", ar: "إنهاء الامتحان" })}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-10 gap-1 pt-2">
          {questions.map((qq, i) => (
            <button key={qq.id} onClick={() => setIdx(i)}
                    className={`h-8 rounded text-xs font-mono ${i === idx ? "bg-primary text-primary-foreground" : answers[qq.id] ? "bg-secondary" : "bg-muted"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
