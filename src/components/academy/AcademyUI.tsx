// Academy design system primitives — Cinematic Academy UI 2026.
// Tailwind + shadcn + framer-motion. All animations respect prefers-reduced-motion.
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardHover, scaleIn, slideUp, staggerContainer, staggerItem, useReducedMotionSafe } from "@/lib/motion";

/* ───────── Card ───────── */
export const AcademyCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { glass?: boolean; glow?: boolean }>(
  ({ className, glass, glow, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl p-6 transition-colors",
        glass ? "academy-glass" : "bg-academy-card border academy-border",
        glow && "shadow-academy-glow",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
AcademyCard.displayName = "AcademyCard";

/* ───────── Glass panel ───────── */
export const AcademyGlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("academy-glass rounded-2xl p-5 shadow-academy-card", className)} {...props}>
      {children}
    </div>
  ),
);
AcademyGlassPanel.displayName = "AcademyGlassPanel";

/* ───────── Badge ───────── */
export function AcademyBadge({
  children, tone = "info", className,
}: { children: ReactNode; tone?: "info" | "success" | "warning" | "danger" | "neutral"; className?: string }) {
  const tones: Record<string, string> = {
    info:    "bg-[hsl(var(--academy-primary)/0.18)] text-[hsl(var(--academy-accent))] ring-[hsl(var(--academy-primary)/0.4)]",
    success: "bg-[hsl(var(--academy-success)/0.18)] text-[hsl(var(--academy-success))] ring-[hsl(var(--academy-success)/0.4)]",
    warning: "bg-[hsl(var(--academy-warning)/0.18)] text-[hsl(var(--academy-warning))] ring-[hsl(var(--academy-warning)/0.4)]",
    danger:  "bg-[hsl(var(--academy-danger)/0.18)]  text-[hsl(var(--academy-danger))]  ring-[hsl(var(--academy-danger)/0.4)]",
    neutral: "bg-white/5 text-[hsl(var(--academy-muted))] ring-white/10",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1", tones[tone], className)}>
      {children}
    </span>
  );
}

/* ───────── Metric ───────── */
export function AcademyMetricCard({
  label, value, hint, icon, accent,
}: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; accent?: "primary" | "accent" | "warning" | "success" }) {
  const accentMap: Record<string, string> = {
    primary: "from-[hsl(var(--academy-primary))]",
    accent:  "from-[hsl(var(--academy-accent))]",
    warning: "from-[hsl(var(--academy-warning))]",
    success: "from-[hsl(var(--academy-success))]",
  };
  return (
    <AcademyCard className="flex flex-col gap-2 overflow-hidden">
      <div className={cn("absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-25 bg-gradient-to-br to-transparent academy-glow-blob", accentMap[accent ?? "primary"])} aria-hidden />
      <div className="flex items-center justify-between relative">
        <span className="text-xs uppercase tracking-wider academy-text-muted">{label}</span>
        {icon && <span className="text-[hsl(var(--academy-accent))]">{icon}</span>}
      </div>
      <div className="font-display text-3xl font-bold academy-text-primary relative">{value}</div>
      {hint && <div className="text-xs academy-text-muted relative">{hint}</div>}
    </AcademyCard>
  );
}

/* ───────── Progress ring ───────── */
export function AcademyProgressRing({
  value, size = 96, stroke = 8, label,
}: { value: number; size?: number; stroke?: number; label?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="hsl(var(--academy-border))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke="url(#academy-ring-grad)" strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c} strokeDashoffset={c - (v/100)*c}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.22,1,.36,1)" }}
        />
        <defs>
          <linearGradient id="academy-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--academy-primary))" />
            <stop offset="100%" stopColor="hsl(var(--academy-accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {label ?? <span className="font-display text-lg font-bold academy-text-primary">{Math.round(v)}%</span>}
      </div>
    </div>
  );
}

/* ───────── Stat grid (stagger) ───────── */
export function AcademyStatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
      variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
export function AcademyStatItem({ children }: { children: ReactNode }) {
  return <motion.div variants={staggerItem}>{children}</motion.div>;
}

/* ───────── Feature / Role card with hover lift ───────── */
type MotionDivProps = Omit<HTMLMotionProps<"div">, "title"> & { glass?: boolean };
export function AcademyFeatureCard({ icon, title, description, className, glass, ...rest }: {
  icon?: ReactNode; title: ReactNode; description?: ReactNode;
} & MotionDivProps) {
  const reduced = useReducedMotionSafe();
  return (
    <motion.div
      variants={staggerItem}
      whileHover={reduced ? undefined : cardHover.whileHover}
      whileTap={reduced ? undefined : cardHover.whileTap}
      className={cn(
        "group relative rounded-2xl p-6 transition-colors",
        glass ? "academy-glass" : "bg-academy-card border academy-border",
        "hover:border-[hsl(var(--academy-accent)/0.5)]",
        className,
      )}
      {...rest}
    >
      {icon && (
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-academy-glow text-[hsl(var(--academy-text))] shadow-academy-glow">
          {icon}
        </div>
      )}
      <div className="font-display text-lg font-semibold academy-text-primary mb-1">{title}</div>
      {description && <div className="text-sm academy-text-muted leading-relaxed">{description}</div>}
    </motion.div>
  );
}

export function AcademyRoleCard({
  icon, title, subtitle, items, accent = "primary",
}: { icon?: ReactNode; title: ReactNode; subtitle?: ReactNode; items: string[]; accent?: "primary"|"accent"|"warning" }) {
  const accentMap: Record<string, string> = {
    primary: "from-[hsl(var(--academy-primary))] to-[hsl(var(--academy-accent))]",
    accent:  "from-[hsl(var(--academy-accent))] to-[hsl(var(--academy-primary))]",
    warning: "from-[hsl(var(--academy-warning))] to-[hsl(var(--academy-accent))]",
  };
  return (
    <AcademyFeatureCard
      icon={icon}
      title={
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{title}</span>
      }
      description={subtitle}
      className="overflow-hidden"
    >
      <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 -top-20 h-40 opacity-30 blur-3xl bg-gradient-to-br", accentMap[accent])} />
      <ul className="mt-4 space-y-1.5 text-sm academy-text-muted relative">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--academy-accent))]" />
            {it}
          </li>
        ))}
      </ul>
    </AcademyFeatureCard>
  );
}

