import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { STATUS_META, isReady, type GradingStatus } from "@/lib/gradingStatus";
import { useI18n } from "@/lib/i18n";

export default function StudentExamResult() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { tt } = useI18n();
  const [sub, setSub] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase.from("submissions")
        .select("*, assignments(title, level, classes(name))")
        .eq("id", id).single();
      setSub(s);
      if (s?.assignment_id) {
        const { data: aq } = await supabase.from("assignment_questions")
          .select("position, points_override, question_bank(id, kind, prompt_de, prompt_fr, options_de, correct_answer, explanation_fr, points)")
          .eq("assignment_id", s.assignment_id).order("position");
        setQuestions(aq || []);
        const { data: ans } = await supabase.from("submission_answers").select("*").eq("submission_id", id);
        setAnswers(ans || []);
      }
      setLoading(false);
    })();
  }, [id, user?.id]);

  if (loading) return <SchoolLayout title={tt({ fr: "Résultat", de: "Ergebnis", ar: "النتيجة" })}><p className="text-sm text-muted-foreground">{tt({ fr: "Chargement…", de: "Wird geladen…", ar: "جارٍ التحميل…" })}</p></SchoolLayout>;
  if (!sub) return <SchoolLayout title={tt({ fr: "Introuvable", de: "Nicht gefunden", ar: "غير موجود" })}><p>{tt({ fr: "Soumission introuvable.", de: "Abgabe nicht gefunden.", ar: "التسليم غير موجود." })}</p></SchoolLayout>;

  // Hard gate: nothing visible until released_at is set
  if (!sub.released_at) {
    return (
      <SchoolLayout title={sub.assignments?.title || tt({ fr: "Examen", de: "Prüfung", ar: "امتحان" })}>
        <Link to="/student" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-3"><ArrowLeft className="h-3 w-3"/>{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}</Link>
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <Clock className="h-10 w-10 mx-auto text-muted-foreground"/>
            <p className="font-semibold">{tt({ fr: "Correction en cours", de: "Korrektur läuft", ar: "التصحيح جارٍ" })}</p>
            <p className="text-sm text-muted-foreground">{tt({ fr: "Votre professeur n'a pas encore publié les résultats. Revenez plus tard.", de: "Ihr Lehrer hat die Ergebnisse noch nicht veröffentlicht. Bitte später wiederkommen.", ar: "لم ينشر معلّمك النتائج بعد. عُد لاحقًا." })}</p>
          </CardContent>
        </Card>
      </SchoolLayout>
    );
  }

  const score = sub.score ?? 0;
  const total = sub.total ?? 0;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <SchoolLayout
      title={`${tt({ fr: "Résultat", de: "Ergebnis", ar: "النتيجة" })} — ${sub.assignments?.title}`}
      subtitle={`${sub.assignments?.classes?.name || ""} · ${sub.assignments?.level || ""}`}
      breadcrumbs={[{ label: tt({ fr: "Élève", de: "Schüler", ar: "الطالب" }), href: "/student" }, { label: tt({ fr: "Résultat", de: "Ergebnis", ar: "النتيجة" }) }]}
    >
      <Card className="mb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
        <CardContent className="py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground">{tt({ fr: "Note finale", de: "Endnote", ar: "الدرجة النهائية" })}</div>
            <div className="text-3xl font-bold">{score} / {total} <span className="text-xl text-muted-foreground">({pct}%)</span></div>
            {sub.teacher_feedback && <div className="text-sm mt-2 italic">"{sub.teacher_feedback}"</div>}
          </div>
          <Badge className={pct >= 60 ? "bg-green-600" : "bg-destructive"}>
            {pct >= 60 ? tt({ fr: "Réussi", de: "Bestanden", ar: "ناجح" }) : tt({ fr: "À retravailler", de: "Überarbeiten", ar: "يحتاج مراجعة" })}
          </Badge>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {questions.map((row, i) => {
          const q = row.question_bank;
          const a = answers.find((x: any) => x.question_id === q.id);
          const pts = row.points_override ?? q.points ?? 1;
          const status = (a?.grading_status || "pending") as GradingStatus;
          const ready = isReady(status) && a?.awarded_points != null;
          const ok = ready && a?.is_correct === true;
          const wrong = ready && a?.is_correct === false;
          const meta = STATUS_META[status];
          const Icon = meta.icon;

          // Pending / running / failed → show neutral "Correction en cours" block
          if (!ready) {
            return (
              <Card key={q.id} className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/>Q{i + 1}. {q.prompt_de}</span>
                    <Badge variant="outline" className={`text-xs ${meta.tone} border-transparent`}>
                      <Icon className={`h-3 w-3 me-1 ${status === "ai_running" ? "animate-spin" : ""}`}/>
                      {meta.studentLabel}
                    </Badge>
                  </CardTitle>
                  {q.prompt_fr && <CardDescription className="text-xs">{q.prompt_fr}</CardDescription>}
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="p-2 rounded border bg-muted/30">
                    <div className="text-xs text-muted-foreground">{tt({ fr: "Votre réponse", de: "Ihre Antwort", ar: "إجابتك" })}</div>
                    <div className="font-mono text-sm whitespace-pre-wrap">{a?.answer || <em className="text-muted-foreground">{tt({ fr: "— vide —", de: "— leer —", ar: "— فارغ —" })}</em>}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {tt({ fr: "Cette question sera affichée avec la correction dès que votre professeur l'aura validée.", de: "Diese Frage wird mit der Korrektur angezeigt, sobald Ihr Lehrer sie freigegeben hat.", ar: "ستظهر هذه السؤال مع التصحيح بمجرد أن يعتمدها معلّمك." })}
                  </p>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={q.id} className={ok ? "border-green-500/40" : wrong ? "border-destructive/40" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2 flex-wrap">
                  <span className="flex items-center gap-2">
                    {ok ? <CheckCircle2 className="h-4 w-4 text-green-600"/> : wrong ? <XCircle className="h-4 w-4 text-destructive"/> : <Clock className="h-4 w-4 text-muted-foreground"/>}
                    Q{i + 1}. {q.prompt_de}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${meta.tone} border-transparent`}>
                      <Icon className="h-3 w-3 me-1"/>{meta.label}
                    </Badge>
                    <Badge variant="outline">{a?.awarded_points ?? 0} / {pts}</Badge>
                  </div>
                </CardTitle>
                {q.prompt_fr && <CardDescription className="text-xs">{q.prompt_fr}</CardDescription>}
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="grid sm:grid-cols-2 gap-2">
                  <div className={`p-2 rounded border ${wrong ? "bg-destructive/10 border-destructive/30" : "bg-muted/30"}`}>
                    <div className="text-xs text-muted-foreground">{tt({ fr: "Votre réponse", de: "Ihre Antwort", ar: "إجابتك" })}</div>
                    <div className="font-mono text-sm whitespace-pre-wrap">{a?.answer || <em className="text-muted-foreground">{tt({ fr: "— vide —", de: "— leer —", ar: "— فارغ —" })}</em>}</div>
                  </div>
                  <div className="p-2 rounded border bg-green-500/10 border-green-500/30">
                    <div className="text-xs text-muted-foreground">{tt({ fr: "Bonne réponse", de: "Richtige Antwort", ar: "الإجابة الصحيحة" })}</div>
                    <div className="font-mono text-sm whitespace-pre-wrap">{q.correct_answer}</div>
                  </div>
                </div>
                {(a?.teacher_comment || q.explanation_fr) && (
                  <div className="p-2 rounded bg-primary/5 border border-primary/20 text-xs space-y-1">
                    {a?.teacher_comment && <div><strong>{tt({ fr: "Commentaire", de: "Kommentar", ar: "تعليق" })} :</strong> {a.teacher_comment}</div>}
                    {q.explanation_fr && <div><strong>{tt({ fr: "Explication", de: "Erklärung", ar: "شرح" })} :</strong> {q.explanation_fr}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </SchoolLayout>
  );
}
