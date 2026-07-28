import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card } from "@/components/ui/card";
import SubscriptionCard from "@/components/billing/SubscriptionCard";

type Plan = { id: string; plan_code: string; label: string; price_tnd: number; billing_period_months: number; notes: string | null };

export default function StudentBilling() {
  const { user } = useAuth();
  const { activeSchool } = useActiveSchool();
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    (async () => {
      if (activeSchool?.id) {
        const { data } = await supabase.from("schools").select("trial_ends_at").eq("id", activeSchool.id).maybeSingle();
        setTrialEndsAt((data as any)?.trial_ends_at ?? null);
        const { data: pl } = await supabase
          .from("plan_prices")
          .select("id,plan_code,label,price_tnd,billing_period_months,notes")
          .eq("scope", "school")
          .eq("school_id", activeSchool.id)
          .eq("active", true)
          .order("sort_order");
        setPlans((pl ?? []) as Plan[]);
      }
    })();
  }, [activeSchool?.id]);

  return (
    <SchoolLayout title="Mon abonnement" subtitle="Suivi de votre abonnement, essai gratuit et date d'expiration.">
      <div className="max-w-3xl mx-auto space-y-6">
        <SubscriptionCard
          ownerUserId={user?.id ?? null}
          schoolId={activeSchool?.id ?? null}
          trialEndsAt={trialEndsAt}
          title="Mon abonnement"
        />

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Plans proposés par votre école</h3>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun plan publié pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {plans.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium">{p.label}</div>
                    {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold">{p.price_tnd} TND</div>
                    <div className="text-xs text-muted-foreground">/ {p.billing_period_months} mois</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Pour renouveler ou changer de plan, contactez l'administration de votre école (paiement manuel en TND).
          </p>
        </Card>
      </div>
    </SchoolLayout>
  );
}
