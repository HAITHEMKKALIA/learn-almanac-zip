import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Props = {
  schoolId?: string | null;
  scope?: "platform" | "school" | "user";
  title?: string;
};

export function AIQuotaWidget({ schoolId, scope = "school", title }: Props) {
  const { tt } = useI18n();
  const [today, setToday] = useState<number>(0);
  const [perUserCap, setPerUserCap] = useState<number>(30);
  const [dailyCap, setDailyCap] = useState<number>(200);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const iso = startOfDay.toISOString();

      const { data: quota } = await sb.from("ai_quotas")
        .select("per_user_daily_cap, daily_generation_cap")
        .eq("school_id", schoolId || null).maybeSingle();
      if (quota) { setPerUserCap(quota.per_user_daily_cap ?? 30); setDailyCap(quota.daily_generation_cap ?? 200); }

      let q = sb.from("ai_generation_logs").select("id", { count: "exact", head: true }).gte("created_at", iso);
      if (scope === "school" && schoolId) q = q.eq("school_id", schoolId);
      if (scope === "user") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) q = q.eq("user_id", user.id);
      }
      const { count } = await q;
      setToday(count ?? 0);
      setLoading(false);
    })();
  }, [schoolId, scope]);

  const cap = scope === "user" ? perUserCap : dailyCap;
  const pct = cap > 0 ? Math.min(100, Math.round((today / cap) * 100)) : 0;
  const warn = pct >= 80;

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> {title || tt({ fr: "Quota IA aujourd'hui", de: "KI-Kontingent heute", ar: "حصة الذكاء الاصطناعي اليوم" })}
          </div>
          <div className="text-2xl font-display font-bold mt-1">
            {loading ? "…" : `${today} / ${cap}`}
          </div>
        </div>
        {warn && <AlertTriangle className="h-5 w-5 text-amber-500" />}
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all ${warn ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        {scope === "user"
          ? tt({ fr: "Limite personnelle", de: "Persönliches Limit", ar: "الحد الشخصي" })
          : scope === "school"
          ? tt({ fr: "Limite école", de: "Schul-Limit", ar: "حد المدرسة" })
          : tt({ fr: "Limite plateforme", de: "Plattform-Limit", ar: "حد المنصة" })} · {pct}% {tt({ fr: "utilisé", de: "verwendet", ar: "مُستخدَم" })}
      </div>
    </div>
  );
}
