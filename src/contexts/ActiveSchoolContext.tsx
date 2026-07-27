import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SpaceType = "school" | "independent_teacher" | "independent_student" | "platform";

export type School = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: string;
  tenant_type?: SpaceType;
  is_independent?: boolean;
};

export type PendingSpaceRequest = {
  id: string;
  name: string;
  tenant_type: SpaceType;
  school_status: string;
  membership_status: string;
  requested_at: string;
};

interface ActiveSchoolCtx {
  schools: School[];
  pendingRequests: PendingSpaceRequest[];
  activeSchoolId: string | null;
  activeSchool: School | null;
  activeSpaceType: SpaceType | null;
  setActiveSchoolId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<ActiveSchoolCtx | null>(null);
const STORAGE_KEY = "active_school_id";

export function ActiveSchoolProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingSpaceRequest[]>([]);
  const [activeSchoolId, setActiveIdState] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null,
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSchools([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Only server-filtered, active and approved memberships are trusted.
    const [{ data: lsData, error: lsErr }, pendingRes] = await Promise.all([
      supabase.rpc("my_learning_spaces"),
      supabase.rpc("my_pending_space_requests"),
    ]);
    const data = lsErr ? (await supabase.rpc("my_schools")).data : lsData;
    const list = (data || []) as School[];
    setSchools(list);
    setPendingRequests((pendingRes.data || []) as PendingSpaceRequest[]);
    setActiveIdState((current) => {
      if (current && list.find((s) => s.id === current)) return current;
      const next = list[0]?.id ?? null;
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
      return next;
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActiveSchoolId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveIdState(id);
    // Backward compat for any legacy listeners
    window.dispatchEvent(new CustomEvent("active-school-changed", { detail: id }));
  }, []);

  const activeSchool = useMemo(
    () => schools.find((s) => s.id === activeSchoolId) ?? null,
    [schools, activeSchoolId],
  );

  const activeSpaceType = (activeSchool?.tenant_type ?? null) as SpaceType | null;

  return (
    <Ctx.Provider value={{ schools, pendingRequests, activeSchoolId, activeSchool, activeSpaceType, setActiveSchoolId, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActiveLearningSpace() {
  return useActiveSchool();
}

export function useActiveSchool() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useActiveSchool must be used inside ActiveSchoolProvider");
  return c;
}

/** Back-compat sync getter for legacy callers that cannot use the hook. */
export function getActiveSchoolId(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
}
