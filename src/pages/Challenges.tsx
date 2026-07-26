import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Plus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Challenge = {
  id: string; title: string; description: string | null; category: string;
  target_value: number; xp_reward: number; starts_at: string; ends_at: string; school_id: string | null;
};

export default function Challenges() {
  const [items, setItems] = useState<Challenge[]>([]);
  const [parts, setParts] = useState<Record<string, { progress: number; completed: boolean }>>({});
  const [canCreate, setCanCreate] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "vocab", target_value: 30, xp_reward: 100, days: 7 });

  const load = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase.from("weekly_challenges").select("*")
      .lte("starts_at", now).gte("ends_at", now)
      .order("ends_at");
    const list = (data as Challenge[]) || [];
    setItems(list);
    const { data: u } = await supabase.auth.getUser();
    if (u.user && list.length) {
      const { data: p } = await supabase.from("challenge_participations").select("*")
        .eq("user_id", u.user.id).in("challenge_id", list.map((c) => c.id));
      setParts(Object.fromEntries((p || []).map((x: any) => [x.challenge_id, { progress: x.progress, completed: x.completed }])));
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      setCanCreate((roles || []).some((r: any) => ["admin", "teacher", "school_admin", "super_admin"].includes(r.role)));
    }
  };
  useEffect(() => { load(); }, []);

  const join = async (cid: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("challenge_participations").insert({ challenge_id: cid, user_id: u.user.id });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    toast.success("Défi rejoint"); load();
  };

  const progress = async (cid: string, delta: number, target: number) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const cur = parts[cid]?.progress || 0;
    const next = Math.min(target, cur + delta);
    const done = next >= target;
    await supabase.from("challenge_participations")
      .update({ progress: next, completed: done, completed_at: done ? new Date().toISOString() : null })
      .eq("challenge_id", cid).eq("user_id", u.user.id);
    if (done) toast.success("🎉 Défi complété !");
    load();
  };

  const createChallenge = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !form.title.trim()) { toast.error("Titre requis"); return; }
    const ends = new Date(); ends.setDate(ends.getDate() + form.days);
    const { error } = await supabase.from("weekly_challenges").insert({
      title: form.title, description: form.description, category: form.category,
      target_value: form.target_value, xp_reward: form.xp_reward,
      ends_at: ends.toISOString(), created_by: u.user.id,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); toast.success("Défi créé"); load();
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Communauté
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Trophy className="text-primary" /> Défis</h1>
          <p className="text-muted-foreground">Rejoignez des défis d'apprentissage et gagnez du XP.</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Créer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau défi</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vocab">Vocabulaire</SelectItem>
                    <SelectItem value="grammar">Grammaire</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="exam">Examen</SelectItem>
                    <SelectItem value="general">Général</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-xs">Objectif</label>
                    <Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: +e.target.value })} /></div>
                  <div><label className="text-xs">XP</label>
                    <Input type="number" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: +e.target.value })} /></div>
                  <div><label className="text-xs">Durée (j)</label>
                    <Input type="number" value={form.days} onChange={(e) => setForm({ ...form, days: +e.target.value })} /></div>
                </div>
                <Button onClick={createChallenge}>Créer</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {items.length === 0 && <p className="text-muted-foreground text-sm">Aucun défi actif.</p>}
        {items.map((c) => {
          const p = parts[c.id];
          const pct = p ? Math.round((p.progress / c.target_value) * 100) : 0;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">{c.title}
                    {p?.completed && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </span>
                  <Badge>+{c.xp_reward} XP</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">{c.category}</Badge>
                  <span className="text-muted-foreground">Fin {formatDistanceToNow(new Date(c.ends_at), { addSuffix: true, locale: fr })}</span>
                </div>
                {p ? (
                  <>
                    <Progress value={pct} />
                    <div className="flex items-center justify-between text-sm">
                      <span>{p.progress} / {c.target_value}</span>
                      {!p.completed && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => progress(c.id, 1, c.target_value)}>+1</Button>
                          <Button size="sm" variant="outline" onClick={() => progress(c.id, 5, c.target_value)}>+5</Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <Button size="sm" onClick={() => join(c.id)}>Rejoindre</Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
