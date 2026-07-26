import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type Student = { student_id: string; display_name: string | null };
type ClassRow = { id: string; name: string; level: string; school_id: string };

const LEVELS = ["A1", "A2", "B1", "B2"] as const;

export function PromoteStudentsDialog({
  students,
  currentClass,
  onDone,
  trigger,
}: {
  students: Student[];
  currentClass: { id: string; school_id: string; level: string };
  onDone?: () => void;
  trigger?: React.ReactNode;
}) {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(students.map((s) => s.student_id)));
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [targetLevel, setTargetLevel] = useState<string>(() => nextLevel(currentClass.level));
  const [targetClassId, setTargetClassId] = useState<string>("");
  const [newClassName, setNewClassName] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set(students.map((s) => s.student_id)));
  }, [students]);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await supabase
        .from("classes")
        .select("id, name, level, school_id")
        .eq("teacher_id", user.id)
        .eq("school_id", currentClass.school_id)
        .neq("id", currentClass.id);
      setClasses((data || []) as ClassRow[]);
    })();
  }, [open, user, currentClass.id, currentClass.school_id]);

  const filteredClasses = useMemo(
    () => classes.filter((c) => c.level === targetLevel),
    [classes, targetLevel]
  );

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const promote = async () => {
    if (!user) return;
    if (selectedIds.size === 0) { toast.error(tt({ fr: "Sélectionnez au moins un élève", de: "Mindestens einen Schüler auswählen", ar: "اختر طالباً واحداً على الأقل" })); return; }
    setBusy(true);
    try {
      let classId = targetClassId;
      if (creating) {
        if (!newClassName.trim()) { toast.error(tt({ fr: "Nom de la nouvelle classe requis", de: "Name der neuen Klasse erforderlich", ar: "اسم الفصل الجديد مطلوب" })); setBusy(false); return; }
        const { data, error } = await supabase
          .from("classes")
          .insert({ name: newClassName.trim(), level: targetLevel as any, teacher_id: user.id, school_id: currentClass.school_id })
          .select().single();
        if (error) throw error;
        classId = data.id;
      }
      if (!classId) { toast.error(tt({ fr: "Choisissez une classe cible", de: "Zielklasse auswählen", ar: "اختر فصلاً مستهدفاً" })); setBusy(false); return; }
      const { error } = await (supabase as any).rpc("promote_students", {
        _student_ids: Array.from(selectedIds),
        _target_class_id: classId,
      });
      if (error) throw error;
      toast.success(tt({
        fr: `${selectedIds.size} élève(s) promu(s) vers ${targetLevel}`,
        de: `${selectedIds.size} Schüler nach ${targetLevel} befördert`,
        ar: `تمت ترقية ${selectedIds.size} طالب/طلاب إلى ${targetLevel}`,
      }));
      setOpen(false);
      onDone?.();
    } catch (e: any) {
      toast.error(e.message || tt({ fr: "Erreur de promotion", de: "Beförderungsfehler", ar: "خطأ في الترقية" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1">
            <GraduationCap className="h-4 w-4" /> {tt({ fr: "Promouvoir", de: "Befördern", ar: "ترقية" })}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> {tt({ fr: "Promotion d'élèves", de: "Schülerbeförderung", ar: "ترقية الطلاب" })}</DialogTitle>
          <DialogDescription>
            {tt({
              fr: "Faire passer un ou plusieurs élèves vers un nouveau niveau. L'historique reste dans la classe actuelle.",
              de: "Einen oder mehrere Schüler auf ein neues Niveau befördern. Die Historie bleibt in der aktuellen Klasse.",
              ar: "نقل طالب أو أكثر إلى مستوى جديد. يبقى السجل في الفصل الحالي.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">{tt({ fr: "Élèves à promouvoir", de: "Zu befördernde Schüler", ar: "الطلاب للترقية" })} ({selectedIds.size}/{students.length})</Label>
            <ScrollArea className="h-32 border rounded-md p-2 mt-1">
              <div className="space-y-1">
                {students.map((s) => (
                  <label key={s.student_id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <Checkbox checked={selectedIds.has(s.student_id)} onCheckedChange={() => toggle(s.student_id)} />
                    <span>{s.display_name || s.student_id.slice(0, 8)}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{tt({ fr: "Nouveau niveau", de: "Neues Niveau", ar: "المستوى الجديد" })}</Label>
              <Select value={targetLevel} onValueChange={setTargetLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{tt({ fr: "Classe cible", de: "Zielklasse", ar: "الفصل المستهدف" })}</Label>
              {!creating ? (
                <div className="flex gap-1">
                  <Select value={targetClassId} onValueChange={setTargetClassId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={tt({ fr: "Choisir…", de: "Auswählen…", ar: "اختر…" })} /></SelectTrigger>
                    <SelectContent>
                      {filteredClasses.length === 0 && <div className="px-2 py-1 text-xs text-muted-foreground">{tt({ fr: `Aucune classe ${targetLevel}`, de: `Keine Klasse ${targetLevel}`, ar: `لا يوجد فصل ${targetLevel}` })}</div>}
                      {filteredClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="outline" onClick={() => setCreating(true)} title={tt({ fr: "Créer une classe", de: "Klasse erstellen", ar: "إنشاء فصل" })}><Plus className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder={tt({ fr: `Nouvelle classe ${targetLevel}`, de: `Neue Klasse ${targetLevel}`, ar: `فصل جديد ${targetLevel}` })} />
                  <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>×</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{tt({ fr: "Annuler", de: "Abbrechen", ar: "إلغاء" })}</Button>
          <Button onClick={promote} disabled={busy}>{busy ? "..." : tt({ fr: "Promouvoir", de: "Befördern", ar: "ترقية" })}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function nextLevel(level: string): string {
  const order = ["A1", "A2", "B1", "B2"];
  const i = order.indexOf(level);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : "A2";
}
