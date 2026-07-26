import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/roles";

export type { AppRole };

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  approved: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const realtimeOnlineIdsRef = useRef<Set<string>>(new Set());
  const heartbeatOnlineIdsRef = useRef<Set<string>>(new Set());

  const publishOnlineIds = useCallback(() => {
    setOnlineUserIds(new Set([...realtimeOnlineIdsRef.current, ...heartbeatOnlineIdsRef.current]));
  }, []);

  const loadHeartbeatPresence = useCallback(async () => {
    const cutoff = new Date(Date.now() - 90_000).toISOString();
    const { data, error } = await (supabase as any)
      .from("user_presence")
      .select("user_id, last_seen_at")
      .gte("last_seen_at", cutoff);
    if (!error) {
      heartbeatOnlineIdsRef.current = new Set((data || []).map((row: any) => row.user_id));
      publishOnlineIds();
    }
  }, [publishOnlineIds]);

  const fetchRoles = async (uid: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("approved").eq("user_id", uid).maybeSingle(),
    ]);
    setRoles((rolesRes.data?.map((r: any) => r.role as AppRole)) || []);
    setApproved(profileRes.data?.approved ?? false);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => { fetchRoles(sess.user.id); }, 0);
      } else {
        setRoles([]);
        setApproved(null);
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

  // Global presence: track this user and expose online user ids
  useEffect(() => {
    if (!user) {
      realtimeOnlineIdsRef.current = new Set();
      heartbeatOnlineIdsRef.current = new Set();
      setOnlineUserIds(new Set());
      return;
    }
    const ch = supabase.channel("presence:online", { config: { presence: { key: user.id } } });
    const sync = () => {
      const state = ch.presenceState() as Record<string, any[]>;
      realtimeOnlineIdsRef.current = new Set(Object.keys(state));
      publishOnlineIds();
    };
    const markSeen = async () => {
      await (supabase as any)
        .from("user_presence")
        .upsert({ user_id: user.id, last_seen_at: new Date().toISOString() }, { onConflict: "user_id" });
      heartbeatOnlineIdsRef.current = new Set([...heartbeatOnlineIdsRef.current, user.id]);
      publishOnlineIds();
      loadHeartbeatPresence();
    };
    ch.on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({ user_id: user.id, at: Date.now() });
          markSeen();
        }
      });
    const dbChannel = supabase.channel("presence:last-seen")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, loadHeartbeatPresence)
      .subscribe();
    const interval = window.setInterval(markSeen, 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        ch.track({ user_id: user.id, at: Date.now() });
        markSeen();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    loadHeartbeatPresence();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
      supabase.removeChannel(ch);
      supabase.removeChannel(dbChannel);
    };
  }, [user?.id, loadHeartbeatPresence, publishOnlineIds]);

  const signOut = async () => { await supabase.auth.signOut(); };
  const refreshRoles = async () => { if (user) await fetchRoles(user.id); };

  return (
    <Ctx.Provider value={{
      session, user, roles, approved, loading, signOut, refreshRoles,
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
