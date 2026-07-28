import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import PricingGridEditor from "@/components/billing/PricingGridEditor";

type Quote = {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  plan: string;
  student_count: number | null;
  message: string | null;
  status: string;
  internal_notes: string | null;
  created_at: string;
};

type School = { id: string; name: string };

type Subscription = {
  id: string;
  school_id: string | null;
  owner_user_id: string | null;
  plan: string;
  price_tnd: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
};

const PLAN_PRICES: Record<string, number> = {
  student: 25,
  teacher: 79,
  small_school: 199,
  school: 399,
  institute: 699,
};

const QUOTE_STATUSES = ["new", "contacted", "quoted", "won", "lost"];

export default function BillingAdmin() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<Quote | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const load = async () => {
    setLoading(true);
    const [q, s, sc] = await Promise.all([
      supabase.from("quote_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("schools").select("id,name").order("name"),
    ]);
    setQuotes((q.data ?? []) as Quote[]);
    setSubs((s.data ?? []) as Subscription[]);
    setSchools((sc.data ?? []) as School[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateQuoteStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    setQuotes((qs) => qs.map((q) => (q.id === id ? { ...q, status } : q)));
  };

  const cancelSub = async (id: string) => {
    const { error } = await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    toast({ title: "Abonnement annulé" });
    load();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/platform-admin" className="text-sm text-muted-foreground hover:text-foreground">← Super Admin</Link>
            <h1 className="text-3xl font-bold mt-2">Facturation & Abonnements</h1>
            <p className="text-muted-foreground text-sm">Gestion manuelle des devis et abonnements TND.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCreatingNew(true)}>+ Nouvel abonnement</Button>
            <Button variant="outline" onClick={load}>Actualiser</Button>
          </div>
        </div>

        <Tabs defaultValue="quotes">
          <TabsList>
            <TabsTrigger value="quotes">Devis ({quotes.filter((q) => q.status === "new").length})</TabsTrigger>
            <TabsTrigger value="subs">Abonnements ({subs.filter((s) => s.status === "active").length} actifs)</TabsTrigger>
            <TabsTrigger value="pricing">Grille des tarifs</TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="space-y-3 mt-4">
            {loading && <p className="text-muted-foreground">Chargement…</p>}
            {!loading && quotes.length === 0 && <p className="text-muted-foreground">Aucune demande.</p>}
            {quotes.map((q) => (
              <Card key={q.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{q.contact_name}</span>
                      <Badge variant={q.status === "new" ? "default" : "secondary"}>{q.status}</Badge>
                      <Badge variant="outline">{q.plan}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {q.email} {q.phone && `· ${q.phone}`}
                      {q.organization && ` · ${q.organization}`}
                      {q.student_count && ` · ${q.student_count} élèves`}
                    </div>
                    {q.message && <p className="text-sm mt-2 whitespace-pre-wrap">{q.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(q.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={q.status} onValueChange={(v) => updateQuoteStatus(q.id, v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUOTE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => setActivating(q)}>Activer</Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="subs" className="space-y-3 mt-4">
            {subs.length === 0 && <p className="text-muted-foreground">Aucun abonnement.</p>}
            {subs.map((s) => {
              const schoolName = schools.find((x) => x.id === s.school_id)?.name ?? "—";
              return (
                <Card key={s.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{schoolName}</span>
                        <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                        <Badge variant="outline">{s.plan}</Badge>
                        <span className="text-sm font-mono">{s.price_tnd} TND</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Du {new Date(s.starts_at).toLocaleDateString("fr-FR")}
                        {s.ends_at && ` au ${new Date(s.ends_at).toLocaleDateString("fr-FR")}`}
                        {s.invoice_number && ` · Facture ${s.invoice_number}`}
                        {s.payment_method && ` · ${s.payment_method}`}
                      </div>
                      {s.notes && <p className="text-sm mt-2 text-muted-foreground">{s.notes}</p>}
                    </div>
                    {s.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => cancelSub(s.id)}>Annuler</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <PricingGridEditor
              scope="platform"
              title="Grille des tarifs plateforme (TND)"
              description="Tarifs de référence proposés aux écoles, instituts, professeurs et élèves indépendants. Les écoles peuvent ensuite définir leurs propres tarifs pour leurs élèves."
            />
          </TabsContent>
        </Tabs>
      </div>

      {activating && (
        <ActivateSubDialog
          quote={activating}
          schools={schools}
          onClose={(reload) => { setActivating(null); if (reload) load(); }}
        />
      )}
    </div>
  );
}

function ActivateSubDialog({ quote, schools, onClose }: { quote: Quote; schools: School[]; onClose: (r?: boolean) => void }) {
  const [schoolId, setSchoolId] = useState<string>("");
  const [price, setPrice] = useState<string>(String(PLAN_PRICES[quote.plan] ?? 0));
  const [months, setMonths] = useState("1");
  const [method, setMethod] = useState("virement");
  const [invoice, setInvoice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const starts = new Date();
    const ends = new Date();
    ends.setMonth(ends.getMonth() + parseInt(months || "1", 10));

    const { error } = await supabase.from("subscriptions").insert({
      school_id: schoolId || null,
      plan: quote.plan,
      price_tnd: parseFloat(price),
      status: "active",
      starts_at: starts.toISOString().slice(0, 10),
      ends_at: ends.toISOString().slice(0, 10),
      paid_at: new Date().toISOString(),
      payment_method: method,
      invoice_number: invoice || null,
      notes: notes || `Devis ${quote.contact_name} — ${quote.email}`,
    });
    if (error) {
      setSaving(false);
      return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
    await supabase.from("quote_requests").update({ status: "won" }).eq("id", quote.id);
    setSaving(false);
    toast({ title: "Abonnement activé ✓" });
    onClose(true);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Activer l'abonnement — {quote.contact_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>École (optionnel)</Label>
            <Select value={schoolId} onValueChange={setSchoolId}>
              <SelectTrigger><SelectValue placeholder="Aucune / abonnement individuel" /></SelectTrigger>
              <SelectContent>
                {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prix (TND)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="text-foreground" />
            </div>
            <div>
              <Label>Durée (mois)</Label>
              <Input type="number" min="1" value={months} onChange={(e) => setMonths(e.target.value)} className="text-foreground" />
            </div>
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
            <div>
              <Label>N° facture</Label>
              <Input value={invoice} onChange={(e) => setInvoice(e.target.value)} className="text-foreground" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="text-foreground" />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Activation…" : "Activer l'abonnement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
