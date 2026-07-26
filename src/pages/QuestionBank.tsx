import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
import { ArrowLeft, Plus, Pencil, Trash2, Upload, Download, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { parseCsv, parseJson, toCsv, type BankRow } from "@/lib/bankImport";
import { useI18n } from "@/lib/i18n";

const LEVELS = ["A1","A2","B1","B2"] as const;
const SKILLS = ["lesen","hoeren","schreiben","sprechen","wortschatz","grammatik"] as const;
const KINDS = ["qcm","audio","translate","write","speak"] as const;
const SOURCES = ["goethe","oesd","custom"] as const;

type Q = any;

const empty: Q = {
  source: "custom", level: "A1", skill: "wortschatz", kind: "qcm",
  prompt_de: "", prompt_fr: "", prompt_ar: "",
  audio_text: "",
  options_de: ["","","",""], options_fr: ["","","",""], options_ar: ["","","",""],
  correct_answer: "0",
  explanation_fr: "", explanation_ar: "",
  points: 1, is_public: true, tags: [],
};

export default function QuestionBankPage() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [rows, setRows] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fLevel, setFLevel] = useState<string>("all");
  const [fSkill, setFSkill] = useState<string>("all");
  const [fSource, setFSource] = useState<string>("all");
  const [fKind, setFKind] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Q>(empty);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("question_bank").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) toast.error(error.message);
    setRows((data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter(r =>
    (fLevel === "all" || r.level === fLevel) &&
    (fSkill === "all" || r.skill === fSkill) &&
    (fSource === "all" || r.source === fSource) &&
    (fKind === "all" || r.kind === fKind) &&
    (!search || r.prompt_de?.toLowerCase().includes(search.toLowerCase())
      || r.prompt_fr?.toLowerCase().includes(search.toLowerCase()))
  ), [rows, fLevel, fSkill, fSource, fKind, search]);

  const startNew = () => { setEdit({ ...empty }); setOpen(true); };
  const startEdit = (q: Q) => {
    setEdit({
      ...q,
      options_de: q.options_de || ["","","",""],
      options_fr: q.options_fr || ["","","",""],
      options_ar: q.options_ar || ["","","",""],
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!edit.prompt_de?.trim() || !edit.correct_answer?.toString().trim()) {
      toast.error("Prompt DE et réponse correcte requis"); return;
    }
    const payload: any = {
      owner_id: user.id,
      source: edit.source, level: edit.level, skill: edit.skill, kind: edit.kind,
      prompt_de: edit.prompt_de, prompt_fr: edit.prompt_fr || null, prompt_ar: edit.prompt_ar || null,
      audio_text: edit.audio_text || null,
      options_de: edit.kind === "qcm" ? edit.options_de.filter((o:string)=>o.trim()) : null,
      options_fr: edit.kind === "qcm" ? edit.options_fr.filter((o:string)=>o.trim()) : null,
      options_ar: edit.kind === "qcm" ? edit.options_ar.filter((o:string)=>o.trim()) : null,
      correct_answer: String(edit.correct_answer),
      explanation_fr: edit.explanation_fr || null, explanation_ar: edit.explanation_ar || null,
      points: Number(edit.points) || 1,
      is_public: !!edit.is_public,
      tags: edit.tags || [],
    };
    const res = edit.id
      ? await supabase.from("question_bank").update(payload).eq("id", edit.id)
      : await supabase.from("question_bank").insert(payload);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Enregistré"); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    const { error } = await supabase.from("question_bank").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimée"); load(); }
  };

  const handleImport = async () => {
    if (!user || !importText.trim()) return;
    let parsed: BankRow[] = [];
    try {
      parsed = importText.trim().startsWith("{") || importText.trim().startsWith("[")
        ? parseJson(importText) : parseCsv(importText);
    } catch (e: any) { toast.error("Erreur parsing : " + e.message); return; }
    if (!parsed.length) { toast.error("Aucune question valide trouvée"); return; }
    const payload = parsed.map(p => ({ ...p, owner_id: user.id }));
    const { error } = await supabase.from("question_bank").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success(`${parsed.length} questions importées`); setImportText(""); setImportOpen(false); load(); }
  };

  const handleFile = async (f: File) => {
    const text = await f.text();
    setImportText(text);
  };

  const handleExport = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `banque_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const updateOpt = (lang: "de"|"fr"|"ar", i: number, v: string) => {
    const key = `options_${lang}` as const;
    const arr = [...(edit[key] || ["","","",""])];
    arr[i] = v;
    setEdit({ ...edit, [key]: arr });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <Link to="/teacher" className="text-sm text-muted-foreground hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3 rtl:rotate-180"/>{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}</Link>
            <h1 className="text-3xl font-bold mt-1">📚 {tt({ fr: "Banque de questions", de: "Fragenbank", ar: "بنك الأسئلة" })}</h1>
            <p className="text-muted-foreground">Goethe · ÖSD · Custom — DE/FR/AR · {rows.length} {tt({ fr: "questions", de: "Fragen", ar: "أسئلة" })}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild><Button variant="outline"><Upload className="w-4 h-4 me-2"/>{tt({ fr: "Importer", de: "Importieren", ar: "استيراد" })}</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{tt({ fr: "Importer (CSV ou JSON)", de: "Importieren (CSV oder JSON)", ar: "استيراد (CSV أو JSON)" })}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="text-xs bg-muted/50 p-3 rounded space-y-1">
                    <p><b>CSV en-têtes :</b> source,level,skill,kind,prompt_de,prompt_fr,prompt_ar,audio_text,options_de,options_fr,options_ar,correct_answer,explanation_fr,explanation_ar,points,tags</p>
                    <p><b>options_*</b> : JSON array <code>["a","b","c","d"]</code> ou séparé par <code>|</code></p>
                    <p><b>correct_answer</b> : pour QCM = index "0"-"3" · sinon réponse attendue</p>
                  </div>
                  <Input type="file" accept=".csv,.json,.txt" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <Textarea value={importText} onChange={e=>setImportText(e.target.value)} rows={10} placeholder={tt({ fr: "Collez votre CSV/JSON ici…", de: "CSV/JSON hier einfügen…", ar: "ألصق CSV/JSON هنا…" })} className="font-mono text-xs"/>
                  <DialogFooter><Button onClick={handleImport}>{tt({ fr: "Importer", de: "Importieren", ar: "استيراد" })}</Button></DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 me-2"/>{tt({ fr: "Exporter CSV", de: "CSV exportieren", ar: "تصدير CSV" })}</Button>
            <Button onClick={startNew}><Plus className="w-4 h-4 me-2"/>{tt({ fr: "Nouvelle question", de: "Neue Frage", ar: "سؤال جديد" })}</Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 grid md:grid-cols-5 gap-2">
            <div className="md:col-span-1 relative">
              <Search className="w-4 h-4 absolute start-2 top-3 text-muted-foreground"/>
              <Input placeholder={tt({ fr: "Rechercher…", de: "Suchen…", ar: "بحث…" })} value={search} onChange={e=>setSearch(e.target.value)} className="ps-8"/>
            </div>
            <Select value={fLevel} onValueChange={setFLevel}><SelectTrigger><SelectValue placeholder={tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })}/></SelectTrigger>
              <SelectContent><SelectItem value="all">{tt({ fr: "Tous niveaux", de: "Alle Niveaus", ar: "كل المستويات" })}</SelectItem>{LEVELS.map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
            <Select value={fSkill} onValueChange={setFSkill}><SelectTrigger><SelectValue placeholder={tt({ fr: "Compétence", de: "Fertigkeit", ar: "الكفاءة" })}/></SelectTrigger>
              <SelectContent><SelectItem value="all">{tt({ fr: "Toutes compét.", de: "Alle Fertigkeiten", ar: "كل الكفاءات" })}</SelectItem>{SKILLS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={fSource} onValueChange={setFSource}><SelectTrigger><SelectValue placeholder={tt({ fr: "Source", de: "Quelle", ar: "المصدر" })}/></SelectTrigger>
              <SelectContent><SelectItem value="all">{tt({ fr: "Toutes sources", de: "Alle Quellen", ar: "كل المصادر" })}</SelectItem>{SOURCES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={fKind} onValueChange={setFKind}><SelectTrigger><SelectValue placeholder={tt({ fr: "Type", de: "Typ", ar: "النوع" })}/></SelectTrigger>
              <SelectContent><SelectItem value="all">{tt({ fr: "Tous types", de: "Alle Typen", ar: "كل الأنواع" })}</SelectItem>{KINDS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tt({ fr: "Résultats", de: "Ergebnisse", ar: "النتائج" })} : {filtered.length}</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">{tt({ fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" })}</p> :
             filtered.length === 0 ? <p className="text-muted-foreground">{tt({ fr: "Aucune question. Créez ou importez.", de: "Keine Frage. Erstellen oder importieren.", ar: "لا توجد أسئلة. أنشئ أو استورد." })}</p> :
              <div className="space-y-2">
                {filtered.slice(0, 200).map(q => (
                  <div key={q.id} className="border rounded-lg p-3 hover:bg-muted/30 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge>{q.level}</Badge>
                          <Badge variant="secondary">{q.skill}</Badge>
                          <Badge variant="outline">{q.kind}</Badge>
                          <Badge variant={q.source==="goethe"?"default":q.source==="oesd"?"destructive":"outline"}>{q.source}</Badge>
                          <Badge variant="outline">{q.points} pt</Badge>
                        </div>
                        <div className="font-medium truncate" dir="ltr">🇩🇪 {q.prompt_de}</div>
                        {q.prompt_fr && <div className="text-sm text-muted-foreground truncate">🇫🇷 {q.prompt_fr}</div>}
                        {q.prompt_ar && <div className="text-sm text-muted-foreground truncate" dir="rtl">🇸🇦 {q.prompt_ar}</div>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={()=>startEdit(q)}><Pencil className="w-4 h-4"/></Button>
                        <Button size="sm" variant="ghost" onClick={()=>remove(q.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length > 200 && <p className="text-xs text-muted-foreground text-center">Affichage limité à 200. Filtrez pour préciser.</p>}
              </div>
            }
          </CardContent>
        </Card>

        {/* EDIT DIALOG */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{edit.id ? "Modifier" : "Nouvelle"} question</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><Label>Source</Label>
                  <Select value={edit.source} onValueChange={v=>setEdit({...edit,source:v})}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{SOURCES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Niveau</Label>
                  <Select value={edit.level} onValueChange={v=>setEdit({...edit,level:v})}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{LEVELS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Compétence</Label>
                  <Select value={edit.skill} onValueChange={v=>setEdit({...edit,skill:v})}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{SKILLS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Type</Label>
                  <Select value={edit.kind} onValueChange={v=>setEdit({...edit,kind:v})}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{KINDS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>

              <div><Label>🇩🇪 Énoncé (allemand) *</Label>
                <Textarea value={edit.prompt_de} onChange={e=>setEdit({...edit,prompt_de:e.target.value})} rows={2} dir="ltr"/></div>
              <div><Label>🇫🇷 Énoncé (français)</Label>
                <Textarea value={edit.prompt_fr || ""} onChange={e=>setEdit({...edit,prompt_fr:e.target.value})} rows={2}/></div>
              <div><Label>🇸🇦 Énoncé (arabe)</Label>
                <Textarea value={edit.prompt_ar || ""} onChange={e=>setEdit({...edit,prompt_ar:e.target.value})} rows={2} dir="rtl"/></div>

              {edit.kind === "audio" && (
                <div><Label>🔊 Texte à prononcer (TTS)</Label>
                  <Input value={edit.audio_text || ""} onChange={e=>setEdit({...edit,audio_text:e.target.value})} dir="ltr"/></div>
              )}

              {edit.kind === "qcm" && (
                <div className="space-y-2">
                  <Label>Options (4 choix) — réponse correcte = index 0–3</Label>
                  {[0,1,2,3].map(i => (
                    <div key={i} className="grid grid-cols-12 gap-1 items-center">
                      <div className="col-span-1 text-center font-mono text-xs">{i}</div>
                      <Input className="col-span-4" placeholder={`DE option ${i}`} value={edit.options_de[i]||""} onChange={e=>updateOpt("de",i,e.target.value)} dir="ltr"/>
                      <Input className="col-span-4" placeholder={`FR option ${i}`} value={edit.options_fr[i]||""} onChange={e=>updateOpt("fr",i,e.target.value)}/>
                      <Input className="col-span-3" placeholder={`AR ${i}`} value={edit.options_ar[i]||""} onChange={e=>updateOpt("ar",i,e.target.value)} dir="rtl"/>
                    </div>
                  ))}
                  <div><Label>Réponse correcte (index 0–3)</Label>
                    <Input value={edit.correct_answer} onChange={e=>setEdit({...edit,correct_answer:e.target.value})} className="w-24"/></div>
                </div>
              )}

              {edit.kind !== "qcm" && (
                <div><Label>✅ Réponse correcte attendue</Label>
                  <Input value={edit.correct_answer} onChange={e=>setEdit({...edit,correct_answer:e.target.value})}/></div>
              )}

              <div className="grid md:grid-cols-2 gap-2">
                <div><Label>🇫🇷 Explication</Label>
                  <Textarea value={edit.explanation_fr||""} onChange={e=>setEdit({...edit,explanation_fr:e.target.value})} rows={2}/></div>
                <div><Label>🇸🇦 Explication</Label>
                  <Textarea value={edit.explanation_ar||""} onChange={e=>setEdit({...edit,explanation_ar:e.target.value})} rows={2} dir="rtl"/></div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div><Label>Points</Label>
                  <Input type="number" min="1" value={edit.points} onChange={e=>setEdit({...edit,points:Number(e.target.value)})}/></div>
                <div><Label>Tags (séparés par ,)</Label>
                  <Input value={(edit.tags||[]).join(",")} onChange={e=>setEdit({...edit,tags:e.target.value.split(",").map((t:string)=>t.trim()).filter(Boolean)})}/></div>
                <div className="flex items-end gap-2">
                  <input type="checkbox" id="pub" checked={!!edit.is_public} onChange={e=>setEdit({...edit,is_public:e.target.checked})}/>
                  <Label htmlFor="pub">Public (autres profs)</Label>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Enregistrer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
