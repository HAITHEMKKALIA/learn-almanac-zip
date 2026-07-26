import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Plus, LogIn, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";

type Room = { id: string; code: string; title: string; host_id: string; status: string; started_at: string };

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function Live() {
  const nav = useNavigate();
  const { activeSchoolId } = useActiveSchool() as any;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("virtual_rooms")
      .select("id,code,title,host_id,status,started_at")
      .eq("status", "live")
      .order("started_at", { ascending: false });
    setRooms((data as Room[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title.trim()) { toast.error("Titre requis"); return; }
    setCreating(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setCreating(false); return; }
    const code = genCode();
    const { data, error } = await supabase.from("virtual_rooms").insert({
      code, title: title.trim(), host_id: u.user.id, school_id: activeSchoolId ?? null,
    }).select("code").single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    nav(`/live/${data!.code}`);
  };

  const join = async (code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) { toast.error("Code requis"); return; }
    const { data } = await supabase.from("virtual_rooms").select("code,status").eq("code", c).maybeSingle();
    if (!data) { toast.error("Salle introuvable"); return; }
    if (data.status !== "live") { toast.error("Salle terminée"); return; }
    nav(`/live/${c}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Video className="w-8 h-8 text-primary" /> Classe virtuelle
          </h1>
          <p className="text-muted-foreground">Cours live audio/vidéo en direct avec chat</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-primary" /><h3 className="font-semibold">Créer une salle</h3></div>
            <Label className="text-xs">Titre du cours</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Révision A2 - Perfekt" className="mt-1 mb-4" />
            <Button onClick={create} disabled={creating} className="w-full">
              <Radio className="w-4 h-4 me-2" /> Démarrer la session
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4"><LogIn className="w-5 h-5 text-primary" /><h3 className="font-semibold">Rejoindre avec un code</h3></div>
            <Label className="text-xs">Code à 6 caractères</Label>
            <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} className="mt-1 mb-4 uppercase tracking-widest" />
            <Button onClick={() => join(joinCode)} variant="secondary" className="w-full">
              Rejoindre
            </Button>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Salles en direct</h3>
          {rooms.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Aucune salle live actuellement</div>
          ) : (
            <ul className="space-y-2">
              {rooms.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition">
                  <Badge className="bg-red-500/20 text-red-600 border-red-500/30">● LIVE</Badge>
                  <div className="flex-1">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.code}</div>
                  </div>
                  <Button size="sm" onClick={() => join(r.code)}>Rejoindre</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