/* ───────── Timeline (A1→B2) ───────── */
export function AcademyTimeline({
  steps,
}: { steps: { code: string; label: string; skills?: string[] }[] }) {
  return (
    <motion.ol
      className="relative grid gap-4 md:grid-cols-4"
      variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
    >
      <div aria-hidden className="hidden md:block absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-transparent via-[hsl(var(--academy-accent)/0.6)] to-transparent" />
      {steps.map((s) => (
        <motion.li key={s.code} variants={staggerItem} className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-academy-glow font-display font-bold text-sm text-white shadow-academy-glow">
              {s.code}
            </span>
            <span className="font-medium academy-text-primary">{s.label}</span>
          </div>
          {s.skills && (
            <div className="mt-2 flex flex-wrap gap-1 pl-15">
              {s.skills.map((sk) => <AcademyBadge key={sk} tone="neutral">{sk}</AcademyBadge>)}
            </div>
          )}
        </motion.li>
      ))}
    </motion.ol>
  );
}

/* ───────── Level card ───────── */
export function AcademyLevelCard({
  code, title, lessons, skills,
}: { code: string; title: string; lessons: number; skills: string[] }) {
  return (
    <motion.div variants={staggerItem}
      className="group relative overflow-hidden rounded-2xl border academy-border bg-academy-card p-5 hover:border-[hsl(var(--academy-accent)/0.5)] transition-colors"
    >
      <div aria-hidden className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-academy-glow opacity-20 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="font-display text-xl font-bold academy-text-primary">{code}</span>
        <AcademyBadge tone="info">{lessons} cours</AcademyBadge>
      </div>
      <div className="mt-1 text-sm academy-text-muted">{title}</div>
      <div className="mt-3 flex flex-wrap gap-1">
        {skills.map((s) => <AcademyBadge key={s} tone="neutral">{s}</AcademyBadge>)}
      </div>
    </motion.div>
  );
}

/* ───────── Page wrapper with transitions ───────── */
export function AcademyMotionPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={slideUp} initial="hidden" animate="show"
      className={cn("min-h-dvh", className)}
    >
      {children}
    </motion.div>
  );
}

/* ───────── Empty / Loading / Error ───────── */
export function AcademyEmptyState({ icon, title, description, action }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <motion.div variants={scaleIn} initial="hidden" animate="show" className="academy-glass rounded-2xl p-10 text-center">
      {icon && <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-academy-glow text-white">{icon}</div>}
      <div className="font-display text-lg font-semibold academy-text-primary">{title}</div>
      {description && <div className="mt-1 text-sm academy-text-muted">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
export function AcademyLoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="academy-glass rounded-2xl p-8 text-center">
      <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-[hsl(var(--academy-border))] border-t-[hsl(var(--academy-accent))] animate-spin" />
      <div className="text-sm academy-text-muted">{label}</div>
    </div>
  );
}
export function AcademyErrorState({ title = "Une erreur est survenue", description, action }: { title?: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl border border-[hsl(var(--academy-danger)/0.4)] bg-[hsl(var(--academy-danger)/0.08)] p-6 text-center">
      <div className="font-display font-semibold text-[hsl(var(--academy-danger))]">{title}</div>
      {description && <div className="mt-1 text-sm academy-text-muted">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
