import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap, School, User, Users, KeyRound, Loader2,
  ArrowLeft, Sparkles, Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

type Mode = "school" | "independent_teacher" | "independent_student" | "join_code" | "parent" | null;

const ACCENTS: Record<string, { ring: string; tint: string; text: string; grad: string }> = {
  school:               { ring: "ring-sky-500/40",     tint: "bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400",         grad: "from-sky-500 to-indigo-500" },
  independent_teacher:  { ring: "ring-violet-500/40",  tint: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400",   grad: "from-violet-500 to-fuchsia-500" },
  independent_student:  { ring: "ring-emerald-500/40", tint: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", grad: "from-emerald-500 to-teal-500" },
  join_code:            { ring: "ring-amber-500/40",   tint: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",     grad: "from-amber-500 to-orange-500" },
  parent:               { ring: "ring-rose-500/40",    tint: "bg-rose-500/10",    text: "text-rose-600 dark:text-rose-400",       grad: "from-rose-500 to-pink-500" },
};

export default function Onboarding() {
  const { user, refreshRoles } = useAuth();
  const { refresh: refreshSpaces } = useActiveSchool();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [level, setLevel] = useState("A1.1");
  const [code, setCode] = useState("");

  if (!user) {
    nav("/auth", { replace: true });
    return null;
  }

  async function createTeacherStudio() {
    setBusy(true);
    const { error } = await supabase.rpc("create_independent_teacher_space", {
      _studio_name: studioName || "Mon Studio",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await refreshRoles();
    await refreshSpaces();
    toast.success("Demande de studio envoyée au propriétaire de la plateforme.");
    nav("/pending-approval", { replace: true });
  }

  async function createSoloSpace() {
    setBusy(true);
    const { error } = await supabase.rpc("create_independent_student_space", {
      _current_level: level,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await refreshRoles();
    await refreshSpaces();
    toast.success("Demande d'espace envoyée au propriétaire de la plateforme.");
    nav("/pending-approval", { replace: true });
  }

  async function joinByCode() {
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("join_class_by_code", { _code: code.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await refreshRoles();
    await refreshSpaces();
    toast.success("Demande d'accès à la classe envoyée pour approbation.");
    nav("/pending-approval", { replace: true });
  }

  async function requestSchool() {
    if (schoolName.trim().length < 3) return;
    setBusy(true);
    const { error } = await supabase.rpc("request_school_space", {
      _school_name: schoolName.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await refreshSpaces();
    toast.success("Demande d'école envoyée au propriétaire de la plateforme.");
    nav("/pending-approval", { replace: true });
  }

  const cards = [
    { id: "school" as const, icon: School, title: "Je représente une école", desc: "Centre de formation, institut, académie.", badge: "Validation requise" },
    { id: "independent_teacher" as const, icon: GraduationCap, title: "Professeur indépendant", desc: "Créez votre studio, vos classes, vos élèves.", badge: "Recommandé" },
    { id: "independent_student" as const, icon: User, title: "Élève indépendant", desc: "Apprenez seul A1 → B2 à votre rythme.", badge: "Solo" },
    { id: "join_code" as const, icon: KeyRound, title: "J'ai un code de classe", desc: "Rejoindre une classe école ou un professeur." },
    { id: "parent" as const, icon: Users, title: "Je suis parent", desc: "Suivre la progression de mes enfants." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4 overflow-hidden relative">
      {/* Cinematic background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? nav(-1) : nav("/choose-space"))} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Bienvenue
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary via-violet-500 to-sky-500 bg-clip-text text-transparent">
            Comment souhaitez-vous apprendre&nbsp;?
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Choisissez le mode qui vous correspond. Vous pourrez en ajouter d'autres à tout moment.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {cards.map((c, i) => {
                const a = ACCENTS[c.id];
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      className={`cursor-pointer relative overflow-hidden border-2 hover:${a.ring} hover:shadow-xl transition-all`}
                      onClick={() => setMode(c.id)}
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${a.grad}`} />
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className={`h-12 w-12 rounded-xl ${a.tint} ${a.text} grid place-items-center mb-2`}>
                            <c.icon className="h-6 w-6" />
                          </div>
                          {c.badge && (
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${a.tint} ${a.text}`}>
                              {c.badge}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{c.title}</CardTitle>
                        <CardDescription>{c.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {mode && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="max-w-lg mx-auto"
            >
              <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="mb-3">
                <ArrowLeft className="h-4 w-4 mr-1" /> Choisir un autre mode
              </Button>

              {mode === "independent_teacher" && (
                <ModeCard accent={ACCENTS.independent_teacher} icon={GraduationCap} title="Créer votre studio"
                  desc="Votre espace privé pour gérer classes, élèves, devoirs, examens et attestations.">
                  <Label>Nom du studio</Label>
                  <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="Ex. Studio Allemand Sarah" />
                  <Bullets items={["Classes & élèves privés", "Devoirs et examens", "Attestations personnalisées"]} accent={ACCENTS.independent_teacher} />
                  <Button onClick={createTeacherStudio} disabled={busy} className="w-full">
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Créer mon studio
                  </Button>
                </ModeCard>
              )}

              {mode === "independent_student" && (
                <ModeCard accent={ACCENTS.independent_student} icon={User} title="Mon apprentissage personnel"
                  desc="Apprenez l'allemand à votre rythme, du niveau A1.1 au B2.2.">
                  <div>
                    <Label>Niveau de départ</Label>
                    <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 mt-1">
                      {["A1.1","A1.2","A2.1","A2.2","B1.1","B1.2","B2.1","B2.2"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <Bullets items={["Parcours A1 → B2", "Vocabulaire & Kapitel", "Examens blancs et certificats"]} accent={ACCENTS.independent_student} />
                  <Button onClick={createSoloSpace} disabled={busy} className="w-full">
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Démarrer mon parcours
                  </Button>
                </ModeCard>
              )}

              {mode === "join_code" && (
                <ModeCard accent={ACCENTS.join_code} icon={KeyRound} title="Rejoindre une classe"
                  desc="Saisissez le code transmis par votre école ou votre professeur.">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="text-center font-mono text-lg tracking-widest"
                  />
                  <Button onClick={joinByCode} disabled={busy || !code.trim()} className="w-full">
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Rejoindre
                  </Button>
                </ModeCard>
              )}

              {mode === "school" && (
                <ModeCard accent={ACCENTS.school} icon={School} title="Inscription d'une école"
                  desc="La création d'une école est validée par le propriétaire de la plateforme.">
                  <div>
                    <Label>Nom de l'école ou de l'institut</Label>
                    <Input
                      value={schoolName}
                      onChange={(event) => setSchoolName(event.target.value)}
                      placeholder="Ex. Institut Deutsch Tunis"
                    />
                  </div>
                  <Bullets items={["Espace multi-classes", "Direction pédagogique", "Examens officiels & certificats"]} accent={ACCENTS.school} />
                  <Button onClick={requestSchool} disabled={busy || schoolName.trim().length < 3} className="w-full">
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Envoyer la demande
                  </Button>
                </ModeCard>
              )}

              {mode === "parent" && (
                <ModeCard accent={ACCENTS.parent} icon={Users} title="Espace parent"
                  desc="La liaison à un enfant doit être validée par l'élève ou son école.">
                  <Button onClick={() => nav("/parent")} className="w-full">Aller à l'espace parent</Button>
                </ModeCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type Accent = (typeof ACCENTS)[keyof typeof ACCENTS];

function ModeCard({
  accent,
  icon: Icon,
  title,
  desc,
  children,
}: {
  accent: Accent;
  icon: LucideIcon;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden border-2">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.grad}`} />
      <CardHeader>
        <div className={`h-12 w-12 rounded-xl ${accent.tint} ${accent.text} grid place-items-center mb-2`}>
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Bullets({ items, accent }: { items: string[]; accent: Accent }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it} className="flex items-center gap-2 text-sm">
          <span className={`h-5 w-5 rounded-full ${accent.tint} ${accent.text} grid place-items-center shrink-0`}>
            <Check className="h-3 w-3" />
          </span>
          {it}
        </li>
      ))}
    </ul>
  );
}
