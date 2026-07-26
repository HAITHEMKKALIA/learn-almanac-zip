import { useEffect, useMemo, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FileCheck2, Paperclip, Eye, Calendar as CalIcon, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AiGenerateButton } from "@/components/school/AiGenerateButton";
import { AiHistoryPanel } from "@/components/school/AiHistoryPanel";
import { pushAiHistory } from "@/lib/aiHistory";

const CATEGORIES = ["schreiben", "sprechen", "grammatik", "lesen", "hoeren", "wortschatz", "sonstige"] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

const catLabel = (c: string, tt: any) => ({
  schreiben: tt({ fr: "Écrit", de: "Schreiben", ar: "كتابة" }),
  sprechen: tt({ fr: "Oral", de: "Sprechen", ar: "محادثة" }),
  grammatik: tt({ fr: "Grammaire", de: "Grammatik", ar: "قواعد" }),
  lesen: tt({ fr: "Lecture", de: "Lesen", ar: "قراءة" }),
  hoeren: tt({ fr: "Écoute", de: "Hören", ar: "استماع" }),
  wortschatz: tt({ fr: "Vocabulaire", de: "Wortschatz", ar: "مفردات" }),
  sonstige: tt({ fr: "Autre", de: "Sonstige", ar: "أخرى" }),
}[c] || c);

