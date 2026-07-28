import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare, Send, Search, Paperclip, Mic, Smile, Image as ImageIcon,
  Reply, Trash2, Pencil, Check, CheckCheck, X, Download, Square, Phone, Video, MoreVertical
} from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { fr, de, ar } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

type Msg = {
  id: string; sender_id: string; recipient_id: string; body: string|null;
  created_at: string; read_at: string|null; delivered_at: string|null;
  attachment_url: string|null; attachment_type: string|null; attachment_name: string|null;
  reply_to_id: string|null; edited_at: string|null; deleted_at: string|null;
};
type Profile = { user_id: string; display_name: string|null };

const EMOJIS = ["😀","😂","😍","😊","😎","🤔","👍","👎","❤️","🔥","🎉","🙏","👏","💯","✅","❌","😢","😭","😡","🤝","🥳","😴","🤖","📚","✏️","🇩🇪","🇹🇳","🇫🇷"];

function initials(name?: string|null) {
  if (!name) return "?";
  return name.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();
}

function dayLabel(d: Date, lang: string, locale: any) {
  if (isToday(d)) return ({fr:"Aujourd'hui",de:"Heute",ar:"اليوم"} as any)[lang] || "Today";
  if (isYesterday(d)) return ({fr:"Hier",de:"Gestern",ar:"أمس"} as any)[lang] || "Yesterday";
  return format(d, "PPP", { locale });
}

