import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ArrowDownCircle, ArrowUpCircle, Download, FileText, Plus, Trash2, Wallet } from "lucide-react";
import { generateTransactionsPdf } from "@/lib/transactionsPdf";


export type TxScope = "school" | "teacher_studio" | "student_solo" | "platform";

type Tx = {
  id: string;
  scope: TxScope;
  school_id: string | null;
  owner_user_id: string | null;
  direction: "income" | "expense";
  category: string;
  description: string | null;
  amount_tnd: number;
  transaction_date: string;
  payment_method: string | null;
  reference: string | null;
  related_subscription_id: string | null;
  created_at: string;
};

const EXPENSE_CATEGORIES: { value: string; label: string }[] = [
  { value: "rent", label: "Loyer" },
  { value: "electricity", label: "STEG (électricité)" },
  { value: "water", label: "SONEDE (eau)" },
  { value: "internet", label: "Internet" },
  { value: "office_supplies", label: "Produits bureautiques" },
  { value: "tax", label: "Recette des finances (impôts)" },
  { value: "cnss", label: "CNSS" },
  { value: "salary", label: "Salaire" },
  { value: "salary_advance", label: "Avance sur salaire" },
  { value: "equipment", label: "Achat matériel" },
  { value: "maintenance", label: "Maintenance" },
  { value: "software", label: "Abonnement logiciel" },
  { value: "other", label: "Autre" },
];
const INCOME_CATEGORIES: { value: string; label: string }[] = [
  { value: "subscription", label: "Abonnement élève" },
  { value: "manual", label: "Encaissement manuel" },
  { value: "other", label: "Autre" },
];

const catLabel = (c: string) =>
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((x) => x.value === c)?.label || c;


type Range = { from: string; to: string };
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function rangeFor(preset: string): Range {
  const now = new Date();
  const to = isoDate(now);
  const from = new Date(now);
  if (preset === "day") return { from: to, to };
  if (preset === "week") { from.setDate(now.getDate() - 6); return { from: isoDate(from), to }; }
  if (preset === "month") { from.setDate(now.getDate() - 29); return { from: isoDate(from), to }; }
  if (preset === "year") { from.setFullYear(now.getFullYear() - 1); return { from: isoDate(from), to }; }
  return { from: "2020-01-01", to };
}

export interface TransactionsPanelProps {
  scope: TxScope;
  schoolId?: string | null;
  ownerUserId?: string | null;
  /** Hide the "Ajouter une dépense" and manual income buttons (e.g. platform view is income-only). */
  incomeOnly?: boolean;
  title?: string;
  description?: string;
}

