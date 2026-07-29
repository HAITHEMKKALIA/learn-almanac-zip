import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, MessageSquare, Search, Users, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { computeMention } from "@/lib/certificatePdf";

type Row = {
  student_id: string;
  display_name: string | null;
  email: string | null;
  class_id: string;
  class_name: string;
  level: string | null;
  school_id: string | null;
};

type SubLevel = { id: string; code: string; name: string };
type ValidationRow = {
  student_id: string;
  status: string;
  mention: string;
  score: number;
};

const initials = (n?: string | null) =>
  (n || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

const MENTIONS = [
  { value: "Bestanden / Passable", label: { fr: "Passable", de: "Bestanden", ar: "مقبول" }, score: 60 },
  { value: "Befriedigend / Assez bien", label: { fr: "Assez bien", de: "Befriedigend", ar: "حسن" }, score: 70 },
  { value: "Gut / Bien", label: { fr: "Bien", de: "Gut", ar: "جيد" }, score: 80 },
  { value: "Sehr gut / Très bien", label: { fr: "Très bien", de: "Sehr gut", ar: "جيد جدا" }, score: 88 },
  { value: "Ausgezeichnet / Excellent", label: { fr: "Excellent", de: "Ausgezeichnet", ar: "ممتاز" }, score: 95 },
];

export default function TeacherStudents() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const { activeSchoolId } = useActiveSchool();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [subLevels, setSubLevels] = useState<SubLevel[]>([]);
  const [validations, setValidations] = useState<Record<string, ValidationRow>>({});

  // Dialog state
  const [openFor, setOpenFor] = useState<Row | null>(null);
  const [subLevelId, setSubLevelId] = useState<string>("");
  const [mention, setMention] = useState<string>(MENTIONS[2].value);
  const [score, setScore] = useState<number>(80);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, level, teacher_id, school_id")
        .eq("teacher_id", user.id);
      const list: Row[] = [];
      for (const c of classes || []) {
        const { data: roster } = await supabase.rpc("get_class_roster", { _class_id: c.id });
        (roster || []).forEach((r: any) => {
          list.push({
            student_id: r.student_id,
            display_name: r.display_name,
            email: r.email,
            class_id: c.id,
            class_name: c.name,
            level: c.level,
            school_id: (c as any).school_id ?? null,
          });
        });
      }
      setRows(list);
      setLoading(false);

      // Load teacher's validations (any status) for badges
      const { data: v } = await (supabase as any)
        .from("student_success_validations")
        .select("student_id, status, mention, score")
        .eq("teacher_id", user.id);
      const map: Record<string, ValidationRow> = {};
      (v || []).forEach((r: any) => { map[r.student_id] = r; });
      setValidations(map);
    })();
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("sub_levels").select("id, code, name").order("order_index");
      const rows = (data as SubLevel[]) || [];
      setSubLevels(rows);
      if (rows.length && !subLevelId) setSubLevelId(rows[0].id);
    })();
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (r) =>
        (r.display_name || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s) ||
        (r.class_name || "").toLowerCase().includes(s),
    );
  }, [rows, q]);

  const openValidate = (r: Row) => {
    setOpenFor(r);
    // Pre-select sub-level matching class level if possible
    const match = subLevels.find((s) => s.code === r.level);
    if (match) setSubLevelId(match.id);
    setMention(MENTIONS[2].value);
    setScore(80);
    setNotes("");
  };

  const saveValidation = async () => {
    if (!openFor || !user) return;
    const school_id = openFor.school_id || activeSchoolId;
    if (!school_id) { toast.error(tt({ fr: "École introuvable", de: "Schule fehlt", ar: "المدرسة مفقودة" })); return; }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("student_success_validations")
      .insert({
        school_id,
        student_id: openFor.student_id,
        teacher_id: user.id,
        class_id: openFor.class_id,
        sub_level_id: subLevelId || null,
        score,
        mention,
        notes: notes || null,
      });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(tt({ fr: "Réussite validée", de: "Erfolg bestätigt", ar: "تم التأكيد" }));
    setValidations((prev) => ({
      ...prev,
      [openFor.student_id]: { student_id: openFor.student_id, status: "pending", mention, score },
    }));
    setOpenFor(null);
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Mes élèves", de: "Meine Schüler", ar: "تلاميذي" })}
      subtitle={tt({ fr: "Tous les élèves de vos classes", de: "Alle Schüler Ihrer Klassen", ar: "جميع تلاميذ صفوفك" })}
      breadcrumbs={[
        { label: tt({ fr: "Professeur", de: "Lehrer", ar: "أستاذ" }), href: "/teacher" },
        { label: tt({ fr: "Mes élèves", de: "Meine Schüler", ar: "تلاميذي" }) },
      ]}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            {filtered.length} {tt({ fr: "élève(s)", de: "Schüler", ar: "تلميذ" })}
          </CardTitle>
          <div className="relative mt-2">
            <Search className="h-4 w-4 absolute start-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder={tt({ fr: "Rechercher…", de: "Suchen…", ar: "بحث…" })}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="ps-8 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              {tt({ fr: "Aucun élève dans vos classes.", de: "Keine Schüler in Ihren Klassen.", ar: "لا يوجد تلاميذ في صفوفك." })}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => {
                const v = validations[r.student_id];
                return (
                  <div key={r.student_id + r.class_id} className="flex flex-wrap items-center gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/15 text-primary text-sm">{initials(r.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.display_name || r.email || r.student_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                    </div>
                    <Badge variant="outline">{r.class_name}{r.level ? ` · ${r.level}` : ""}</Badge>
                    {v && (
                      <Badge className={v.status === "issued"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"}>
                        <CheckCircle2 className="h-3 w-3 me-1" />
                        {v.status === "issued"
                          ? tt({ fr: "Certificat émis", de: "Zertifikat erstellt", ar: "صدرت الشهادة" })
                          : tt({ fr: "Réussite validée", de: "Erfolg bestätigt", ar: "تم التأكيد" })}
                        {` · ${v.score}/100`}
                      </Badge>
                    )}
                    <Button size="sm" variant="default" onClick={() => openValidate(r)} className="gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {tt({ fr: "Valider réussite", de: "Erfolg bestätigen", ar: "تأكيد النجاح" })}
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/messages?peer=${r.student_id}`}>
                        <MessageSquare className="h-3.5 w-3.5 me-1" />
                        {tt({ fr: "Message", de: "Nachricht", ar: "رسالة" })}
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openFor} onOpenChange={(o) => !o && setOpenFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {tt({ fr: "Valider la réussite", de: "Erfolg bestätigen", ar: "تأكيد النجاح" })}
            </DialogTitle>
            <DialogDescription>
              {openFor?.display_name || openFor?.email} — {openFor?.class_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{tt({ fr: "Niveau (session CEFR)", de: "Niveau (GER)", ar: "المستوى" })}</Label>
              <Select value={subLevelId} onValueChange={setSubLevelId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subLevels.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tt({ fr: "Mention", de: "Bewertung", ar: "التقدير" })}</Label>
              <Select
                value={mention}
                onValueChange={(v) => {
                  setMention(v);
                  const m = MENTIONS.find((x) => x.value === v);
                  if (m) setScore(m.score);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MENTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{tt(m.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tt({ fr: "Note /100", de: "Note /100", ar: "الدرجة /100" })}</Label>
              <Input
                type="number" min={0} max={100}
                value={score}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setScore(n);
                  setMention(computeMention(n));
                }}
              />
            </div>
            <div>
              <Label>{tt({ fr: "Commentaire (optionnel)", de: "Kommentar (optional)", ar: "ملاحظة (اختياري)" })}</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              {tt({
                fr: "Après confirmation, l'admin de l'école pourra générer le certificat.",
                de: "Nach Bestätigung erstellt die Schulverwaltung das Zertifikat.",
                ar: "بعد التأكيد، تقوم إدارة المدرسة بإصدار الشهادة.",
              })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenFor(null)}>
              {tt({ fr: "Annuler", de: "Abbrechen", ar: "إلغاء" })}
            </Button>
            <Button onClick={saveValidation} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {tt({ fr: "Confirmer", de: "Bestätigen", ar: "تأكيد" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
