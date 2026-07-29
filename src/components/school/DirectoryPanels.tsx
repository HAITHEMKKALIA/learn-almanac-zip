import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Search, Users, GraduationCap, Calendar, Trophy, BookOpen, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/* ============================================================
 * Shared types
 * ==========================================================*/
type ClassRow = { id: string; name: string; level: string | null; teacher_id: string | null; invite_code?: string };
type MemberLite = { user_id: string; display_name: string | null; email: string | null };
type SchoolMemberRow = { user_id: string; joined_at: string; approved_at: string | null; space_role: string | null; role: string };

type StudentRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  joined_at: string | null;
  approved_at: string | null;
  classes: { id: string; name: string; level: string | null; teacher_name: string | null }[];
  xp: number;
  level: number;
  streak: number;
  last_activity: string | null;
  avg_score: number | null;
  submissions_total: number;
  submissions_passed: number;
  homework_total: number;
  homework_done: number;
  attendance_total: number;
  attendance_present: number;
};

type TeacherRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  joined_at: string | null;
  approved_at: string | null;
  classes: {
    id: string; name: string; level: string | null;
    students_count: number;
    students_passed: number;
    students_failed: number;
  }[];
};

const pct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 100));
const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" }) : "—";

/* ============================================================
 * STUDENTS DIRECTORY
 * ==========================================================*/
