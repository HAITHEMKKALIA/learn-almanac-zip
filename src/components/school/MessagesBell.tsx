import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { beep, ensureBrowserNotifPermission, showBrowserNotif } from "@/lib/notify";

export function MessagesBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const mounted = useRef(false);

  const refresh = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    setUnread(count || 0);
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    ensureBrowserNotifPermission();
    const ch = supabase
      .channel(`dm-bell-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${user.id}` },
        (payload: any) => {
          refresh();
          if (mounted.current) {
            beep();
            const body = (payload?.new?.body || payload?.new?.content || "").toString().slice(0, 120);
            showBrowserNotif("Nouveau message", body, "/messages");
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    mounted.current = true;
    return () => { supabase.removeChannel(ch); mounted.current = false; };
  }, [user?.id]);

  if (!user) return null;
  return (
    <Link to="/messages" className="relative inline-flex">
      <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Messages">
        <MessageSquare className="h-4 w-4" />
        {unread > 0 && (
          <Badge className="absolute -top-1 -end-1 h-5 min-w-5 px-1 grid place-items-center text-[10px] bg-emerald-500 text-white border-0 rounded-full">
            {unread > 99 ? "99+" : unread}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
