import { useEffect, useState } from "react";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function TeacherStudioSettings() {
  const { activeSchool } = useActiveSchool();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [row, setRow] = useState<any>(null);

  useEffect(() => {
    if (!activeSchool?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("teacher_studio_settings")
        .select("*").eq("school_id", activeSchool.id).maybeSingle();
      setRow(data);
      setLoading(false);
    })();
  }, [activeSchool?.id]);

  async function save() {
    if (!row) return;
    setBusy(true);
    const { error } = await (supabase as any).from("teacher_studio_settings")
      .update({
        studio_name: row.studio_name,
        public_profile_enabled: row.public_profile_enabled,
        allow_student_self_join: row.allow_student_self_join,
        require_teacher_approval: row.require_teacher_approval,
        allow_online_classes: row.allow_online_classes,
        allow_certificates: row.allow_certificates,
        default_level: row.default_level,
        default_language: row.default_language,
        max_students_per_class: row.max_students_per_class,
      })
      .eq("id", row.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Paramètres enregistrés");
  }

  return (
    <SchoolLayout title="Paramètres du studio" subtitle="Configurer votre espace de professeur indépendant.">
      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !row ? (
        <Card><CardContent className="p-6">Aucun studio détecté pour cet espace.</CardContent></Card>
      ) : (
        <div className="grid gap-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Identité</CardTitle>
              <CardDescription>Nom public, niveau et langue par défaut.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nom du studio</Label>
                <Input value={row.studio_name || ""} onChange={(e) => setRow({ ...row, studio_name: e.target.value })} />
              </div>
              <div>
                <Label>Niveau par défaut</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3"
                  value={row.default_level || ""} onChange={(e) => setRow({ ...row, default_level: e.target.value })}>
                  <option value="">—</option>
                  {["A1.1","A1.2","A2.1","A2.2","B1.1","B1.2","B2.1","B2.2"].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>Langue par défaut</Label>
                <Input value={row.default_language || "de"} onChange={(e) => setRow({ ...row, default_language: e.target.value })} />
              </div>
              <div>
                <Label>Élèves max par classe</Label>
                <Input type="number" min={1} value={row.max_students_per_class || 30}
                  onChange={(e) => setRow({ ...row, max_students_per_class: parseInt(e.target.value || "30") })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inscriptions et visibilité</CardTitle>
              <CardDescription>Comment vos élèves rejoignent votre studio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow label="Profil public" desc="Affiche votre studio dans l'annuaire (à venir)."
                checked={!!row.public_profile_enabled} onChange={(v) => setRow({ ...row, public_profile_enabled: v })} />
              <ToggleRow label="Auto-inscription par code" desc="Les élèves peuvent rejoindre via le code de classe."
                checked={!!row.allow_student_self_join} onChange={(v) => setRow({ ...row, allow_student_self_join: v })} />
              <ToggleRow label="Approbation requise" desc="Valider chaque inscription manuellement."
                checked={!!row.require_teacher_approval} onChange={(v) => setRow({ ...row, require_teacher_approval: v })} />
              <ToggleRow label="Classes en ligne" desc="Activer les sessions en ligne et le calendrier."
                checked={!!row.allow_online_classes} onChange={(v) => setRow({ ...row, allow_online_classes: v })} />
              <ToggleRow label="Attestations" desc="Vous pouvez émettre des attestations privées."
                checked={!!row.allow_certificates} onChange={(v) => setRow({ ...row, allow_certificates: v })} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </SchoolLayout>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
