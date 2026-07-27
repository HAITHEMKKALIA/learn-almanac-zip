import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CreditCard, Sparkles } from "lucide-react";

type Sub = {
  id: string;
  plan: string;
  price_tnd: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  invoice_number: string | null;
  created_at: string;
};

type Props = {
  /** Solo student space: pass owner user id. School member student: pass owner user id. */
  ownerUserId?: string | null;
  /** Independent teacher/school owner or student assigned to school (school pays for them). */
  schoolId?: string | null;
  trialEndsAt?: string | null;
  title?: string;
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function SubscriptionCard({ ownerUserId, schoolId, trialEndsAt, title = "Mon abonnement" }: Props) {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(1);
      if (ownerUserId) q = q.eq("owner_user_id", ownerUserId);
      else if (schoolId) q = q.eq("school_id", schoolId);
      else { setLoading(false); return; }
      const { data } = await q.maybeSingle();
      setSub((data as Sub) ?? null);
      setLoading(false);
    })();
  }, [ownerUserId, schoolId]);

  const now = Date.now();
  const trialActive = trialEndsAt && new Date(trialEndsAt).getTime() > now && (!sub || sub.status !== "active");
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / 86400000)) : 0;
  const active = sub?.status === "active" && (!sub.ends_at || new Date(sub.ends_at).getTime() > now);
  const daysLeft = sub?.ends_at ? Math.max(0, Math.ceil((new Date(sub.ends_at).getTime() - now) / 86400000)) : null;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{title}</h3>
        {active && <Badge className="ml-auto">Actif</Badge>}
        {!active && trialActive && <Badge variant="secondary" className="ml-auto">Essai gratuit</Badge>}
        {!active && !trialActive && <Badge variant="outline" className="ml-auto">Aucun</Badge>}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      {!loading && trialActive && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 mb-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-amber-600" />
            {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""} restant{trialDaysLeft > 1 ? "s" : ""} d'essai gratuit
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Expire le {fmt(trialEndsAt!)}
          </p>
        </div>
      )}

      {!loading && sub && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{sub.plan}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Prix</span><span className="font-mono">{sub.price_tnd} TND</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><span>{sub.status}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />Créé le</span><span>{fmt(sub.created_at)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Début</span><span>{fmt(sub.starts_at)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Expire</span><span className={daysLeft !== null && daysLeft < 15 ? "text-amber-600 font-medium" : ""}>{fmt(sub.ends_at)}{daysLeft !== null && ` (${daysLeft}j)`}</span></div>
          {sub.invoice_number && <div className="flex justify-between"><span className="text-muted-foreground">Facture</span><span className="font-mono">{sub.invoice_number}</span></div>}
          {sub.payment_method && <div className="flex justify-between"><span className="text-muted-foreground">Paiement</span><span>{sub.payment_method}</span></div>}
        </div>
      )}

      {!loading && !sub && !trialActive && (
        <p className="text-sm text-muted-foreground">Aucun abonnement actif. Contactez votre administration pour en obtenir un.</p>
      )}
    </Card>
  );
}
