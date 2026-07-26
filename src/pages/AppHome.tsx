import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { Loader2 } from "lucide-react";

const STORAGE_DEFAULT = "default_space_id";

/**
 * Hub de redirection après login.
 * Prend en compte le type d'espace actif (école / professeur indé / élève indé)
 * et l'espace par défaut choisi par l'utilisateur.
 */
export default function AppHome() {
  const { roles, loading, user } = useAuth();
  const { schools, activeSchool, loading: spaceLoading, setActiveSchoolId } = useActiveSchool();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || spaceLoading || !user) return;
    const has = (r: string) => roles.includes(r as any);

    // Super admin → plateforme
    if (has("super_admin")) { navigate("/platform-admin", { replace: true }); return; }

    // Aucun espace : onboarding
    if (schools.length === 0) {
      if (has("admin") || has("school_admin")) { navigate("/school-admin", { replace: true }); return; }
      if (has("teacher")) { navigate("/teacher", { replace: true }); return; }
      if (has("parent")) { navigate("/parent", { replace: true }); return; }
      navigate("/onboarding", { replace: true });
      return;
    }

    // Espace par défaut s'il existe et est encore accessible
    const defaultId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_DEFAULT) : null;
    const defaultSpace = defaultId ? schools.find((s) => s.id === defaultId) : null;
    if (defaultSpace && activeSchool?.id !== defaultSpace.id) {
      setActiveSchoolId(defaultSpace.id);
      return; // re-run after context updates
    }

    // Plusieurs espaces et pas de défaut : laisser choisir
    if (schools.length > 1 && !defaultSpace) {
      navigate("/choose-space", { replace: true });
      return;
    }

    const t = (defaultSpace ?? activeSchool)?.tenant_type;
    if (t === "independent_teacher") { navigate("/teacher-studio", { replace: true }); return; }
    if (t === "independent_student") { navigate("/solo-student", { replace: true }); return; }

    // Espace école : router par rôle
    if (has("school_admin") || has("admin")) navigate("/school-admin", { replace: true });
    else if (has("academic_director") || has("pedagogical_coordinator")) navigate("/academic", { replace: true });
    else if (has("teacher") || has("examiner")) navigate("/teacher", { replace: true });
    else if (has("parent")) navigate("/parent", { replace: true });
    else navigate("/student", { replace: true });
  }, [roles, loading, user, schools, activeSchool, spaceLoading, navigate, setActiveSchoolId]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Redirection vers votre espace…</span>
      </div>
    </div>
  );
}


