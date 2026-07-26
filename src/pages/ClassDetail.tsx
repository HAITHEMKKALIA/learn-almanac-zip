import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Users, ClipboardList, Copy, NotebookPen, Eye, ShieldAlert,
  CheckCircle2, XCircle, Clock, AlertTriangle, GraduationCap, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/school/UserAvatar";
import { useI18n } from "@/lib/i18n";
import { PromoteStudentsDialog } from "@/components/school/PromoteStudentsDialog";
import { AcademyMotionPage, AcademyMetricCard, AcademyStatGrid, AcademyStatItem } from "@/components/academy/AcademyUI";

type Member = {
  student_id: string;
  joined_at: string;
  display_name: string;
  gender: "male" | "female" | "other" | null;
  avatar_url: string | null;
  online: boolean;
  attendance: "present" | "absent" | "late" | "excused" | null;
  homework: { total: number; submitted: number; graded: number; pending: number };
  exam: { status: "not_started" | "in_progress" | "submitted" | "graded" | null; violations: number; score: number | null; total: number | null };
};

const today = () => new Date().toISOString().slice(0, 10);

export default function ClassDetail() {
  const { id } = useParams();
  const { user, onlineUserIds } = useAuth();
  const { tt, rtl } = useI18n();
  const [klass, setKlass] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [teacherOnline, setTeacherOnline] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"presence" | "homework" | "exam">("presence");
  const [syncing, setSyncing] = useState(false);
  const onlineUserIdsRef = useRef(onlineUserIds);
  const memberIdsKey = useMemo(() => members.map(m => m.student_id).join("|"), [members]);

  const syncNow = async () => {
    setSyncing(true);
    try {
      const count = await load();
      toast.success(tt({ fr: `Synchronisé · ${count} élève(s)`, de: `Synchronisiert · ${count} Schüler`, ar: `تمت المزامنة · ${count} تلميذ` }));
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setSyncing(false);
    }
  };

  const isTeacher = user?.id && klass?.teacher_id === user.id;

  const load = async () => {
    if (!id) return 0;
    const [k, roster, a, h] = await Promise.all([
      supabase.from("classes").select("*").eq("id", id).maybeSingle(),
      (supabase as any).rpc("get_class_roster", { _class_id: id }),
      supabase.from("assignments").select("*").eq("class_id", id).order("created_at", { ascending: false }),
      supabase.from("homework").select("id, title, category, due_at, status").eq("class_id", id).order("created_at", { ascending: false }),
    ]);
    if (k.error) throw k.error;
    if (roster.error) throw roster.error;
    setKlass(k.data);
    setAssignments(a.data || []);
    setHomeworkList(h.data || []);

    const rosterRows = (roster.data || []) as any[];
    const studentIds = rosterRows.map((x: any) => x.student_id);
    const teacherId = k.data?.teacher_id;
    if (teacherId) {
      const teacherProfile = (await supabase.from("profiles")
        .select("user_id, display_name, email, gender, avatar_url")
        .eq("user_id", teacherId)
        .maybeSingle()).data;
      setTeacher(teacherProfile);
    } else {
      setTeacher(null);
    }
    if (studentIds.length === 0) { setMembers([]); return 0; }

    // Today attendance
    const att = (await supabase.from("class_attendance")
      .select("student_id, status")
      .eq("class_id", id).eq("session_date", today())).data || [];
    const attMap = new Map(att.map((a: any) => [a.student_id, a.status]));

    // Homework submissions for this class
    const hwIds = (h.data || []).map((x: any) => x.id);
    const subs = hwIds.length
      ? (await supabase.from("homework_submissions")
          .select("homework_id, student_id, status").in("homework_id", hwIds)).data || []
      : [];

    // Active exam (open)
    const openExam = (a.data || []).find((x: any) => x.status === "open");
    setActiveExamId(openExam?.id || null);
    const exSubs = openExam
      ? (await supabase.from("submissions")
          .select("student_id, status, score, total").eq("assignment_id", openExam.id)).data || []
      : [];
    const exSubMap = new Map(exSubs.map((s: any) => [s.student_id, s]));

    const ms: Member[] = rosterRows.map((mb: any) => {
      const hwTotal = hwIds.length;
      const mySubs = subs.filter((s: any) => s.student_id === mb.student_id);
      const submitted = mySubs.length;
      const graded = mySubs.filter((s: any) => s.status === "graded").length;
      const ex = exSubMap.get(mb.student_id) as any;
      return {
        student_id: mb.student_id,
        joined_at: mb.joined_at,
        display_name: mb.display_name || mb.email?.split("@")[0] || mb.student_id.slice(0, 8),
        gender: mb.gender || null,
        avatar_url: mb.avatar_url || null,
        online: onlineUserIdsRef.current.has(mb.student_id),
        attendance: (attMap.get(mb.student_id) as any) || null,
        homework: { total: hwTotal, submitted, graded, pending: hwTotal - submitted },
        exam: {
          status: ex?.status || null,
          violations: 0,
          score: ex?.score ?? null,
          total: ex?.total ?? null,
        },
      };
    });
    setMembers(ms);
    return ms.length;
  };

  useEffect(() => { load(); }, [id]);

  // Apply global presence to members + teacher
  useEffect(() => {
    onlineUserIdsRef.current = onlineUserIds;
    setMembers(prev => {
      let changed = false;
      const next = prev.map(m => {
        const online = onlineUserIds.has(m.student_id);
        if (m.online === online) return m;
        changed = true;
        return { ...m, online };
      });
      return changed ? next : prev;
    });
    setTeacherOnline(teacher?.user_id ? onlineUserIds.has(teacher.user_id) : false);
  }, [onlineUserIds, teacher?.user_id, memberIdsKey]);

  // Realtime DB updates for this class
  useEffect(() => {
    if (!id || !user) return;
    const channel = supabase.channel(`class-db:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "class_attendance", filter: `class_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "class_members", filter: `class_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `class_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "homework_submissions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user]);

  const copyCode = () => { if (klass) { navigator.clipboard.writeText(klass.invite_code); toast.success(tt({ fr: "Code copié", de: "Code kopiert", ar: "تم النسخ" })); } };

  const setAttendance = async (studentId: string, status: "present" | "absent" | "late" | "excused") => {
    if (!isTeacher) return;
    const { error } = await supabase.from("class_attendance").upsert({
      class_id: id, student_id: studentId, session_date: today(), status, marked_by: user!.id,
    } as any, { onConflict: "class_id,student_id,session_date" });
    if (error) toast.error(error.message);
  };

  const stats = useMemo(() => {
    const present = members.filter(m => m.attendance === "present" || (m.attendance === null && m.online)).length;
    const absent = members.filter(m => m.attendance === "absent").length;
    const online = members.filter(m => m.online).length;
    return { present, absent, online, total: members.length };
  }, [members]);

  if (!klass) return <div className="p-6">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
      <AcademyMotionPage>
        <div className="space-y-4">
        <Link to="/teacher" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
          <ArrowLeft className={`w-3 h-3 ${rtl ? "rotate-180" : ""}`}/>{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {klass.name} <Badge>{klass.level}</Badge>
            </h1>
            <button onClick={copyCode} className="mt-2 inline-flex items-center gap-2 bg-muted/50 px-3 py-1 rounded font-mono text-sm hover:bg-muted">
              {klass.invite_code} <Copy className="w-3 h-3"/>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={syncNow} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 me-1 ${syncing ? "animate-spin" : ""}`}/>
              {tt({ fr: "Synchroniser maintenant", de: "Jetzt synchronisieren", ar: "مزامنة الآن" })}
            </Button>
            {(["presence","homework","exam"] as const).map(v => (
              <Button key={v} size="sm" variant={activeView === v ? "default" : "outline"} onClick={() => setActiveView(v)}>
                {v === "presence" && <><Users className="w-4 h-4 me-1"/>{tt({ fr: "Présence", de: "Anwesenheit", ar: "الحضور" })}</>}
                {v === "homework" && <><NotebookPen className="w-4 h-4 me-1"/>{tt({ fr: "Devoirs", de: "Hausaufgaben", ar: "الواجبات" })}</>}
                {v === "exam" && <><ShieldAlert className="w-4 h-4 me-1"/>{tt({ fr: "Examen", de: "Prüfung", ar: "الامتحان" })}</>}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <AcademyStatGrid className="!grid-cols-2 md:!grid-cols-4">
          <AcademyStatItem><AcademyMetricCard icon={<GraduationCap className="w-4 h-4"/>} label={tt({ fr: "Élèves", de: "Schüler", ar: "التلاميذ" })} value={stats.total} accent="primary"/></AcademyStatItem>
          <AcademyStatItem><AcademyMetricCard icon={<span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"/>} label={tt({ fr: "En ligne", de: "Online", ar: "متصل" })} value={stats.online} accent="success"/></AcademyStatItem>
          <AcademyStatItem><AcademyMetricCard icon={<CheckCircle2 className="w-4 h-4"/>} label={tt({ fr: "Présents", de: "Anwesend", ar: "حاضرون" })} value={stats.present} accent="accent"/></AcademyStatItem>
          <AcademyStatItem><AcademyMetricCard icon={<XCircle className="w-4 h-4"/>} label={tt({ fr: "Absents", de: "Abwesend", ar: "غائبون" })} value={stats.absent} accent="warning"/></AcademyStatItem>
        </AcademyStatGrid>

        {/* Virtual classroom */}
        <Card className="overflow-hidden border-2 border-amber-900/20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/40 via-background to-background dark:from-amber-950/20">
          <CardContent className="p-6">
            {/* Whiteboard */}
            <div className="mb-6 mx-auto max-w-2xl rounded-lg bg-gradient-to-b from-emerald-900 to-emerald-950 text-emerald-50 p-4 text-center shadow-lg border-4 border-amber-900/40">
              <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{tt({ fr: "Tableau", de: "Tafel", ar: "السبورة" })}</div>
              <div className="font-display text-lg">
                {activeView === "presence" && tt({ fr: "Salle de classe virtuelle", de: "Virtuelles Klassenzimmer", ar: "الفصل الافتراضي" })}
                {activeView === "homework" && `${homeworkList.length} ${tt({ fr: "devoir(s) actif(s)", de: "aktive Aufgaben", ar: "واجبات نشطة" })}`}
                {activeView === "exam" && (activeExamId ? tt({ fr: "Examen en cours", de: "Prüfung läuft", ar: "امتحان جارٍ" }) : tt({ fr: "Aucun examen ouvert", de: "Keine offene Prüfung", ar: "لا امتحان مفتوح" }))}
              </div>
            </div>

            {/* Teacher desk */}
            <div className="flex justify-center mb-8">
              <div className="flex flex-col items-center gap-1">
                <UserAvatar
                  name={teacher?.display_name || "—"}
                  url={teacher?.avatar_url}
                  gender={teacher?.gender}
                  size="xl"
                  ring={teacherOnline ? "online" : "offline"}
                />
                <div className="text-xs font-semibold mt-1">{teacher?.display_name || tt({ fr: "Professeur", de: "Lehrer", ar: "الأستاذ" })}</div>
                <Badge variant="outline" className="text-[10px]">{tt({ fr: "Bureau du prof", de: "Lehrerpult", ar: "مكتب الأستاذ" })}</Badge>
                <div className="mt-1 h-3 w-32 rounded-t bg-amber-900/60"/>
                <div className="h-1 w-40 rounded bg-amber-950/80"/>
              </div>
            </div>

            {/* Student tables */}
            {members.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40"/>
                <p>{tt({ fr: "Aucun élève. Partagez le code.", de: "Keine Schüler. Teilen Sie den Code.", ar: "لا يوجد تلاميذ. شارك الرمز." })}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {members.map(m => <StudentDesk key={m.student_id} m={m} view={activeView} canMark={!!isTeacher} onMark={setAttendance} />)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail tables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="w-4 h-4"/>
              {activeView === "homework" ? tt({ fr: "Devoirs", de: "Hausaufgaben", ar: "الواجبات" }) :
               activeView === "exam" ? tt({ fr: "Examens", de: "Prüfungen", ar: "الامتحانات" }) :
               tt({ fr: "Liste des élèves", de: "Schülerliste", ar: "قائمة التلاميذ" })}
            </CardTitle>
            <div className="flex gap-2">
              {isTeacher && klass?.school_id && (
                <PromoteStudentsDialog
                  students={members.map((m) => ({ student_id: m.student_id, display_name: m.display_name }))}
                  currentClass={{ id: klass.id, school_id: klass.school_id, level: klass.level }}
                  onDone={load}
                />
              )}
              <Link to={activeView === "homework" ? "/teacher/homework" : "/teacher/assignments"}>
                <Button size="sm" variant="outline">{tt({ fr: "Gérer", de: "Verwalten", ar: "إدارة" })}</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeView === "presence" && <PresenceList members={members} canMark={!!isTeacher} onMark={setAttendance} t={tt} />}
            {activeView === "homework" && <HomeworkList items={homeworkList} t={tt}/>}
            {activeView === "exam" && <ExamList items={assignments} t={tt}/>}
          </CardContent>
        </Card>
        </div>
      </AcademyMotionPage>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: any) {
  const cls = accent === "emerald" ? "text-emerald-600" : accent === "destructive" ? "text-destructive" : accent === "primary" ? "text-primary" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`text-2xl font-bold ${cls}`}>{value}</div>
        </div>
        <div className={cls}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function StudentDesk({ m, view, canMark, onMark }: { m: Member; view: "presence"|"homework"|"exam"; canMark: boolean; onMark: (id: string, s: any) => void }) {
  const ring =
    view === "presence" ? (m.attendance === "absent" ? "danger" : m.attendance === "late" ? "warning" : (m.online || m.attendance === "present") ? "online" : "offline") :
    view === "homework" ? (m.homework.total === 0 ? "none" : m.homework.submitted >= m.homework.total ? "online" : m.homework.submitted > 0 ? "warning" : "danger") :
    /* exam */          (m.exam.status === "submitted" || m.exam.status === "graded" ? "online" : m.exam.status === "in_progress" ? "warning" : m.exam.status ? "danger" : "offline");

  const badge =
    view === "presence" ? (
      m.attendance === "absent" ? <Badge variant="destructive" className="text-[9px]">{m.attendance}</Badge> :
      m.attendance ? <Badge variant="outline" className="text-[9px]">{m.attendance}</Badge> :
      m.online ? <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[9px]">online</Badge> :
      <Badge variant="outline" className="text-[9px]">offline</Badge>
    ) :
    view === "homework" ? (
      <Badge variant="outline" className="text-[9px]">{m.homework.submitted}/{m.homework.total}</Badge>
    ) :
    /* exam */ (
      m.exam.status === "submitted" || m.exam.status === "graded" ? <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[9px]">{m.exam.status}</Badge> :
      m.exam.status === "in_progress" ? <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[9px]">en cours</Badge> :
      m.exam.status ? <Badge variant="destructive" className="text-[9px]">{m.exam.status}</Badge> :
      <Badge variant="outline" className="text-[9px]">—</Badge>
    );

  return (
    <div className="flex flex-col items-center gap-1 group">
      <UserAvatar name={m.display_name} url={m.avatar_url} gender={m.gender} size="lg" ring={ring as any} />
      <div className="text-xs font-medium truncate w-full text-center">{m.display_name}</div>
      {badge}
      {/* desk */}
      <div className="mt-1 h-2 w-24 rounded-t bg-stone-400/70 dark:bg-stone-700"/>
      <div className="h-0.5 w-28 rounded bg-stone-500/70 dark:bg-stone-800"/>
      {canMark && view === "presence" && (
        <div className="opacity-0 group-hover:opacity-100 transition flex gap-1 mt-1">
          <button title="présent" onClick={() => onMark(m.student_id, "present")} className="p-1 rounded hover:bg-emerald-500/20"><CheckCircle2 className="w-3 h-3 text-emerald-600"/></button>
          <button title="retard" onClick={() => onMark(m.student_id, "late")} className="p-1 rounded hover:bg-amber-500/20"><Clock className="w-3 h-3 text-amber-600"/></button>
          <button title="absent" onClick={() => onMark(m.student_id, "absent")} className="p-1 rounded hover:bg-destructive/20"><XCircle className="w-3 h-3 text-destructive"/></button>
        </div>
      )}
    </div>
  );
}

function PresenceList({ members, canMark, onMark, t }: any) {
  if (members.length === 0) return <p className="text-sm text-muted-foreground">{t({ fr: "Aucun élève.", de: "Keine Schüler.", ar: "لا تلاميذ." })}</p>;
  return (
    <div className="divide-y">
      {members.map((m: Member) => (
        <div key={m.student_id} className="py-2 flex items-center gap-3 text-sm">
          <UserAvatar name={m.display_name} url={m.avatar_url} gender={m.gender} size="sm" ring={m.online ? "online" : "offline"} />
          <div className="flex-1 min-w-0 truncate">{m.display_name}</div>
          {m.attendance && <Badge variant="outline" className="text-[10px]">{m.attendance}</Badge>}
          {canMark && (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => onMark(m.student_id, "present")}><CheckCircle2 className="w-4 h-4 text-emerald-600"/></Button>
              <Button size="sm" variant="ghost" onClick={() => onMark(m.student_id, "late")}><Clock className="w-4 h-4 text-amber-600"/></Button>
              <Button size="sm" variant="ghost" onClick={() => onMark(m.student_id, "absent")}><XCircle className="w-4 h-4 text-destructive"/></Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HomeworkList({ items, t }: any) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t({ fr: "Aucun devoir.", de: "Keine Hausaufgaben.", ar: "لا واجبات." })}</p>;
  return (
    <div className="space-y-2">
      {items.map((h: any) => (
        <div key={h.id} className="border rounded p-3 flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">{h.title}</div>
            <div className="text-xs text-muted-foreground">{h.category} · {h.due_at ? new Date(h.due_at).toLocaleDateString() : "—"}</div>
          </div>
          <Badge variant={h.status === "open" ? "default" : "secondary"}>{h.status}</Badge>
        </div>
      ))}
    </div>
  );
}

function ExamList({ items, t }: any) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t({ fr: "Aucun examen.", de: "Keine Prüfungen.", ar: "لا امتحانات." })}</p>;
  return (
    <div className="space-y-2">
      {items.map((a: any) => (
        <div key={a.id} className="border rounded p-3 flex items-center justify-between gap-2">
          <div>
            <div className="font-medium text-sm">{a.title}</div>
            <div className="text-xs text-muted-foreground">{a.duration_minutes} min · {a.status}</div>
          </div>
          <div className="flex gap-2 items-center">
            {a.lockdown_strict && <Badge variant="destructive" className="text-[10px]"><ShieldAlert className="w-3 h-3 me-1"/>strict</Badge>}
            <Link to={`/teacher/assignments/${a.id}`}><Button size="sm" variant="ghost"><Eye className="w-4 h-4"/></Button></Link>
          </div>
        </div>
      ))}
    </div>
  );
}
