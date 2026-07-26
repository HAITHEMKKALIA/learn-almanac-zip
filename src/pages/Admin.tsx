import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus, UserMinus, Search, Check, X, Trash2, Pencil, Save, Clock } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";

type Row = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  approved: boolean;
  roles: string[];
};

const PAGE_SIZE = 25;

export default function AdminPage() {
  const { tt } = useI18n();
  const [users, setUsers] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("profiles")
      .select("user_id, display_name, email, approved", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (statusFilter === "pending") q = q.eq("approved", false);
    if (statusFilter === "approved") q = q.eq("approved", true);
    if (debouncedSearch) q = q.or(`display_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
    const { data: profs, error, count } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    setTotal(count ?? 0);
    const ids = (profs || []).map((p: any) => p.user_id);
    const { data: roles } = ids.length
      ? await supabase.from("user_roles").select("user_id, role").in("user_id", ids)
      : { data: [] as any[] };
    const map = new Map<string, Row>();
    (profs || []).forEach((p: any) =>
      map.set(p.user_id, {
        user_id: p.user_id,
        display_name: p.display_name,
        email: p.email,
        approved: !!p.approved,
        roles: [],
      })
    );
    (roles || []).forEach((r: any) => {
      const u = map.get(r.user_id);
      if (u) u.roles.push(r.role);
    });
    setUsers(Array.from(map.values()));
    setLoading(false);
  };
  useEffect(() => { load(); }, [page, debouncedSearch, statusFilter]);

  const grant = async (uid: string, role: "teacher" | "admin" | "student") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role } as any);
    if (error) toast.error(error.message); else { toast.success(tt({ fr: "Rôle ajouté", de: "Rolle hinzugefügt", ar: "تمت إضافة الدور" })); load(); }
  };
  const revoke = async (uid: string, role: "teacher" | "admin" | "student") => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    if (error) toast.error(error.message); else { toast.success(tt({ fr: "Rôle retiré", de: "Rolle entfernt", ar: "تم إزالة الدور" })); load(); }
  };
  const setApproved = async (uid: string, approved: boolean) => {
    const { error } = await supabase.rpc("admin_set_approved", { _target: uid, _approved: approved });
    if (error) toast.error(error.message);
    else { toast.success(approved ? tt({ fr: "Compte approuvé", de: "Konto freigegeben", ar: "تمت الموافقة على الحساب" }) : tt({ fr: "Approbation retirée", de: "Freigabe entzogen", ar: "تم إلغاء الموافقة" })); load(); }
  };
  const deleteUser = async (uid: string) => {
    if (!confirm(tt({ fr: "Supprimer définitivement ce compte ?", de: "Dieses Konto endgültig löschen?", ar: "حذف هذا الحساب نهائيًا؟" }))) return;
    const { error } = await supabase.rpc("admin_delete_user", { _target: uid });
    if (error) toast.error(error.message); else { toast.success(tt({ fr: "Compte supprimé", de: "Konto gelöscht", ar: "تم حذف الحساب" })); load(); }
  };
  const saveName = async (uid: string) => {
    const { error } = await supabase.rpc("admin_update_profile", { _target: uid, _display_name: editName });
    if (error) toast.error(error.message);
    else { toast.success(tt({ fr: "Nom mis à jour", de: "Name aktualisiert", ar: "تم تحديث الاسم" })); setEditingId(null); load(); }
  };

  // filters now applied server-side
  const filtered = users;
  const pending = filtered.filter(u => !u.approved);
  const approved = filtered.filter(u => u.approved);

  const labels = {
    noName: tt({ fr: "(sans nom)", de: "(ohne Namen)", ar: "(بدون اسم)" }),
    cancel: tt({ fr: "Annuler", de: "Abbrechen", ar: "إلغاء" }),
    approved: tt({ fr: "Approuvé", de: "Freigegeben", ar: "تمت الموافقة" }),
    pending: tt({ fr: "En attente", de: "Ausstehend", ar: "قيد الانتظار" }),
    revoke: tt({ fr: "Révoquer", de: "Widerrufen", ar: "إلغاء" }),
    approve: tt({ fr: "Approuver", de: "Freigeben", ar: "وافق" }),
  };

  const renderRow = (u: Row) => (
    <div key={u.user_id} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 hover:border-primary/40 transition">
      <div className="min-w-0 flex-1">
        {editingId === u.user_id ? (
          <div className="flex gap-2 items-center mb-1">
            <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 max-w-xs" />
            <Button size="sm" onClick={() => saveName(u.user_id)}><Save className="w-3 h-3 me-1" />OK</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{labels.cancel}</Button>
          </div>
        ) : (
          <div className="font-medium flex items-center gap-2">
            {u.display_name || <span className="italic text-muted-foreground">{labels.noName}</span>}
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingId(u.user_id); setEditName(u.display_name || ""); }}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="text-sm text-muted-foreground truncate">{u.email || "—"}</div>
        <div className="text-xs text-muted-foreground font-mono truncate">{u.user_id}</div>
        <div className="flex gap-1 mt-1 flex-wrap">
          {u.approved
            ? <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/30">{labels.approved}</Badge>
            : <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30"><Clock className="w-3 h-3 me-1" />{labels.pending}</Badge>}
          {u.roles.map(r => (
            <Badge key={r} className={
              r === "admin" ? "bg-destructive/15 text-destructive border-destructive/30" :
              r === "teacher" ? "bg-primary/15 text-primary border-primary/30" :
              "bg-muted text-muted-foreground"
            } variant="outline">{r}</Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-1 flex-wrap justify-end">
        {u.approved
          ? <Button size="sm" variant="outline" onClick={() => setApproved(u.user_id, false)}><X className="w-3 h-3 me-1" />{labels.revoke}</Button>
          : <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setApproved(u.user_id, true)}><Check className="w-3 h-3 me-1" />{labels.approve}</Button>}
        {(["student", "teacher", "admin"] as const).map(r => u.roles.includes(r)
          ? <Button key={r} size="sm" variant="outline" onClick={() => revoke(u.user_id, r)}><UserMinus className="w-3 h-3 me-1" />{r}</Button>
          : <Button key={r} size="sm" onClick={() => grant(u.user_id, r)}><UserPlus className="w-3 h-3 me-1" />{r}</Button>)}
        <Button size="sm" variant="destructive" onClick={() => deleteUser(u.user_id)}><Trash2 className="w-3 h-3" /></Button>
      </div>
    </div>
  );

  return (
    <SchoolLayout
      title={tt({ fr: "Administration", de: "Verwaltung", ar: "الإدارة" })}
      subtitle={tt({ fr: "Approbation des inscriptions, rôles et gestion des comptes", de: "Freigabe von Anmeldungen, Rollen und Kontoverwaltung", ar: "اعتماد التسجيلات وإدارة الأدوار والحسابات" })}
      breadcrumbs={[{ label: tt({ fr: "Admin", de: "Admin", ar: "مسؤول" }) }]}
    >
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />{tt({ fr: "Utilisateurs", de: "Benutzer", ar: "المستخدمون" })} ({users.length})
          </CardTitle>
          <CardDescription>
            {tt({ fr: "Approuvez les nouvelles inscriptions, attribuez des rôles, modifiez ou supprimez les comptes.", de: "Genehmigen Sie neue Anmeldungen, vergeben Sie Rollen, bearbeiten oder löschen Sie Konten.", ar: "وافق على التسجيلات الجديدة، عيّن الأدوار، عدّل أو احذف الحسابات." })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm mb-4">
            <Search className="h-4 w-4 absolute start-2.5 top-2.5 text-muted-foreground" />
            <Input placeholder={tt({ fr: "Rechercher (nom, email ou id)", de: "Suchen (Name, E-Mail oder ID)", ar: "بحث (الاسم، البريد أو المعرّف)" })} value={search} onChange={e => setSearch(e.target.value)} className="ps-8" />
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(0); }}>
            <TabsList>
              <TabsTrigger value="pending">
                {labels.pending} {statusFilter === "pending" && total > 0 && <Badge className="ms-2 bg-amber-500 text-white">{total}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved">{labels.approved}</TabsTrigger>
              <TabsTrigger value="all">{tt({ fr: "Tous", de: "Alle", ar: "الكل" })}</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-2 mt-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{tt({ fr: "Aucun résultat.", de: "Keine Ergebnisse.", ar: "لا نتائج." })}</p>
              ) : (
                filtered.map(renderRow)
              )}

              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <span className="text-xs text-muted-foreground">
                  {tt({ fr: "Page", de: "Seite", ar: "صفحة" })} {page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} {tt({ fr: "résultats", de: "Ergebnisse", ar: "نتائج" })}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>←</Button>
                  <Button size="sm" variant="outline" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>→</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </SchoolLayout>
  );
}
