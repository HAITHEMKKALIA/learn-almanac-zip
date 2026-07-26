import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Pin, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function ForumTopic() {
  const { id } = useParams();
  const [topic, setTopic] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [content, setContent] = useState("");
  const [me, setMe] = useState<string | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    setMe(u.user?.id || null);
    const { data: t } = await supabase.from("forum_topics").select("*").eq("id", id).single();
    setTopic(t);
    const { data: r } = await supabase.from("forum_replies").select("*").eq("topic_id", id!).order("created_at");
    const list = r || [];
    setReplies(list);
    const ids = [...new Set([t?.author_id, ...list.map((x: any) => x.author_id)].filter(Boolean))];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("user_id,display_name").in("user_id", ids);
      setAuthors(Object.fromEntries((p || []).map((x: any) => [x.user_id, x.display_name])));
    }
    if (u.user && list.length) {
      const { data: l } = await supabase.from("forum_likes").select("reply_id")
        .eq("user_id", u.user.id).in("reply_id", list.map((x: any) => x.id));
      setLiked(new Set((l || []).map((x: any) => x.reply_id)));
    }
  };
  useEffect(() => { if (id) load(); }, [id]);

  const reply = async () => {
    if (!content.trim() || !me) return;
    const { error } = await supabase.from("forum_replies").insert({ topic_id: id, content, author_id: me });
    if (error) { toast.error(error.message); return; }
    setContent(""); load();
  };

  const toggleLike = async (rid: string) => {
    if (!me) return;
    if (liked.has(rid)) {
      await supabase.from("forum_likes").delete().eq("reply_id", rid).eq("user_id", me);
    } else {
      await supabase.from("forum_likes").insert({ reply_id: rid, user_id: me });
    }
    load();
  };

  const deleteReply = async (rid: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("forum_replies").delete().eq("id", rid);
    load();
  };

  if (!topic) return <div className="container py-8">Chargement…</div>;

  return (
    <div className="container max-w-3xl py-8 space-y-4">
      <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Forum
      </Link>
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {topic.pinned && <Pin className="w-4 h-4 text-primary" />}
            {topic.locked && <Lock className="w-4 h-4 text-muted-foreground" />}
            <h1 className="text-2xl font-bold">{topic.title}</h1>
            <Badge variant="outline">{topic.category}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            par {authors[topic.author_id] || "…"} · {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: fr })}
          </div>
          <p className="whitespace-pre-wrap mt-3">{topic.content}</p>
        </CardContent>
      </Card>

      <h2 className="font-semibold">{replies.length} réponse{replies.length > 1 ? "s" : ""}</h2>
      <div className="space-y-2">
        {replies.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{authors[r.author_id] || "…"} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}</span>
                {r.author_id === me && (
                  <Button size="sm" variant="ghost" onClick={() => deleteReply(r.id)}><Trash2 className="w-3 h-3" /></Button>
                )}
              </div>
              <p className="whitespace-pre-wrap">{r.content}</p>
              <Button size="sm" variant={liked.has(r.id) ? "default" : "outline"} className="mt-2"
                onClick={() => toggleLike(r.id)}>
                <Heart className={`w-3 h-3 mr-1 ${liked.has(r.id) ? "fill-current" : ""}`} /> {r.likes_count}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!topic.locked && me && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <Textarea placeholder="Votre réponse…" rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
            <Button onClick={reply}>Répondre</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
