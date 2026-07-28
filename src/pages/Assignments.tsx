import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Play, Square, Trash2, Eye, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { AiGenerateButton } from "@/components/school/AiGenerateButton";
import { AiHistoryPanel } from "@/components/school/AiHistoryPanel";
import { pushAiHistory } from "@/lib/aiHistory";
import { AcademyMotionPage, AcademyBadge } from "@/components/academy/AcademyUI";

const STATUSES = ["draft","scheduled","open","closed"] as const;

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [bank, setBank] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bankFilter, setBankFilter] = useState("");
  const [bankLevelFilter, setBankLevelFilter] = useState<string>("auto"); // 'auto' = niveau du devoir
  const [bankSourceFilter, setBankSourceFilter] = useState<string>("all");
  const [aiAutoLoading, setAiAutoLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [a, c, b] = await Promise.all([
      supabase.from("assignments").select("*, classes(name)").order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name, level"),
      supabase.from("question_bank").select("id, level, skill, kind, prompt_de, prompt_fr, prompt_ar, points, source").limit(2000),
    ]);
    if (a.error) toast.error(a.error.message);
    setItems(a.data || []); setClasses(c.data || []); setBank(b.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEdit({
      title: "", description: "", class_id: classes[0]?.id || "",
      level: classes[0]?.level || "A1", duration_minutes: 30, max_attempts: 1,
      shuffle_questions: true, lockdown_strict: true, passing_score: 60,
      available_from: "", available_until: "", status: "draft",
      proctor_settings: { tab_switch: true, copy_paste: true, fullscreen: true, block_context: true, multi_screen: false, webcam_snapshots: false, snapshot_interval: 30 },
    });
    setSelected(new Set());
    setOpen(true);
  };

  const startEdit = async (a: any) => {
    setEdit({ ...a });
    const { data } = await supabase.from("assignment_questions").select("question_id").eq("assignment_id", a.id);
    setSelected(new Set((data||[]).map((r:any)=>r.question_id)));
    setOpen(true);
  };

  const save = async () => {
    if (!user || !edit?.title?.trim() || !edit?.class_id) { toast.error("Titre et classe requis"); return; }
    const payload: any = {
      teacher_id: user.id, class_id: edit.class_id, title: edit.title, description: edit.description,
      level: edit.level, duration_minutes: Number(edit.duration_minutes)||30,
      max_attempts: Number(edit.max_attempts)||1, shuffle_questions: true,
      lockdown_strict: true, passing_score: Number(edit.passing_score)||60,
      available_from: edit.available_from || null, available_until: edit.available_until || null,
      status: edit.status || "draft",
      proctor_settings: edit.proctor_settings || null,
    };
    let assignmentId = edit.id;
    if (edit.id) {
      const { error } = await supabase.from("assignments").update(payload).eq("id", edit.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from("assignments").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      assignmentId = data.id;
    }
    // Sync questions
    await supabase.from("assignment_questions").delete().eq("assignment_id", assignmentId);
    if (selected.size > 0) {
      const rows = Array.from(selected).map((qid, i) => ({ assignment_id: assignmentId, question_id: qid, position: i }));
      const { error } = await supabase.from("assignment_questions").insert(rows);
      if (error) { toast.error("Sync questions : " + error.message); return; }
    }
    toast.success("Enregistré"); setOpen(false); load();
  };

  const setStatus = async (a: any, s: string) => {
    const { error } = await supabase.from("assignments").update({ status: s as any }).eq("id", a.id);
    if (error) toast.error(error.message); else { toast.success("Statut: " + s); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce devoir ?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); load(); }
  };

  const effectiveLevel = bankLevelFilter === "auto" ? edit?.level : (bankLevelFilter === "all" ? null : bankLevelFilter);
  const filteredBank = useMemo(() => bank.filter(q =>
    (!effectiveLevel || q.level === effectiveLevel) &&
    (bankSourceFilter === "all" || q.source === bankSourceFilter) &&
    (!bankFilter || q.prompt_de?.toLowerCase().includes(bankFilter.toLowerCase()) || q.prompt_fr?.toLowerCase().includes(bankFilter.toLowerCase()))
  ), [bank, effectiveLevel, bankSourceFilter, bankFilter]);

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  return (
    <div className="min-h-[100dvh] bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
      <AcademyMotionPage>
        <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <Link to="/teacher" className="text-sm text-muted-foreground hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3 rtl:rotate-180"/>{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}</Link>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1 truncate">📝 {tt({ fr: "Devoirs & examens", de: "Aufgaben & Prüfungen", ar: "الواجبات والامتحانات" })}</h1>
          </div>
          <Button onClick={startNew} className="bg-gradient-warm text-white border-0 w-full sm:w-auto"><Plus className="w-4 h-4 me-2"/>{tt({ fr: "Nouveau devoir", de: "Neue Aufgabe", ar: "واجب جديد" })}</Button>
        </div>

        <Card>
          <CardContent className="pt-4">
            {loading ? <p className="text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</p> :
             items.length === 0 ? <p className="text-muted-foreground">{tt({ fr: "Aucun devoir.", de: "Keine Aufgaben.", ar: "لا توجد واجبات." })}</p> :
              <div className="space-y-2">
                {items.map(a => (
                  <div key={a.id} className="border rounded-lg p-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1 mb-1">
                        <Badge>{a.level}</Badge>
                        <Badge variant={a.status==="open"?"default":a.status==="closed"?"destructive":"secondary"}>{a.status}</Badge>
                        <Badge variant="outline">{a.duration_minutes} min</Badge>
                        {a.lockdown_strict && <Badge variant="destructive">🔒 strict</Badge>}
                      </div>
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-xs text-muted-foreground">Classe : {a.classes?.name || "—"}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {a.status !== "open" && <Button size="sm" variant="outline" onClick={()=>setStatus(a,"open")}><Play className="w-3 h-3 mr-1"/>Ouvrir</Button>}
                      {a.status === "open" && <Button size="sm" variant="outline" onClick={()=>setStatus(a,"closed")}><Square className="w-3 h-3 mr-1"/>Fermer</Button>}
                      <Link to={`/teacher/assignments/${a.id}`}><Button size="sm" variant="ghost"><Eye className="w-4 h-4"/></Button></Link>
                      <Button size="sm" variant="ghost" onClick={()=>startEdit(a)}><Pencil className="w-4 h-4"/></Button>
                      <Button size="sm" variant="ghost" onClick={()=>remove(a.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        <AiHistoryPanel filterMode="exam" />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl w-[calc(100vw-1rem)] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader><DialogTitle>{edit?.id ? "Modifier" : "Nouveau"} devoir</DialogTitle></DialogHeader>
            {edit && <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-2">
                <div><Label>Titre *</Label><Input value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})}/></div>
                <div><Label>Classe *</Label>
                  <Select value={edit.class_id} onValueChange={v=>{const c=classes.find((x:any)=>x.id===v); setEdit({...edit,class_id:v, level: c?.level || edit.level});}}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{classes.map((c:any)=><SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={edit.description||""} onChange={e=>setEdit({...edit,description:e.target.value})} rows={2}/></div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><Label>Niveau</Label>
                  <Select value={edit.level} onValueChange={v=>setEdit({...edit,level:v})}><SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{["A1","A2","B1","B2"].map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Durée (min)</Label><Input type="number" min="1" value={edit.duration_minutes} onChange={e=>setEdit({...edit,duration_minutes:e.target.value})}/></div>
                <div><Label>Tentatives</Label><Input type="number" min="1" value={edit.max_attempts} onChange={e=>setEdit({...edit,max_attempts:e.target.value})}/></div>
                <div><Label>Note de passage (%)</Label><Input type="number" min="0" max="100" value={edit.passing_score} onChange={e=>setEdit({...edit,passing_score:e.target.value})}/></div>
              </div>

              <div className="grid md:grid-cols-2 gap-2">
                <div><Label>Disponible à partir de</Label><Input type="datetime-local" value={edit.available_from?.slice(0,16)||""} onChange={e=>setEdit({...edit,available_from:e.target.value})}/></div>
                <div><Label>Jusqu'à</Label><Input type="datetime-local" value={edit.available_until?.slice(0,16)||""} onChange={e=>setEdit({...edit,available_until:e.target.value})}/></div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm opacity-80" title="Verrouillé : le mélange est figé au démarrage de l'épreuve">
                  <input type="checkbox" checked disabled /> 🔀 Mélanger les questions (verrouillé)
                </label>
                <label className="flex items-center gap-2 text-sm opacity-80" title="Verrouillé : anti-triche strict obligatoire">
                  <input type="checkbox" checked disabled /> 🔒 Mode anti-triche strict (verrouillé)
                </label>
              </div>

              {edit.lockdown_strict && (
                <div className="border rounded p-3 space-y-2 bg-muted/30">
                  <Label className="font-semibold">🛡️ Méthodes anti-triche actives</Label>
                  <p className="text-xs text-muted-foreground">Choisissez les contrôles à appliquer pendant cet examen.</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    {[
                      { key: "tab_switch", label: "Détecter le changement d'onglet / perte de focus" },
                      { key: "copy_paste", label: "Bloquer copier / coller / raccourcis" },
                      { key: "block_context", label: "Bloquer le clic droit" },
                      { key: "fullscreen", label: "Forcer le plein écran" },
                      { key: "multi_screen", label: "Détecter les écrans multiples" },
                      { key: "webcam_snapshots", label: "Snapshots webcam périodiques" },
                    ].map(o => (
                      <label key={o.key} className="flex items-center gap-2">
                        <input type="checkbox"
                          checked={!!edit.proctor_settings?.[o.key]}
                          onChange={e => setEdit({ ...edit, proctor_settings: { ...(edit.proctor_settings||{}), [o.key]: e.target.checked } })}/>
                        {o.label}
                      </label>
                    ))}
                  </div>
                  {edit.proctor_settings?.webcam_snapshots && (
                    <div className="flex items-center gap-2 text-sm pt-1">
                      <Label className="m-0">Intervalle snapshot (s)</Label>
                      <Input type="number" min="10" className="w-24" value={edit.proctor_settings?.snapshot_interval || 30}
                        onChange={e => setEdit({ ...edit, proctor_settings: { ...(edit.proctor_settings||{}), snapshot_interval: Number(e.target.value)||30 } })}/>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <AiGenerateButton
                  mode="exam"
                  level={edit.level || "A1"}
                  category="lesen"
                  title={edit.title}
                  count={10}
                  buttonLabel="Générer questions avec IA (PDF supporté)"
                  onResult={async (d) => {
                    const ids: string[] = d?.question_ids || [];
                    if (ids.length) {
                      setSelected((prev) => new Set([...Array.from(prev), ...ids]));
                      setEdit((e: any) => ({ ...e, shuffle_questions: true, lockdown_strict: true }));
                      const { data: b } = await supabase.from("question_bank").select("id, level, skill, kind, prompt_de, prompt_fr, prompt_ar, points, source").limit(2000);
                      setBank(b || []);
                      pushAiHistory({ mode: "exam", level: edit.level || "A1", category: "lesen", title: edit.title, status: "success", count: ids.length, ids, message: `${ids.length} questions ajoutées à la banque (PDF)` });
                    } else {
                      pushAiHistory({ mode: "exam", level: edit.level || "A1", title: edit.title, status: "error", message: "Aucune question générée" });
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={aiAutoLoading}
                  onClick={async () => {
                    setAiAutoLoading(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("ai-pedagogy", {
                        body: {
                          mode: "exam",
                          level: edit.level || "A1",
                          category: "lesen",
                          title: edit.title || "",
                          hint: edit.description || "",
                          source_text: "",
                          count: 10,
                        },
                      });
                      if (error) throw error;
                      if ((data as any)?.error) throw new Error((data as any).error);
                      const ids: string[] = (data as any)?.question_ids || [];
                      if (ids.length) {
                        setSelected((prev) => new Set([...Array.from(prev), ...ids]));
                        setEdit((e: any) => ({ ...e, shuffle_questions: true, lockdown_strict: true }));
                        const { data: b } = await supabase.from("question_bank").select("id, level, skill, kind, prompt_de, prompt_fr, prompt_ar, points, source").limit(2000);
                        setBank(b || []);
                        toast.success(`✨ ${ids.length} questions générées et ajoutées à la banque`);
                        pushAiHistory({ mode: "exam", level: edit.level || "A1", category: "lesen", title: edit.title, status: "success", count: ids.length, ids, message: `${ids.length} questions ajoutées (sans PDF)` });
                      } else {
                        toast.warning("Aucune question générée");
                        pushAiHistory({ mode: "exam", level: edit.level || "A1", title: edit.title, status: "error", message: "Aucune question générée" });
                      }
                    } catch (e: any) {
                      toast.error(e.message || "Erreur génération");
                      pushAiHistory({ mode: "exam", level: edit.level || "A1", title: edit.title, status: "error", message: e.message || "Erreur génération" });
                    } finally {
                      setAiAutoLoading(false);
                    }
                  }}
                  className="gap-2"
                >
                  {aiAutoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                  Générer questions avec IA (sans PDF)
                </Button>
              </div>

              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label>Questions sélectionnées : {selected.size}</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={bankLevelFilter} onValueChange={setBankLevelFilter}>
                      <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Niveau du devoir</SelectItem>
                        <SelectItem value="all">Tous niveaux</SelectItem>
                        {["A1","A2","B1","B2"].map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={bankSourceFilter} onValueChange={setBankSourceFilter}>
                      <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes sources</SelectItem>
                        <SelectItem value="goethe">Goethe</SelectItem>
                        <SelectItem value="oesd">ÖSD</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Filtrer (DE/FR)…" value={bankFilter} onChange={e=>setBankFilter(e.target.value)} className="w-48"/>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {filteredBank.map(q => (
                    <label key={q.id} className={"flex items-start gap-2 p-2 rounded text-xs cursor-pointer hover:bg-muted/50 " + (selected.has(q.id) ? "bg-primary/10" : "")}>
                      <input type="checkbox" checked={selected.has(q.id)} onChange={()=>toggle(q.id)} className="mt-1"/>
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1 mb-1"><Badge variant="outline" className="text-[10px]">{q.level}</Badge><Badge variant="outline" className="text-[10px]">{q.kind}</Badge><Badge variant="outline" className="text-[10px]">{q.skill}</Badge><Badge variant="outline" className="text-[10px]">{q.source}</Badge></div>
                        <div className="truncate">{q.prompt_de}</div>
                      </div>
                    </label>
                  ))}
                  {filteredBank.length === 0 && <p className="text-muted-foreground text-xs text-center py-4">Aucune question pour ce niveau. Allez dans Banque pour en ajouter.</p>}
                </div>
              </div>

              <div><Label>Statut</Label>
                <Select value={edit.status} onValueChange={v=>setEdit({...edit,status:v})}><SelectTrigger className="w-48"><SelectValue/></SelectTrigger>
                <SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>}
            <DialogFooter><Button onClick={save}>Enregistrer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </AcademyMotionPage>
      </div>
    </div>
  );
}
