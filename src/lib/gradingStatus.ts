// Per-question grading status helpers, shared by teacher + student views.
import type { LucideIcon } from "lucide-react";
import { Clock, Loader2, AlertTriangle, Sparkles, PenLine, CheckCircle2 } from "lucide-react";

export type GradingStatus =
  | "pending"
  | "ai_running"
  | "ai_failed"
  | "ai_graded"
  | "manual_graded";

export const STATUS_META: Record<GradingStatus, {
  label: string; studentLabel: string; tone: string; icon: LucideIcon;
}> = {
  pending:        { label: "En attente",         studentLabel: "Correction en cours",     tone: "bg-muted text-foreground",                  icon: Clock },
  ai_running:     { label: "IA en cours",        studentLabel: "Correction en cours",     tone: "bg-primary/15 text-primary",                icon: Loader2 },
  ai_failed:      { label: "Échec IA",           studentLabel: "Correction en cours",     tone: "bg-destructive/15 text-destructive",        icon: AlertTriangle },
  ai_graded:      { label: "Corrigé par IA",     studentLabel: "Corrigé",                 tone: "bg-blue-500/15 text-blue-600",              icon: Sparkles },
  manual_graded:  { label: "Corrigé manuellement", studentLabel: "Corrigé",               tone: "bg-emerald-500/15 text-emerald-700",        icon: PenLine },
};

export const READY_STATUSES: GradingStatus[] = ["ai_graded", "manual_graded"];

export const isReady = (s?: GradingStatus | null) =>
  !!s && READY_STATUSES.includes(s);
