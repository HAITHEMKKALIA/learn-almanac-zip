import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { fr, de, ar } from "date-fns/locale";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type Ev = { id: string; title: string; description: string|null; starts_at: string; ends_at: string|null; kind: string; class_id: string|null; author_id: string };

const KIND_COLOR: Record<string,string> = {
  exam: "bg-destructive/15 text-destructive border-destructive/30",
  homework: "bg-primary/15 text-primary border-primary/30",
  event: "bg-accent/20 text-accent-foreground border-accent/30",
  holiday: "bg-success/15 text-success border-success/30",
};

export default function CalendarPage() {
  const { user, isTeacher, isAdmin } = useAuth();
  const { tt, lang } = useI18n();
  const canPost = isTeacher || isAdmin;
  const [events, setEvents] = useState<Ev[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", starts_at: "", kind: "event", class_id: "" });
  const dateLocale = lang === "ar" ? ar : lang === "de" ? de : fr;

  const KIND_LABEL = (k: string) => tt(({
    event: { fr: "événement", de: "Termin", ar: "فعالية" },
    exam: { fr: "examen", de: "Prüfung", ar: "امتحان" },
    homework: { fr: "devoir", de: "Aufgabe", ar: "واجب" },
    holiday: { fr: "vacances", de: "Ferien", ar: "عطلة" },
  } as any)[k] || { fr: k, de: k, ar: k });

  const load = async () => {
    const { data } = await supabase.from("calendar_events").select("*").order("starts_at", { ascending: true });
    setEvents((data as any) || []);
    if (canPost) {
      const { data: cls } = await supabase.from("classes").select("id,name,level");
      setClasses(cls || []);
    }
  };
  useEffect(() => { load(); }, [canPost]);

  const create = async () => {
    if (!form.title || !form.starts_at || !user) return;
    const payload: any = {
      author_id: user.id, title: form.title, description: form.description || null,
      starts_at: new Date(form.starts_at).toISOString(), kind: form.kind,
      class_id: form.class_id || null,
    };
    const { error } = await supabase.from("calendar_events").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success(tt({ fr: "Événement créé", de: "Termin erstellt", ar: "تم إنشاء الفعالية" })); setOpen(false); setForm({ title:"", description:"", starts_at:"", kind:"event", class_id:"" }); load(); }
  };
  const remove = async (id: string) => { await supabase.from("calendar_events").delete().eq("id", id); load(); };

  const grouped = useMemo(() => {
    const map = new Map<string, Ev[]>();
    events.forEach(e => {
      const k = format(parseISO(e.starts_at), "yyyy-MM-dd");
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return Array.from(map.entries()).sort();
  }, [events]);

  return (
    <SchoolLayout
      title={tt({ fr: "Calendrier", de: "Kalender", ar: "التقويم" })}
      subtitle={tt({ fr: "Examens, devoirs et événements à venir", de: "Prüfungen, Aufgaben und kommende Termine", ar: "امتحانات وواجبات وفعاليات قادمة" })}
      breadcrumbs={[{ label: tt({ fr: "Calendrier", de: "Kalender", ar: "التقويم" }) }]}
      actions={canPost && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-warm text-white border-0"><Plus className="h-4 w-4 me-2"/>{tt({ fr: "Nouvel événement", de: "Neuer Termin", ar: "فعالية جديدة" })}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{tt({ fr: "Nouvel événement", de: "Neuer Termin", ar: "فعالية جديدة" })}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder={tt({ fr: "Titre", de: "Titel", ar: "العنوان" })} value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
              <Textarea placeholder={tt({ fr: "Description (facultative)", de: "Beschreibung (optional)", ar: "الوصف (اختياري)" })} value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/>
              <div className="grid grid-cols-2 gap-2">
                <Input type="datetime-local" value={form.starts_at} onChange={e=>setForm({...form, starts_at:e.target.value})}/>
                <Select value={form.kind} onValueChange={v=>setForm({...form, kind:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">{tt({ fr: "Événement", de: "Termin", ar: "فعالية" })}</SelectItem>
                    <SelectItem value="exam">{tt({ fr: "Examen", de: "Prüfung", ar: "امتحان" })}</SelectItem>
                    <SelectItem value="homework">{tt({ fr: "Devoir", de: "Aufgabe", ar: "واجب" })}</SelectItem>
                    <SelectItem value="holiday">{tt({ fr: "Vacances", de: "Ferien", ar: "عطلة" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={form.class_id || "all"} onValueChange={v=>setForm({...form, class_id: v==="all" ? "" : v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tt({ fr: "Toute l'école", de: "Ganze Schule", ar: "المدرسة كلّها" })}</SelectItem>
                  {classes.map(c=>(<SelectItem key={c.id} value={c.id}>{c.name} · {c.level}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button onClick={create} className="w-full">{tt({ fr: "Créer", de: "Erstellen", ar: "إنشاء" })}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    >
      {grouped.length === 0 ? (
        <Card className="border-border/60"><CardContent className="py-10 text-center text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40"/>{tt({ fr: "Aucun événement programmé.", de: "Keine Termine geplant.", ar: "لا توجد فعاليات مبرمجة." })}
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, evs]) => (
            <div key={day}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 sticky top-14 bg-muted/30 py-1">
                {format(parseISO(day), "EEEE d MMMM yyyy", { locale: dateLocale })}
                {isSameDay(parseISO(day), new Date()) && <Badge className="ms-2 bg-secondary/20 text-secondary border-secondary/30">{tt({ fr: "aujourd'hui", de: "heute", ar: "اليوم" })}</Badge>}
              </div>
              <div className="space-y-2">
                {evs.map(e => (
                  <Card key={e.id} className="border-border/60 hover:border-primary/30 transition">
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="text-center shrink-0 w-14">
                        <div className="text-xs text-muted-foreground uppercase">{format(parseISO(e.starts_at), "HH:mm")}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {e.title}
                          <Badge variant="outline" className={KIND_COLOR[e.kind]}>{KIND_LABEL(e.kind)}</Badge>
                        </div>
                        {e.description && <div className="text-xs text-muted-foreground mt-0.5 truncate">{e.description}</div>}
                      </div>
                      {(canPost && e.author_id === user?.id) && (
                        <Button size="sm" variant="ghost" onClick={()=>remove(e.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SchoolLayout>
  );
}
