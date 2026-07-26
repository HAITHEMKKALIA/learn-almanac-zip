import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Search, Send, X, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";

type Profile = { user_id: string; display_name: string | null; email: string | null };
type Msg = { id: string; sender_id: string; recipient_id: string; body: string | null; created_at: string; read_at: string | null };

const VISIBILITY_KEY = "show_floating_messenger";

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

export function FloatingMessenger() {
  const { user, onlineUserIds } = useAuth();
  const { tt } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState<boolean>(() => localStorage.getItem(VISIBILITY_KEY) !== "false");
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [activePeer, setActivePeer] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChange = () => setVisible(localStorage.getItem(VISIBILITY_KEY) !== "false");
    window.addEventListener("messenger-visibility-changed", onChange);
    return () => window.removeEventListener("messenger-visibility-changed", onChange);
  }, []);

  // Load contacts: profiles the user can see
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .neq("user_id", user.id)
        .limit(200);
      setContacts((data || []) as Profile[]);
    })();
  }, [user]);

  // Unread count
  const refreshUnread = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    setUnread(count || 0);
  };
  useEffect(() => { refreshUnread(); }, [user]);

  // Realtime new messages
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("floating-msg-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${user.id}` }, (payload) => {
        const m = payload.new as Msg;
        if (activePeer && m.sender_id === activePeer.user_id) {
          setMessages((prev) => [...prev, m]);
        } else {
          setUnread((u) => u + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, activePeer]);

  // Load conversation
  const openConversation = async (peer: Profile) => {
    setActivePeer(peer);
    if (!user) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${peer.user_id}),and(sender_id.eq.${peer.user_id},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(50);
    setMessages((data || []) as Msg[]);
    // mark as read
    await supabase.from("direct_messages").update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id).eq("sender_id", peer.user_id).is("read_at", null);
    refreshUnread();
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const send = async () => {
    if (!user || !activePeer || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    const { data, error } = await supabase.from("direct_messages")
      .insert({ sender_id: user.id, recipient_id: activePeer.user_id, body })
      .select().single();
    if (!error && data) {
      setMessages((prev) => [...prev, data as Msg]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? contacts.filter((c) => (c.display_name || c.email || "").toLowerCase().includes(q)) : contacts;
    // online first
    return [...list].sort((a, b) => Number(onlineUserIds.has(b.user_id)) - Number(onlineUserIds.has(a.user_id)));
  }, [contacts, search, onlineUserIds]);

  if (!user || !visible) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setActivePeer(null); }}>
      <SheetTrigger asChild>
        <button
          aria-label="Messages"
          className="fixed bottom-5 end-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-elev hover:scale-105 transition-transform grid place-items-center"
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {!activePeer ? (
          <>
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> {tt({ fr: "Messages", de: "Nachrichten", ar: "الرسائل" })}</SheetTitle>
            </SheetHeader>
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="h-4 w-4 absolute start-2.5 top-2.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tt({ fr: "Rechercher un contact…", de: "Kontakt suchen…", ar: "البحث عن جهة اتصال…" })} className="ps-8 h-9" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {filtered.length === 0 && <div className="p-6 text-sm text-center text-muted-foreground">{tt({ fr: "Aucun contact", de: "Keine Kontakte", ar: "لا توجد جهات اتصال" })}</div>}
                {filtered.map((c) => {
                  const online = onlineUserIds.has(c.user_id);
                  return (
                    <button key={c.user_id} onClick={() => openConversation(c)} className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-start">
                      <div className="relative">
                        <Avatar className="h-10 w-10"><AvatarFallback>{initials(c.display_name || c.email)}</AvatarFallback></Avatar>
                        <span className={`absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-background ${online ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.display_name || c.email}</div>
                        <div className="text-xs text-muted-foreground">{online ? tt({ fr: "En ligne", de: "Online", ar: "متصل" }) : tt({ fr: "Hors ligne", de: "Offline", ar: "غير متصل" })}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <Button variant="outline" className="w-full" onClick={() => { setOpen(false); navigate("/messages"); }}>
                {tt({ fr: "Ouvrir la messagerie complète", de: "Vollständigen Messenger öffnen", ar: "فتح المراسلة الكاملة" })}
              </Button>
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="p-3 border-b">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setActivePeer(null)}><ArrowLeft className="h-4 w-4" /></Button>
                <Avatar className="h-9 w-9"><AvatarFallback>{initials(activePeer.display_name || activePeer.email)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-sm truncate">{activePeer.display_name || activePeer.email}</SheetTitle>
                  <div className="text-[11px] text-muted-foreground">{onlineUserIds.has(activePeer.user_id) ? tt({ fr: "En ligne", de: "Online", ar: "متصل" }) : tt({ fr: "Hors ligne", de: "Offline", ar: "غير متصل" })}</div>
                </div>
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1 p-3 bg-muted/20">
              <div className="space-y-2">
                {messages.map((m) => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-background border rounded-bl-sm"}`}>
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {format(new Date(m.created_at), "HH:mm")}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={tt({ fr: "Écrire un message…", de: "Nachricht schreiben…", ar: "اكتب رسالة…" })}
              />
              <Button size="icon" onClick={send} disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
