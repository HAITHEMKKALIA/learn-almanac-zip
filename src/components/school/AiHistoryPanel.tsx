import { useEffect, useState } from "react";
import { readAiHistory, clearAiHistory, type AiHistoryEntry } from "@/lib/aiHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function AiHistoryPanel({ filterMode }: { filterMode?: "exam" | "homework" }) {
  const [items, setItems] = useState<AiHistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const { tt } = useI18n();

  const refresh = () => setItems(readAiHistory().filter((e) => !filterMode || e.mode === filterMode));

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener("ai-history:update", h);
    return () => window.removeEventListener("ai-history:update", h);
  }, [filterMode]);

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {tt({ fr: "Historique IA", de: "KI-Verlauf", ar: "سجل الذكاء الاصطناعي" })} ({items.length})
        </span>
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t divide-y max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">{tt({ fr: "Aucune génération pour le moment.", de: "Noch keine Generierung.", ar: "لا توجد عمليات توليد بعد." })}</p>
          ) : (
            items.map((e) => (
              <div key={e.id} className="p-2 text-xs flex items-start gap-2">
                {e.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 items-center">
                    <Badge variant="outline" className="text-[10px]">{e.mode}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{e.level}</Badge>
                    {typeof e.count === "number" && (
                      <Badge className="text-[10px]">+{e.count} q.</Badge>
                    )}
                    <span className="text-muted-foreground">{new Date(e.at).toLocaleTimeString()}</span>
                  </div>
                  {e.title && <div className="truncate font-medium">{e.title}</div>}
                  {e.message && <div className="text-muted-foreground truncate">{e.message}</div>}
                </div>
              </div>
            ))
          )}
          {items.length > 0 && (
            <div className="p-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { clearAiHistory(); refresh(); }}>
                <Trash2 className="h-3 w-3" /> {tt({ fr: "Vider", de: "Leeren", ar: "مسح" })}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
