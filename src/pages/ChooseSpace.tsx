import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2, GraduationCap, User, Loader2, Plus, Search, Star, ArrowRight, Sparkles,
} from "lucide-react";

const STORAGE_DEFAULT = "default_space_id";

const META: Record<string, { label: string; Icon: any; ring: string; tint: string; text: string; grad: string }> = {
  school:               { label: "École",                    Icon: Building2,    ring: "ring-sky-500/40",     tint: "bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400",         grad: "from-sky-500 to-indigo-500" },
  independent_teacher:  { label: "Studio professeur",        Icon: GraduationCap, ring: "ring-violet-500/40",  tint: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400",   grad: "from-violet-500 to-fuchsia-500" },
  independent_student:  { label: "Apprentissage personnel",  Icon: User,         ring: "ring-emerald-500/40", tint: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", grad: "from-emerald-500 to-teal-500" },
};

export default function ChooseSpace() {
  const { schools, loading, setActiveSchoolId } = useActiveSchool();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "school" | "independent_teacher" | "independent_student">("all");
  const [defaultId, setDefaultId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_DEFAULT) : null,
  );

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  function enter(id: string, tenant?: string) {
    setActiveSchoolId(id);
    if (tenant === "independent_teacher") nav("/teacher-studio");
    else if (tenant === "independent_student") nav("/solo-student");
    else nav("/app");
  }

  function makeDefault(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    localStorage.setItem(STORAGE_DEFAULT, id);
    setDefaultId(id);
  }

  const counts = useMemo(() => {
    const c = { all: schools.length, school: 0, independent_teacher: 0, independent_student: 0 };
    schools.forEach((s: any) => {
      const t = (s.tenant_type || "school") as keyof typeof c;
      if (t in c) (c as any)[t]++;
    });
    return c;
  }, [schools]);

  const filtered = useMemo(() => {
    return schools.filter((s: any) => {
      const t = s.tenant_type || "school";
      if (filter !== "all" && t !== filter) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [schools, filter, q]);

  const FILTERS: { id: typeof filter; label: string }[] = [
    { id: "all", label: `Tous (${counts.all})` },
    { id: "school", label: `Écoles (${counts.school})` },
    { id: "independent_teacher", label: `Studios (${counts.independent_teacher})` },
    { id: "independent_student", label: `Perso (${counts.independent_student})` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? nav(-1) : nav("/app"))} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Vos espaces
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Choisir un espace d'apprentissage</h1>
          <p className="text-muted-foreground mt-2">Sélectionnez l'espace à ouvrir, ou créez-en un nouveau.</p>
        </motion.div>

        {schools.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="max-w-lg mx-auto text-center">
              <CardHeader>
                <CardTitle>Aucun espace</CardTitle>
                <CardDescription>Créez votre premier espace pour commencer.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => nav("/onboarding")}><Plus className="h-4 w-4 mr-2" />Démarrer</Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un espace…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      filter === f.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => nav("/onboarding")} className="ml-auto">
                <Plus className="h-4 w-4 mr-1.5" /> Nouvel espace
              </Button>
            </div>

            {/* Grid */}
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((s: any, i: number) => {
                  const t = (s.tenant_type || "school") as keyof typeof META;
                  const m = META[t] || META.school;
                  const isDefault = defaultId === s.id;
                  return (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 18, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: 0.04 * i, duration: 0.35, ease: "easeOut" }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        onClick={() => enter(s.id, s.tenant_type)}
                        className={`group cursor-pointer relative overflow-hidden border-2 hover:${m.ring} hover:shadow-xl transition-all`}
                      >
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.grad}`} />
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className={`h-11 w-11 rounded-lg ${m.tint} ${m.text} grid place-items-center`}>
                              <m.Icon className="h-5 w-5" />
                            </div>
                            <button
                              onClick={(e) => makeDefault(e, s.id)}
                              title={isDefault ? "Espace par défaut" : "Définir par défaut"}
                              className={`h-8 w-8 rounded-md grid place-items-center transition-colors ${
                                isDefault ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
                              }`}
                            >
                              <Star className={`h-4 w-4 ${isDefault ? "fill-current" : ""}`} />
                            </button>
                          </div>
                          <CardTitle className="text-base flex items-center gap-2">{s.name}</CardTitle>
                          <CardDescription className="text-xs flex items-center gap-2">
                            <Badge variant="outline" className={`${m.tint} ${m.text} border-transparent text-[10px]`}>
                              {m.label}
                            </Badge>
                            <span>· rôle {s.role}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 flex items-center justify-end text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          Ouvrir <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                {filtered.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center text-sm text-muted-foreground py-12"
                  >
                    Aucun espace ne correspond à ce filtre.
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
