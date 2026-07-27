import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import { Loader2 } from "lucide-react";
import { homeForSpace } from "@/lib/spaceAccess";
import type { AppRole } from "@/hooks/useAuth";

const STORAGE_DEFAULT = "default_space_id";

/**
 * Hub de redirection après login.
 * Prend en compte le type d'espace actif (école / professeur indé / élève indé)
 * et l'espace par défaut choisi par l'utilisateur.
 */
export default function AppHome() {
  const { roles, loading, user } = useAuth();
  const {
    schools,
    pendingRequests,
    activeSchool,
    loading: spaceLoading,
    setActiveSchoolId,
  } = useActiveSchool();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || spaceLoading || !user) return;
    const has = (role: AppRole) => roles.includes(role);

    // Super admin → plateforme
    if (has("super_admin")) { navigate("/platform-admin", { replace: true }); return; }

    // Aucun espace : onboarding
    if (schools.length === 0) {
      if (pendingRequests.length > 0) {
        navigate("/pending-approval", { replace: true });
        return;
      }
      navigate("/onboarding", { replace: true });
      return;
    }

    // Priorité : espace par défaut > dernier espace actif > premier espace disponible
    const defaultId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_DEFAULT) : null;
    const defaultSpace = defaultId ? schools.find((s) => s.id === defaultId) : null;
    const selectedSpace = defaultSpace ?? activeSchool ?? schools[0];

    if (selectedSpace && activeSchool?.id !== selectedSpace.id) {
      setActiveSchoolId(selectedSpace.id);
      return; // re-run after context updates
    }

    if (selectedSpace) navigate(homeForSpace(selectedSpace), { replace: true });
  }, [roles, loading, user, schools, pendingRequests, activeSchool, spaceLoading, navigate, setActiveSchoolId]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Redirection vers votre espace…</span>
      </div>
    </div>
  );
}