export default function TeacherHomework() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [viewSubsFor, setViewSubsFor] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [aiAutoLoading, setAiAutoLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [h, c] = await Promise.all([
      supabase
        .from("homework")
        .select("*, classes(name), homework_submissions(id, status, score, student_id)")
        .order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name, level"),
    ]);
    if (h.error) toast.error(h.error.message);
    setItems(h.data || []);
    setClasses(c.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEdit({
      title: "",
      instructions: "",
      category: "schreiben",
      level: classes[0]?.level || "A1",
      class_id: classes[0]?.id || "",
      due_at: "",
      max_points: 20,
      status: "open",
    });
    setOpen(true);
  };

  const startEdit = (h: any) => { setEdit({ ...h, due_at: h.due_at ? h.due_at.slice(0, 16) : "" }); setOpen(true); };

  const save = async () => {
    if (!user || !edit?.title?.trim() || !edit?.class_id) {
      toast.error(tt({ fr: "Titre et classe requis", de: "Titel und Klasse erforderlich", ar: "العنوان والصف مطلوبان" }));
      return;
    }
    const payload: any = {
      teacher_id: user.id,
      class_id: edit.class_id,
      title: edit.title,
      instructions: edit.instructions || null,
      category: edit.category,
      level: edit.level || null,
      due_at: edit.due_at ? new Date(edit.due_at).toISOString() : null,
      max_points: Number(edit.max_points) || 20,
      status: edit.status || "open",
    };
    const res = edit.id
      ? await supabase.from("homework").update(payload).eq("id", edit.id)
      : await supabase.from("homework").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(tt({ fr: "Enregistré", de: "Gespeichert", ar: "تم الحفظ" }));
    setOpen(false); setEdit(null);
    load();
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
    const { data: subData } = await supabase
      .from("homework_submissions")
      .select("*")
      .eq("homework_id", h.id)
      .order("submitted_at", { ascending: false });
    if (!subData) { setSubs([]); return; }
    const ids = subData.map((s: any) => s.student_id);
    const { data: profs } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", ids);
    const byId: Record<string, any> = {};
    (profs || []).forEach((p: any) => { byId[p.user_id] = p; });
    setSubs(subData.map((s: any) => ({ ...s, profile: byId[s.student_id] })));
  };

  const grade = async (sub: any, score: number, feedback: string) => {
    const { error } = await supabase
      .from("homework_submissions")
      .update({ score, teacher_feedback: feedback, status: "graded", graded_at: new Date().toISOString() })
      .eq("id", sub.id);
    if (error) { toast.error(error.message); return; }
    toast.success(tt({ fr: "Noté", de: "Bewertet", ar: "تم التقييم" }));
    openSubs(viewSubsFor);
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Hausaufgaben", de: "Hausaufgaben", ar: "الواجبات المنزلية" })}
      subtitle={tt({ fr: "Donnez des exercices: Schreiben, Sprechen, Grammatik…", de: "Geben Sie Übungen: Schreiben, Sprechen, Grammatik…", ar: "أعطِ تمارين: كتابة، محادثة، قواعد…" })}
      breadcrumbs={[{ label: tt({ fr: "Professeur", de: "Lehrer", ar: "أستاذ" }), href: "/teacher" }, { label: "Hausaufgaben" }]}
      actions={
        <Button onClick={startNew}>
          <Plus className="h-4 w-4 me-2" />
          {tt({ fr: "Nouvelle Hausaufgabe", de: "Neue Hausaufgabe", ar: "واجب جديد" })}
        </Button>
      }
    >
      <div className="mb-3"><AiHistoryPanel filterMode="homework" /></div>
      {loading ? (
        <p className="text-sm text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          {tt({ fr: "Aucune Hausaufgabe.", de: "Keine Hausaufgaben.", ar: "لا توجد واجبات." })}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((h) => {
            const total = h.homework_submissions?.length || 0;
            const graded = h.homework_submissions?.filter((s: any) => s.status === "graded").length || 0;
            return (
              <Card key={h.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{h.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">{catLabel(h.category, tt)}</Badge>
                        {h.level && <Badge variant="secondary">{h.level}</Badge>}
                        <Badge>{h.classes?.name}</Badge>
                        {h.due_at && (
                          <Badge variant="outline">
                            <CalIcon className="h-3 w-3 me-1" />
                            {new Date(h.due_at).toLocaleString()}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={h.status === "open" ? "default" : "outline"}>{h.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {h.instructions && <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{h.instructions}</p>}
                  <div className="text-xs text-muted-foreground">
                    {tt({ fr: "Soumissions", de: "Abgaben", ar: "إرساليات" })}: <strong>{total}</strong> ·{" "}
                    {tt({ fr: "Notées", de: "Bewertet", ar: "مقيّم" })}: <strong>{graded}</strong>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openSubs(h)}>
                      <Eye className="h-3 w-3 me-1" />
                      {tt({ fr: "Voir & corriger", de: "Ansehen & korrigieren", ar: "عرض وتصحيح" })}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(h)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(h.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? tt({ fr: "Modifier", de: "Bearbeiten", ar: "تعديل" }) : tt({ fr: "Nouvelle Hausaufgabe", de: "Neue Hausaufgabe", ar: "واجب جديد" })}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="grid gap-3">
              <div>
                <Label>{tt({ fr: "Titre", de: "Titel", ar: "العنوان" })}</Label>
                <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
              </div>
              <div className="flex flex-wrap gap-2">
                <AiGenerateButton
                  mode="homework"
                  level={edit.level || "A1"}
                  category={edit.category}
                  title={edit.title}
                  buttonLabel="Générer avec IA (PDF supporté)"
                  onResult={(d) => {
                    setEdit({ ...edit, title: edit.title || d.title || "", instructions: d.instructions || edit.instructions });
                    pushAiHistory({ mode: "homework", level: edit.level || "A1", category: edit.category, title: d.title || edit.title, status: "success", message: "Hausaufgabe générée (PDF)" });
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={aiAutoLoading}
                  className="gap-2"
                  onClick={async () => {
                    setAiAutoLoading(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("ai-pedagogy", {
                        body: {
                          mode: "homework",
                          level: edit.level || "A1",
                          category: edit.category,
                          title: edit.title || "",
                          hint: edit.instructions || "",
                          source_text: "",
                        },
                      });
                      if (error) throw error;
                      if ((data as any)?.error) throw new Error((data as any).error);
                      const d: any = data;
                      setEdit({ ...edit, title: edit.title || d.title || "", instructions: d.instructions || edit.instructions });
                      toast.success("✨ Hausaufgabe générée par IA");
                      pushAiHistory({ mode: "homework", level: edit.level || "A1", category: edit.category, title: d.title || edit.title, status: "success", message: "Hausaufgabe générée (sans PDF)" });
                    } catch (e: any) {
                      toast.error(e.message || "Erreur génération");
                      pushAiHistory({ mode: "homework", level: edit.level || "A1", category: edit.category, title: edit.title, status: "error", message: e.message || "Erreur génération" });
                    } finally {
                      setAiAutoLoading(false);
                    }
                  }}
                >
                  {aiAutoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                  Générer avec IA (sans PDF)
                </Button>
              </div>
              <div>
                <Label>{tt({ fr: "Consignes", de: "Anweisungen", ar: "التعليمات" })}</Label>
                <Textarea rows={5} value={edit.instructions || ""} onChange={(e) => setEdit({ ...edit, instructions: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{tt({ fr: "Catégorie", de: "Kategorie", ar: "الفئة" })}</Label>
                  <Select value={edit.category} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{catLabel(c, tt)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })}</Label>
                  <Select value={edit.level || "A1"} onValueChange={(v) => setEdit({ ...edit, level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{tt({ fr: "Classe", de: "Klasse", ar: "الصف" })}</Label>
                  <Select value={edit.class_id} onValueChange={(v) => setEdit({ ...edit, class_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{tt({ fr: "Note max", de: "Max. Punkte", ar: "أقصى علامة" })}</Label>
                  <Input type="number" value={edit.max_points} onChange={(e) => setEdit({ ...edit, max_points: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{tt({ fr: "Annuler", de: "Abbrechen", ar: "إلغاء" })}</Button>
            <Button onClick={save}>{tt({ fr: "Enregistrer", de: "Speichern", ar: "حفظ" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions */}
      <Dialog open={!!viewSubsFor} onOpenChange={(o) => !o && setViewSubsFor(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewSubsFor?.title} — {tt({ fr: "Soumissions", de: "Abgaben", ar: "الإرساليات" })}</DialogTitle>
          </DialogHeader>
          {subs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tt({ fr: "Aucune soumission.", de: "Keine Abgabe.", ar: "لا توجد إرساليات." })}</p>
          ) : (
            <div className="space-y-3">
              {subs.map((s) => (
                <SubmissionCard key={s.id} sub={s} maxPoints={viewSubsFor?.max_points || 20} onGrade={grade} tt={tt} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}

function SubmissionCard({ sub, maxPoints, onGrade, tt }: any) {
  const [score, setScore] = useState<string>(sub.score?.toString() ?? "");
  const [feedback, setFeedback] = useState<string>(sub.teacher_feedback ?? "");
  const [aiBusy, setAiBusy] = useState(false);

  const aiGrade = async () => {
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-grade", { body: { kind: "homework", submission_id: sub.id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const d: any = data;
      setScore(String(d.score));
      setFeedback(d.feedback);
      toast.success(`✨ Corrigé par IA: ${d.score}/${maxPoints}`);
    } catch (e: any) { toast.error(e.message || "Erreur IA"); }
    finally { setAiBusy(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{sub.profile?.display_name || sub.profile?.email || sub.student_id.slice(0, 8)}</span>
          <div className="flex items-center gap-1">
            {sub.ai_graded && <Badge variant="outline" className="text-xs"><Sparkles className="h-3 w-3 me-1"/>IA</Badge>}
            <Badge variant={sub.status === "graded" ? "default" : "outline"}>
              {sub.status === "graded" ? `${sub.score}/${maxPoints}` : tt({ fr: "À corriger", de: "Zu korrigieren", ar: "بانتظار التصحيح" })}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-xs">{new Date(sub.submitted_at).toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sub.content && <div className="text-sm whitespace-pre-wrap p-2 rounded bg-muted/40 border">{sub.content}</div>}
        {sub.attachment_url && (
          <a href={sub.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
            <Paperclip className="h-3 w-3" />{sub.attachment_name || "fichier"}
          </a>
        )}
        {sub.audio_url && <audio controls src={sub.audio_url} className="w-full h-8" />}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-end pt-2">
          <div>
            <Label className="text-xs">{tt({ fr: "Note", de: "Note", ar: "العلامة" })}</Label>
            <Input type="number" max={maxPoints} value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">{tt({ fr: "Commentaire / correction", de: "Kommentar", ar: "تعليق" })}</Label>
            <Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={aiBusy} onClick={aiGrade}>
            {aiBusy ? <Loader2 className="h-3 w-3 animate-spin me-1"/> : <Sparkles className="h-3 w-3 me-1"/>}
            {tt({ fr: "Correction IA", de: "KI-Korrektur", ar: "تصحيح بالذكاء" })}
          </Button>
          <Button size="sm" onClick={() => onGrade(sub, Number(score), feedback)}>
            <FileCheck2 className="h-3 w-3 me-1" />
            {tt({ fr: "Valider & publier", de: "Bestätigen & senden", ar: "تأكيد ونشر" })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
