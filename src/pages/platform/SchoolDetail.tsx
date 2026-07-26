import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, BookOpenCheck, Users, GraduationCap, ShieldAlert, Pause, Play, Archive } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type School = any;
type Counts = { classes: number; teachers: number; students: number };

export default function PlatformSchoolDetail() {
  const { id } = useParams();
  const [school, setSchool] = useState<School | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [tab, setTab] = useState<"overview" | "classes" | "members">("overview");
  const [classes, setClasses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const { tt } = useI18n();

  const load = async () => {
    if (!id) return;
    const sb = supabase as any;
    const { data: s } = await sb.from("schools").select("*").eq("id", id).maybeSingle();
    setSchool(s);
    const [c, t, st] = await Promise.all([
      sb.from("classes").select("id", { count: "exact", head: true }).eq("school_id", id),
      sb.from("school_members").select("user_id", { count: "exact", head: true }).eq("school_id", id).in("role", ["teacher", "owner"]),
      sb.from("school_members").select("user_id", { count: "exact", head: true }).eq("school_id", id).eq("role", "student"),
    ]);
    setCounts({ classes: c.count ?? 0, teachers: t.count ?? 0, students: st.count ?? 0 });
    const { data: cls } = await sb.from("classes").select("id,name,level,status,teacher_id,created_at").eq("school_id", id).order("created_at", { ascending: false }).limit(50);
    setClasses(cls || []);
    const { data: mem } = await sb.rpc("school_members_full", { _school_id: id });
    setMembers(mem || []);
  };
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: string) => {
    if (!id) return;
    const { error } = await (supabase as any).from("schools").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(tt({ fr: `École ${status}`, de: `Schule ${status}`, ar: `المدرسة ${status}` }));
    load();
  };

  if (!school) return <div className="p-8">{tt({ fr: "Chargement…", de: "Laden…", ar: "جارٍ التحميل…" })}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link to="/platform-admin/schools" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}
      </Link>

      <header className="rounded-2xl border bg-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center text-white">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">{school.name}</h1>
            <div className="text-sm text-muted-foreground">{[school.city, school.country].filter(Boolean).join(", ") || "—"}</div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${
                school.status === "active" ? "bg-emerald-500/15 text-emerald-700" :
                school.status === "pending" ? "bg-amber-500/15 text-amber-700" :
                school.status === "suspended" ? "bg-rose-500/15 text-rose-700" :
                "bg-slate-500/15 text-slate-700"
              }`}>{school.status}</span>
              {school.email && <span className="text-muted-foreground">{school.email}</span>}
              {school.website && <a href={school.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{school.website}</a>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {school.status !== "active" && <Button size="sm" variant="outline" onClick={() => setStatus("active")}><Play className="h-3.5 w-3.5 mr-1" />{tt({ fr: "Activer", de: "Aktivieren", ar: "تفعيل" })}</Button>}
            {school.status !== "suspended" && <Button size="sm" variant="outline" onClick={() => setStatus("suspended")}><Pause className="h-3.5 w-3.5 mr-1" />{tt({ fr: "Suspendre", de: "Sperren", ar: "تعليق" })}</Button>}
            {school.status !== "archived" && <Button size="sm" variant="outline" onClick={() => { if (confirm(tt({ fr: "Archiver l'école ?", de: "Schule archivieren?", ar: "أرشفة المدرسة؟" }))) setStatus("archived"); }}><Archive className="h-3.5 w-3.5 mr-1" />{tt({ fr: "Archiver", de: "Archivieren", ar: "أرشفة" })}</Button>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border bg-card p-4"><div className="text-xs text-muted-foreground">{tt({ fr: "Classes", de: "Klassen", ar: "الفصول" })}</div><div className="text-2xl font-bold flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-indigo-500" />{counts?.classes ?? "…"}</div></div>
        <div className="rounded-2xl border bg-card p-4"><div className="text-xs text-muted-foreground">{tt({ fr: "Professeurs", de: "Lehrkräfte", ar: "المعلمون" })}</div><div className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-5 w-5 text-violet-500" />{counts?.teachers ?? "…"}</div></div>
        <div className="rounded-2xl border bg-card p-4"><div className="text-xs text-muted-foreground">{tt({ fr: "Élèves", de: "Schüler", ar: "الطلاب" })}</div><div className="text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-cyan-500" />{counts?.students ?? "…"}</div></div>
      </div>

      <div className="flex gap-1 border-b mb-4">
        {(["overview", "classes", "members"] as const).map((tk) => (
          <button key={tk} onClick={() => setTab(tk)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === tk ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tk === "overview"
              ? tt({ fr: "Vue d'ensemble", de: "Übersicht", ar: "نظرة عامة" })
              : tk === "classes"
              ? tt({ fr: "Classes", de: "Klassen", ar: "الفصول" })
              : tt({ fr: "Membres", de: "Mitglieder", ar: "الأعضاء" })}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="rounded-2xl border bg-card p-6 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-xs text-muted-foreground">{tt({ fr: "Nom légal", de: "Rechtlicher Name", ar: "الاسم القانوني" })}</div><div>{school.legal_name || "—"}</div></div>
            <div><div className="text-xs text-muted-foreground">{tt({ fr: "Slug", de: "Slug", ar: "المعرّف" })}</div><div>/{school.slug}</div></div>
            <div><div className="text-xs text-muted-foreground">{tt({ fr: "Téléphone", de: "Telefon", ar: "الهاتف" })}</div><div>{school.phone || "—"}</div></div>
            <div><div className="text-xs text-muted-foreground">{tt({ fr: "Email", de: "E-Mail", ar: "البريد الإلكتروني" })}</div><div>{school.email || "—"}</div></div>
            <div className="col-span-2"><div className="text-xs text-muted-foreground">{tt({ fr: "Adresse", de: "Adresse", ar: "العنوان" })}</div><div className="whitespace-pre-wrap">{school.address || "—"}</div></div>
            <div><div className="text-xs text-muted-foreground">{tt({ fr: "Créée le", de: "Erstellt am", ar: "تاريخ الإنشاء" })}</div><div>{new Date(school.created_at).toLocaleString()}</div></div>
            <div><div className="text-xs text-muted-foreground">{tt({ fr: "Mise à jour", de: "Aktualisiert", ar: "آخر تحديث" })}</div><div>{school.updated_at ? new Date(school.updated_at).toLocaleString() : "—"}</div></div>
          </div>
        </div>
      )}

      {tab === "classes" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40"><tr>
              <th className="text-left px-4 py-2">{tt({ fr: "Classe", de: "Klasse", ar: "الفصل" })}</th>
              <th className="text-left px-4 py-2">{tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })}</th>
              <th className="text-left px-4 py-2">{tt({ fr: "Statut", de: "Status", ar: "الحالة" })}</th>
              <th className="text-left px-4 py-2">{tt({ fr: "Créée le", de: "Erstellt am", ar: "تاريخ الإنشاء" })}</th>
            </tr></thead>
            <tbody>
              {classes.length === 0 && <tr><td colSpan={4} className="text-center text-muted-foreground py-8">{tt({ fr: "Aucune classe.", de: "Keine Klassen.", ar: "لا توجد فصول." })}</td></tr>}
              {classes.map((c) => (
                <tr key={c.id} className="border-t"><td className="px-4 py-2 font-medium">{c.name}</td><td className="px-4 py-2">{c.level}</td><td className="px-4 py-2">{c.status}</td><td className="px-4 py-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "members" && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40"><tr>
              <th className="text-left px-4 py-2">{tt({ fr: "Nom", de: "Name", ar: "الاسم" })}</th>
              <th className="text-left px-4 py-2">{tt({ fr: "Email", de: "E-Mail", ar: "البريد الإلكتروني" })}</th>
              <th className="text-left px-4 py-2">{tt({ fr: "Rôle école", de: "Schulrolle", ar: "دور المدرسة" })}</th>
              <th className="text-left px-4 py-2">{tt({ fr: "App", de: "App", ar: "التطبيق" })}</th>
              <th className="text-left px-4 py-2">{tt({ fr: "Approuvé", de: "Genehmigt", ar: "موافق عليه" })}</th>
            </tr></thead>
            <tbody>
              {members.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">{tt({ fr: "Aucun membre.", de: "Keine Mitglieder.", ar: "لا يوجد أعضاء." })}</td></tr>}
              {members.map((m: any) => (
                <tr key={m.user_id} className="border-t"><td className="px-4 py-2">{m.display_name || "—"}</td><td className="px-4 py-2">{m.email || "—"}</td><td className="px-4 py-2">{m.school_role}</td><td className="px-4 py-2 text-xs text-muted-foreground">{(m.app_roles || []).join(", ")}</td><td className="px-4 py-2">{m.approved ? "✓" : <ShieldAlert className="h-3.5 w-3.5 text-amber-600 inline" />}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
