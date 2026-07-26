import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessagesSquare, Pin, Lock, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Topic = {
  id: string; title: string; content: string; category: string;
  pinned: boolean; locked: boolean; reply_count: number;
  last_activity_at: string; author_id: string; school_id: string | null;
};

const CATS = ["general", "grammar", "vocab", "exams", "offtopic"];

export default function Forum() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", content: "", category: "general" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("forum_topics").select("*")
      .order("pinned", { ascending: false }).order("last_activity_at", { ascending: false }).limit(50);
    if (filter !== "all") q = q.eq("category", filter);
    const { data } = await q;
    const list = (data as Topic[]) || [];
    setTopics(list);
    const ids = [...new Set(list.map((t) => t.author_id))];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("user_id,display_name").in("user_id", ids);
      setAuthors(Object.fromEntries((p || []).map((x: any) => [x.user_id, x.display_name])));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const create = async () => {
    if (!newTopic.title.trim() || !newTopic.content.trim()) { toast.error("Titre et contenu requis"); return; }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("forum_topics").insert({
      title: newTopic.title, content: newTopic.content, category: newTopic.category,
      author_id: u.user.id,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setNewTopic({ title: "", content: "", category: "general" });
    toast.success("Sujet créé"); load();
  };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Communauté
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><MessagesSquare className="text-primary" /> Forum</h1>
          <p className="text-muted-foreground">Posez vos questions, aidez les autres apprenants.</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nouveau sujet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer un sujet</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Titre" value={newTopic.title} onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })} />
                <Select value={newTopic.category} onValueChange={(v) => setNewTopic({ ...newTopic, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Votre message…" rows={6}
                  value={newTopic.content} onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })} />
                <Button onClick={create}>Publier</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}
        {!loading && topics.length === 0 && <p className="text-muted-foreground">Aucun sujet. Soyez le premier !</p>}
        {topics.map((t) => (
          <Link key={t.id} to={`/forum/${t.id}`}>
            <Card className="hover:border-primary transition">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.pinned && <Pin className="w-4 h-4 text-primary" />}
                    {t.locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-semibold">{t.title}</span>
                    <Badge variant="outline">{t.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.content}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    par {authors[t.author_id] || "…"} · {formatDistanceToNow(new Date(t.last_activity_at), { addSuffix: true, locale: fr })}
                  </div>
                </div>
                <Badge variant="secondary">{t.reply_count} 💬</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
