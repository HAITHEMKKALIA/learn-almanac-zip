import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
}

export default function AuditLogs() {
  const { tt } = useI18n();
  const [rows, setRows] = useState<AuditRow[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data as AuditRow[]) || []);
    })();
  }, []);
  return (
    <SchoolLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> {tt({ fr: "Journal d'audit", de: "Audit-Protokoll", ar: "سجل التدقيق" })}
        </h1>
        <Card>
          <CardHeader><CardTitle>{tt({ fr: "Dernières actions", de: "Letzte Aktionen", ar: "آخر الإجراءات" })} ({rows.length})</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tt({ fr: "Aucune entrée.", de: "Keine Einträge.", ar: "لا توجد إدخالات." })}</p>
            ) : (
              <div className="space-y-1 text-sm font-mono">
                {rows.map(r => (
                  <div key={r.id} className="border-b py-2">
                    <div className="flex justify-between">
                      <span className="text-primary">{r.action}</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.target_table}#{r.target_id?.slice(0,8)} · actor={r.actor_id?.slice(0,8)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}
