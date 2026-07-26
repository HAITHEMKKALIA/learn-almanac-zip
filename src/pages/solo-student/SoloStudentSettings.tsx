import { useEffect, useState } from "react";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { toast } from "sonner";
import { Save } from "lucide-react";

const LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1", "B2.2"];

export default function SoloStudentSettings() {
  const { user } = useAuth();
  const { activeSchool } = useActiveSchool();
  const [form, setForm] = useState<any>({
    learning_goal: "",
    current_level: "A1.1",
    target_level: "B1.1",
    weekly_goal_minutes: 120,
    ai_tutor_enabled: true,
    public_progress_enabled: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeSchool?.id) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("solo_student_settings")
        .select("*")
        .eq("school_id", activeSchool.id)
        .maybeSingle();
      if (data) setForm({ ...form, ...data });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSchool?.id]);

  const save = async () => {
    if (!activeSchool?.id || !user) return;
    setSaving(true);
    const payload = {
      school_id: activeSchool.id,
      student_id: user.id,
      learning_goal: form.learning_goal || null,
      current_level: form.current_level,
      target_level: form.target_level,
      weekly_goal_minutes: Number(form.weekly_goal_minutes) || 0,
      ai_tutor_enabled: !!form.ai_tutor_enabled,
      public_progress_enabled: !!form.public_progress_enabled,
    };
    const { error } = await (supabase as any)
      .from("solo_student_settings")
      .upsert(payload, { onConflict: "school_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Parcours enregistré");
  };

  return (
    <SchoolLayout
      title="Mon parcours d'apprentissage"
      subtitle="Personnalisez votre objectif, votre niveau et votre rythme."
      breadcrumbs={[{ label: "Solo", href: "/solo-student" }, { label: "Mon parcours" }]}
      actions={<Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" />Enregistrer</Button>}
    >
      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Objectif</CardTitle>
            <CardDescription>Pourquoi apprenez-vous l'allemand ?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Mon objectif</Label>
              <Input
                value={form.learning_goal || ""}
                onChange={(e) => setForm({ ...form, learning_goal: e.target.value })}
                placeholder="Ex: Réussir le Goethe B1 avant juin"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Niveau actuel</Label>
                <Select value={form.current_level} onValueChange={(v) => setForm({ ...form, current_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Niveau cible</Label>
                <Select value={form.target_level} onValueChange={(v) => setForm({ ...form, target_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Objectif hebdomadaire (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={form.weekly_goal_minutes}
                onChange={(e) => setForm({ ...form, weekly_goal_minutes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Préférences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <Label className="font-medium">Tuteur IA</Label>
                <p className="text-sm text-muted-foreground">Recevez des explications et corrections par IA.</p>
              </div>
              <Switch checked={!!form.ai_tutor_enabled} onCheckedChange={(v) => setForm({ ...form, ai_tutor_enabled: v })} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <Label className="font-medium">Progression publique</Label>
                <p className="text-sm text-muted-foreground">Permettre à vos certificats publics d'être vérifiables.</p>
              </div>
              <Switch checked={!!form.public_progress_enabled} onCheckedChange={(v) => setForm({ ...form, public_progress_enabled: v })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}
