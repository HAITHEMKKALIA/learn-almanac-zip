import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import PricingGridEditor from "@/components/billing/PricingGridEditor";
import SubscriptionCard from "@/components/billing/SubscriptionCard";

type Student = { user_id: string; display_name: string | null; email: string | null };
type Sub = {
  id: string; school_id: string | null; owner_user_id: string | null;
  plan: string; price_tnd: number; status: string;
  starts_at: string; ends_at: string | null; paid_at: string | null;
  payment_method: string | null; invoice_number: string | null; notes: string | null;
  created_at: string;
};
type Plan = { id: string; plan_code: string; label: string; price_tnd: number; billing_period_months: number };

export default function SchoolBilling() {
  const { activeSchool } = useActiveSchool();
  const schoolId = activeSchool?.id ?? null;
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<Student | null>(null);

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    const [{ data: school }, mems, subQ, plansQ] = await Promise.all([
      supabase.from("schools").select("trial_ends_at").eq("id", schoolId).maybeSingle(),
      supabase.rpc("school_members_full", { _school_id: schoolId }),
      supabase.from("subscriptions").select("*").eq("school_id", schoolId).not("owner_user_id", "is", null).order("created_at", { ascending: false }),
      supabase.from("plan_prices").select("id,plan_code,label,price_tnd,billing_period_months").eq("scope", "school").eq("school_id", schoolId).eq("active", true).order("sort_order"),
    ]);
    setTrialEndsAt((school as any)?.trial_ends_at ?? null);
    const memRows = (mems.data as any[]) || [];
    setStudents(
      memRows
        .filter((m) => m.school_role === "student" && m.approved)
        .map((m) => ({ user_id: m.user_id, display_name: m.display_name, email: m.email }))
    );
    setSubs((subQ.data ?? []) as Sub[]);
    setPlans((plansQ.data ?? []) as Plan[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [schoolId]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    load();
  };

  if (!schoolId) {
    return (
      <SchoolLayout title="Abonnements">
        <p className="text-muted-foreground">Sélectionnez d'abord un espace école.</p>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout title="Abonnements & Facturation" subtitle="Gérez la grille des tarifs et les abonnements des élèves.">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <SubscriptionCard
            schoolId={schoolId}
            trialEndsAt={trialEndsAt}
            title="Abonnement de l'école"
          />
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Rappel — Modèle</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Chaque école bénéficie de <strong>15 jours d'essai gratuit</strong> à la création.</li>
              <li>Les <strong>professeurs assignés à une école</strong> ne payent pas d'abonnement.</li>
              <li>Chaque <strong>élève</strong> a un abonnement individuel géré par l'école, avec date de création et date d'expiration.</li>
              <li>Vous fixez librement vos propres tarifs dans la grille ci-dessous.</li>
            </ul>
          </Card>
        </div>

        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid">Grille de prix</TabsTrigger>
            <TabsTrigger value="students">Abonnements élèves ({subs.filter(s => s.status === "active").length}/{students.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-4">
            <PricingGridEditor
              scope="school"
              schoolId={schoolId}
              title="Grille des tarifs de votre école (TND)"
              description="Vous pouvez ajouter, modifier ou désactiver des plans à volonté. Ces tarifs seront utilisés pour créer les abonnements des élèves."
            />
          </TabsContent>

          <TabsContent value="students" className="space-y-3 mt-4">
            {loading && <p className="text-muted-foreground">Chargement…</p>}
            {!loading && students.length === 0 && <p className="text-muted-foreground">Aucun élève approuvé.</p>}
            {students.map((st) => {
              const active = subs.find((s) => s.owner_user_id === st.user_id && s.status === "active");
              return (
                <Card key={st.user_id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{st.display_name || st.email || "Élève"}</div>
                      <div className="text-xs text-muted-foreground">{st.email}</div>
                      {active ? (
                        <div className="text-sm mt-1 flex items-center gap-2 flex-wrap">
                          <Badge>Actif</Badge>
                          <span>{active.plan}</span>
                          <span className="font-mono">{active.price_tnd} TND</span>
                          <span className="text-muted-foreground">
                            {new Date(active.starts_at).toLocaleDateString("fr-FR")} → {active.ends_at ? new Date(active.ends_at).toLocaleDateString("fr-FR") : "—"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-1">Aucun abonnement actif</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {active ? (
                        <Button size="sm" variant="outline" onClick={() => cancel(active.id)}>Annuler</Button>
                      ) : (
                        <Button size="sm" onClick={() => setCreating(st)} disabled={plans.length === 0}>
                          Créer un abonnement
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {plans.length === 0 && (
              <p className="text-xs text-amber-600">Créez d'abord au moins un plan dans la grille pour pouvoir facturer les élèves.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {creating && (
        <CreateStudentSubDialog
          student={creating}
          schoolId={schoolId}
          plans={plans}
          onClose={(reload) => { setCreating(null); if (reload) load(); }}
        />
      )}
    </SchoolLayout>
  );
}

function CreateStudentSubDialog({ student, schoolId, plans, onClose }:
  { student: Student; schoolId: string; plans: Plan[]; onClose: (r?: boolean) => void }) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const plan = plans.find((p) => p.id === planId);
  const [price, setPrice] = useState(String(plan?.price_tnd ?? 0));
  const [months, setMonths] = useState(String(plan?.billing_period_months ?? 1));
  const [method, setMethod] = useState("virement");
  const [invoice, setInvoice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = plans.find((x) => x.id === planId);
    if (p) { setPrice(String(p.price_tnd)); setMonths(String(p.billing_period_months)); }
  }, [planId]);

  const submit = async () => {
    setSaving(true);
    const starts = new Date();
    const ends = new Date();
    ends.setMonth(ends.getMonth() + parseInt(months || "1", 10));
    const { error } = await supabase.from("subscriptions").insert({
      school_id: schoolId,
      owner_user_id: student.user_id,
      plan: plan?.plan_code ?? "student",
      price_tnd: parseFloat(price),
      status: "active",
      starts_at: starts.toISOString().slice(0, 10),
      ends_at: ends.toISOString().slice(0, 10),
      paid_at: new Date().toISOString(),
      payment_method: method,
      invoice_number: invoice || null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    toast({ title: "Abonnement créé ✓" });
    onClose(true);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Abonner — {student.display_name || student.email}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.label} — {p.price_tnd} TND / {p.billing_period_months}m</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prix (TND)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div><Label>Durée (mois)</Label><Input type="number" min={1} value={months} onChange={(e) => setMonths(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mode paiement</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="carte">Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>N° facture</Label><Input value={invoice} onChange={(e) => setInvoice(e.target.value)} /></div>
          </div>
          <div><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Création…" : "Créer l'abonnement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