export function StudentsDirectory({ schoolId }: { schoolId: string }) {
  const { tt } = useI18n();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [allClasses, setAllClasses] = useState<ClassRow[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 1) School classes + teacher names
      const { data: classes = [] } = await supabase
        .from("classes")
        .select("id, name, level, teacher_id")
        .eq("school_id", schoolId);
      setAllClasses((classes || []) as ClassRow[]);

      const teacherIds = Array.from(new Set((classes || []).map((c: any) => c.teacher_id).filter(Boolean)));
      const teacherNameMap = new Map<string, string>();
      if (teacherIds.length) {
        const { data: profs = [] } = await supabase
          .from("profiles").select("user_id, display_name, email").in("user_id", teacherIds);
        (profs || []).forEach((p: any) => teacherNameMap.set(p.user_id, p.display_name || p.email || ""));
      }

      // 2) School members (students only) with joined_at
      const { data: mem = [] } = await supabase
        .from("school_members")
        .select("user_id, joined_at, approved_at, space_role, role, status")
        .eq("school_id", schoolId)
        .eq("status", "approved");
      const studentMembers = (mem || []).filter((m: any) =>
        (m.space_role === "student" || (!m.space_role && m.role === "student"))
      );
      const studentIds = studentMembers.map((m: any) => m.user_id);
      if (studentIds.length === 0) { setRows([]); setLoading(false); return; }

      // 3) Profiles
      const { data: profs = [] } = await supabase
        .from("profiles").select("user_id, display_name, email").in("user_id", studentIds);
      const profMap = new Map<string, MemberLite>();
      (profs || []).forEach((p: any) => profMap.set(p.user_id, p));

      // 4) Class memberships
      const classIds = (classes || []).map((c: any) => c.id);
      const { data: cm = [] } = classIds.length ? await supabase
        .from("class_members").select("class_id, student_id").in("class_id", classIds) : { data: [] as any[] };
      const studentClasses = new Map<string, string[]>();
      (cm || []).forEach((r: any) => {
        const arr = studentClasses.get(r.student_id) || [];
        arr.push(r.class_id); studentClasses.set(r.student_id, arr);
      });

      // 5) user_stats
      const { data: stats = [] } = await supabase
        .from("user_stats")
        .select("user_id, xp, level, current_streak, last_activity_date")
        .in("user_id", studentIds);
      const statMap = new Map<string, any>();
      (stats || []).forEach((s: any) => statMap.set(s.user_id, s));

      // 6) submissions (avg score + pass)
      const { data: subs = [] } = await supabase
        .from("submissions")
        .select("student_id, score, total, status")
        .in("student_id", studentIds);
      const subAgg = new Map<string, { total: number; passed: number; sumPct: number; graded: number }>();
      (subs || []).forEach((s: any) => {
        const agg = subAgg.get(s.student_id) || { total: 0, passed: 0, sumPct: 0, graded: 0 };
        agg.total += 1;
        if (s.score != null && s.total != null && s.total > 0) {
          const p = (Number(s.score) / Number(s.total)) * 100;
          agg.sumPct += p; agg.graded += 1;
          if (p >= 50) agg.passed += 1;
        }
        subAgg.set(s.student_id, agg);
      });

      // 7) homework submissions
      const { data: hs = [] } = await supabase
        .from("homework_submissions")
        .select("student_id, status")
        .in("student_id", studentIds);
      const hwAgg = new Map<string, { total: number; done: number }>();
      (hs || []).forEach((r: any) => {
        const a = hwAgg.get(r.student_id) || { total: 0, done: 0 };
        a.total += 1;
        if (["submitted", "graded"].includes(String(r.status))) a.done += 1;
        hwAgg.set(r.student_id, a);
      });

      // 8) attendance
      const { data: sessions = [] } = classIds.length ? await supabase
        .from("attendance_sessions").select("id").in("class_id", classIds) : { data: [] as any[] };
      const sessionIds = (sessions || []).map((s: any) => s.id);
      const attAgg = new Map<string, { total: number; present: number }>();
      if (sessionIds.length) {
        const { data: att = [] } = await supabase
          .from("attendance_records")
          .select("student_id, status")
          .in("session_id", sessionIds)
          .in("student_id", studentIds);
        (att || []).forEach((r: any) => {
          const a = attAgg.get(r.student_id) || { total: 0, present: 0 };
          a.total += 1; if (r.status === "present") a.present += 1;
          attAgg.set(r.student_id, a);
        });
      }

      // Assemble
      const classById = new Map<string, ClassRow>();
      (classes || []).forEach((c: any) => classById.set(c.id, c));
      const memMeta = new Map<string, SchoolMemberRow>();
      (studentMembers || []).forEach((m: any) => memMeta.set(m.user_id, m));

      const out: StudentRow[] = studentIds.map((sid) => {
        const p = profMap.get(sid);
        const st = statMap.get(sid) || {};
        const sa = subAgg.get(sid) || { total: 0, passed: 0, sumPct: 0, graded: 0 };
        const ha = hwAgg.get(sid) || { total: 0, done: 0 };
        const aa = attAgg.get(sid) || { total: 0, present: 0 };
        const cIds = studentClasses.get(sid) || [];
        const meta = memMeta.get(sid);
        return {
          user_id: sid,
          display_name: p?.display_name || null,
          email: p?.email || null,
          joined_at: meta?.joined_at || null,
          approved_at: meta?.approved_at || null,
          classes: cIds.map((cid) => {
            const c = classById.get(cid);
            return {
              id: cid,
              name: c?.name || "—",
              level: c?.level || null,
              teacher_name: c?.teacher_id ? teacherNameMap.get(c.teacher_id) || null : null,
            };
          }),
          xp: Number(st.xp || 0),
          level: Number(st.level || 1),
          streak: Number(st.current_streak || 0),
          last_activity: st.last_activity_date || null,
          avg_score: sa.graded > 0 ? Math.round(sa.sumPct / sa.graded) : null,
          submissions_total: sa.total,
          submissions_passed: sa.passed,
          homework_total: ha.total,
          homework_done: ha.done,
          attendance_total: aa.total,
          attendance_present: aa.present,
        };
      });
      setRows(out.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
      setLoading(false);
    })();
  }, [schoolId]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (classFilter !== "all" && !r.classes.some((c) => c.id === classFilter)) return false;
      if (!s) return true;
      return (
        (r.display_name || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s) ||
        r.classes.some((c) => (c.name || "").toLowerCase().includes(s))
      );
    });
  }, [rows, q, classFilter]);

  const L = {
    title: tt({ fr: "Annuaire des élèves", de: "Schülerverzeichnis", ar: "دليل الطلاب" }),
    search: tt({ fr: "Rechercher (nom, email, classe)…", de: "Suche (Name, E-Mail, Klasse)…", ar: "بحث (الاسم، البريد، الصف)…" }),
    all: tt({ fr: "Toutes les classes", de: "Alle Klassen", ar: "كل الصفوف" }),
    joined: tt({ fr: "Inscrit le", de: "Beigetreten", ar: "تاريخ التسجيل" }),
    classes: tt({ fr: "Classes", de: "Klassen", ar: "الصفوف" }),
    teacher: tt({ fr: "Prof", de: "Lehrkraft", ar: "المعلم" }),
    attendance: tt({ fr: "Présence", de: "Anwesenheit", ar: "الحضور" }),
    success: tt({ fr: "Réussite", de: "Erfolg", ar: "النجاح" }),
    xp: "XP",
    level: tt({ fr: "Niveau", de: "Level", ar: "المستوى" }),
    streak: tt({ fr: "Série", de: "Serie", ar: "السلسلة" }),
    homework: tt({ fr: "Devoirs rendus", de: "Hausaufgaben abgegeben", ar: "الواجبات المسلمة" }),
    exams: tt({ fr: "Examens (réussis)", de: "Prüfungen (bestanden)", ar: "الامتحانات (ناجحة)" }),
    lastActivity: tt({ fr: "Dernière activité", de: "Letzte Aktivität", ar: "آخر نشاط" }),
    empty: tt({ fr: "Aucun élève trouvé.", de: "Keine Schüler gefunden.", ar: "لا يوجد طلاب." }),
    details: tt({ fr: "Détails", de: "Details", ar: "التفاصيل" }),
    avg: tt({ fr: "Moyenne examens", de: "Prüfungsdurchschnitt", ar: "معدل الامتحانات" }),
    noClass: tt({ fr: "Sans classe", de: "Ohne Klasse", ar: "بدون صف" }),
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          {L.title}
          <Badge variant="outline" className="ml-2">{filtered.length}</Badge>
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute start-2.5 top-2.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.search} className="ps-8 h-9" />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">{L.all}</option>
            {allClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.level ? `(${c.level})` : ""}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">{L.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-start p-3">{tt({ fr: "Élève", de: "Schüler", ar: "الطالب" })}</th>
                  <th className="text-start p-3">{L.classes}</th>
                  <th className="text-start p-3">{L.joined}</th>
                  <th className="text-start p-3">{L.attendance}</th>
                  <th className="text-start p-3">{L.success}</th>
                  <th className="text-start p-3">{L.xp} / {L.level}</th>
                  <th className="text-end p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => {
                  const attRate = pct(r.attendance_present, r.attendance_total);
                  const succRate = r.avg_score ?? 0;
                  return (
                    <tr key={r.user_id} className="hover:bg-muted/40">
                      <td className="p-3">
                        <div className="font-medium truncate">{r.display_name || r.email || r.user_id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                      </td>
                      <td className="p-3">
                        {r.classes.length === 0 ? (
                          <Badge variant="outline" className="text-xs">{L.noClass}</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {r.classes.slice(0, 3).map((c) => (
                              <Badge key={c.id} variant="secondary" className="text-xs">
                                {c.name}{c.level ? ` · ${c.level}` : ""}
                              </Badge>
                            ))}
                            {r.classes.length > 3 && <Badge variant="outline" className="text-xs">+{r.classes.length - 3}</Badge>}
                          </div>
                        )}
                        {r.classes[0]?.teacher_name && (
                          <div className="text-xs text-muted-foreground mt-1">{L.teacher}: {r.classes[0].teacher_name}</div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">{fmtDate(r.joined_at)}</td>
                      <td className="p-3">
                        {r.attendance_total === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={attRate >= 75 ? "default" : attRate >= 50 ? "secondary" : "destructive"}>
                            {attRate}% ({r.attendance_present}/{r.attendance_total})
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {r.avg_score == null ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={succRate >= 60 ? "default" : succRate >= 40 ? "secondary" : "destructive"}>
                            {succRate}%
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Trophy className="h-3 w-3 inline text-amber-500 me-1" />
                        {r.xp} · L{r.level} · 🔥{r.streak}
                      </td>
                      <td className="p-3 text-end">
                        <StudentDetailDialog row={r} labels={L} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StudentDetailDialog({ row, labels }: { row: StudentRow; labels: Record<string, string> }) {
  const { tt } = useI18n();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<{ title: string; when: string; score: string; passed: boolean | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data: subs = [] } = await supabase
        .from("submissions")
        .select("id, score, total, status, submitted_at, created_at, assignment_id, assignments(title)")
        .eq("student_id", row.user_id)
        .order("created_at", { ascending: false })
        .limit(50);
      const list = (subs || []).map((s: any) => {
        const pctv = s.score != null && s.total ? Math.round((Number(s.score) / Number(s.total)) * 100) : null;
        return {
          title: s.assignments?.title || tt({ fr: "Examen", de: "Prüfung", ar: "امتحان" }),
          when: s.submitted_at || s.created_at,
          score: pctv != null ? `${s.score}/${s.total} (${pctv}%)` : String(s.status),
          passed: pctv == null ? null : pctv >= 50,
        };
      });
      setHistory(list);
      setLoading(false);
    })();
  }, [open, row.user_id, tt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><Info className="h-4 w-4 me-1" />{labels.details}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[calc(100vw-1rem)]">
        <DialogHeader>
          <DialogTitle>{row.display_name || row.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label={tt({ fr: "Email", de: "E-Mail", ar: "البريد" })} value={row.email} />
            <Field label={labels.joined} value={fmtDate(row.joined_at)} />
            <Field label={labels.xp} value={`${row.xp} · L${row.level} · 🔥${row.streak}`} />
            <Field label={labels.lastActivity} value={fmtDate(row.last_activity)} />
            <Field label={labels.attendance} value={
              row.attendance_total === 0 ? "—" : `${pct(row.attendance_present, row.attendance_total)}% (${row.attendance_present}/${row.attendance_total})`
            } />
            <Field label={labels.avg} value={row.avg_score == null ? "—" : `${row.avg_score}%`} />
            <Field label={labels.exams} value={`${row.submissions_passed}/${row.submissions_total}`} />
            <Field label={labels.homework} value={`${row.homework_done}/${row.homework_total}`} />
          </div>

          <div>
            <div className="font-medium mb-2 flex items-center gap-2"><Users className="h-4 w-4" />{labels.classes}</div>
            {row.classes.length === 0 ? (
              <div className="text-muted-foreground">{labels.noClass}</div>
            ) : (
              <ul className="space-y-1">
                {row.classes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between border rounded-md p-2">
                    <span className="font-medium">{c.name}{c.level ? ` · ${c.level}` : ""}</span>
                    <span className="text-xs text-muted-foreground">{labels.teacher}: {c.teacher_name || "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="font-medium mb-2 flex items-center gap-2"><BookOpen className="h-4 w-4" />
              {tt({ fr: "Historique des sessions & examens", de: "Sitzungs- & Prüfungsverlauf", ar: "سجل الجلسات والامتحانات" })}
            </div>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : history.length === 0 ? (
              <div className="text-muted-foreground">{tt({ fr: "Aucun historique.", de: "Kein Verlauf.", ar: "لا يوجد سجل." })}</div>
            ) : (
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between border rounded-md p-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{h.title}</div>
                      <div className="text-muted-foreground">{fmtDate(h.when)}</div>
                    </div>
                    <Badge variant={h.passed == null ? "outline" : h.passed ? "default" : "destructive"}>{h.score}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value ?? "—"}</div>
    </div>
  );
}

/* ============================================================
 * TEACHERS DIRECTORY
 * ==========================================================*/
export function TeachersDirectory({ schoolId }: { schoolId: string }) {
  const { tt } = useI18n();
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: mem = [] } = await supabase
        .from("school_members")
        .select("user_id, joined_at, approved_at, space_role, role, status")
        .eq("school_id", schoolId)
        .eq("status", "approved");
      const teachers = (mem || []).filter((m: any) =>
        m.space_role === "teacher" || m.space_role === "school_admin" ||
        m.space_role === "academic_director" || m.space_role === "pedagogical_coordinator" ||
        m.space_role === "examiner" ||
        (!m.space_role && (m.role === "teacher" || m.role === "owner"))
      );
      const tIds = teachers.map((t: any) => t.user_id);
      if (tIds.length === 0) { setRows([]); setLoading(false); return; }

      const { data: profs = [] } = await supabase
        .from("profiles").select("user_id, display_name, email").in("user_id", tIds);
      const profMap = new Map<string, MemberLite>();
      (profs || []).forEach((p: any) => profMap.set(p.user_id, p));

      const { data: classes = [] } = await supabase
        .from("classes").select("id, name, level, teacher_id")
        .eq("school_id", schoolId).in("teacher_id", tIds);
      const classById = new Map<string, ClassRow>();
      (classes || []).forEach((c: any) => classById.set(c.id, c));

      // Roster & submissions per class
      const classIds = (classes || []).map((c: any) => c.id);
      const { data: cm = [] } = classIds.length ? await supabase
        .from("class_members").select("class_id, student_id").in("class_id", classIds) : { data: [] as any[] };
      const classStudents = new Map<string, string[]>();
      (cm || []).forEach((r: any) => {
        const arr = classStudents.get(r.class_id) || [];
        arr.push(r.student_id); classStudents.set(r.class_id, arr);
      });

      // Fetch submissions & assignments in this school to compute pass/fail per student per class
      const { data: assignments = [] } = classIds.length ? await supabase
        .from("assignments").select("id, class_id").in("class_id", classIds) : { data: [] as any[] };
      const assignmentToClass = new Map<string, string>();
      (assignments || []).forEach((a: any) => assignmentToClass.set(a.id, a.class_id));
      const assignmentIds = (assignments || []).map((a: any) => a.id);
      const { data: subs = [] } = assignmentIds.length ? await supabase
        .from("submissions").select("assignment_id, student_id, score, total")
        .in("assignment_id", assignmentIds) : { data: [] as any[] };
      // avg per (class, student)
      const key = (c: string, s: string) => `${c}::${s}`;
      const csAgg = new Map<string, { sum: number; n: number }>();
      (subs || []).forEach((s: any) => {
        const cid = assignmentToClass.get(s.assignment_id);
        if (!cid || s.score == null || !s.total) return;
        const p = (Number(s.score) / Number(s.total)) * 100;
        const k = key(cid, s.student_id);
        const a = csAgg.get(k) || { sum: 0, n: 0 };
        a.sum += p; a.n += 1; csAgg.set(k, a);
      });

      const memMeta = new Map<string, any>();
      (teachers || []).forEach((m: any) => memMeta.set(m.user_id, m));

      const out: TeacherRow[] = tIds.map((tid) => {
        const p = profMap.get(tid);
        const meta = memMeta.get(tid);
        const tClasses = (classes || []).filter((c: any) => c.teacher_id === tid);
        return {
          user_id: tid,
          display_name: p?.display_name || null,
          email: p?.email || null,
          joined_at: meta?.joined_at || null,
          approved_at: meta?.approved_at || null,
          classes: tClasses.map((c: any) => {
            const studs = classStudents.get(c.id) || [];
            let passed = 0, failed = 0;
            studs.forEach((sid) => {
              const a = csAgg.get(key(c.id, sid));
              if (!a || a.n === 0) return;
              const avg = a.sum / a.n;
              if (avg >= 50) passed += 1; else failed += 1;
            });
            return {
              id: c.id, name: c.name, level: c.level,
              students_count: studs.length,
              students_passed: passed,
              students_failed: failed,
            };
          }),
        };
      });
      setRows(out.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
      setLoading(false);
    })();
  }, [schoolId]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return rows;
    return rows.filter((r) =>
      (r.display_name || "").toLowerCase().includes(s) ||
      (r.email || "").toLowerCase().includes(s) ||
      r.classes.some((c) => (c.name || "").toLowerCase().includes(s)),
    );
  }, [rows, q]);

  const L = {
    title: tt({ fr: "Annuaire des professeurs", de: "Lehrerverzeichnis", ar: "دليل المعلمين" }),
    search: tt({ fr: "Rechercher (nom, email, classe)…", de: "Suche…", ar: "بحث…" }),
    hired: tt({ fr: "Embauche", de: "Eingestellt", ar: "تاريخ التعيين" }),
    classes: tt({ fr: "Classes", de: "Klassen", ar: "الصفوف" }),
    students: tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" }),
    passed: tt({ fr: "Réussis", de: "Bestanden", ar: "ناجحون" }),
    failed: tt({ fr: "Échoués", de: "Nicht bestanden", ar: "راسبون" }),
    details: tt({ fr: "Détails", de: "Details", ar: "التفاصيل" }),
    empty: tt({ fr: "Aucun professeur trouvé.", de: "Keine Lehrkräfte gefunden.", ar: "لا يوجد معلمون." }),
    levels: tt({ fr: "Niveaux enseignés", de: "Unterrichtete Stufen", ar: "المستويات" }),
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {L.title}
          <Badge variant="outline" className="ml-2">{filtered.length}</Badge>
        </CardTitle>
        <div className="relative mt-2 max-w-md">
          <Search className="h-4 w-4 absolute start-2.5 top-2.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.search} className="ps-8 h-9" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">{L.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-start p-3">{tt({ fr: "Professeur", de: "Lehrkraft", ar: "المعلم" })}</th>
                  <th className="text-start p-3">{L.hired}</th>
                  <th className="text-start p-3">{L.classes}</th>
                  <th className="text-start p-3">{L.levels}</th>
                  <th className="text-start p-3">{L.students}</th>
                  <th className="text-start p-3">{L.passed}/{L.failed}</th>
                  <th className="text-end p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => {
                  const totalStudents = r.classes.reduce((n, c) => n + c.students_count, 0);
                  const passed = r.classes.reduce((n, c) => n + c.students_passed, 0);
                  const failed = r.classes.reduce((n, c) => n + c.students_failed, 0);
                  const levels = Array.from(new Set(r.classes.map((c) => c.level).filter(Boolean)));
                  return (
                    <tr key={r.user_id} className="hover:bg-muted/40">
                      <td className="p-3">
                        <div className="font-medium truncate">{r.display_name || r.email || r.user_id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Calendar className="h-3 w-3 inline me-1 text-muted-foreground" />
                        {fmtDate(r.joined_at)}
                      </td>
                      <td className="p-3">
                        {r.classes.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {r.classes.slice(0, 4).map((c) => (
                              <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>
                            ))}
                            {r.classes.length > 4 && <Badge variant="outline" className="text-xs">+{r.classes.length - 4}</Badge>}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {levels.map((l) => <Badge key={l as string} variant="outline" className="text-xs">{l}</Badge>)}
                          {levels.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="p-3">{totalStudents}</td>
                      <td className="p-3">
                        <span className="text-emerald-600 font-medium">{passed}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-destructive font-medium">{failed}</span>
                      </td>
                      <td className="p-3 text-end">
                        <TeacherDetailDialog row={r} labels={L} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeacherDetailDialog({ row, labels }: { row: TeacherRow; labels: Record<string, string> }) {
  const { tt } = useI18n();
  const [open, setOpen] = useState(false);
  const [rosterByClass, setRosterByClass] = useState<Record<string, { student_id: string; name: string; email: string | null; avg: number | null }[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || row.classes.length === 0) return;
    (async () => {
      setLoading(true);
      const classIds = row.classes.map((c) => c.id);
      const { data: cm = [] } = await supabase.from("class_members").select("class_id, student_id").in("class_id", classIds);
      const studentIds = Array.from(new Set((cm || []).map((r: any) => r.student_id)));
      if (!studentIds.length) { setRosterByClass({}); setLoading(false); return; }
      const [{ data: profs = [] }, { data: assignments = [] }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, email").in("user_id", studentIds),
        supabase.from("assignments").select("id, class_id").in("class_id", classIds),
      ]);
      const profMap = new Map<string, any>();
      (profs || []).forEach((p: any) => profMap.set(p.user_id, p));
      const aToC = new Map<string, string>();
      (assignments || []).forEach((a: any) => aToC.set(a.id, a.class_id));
      const aIds = (assignments || []).map((a: any) => a.id);
      const { data: subs = [] } = aIds.length ? await supabase
        .from("submissions").select("assignment_id, student_id, score, total")
        .in("assignment_id", aIds).in("student_id", studentIds) : { data: [] as any[] };
      const key = (c: string, s: string) => `${c}::${s}`;
      const agg = new Map<string, { sum: number; n: number }>();
      (subs || []).forEach((s: any) => {
        const cid = aToC.get(s.assignment_id);
        if (!cid || s.score == null || !s.total) return;
        const p = (Number(s.score) / Number(s.total)) * 100;
        const a = agg.get(key(cid, s.student_id)) || { sum: 0, n: 0 };
        a.sum += p; a.n += 1; agg.set(key(cid, s.student_id), a);
      });
      const out: Record<string, any[]> = {};
      classIds.forEach((cid) => { out[cid] = []; });
      (cm || []).forEach((r: any) => {
        const p = profMap.get(r.student_id);
        const a = agg.get(key(r.class_id, r.student_id));
        out[r.class_id].push({
          student_id: r.student_id,
          name: p?.display_name || p?.email || r.student_id.slice(0, 8),
          email: p?.email || null,
          avg: a && a.n > 0 ? Math.round(a.sum / a.n) : null,
        });
      });
      Object.keys(out).forEach((k) => out[k].sort((x, y) => x.name.localeCompare(y.name)));
      setRosterByClass(out);
      setLoading(false);
    })();
  }, [open, row]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><Info className="h-4 w-4 me-1" />{labels.details}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto w-[calc(100vw-1rem)]">
        <DialogHeader>
          <DialogTitle>{row.display_name || row.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label={tt({ fr: "Email", de: "E-Mail", ar: "البريد" })} value={row.email} />
            <Field label={labels.hired} value={fmtDate(row.joined_at)} />
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : row.classes.length === 0 ? (
            <div className="text-muted-foreground">
              {tt({ fr: "Aucune classe assignée.", de: "Keine Klasse zugewiesen.", ar: "لا يوجد صف معيّن." })}
            </div>
          ) : (
            <div className="space-y-3">
              {row.classes.map((c) => (
                <div key={c.id} className="border rounded-lg">
                  <div className="p-3 border-b bg-muted/30 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        {c.name}
                        {c.level && <Badge variant="outline">{c.level}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.students_count} {labels.students} ·{" "}
                        <span className="text-emerald-600">{c.students_passed} {labels.passed}</span> ·{" "}
                        <span className="text-destructive">{c.students_failed} {labels.failed}</span>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y">
                    {(rosterByClass[c.id] || []).length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground">
                        {tt({ fr: "Aucun élève.", de: "Keine Schüler.", ar: "لا يوجد طلاب." })}
                      </div>
                    ) : (
                      (rosterByClass[c.id] || []).map((s) => (
                        <div key={s.student_id} className="p-2 px-3 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{s.name}</div>
                            <div className="text-muted-foreground truncate">{s.email}</div>
                          </div>
                          {s.avg == null ? (
                            <Badge variant="outline">—</Badge>
                          ) : (
                            <Badge variant={s.avg >= 50 ? "default" : "destructive"}>{s.avg}%</Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
