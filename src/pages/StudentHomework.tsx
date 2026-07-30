import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Send, CheckCircle2, XCircle, Calendar as CalIcon, Mic, Square, FileText, Music, ListChecks, Upload, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/lib/notify";

const catLabel = (c: string, tt: any) => ({
  schreiben: tt({ fr: "Écrit", de: "Schreiben", ar: "كتابة" }),
  sprechen: tt({ fr: "Oral", de: "Sprechen", ar: "محادثة" }),
  grammatik: tt({ fr: "Grammaire", de: "Grammatik", ar: "قواعد" }),
  lesen: tt({ fr: "Lecture", de: "Lesen", ar: "قراءة" }),
  hoeren: tt({ fr: "Écoute", de: "Hören", ar: "استماع" }),
  wortschatz: tt({ fr: "Vocabulaire", de: "Wortschatz", ar: "مفردات" }),
  sonstige: tt({ fr: "Autre", de: "Sonstige", ar: "أخرى" }),
}[c] || c);

const kindIcon = (k: string) => (k === "pdf" ? FileText : k === "audio" ? Music : ListChecks);

export default function StudentHomework() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answersById, setAnswersById] = useState<Record<string, any>>({});
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: hw } = await supabase.from("homework").select("*, classes(name, teacher_id)").order("due_at", { ascending: true, nullsFirst: false });
    const ids = (hw || []).map((h: any) => h.id);
    const { data: subs } = ids.length
      ? await supabase.from("homework_submissions").select("*").eq("student_id", user.id).in("homework_id", ids)
      : { data: [] as any[] };
    const subMap: Record<string, any> = {};
    (subs || []).forEach((s: any) => { subMap[s.homework_id] = s; });
    setItems((hw || []).map((h: any) => ({ ...h, mySubmission: subMap[h.id] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  // Realtime sync with teacher: refresh when homework or my submissions change
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("student-homework-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "homework" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "homework_submissions", filter: `student_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const openHw = async (h: any) => {
    setActive(h); setContent(h.mySubmission?.content || ""); setFile(null); setAudioBlob(null);
    const { data: qs } = await supabase.from("homework_questions").select("*").eq("homework_id", h.id).order("position");
    setQuestions(qs || []);
    if (h.mySubmission) {
      const { data: ans } = await supabase.from("homework_question_answers").select("*").eq("submission_id", h.mySubmission.id);
      const m: Record<string, any> = {};
      (ans || []).forEach((a: any) => { m[a.question_id] = a; });
      setAnswersById(m);
    } else setAnswersById({});
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => { setAudioBlob(new Blob(chunks, { type: "audio/webm" })); stream.getTracks().forEach((t) => t.stop()); };
      r.start(); setRecorder(r); setRecording(true);
    } catch { toast.error(tt({ fr: "Micro indisponible", de: "Mikrofon nicht verfügbar", ar: "الميكروفون غير متاح" })); }
  };
  const stopRec = () => { recorder?.stop(); setRecording(false); };

  const submit = async () => {
    if (!user || !active) return;
    const hasAnswers = questions.length > 0 && questions.some((q) => (answersById[q.id]?.answer || "").trim());
    if (!hasAnswers && !content.trim() && !file && !audioBlob) {
      toast.error(tt({ fr: "Répondez à au moins une question", de: "Beantworten Sie mindestens eine Frage", ar: "أجب على سؤال واحد على الأقل" })); return;
    }
    setSubmitting(true);
    try {
      let attachment_url = active.mySubmission?.attachment_url || null;
      let attachment_name = active.mySubmission?.attachment_name || null;
      let audio_url = active.mySubmission?.audio_url || null;
      if (file) {
        const path = `${user.id}/hw/${active.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
        const up = await supabase.storage.from("homework-files").upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        const signed = await supabase.storage.from("homework-files").createSignedUrl(path, 60 * 60 * 24 * 365);
        attachment_url = signed.data?.signedUrl || null; attachment_name = file.name;
      }
      if (audioBlob) {
        const path = `${user.id}/hw/${active.id}/${Date.now()}.webm`;
        const up = await supabase.storage.from("homework-files").upload(path, audioBlob, { contentType: "audio/webm" });
        if (up.error) throw up.error;
        const signed = await supabase.storage.from("homework-files").createSignedUrl(path, 60 * 60 * 24 * 365);
        audio_url = signed.data?.signedUrl || null;
      }
      const payload: any = {
        homework_id: active.id, student_id: user.id, content: content || null,
        attachment_url, attachment_name, audio_url,
        status: "submitted", submitted_at: new Date().toISOString(),
      };
      // Upsert on (homework_id, student_id) so a re-submit or a row created on
      // another device never fails with a duplicate-key error.
      const { data: upserted, error: upErr } = await supabase
        .from("homework_submissions")
        .upsert(payload, { onConflict: "homework_id,student_id" })
        .select()
        .single();
      if (upErr) throw upErr;
      const submissionId = upserted.id;


      // Persist per-question answers
      if (questions.length > 0) {
        await supabase.from("homework_question_answers").delete().eq("submission_id", submissionId);
        const rows = questions
          .filter((q) => (answersById[q.id]?.answer || "").trim())
          .map((q) => ({ submission_id: submissionId, question_id: q.id, answer: answersById[q.id].answer }));
        if (rows.length) {
          const ins = await supabase.from("homework_question_answers").insert(rows);
          if (ins.error) throw ins.error;
        }
      }

      // Notify teacher
      if (active.teacher_id) {
        await notify({
          user_id: active.teacher_id, type: "homework.submitted",
          title: tt({ fr: "Devoir rendu", de: "Hausaufgabe abgegeben", ar: "تم تسليم واجب" }),
          body: active.title, link: "/teacher/homework",
        });
      }
      toast.success(tt({ fr: "Envoyé !", de: "Gesendet!", ar: "تم الإرسال!" }));
      setActive(null); load();
    } catch (e: any) { toast.error(e.message || "Error"); }
    finally { setSubmitting(false); }
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Mes devoirs à la maison", de: "Meine Hausaufgaben", ar: "واجباتي المنزلية" })}
      subtitle={tt({ fr: "Exercices à rendre et corrections", de: "Aufgaben und Korrekturen", ar: "التمارين والتصحيحات" })}
      breadcrumbs={[{ label: tt({ fr: "Élève", de: "Schüler", ar: "تلميذ" }), href: "/student" }, { label: "Hausaufgaben" }]}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          {tt({ fr: "Aucun devoir pour l'instant.", de: "Noch keine Hausaufgaben.", ar: "لا توجد واجبات حالياً." })}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((h) => {
            const s = h.mySubmission;
            const Ico = kindIcon(h.kind);
            return (
              <Card key={h.id} className="cursor-pointer hover:shadow-md transition" onClick={() => openHw(h)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2"><Ico className="h-4 w-4 text-primary" />{h.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">{catLabel(h.category, tt)}</Badge>
                        {h.level && <Badge variant="secondary">{h.level}</Badge>}
                        {h.due_at && <Badge variant="outline"><CalIcon className="h-3 w-3 me-1" />{new Date(h.due_at).toLocaleString()}</Badge>}
                      </CardDescription>
                    </div>
                    {s?.status === "graded" ? (
                      <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 me-1" />{s.score}/{h.max_points}</Badge>
                    ) : s?.status === "submitted" ? (
                      <Badge className="bg-orange-500">{tt({ fr: "En attente", de: "Wartet", ar: "بانتظار" })}</Badge>
                    ) : (
                      <Badge variant="destructive">{tt({ fr: "À faire", de: "Zu erledigen", ar: "للإنجاز" })}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {h.instructions && <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{h.instructions}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle>{active?.title}</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{catLabel(active.category, tt)}</Badge>
                {active.level && <Badge variant="secondary">{active.level}</Badge>}
                {active.due_at && <Badge variant="outline"><CalIcon className="h-3 w-3 me-1" />{new Date(active.due_at).toLocaleString()}</Badge>}
                <Badge>{active.max_points} pts</Badge>
              </div>
              {active.instructions && <div className="p-3 rounded bg-muted/40 border text-sm whitespace-pre-wrap">{active.instructions}</div>}

              {active.pdf_url && (
                <a href={active.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline">
                  <Download className="h-4 w-4" />{tt({ fr: "Télécharger le PDF de l'exercice", de: "PDF herunterladen", ar: "تنزيل ملف PDF" })}
                </a>
              )}
              {active.audio_url && (
                <div>
                  <div className="text-xs font-medium mb-1 flex items-center gap-1"><Music className="h-3 w-3" />{tt({ fr: "Écoutez l'audio", de: "Audio anhören", ar: "استمع للصوت" })}</div>
                  <audio controls src={active.audio_url} className="w-full h-9" />
                </div>
              )}

              {active.mySubmission?.status === "graded" ? (
                <GradedView sub={active.mySubmission} questions={questions} answersById={answersById} max={active.max_points} tt={tt} />
              ) : (
                <>
                  {/* Per-question answers */}
                  {questions.length > 0 && (
                    <div className="space-y-2">
                      {questions.map((q, i) => (
                        <div key={q.id} className="p-2 border rounded">
                          <div className="text-sm font-semibold">Q{i + 1}. {q.prompt} <span className="text-muted-foreground font-normal text-xs">({q.points} pts)</span></div>
                          <Textarea rows={2} className="mt-1" placeholder={tt({ fr: "Votre réponse…", de: "Ihre Antwort…", ar: "إجابتك…" })}
                            value={answersById[q.id]?.answer || ""}
                            onChange={(e) => setAnswersById({ ...answersById, [q.id]: { ...(answersById[q.id] || {}), answer: e.target.value } })} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PDF return upload */}
                  {active.kind === "pdf" && (
                    <div className="p-3 border rounded space-y-2">
                      <div className="text-xs font-medium flex items-center gap-1"><Upload className="h-3 w-3" />{tt({ fr: "Rendre votre PDF/photo rempli", de: "Ausgefülltes PDF/Foto hochladen", ar: "إرسال ملف PDF/صورة معبأ" })}</div>
                      <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs w-full" />
                      {file && <div className="text-xs text-muted-foreground">{file.name}</div>}
                    </div>
                  )}

                  {/* Free-form text (only if no questions and no PDF-kind) */}
                  {questions.length === 0 && active.kind !== "pdf" && (
                    <div>
                      <label className="text-xs font-medium">{tt({ fr: "Votre réponse", de: "Ihre Antwort", ar: "إجابتك" })}</label>
                      <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
                    </div>
                  )}

                  {/* Optional audio recording (always allowed) */}
                  <div className="p-2 border rounded">
                    <label className="text-xs font-medium block mb-1">{tt({ fr: "Audio (facultatif)", de: "Audio (optional)", ar: "صوت (اختياري)" })}</label>
                    {!recording ? (
                      <Button type="button" size="sm" variant="outline" onClick={startRec}><Mic className="h-3 w-3 me-1" />{tt({ fr: "Enregistrer", de: "Aufnehmen", ar: "تسجيل" })}</Button>
                    ) : (
                      <Button type="button" size="sm" variant="destructive" onClick={stopRec}><Square className="h-3 w-3 me-1" />{tt({ fr: "Stop", de: "Stop", ar: "إيقاف" })}</Button>
                    )}
                    {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-8 mt-1" />}
                  </div>
                </>
              )}
            </div>
          )}
          {active?.mySubmission?.status !== "graded" && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActive(null)}>{tt({ fr: "Fermer", de: "Schließen", ar: "إغلاق" })}</Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <Send className="h-3 w-3 me-1" />}
                {tt({ fr: "Terminer & envoyer", de: "Fertig & senden", ar: "إنهاء وإرسال" })}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}

function GradedView({ sub, questions, answersById, max, tt }: any) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded bg-green-500/10 border border-green-500/30">
        <div className="font-semibold">{tt({ fr: "Note finale", de: "Endnote", ar: "العلامة النهائية" })}: {sub.score}/{max}</div>
        {sub.teacher_feedback && <div className="text-sm mt-1 whitespace-pre-wrap">{sub.teacher_feedback}</div>}
      </div>
      {questions.map((q: any, i: number) => {
        const a = answersById[q.id];
        return (
          <div key={q.id} className={`p-2 border rounded ${a?.is_correct === true ? "border-green-500/50 bg-green-500/5" : a?.is_correct === false ? "border-red-500/50 bg-red-500/5" : ""}`}>
            <div className="text-sm font-semibold flex items-center gap-2">
              {a?.is_correct === true ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : a?.is_correct === false ? <XCircle className="h-4 w-4 text-red-600" /> : null}
              Q{i + 1}. {q.prompt}
              <span className="ms-auto text-xs">{a?.awarded_points ?? 0}/{q.points} pts</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{tt({ fr: "Votre réponse", de: "Ihre Antwort", ar: "إجابتك" })}:</div>
            <div className="text-sm whitespace-pre-wrap">{a?.answer || "—"}</div>
            {q.expected_answer && (
              <>
                <div className="text-xs text-muted-foreground mt-1">💡 {tt({ fr: "Réponse attendue", de: "Erwartete Antwort", ar: "الإجابة المتوقعة" })}:</div>
                <div className="text-sm">{q.expected_answer}</div>
              </>
            )}
            {a?.teacher_comment && <div className="text-xs mt-1 p-1 rounded bg-primary/5">💬 {a.teacher_comment}</div>}
          </div>
        );
      })}
    </div>
  );
}
