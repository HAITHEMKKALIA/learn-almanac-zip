import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr, de, ar } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";

type Annc = { id: string; title: string; body: string; scope: string; class_id: string|null; pinned: boolean; created_at: string; author_id: string };

export default function Announcements() {
  const { user, isTeacher, isAdmin } = useAuth();
  const { tt, lang } = useI18n();
  const [items, setItems] = useState<Annc[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<"school"|"class">("school");
  const [classId, setClassId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const canPost = isTeacher || isAdmin;
  const dateLocale = lang === "ar" ? ar : lang === "de" ? de : fr;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(100);
    setItems((data as any) || []);
    if (canPost) {
      const { data: cls } = await supabase.from("classes").select("id,name,level");
      setClasses(cls || []);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [canPost]);

  const post = async () => {
    if (!title.trim() || !body.trim() || !user) return;
    const payload: any = { title, body, scope, author_id: user.id, class_id: scope === "class" ? classId : null };
    const { error } = await supabase.from("announcements").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success(tt({ fr: "Annonce publiée", de: "Ankündigung veröffentlicht", ar: "تم نشر الإعلان" })); setTitle(""); setBody(""); load(); }
  };
  const togglePin = async (a: Annc) => {
    await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm(tt({ fr: "Supprimer cette annonce ?", de: "Diese Ankündigung löschen?", ar: "حذف هذا الإعلان؟" }))) return;
    await supabase.from("announcements").delete().eq("id", id);
    load();
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Annonces", de: "Ankündigungen", ar: "الإعلانات" })}
      subtitle={tt({ fr: "Communications de l'école et de vos classes", de: "Mitteilungen der Schule und Ihrer Klassen", ar: "تواصلات المدرسة وصفوفك" })}
      breadcrumbs={[{ label: tt({ fr: "Annonces", de: "Ankündigungen", ar: "الإعلانات" }) }]}
    >
      {canPost && (
        <Card className="border-border/60 mb-6">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Plus className="h-5 w-5 text-primary"/>{tt({ fr: "Nouvelle annonce", de: "Neue Ankündigung", ar: "إعلان جديد" })}</CardTitle>
            <CardDescription>{tt({ fr: "Visible par toute l'école ou par une classe spécifique.", de: "Sichtbar für die ganze Schule oder eine bestimmte Klasse.", ar: "ظاهر للمدرسة كلّها أو لصفّ محدّد." })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder={tt({ fr: "Titre", de: "Titel", ar: "العنوان" })} value={title} onChange={e=>setTitle(e.target.value)} />
            <Textarea placeholder={tt({ fr: "Contenu de l'annonce…", de: "Inhalt der Ankündigung…", ar: "محتوى الإعلان…" })} value={body} onChange={e=>setBody(e.target.value)} rows={4}/>
            <div className="flex gap-2 flex-wrap">
              <Select value={scope} onValueChange={(v:any)=>setScope(v)}>
                <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">{tt({ fr: "École entière", de: "Ganze Schule", ar: "المدرسة كلّها" })}</SelectItem>
                  <SelectItem value="class">{tt({ fr: "Une classe", de: "Eine Klasse", ar: "صفّ واحد" })}</SelectItem>
                </SelectContent>
              </Select>
              {scope === "class" && (
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="w-64"><SelectValue placeholder={tt({ fr: "Choisir la classe…", de: "Klasse wählen…", ar: "اختر الصفّ…" })}/></SelectTrigger>
                  <SelectContent>{classes.map(c=>(<SelectItem key={c.id} value={c.id}>{c.name} · {c.level}</SelectItem>))}</SelectContent>
                </Select>
              )}
              <div className="flex-1"/>
              <Button onClick={post} className="bg-gradient-warm text-white border-0">{tt({ fr: "Publier", de: "Veröffentlichen", ar: "نشر" })}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? <p className="text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</p> :
         items.length === 0 ? (
            <Card className="border-border/60"><CardContent className="py-10 text-center text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40"/>{tt({ fr: "Aucune annonce pour l'instant.", de: "Noch keine Ankündigung.", ar: "لا توجد إعلانات حاليًا." })}
            </CardContent></Card>
         ) : items.map(a => (
          <Card key={a.id} className={`border-border/60 ${a.pinned ? "border-l-4 border-l-secondary" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-display flex items-center gap-2 text-lg">
                    {a.pinned && <Pin className="h-4 w-4 text-secondary"/>}{a.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-primary/30 text-primary">{a.scope === "school" ? tt({ fr: "École", de: "Schule", ar: "المدرسة" }) : tt({ fr: "Classe", de: "Klasse", ar: "صف" })}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { locale: dateLocale, addSuffix: true })}</span>
                  </div>
                </div>
                {(canPost && a.author_id === user?.id) && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={()=>togglePin(a)}><Pin className="h-3 w-3"/></Button>
                    <Button size="sm" variant="ghost" onClick={()=>remove(a.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{a.body}</CardContent>
          </Card>
        ))}
      </div>
    </SchoolLayout>
  );
}
