import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/roles";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export type { AppRole };

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  approved: boolean | null;
  legalAccepted: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshLegal: () => Promise<void>;
  isTeacher: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  onlineUserIds: Set<string>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [legalAccepted, setLegalAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const loadHeartbeatPresence = useCallback(async () => {
    try {
      const cutoff = new Date(Date.now() - 90_000).toISOString();
      const { data, error } = await supabase
        .from("user_presence")
        .select("user_id, last_seen_at")
        .gte("last_seen_at", cutoff);
      if (!error) {
        setOnlineUserIds(new Set((data || []).map((row) => row.user_id)));
      }
    } catch {
      // transient network error — ignore, next heartbeat will retry
    }
  }, []);

  const fetchRoles = async (uid: string) => {
    const [rolesRes, profileRes, consentRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("approved").eq("user_id", uid).maybeSingle(),
      supabase
        .from("consent_logs")
        .select("consent_type, version, granted")
        .eq("user_id", uid)
        .eq("granted", true)
        .in("consent_type", ["terms", "privacy"]),
    ]);
    setRoles((rolesRes.data?.map((row) => row.role as AppRole)) || []);
    setApproved(profileRes.data?.approved ?? false);
    const consents = consentRes.data || [];
    const acceptedTerms = consents.some(
      (row) => row.consent_type === "terms" && row.version === TERMS_VERSION,
    );
    const acceptedPrivacy = consents.some(
      (row) => row.consent_type === "privacy" && row.version === PRIVACY_VERSION,
    );
    setLegalAccepted(acceptedTerms && acceptedPrivacy);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setLoading(true);
        setTimeout(() => {
          fetchRoles(sess.user.id).finally(() => setLoading(false));
        }, 0);
      } else {
        setRoles([]);
        setApproved(null);
        setLegalAccepted(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) fetchRoles(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Presence comes only from the RLS-protected heartbeat table. A global
  // Realtime Presence channel would expose identifiers across schools.
  useEffect(() => {
    if (!user) {
      setOnlineUserIds(new Set());
      return;
    }
    const markSeen = async () => {
      try {
        await supabase
          .from("user_presence")
          .upsert({ user_id: user.id, last_seen_at: new Date().toISOString() }, { onConflict: "user_id" });
        await loadHeartbeatPresence();
      } catch {
        // transient network error — ignore
      }
    };
    const dbChannel = supabase.channel("presence:last-seen")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, loadHeartbeatPresence)
      .subscribe();
    const interval = window.setInterval(markSeen, 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        markSeen();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    loadHeartbeatPresence();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
      supabase.removeChannel(dbChannel);
    };
  }, [user, loadHeartbeatPresence]);

  const signOut = async () => { await supabase.auth.signOut(); };
  const refreshRoles = async () => { if (user) await fetchRoles(user.id); };
  const refreshLegal = async () => { if (user) await fetchRoles(user.id); };

  return (
    <Ctx.Provider value={{
      session, user, roles, approved, legalAccepted, loading, signOut, refreshRoles, refreshLegal,
      isTeacher: roles.includes("teacher") || roles.includes("examiner") || roles.includes("pedagogical_coordinator"),
      isStudent: roles.includes("student"),
      isAdmin: roles.includes("admin") || roles.includes("super_admin") || roles.includes("school_admin") || roles.includes("academic_director"),
      onlineUserIds,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
