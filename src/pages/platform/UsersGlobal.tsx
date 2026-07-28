import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type Row = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  approved: boolean;
  schools: string[];
};

const PAGE_SIZE = 25;

export default function UsersGlobal({ role }: { role: "teacher" | "student"; title?: string; subtitle?: string }) {
  const { tt } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleIds, setRoleIds] = useState<string[] | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      // Fetch all roles per user so we can exclude accounts that cumulate elevated roles.
      const { data: allRoles } = await sb.from("user_roles").select("user_id, role");
      const byUser = new Map<string, string[]>();
      (allRoles || []).forEach((r: any) => {
        const arr = byUser.get(r.user_id) || [];
        arr.push(r.role);
        byUser.set(r.user_id, arr);
      });
      // "student" list = only pure students (no teacher/admin/staff role).
      // "teacher" list = teachers/examiners/coordinators without super_admin.
      const ELEVATED = new Set([
        "super_admin", "admin", "school_admin", "academic_director",
        "pedagogical_coordinator", "examiner", "teacher", "staff",
      ]);
      const filtered: string[] = [];
      byUser.forEach((roles, uid) => {
        if (role === "student") {
          if (roles.includes("student") && !roles.some((r) => ELEVATED.has(r))) filtered.push(uid);
        } else {
          if (roles.includes("teacher") && !roles.includes("super_admin")) filtered.push(uid);
        }
      });
      setRoleIds(filtered);
      setPage(0);
    })();
  }, [role]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!roleIds) return;
    (async () => {
      setLoading(true);
      const sb = supabase as any;
      if (roleIds.length === 0) { setRows([]); setTotal(0); setLoading(false); return; }
      let qb = sb.from("profiles")
        .select("user_id, display_name, email, approved", { count: "exact" })
        .in("user_id", roleIds)
        .order("display_name", { ascending: true, nullsFirst: false });
      if (debouncedQ) qb = qb.or(`display_name.ilike.%${debouncedQ}%,email.ilike.%${debouncedQ}%`);
      const from = page * PAGE_SIZE;
      const { data: profs, count } = await qb.range(from, from + PAGE_SIZE - 1);
      const ids = (profs || []).map((p: any) => p.user_id);
      const { data: mems } = ids.length
        ? await sb.from("school_members").select("user_id, schools(name)").in("user_id", ids)
        : { data: [] };
      const schoolsByUser = new Map<string, string[]>();
      (mems || []).forEach((m: any) => {
        const n = m.schools?.name;
        if (!n) return;
        const arr = schoolsByUser.get(m.user_id) || [];
        if (!arr.includes(n)) arr.push(n);
        schoolsByUser.set(m.user_id, arr);
      });
      setRows((profs || []).map((p: any) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        email: p.email,
        approved: !!p.approved,
        schools: schoolsByUser.get(p.user_id) || [],
      })));
      setTotal(count || 0);
      setLoading(false);
    })();
  }, [roleIds, debouncedQ, page]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const reload = () => setRoleIds((ids) => (ids ? [...ids] : ids));
  const setApproved = async (uid: string, approved: boolean) => {
    const { error } = await (supabase as any).rpc("admin_set_approved", { _target: uid, _approved: approved });
    if (error) return toast.error(error.message);
    toast.success(approved ? tt({ fr: "Compte réactivé", de: "Konto reaktiviert", ar: "تم إعادة تفعيل الحساب" }) : tt({ fr: "Compte suspendu", de: "Konto gesperrt", ar: "تم تعليق الحساب" }));
    reload();
  };
  const del = async (uid: string, name: string | null) => {
    if (!confirm(tt({ fr: `Supprimer définitivement ${name || "ce compte"} ?`, de: `${name || "Dieses Konto"} endgültig löschen?`, ar: `حذف ${name || "الحساب"} نهائياً؟` }))) return;
    const { error } = await (supabase as any).rpc("admin_delete_user", { _target: uid });
    if (error) return toast.error(error.message);
    toast.success(tt({ fr: "Compte supprimé", de: "Konto gelöscht", ar: "تم حذف الحساب" }));
    reload();
  };

  const title = role === "teacher"
    ? tt({ fr: "Professeurs", de: "Lehrkräfte", ar: "المعلمون" })
    : tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" });
  const subtitle = role === "teacher"
    ? tt({ fr: "Tous les enseignants de la plateforme.", de: "Alle Lehrkräfte der Plattform.", ar: "جميع المعلمين في المنصة." })
    : tt({ fr: "Tous les élèves inscrits sur la plateforme.", de: "Alle eingeschriebenen Schüler der Plattform.", ar: "جميع الطلاب المسجلين في المنصة." });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </header>
      <div className="relative mb-4 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt({ fr: "Rechercher par nom ou email…", de: "Suche nach Name oder E-Mail…", ar: "ابحث بالاسم أو البريد…" })} className="pl-9" />
      </div>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3">{tt({ fr: "Nom", de: "Name", ar: "الاسم" })}</th>
              <th className="text-left px-4 py-3">{tt({ fr: "Email", de: "E-Mail", ar: "البريد" })}</th>
              <th className="text-left px-4 py-3">{tt({ fr: "Écoles", de: "Schulen", ar: "المدارس" })}</th>
              <th className="text-left px-4 py-3">{tt({ fr: "Statut", de: "Status", ar: "الحالة" })}</th>
              <th className="text-right px-4 py-3">{tt({ fr: "Actions", de: "Aktionen", ar: "إجراءات" })}</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t animate-pulse">
                <td className="px-4 py-3"><div className="h-4 w-32 bg-muted rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-48 bg-muted rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-muted rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-16 bg-muted rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">{tt({ fr: "Aucun résultat.", de: "Keine Ergebnisse.", ar: "لا توجد نتائج." })}</td></tr>
            )}
            {!loading && rows.map((r) => (
              <tr key={r.user_id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{r.display_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.schools.length ? r.schools.join(", ") : <span className="italic">{tt({ fr: "aucune", de: "keine", ar: "لا شيء" })}</span>}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.approved ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}`}>
                    {r.approved ? tt({ fr: "actif", de: "aktiv", ar: "نشط" }) : tt({ fr: "suspendu", de: "gesperrt", ar: "معلق" })}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    {r.approved ? (
                      <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => setApproved(r.user_id, false)} title={tt({ fr: "Suspendre", de: "Sperren", ar: "تعليق" })}><PauseCircle className="h-4 w-4" /></Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => setApproved(r.user_id, true)} title={tt({ fr: "Réactiver", de: "Reaktivieren", ar: "إعادة تفعيل" })}><PlayCircle className="h-4 w-4" /></Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(r.user_id, r.display_name)} title={tt({ fr: "Supprimer", de: "Löschen", ar: "حذف" })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <div>{total} {tt({ fr: total > 1 ? "résultats" : "résultat", de: "Ergebnisse", ar: "نتيجة" })}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>{tt({ fr: "Page", de: "Seite", ar: "صفحة" })} {page + 1} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= pages || loading} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
