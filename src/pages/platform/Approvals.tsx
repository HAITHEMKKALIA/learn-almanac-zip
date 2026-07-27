import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, X, UserCheck, Building2, UserPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type PendingMember = {
  id: string; school_id: string; user_id: string; role: string;
  status: string | null; joined_at: string;
  school_name?: string; display_name?: string; email?: string;
};
type PendingProfile = {
  user_id: string; display_name: string | null; email: string | null; created_at: string;
};
type School = { id: string; name: string };
type PendingSchool = {
  id: string;
  name: string;
  tenant_type: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  created_at: string;
};

const ROLES = [
  "student",
  "parent",
  "teacher",
  "examiner",
  "staff",
  "pedagogical_coordinator",
  "academic_director",
  "school_admin",
] as const;

export default function Approvals() {
  const { tt } = useI18n();
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [pendingSchools, setPendingSchools] = useState<PendingSchool[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [assign, setAssign] = useState<Record<string, { school_id?: string; role?: string }>>({});

  const load = async () => {
    setLoading(true);
    const [memsRes, profsRes, pendingSchoolsRes, schRes] = await Promise.all([
      supabase.rpc("admin_pending_members"),
      supabase.rpc("admin_pending_profiles"),
      supabase.rpc("admin_pending_schools"),
      supabase.from("schools").select("id, name").eq("status", "active").order("name"),
    ]);
    setMembers(memsRes.data || []);
    setProfiles(profsRes.data || []);
    setPendingSchools(pendingSchoolsRes.data || []);
    setSchools(schRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approveMember = async (m: PendingMember) => {
    const { error } = await supabase.rpc("platform_review_membership", {
      _membership_id: m.id,
      _decision: "approve",
      _reason: null,
    });
    if (error) return toast.error(error.message);
    toast.success("Membre approuvé"); load();
  };
  const rejectMember = async (m: PendingMember) => {
    const { error } = await supabase.rpc("platform_review_membership", {
      _membership_id: m.id,
      _decision: "reject",
      _reason: "Demande refusée par le propriétaire de la plateforme",
    });
    if (error) return toast.error(error.message);
    toast.success("Refusé"); load();
  };
  const approveProfile = async (p: PendingProfile) => {
    const { error } = await supabase.rpc("admin_set_approved", {
      _target: p.user_id,
      _approved: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Compte approuvé"); load();
  };
  const reviewSchool = async (school: PendingSchool, decision: "approve" | "reject") => {
    const { error } = await supabase.rpc("platform_review_school", {
      _school_id: school.id,
      _decision: decision,
      _reason: decision === "reject" ? "Demande d'espace refusée" : null,
    });
    if (error) return toast.error(error.message);
    toast.success(decision === "approve" ? "Espace approuvé" : "Espace refusé");
    load();
  };
  const assignAndApprove = async (p: PendingProfile) => {
    const cfg = assign[p.user_id] || {};
    if (!cfg.school_id || !cfg.role) return toast.error("Choisissez école et rôle");
    const { error } = await supabase.rpc("admin_assign_user", {
      _target: p.user_id, _school_id: cfg.school_id, _role: cfg.role as any,
    });
    if (error) return toast.error(error.message);
    toast.success(`Approuvé et assigné comme ${cfg.role}`); load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs font-medium mb-3">
          <UserCheck className="h-3 w-3" /> File d'approbation
        </div>
        <h1 className="text-3xl font-display font-bold">Approbations</h1>
        <p className="text-muted-foreground mt-1">Validez les comptes, assignez un rôle et une école.</p>
      </header>

      <section>
        <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Espaces et écoles en attente ({pendingSchools.length})
        </h2>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3">Espace</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Propriétaire</th>
                <th className="text-left px-4 py-3">Demandé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Chargement…</td></tr>}
              {!loading && pendingSchools.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Aucun espace en attente.</td></tr>
              )}
              {pendingSchools.map((school) => (
                <tr key={school.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{school.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{school.tenant_type}</td>
                  <td className="px-4 py-3">
                    <div>{school.owner_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{school.owner_email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(school.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => reviewSchool(school, "reject")}>
                      <X className="h-3 w-3 mr-1" />Refuser
                    </Button>
                    <Button size="sm" onClick={() => reviewSchool(school, "approve")}>
                      <Check className="h-3 w-3 mr-1" />Approuver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Nouvelles inscriptions ({profiles.length})
        </h2>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3">Utilisateur</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Inscrit le</th>
                <th className="text-left px-4 py-3">École</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Chargement…</td></tr>}
              {!loading && profiles.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucune inscription en attente.</td></tr>
              )}
              {profiles.map((p) => {
                const cfg = assign[p.user_id] || {};
                return (
                  <tr key={p.user_id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{p.display_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Select value={cfg.school_id} onValueChange={(v) => setAssign(s => ({ ...s, [p.user_id]: { ...s[p.user_id], school_id: v } }))}>
                        <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="École" /></SelectTrigger>
                        <SelectContent>{schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={cfg.role} onValueChange={(v) => setAssign(s => ({ ...s, [p.user_id]: { ...s[p.user_id], role: v } }))}>
                        <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Rôle" /></SelectTrigger>
                        <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => approveProfile(p)}><Check className="h-3 w-3 mr-1" />Approuver</Button>
                      <Button size="sm" onClick={() => assignAndApprove(p)} disabled={!cfg.school_id || !cfg.role}>
                        <UserPlus className="h-3 w-3 mr-1" />Assigner
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Adhésions école en attente ({members.length})
        </h2>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3">Utilisateur</th>
                <th className="text-left px-4 py-3">École</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Depuis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && members.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Aucune adhésion en attente.</td></tr>
              )}
              {members.map((m) => (
                <tr key={m.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.display_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.school_name || "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/15">{m.role}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(m.joined_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => rejectMember(m)}><X className="h-3 w-3 mr-1" />Refuser</Button>
                    <Button size="sm" onClick={() => approveMember(m)}><Check className="h-3 w-3 mr-1" />Approuver</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
