// Phase 6: Gamification hook (server-side XP + back-compat for DeutschMeister UI)
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserStats {
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  awarded_at: string;
  badge?: { code: string; name_fr: string; name_de: string; icon: string | null };
}

const LS_KEY = "deutschmeister:gamification:v1";
type LocalState = { points: number; messagesCount: number; correctCount: number };
const loadLocal = (): LocalState => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    return raw ? JSON.parse(raw) : { points: 0, messagesCount: 0, correctCount: 0 };
  } catch { return { points: 0, messagesCount: 0, correctCount: 0 }; }
};
const saveLocal = (s: LocalState) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* noop */ }
};

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [local, setLocal] = useState<LocalState>(loadLocal);

  const load = useCallback(async () => {
    if (!user) { setStats(null); setBadges([]); setLoading(false); return; }
    setLoading(true);
    const [statsRes, badgesRes] = await Promise.all([
      (supabase as any).from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
      (supabase as any)
        .from("user_badges")
        .select("id, badge_id, awarded_at, badge:badges(code,name_fr,name_de,icon)")
        .eq("user_id", user.id)
        .order("awarded_at", { ascending: false }),
    ]);
    setStats((statsRes?.data as UserStats) ?? null);
    setBadges((badgesRes?.data as UserBadge[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const awardXp = useCallback(
    async (eventType: string, xp: number, refId?: string, metadata?: Record<string, unknown>) => {
      if (!user) return null;
      const { data, error } = await (supabase as any).rpc("award_xp", {
        _event_type: eventType,
        _xp: xp,
        _ref_id: refId ?? null,
        _metadata: metadata ?? {},
      });
      if (error) { console.error("award_xp failed", error); return null; }
      if (data) setStats(data as UserStats);
      return data as UserStats;
    },
    [user]
  );

  // Back-compat API for legacy DeutschMeister components (AIChat, ProgressDashboard, etc.)
  const addPoints = useCallback((amount: number, kind?: "message" | "speak" | "correct") => {
    setLocal((prev) => {
      const next: LocalState = {
        points: prev.points + amount,
        messagesCount: prev.messagesCount + (kind === "message" ? 1 : 0),
        correctCount: prev.correctCount + (kind === "correct" ? 1 : 0),
      };
      saveLocal(next);
      return next;
    });
    // Fire-and-forget server sync when signed in
    if (user) { void awardXp(kind ?? "activity", Math.min(amount, 1000)); }
  }, [awardXp, user]);

  const xp = stats?.xp ?? local.points;
  const level = stats?.level ?? Math.floor(Math.sqrt(xp / 50)) + 1;
  const streak = stats?.current_streak ?? 0;
  const xpForLevel = (lv: number) => 50 * (lv - 1) * (lv - 1);
  const curBase = xpForLevel(level);
  const nextBase = xpForLevel(level + 1);
  const levelProgress = nextBase > curBase ? Math.min(100, ((xp - curBase) / (nextBase - curBase)) * 100) : 0;

  return {
    stats, badges, loading, awardXp, reload: load,
    // legacy fields
    points: xp,
    level,
    streak,
    levelProgress,
    messagesCount: local.messagesCount,
    correctCount: local.correctCount,
    addPoints,
  };
}
