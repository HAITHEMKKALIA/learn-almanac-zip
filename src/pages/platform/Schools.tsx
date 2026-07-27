import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type School = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  status: string;
  email: string | null;
  created_at: string;
};

const statusClass = (s: string) =>
  s === "active" ? "bg-emerald-500/15 text-emerald-700"
  : s === "pending" ? "bg-amber-500/15 text-amber-700"
  : s === "suspended" ? "bg-rose-500/15 text-rose-700"
  : "bg-slate-500/15 text-slate-700";

export default function PlatformSchools() {
  const { tt } = useI18n();
  const [rows, setRows] = useState<School[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("schools")
      .select("id,name,slug,city,country,status,email,created_at")
      .order("created_at", { ascending: false });
    setRows((data || []) as School[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).rpc("admin_set_school_status", { _school_id: id, _status: status });
    if (error) return toast.error(error.message);
    toast.success(tt({ fr: "Statut mis à jour", de: "Status aktualisiert", ar: "تم تحديث الحالة" }));
    load();
  };
  const del = async (id: string, name: string) => {
    if (!confirm(tt({ fr: `Supprimer définitivement « ${name} » ?`, de: `„${name}" endgültig löschen?`, ar: `حذف "${name}" نهائياً؟` }))) return;
    const { error } = await (supabase as any).rpc("admin_delete_school", { _school_id: id });
    if (error) return toast.error(error.message);
    toast.success(tt({ fr: "École supprimée", de: "Schule gelöscht", ar: "تم حذف المدرسة" }));
    load();
  };

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (q && !`${r.name} ${r.city} ${r.country} ${r.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const statusLabels: Record<string, { fr: string; de: string; ar: string }> = {
    all: { fr: "Toutes", de: "Alle", ar: "الكل" },
    active: { fr: "Actives", de: "Aktiv", ar: "نشطة" },
    pending: { fr: "En attente", de: "Ausstehend", ar: "قيد الانتظار" },
    suspended: { fr: "Suspendues", de: "Gesperrt", ar: "موقوفة" },
    archived: { fr: "Archivées", de: "Archiviert", ar: "مؤرشفة" },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">{tt({ fr: "Écoles", de: "Schulen", ar: "المدارس" })}</h1>
          <p className="text-muted-foreground mt-1">{tt({ fr: "Gérez toutes les écoles inscrites sur la plateforme.", de: "Verwalten Sie alle auf der Plattform registrierten Schulen.", ar: "إدارة جميع المدارس المسجلة على المنصة." })}</p>
        </div>
        <Button asChild>
          <Link to="/platform-admin/schools/new"><Plus className="h-4 w-4 mr-2" />{tt({ fr: "Créer une école", de: "Schule erstellen", ar: "إنشاء مدرسة" })}</Link>
        </Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt({ fr: "Rechercher par nom, ville, pays, email…", de: "Suche nach Name, Stadt, Land, E-Mail…", ar: "ابحث بالاسم، المدينة، البلد، البريد…" })} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {["all", "active", "pending", "suspended", "archived"].map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
              {tt(statusLabels[s])}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{tt({ fr: "École", de: "Schule", ar: "المدرسة" })}</th>
              <th className="text-left px-4 py-3 font-medium">{tt({ fr: "Localisation", de: "Standort", ar: "الموقع" })}</th>
              <th className="text-left px-4 py-3 font-medium">{tt({ fr: "Email", de: "E-Mail", ar: "البريد" })}</th>
              <th className="text-left px-4 py-3 font-medium">{tt({ fr: "Statut", de: "Status", ar: "الحالة" })}</th>
              <th className="text-left px-4 py-3 font-medium">{tt({ fr: "Créée le", de: "Erstellt am", ar: "تاريخ الإنشاء" })}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-10">{tt({ fr: "Chargement…", de: "Wird geladen…", ar: "جارٍ التحميل…" })}</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-10">{tt({ fr: "Aucune école ne correspond.", de: "Keine passende Schule.", ar: "لا توجد مدرسة مطابقة." })}</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center text-white">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">/{s.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email || "—"}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusClass(s.status)}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm" variant="ghost"><Link to={`/platform-admin/schools/${s.id}`}>{tt({ fr: "Ouvrir", de: "Öffnen", ar: "فتح" })}</Link></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