export default function TransactionsPanel({
  scope, schoolId = null, ownerUserId = null,
  incomeOnly = false, title = "Mes transactions",
  description = "Historique des revenus et des dépenses avec filtres et export.",
}: TransactionsPanelProps) {
  const [preset, setPreset] = useState<string>("month");
  const [range, setRange] = useState<Range>(rangeFor("month"));
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [dirFilter, setDirFilter] = useState<"all" | "income" | "expense">("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [search, setSearch] = useState("");


  const applyPreset = (p: string) => {
    setPreset(p);
    if (p !== "custom") setRange(rangeFor(p));
  };

  const load = async () => {
    setLoading(true);
    let q = supabase.from("transactions").select("*")
      .eq("scope", scope)
      .gte("transaction_date", range.from)
      .lte("transaction_date", range.to)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(2000);
    if (scope === "school" && schoolId) q = q.eq("school_id", schoolId);
    if ((scope === "teacher_studio" || scope === "student_solo") && ownerUserId)
      q = q.eq("owner_user_id", ownerUserId);
    const { data, error } = await q;
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    setRows((data as Tx[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope, schoolId, ownerUserId, range.from, range.to]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) =>
      (dirFilter === "all" || r.direction === dirFilter) &&
      (catFilter === "all" || r.category === catFilter) &&
      (!s ||
        (r.description || "").toLowerCase().includes(s) ||
        (r.reference || "").toLowerCase().includes(s) ||
        catLabel(r.category).toLowerCase().includes(s)),
    );
  }, [rows, dirFilter, catFilter, search]);

  const totals = useMemo(() => {
    const income = filtered.filter(r => r.direction === "income").reduce((s, r) => s + Number(r.amount_tnd), 0);
    const expense = filtered.filter(r => r.direction === "expense").reduce((s, r) => s + Number(r.amount_tnd), 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered.filter((x) => x.direction === "expense")) {
      map.set(r.category, (map.get(r.category) || 0) + Number(r.amount_tnd));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);


  const exportCsv = () => {
    const head = ["Date","Sens","Catégorie","Description","Montant (TND)","Mode paiement","Référence"];
    const lines = [head.join(";")];
    for (const r of filtered) {
      const cells = [
        r.transaction_date,
        r.direction === "income" ? "Revenu" : "Dépense",
        catLabel(r.category),
        (r.description || "").replace(/[\r\n;]+/g, " "),
        Number(r.amount_tnd).toFixed(3),
        r.payment_method || "",
        r.reference || "",
      ];
      lines.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";"));
    }
    lines.push("");
    lines.push(`"Total revenus";"${totals.income.toFixed(3)}"`);
    lines.push(`"Total dépenses";"${totals.expense.toFixed(3)}"`);
    lines.push(`"Solde net";"${totals.net.toFixed(3)}"`);
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${scope}_${range.from}_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    generateTransactionsPdf({
      title,
      subtitle: description,
      from: range.from,
      to: range.to,
      rows: filtered.map((r) => ({
        transaction_date: r.transaction_date,
        direction: r.direction,
        categoryLabel: catLabel(r.category),
        description: r.description,
        amount_tnd: Number(r.amount_tnd),
        payment_method: r.payment_method,
        reference: r.reference,
      })),
    });
  };


  const remove = async (id: string) => {
    if (!confirm("Supprimer cette transaction ?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2"><Wallet className="h-6 w-6" />{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Rapport CSV</Button>
          <Button variant="outline" onClick={exportPdf}><FileText className="h-4 w-4 mr-2" />Rapport PDF</Button>

          {!incomeOnly && (
            <>
              <Button variant="outline" onClick={() => setShowIncome(true)}><Plus className="h-4 w-4 mr-2" />Revenu manuel</Button>
              <Button onClick={() => setShowExpense(true)}><Plus className="h-4 w-4 mr-2" />Ajouter dépense</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase">Revenus</div>
          <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1"><ArrowUpCircle className="h-5 w-5" />{totals.income.toFixed(3)} TND</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase">Dépenses</div>
          <div className="text-2xl font-bold text-rose-600 flex items-center gap-1"><ArrowDownCircle className="h-5 w-5" />{totals.expense.toFixed(3)} TND</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase">Solde net</div>
          <div className={`text-2xl font-bold ${totals.net >= 0 ? "text-primary" : "text-rose-600"}`}>{totals.net.toFixed(3)} TND</div>
        </Card>
      </div>

      <Card className="p-4">
        <Tabs value={preset} onValueChange={applyPreset}>
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="day">Jour</TabsTrigger>
            <TabsTrigger value="week">7 jours</TabsTrigger>
            <TabsTrigger value="month">30 jours</TabsTrigger>
            <TabsTrigger value="year">12 mois</TabsTrigger>
            <TabsTrigger value="all">Tout</TabsTrigger>
            <TabsTrigger value="custom">Personnalisé</TabsTrigger>
          </TabsList>
        </Tabs>
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3 mt-3 max-w-md">
            <div><Label>Du</Label><Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></div>
            <div><Label>Au</Label><Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></div>
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Sens</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Montant</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Réf.</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-6 text-center text-muted-foreground" colSpan={8}>Chargement…</td></tr>}
              {!loading && rows.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={8}>Aucune transaction sur la période.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{new Date(r.transaction_date).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">
                    {r.direction === "income"
                      ? <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">Revenu</Badge>
                      : <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/15">Dépense</Badge>}
                  </td>
                  <td className="p-3">{catLabel(r.category)}</td>
                  <td className="p-3 max-w-[420px]">{r.description || "—"}</td>
                  <td className={`p-3 text-right font-mono ${r.direction === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                    {r.direction === "income" ? "+" : "−"}{Number(r.amount_tnd).toFixed(3)}
                  </td>
                  <td className="p-3">{r.payment_method || "—"}</td>
                  <td className="p-3">{r.reference || "—"}</td>
                  <td className="p-3 text-right">
                    {!r.related_subscription_id && !incomeOnly && (
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showExpense && (
        <TxDialog
          direction="expense" scope={scope} schoolId={schoolId} ownerUserId={ownerUserId}
          onClose={(r) => { setShowExpense(false); if (r) load(); }}
        />
      )}
      {showIncome && (
        <TxDialog
          direction="income" scope={scope} schoolId={schoolId} ownerUserId={ownerUserId}
          onClose={(r) => { setShowIncome(false); if (r) load(); }}
        />
      )}
    </div>
  );
}

function TxDialog({
  direction, scope, schoolId, ownerUserId, onClose,
}: {
  direction: "income" | "expense";
  scope: TxScope;
  schoolId: string | null;
  ownerUserId: string | null;
  onClose: (reload?: boolean) => void;
}) {
  const cats = direction === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const [category, setCategory] = useState(cats[0].value);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("virement");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast({ title: "Montant invalide", variant: "destructive" });
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { setSaving(false); return; }
    const payload: any = {
      scope, direction, category,
      description: description || null,
      amount_tnd: amt,
      transaction_date: date,
      payment_method: method || null,
      reference: reference || null,
      created_by: uid,
    };
    if (scope === "school") { payload.school_id = schoolId; payload.owner_user_id = null; }
    else if (scope === "teacher_studio" || scope === "student_solo") {
      payload.school_id = schoolId; payload.owner_user_id = ownerUserId ?? uid;
    } else if (scope === "platform") {
      payload.school_id = null; payload.owner_user_id = null;
    }
    const { error } = await supabase.from("transactions").insert(payload);
    setSaving(false);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    toast({ title: direction === "income" ? "Revenu ajouté ✓" : "Dépense ajoutée ✓" });
    onClose(true);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-1rem)]">
        <DialogHeader><DialogTitle>{direction === "income" ? "Nouveau revenu" : "Nouvelle dépense"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Cartouches d'encre HP pour l'imprimerie" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Montant (TND)</Label><Input type="number" step="0.001" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
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
                  <SelectItem value="prelevement">Prélèvement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Référence / N° facture</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
          </div>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
