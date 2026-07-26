import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Building2, Check, ChevronDown, GraduationCap, User, Star, Plus, ArrowRightLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";

const STORAGE_DEFAULT = "default_space_id";

const META: Record<string, { Icon: any; label: string; grad: string; text: string; tint: string }> = {
  school:               { Icon: Building2,    label: "École",   grad: "from-sky-500 to-indigo-500",     text: "text-sky-600 dark:text-sky-400",         tint: "bg-sky-500/10" },
  independent_teacher:  { Icon: GraduationCap, label: "Studio", grad: "from-violet-500 to-fuchsia-500", text: "text-violet-600 dark:text-violet-400",   tint: "bg-violet-500/10" },
  independent_student:  { Icon: User,         label: "Perso",   grad: "from-emerald-500 to-teal-500",   text: "text-emerald-600 dark:text-emerald-400", tint: "bg-emerald-500/10" },
};

function metaFor(t?: string) {
  return META[t || "school"] || META.school;
}

export function SchoolSwitcher() {
  const { schools, activeSchool, setActiveSchoolId } = useActiveSchool();
  const { tt } = useI18n();
  const nav = useNavigate();
  const [defaultId, setDefaultId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_DEFAULT) : null,
  );
  const [pulseKey, setPulseKey] = useState(0);

  // Pulse highlight when active space changes (cinematic feedback)
  useEffect(() => { setPulseKey((k) => k + 1); }, [activeSchool?.id]);

  if (schools.length === 0) return null;
  const current = activeSchool ?? schools[0];
  const cm = metaFor(current?.tenant_type);

  function switchTo(s: any) {
    if (s.id === current?.id) return;
    setActiveSchoolId(s.id);
    if (s.tenant_type === "independent_teacher") nav("/teacher-studio");
    else if (s.tenant_type === "independent_student") nav("/solo-student");
    else nav("/app");
  }

  function toggleDefault(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (defaultId === id) {
      localStorage.removeItem(STORAGE_DEFAULT);
      setDefaultId(null);
    } else {
      localStorage.setItem(STORAGE_DEFAULT, id);
      setDefaultId(id);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 gap-2 max-w-[220px] relative overflow-hidden border-2 hover:shadow-md transition-all`}
        >
          {/* Animated gradient bar that reflects active space type */}
          <AnimatePresence mode="wait">
            <motion.span
              key={pulseKey}
              initial={{ scaleX: 0, opacity: 0.6 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className={`absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r ${cm.grad} origin-left`}
            />
          </AnimatePresence>
          <span className={`h-5 w-5 rounded-md ${cm.tint} ${cm.text} grid place-items-center shrink-0`}>
            <cm.Icon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate text-xs font-medium">{current?.name}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
        <div className={`px-3 py-2 bg-gradient-to-r ${cm.grad}/10 border-b`}>
          <DropdownMenuLabel className="p-0 text-xs uppercase tracking-wider text-muted-foreground">
            {tt({ fr: "Mes espaces", de: "Meine Räume", ar: "مساحاتي" })}
          </DropdownMenuLabel>
        </div>

        <div className="py-1 max-h-80 overflow-y-auto">
          {schools.map((s, i) => {
            const m = metaFor(s.tenant_type);
            const active = s.id === current?.id;
            const isDef = defaultId === s.id;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.2 }}
              >
                <DropdownMenuItem
                  onClick={() => switchTo(s)}
                  className={`gap-2 cursor-pointer py-2 ${active ? "bg-accent" : ""}`}
                >
                  <span className={`h-7 w-7 rounded-md ${m.tint} ${m.text} grid place-items-center shrink-0`}>
                    {active ? <Check className="h-4 w-4" /> : <m.Icon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.label} · {s.role}
                    </div>
                  </div>
                  <button
                    onClick={(e) => toggleDefault(e, s.id)}
                    title={isDef ? "Espace par défaut" : "Définir par défaut"}
                    className={`h-6 w-6 rounded grid place-items-center transition-colors ${
                      isDef ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-500"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${isDef ? "fill-current" : ""}`} />
                  </button>
                </DropdownMenuItem>
              </motion.div>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem onClick={() => nav("/choose-space")} className="gap-2 text-xs">
          <ArrowRightLeft className="h-3.5 w-3.5" /> Voir tous mes espaces
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => nav("/onboarding")} className="gap-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> Ajouter un espace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { getActiveSchoolId } from "@/contexts/ActiveSchoolContext";
