import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sparkles, Loader2, Send, CheckCircle2, ArrowLeft, FileCheck2, History, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { STATUS_META, isReady, type GradingStatus } from "@/lib/gradingStatus";
import { useI18n } from "@/lib/i18n";

export default function AssignmentReview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { tt } = useI18n();
  const [assignment, setAssignment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [retryingQid, setRetryingQid] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: a } = await supabase.from("assignments").select("*, classes(name)").eq("id", id).single();
    setAssignment(a);
    const { data: aq } = await supabase.from("assignment_questions")
      .select("position, points_override, question_bank(id, kind, prompt_de, prompt_fr, options_de, correct_answer, explanation_fr, points)")
      .eq("assignment_id", id).order("position");
    setQuestions(aq || []);
    const { data: subs } = await supabase.from("submissions").select("*").eq("assignment_id", id).order("submitted_at", { ascending: false });
    const ids = (subs || []).map((s: any) => s.student_id);
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("user_id, display_name, email").in("user_id", ids)
      : { data: [] as any[] };
    const byId: Record<string, any> = {};
    (profs || []).forEach((p: any) => { byId[p.user_id] = p; });
    setSubmissions((subs || []).map((s: any) => ({ ...s, profile: byId[s.student_id] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const reloadAnswersAndEvents = async (submissionId: string) => {
    const [{ data: ans }, { data: evs }] = await Promise.all([
      supabase.from("submission_answers").select("*").eq("submission_id", submissionId),
      (supabase as any).from("grading_events").select("*").eq("submission_id", submissionId).order("created_at", { ascending: false }),
    ]);
    setAnswers(ans || []);
    setEvents(evs || []);
    const actorIds = Array.from(new Set((evs || []).map((e: any) => e.actor_id).filter(Boolean)));
    if (actorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", actorIds as any);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p.display_name || p.email || p.user_id.slice(0, 8); });
      setActorNames(map);
    } else {
      setActorNames({});
    }
  };

  const openSub = async (s: any) => {
    setActive(s);
    setAiError(null);
    await reloadAnswersAndEvents(s.id);
  };

  const logEvent = async (payload: any) => {
    if (!user?.id || !active?.id) return;
    await (supabase as any).from("grading_events").insert({
      submission_id: active.id,
      actor_id: user.id,
      actor_role: "teacher",
      ...payload,
    });
  };

  const aiAutoGrade = async (s: any) => {
    setAiBusy(true);
    setAiError(null);

    // 1) Mark every answer ai_running and reset prior ai grading
    await (supabase as any).from("submission_answers")
      .update({ grading_status: "ai_running" as GradingStatus })
      .eq("submission_id", s.id)
      .in("grading_status", ["pending", "ai_failed", "ai_graded"]);
    await reloadAnswersAndEvents(s.id);
    await logEvent({ kind: "ai_attempt_start", message: "Lancement de la correction IA" });

    try {
      const { data, error } = await supabase.functions.invoke("ai-grade", { body: { kind: "exam", submission_id: s.id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      // 2) Promote remaining ai_running answers to ai_graded if the function set ai_graded=true
      await (supabase as any).from("submission_answers")
        .update({ grading_status: "ai_graded" as GradingStatus })
        .eq("submission_id", s.id)
        .eq("ai_graded", true);
      // 3) Anything still ai_running counts as failed for that question
      await (supabase as any).from("submission_answers")
        .update({ grading_status: "ai_failed" as GradingStatus })
        .eq("submission_id", s.id)
        .eq("grading_status", "ai_running");

      await logEvent({ kind: "ai_attempt_success", message: `Score IA ${(data as any).score}/${(data as any).total}`, meta: data });
      toast.success(`✨ Correction IA: ${(data as any).score}/${(data as any).total}`);
    } catch (e: any) {
      const msg = e?.message || "Erreur IA";
      setAiError(msg);
      await (supabase as any).from("submission_answers")
        .update({ grading_status: "ai_failed" as GradingStatus })
        .eq("submission_id", s.id)
        .eq("grading_status", "ai_running");
      await logEvent({ kind: "ai_attempt_failure", message: msg });
      toast.error(`IA indisponible — ${msg}. Vous pouvez corriger manuellement.`);
    } finally {
      setAiBusy(false);
      await reloadAnswersAndEvents(s.id);
    }
  };

  const saveAnswer = async (a: any, awarded: number, comment: string, is_correct: boolean | null) => {
    if (!Number.isFinite(awarded) || awarded < 0) {
      toast.error("Note invalide.");
      return;
    }
    setSavingId(a.id);
    const { error } = await (supabase as any).from("submission_answers")
      .update({
        awarded_points: awarded,
        teacher_comment: comment,
        is_correct,
        ai_graded: false,
        grading_status: "manual_graded" as GradingStatus,
      })
      .eq("id", a.id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    await logEvent({
      kind: "manual_save",
      question_id: a.question_id,
      awarded_points: awarded,
      teacher_comment: comment,
      is_correct,
      message: "Correction manuelle enregistrée",
    });
    toast.success("Enregistré");
    await reloadAnswersAndEvents(active.id);
  };

  const retryQuestion = async (a: any) => {
    if (!a?.id || !active?.id) return;
    setRetryingQid(a.question_id);
    await (supabase as any).from("submission_answers")
      .update({ grading_status: "ai_running" as GradingStatus, ai_graded: false })
      .eq("id", a.id);
    await logEvent({
      kind: "ai_attempt_start",
      question_id: a.question_id,
      message: "Re-tentative IA sur cette question",
    });
    await reloadAnswersAndEvents(active.id);
    try {
      const { data, error } = await supabase.functions.invoke("ai-grade", {
        body: { kind: "exam", submission_id: active.id, question_id: a.question_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      await logEvent({ kind: "ai_attempt_success", question_id: a.question_id, message: "Re-tentative IA réussie" });
      toast.success("✨ Question re-corrigée par l'IA");
    } catch (e: any) {
      const msg = e?.message || "Erreur IA";
      await (supabase as any).from("submission_answers")
        .update({ grading_status: "ai_failed" as GradingStatus })
        .eq("id", a.id);
      await logEvent({ kind: "ai_attempt_failure", question_id: a.question_id, message: msg });
      toast.error(`Échec IA — ${msg}`);
    } finally {
      setRetryingQid(null);
      await reloadAnswersAndEvents(active.id);
    }
  };

  const recomputeAndRelease = async (s: any) => {
    if (aiBusy) {
      toast.error("Veuillez attendre la fin de la correction IA en cours.");
      return;
    }
    const { data: ans } = await supabase.from("submission_answers").select("*").eq("submission_id", s.id);
    let score = 0; let total = 0;
    const missing: number[] = [];
    const running: number[] = [];
    questions.forEach((q, idx) => {
      const pts = q.points_override ?? q.question_bank?.points ?? 1;
      total += pts;
      const a = (ans || []).find((x: any) => x.question_id === q.question_bank.id);
      const st = a?.grading_status as GradingStatus | undefined;
      if (st === "ai_running") { running.push(idx + 1); }
      else if (!isReady(st) || a?.awarded_points == null) { missing.push(idx + 1); }
      else { score += Number(a.awarded_points); }
    });
    if (running.length > 0) {
      toast.error(`Re-correction IA en cours sur Q${running.join(", Q")}. Réessayez dans un instant.`);
      return;
    }
    if (missing.length > 0) {
      toast.error(`Publication impossible : ${missing.length} question(s) sans correction prête (Q${missing.join(", Q")}). Lancez la correction IA ou notez-les manuellement.`);
      return;
    }
    const { error } = await supabase.from("submissions").update({
      score: Math.round(score), total,
      teacher_feedback: s.teacher_feedback || "Corrigé par le professeur.",
      released_at: new Date().toISOString(),
    }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success(tt({ fr: "✓ Résultats publiés à l'élève", de: "✓ Ergebnisse für den Schüler veröffentlicht", ar: "✓ تم نشر النتائج للطالب" }));
    setActive(null); load();
  };

  if (loading) return <SchoolLayout title={tt({ fr: "Correction", de: "Korrektur", ar: "التصحيح" })}><p className="text-sm text-muted-foreground">{tt({ fr: "Chargement…", de: "Wird geladen…", ar: "جارٍ التحميل…" })}</p></SchoolLayout>;
  if (!assignment) return <SchoolLayout title={tt({ fr: "Introuvable", de: "Nicht gefunden", ar: "غير موجود" })}><p>{tt({ fr: "Devoir introuvable.", de: "Aufgabe nicht gefunden.", ar: "الواجب غير موجود." })}</p></SchoolLayout>;

  const sentSubs = submissions.filter((s) => s.status === "submitted" || s.released_at);
  const allReady = active && questions.every((q) => {
    const a = answers.find((x: any) => x.question_id === q.question_bank.id);
    return isReady(a?.grading_status) && a?.awarded_points != null;
  });

  return (
    <SchoolLayout
      title={`${tt({ fr: "Correction", de: "Korrektur", ar: "تصحيح" })} — ${assignment.title}`}
      subtitle={`${assignment.classes?.name || ""} · ${assignment.level} · ${sentSubs.length} ${tt({ fr: "soumission(s)", de: "Abgabe(n)", ar: "تسليم/تسليمات" })}`}
      breadcrumbs={[
        { label: tt({ fr: "Professeur", de: "Lehrer", ar: "الأستاذ" }), href: "/teacher" },
        { label: tt({ fr: "Devoirs", de: "Aufgaben", ar: "الواجبات" }), href: "/teacher/assignments" },
        { label: assignment.title },
      ]}
    >
      <Link to="/teacher/assignments" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="h-3 w-3"/> {tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}
      </Link>

      {!active ? (
        <div className="space-y-2">
          {sentSubs.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">{tt({ fr: "Aucune soumission pour le moment.", de: "Noch keine Abgaben.", ar: "لا توجد تسليمات بعد." })}</CardContent></Card>
          )}
          {sentSubs.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:border-primary/40" onClick={() => openSub(s)}>
              <CardContent className="py-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{s.profile?.display_name || s.profile?.email || s.student_id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.score ?? 0} / {s.total ?? 0}</Badge>
                  {s.released_at ? (
                    <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 me-1"/>{tt({ fr: "Publié", de: "Veröffentlicht", ar: "منشور" })}</Badge>
                  ) : (
                    <Badge variant="secondary">{tt({ fr: "À corriger", de: "Zu korrigieren", ar: "للتصحيح" })}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-semibold">{active.profile?.display_name || active.profile?.email}</div>
              <div className="text-xs text-muted-foreground">{tt({ fr: "Score actuel", de: "Aktuelle Punktzahl", ar: "النتيجة الحالية" })}: {active.score ?? 0} / {active.total ?? 0}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setActive(null)}>← {tt({ fr: "Liste", de: "Liste", ar: "القائمة" })}</Button>
              <Button size="sm" disabled={aiBusy} variant={aiError ? "destructive" : "default"} onClick={() => aiAutoGrade(active)}>
                {aiBusy ? <Loader2 className="h-3 w-3 animate-spin me-1"/> : <Sparkles className="h-3 w-3 me-1"/>}
                {aiBusy ? tt({ fr: "IA en cours…", de: "KI läuft…", ar: "الذكاء الاصطناعي يعمل…" }) : aiError ? tt({ fr: "Re-tenter la correction IA", de: "KI-Korrektur erneut versuchen", ar: "إعادة محاولة تصحيح الذكاء الاصطناعي" }) : tt({ fr: "Correction automatique IA", de: "Automatische KI-Korrektur", ar: "تصحيح تلقائي بالذكاء الاصطناعي" })}
              </Button>
              <Button size="sm" variant="default" disabled={aiBusy || !allReady} onClick={() => recomputeAndRelease(active)}>
                <Send className="h-3 w-3 me-1"/>{tt({ fr: "Publier les résultats", de: "Ergebnisse veröffentlichen", ar: "نشر النتائج" })}
              </Button>
            </div>
          </div>
          {aiError && (
            <div className="text-xs p-2 rounded border border-destructive/40 bg-destructive/10 text-destructive">
              ⚠ {tt({ fr: "Correction IA échouée", de: "KI-Korrektur fehlgeschlagen", ar: "فشل التصحيح بالذكاء الاصطناعي" })}: {aiError}. {tt({ fr: "Corrigez chaque question marquée « Échec IA » manuellement, puis publiez.", de: "Korrigieren Sie jede mit «KI fehlgeschlagen» markierte Frage manuell und veröffentlichen Sie dann.", ar: "صحّح يدويًا كل سؤال مُعلَّم « فشل الذكاء الاصطناعي »، ثم انشر." })}
            </div>
          )}
          {!allReady && !aiBusy && (
            <div className="text-xs p-2 rounded border border-amber-500/40 bg-amber-500/10 text-amber-800">
              {tt({ fr: "Publication verrouillée tant que toutes les questions ne sont pas corrigées (IA réussie ou note manuelle).", de: "Veröffentlichung gesperrt, bis alle Fragen korrigiert sind (KI erfolgreich oder manuelle Note).", ar: "النشر مقفل حتى يتم تصحيح جميع الأسئلة (نجاح الذكاء الاصطناعي أو علامة يدوية)." })}
            </div>
          )}

          <div className="space-y-3">
            {questions.map((row, idx) => {
              const q = row.question_bank;
              const a = answers.find((x) => x.question_id === q.id) || {};
              const pts = row.points_override ?? q.points ?? 1;
              const qEvents = events.filter((e) => e.question_id === q.id || e.question_id == null);
              return (
                <AnswerEditor
                  key={q.id}
                  index={idx + 1}
                  q={q}
                  a={a}
                  maxPoints={pts}
                  saving={savingId === a.id}
                  events={qEvents}
                  actorNames={actorNames}
                  retrying={retryingQid === q.id}
                  canRetry={!!a.id && !aiBusy}
                  onRetry={() => retryQuestion(a)}
                  onSave={(score: number, comment: string, ok: boolean) => saveAnswer(a, score, comment, ok)}
                />
              );
            })}
          </div>
        </div>
      )}
    </SchoolLayout>
  );
}

function StatusBadge({ status }: { status?: GradingStatus }) {
  const meta = STATUS_META[status || "pending"];
  const Icon = meta.icon;
  const spin = status === "ai_running";
  return (
    <Badge variant="outline" className={`text-xs ${meta.tone} border-transparent`}>
      <Icon className={`h-3 w-3 me-1 ${spin ? "animate-spin" : ""}`}/>
      {meta.label}
    </Badge>
  );
}

function AnswerEditor({ index, q, a, maxPoints, saving, events, actorNames, retrying, canRetry, onRetry, onSave }: any) {
  const [score, setScore] = useState<string>(a.awarded_points?.toString() ?? "");
  const [comment, setComment] = useState<string>(a.teacher_comment ?? "");
  useEffect(() => {
    setScore(a.awarded_points?.toString() ?? "");
    setComment(a.teacher_comment ?? "");
  }, [a.id, a.awarded_points, a.teacher_comment]);

  const studentAns = a.answer ?? "";
  const correct = q.correct_answer ?? "";
  const status = (a.grading_status || "pending") as GradingStatus;
  const disabled = status === "ai_running";

  const validate = (): { ok: boolean; n: number } => {
    const n = Number(score);
    if (!Number.isFinite(n) || n < 0 || n > maxPoints) return { ok: false, n };
    return { ok: true, n };
  };
  const v = validate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2 flex-wrap">
          <span>Q{index}. {q.prompt_de}</span>
          <div className="flex items-center gap-1 flex-wrap">
            <StatusBadge status={status}/>
            <Badge variant="outline">/{maxPoints}</Badge>
            {a.id && (
              <Button
                size="sm" variant="outline" className="h-6 text-xs"
                disabled={!canRetry || retrying || disabled}
                onClick={onRetry}
                title="Relancer la correction IA pour cette question uniquement"
              >
                {retrying ? <Loader2 className="h-3 w-3 animate-spin me-1"/> : <Sparkles className="h-3 w-3 me-1"/>}
                Re-tenter
              </Button>
            )}
          </div>
        </CardTitle>
        {q.prompt_fr && <CardDescription className="text-xs">{q.prompt_fr}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {disabled && (
          <div className="text-xs p-3 rounded-md border border-blue-500/40 bg-blue-500/10 text-blue-700 flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin"/>
            <span className="font-medium">Correction en cours</span>
            <span className="text-blue-600">— édition désactivée jusqu'à la fin de l'IA.</span>
          </div>
        )}
        {Array.isArray(q.options_de) && q.options_de.length > 0 && (
          <div className="text-xs text-muted-foreground">Options: {q.options_de.join(" · ")}</div>
        )}
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="p-2 rounded border bg-muted/30">
            <div className="text-xs text-muted-foreground">Réponse de l'élève</div>
            <div className="font-mono text-sm whitespace-pre-wrap">{studentAns || <em className="text-muted-foreground">— vide —</em>}</div>
          </div>
          <div className="p-2 rounded border bg-green-500/10 border-green-500/30">
            <div className="text-xs text-muted-foreground">Bonne réponse</div>
            <div className="font-mono text-sm whitespace-pre-wrap">{correct}</div>
            {q.explanation_fr && <div className="text-xs mt-1 text-muted-foreground">{q.explanation_fr}</div>}
          </div>
        </div>
        <div className="grid grid-cols-[110px_1fr_auto] gap-2 items-end">
          <div>
            <Label className="text-xs">Note (0–{maxPoints})</Label>
            <Input
              type="number" min={0} max={maxPoints} step="0.5"
              value={score} disabled={disabled}
              onChange={(e) => setScore(e.target.value)}
              className={!v.ok && score !== "" ? "border-destructive" : ""}
            />
          </div>
          <div>
            <Label className="text-xs">Commentaire / correction</Label>
            <Textarea rows={2} value={comment} disabled={disabled} onChange={(e) => setComment(e.target.value)} />
          </div>
          <Button size="sm" disabled={saving || disabled || !v.ok} onClick={() => {
            const ok = v.n >= maxPoints * 0.5;
            onSave(v.n, comment, ok);
          }}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin me-1"/> : <FileCheck2 className="h-3 w-3 me-1"/>}
            Enregistrer
          </Button>
        </div>
        {!v.ok && score !== "" && (
          <div className="text-xs text-destructive">La note doit être un nombre entre 0 et {maxPoints}.</div>
        )}

        <Collapsible>
          <CollapsibleTrigger className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
            <History className="h-3 w-3"/> Historique de correction ({events.length}) <ChevronDown className="h-3 w-3"/>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {events.length === 0 && <div className="text-xs text-muted-foreground italic">Aucun évènement pour le moment.</div>}
            {events.map((e: any) => (
              <div key={e.id} className="text-xs p-2 rounded border bg-muted/20 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium">{labelEvent(e.kind)} <span className="text-muted-foreground font-normal">· par {actorNames?.[e.actor_id] || (e.actor_role === "teacher" ? "Professeur" : e.actor_role)}</span></div>
                  {e.message && <div className="text-muted-foreground">{e.message}</div>}
                  {(e.awarded_points != null) && <div>Note: <strong>{e.awarded_points}</strong>{e.teacher_comment ? ` — « ${e.teacher_comment} »` : ""}</div>}
                </div>
                <div className="text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function labelEvent(kind: string) {
  switch (kind) {
    case "ai_attempt_start": return "Tentative IA — démarrage";
    case "ai_attempt_success": return "Tentative IA — succès";
    case "ai_attempt_failure": return "Tentative IA — échec";
    case "manual_save": return "Correction manuelle";
    case "reset_pending": return "Remise en attente";
    default: return kind;
  }
}
