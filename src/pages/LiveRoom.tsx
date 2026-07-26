import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Hand, MessageSquare, PhoneOff, Send, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Peer = {
  id: string;
  name: string;
  pc: RTCPeerConnection;
  stream: MediaStream;
  handRaised?: boolean;
};

type ChatMsg = { id: string; user_id: string; display_name: string | null; content: string; created_at: string };

const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };

export default function LiveRoom() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgDraft, setMsgDraft] = useState("");
  const [peers, setPeers] = useState<Record<string, { name: string; handRaised: boolean; hasStream: boolean }>>({});
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; handRaised: boolean }>>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const channelRef = useRef<any>(null);

  // Load room + user
  useEffect(() => {
    (async () => {
      if (!code) return;
      const { data: r } = await supabase.from("virtual_rooms").select("*").eq("code", code).maybeSingle();
      if (!r) { toast.error("Salle introuvable"); nav("/live"); return; }
      setRoom(r);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { nav("/auth"); return; }
      const { data: p } = await supabase.from("profiles").select("display_name").eq("user_id", u.user.id).maybeSingle();
      const name = p?.display_name || u.user.email?.split("@")[0] || "Invité";
      setMe({ id: u.user.id, name });
      setIsHost(r.host_id === u.user.id);
    })();
  }, [code, nav]);

  // Chat load + subscription
  useEffect(() => {
    if (!room?.id) return;
    (async () => {
      const { data } = await supabase.from("room_messages").select("*").eq("room_id", room.id).order("created_at", { ascending: true });
      setMessages((data as ChatMsg[]) ?? []);
    })();
    const ch = supabase.channel(`room-chat-${room.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMsg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [room?.id]);

  // WebRTC + signaling
  useEffect(() => {
    if (!room?.id || !me) return;
    let cancelled = false;

    const setup = async () => {
      // Get media
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
        catch { toast.error("Micro/caméra indisponibles"); stream = new MediaStream(); }
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const channel = supabase.channel(`webrtc-${room.id}`, { config: { presence: { key: me.id } } });
      channelRef.current = channel;

      const createPeer = async (remoteId: string, remoteName: string, initiator: boolean) => {
        if (peersRef.current.has(remoteId)) return peersRef.current.get(remoteId)!;
        const pc = new RTCPeerConnection(ICE);
        const remoteStream = new MediaStream();
        const peer: Peer = { id: remoteId, name: remoteName, pc, stream: remoteStream };
        peersRef.current.set(remoteId, peer);
        setPeers((p) => ({ ...p, [remoteId]: { name: remoteName, handRaised: false, hasStream: false } }));

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (ev) => {
          ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
          setPeers((p) => ({ ...p, [remoteId]: { ...(p[remoteId] || { name: remoteName, handRaised: false }), hasStream: true } }));
          const el = remoteVideoRefs.current.get(remoteId);
          if (el) el.srcObject = remoteStream;
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate) {
            channel.send({ type: "broadcast", event: "ice", payload: { to: remoteId, from: me.id, candidate: ev.candidate } });
          }
        };

        if (initiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: "broadcast", event: "offer", payload: { to: remoteId, from: me.id, name: me.name, sdp: offer } });
        }
        return peer;
      };

      const removePeer = (id: string) => {
        const p = peersRef.current.get(id);
        if (p) { p.pc.close(); peersRef.current.delete(id); }
        setPeers((prev) => { const n = { ...prev }; delete n[id]; return n; });
        remoteVideoRefs.current.delete(id);
      };

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.to !== me.id) return;
          const peer = await createPeer(payload.from, payload.name || "?", false);
          await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(answer);
          channel.send({ type: "broadcast", event: "answer", payload: { to: payload.from, from: me.id, sdp: answer } });
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.to !== me.id) return;
          const peer = peersRef.current.get(payload.from);
          if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        })
        .on("broadcast", { event: "ice" }, async ({ payload }) => {
          if (payload.to !== me.id) return;
          const peer = peersRef.current.get(payload.from);
          if (peer && payload.candidate) {
            try { await peer.pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
          }
        })
        .on("broadcast", { event: "hand" }, ({ payload }) => {
          setPeers((p) => p[payload.from] ? { ...p, [payload.from]: { ...p[payload.from], handRaised: payload.raised } } : p);
        })
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState() as Record<string, Array<{ name: string; hand?: boolean }>>;
          const list = Object.entries(state).map(([id, arr]) => ({
            id, name: arr[0]?.name ?? "?", handRaised: !!arr[0]?.hand,
          }));
          setParticipants(list);

          // Initiate connections to peers with higher id (deterministic)
          Object.keys(state).forEach((remoteId) => {
            if (remoteId === me.id) return;
            if (peersRef.current.has(remoteId)) return;
            const remoteName = state[remoteId][0]?.name ?? "?";
            if (me.id < remoteId) createPeer(remoteId, remoteName, true);
          });
        })
        .on("presence", { event: "leave" }, ({ key }) => { removePeer(key); })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ name: me.name, hand: false });
          }
        });
    };

    setup();
    return () => {
      cancelled = true;
      peersRef.current.forEach((p) => p.pc.close());
      peersRef.current.clear();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
     
  }, [room?.id, me?.id]);

  const toggleMic = () => {
    const s = localStreamRef.current; if (!s) return;
    const on = !micOn;
    s.getAudioTracks().forEach((t) => (t.enabled = on));
    setMicOn(on);
  };
  const toggleCam = () => {
    const s = localStreamRef.current; if (!s) return;
    const on = !camOn;
    s.getVideoTracks().forEach((t) => (t.enabled = on));
    setCamOn(on);
  };
  const toggleHand = async () => {
    const raised = !handRaised;
    setHandRaised(raised);
    if (channelRef.current && me) {
      await channelRef.current.track({ name: me.name, hand: raised });
      channelRef.current.send({ type: "broadcast", event: "hand", payload: { from: me.id, raised } });
    }
  };

  const sendMsg = async () => {
    const text = msgDraft.trim(); if (!text || !room || !me) return;
    setMsgDraft("");
    const { error } = await supabase.from("room_messages").insert({
      room_id: room.id, user_id: me.id, display_name: me.name, content: text,
    });
    if (error) toast.error(error.message);
  };

  const leave = async () => {
    if (isHost && room) {
      await supabase.from("virtual_rooms").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", room.id);
    }
    nav("/live");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link to="/live" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
        <Badge className="bg-red-500/20 text-red-600 border-red-500/30">● LIVE</Badge>
        <div className="flex-1">
          <div className="font-semibold text-sm">{room?.title ?? "…"}</div>
          <div className="text-xs text-muted-foreground font-mono">Code : {code}</div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" /> {participants.length}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Local */}
            <Card className="relative overflow-hidden aspect-video bg-black">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {isHost && <Crown className="w-3 h-3 me-1 text-yellow-500" />}
                  {me?.name} (toi)
                </Badge>
                {!micOn && <Badge variant="destructive" className="text-xs"><MicOff className="w-3 h-3" /></Badge>}
                {handRaised && <Badge className="text-xs bg-yellow-500">✋</Badge>}
              </div>
            </Card>
            {Object.entries(peers).map(([id, info]) => (
              <Card key={id} className="relative overflow-hidden aspect-video bg-black">
                <video
                  autoPlay playsInline
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current.set(id, el);
                      const p = peersRef.current.get(id);
                      if (p && el.srcObject !== p.stream) el.srcObject = p.stream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                {!info.hasStream && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Connexion…</div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">{info.name}</Badge>
                  {info.handRaised && <Badge className="text-xs bg-yellow-500">✋</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar chat */}
        <aside className="w-80 border-l border-border/50 hidden md:flex flex-col">
          <div className="p-3 border-b border-border/50 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /><span className="font-semibold text-sm">Chat</span>
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`p-2 rounded-lg text-sm ${m.user_id === me?.id ? "bg-primary/10 ms-6" : "bg-muted/40 me-6"}`}>
                  <div className="text-xs text-muted-foreground mb-1">{m.display_name ?? "?"}</div>
                  <div>{m.content}</div>
                </div>
              ))}
              {messages.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">Aucun message</div>}
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-border/50 flex gap-2">
            <Input value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} placeholder="Message…" />
            <Button size="icon" onClick={sendMsg}><Send className="w-4 h-4" /></Button>
          </div>
        </aside>
      </div>

      {/* Control bar */}
      <footer className="border-t border-border/50 p-3 flex items-center justify-center gap-2">
        <Button variant={micOn ? "secondary" : "destructive"} size="icon" onClick={toggleMic} title={micOn ? "Couper micro" : "Activer micro"}>
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
        <Button variant={camOn ? "secondary" : "destructive"} size="icon" onClick={toggleCam} title={camOn ? "Couper caméra" : "Activer caméra"}>
          {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>
        <Button variant={handRaised ? "default" : "secondary"} size="icon" onClick={toggleHand} title="Lever la main">
          <Hand className="w-4 h-4" />
        </Button>
        <Button variant="destructive" onClick={leave}>
          <PhoneOff className="w-4 h-4 me-2" /> {isHost ? "Terminer" : "Quitter"}
        </Button>
      </footer>
    </div>
  );
}
