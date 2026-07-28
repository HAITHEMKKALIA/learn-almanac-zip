import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Eye, Calendar as CalIcon, Sparkles, Loader2,
  Upload, FileText, Music, ListChecks, ArrowUp, ArrowDown, X, CheckCircle2, XCircle, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/lib/notify";

const CATEGORIES = ["schreiben", "sprechen", "grammatik", "lesen", "hoeren", "wortschatz", "sonstige"] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
const KINDS = [
  { value: "manual", labelFr: "Manuel (questions)", labelDe: "Manuell (Fragen)", labelAr: "يدوي (أسئلة)", icon: ListChecks },
  { value: "ai", labelFr: "Généré par IA", labelDe: "Von KI generiert", labelAr: "بالذكاء الاصطناعي", icon: Sparkles },
  { value: "pdf", labelFr: "Fichier PDF", labelDe: "PDF-Datei", labelAr: "ملف PDF", icon: FileText },
  { value: "audio", labelFr: "Fichier audio", labelDe: "Audio-Datei", labelAr: "ملف صوتي", icon: Music },
] as const;

const catLabel = (c: string, tt: any) => ({
  schreiben: tt({ fr: "Écrit", de: "Schreiben", ar: "كتابة" }),
  sprechen: tt({ fr: "Oral", de: "Sprechen", ar: "محادثة" }),
  grammatik: tt({ fr: "Grammaire", de: "Grammatik", ar: "قواعد" }),
  lesen: tt({ fr: "Lecture", de: "Lesen", ar: "قراءة" }),
  hoeren: tt({ fr: "Écoute", de: "Hören", ar: "استماع" }),
  wortschatz: tt({ fr: "Vocabulaire", de: "Wortschatz", ar: "مفردات" }),
  sonstige: tt({ fr: "Autre", de: "Sonstige", ar: "أخرى" }),
}[c] || c);

type Q = { id?: string; position: number; prompt: string; expected_answer: string; points: number };

