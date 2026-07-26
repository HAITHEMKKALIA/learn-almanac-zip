import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, BookOpenCheck, GraduationCap, Users, ChevronRight, TreePine } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type SchoolNode = {
  id: string;
  name: string;
  city: string | null;
  status: string;
  classes: { id: string; name: string; level: string | null; teacher: string | null; students: number }[];
  members: { teachers: number; students: number };
};

export default function Structure() {
  const { tt } = useI18n();
  const [nodes, setNodes] = useState<SchoolNode[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const [{ data: schools }, { data: classes }, { data: members }] = await Promise.all([
        sb.from("schools").select("id,name,city,status").order("name"),
        sb.from("classes").select("id,name,level,school_id,profiles:profiles!classes_teacher_id_fkey(display_name),class_members(count)"),
        sb.from("school_members").select("school_id, role"),
      ]);
      const classesBySchool = new Map<string, any[]>();
      (classes || []).forEach((c: any) => {
        const arr = classesBySchool.get(c.school_id) || [];
        arr.push({ id: c.id, name: c.name, level: c.level, teacher: c.profiles?.display_name || null, students: c.class_members?.[0]?.count ?? 0 });
        classesBySchool.set(c.school_id, arr);
      });
      const counts = new Map<string, { teachers: number; students: number }>();
      (members || []).forEach((m: any) => {
        const v = counts.get(m.school_id) || { teachers: 0, students: 0 };
        if (m.role === "teacher" || m.role === "owner") v.teachers++;
        else if (m.role === "student") v.students++;
        counts.set(m.school_id, v);
      });
      setNodes((schools || []).map((s: any) => ({
        id: s.id, name: s.name, city: s.city, status: s.status,
        classes: classesBySchool.get(s.id) || [],
        members: counts.get(s.id) || { teachers: 0, students: 0 },
      })));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2"><TreePine className="h-7 w-7 text-emerald-600" /> {tt({ fr: "Structure", de: "Struktur", ar: "الهيكل" })}</h1>
        <p className="text-muted-foreground mt-1">{tt({ fr: "Arborescence écoles → classes → membres.", de: "Baumstruktur: Schulen → Klassen → Mitglieder.", ar: "شجرة: المدارس ← الفصول ← الأعضاء." })}</p>
      </header>

      {loading && <div className="text-center text-muted-foreground py-10">{tt({ fr: "Chargement…", de: "Wird geladen…", ar: "جارٍ التحميل…" })}</div>}
      <div className="space-y-3">
        {nodes.map((n) => {
          const isOpen = open[n.id] ?? false;
          return (
            <div key={n.id} className="rounded-2xl border bg-card overflow-hidden">
              <button
                onClick={() => setOpen((o) => ({ ...o, [n.id]: !isOpen }))}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 text-left"
              >
                <ChevronRight className={`h-4 w-4 transition ${isOpen ? "rotate-90" : ""}`} />
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{n.name}</div>
                  <div className="text-xs text-muted-foreground">{n.city || "—"}</div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpenCheck className="h-3 w-3" /> {n.classes.length}</span>
                  <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {n.members.teachers}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {n.members.students}</span>
                  <Link to={`/platform-admin/schools/${n.id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{tt({ fr: "Ouvrir", de: "Öffnen", ar: "فتح" })}</Link>
                </div>
              </button>
              {isOpen && (
                <div className="border-t bg-muted/10 px-5 py-3">
                  {n.classes.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-3">{tt({ fr: "Aucune classe.", de: "Keine Klassen.", ar: "لا توجد فصول." })}</div>
                  ) : (
                    <ul className="space-y-1">
                      {n.classes.map((c) => (
                        <li key={c.id} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-background">
                          <BookOpenCheck className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-500/15">{c.level || "—"}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {c.teacher ? `${tt({ fr: "Prof", de: "Lehrkraft", ar: "معلم" })}: ${c.teacher}` : tt({ fr: "Pas de prof", de: "Keine Lehrkraft", ar: "لا يوجد معلم" })} · {c.students} {tt({ fr: "élèves", de: "Schüler", ar: "طلاب" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
