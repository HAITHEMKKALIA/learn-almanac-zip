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
import { Paperclip, Send, CheckCircle2, Calendar as CalIcon, Mic, Square } from "lucide-react";
import { toast } from "sonner";

const catLabel = (c: string, tt: any) => ({
  schreiben: tt({ fr: "Écrit", de: "Schreiben", ar: "كتابة" }),
  sprechen: tt({ fr: "Oral", de: "Sprechen", ar: "محادثة" }),
  grammatik: tt({ fr: "Grammaire", de: "Grammatik", ar: "قواعد" }),
  lesen: tt({ fr: "Lecture", de: "Lesen", ar: "قراءة" }),
  hoeren: tt({ fr: "Écoute", de: "Hören", ar: "استماع" }),
  wortschatz: tt({ fr: "Vocabulaire", de: "Wortschatz", ar: "مفردات" }),
  sonstige: tt({ fr: "Autre", de: "Sonstige", ar: "أخرى" }),
}[c] || c);

export default function StudentHomework() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: hw } = await supabase
      .from("homework")
      .select("*, classes(name)")
      .order("due_at", { ascending: true, nullsFirst: false });
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

  const openHw = (h: any) => {
    setActive(h);
    setContent(h.mySubmission?.content || "");
    setFile(null); setAudioBlob(null);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      r.start();
      setRecorder(r); setRecording(true);
    } catch { toast.error(tt({ fr: "Micro indisponible", de: "Mikrofon nicht verfügbar", ar: "الميكروفون غير متاح" })); }
  };
  const stopRec = () => { recorder?.stop(); setRecording(false); };

  const submit = async () => {
    if (!user || !active) return;
    if (!content.trim() && !file && !audioBlob) {
      toast.error(tt({ fr: "Ajoutez du contenu", de: "Inhalt hinzufügen", ar: "أضف محتوى" }));
      return;
    }
    setSubmitting(true);
    try {
      let attachment_url = active.mySubmission?.attachment_url || null;
      let attachment_name = active.mySubmission?.attachment_name || null;
      let audio_url = active.mySubmission?.audio_url || null;
      if (file) {
        const path = `${user.id}/hw/${active.id}/${Date.now()}-${file.name}`;
        const up = await supabase.storage.from("chat-attachments").upload(path, file);
        if (up.error) throw up.error;
        attachment_url = supabase.storage.from("chat-attachments").getPublicUrl(path).data.publicUrl;
        attachment_name = file.name;
      }
      if (audioBlob) {
        const path = `${user.id}/hw/${active.id}/${Date.now()}.webm`;
        const up = await supabase.storage.from("chat-attachments").upload(path, audioBlob, { contentType: "audio/webm" });
        if (up.error) throw up.error;
        audio_url = supabase.storage.from("chat-attachments").getPublicUrl(path).data.publicUrl;
      }
      const payload: any = {
        homework_id: active.id,
        student_id: user.id,
        content: content || null,
        attachment_url, attachment_name, audio_url,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      };
      const { error } = active.mySubmission
        ? await supabase.from("homework_submissions").update(payload).eq("id", active.mySubmission.id)
        : await supabase.from("homework_submissions").insert(payload);
      if (error) throw error;
      toast.success(tt({ fr: "Envoyé !", de: "Gesendet!", ar: "تم الإرسال!" }));
      setActive(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally { setSubmitting(false); }
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Hausaufgaben", de: "Hausaufgaben", ar: "الواجبات المنزلية" })}
      subtitle={tt({ fr: "Vos exercices à rendre", de: "Ihre Aufgaben zum Einreichen", ar: "تماريني للتسليم" })}
      breadcrumbs={[{ label: tt({ fr: "Élève", de: "Schüler", ar: "تلميذ" }), href: "/student" }, { label: "Hausaufgaben" }]}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          {tt({ fr: "Aucune Hausaufgabe pour l'instant.", de: "Noch keine Hausaufgaben.", ar: "لا توجد واجبات حالياً." })}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((h) => {
            const s = h.mySubmission;
            return (
              <Card key={h.id} className="cursor-pointer hover:shadow-md transition" onClick={() => openHw(h)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{h.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">{catLabel(h.category, tt)}</Badge>
                        {h.level && <Badge variant="secondary">{h.level}</Badge>}
                        {h.due_at && (
                          <Badge variant="outline">
                            <CalIcon className="h-3 w-3 me-1" />
                            {new Date(h.due_at).toLocaleString()}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    {s?.status === "graded" ? (
                      <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 me-1" />{s.score}/{h.max_points}</Badge>
                    ) : s ? (
                      <Badge variant="default">{tt({ fr: "Envoyé", de: "Gesendet", ar: "أُرسل" })}</Badge>
                    ) : (
                      <Badge variant="destructive">{tt({ fr: "À faire", de: "Zu erledigen", ar: "للإنجاز" })}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {h.instructions && <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{h.instructions}</p>}
                  {s?.teacher_feedback && (
                    <div className="mt-2 text-xs p-2 rounded bg-primary/5 border border-primary/20">
                      <strong>{tt({ fr: "Commentaire prof", de: "Lehrerkommentar", ar: "تعليق الأستاذ" })}:</strong> {s.teacher_feedback}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{catLabel(active.category, tt)}</Badge>
                {active.level && <Badge variant="secondary">{active.level}</Badge>}
                {active.due_at && <Badge variant="outline"><CalIcon className="h-3 w-3 me-1" />{new Date(active.due_at).toLocaleString()}</Badge>}
                <Badge>{active.max_points} pts</Badge>
              </div>
              {active.instructions && (
                <div className="p-3 rounded bg-muted/40 border text-sm whitespace-pre-wrap">{active.instructions}</div>
              )}
              {active.mySubmission?.status === "graded" ? (
                <div className="p-3 rounded bg-green-500/10 border border-green-500/30">
                  <div className="font-semibold">{tt({ fr: "Note", de: "Note", ar: "العلامة" })}: {active.mySubmission.score}/{active.max_points}</div>
                  {active.mySubmission.teacher_feedback && <div className="text-sm mt-1">{active.mySubmission.teacher_feedback}</div>}
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium">{tt({ fr: "Votre réponse", de: "Ihre Antwort", ar: "إجابتك" })}</label>
                    <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">{tt({ fr: "Fichier", de: "Datei", ar: "ملف" })}</label>
                      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs w-full" />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">{tt({ fr: "Audio (Sprechen)", de: "Audio (Sprechen)", ar: "صوت (محادثة)" })}</label>
                      {!recording ? (
                        <Button type="button" size="sm" variant="outline" onClick={startRec}><Mic className="h-3 w-3 me-1" />{tt({ fr: "Enregistrer", de: "Aufnehmen", ar: "تسجيل" })}</Button>
                      ) : (
                        <Button type="button" size="sm" variant="destructive" onClick={stopRec}><Square className="h-3 w-3 me-1" />{tt({ fr: "Stop", de: "Stop", ar: "إيقاف" })}</Button>
                      )}
                      {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-8 mt-1" />}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {active?.mySubmission?.status !== "graded" && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActive(null)}>{tt({ fr: "Fermer", de: "Schließen", ar: "إغلاق" })}</Button>
              <Button onClick={submit} disabled={submitting}>
                <Send className="h-3 w-3 me-1" />
                {active?.mySubmission ? tt({ fr: "Mettre à jour", de: "Aktualisieren", ar: "تحديث" }) : tt({ fr: "Envoyer", de: "Senden", ar: "إرسال" })}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
