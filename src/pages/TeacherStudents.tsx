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
import { MessageSquare, Search, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Row = {
  student_id: string;
  display_name: string | null;
  email: string | null;
  class_id: string;
  class_name: string;
  level: string | null;
};

const initials = (n?: string | null) =>
  (n || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

export default function TeacherStudents() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, level, teacher_id")
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
          });
        });
      }
      setRows(list);
      setLoading(false);
    })();
  }, [user?.id]);

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
              {filtered.map((r) => (
                <div key={r.student_id + r.class_id} className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/15 text-primary text-sm">{initials(r.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.display_name || r.email || r.student_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                  </div>
                  <Badge variant="outline">{r.class_name}{r.level ? ` · ${r.level}` : ""}</Badge>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/messages?peer=${r.student_id}`}>
                      <MessageSquare className="h-3.5 w-3.5 me-1" />
                      {tt({ fr: "Message", de: "Nachricht", ar: "رسالة" })}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SchoolLayout>
  );
}