export default function TeacherHomework() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewSubsFor, setViewSubsFor] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const pdfRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [h, c] = await Promise.all([
      supabase.from("homework").select("*, classes(name), homework_submissions(id, status, student_id)").order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name, level"),
    ]);
    if (h.error) toast.error(h.error.message);
    setItems(h.data || []);
    setClasses(c.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Realtime: refresh list when submissions arrive from students
  useEffect(() => {
    const ch = supabase
      .channel("teacher-homework-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "homework_submissions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "homework" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const startNew = () => {
    setEdit({
      title: "", instructions: "", category: "schreiben",
      level: classes[0]?.level || "A1", class_id: classes[0]?.id || "",
      due_at: "", max_points: 20, status: "open", kind: "manual",
    });
    setQuestions([]); setPdfFile(null); setAudioFile(null); setOpen(true);
  };

  const startEdit = async (h: any) => {
    setEdit({ ...h, due_at: h.due_at ? h.due_at.slice(0, 16) : "" });
    const { data: qs } = await supabase.from("homework_questions").select("*").eq("homework_id", h.id).order("position");
    setQuestions((qs || []).map((q: any) => ({ id: q.id, position: q.position, prompt: q.prompt, expected_answer: q.expected_answer || "", points: q.points })));
    setPdfFile(null); setAudioFile(null); setOpen(true);
  };

  const uploadFile = async (file: File, subdir: string) => {
    const path = `${user!.id}/${subdir}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const up = await supabase.storage.from("homework-files").upload(path, file, { contentType: file.type });
    if (up.error) throw up.error;
    const signed = await supabase.storage.from("homework-files").createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed.data?.signedUrl || null;
  };

  const addQuestion = () => {
    if (questions.length >= 50) { toast.error(tt({ fr: "50 questions max", de: "Max. 50 Fragen", ar: "الحد الأقصى 50 سؤالاً" })); return; }
    setQuestions([...questions, { position: questions.length + 1, prompt: "", expected_answer: "", points: 1 }]);
  };
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, k) => k !== i).map((q, k) => ({ ...q, position: k + 1 })));
  const moveQuestion = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= questions.length) return;
    const next = [...questions]; [next[i], next[j]] = [next[j], next[i]];
    setQuestions(next.map((q, k) => ({ ...q, position: k + 1 })));
  };
  const updateQ = (i: number, patch: Partial<Q>) => setQuestions(questions.map((q, k) => (k === i ? { ...q, ...patch } : q)));

  const aiGenerateQuestions = async () => {
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-pedagogy", {
        body: { mode: "homework_questions", level: edit.level, category: edit.category, title: edit.title, hint: edit.instructions, count: Math.min(15, 50 - questions.length) },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const gen = (data as any).questions || [];
      const merged = [...questions, ...gen.map((g: any, i: number) => ({
        position: questions.length + i + 1, prompt: g.prompt, expected_answer: g.expected_answer, points: g.points || 1,
      }))].slice(0, 50);
      setQuestions(merged);
      if (!edit.title && (data as any).title) setEdit({ ...edit, title: (data as any).title });
      toast.success(tt({ fr: `✨ ${gen.length} questions générées`, de: `✨ ${gen.length} Fragen generiert`, ar: `✨ تم توليد ${gen.length} سؤالاً` }));
    } catch (e: any) { toast.error(e.message || "Erreur IA"); }
    finally { setAiBusy(false); }
  };

  const save = async () => {
    if (!user || !edit?.title?.trim() || !edit?.class_id) {
      toast.error(tt({ fr: "Titre et classe requis", de: "Titel und Klasse erforderlich", ar: "العنوان والصف مطلوبان" }));
      return;
    }
    if (edit.kind === "pdf" && !pdfFile && !edit.pdf_url) { toast.error(tt({ fr: "Ajoutez un PDF", de: "PDF hinzufügen", ar: "أضف ملف PDF" })); return; }
    if (edit.kind === "audio" && !audioFile && !edit.audio_url) { toast.error(tt({ fr: "Ajoutez un audio", de: "Audio hinzufügen", ar: "أضف ملفاً صوتياً" })); return; }
    if ((edit.kind === "manual" || edit.kind === "ai" || edit.kind === "audio") && questions.length === 0 && edit.kind !== "audio") {
      toast.error(tt({ fr: "Ajoutez au moins une question", de: "Mindestens eine Frage", ar: "أضف سؤالاً واحداً على الأقل" })); return;
    }
    setSaving(true);
    try {
      let pdf_url = edit.pdf_url || null;
      let audio_url = edit.audio_url || null;
      if (pdfFile) pdf_url = await uploadFile(pdfFile, `hw/${edit.id || "new"}/pdf`);
      if (audioFile) audio_url = await uploadFile(audioFile, `hw/${edit.id || "new"}/audio`);

      const payload: any = {
        teacher_id: user.id, class_id: edit.class_id, title: edit.title,
        instructions: edit.instructions || null, category: edit.category, level: edit.level || null,
        due_at: edit.due_at ? new Date(edit.due_at).toISOString() : null,
        max_points: questions.length ? questions.reduce((s, q) => s + q.points, 0) : Number(edit.max_points) || 20,
        status: edit.status || "open", kind: edit.kind, pdf_url, audio_url,
      };
      const res = edit.id
        ? await supabase.from("homework").update(payload).eq("id", edit.id).select().single()
        : await supabase.from("homework").insert(payload).select().single();
      if (res.error) throw res.error;
      const hwId = res.data.id;

      // Sync questions
      if (edit.id) await supabase.from("homework_questions").delete().eq("homework_id", hwId);
      if (questions.length) {
        const rows = questions.map((q, i) => ({
          homework_id: hwId, position: i + 1, prompt: q.prompt || `Question ${i + 1}`,
          expected_answer: q.expected_answer || null, points: q.points || 1,
        }));
        const ins = await supabase.from("homework_questions").insert(rows);
        if (ins.error) throw ins.error;
      }

      // Notify students of the class
      if (edit.status === "open") {
        const { data: members } = await supabase.from("class_members").select("student_id").eq("class_id", edit.class_id);
        await notify((members || []).map((m: any) => ({
          user_id: m.student_id, type: "homework.new",
          title: tt({ fr: "Nouveau devoir", de: "Neue Hausaufgabe", ar: "واجب جديد" }),
          body: edit.title, link: "/student/homework",
        })));
      }

      toast.success(tt({ fr: "Enregistré", de: "Gespeichert", ar: "تم الحفظ" }));
      setOpen(false); setEdit(null); load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm(tt({ fr: "Supprimer ?", de: "Löschen?", ar: "حذف؟" }))) return;
    const { error } = await supabase.from("homework").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(tt({ fr: "Supprimé", de: "Gelöscht", ar: "تم الحذف" }));
    load();
  };

  const openSubs = async (h: any) => {
    setViewSubsFor(h);
    const { data: subData } = await supabase.from("homework_submissions").select("*").eq("homework_id", h.id).order("submitted_at", { ascending: false });
    if (!subData) { setSubs([]); return; }
    const ids = subData.map((s: any) => s.student_id);
    const [{ data: profs }, { data: qs }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email").in("user_id", ids),
      supabase.from("homework_questions").select("*").eq("homework_id", h.id).order("position"),
    ]);
    const byId: Record<string, any> = {};
    (profs || []).forEach((p: any) => { byId[p.user_id] = p; });
    const subIds = subData.map((s: any) => s.id);
    const { data: answers } = subIds.length
      ? await supabase.from("homework_question_answers").select("*").in("submission_id", subIds)
      : { data: [] as any[] };
    const ansBySub: Record<string, any[]> = {};
    (answers || []).forEach((a: any) => { (ansBySub[a.submission_id] ||= []).push(a); });
    setSubs(subData.map((s: any) => ({ ...s, profile: byId[s.student_id], answers: ansBySub[s.id] || [], allQuestions: qs || [] })));
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Devoirs à la maison", de: "Hausaufgaben", ar: "الواجبات المنزلية" })}
      subtitle={tt({ fr: "PDF, audio, questions manuelles ou IA", de: "PDF, Audio, manuelle oder KI-Fragen", ar: "PDF، صوت، أسئلة يدوية أو AI" })}
      breadcrumbs={[{ label: tt({ fr: "Professeur", de: "Lehrer", ar: "أستاذ" }), href: "/teacher" }, { label: "Hausaufgaben" }]}
      actions={<Button onClick={startNew}><Plus className="h-4 w-4 me-2" />{tt({ fr: "Nouveau devoir", de: "Neue Hausaufgabe", ar: "واجب جديد" })}</Button>}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">{tt({ fr: "Aucun devoir.", de: "Keine Hausaufgaben.", ar: "لا توجد واجبات." })}</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((h) => {
            const total = h.homework_submissions?.length || 0;
            const graded = h.homework_submissions?.filter((s: any) => s.status === "graded").length || 0;
            const pending = h.homework_submissions?.filter((s: any) => s.status === "submitted").length || 0;
            const KindIcon = KINDS.find((k) => k.value === h.kind)?.icon || ListChecks;
            return (
              <Card key={h.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2"><KindIcon className="h-4 w-4 text-primary" />{h.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">{catLabel(h.category, tt)}</Badge>
                        {h.level && <Badge variant="secondary">{h.level}</Badge>}
                        <Badge>{h.classes?.name}</Badge>
                        {h.due_at && <Badge variant="outline"><CalIcon className="h-3 w-3 me-1" />{new Date(h.due_at).toLocaleString()}</Badge>}
                      </CardDescription>
                    </div>
                    <Badge variant={h.status === "open" ? "default" : "outline"}>{h.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {tt({ fr: "Soumissions", de: "Abgaben", ar: "إرساليات" })}: <strong>{total}</strong> ·{" "}
                    {tt({ fr: "À corriger", de: "Zu korrigieren", ar: "بانتظار التصحيح" })}: <strong className="text-orange-600">{pending}</strong> ·{" "}
                    {tt({ fr: "Notées", de: "Bewertet", ar: "مقيّم" })}: <strong className="text-green-600">{graded}</strong>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openSubs(h)}><Eye className="h-3 w-3 me-1" />{tt({ fr: "Corriger", de: "Korrigieren", ar: "تصحيح" })}</Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(h)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(h.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[calc(100vw-1rem)] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{edit?.id ? tt({ fr: "Modifier", de: "Bearbeiten", ar: "تعديل" }) : tt({ fr: "Nouveau devoir", de: "Neue Hausaufgabe", ar: "واجب جديد" })}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="grid gap-3">
              <div>
                <Label>{tt({ fr: "Type de devoir", de: "Aufgabentyp", ar: "نوع الواجب" })}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                  {KINDS.map((k) => {
                    const Ico = k.icon;
                    const active = edit.kind === k.value;
                    return (
                      <button key={k.value} type="button" onClick={() => setEdit({ ...edit, kind: k.value })}
                        className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition ${active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-muted"}`}>
                        <Ico className="h-5 w-5" />
                        <span>{tt({ fr: k.labelFr, de: k.labelDe, ar: k.labelAr })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <Label>{tt({ fr: "Titre", de: "Titel", ar: "العنوان" })}</Label>
                  <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
                </div>
                <div>
                  <Label>{tt({ fr: "Classe", de: "Klasse", ar: "الصف" })}</Label>
                  <Select value={edit.class_id} onValueChange={(v) => setEdit({ ...edit, class_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label>{tt({ fr: "Catégorie", de: "Kategorie", ar: "الفئة" })}</Label>
                  <Select value={edit.category} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{catLabel(c, tt)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })}</Label>
                  <Select value={edit.level || "A1"} onValueChange={(v) => setEdit({ ...edit, level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{tt({ fr: "Date limite", de: "Abgabefrist", ar: "تاريخ التسليم" })}</Label>
                  <Input type="datetime-local" value={edit.due_at || ""} onChange={(e) => setEdit({ ...edit, due_at: e.target.value })} />
                </div>
                <div>
                  <Label>{tt({ fr: "Statut", de: "Status", ar: "الحالة" })}</Label>
                  <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{tt({ fr: "Ouvert", de: "Offen", ar: "مفتوح" })}</SelectItem>
                      <SelectItem value="closed">{tt({ fr: "Fermé", de: "Geschlossen", ar: "مغلق" })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{tt({ fr: "Consignes (facultatif)", de: "Anweisungen (optional)", ar: "التعليمات (اختياري)" })}</Label>
                <Textarea rows={3} value={edit.instructions || ""} onChange={(e) => setEdit({ ...edit, instructions: e.target.value })} />
              </div>

              {edit.kind === "pdf" && (
                <div className="p-3 border rounded-lg space-y-2">
                  <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />{tt({ fr: "Fichier PDF de l'exercice", de: "PDF der Aufgabe", ar: "ملف PDF للتمرين" })}</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => pdfRef.current?.click()}><Upload className="h-3 w-3 me-1" />{pdfFile ? tt({ fr: "Changer", de: "Ändern", ar: "تغيير" }) : tt({ fr: "Choisir PDF", de: "PDF wählen", ar: "اختيار PDF" })}</Button>
                    {(pdfFile || edit.pdf_url) && <span className="text-xs truncate">{pdfFile?.name || tt({ fr: "PDF actuel", de: "Aktuelles PDF", ar: "PDF الحالي" })}</span>}
                    <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              )}

              {edit.kind === "audio" && (
                <div className="p-3 border rounded-lg space-y-2">
                  <Label className="flex items-center gap-2"><Music className="h-4 w-4" />{tt({ fr: "Fichier audio", de: "Audio-Datei", ar: "ملف صوتي" })}</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => audioRef.current?.click()}><Upload className="h-3 w-3 me-1" />{audioFile ? tt({ fr: "Changer", de: "Ändern", ar: "تغيير" }) : tt({ fr: "Choisir audio", de: "Audio wählen", ar: "اختيار صوت" })}</Button>
                    {(audioFile || edit.audio_url) && <span className="text-xs truncate">{audioFile?.name || tt({ fr: "Audio actuel", de: "Aktuelles Audio", ar: "الصوت الحالي" })}</span>}
                    <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              )}

              {(edit.kind === "manual" || edit.kind === "ai" || edit.kind === "audio") && (
                <div className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><ListChecks className="h-4 w-4" />{tt({ fr: `Questions (${questions.length}/50)`, de: `Fragen (${questions.length}/50)`, ar: `الأسئلة (${questions.length}/50)` })}</Label>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={addQuestion} disabled={questions.length >= 50}><Plus className="h-3 w-3 me-1" />{tt({ fr: "Ajouter", de: "Hinzufügen", ar: "إضافة" })}</Button>
                      <Button type="button" size="sm" variant="default" onClick={aiGenerateQuestions} disabled={aiBusy || questions.length >= 50}>
                        {aiBusy ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <Sparkles className="h-3 w-3 me-1" />}
                        {tt({ fr: "Générer IA", de: "KI generieren", ar: "توليد AI" })}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {questions.map((q, i) => (
                      <div key={i} className="p-2 border rounded bg-muted/30 space-y-1">
                        <div className="flex items-start gap-1">
                          <span className="text-xs font-bold mt-2 w-6">{i + 1}.</span>
                          <div className="flex-1 space-y-1">
                            <Input placeholder={tt({ fr: "Titre de la question", de: "Fragetitel", ar: "عنوان السؤال" })} value={q.prompt} onChange={(e) => updateQ(i, { prompt: e.target.value })} />
                            <Textarea rows={2} placeholder={tt({ fr: "Réponse attendue (référence prof)", de: "Erwartete Antwort (Referenz)", ar: "الإجابة المتوقعة (مرجع الأستاذ)" })} value={q.expected_answer} onChange={(e) => updateQ(i, { expected_answer: e.target.value })} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Input type="number" min={1} max={100} className="w-16 h-8 text-xs" value={q.points} onChange={(e) => updateQ(i, { points: Number(e.target.value) || 1 })} />
                            <div className="flex gap-1">
                              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveQuestion(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveQuestion(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                              <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeQuestion(i)}><X className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {questions.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {tt({ fr: "Total", de: "Gesamt", ar: "المجموع" })}: <strong>{questions.reduce((s, q) => s + q.points, 0)} pts</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{tt({ fr: "Annuler", de: "Abbrechen", ar: "إلغاء" })}</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-3 w-3 me-1 animate-spin" />}{tt({ fr: "Enregistrer", de: "Speichern", ar: "حفظ" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Corrections */}
      <Dialog open={!!viewSubsFor} onOpenChange={(o) => !o && setViewSubsFor(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewSubsFor?.title} — {tt({ fr: "Corrections", de: "Korrekturen", ar: "التصحيحات" })}</DialogTitle></DialogHeader>
          {subs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tt({ fr: "Aucune soumission.", de: "Keine Abgabe.", ar: "لا توجد إرساليات." })}</p>
          ) : (
            <div className="space-y-4">
              {subs.map((s) => (
                <SubmissionGrader key={s.id} sub={s} homework={viewSubsFor} tt={tt} onReload={() => openSubs(viewSubsFor)} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}

function SubmissionGrader({ sub, homework, tt, onReload }: any) {
  const [answers, setAnswers] = useState<any[]>(sub.answers || []);
  const [aiBusy, setAiBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [globalFeedback, setGlobalFeedback] = useState(sub.teacher_feedback || "");

  const ansMap = new Map(answers.map((a: any) => [a.question_id, a]));
  const questions: any[] = sub.allQuestions || [];
  const hasQuestions = questions.length > 0;

  const setAns = (qid: string, patch: any) => {
    setAnswers((prev) => {
      const idx = prev.findIndex((a: any) => a.question_id === qid);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], ...patch }; return next; }
      return [...prev, { question_id: qid, submission_id: sub.id, ...patch }];
    });
  };

  const saveAnswer = async (qid: string) => {
    const a: any = answers.find((x) => x.question_id === qid);
    if (!a) return;
    if (a.id) {
      await supabase.from("homework_question_answers").update({
        is_correct: a.is_correct, awarded_points: a.awarded_points, teacher_comment: a.teacher_comment,
      }).eq("id", a.id);
    }
  };

  const aiGrade = async () => {
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-grade", { body: { kind: hasQuestions ? "homework_questions" : "homework", submission_id: sub.id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(tt({ fr: "✨ Corrigé par IA", de: "✨ KI-korrigiert", ar: "✨ تم التصحيح بالذكاء الاصطناعي" }));
      onReload();
    } catch (e: any) { toast.error(e.message || "Erreur IA"); }
    finally { setAiBusy(false); }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      // Save all pending answer edits
      for (const a of answers) {
        if (a.id) {
          await supabase.from("homework_question_answers").update({
            is_correct: a.is_correct ?? null, awarded_points: a.awarded_points ?? null, teacher_comment: a.teacher_comment ?? null,
          }).eq("id", a.id);
        }
      }
      const score = hasQuestions
        ? Math.round(answers.reduce((s: number, a: any) => s + (Number(a.awarded_points) || 0), 0))
        : Number(sub.score) || 0;
      const { error } = await supabase.from("homework_submissions").update({
        score, teacher_feedback: globalFeedback || null, status: "graded", graded_at: new Date().toISOString(),
      }).eq("id", sub.id);
      if (error) throw error;
      await notify({
        user_id: sub.student_id, type: "homework.graded",
        title: tt({ fr: "Devoir corrigé", de: "Hausaufgabe korrigiert", ar: "تم تصحيح الواجب" }),
        body: `${homework.title} — ${score}/${homework.max_points}`, link: "/student/homework",
      });
      toast.success(tt({ fr: "Correction envoyée", de: "Korrektur gesendet", ar: "تم إرسال التصحيح" }));
      onReload();
    } catch (e: any) { toast.error(e.message || "Error"); }
    finally { setFinishing(false); }
  };

  const totalAwarded = answers.reduce((s: number, a: any) => s + (Number(a.awarded_points) || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{sub.profile?.display_name || sub.profile?.email || sub.student_id.slice(0, 8)}</CardTitle>
            <CardDescription className="text-xs">
              {sub.status === "graded" ? tt({ fr: "Corrigé", de: "Bewertet", ar: "تم التصحيح" }) : tt({ fr: "À corriger", de: "Zu bewerten", ar: "بانتظار التصحيح" })}
              {sub.submitted_at && ` · ${new Date(sub.submitted_at).toLocaleString()}`}
            </CardDescription>
          </div>
          <Badge variant={sub.status === "graded" ? "default" : "secondary"}>
            {sub.status === "graded" ? `${sub.score || 0}/${homework.max_points}` : `${Math.round(totalAwarded)}/${homework.max_points}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sub.content && !hasQuestions && (
          <div className="p-2 bg-muted/40 rounded text-sm whitespace-pre-wrap">{sub.content}</div>
        )}
        {sub.attachment_url && (
          <a href={sub.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">📎 {sub.attachment_name || "Pièce jointe"}</a>
        )}
        {sub.audio_url && <audio controls src={sub.audio_url} className="w-full h-8" />}

        {hasQuestions && questions.map((q: any, i: number) => {
          const a: any = ansMap.get(q.id) || {};
          return (
            <div key={q.id} className="p-2 border rounded space-y-1">
              <div className="text-xs font-semibold">Q{i + 1}. {q.prompt} <span className="text-muted-foreground font-normal">({q.points} pts)</span></div>
              <div className="text-sm p-2 bg-muted/30 rounded whitespace-pre-wrap">{a.answer || <em className="text-muted-foreground">— aucune réponse —</em>}</div>
              {q.expected_answer && <div className="text-xs text-muted-foreground">💡 Attendu: {q.expected_answer}</div>}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={a.is_correct === true ? "default" : "outline"} className={a.is_correct === true ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => { setAns(q.id, { is_correct: true, awarded_points: q.points }); saveAnswer(q.id); }}>
                  <CheckCircle2 className="h-3 w-3 me-1" /> {tt({ fr: "Bon", de: "Richtig", ar: "صحيح" })}
                </Button>
                <Button size="sm" variant={a.is_correct === false ? "destructive" : "outline"}
                  onClick={() => { setAns(q.id, { is_correct: false, awarded_points: 0 }); saveAnswer(q.id); }}>
                  <XCircle className="h-3 w-3 me-1" /> {tt({ fr: "Mauvais", de: "Falsch", ar: "خطأ" })}
                </Button>
                <Input type="number" min={0} max={q.points} step={0.5} className="w-20 h-8 text-xs" placeholder="pts"
                  value={a.awarded_points ?? ""} onChange={(e) => setAns(q.id, { awarded_points: Number(e.target.value) })} onBlur={() => saveAnswer(q.id)} />
                <Input placeholder={tt({ fr: "Commentaire", de: "Kommentar", ar: "تعليق" })} className="flex-1 h-8 text-xs"
                  value={a.teacher_comment || ""} onChange={(e) => setAns(q.id, { teacher_comment: e.target.value })} onBlur={() => saveAnswer(q.id)} />
              </div>
            </div>
          );
        })}

        <div>
          <Label className="text-xs">{tt({ fr: "Commentaire global (facultatif)", de: "Gesamtkommentar (optional)", ar: "تعليق عام (اختياري)" })}</Label>
          <Textarea rows={2} value={globalFeedback} onChange={(e) => setGlobalFeedback(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={aiGrade} disabled={aiBusy}>
            {aiBusy ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <Sparkles className="h-3 w-3 me-1" />}
            {tt({ fr: "Corriger avec IA", de: "Mit KI korrigieren", ar: "تصحيح بالذكاء الاصطناعي" })}
          </Button>
          <Button size="sm" onClick={finish} disabled={finishing}>
            {finishing && <Loader2 className="h-3 w-3 me-1 animate-spin" />}
            <CheckCircle2 className="h-3 w-3 me-1" />{tt({ fr: "Appliquer & terminer", de: "Anwenden & abschließen", ar: "تطبيق وإنهاء" })}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const graded = sub.status === "graded";
                await notify({
                  user_id: sub.student_id,
                  type: graded ? "homework.reminder_graded" : "homework.reminder",
                  title: graded
                    ? tt({ fr: "Rappel : correction disponible", de: "Erinnerung: Korrektur verfügbar", ar: "تذكير: التصحيح متاح" })
                    : tt({ fr: "Rappel de devoir", de: "Hausaufgaben-Erinnerung", ar: "تذكير بالواجب" }),
                  body: graded
                    ? `${homework.title} — ${sub.score ?? 0}/${homework.max_points}`
                    : `${homework.title}${homework.due_at ? ` · ${new Date(homework.due_at).toLocaleDateString()}` : ""}`,
                  link: "/student/homework",
                });
                toast.success(tt({ fr: "🔔 Notification envoyée", de: "🔔 Benachrichtigung gesendet", ar: "🔔 تم إرسال الإشعار" }));
              } catch (e: any) {
                toast.error(e.message || "Error");
              }
            }}
          >
            <Bell className="h-3 w-3 me-1" />
            {tt({ fr: "Renotifier l'élève", de: "Schüler erneut benachrichtigen", ar: "إعادة إشعار الطالب" })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
