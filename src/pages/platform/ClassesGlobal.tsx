import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, BookOpenCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  name: string;
  level: string | null;
  status: string | null;
  school_id: string;
  school_name: string | null;
  teacher_name: string | null;
  students: number;
};

export default function ClassesGlobal() {
  const { tt } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const sb = supabase as any;
      const { data: classes, error } = await sb
        .from("classes")
        .select("id,name,level,status,school_id,teacher_id,schools(name)")
        .order("created_at", { ascending: false });
      if (error) console.error("classes load", error);

      const list = classes || [];
      const teacherIds = Array.from(new Set(list.map((c: any) => c.teacher_id).filter(Boolean)));
      const classIds = list.map((c: any) => c.id);

      const [profilesRes, membersRes] = await Promise.all([
        teacherIds.length
          ? sb.from("profiles").select("user_id,display_name").in("user_id", teacherIds)
          : Promise.resolve({ data: [] }),
        classIds.length
          ? sb.from("class_members").select("class_id").in("class_id", classIds)
          : Promise.resolve({ data: [] }),
      ]);

      const teacherMap = new Map<string, string>();
      (profilesRes.data || []).forEach((p: any) => teacherMap.set(p.user_id, p.display_name));
      const countMap = new Map<string, number>();
      (membersRes.data || []).forEach((m: any) => countMap.set(m.class_id, (countMap.get(m.class_id) || 0) + 1));

      setRows(list.map((c: any) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        status: c.status,
        school_id: c.school_id,
        school_name: c.schools?.name ?? null,
        teacher_name: c.teacher_id ? teacherMap.get(c.teacher_id) ?? null : null,
        students: countMap.get(c.id) || 0,
      })));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    !q || `${r.name} ${r.school_name} ${r.teacher_name} ${r.level}`.toLowerCase().includes(q.toLowerCase())
  ), [rows, q]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2"><BookOpenCheck className="h-7 w-7 text-indigo-600" /> {tt({ fr: "Classes globales", de: "Globale Klassen", ar: "الفصول العامة" })}</h1>
        <p className="text-muted-foreground mt-1">{tt({ fr: "Toutes les classes de toutes les écoles.", de: "Alle Klassen aller Schulen.", ar: "جميع الفصول لكل المدارس." })}</p>
      </header>
      <div className="relative mb-4 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt({ fr: "Rechercher (classe, école, prof, niveau)…", de: "Suche (Klasse, Schule, Lehrkraft, Stufe)…", ar: "ابحث (فصل، مدرسة، معلم، مستوى)…" })} className="pl-9" />
      </div>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3">{tt({ fr: "Classe", de: "Klasse", ar: "الفصل" })}</th>
              <th className="text-left px-4 py-3">{tt({ fr: "École", de: "Schule", ar: "المدرسة" })}</th>
              <th className="text-left px-4 py-3">{tt({ fr: "Professeur", de: "Lehrkraft", ar: "المعلم" })}</th>
              <th className="text-left px-4 py-3">{tt({ fr: "Niveau", de: "Stufe", ar: "المستوى" })}</th>
              <th className="text-left px-4 py-3">{tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" })}</th>
              <th className="text-left px-4 py-3">{tt({ fr: "Statut", de: "Status", ar: "الحالة" })}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{tt({ fr: "Chargement…", de: "Wird geladen…", ar: "جارٍ التحميل…" })}</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{tt({ fr: "Aucune classe.", de: "Keine Klassen.", ar: "لا توجد فصول." })}</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3"><Link to={`/platform-admin/schools/${r.school_id}`} className="text-primary hover:underline">{r.school_name || "—"}</Link></td>
                <td className="px-4 py-3 text-muted-foreground">{r.teacher_name || "—"}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-slate-500/15">{r.level || "—"}</span></td>
                <td className="px-4 py-3">{r.students}</td>
                <td className="px-4 py-3 text-xs">{r.status || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