export default function Messages() {
  const { user, onlineUserIds, roles } = useAuth();
  const [searchParams] = useSearchParams();
  const { tt, lang } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [activePeer, setActivePeer] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [replyTo, setReplyTo] = useState<Msg|null>(null);
  const [editing, setEditing] = useState<Msg|null>(null);
  const [typingPeers, setTypingPeers] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [convSearch, setConvSearch] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const mediaRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<any>(null);
  const presenceRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dateLocale = lang === "ar" ? ar : lang === "de" ? de : fr;

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("direct_messages").select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: true });
    const list = (data as any) || [];
    setMessages(list);
    const ids = Array.from(new Set(list.flatMap((m:Msg) => [m.sender_id, m.recipient_id]).filter((i:string) => i !== user.id))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
      const map: Record<string,string> = {};
      (profs || []).forEach((p:any) => { map[p.user_id] = p.display_name || p.user_id.slice(0,8); });
      setProfiles(s => ({ ...s, ...map }));
    }
    // mark delivered for incoming undelivered
    const undelivered = list.filter((m:Msg) => m.recipient_id === user.id && !m.delivered_at);
    if (undelivered.length) {
      await supabase.from("direct_messages").update({ delivered_at: new Date().toISOString() })
        .in("id", undelivered.map((m:Msg)=>m.id));
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Preload contacts: teachers see their students, students see their teachers
  useEffect(() => {
    if (!user) return;
    (async () => {
      const isTeacher = roles.some((r) => ["teacher", "examiner", "staff", "school_admin", "admin", "super_admin"].includes(r));
      const collected: Record<string, string | null> = {};
      if (isTeacher) {
        const { data: cls } = await supabase.from("classes").select("id, teacher_id").eq("teacher_id", user.id);
        for (const c of cls || []) {
          const { data: roster } = await supabase.rpc("get_class_roster", { _class_id: (c as any).id });
          (roster || []).forEach((r: any) => { collected[r.student_id] = r.display_name || r.email; });
        }
      } else {
        // Student: fetch classes I belong to, then teacher_id for each
        const { data: cm } = await supabase.from("class_members").select("class_id").eq("student_id", user.id);
        const classIds = (cm || []).map((r: any) => r.class_id);
        if (classIds.length) {
          const { data: cls } = await supabase.from("classes").select("teacher_id").in("id", classIds);
          const tids = Array.from(new Set((cls || []).map((c: any) => c.teacher_id).filter(Boolean)));
          if (tids.length) {
            const { data: profs } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", tids);
            (profs || []).forEach((p: any) => { collected[p.user_id] = p.display_name || p.email; });
          }
        }
      }
      const list: Profile[] = Object.entries(collected).map(([user_id, display_name]) => ({ user_id, display_name }));
      setContacts(list);
      setProfiles((s) => {
        const n = { ...s };
        list.forEach((p) => { n[p.user_id] = p.display_name || p.user_id.slice(0, 8); });
        return n;
      });
    })();
  }, [user, roles]);

  // Auto-select peer from URL ?peer=<id>
  useEffect(() => {
    const p = searchParams.get("peer");
    if (p && p !== activePeer) setActivePeer(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Realtime DM updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("dm-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  // Typing broadcasts; online status comes from the global auth presence
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("presence-msgs", { config: { presence: { key: user.id } } });
    ch.on("broadcast", { event: "typing" }, (payload: any) => {
      const from = payload.payload?.from;
      const to = payload.payload?.to;
      if (to !== user.id || !from) return;
      setTypingPeers(prev => new Set(prev).add(from));
      setTimeout(() => setTypingPeers(prev => { const n = new Set(prev); n.delete(from); return n; }), 3000);
    });
    ch.subscribe(async (status) => { if (status === "SUBSCRIBED") await ch.track({ online_at: new Date().toISOString() }); });
    presenceRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Scroll to bottom on new
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activePeer, messages.length]);

  const conversations = useMemo(() => {
    if (!user) return [] as { peer: string; last: Msg; unread: number }[];
    const map = new Map<string, { last: Msg; unread: number }>();
    messages.forEach(m => {
      const peer = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const cur = map.get(peer);
      const unreadInc = (m.recipient_id === user.id && !m.read_at) ? 1 : 0;
      if (!cur || new Date(m.created_at) > new Date(cur.last.created_at)) {
        map.set(peer, { last: m, unread: (cur?.unread || 0) + unreadInc });
      } else {
        map.set(peer, { ...cur, unread: cur.unread + unreadInc });
      }
    });
    let arr = Array.from(map.entries()).map(([peer, v]) => ({ peer, ...v }))
      .sort((a,b)=> +new Date(b.last.created_at) - +new Date(a.last.created_at));
    if (convSearch) {
      const q = convSearch.toLowerCase();
      arr = arr.filter(c => (profiles[c.peer]||"").toLowerCase().includes(q) || (c.last.body||"").toLowerCase().includes(q));
    }
    return arr;
  }, [messages, user, convSearch, profiles]);

  const thread = useMemo(() => {
    let t = messages.filter(m =>
      (m.sender_id === user?.id && m.recipient_id === activePeer) ||
      (m.sender_id === activePeer && m.recipient_id === user?.id)
    );
    if (threadSearch) {
      const q = threadSearch.toLowerCase();
      t = t.filter(m => (m.body||"").toLowerCase().includes(q));
    }
    return t;
  }, [messages, activePeer, user, threadSearch]);

  const groupedThread = useMemo(() => {
    const groups: { day: string; items: Msg[] }[] = [];
    thread.forEach(m => {
      const day = format(new Date(m.created_at), "yyyy-MM-dd");
      const last = groups[groups.length-1];
      if (last && last.day === day) last.items.push(m);
      else groups.push({ day, items: [m] });
    });
    return groups;
  }, [thread]);

  useEffect(() => {
    if (!user || !activePeer) return;
    supabase.from("direct_messages").update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id).eq("sender_id", activePeer).is("read_at", null).then(()=>{});
  }, [activePeer, user, messages.length]);

  const send = async () => {
    if (!user || !activePeer) return;
    if (editing) {
      if (!draft.trim()) return;
      await supabase.from("direct_messages").update({ body: draft, edited_at: new Date().toISOString() }).eq("id", editing.id);
      setEditing(null); setDraft(""); return;
    }
    if (!draft.trim()) return;
    await supabase.from("direct_messages").insert({
      sender_id: user.id, recipient_id: activePeer, body: draft,
      reply_to_id: replyTo?.id || null,
    });
    setDraft(""); setReplyTo(null);
  };

  const sendTyping = () => {
    if (!presenceRef.current || !activePeer || !user) return;
    if (typingTimeoutRef.current) return;
    presenceRef.current.send({ type: "broadcast", event: "typing", payload: { from: user.id, to: activePeer } });
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 1500);
  };

  const uploadAndSend = async (file: File, kind: "image"|"audio"|"file") => {
    if (!user || !activePeer) return;
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file, { contentType: file.type });
    if (error) { toast.error(error.message); return; }
    const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    await supabase.from("direct_messages").insert({
      sender_id: user.id, recipient_id: activePeer,
      body: null, attachment_url: pub.publicUrl, attachment_type: kind, attachment_name: file.name,
      reply_to_id: replyTo?.id || null,
    });
    setReplyTo(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t=>t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        await uploadAndSend(file, "audio");
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true); setRecordSec(0);
      recTimerRef.current = setInterval(()=> setRecordSec(s=>s+1), 1000);
    } catch (e:any) { toast.error(e.message || "Mic error"); }
  };
  const stopRecording = (cancel = false) => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecording(false); setRecordSec(0);
    if (mediaRef.current) {
      if (cancel) {
        mediaRef.current.ondataavailable = null as any;
        mediaRef.current.onstop = () => { mediaRef.current?.stream.getTracks().forEach(t=>t.stop()); };
      }
      mediaRef.current.stop();
      mediaRef.current = null;
    }
  };

  const deleteMessage = async (m: Msg) => {
    await supabase.from("direct_messages").update({ deleted_at: new Date().toISOString(), body: null, attachment_url: null }).eq("id", m.id);
  };

  const searchUsers = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setAllProfiles([]); return; }
    const { data } = await supabase.from("profiles").select("user_id, display_name").ilike("display_name", `%${q}%`).limit(10);
    setAllProfiles(((data as any) || []).filter((p:Profile) => p.user_id !== user?.id));
  };

  const peerName = profiles[activePeer] || activePeer.slice(0,8);
  const peerOnline = onlineUserIds.has(activePeer);
  const peerTyping = typingPeers.has(activePeer);

  const renderTick = (m: Msg) => {
    if (m.read_at) return <CheckCheck className="h-3.5 w-3.5 text-sky-400 inline" />;
    if (m.delivered_at) return <CheckCheck className="h-3.5 w-3.5 inline opacity-70" />;
    return <Check className="h-3.5 w-3.5 inline opacity-70" />;
  };

  const renderAttachment = (m: Msg, mine: boolean) => {
    if (!m.attachment_url) return null;
    if (m.attachment_type === "image") {
      return <a href={m.attachment_url} target="_blank" rel="noreferrer"><img src={m.attachment_url} alt="" className="rounded-lg max-h-64 max-w-full object-cover"/></a>;
    }
    if (m.attachment_type === "audio") {
      return <audio controls src={m.attachment_url} className="max-w-full" />;
    }
    return (
      <a href={m.attachment_url} target="_blank" rel="noreferrer" download={m.attachment_name||true}
         className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${mine?"bg-white/15":"bg-background/60"}`}>
        <Download className="h-4 w-4"/><span className="text-xs truncate max-w-[200px]">{m.attachment_name || "file"}</span>
      </a>
    );
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Messagerie", de: "Nachrichten", ar: "الرسائل" })}
      subtitle={tt({ fr: "Échangez avec vos professeurs et vos élèves", de: "Tauschen Sie sich mit Lehrern und Schülern aus", ar: "تواصل مع أساتذتك وتلاميذك" })}
      breadcrumbs={[{ label: tt({ fr: "Messages", de: "Nachrichten", ar: "الرسائل" }) }]}
    >
      <div className="grid lg:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <Card className="border-border/60 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">{tt({ fr: "Conversations", de: "Gespräche", ar: "المحادثات" })}</CardTitle>
            <div className="relative mt-2">
              <Search className="h-4 w-4 absolute start-2.5 top-2.5 text-muted-foreground"/>
              <Input placeholder={tt({ fr: "Rechercher…", de: "Suchen…", ar: "بحث…" })} value={convSearch} onChange={e=>setConvSearch(e.target.value)} className="ps-8 h-9"/>
            </div>
            <div className="relative mt-2">
              <Input placeholder={tt({ fr: "Nouveau contact…", de: "Neuer Kontakt…", ar: "جهة اتصال جديدة…" })} value={search} onChange={e=>searchUsers(e.target.value)} className="h-9"/>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto p-2 flex-1">
            {allProfiles.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">{tt({ fr: "Démarrer", de: "Starten", ar: "ابدأ" })}</div>
                {allProfiles.map(p => (
                  <button key={p.user_id} onClick={()=>{ setActivePeer(p.user_id); setSearch(""); setAllProfiles([]); setProfiles(s=>({...s, [p.user_id]: p.display_name || p.user_id.slice(0,8)})); }}
                    className="w-full text-left px-2 py-2 rounded-md hover:bg-muted text-sm flex items-center gap-2">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/15">{initials(p.display_name)}</AvatarFallback></Avatar>
                    {p.display_name || p.user_id.slice(0,8)}
                  </button>
                ))}
              </div>
            )}
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">{tt({ fr: "Aucune conversation.", de: "Keine Gespräche.", ar: "لا توجد محادثات." })}</div>
            ) : conversations.map(c => {
              const online = onlineUserIds.has(c.peer);
              return (
                <button key={c.peer} onClick={()=>setActivePeer(c.peer)}
                  className={`w-full text-left px-2 py-2 rounded-md transition flex items-center gap-3 ${activePeer===c.peer ? "bg-primary/10" : "hover:bg-muted"}`}>
                  <div className="relative">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/15 text-primary text-sm">{initials(profiles[c.peer])}</AvatarFallback></Avatar>
                    {online && <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm truncate">{profiles[c.peer] || c.peer.slice(0,8)}</div>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(c.last.created_at), "HH:mm")}</div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="text-xs text-muted-foreground truncate">
                        {c.last.deleted_at ? <i>{tt({fr:"Message supprimé",de:"Nachricht gelöscht",ar:"رسالة محذوفة"})}</i>
                          : c.last.attachment_type === "image" ? "📷 Image"
                          : c.last.attachment_type === "audio" ? "🎤 Audio"
                          : c.last.attachment_type === "file" ? "📎 " + (c.last.attachment_name||"")
                          : c.last.body}
                      </div>
                      {c.unread > 0 && <span className="h-5 min-w-5 px-1.5 grid place-items-center text-[10px] rounded-full bg-green-500 text-white">{c.unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
            {contacts.filter(c => !conversations.some(v => v.peer === c.user_id)).length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">
                  {tt({ fr: "Mes contacts", de: "Meine Kontakte", ar: "جهات اتصالي" })}
                </div>
                {contacts.filter(c => !conversations.some(v => v.peer === c.user_id)).map(p => {
                  const online = onlineUserIds.has(p.user_id);
                  return (
                    <button key={p.user_id} onClick={()=>setActivePeer(p.user_id)}
                      className={`w-full text-left px-2 py-2 rounded-md transition flex items-center gap-3 ${activePeer===p.user_id ? "bg-primary/10" : "hover:bg-muted"}`}>
                      <div className="relative">
                        <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/15 text-primary text-xs">{initials(p.display_name)}</AvatarFallback></Avatar>
                        {online && <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background"/>}
                      </div>
                      <div className="text-sm truncate">{p.display_name || p.user_id.slice(0,8)}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat panel */}
        <Card className="border-border/60 flex flex-col overflow-hidden">
          {!activePeer ? (
            <div className="flex-1 grid place-items-center text-muted-foreground">
              <div className="text-center"><MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40"/>{tt({ fr: "Sélectionnez une conversation", de: "Wählen Sie ein Gespräch", ar: "اختر محادثة" })}</div>
            </div>
          ) : (
            <>
              <CardHeader className="border-b py-3 flex-row items-center gap-3 space-y-0">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/15 text-primary">{initials(peerName)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="font-display text-base truncate">{peerName}</CardTitle>
                  <div className="text-[11px] text-muted-foreground">
                    {peerTyping ? <span className="text-green-500">{tt({fr:"écrit…",de:"schreibt…",ar:"يكتب…"})}</span>
                      : peerOnline ? tt({fr:"en ligne",de:"online",ar:"متصل"})
                      : tt({fr:"hors ligne",de:"offline",ar:"غير متصل"})}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={()=>setShowSearchBar(s=>!s)}><Search className="h-4 w-4"/></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={()=>setActivePeer("")}>{tt({fr:"Fermer",de:"Schließen",ar:"إغلاق"})}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              {showSearchBar && (
                <div className="border-b p-2">
                  <Input placeholder={tt({fr:"Rechercher dans la discussion…",de:"In Chat suchen…",ar:"ابحث في المحادثة…"})} value={threadSearch} onChange={e=>setThreadSearch(e.target.value)} className="h-9"/>
                </div>
              )}

              <CardContent ref={scrollRef as any} className="flex-1 overflow-y-auto py-4 space-y-1 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--muted))_0%,transparent_60%)]">
                {groupedThread.map(group => (
                  <div key={group.day}>
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] uppercase tracking-wider bg-background/80 border rounded-full px-3 py-1 text-muted-foreground">
                        {dayLabel(new Date(group.day), lang, dateLocale)}
                      </span>
                    </div>
                    {group.items.map(m => {
                      const mine = m.sender_id === user?.id;
                      const replyMsg = m.reply_to_id ? messages.find(x=>x.id===m.reply_to_id) : null;
                      return (
                        <div key={m.id} className={`group flex items-end gap-1 my-1 ${mine ? "justify-end" : "justify-start"}`}>
                          {!mine && <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/15">{initials(profiles[m.sender_id])}</AvatarFallback></Avatar>}
                          <div className={`relative max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-[#dcf8c6] dark:bg-emerald-900/40 text-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`}>
                            {replyMsg && (
                              <div className="border-s-2 border-primary/60 ps-2 mb-1 text-[11px] opacity-80">
                                <div className="font-medium">{replyMsg.sender_id===user?.id ? tt({fr:"Vous",de:"Sie",ar:"أنت"}) : (profiles[replyMsg.sender_id]||"")}</div>
                                <div className="truncate max-w-[220px]">{replyMsg.body || (replyMsg.attachment_type==="image"?"📷":replyMsg.attachment_type==="audio"?"🎤":"📎")}</div>
                              </div>
                            )}
                            {m.deleted_at ? (
                              <div className="italic opacity-70">{tt({fr:"Message supprimé",de:"Nachricht gelöscht",ar:"رسالة محذوفة"})}</div>
                            ) : (
                              <>
                                {renderAttachment(m, mine)}
                                {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                              </>
                            )}
                            <div className={`flex items-center gap-1 justify-end text-[10px] mt-1 ${mine ? "text-foreground/60" : "text-muted-foreground"}`}>
                              {m.edited_at && <span className="italic">{tt({fr:"modifié",de:"bearbeitet",ar:"معدّل"})}</span>}
                              <span>{format(new Date(m.created_at), "HH:mm")}</span>
                              {mine && !m.deleted_at && renderTick(m)}
                            </div>
                            {!m.deleted_at && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className={`absolute -top-2 ${mine?"-start-2":"-end-2"} opacity-0 group-hover:opacity-100 bg-background border rounded-full p-1 shadow`}>
                                    <MoreVertical className="h-3 w-3"/>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={mine?"start":"end"}>
                                  <DropdownMenuItem onClick={()=>setReplyTo(m)}><Reply className="h-3.5 w-3.5 me-2"/>{tt({fr:"Répondre",de:"Antworten",ar:"رد"})}</DropdownMenuItem>
                                  {mine && m.body && <DropdownMenuItem onClick={()=>{setEditing(m); setDraft(m.body||"");}}><Pencil className="h-3.5 w-3.5 me-2"/>{tt({fr:"Modifier",de:"Bearbeiten",ar:"تعديل"})}</DropdownMenuItem>}
                                  {mine && <DropdownMenuItem onClick={()=>deleteMessage(m)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 me-2"/>{tt({fr:"Supprimer",de:"Löschen",ar:"حذف"})}</DropdownMenuItem>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {peerTyping && (
                  <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-current rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
                      <span className="h-1.5 w-1.5 bg-current rounded-full animate-bounce" style={{animationDelay:"120ms"}}/>
                      <span className="h-1.5 w-1.5 bg-current rounded-full animate-bounce" style={{animationDelay:"240ms"}}/>
                    </div>
                    {tt({fr:"écrit…",de:"schreibt…",ar:"يكتب…"})}
                  </div>
                )}
              </CardContent>

              {/* Reply / Edit banner */}
              {(replyTo || editing) && (
                <div className="border-t bg-muted/40 px-3 py-2 flex items-center gap-2">
                  <div className="flex-1 text-xs">
                    <div className="font-medium text-primary">
                      {editing ? tt({fr:"Modifier le message",de:"Nachricht bearbeiten",ar:"تعديل الرسالة"})
                        : tt({fr:"Répondre à",de:"Antwort an",ar:"الرد على"}) + " " + (replyTo!.sender_id===user?.id ? tt({fr:"Vous",de:"Sie",ar:"أنت"}) : (profiles[replyTo!.sender_id]||""))}
                    </div>
                    <div className="truncate text-muted-foreground">{(editing||replyTo)?.body || "—"}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={()=>{ setReplyTo(null); setEditing(null); setDraft(""); }}><X className="h-4 w-4"/></Button>
                </div>
              )}

              {/* Composer */}
              <div className="border-t p-2 flex items-end gap-1">
                {recording ? (
                  <div className="flex-1 flex items-center gap-3 px-3 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"/>
                    <span className="text-sm tabular-nums">{Math.floor(recordSec/60)}:{String(recordSec%60).padStart(2,"0")}</span>
                    <span className="text-xs text-muted-foreground">{tt({fr:"Enregistrement…",de:"Aufnahme…",ar:"تسجيل…"})}</span>
                    <div className="flex-1"/>
                    <Button size="icon" variant="ghost" onClick={()=>stopRecording(true)}><X className="h-4 w-4"/></Button>
                    <Button size="icon" onClick={()=>stopRecording(false)} className="bg-green-600 hover:bg-green-700 text-white"><Send className="h-4 w-4"/></Button>
                  </div>
                ) : (
                  <>
                    <Popover>
                      <PopoverTrigger asChild><Button size="icon" variant="ghost"><Smile className="h-5 w-5"/></Button></PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="start">
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJIS.map(e => <button key={e} className="text-xl hover:bg-muted rounded p-1" onClick={()=>setDraft(d=>d+e)}>{e}</button>)}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><Paperclip className="h-5 w-5"/></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={()=>imageInputRef.current?.click()}><ImageIcon className="h-4 w-4 me-2"/>{tt({fr:"Image",de:"Bild",ar:"صورة"})}</DropdownMenuItem>
                        <DropdownMenuItem onClick={()=>fileInputRef.current?.click()}><Paperclip className="h-4 w-4 me-2"/>{tt({fr:"Document",de:"Dokument",ar:"مستند"})}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadAndSend(f, "image"); e.target.value=""; }}/>
                    <input ref={fileInputRef} type="file" hidden onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadAndSend(f, "file"); e.target.value=""; }}/>
                    <Input
                      placeholder={tt({ fr: "Écrire un message…", de: "Nachricht schreiben…", ar: "اكتب رسالة…" })}
                      value={draft}
                      onChange={e=>{ setDraft(e.target.value); sendTyping(); }}
                      onKeyDown={e=>{ if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      className="flex-1"
                    />
                    {draft.trim() || editing ? (
                      <Button size="icon" onClick={send} className="bg-green-600 hover:bg-green-700 text-white"><Send className="h-4 w-4"/></Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={startRecording}><Mic className="h-5 w-5"/></Button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </SchoolLayout>
  );
}
