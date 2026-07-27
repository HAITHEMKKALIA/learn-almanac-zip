import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

export type PlanPrice = {
  id: string;
  scope: "platform" | "school";
  school_id: string | null;
  plan_code: string;
  label: string;
  price_tnd: number;
  billing_period_months: number;
  active: boolean;
  sort_order: number;
  notes: string | null;
};

type Props = {
  scope: "platform" | "school";
  schoolId?: string | null;
  title?: string;
  description?: string;
};

export default function PricingGridEditor({ scope, schoolId = null, title, description }: Props) {
  const [rows, setRows] = useState<PlanPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("plan_prices").select("*").eq("scope", scope).order("sort_order");
    if (scope === "school" && schoolId) q = q.eq("school_id", schoolId);
    const { data, error } = await q;
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    setRows((data ?? []) as PlanPrice[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [scope, schoolId]);

  const update = (id: string, patch: Partial<PlanPrice>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (row: PlanPrice) => {
    setSaving(row.id);
    const { error } = await supabase
      .from("plan_prices")
      .update({
        label: row.label,
        price_tnd: row.price_tnd,
        billing_period_months: row.billing_period_months,
        active: row.active,
        sort_order: row.sort_order,
        notes: row.notes,
        plan_code: row.plan_code,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    toast({ title: "Tarif enregistré ✓" });
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce tarif ?")) return;
    const { error } = await supabase.from("plan_prices").delete().eq("id", id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const add = async () => {
    if (scope === "school" && !schoolId) return;
    const code = `plan_${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from("plan_prices")
      .insert({
        scope,
        school_id: scope === "school" ? schoolId : null,
        plan_code: code,
        label: "Nouveau plan",
        price_tnd: 0,
        billing_period_months: 1,
        active: true,
        sort_order: (rows[rows.length - 1]?.sort_order ?? 0) + 10,
      })
      .select()
      .single();
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    setRows((rs) => [...rs, data as PlanPrice]);
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title ?? "Grille des tarifs (TND)"}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}
      {!loading && rows.length === 0 && <p className="text-muted-foreground text-sm">Aucun tarif défini.</p>}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_100px_90px_90px_auto] gap-2 items-center border rounded-lg p-3">
            <div>
              <Input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} placeholder="Libellé" />
              <Input value={r.plan_code} onChange={(e) => update(r.id, { plan_code: e.target.value })} placeholder="code" className="mt-1 text-xs font-mono h-8" />
            </div>
            <Input value={r.notes ?? ""} onChange={(e) => update(r.id, { notes: e.target.value })} placeholder="Notes (facultatif)" />
            <div className="flex items-center gap-1">
              <Input type="number" step="0.01" value={r.price_tnd} onChange={(e) => update(r.id, { price_tnd: parseFloat(e.target.value) || 0 })} />
              <span className="text-xs text-muted-foreground">TND</span>
            </div>
            <div className="flex items-center gap-1">
              <Input type="number" min={1} value={r.billing_period_months} onChange={(e) => update(r.id, { billing_period_months: parseInt(e.target.value) || 1 })} />
              <span className="text-xs text-muted-foreground">mois</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={r.active} onCheckedChange={(v) => update(r.id, { active: v })} />
              <span className="text-xs">{r.active ? "Actif" : "Inactif"}</span>
            </div>
            <div className="flex gap-1 justify-end">
              <Button size="sm" onClick={() => save(r)} disabled={saving === r.id}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
