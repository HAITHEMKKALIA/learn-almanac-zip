import { useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Sparkles, Save, Wand2, Download, Trash2, ChevronDown, Settings2, AlertTriangle, CheckCircle2, Copy, Eraser } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type ExamKind = "qcm" | "grammar" | "comprehension" | "mixed";

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((s, p) => s + ((text.match(p) || []).length), 0);
}

function detectExamMeta(raw: string, threshold = 2): { source: string; level: string; kind: ExamKind; scores: Record<string, number> } {
  const t = raw.toLowerCase();
  let source = "custom";
  if (/goethe|goethe-zertifikat|goethe-institut/.test(t)) source = "goethe";
  else if (/ösd|oesd|österreichisches sprachdiplom/.test(t)) source = "oesd";

  let level = "A2";
  const m = t.match(/\b(a1|a2|b1|b2|c1|c2)\b/);
  if (m) level = m[1].toUpperCase();

  const scores = {
    qcm: countMatches(raw, [/\(a\)/gi, /\ba\)/g, /☐/g, /\u2610/g, /kreuzen sie/gi, /cochez/gi, /wählen sie/gi, /choisissez/gi]),
    grammar: countMatches(raw, [/ergänzen/gi, /setzen sie ein/gi, /conjuguez/gi, /déclinaison/gi, /akkusativ/gi, /dativ/gi, /präposition/gi, /article/gi]),
    comprehension: countMatches(raw, [/lesen sie/gi, /leseverstehen/gi, /compréhension/gi, /\btext\b/gi, /\bartikel\b/gi, /annonce/gi, /hörverstehen/gi]),
  };
  const ranked = (Object.entries(scores) as [keyof typeof scores, number][]).sort((a, b) => b[1] - a[1]);
  let kind: ExamKind = "mixed";
  if (ranked[0][1] >= threshold && ranked[0][1] > ranked[1][1]) kind = ranked[0][0] as ExamKind;
  return { source, level, kind, scores };
}

const blankOpts = () => ["", "", "", ""];

type ValErr = { msg: string; field: string };

export default function PdfImport() {
  const { user } = useAuth();
  const { tt } = useI18n();
  const [text, setText] = useState("");
  const [level, setLevel] = useState("A2");
  const [source, setSource] = useState("goethe");
  const [examKind, setExamKind] = useState<ExamKind>("mixed");
  const [forceKind, setForceKind] = useState(false);
  const [threshold, setThreshold] = useState(2);
  const [maxPages, setMaxPages] = useState(30);
  const [useOcr, setUseOcr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [draft, setDraft] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Strict validation: require translations + explanations
  const [strictTranslations, setStrictTranslations] = useState(true);
  const [strictExplanations, setStrictExplanations] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const setRef = (key: string) => (el: HTMLElement | null) => { fieldRefs.current[key] = el; };
  const focusField = (id: number, key: string) => {
    // expand row if collapsed (row stays visible). Just focus + scroll.
    const el = fieldRefs.current[`${id}:${key}`];
    if (!el) { toast.error("Champ introuvable"); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      try { (el as any).focus?.(); } catch {}
      el.classList.add("ring-2", "ring-destructive");
      setTimeout(() => el.classList.remove("ring-2", "ring-destructive"), 1800);
    }, 250);
  };

  const ocrPage = async (page: any, Tesseract: any) => {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const { data } = await Tesseract.recognize(canvas, "deu+fra+eng");
    return data.text as string;
  };

  const extractPdfText = async (f: File): Promise<string> => {
    const pdfjs: any = await import("pdfjs-dist");
    const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const buf = await f.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const total = Math.min(doc.numPages, Math.max(1, maxPages));
    let Tesseract: any = null;
    if (useOcr) {
      // @ts-ignore
      Tesseract = (await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/+esm")).default;
    }
    let out = "";
    for (let i = 1; i <= total; i++) {
      setProgressLabel(`Page ${i}/${total}${useOcr ? " (OCR)" : ""}`);
      setProgress(Math.round(((i - 1) / total) * 100));
      const page = await doc.getPage(i);
      let pageText = "";
      if (!useOcr) {
        const content = await page.getTextContent();
        pageText = content.items.map((it: any) => it.str).join(" ");
      }
      if ((useOcr || pageText.trim().length < 20) && Tesseract) {
        try { pageText = await ocrPage(page, Tesseract); } catch (e) { console.warn("OCR fail", e); }
      }
      out += pageText + "\n\n";
    }
    setProgress(100);
    return out.trim();
  };

  const applyDetection = (raw: string) => {
    const meta = detectExamMeta(raw, threshold);
    setSource(meta.source !== "custom" ? meta.source : source);
    setLevel(meta.level);
    setScores(meta.scores);
    if (!forceKind) setExamKind(meta.kind);
    return meta;
  };

  const onFile = async (f: File) => {
    try {
      setExtracting(true);
      setProgress(0); setProgressLabel("Initialisation…");
      let t = "";
      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
        t = await extractPdfText(f);
      } else {
        t = await f.text();
      }
      setText(t);
      const meta = applyDetection(t);
      toast.success(`Texte extrait (${t.length} car.) — ${meta.source}/${meta.level}/${meta.kind}`);
    } catch (e: any) {
      toast.error("Lecture impossible: " + (e?.message || e));
    } finally {
      setExtracting(false);
      setProgressLabel("");
    }
  };

  const extract = async () => {
    if (!text.trim()) { toast.error("Texte requis"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("pdf-import", { body: { text, level, source, kind: examKind } });
    setBusy(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message); return; }
    setDraft(((data as any).questions || []).map((q: any, i: number) => ({
      ...q,
      options_de: Array.isArray(q.options_de) ? q.options_de : (q.kind === "qcm" ? blankOpts() : []),
      options_fr: Array.isArray(q.options_fr) ? q.options_fr : (q.kind === "qcm" ? blankOpts() : []),
      options_ar: Array.isArray(q.options_ar) ? q.options_ar : (q.kind === "qcm" ? blankOpts() : []),
      _id: i, _selected: true,
    })));
    toast.success(`${(data as any).questions?.length || 0} questions extraites`);
  };

  const updateDraft = (id: number, patch: any) =>
    setDraft(arr => arr.map(x => x._id === id ? { ...x, ...patch } : x));
  const updateOption = (id: number, lang: "de"|"fr"|"ar", idx: number, val: string) =>
    setDraft(arr => arr.map(x => {
      if (x._id !== id) return x;
      const k = `options_${lang}` as const;
      const opts = Array.isArray(x[k]) ? [...x[k]] : blankOpts();
      opts[idx] = val;
      return { ...x, [k]: opts };
    }));
  const removeDraft = (id: number) => setDraft(arr => arr.filter(x => x._id !== id));

  const validateOne = (d: any): ValErr[] => {
    const errs: ValErr[] = [];
    if (!d.prompt_de?.trim()) errs.push({ msg: "prompt DE manquant", field: "prompt_de" });
    if (!d.kind) errs.push({ msg: "type manquant", field: "kind" });
    if (!d.skill) errs.push({ msg: "skill manquant", field: "skill" });
    if (!String(d.correct_answer ?? "").trim()) errs.push({ msg: "réponse correcte manquante", field: "correct_answer" });
    if (strictTranslations) {
      if (!d.prompt_fr?.trim()) errs.push({ msg: "prompt FR manquant", field: "prompt_fr" });
      if (!d.prompt_ar?.trim()) errs.push({ msg: "prompt AR manquant", field: "prompt_ar" });
    }
    if (strictExplanations && (d.kind === "qcm" || d.kind === "grammar" || examKind === "grammar")) {
      if (!d.explanation_fr?.trim()) errs.push({ msg: "explication FR manquante", field: "explanation_fr" });
      if (!d.explanation_ar?.trim()) errs.push({ msg: "explication AR manquante", field: "explanation_ar" });
    }
    if (d.kind === "qcm") {
      const opts = (d.options_de || []) as string[];
      if (opts.length < 4) errs.push({ msg: "options DE incomplètes (4 requises)", field: "opt-de-0" });
      else opts.forEach((o, i) => { if (!o?.trim()) errs.push({ msg: `option DE #${i+1} vide`, field: `opt-de-${i}` }); });
      if (strictTranslations) {
        (["fr","ar"] as const).forEach(lg => {
          const o2 = (d[`options_${lg}`] || []) as string[];
          if (o2.length < 4 || o2.some(o => !o?.trim())) errs.push({ msg: `options ${lg.toUpperCase()} incomplètes`, field: `opt-${lg}-0` });
        });
      }
      const idx = parseInt(String(d.correct_answer));
      if (isNaN(idx) || idx < 0 || idx >= 4) errs.push({ msg: "réponse QCM doit être un index 0-3", field: "correct_answer" });
    }
    return errs;
  };

  const validation = useMemo(
    () => draft.filter(d => d._selected).map(d => ({ id: d._id, prompt: d.prompt_de || `#${d._id}`, errors: validateOne(d) })),
    [draft, strictTranslations, strictExplanations, examKind]
  );
  const totalErrors = validation.reduce((s, v) => s + v.errors.length, 0);
  const invalidIds = validation.filter(v => v.errors.length).map(v => v.id);

  const insert = async () => {
    if (!user) return;
    const selected = draft.filter(d => d._selected);
    if (!selected.length) { toast.error("Sélectionnez au moins 1 question"); return; }
    if (totalErrors > 0) { toast.error(`${totalErrors} erreur(s) à corriger avant l'enregistrement`); return; }
    const rows = selected.map(d => ({
      owner_id: user.id, source, level, skill: d.skill, kind: d.kind,
      prompt_de: d.prompt_de, prompt_fr: d.prompt_fr || null, prompt_ar: d.prompt_ar || null,
      options_de: d.options_de?.length ? d.options_de : null,
      options_fr: d.options_fr?.length ? d.options_fr : null,
      options_ar: d.options_ar?.length ? d.options_ar : null,
      correct_answer: String(d.correct_answer), explanation_fr: d.explanation_fr || null, explanation_ar: d.explanation_ar || null,
      points: d.points || 1, is_public: false, tags: ["import-ia", examKind],
    }));
    const { error } = await supabase.from("question_bank").insert(rows as any);
    if (error) toast.error(error.message);
    else { toast.success(`${rows.length} questions ajoutées à la banque`); setDraft([]); setText(""); }
  };

  const removeInvalidSelected = () => {
    if (!invalidIds.length) { toast.info("Aucune question invalide sélectionnée"); return; }
    const set = new Set(invalidIds);
    setDraft(arr => arr.filter(d => !set.has(d._id)));
    toast.success(`${set.size} question(s) invalide(s) supprimée(s)`);
  };

  // Bulk edit
  const [bulkSkill, setBulkSkill] = useState<string>("");
  const [bulkKind, setBulkKind] = useState<string>("");
  const [bulkPoints, setBulkPoints] = useState<string>("");
  const [bulkPromptDe, setBulkPromptDe] = useState("");
  const [bulkPromptFr, setBulkPromptFr] = useState("");
  const [bulkPromptAr, setBulkPromptAr] = useState("");
  const [bulkExplFr, setBulkExplFr] = useState("");
  const [bulkExplAr, setBulkExplAr] = useState("");

  const selectedIds = () => new Set(draft.filter(d => d._selected).map(d => d._id));

  const applyBulk = () => {
    const ids = selectedIds();
    if (!ids.size) { toast.error("Aucune question sélectionnée"); return; }
    setDraft(arr => arr.map(d => {
      if (!ids.has(d._id)) return d;
      const patch: any = {};
      if (bulkSkill) patch.skill = bulkSkill;
      if (bulkKind) {
        patch.kind = bulkKind;
        if (bulkKind === "qcm" && (!d.options_de || d.options_de.length < 4)) {
          patch.options_de = blankOpts(); patch.options_fr = blankOpts(); patch.options_ar = blankOpts();
        }
      }
      if (bulkPoints) patch.points = parseInt(bulkPoints) || 1;
      return { ...d, ...patch };
    }));
    toast.success(`${ids.size} question(s) mise(s) à jour`);
  };

  const applyBulkText = (mode: "set" | "reset") => {
    const ids = selectedIds();
    if (!ids.size) { toast.error("Aucune question sélectionnée"); return; }
    setDraft(arr => arr.map(d => {
      if (!ids.has(d._id)) return d;
      const patch: any = {};
      if (mode === "reset") {
        patch.prompt_de = ""; patch.prompt_fr = ""; patch.prompt_ar = "";
        patch.explanation_fr = ""; patch.explanation_ar = "";
      } else {
        if (bulkPromptDe) patch.prompt_de = bulkPromptDe;
        if (bulkPromptFr) patch.prompt_fr = bulkPromptFr;
        if (bulkPromptAr) patch.prompt_ar = bulkPromptAr;
        if (bulkExplFr) patch.explanation_fr = bulkExplFr;
        if (bulkExplAr) patch.explanation_ar = bulkExplAr;
      }
      return { ...d, ...patch };
    }));
    toast.success(mode === "reset" ? "Champs réinitialisés" : `${ids.size} question(s) mise(s) à jour`);
  };

  // Copy correct answer (+ optionally explanation + options) from a "source" row to all selected
  const [copySrcId, setCopySrcId] = useState<string>("");
  const [copyExpl, setCopyExpl] = useState(true);
  const [copyOpts, setCopyOpts] = useState(true);
  const copyAnswerToSelected = () => {
    const src = draft.find(d => String(d._id) === copySrcId);
    if (!src) { toast.error("Choisissez une question source"); return; }
    const ids = selectedIds();
    if (!ids.size) { toast.error("Aucune question sélectionnée"); return; }
    setDraft(arr => arr.map(d => {
      if (!ids.has(d._id)) return d;
      const patch: any = { correct_answer: String(src.correct_answer ?? "") };
      if (copyExpl) {
        patch.explanation_fr = src.explanation_fr || "";
        patch.explanation_ar = src.explanation_ar || "";
      }
      if (copyOpts && src.kind === "qcm") {
        patch.kind = "qcm";
        patch.options_de = [...(src.options_de || blankOpts())];
        patch.options_fr = [...(src.options_fr || blankOpts())];
        patch.options_ar = [...(src.options_ar || blankOpts())];
      }
      return { ...d, ...patch };
    }));
    toast.success(`Réponse copiée vers ${ids.size} question(s)`);
  };

  const selectAll = (v: boolean) => setDraft(arr => arr.map(d => ({ ...d, _selected: v })));

  const downloadFile = (name: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      meta: { source, level, kind: examKind, threshold, detection_scores: scores },
      questions: draft.filter(d => d._selected).map(({ _id, _selected, ...q }) => q),
    };
    downloadFile(`questions-${source}-${level}-${examKind}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const exportCsv = () => {
    const cols = ["source","level","kind","skill","prompt_de","prompt_fr","prompt_ar","options_de","options_fr","options_ar","correct_answer","explanation_fr","explanation_ar","points"];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [cols.join(",")];
    for (const d of draft.filter(x => x._selected)) {
      lines.push(cols.map(c => {
        if (c === "source") return esc(source);
        if (c === "level") return esc(level);
        const v = (d as any)[c];
        return esc(Array.isArray(v) ? v.join(" | ") : v);
      }).join(","));
    }
    downloadFile(`questions-${source}-${level}-${examKind}.csv`, lines.join("\n"), "text/csv");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <Link to="/teacher" className="text-sm text-muted-foreground hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3 rtl:rotate-180"/>{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}</Link>
          <h1 className="text-3xl font-bold mt-1">📥 {tt({ fr: "Importateur PDF Goethe/ÖSD", de: "PDF-Import Goethe/ÖSD", ar: "مستورد PDF Goethe/ÖSD" })}</h1>
          <p className="text-muted-foreground">{tt({ fr: "Détection automatique, OCR, édition complète et export JSON/CSV.", de: "Automatische Erkennung, OCR, vollständige Bearbeitung und Export JSON/CSV.", ar: "كشف تلقائي، OCR، تحرير كامل وتصدير JSON/CSV." })}</p>
        </div>

        <Card>
          <CardHeader><CardTitle>1. Fichier source</CardTitle><CardDescription>PDF (texte ou scanné via OCR), .txt ou .md</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-4 gap-2">
              <div><Label>Source</Label>
                <Select value={source} onValueChange={setSource}><SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goethe">Goethe</SelectItem>
                    <SelectItem value="oesd">ÖSD</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent></Select></div>
              <div><Label>Niveau</Label>
                <Select value={level} onValueChange={setLevel}><SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{["A1","A2","B1","B2","C1","C2"].map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Type d'épreuve {forceKind && <Badge variant="outline" className="ml-1 text-[10px]">forcé</Badge>}</Label>
                <Select value={examKind} onValueChange={(v)=>setExamKind(v as ExamKind)}><SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixte</SelectItem>
                    <SelectItem value="qcm">QCM</SelectItem>
                    <SelectItem value="grammar">Grammaire</SelectItem>
                    <SelectItem value="comprehension">Compréhension</SelectItem>
                  </SelectContent></Select></div>
              <div><Label>Pages max</Label>
                <Input type="number" min={1} max={300} value={maxPages} onChange={e=>setMaxPages(parseInt(e.target.value)||1)}/></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={useOcr} onCheckedChange={setUseOcr} id="ocr"/>
              <Label htmlFor="ocr" className="cursor-pointer">Mode OCR (PDF scanné, plus lent)</Label>
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2"><Settings2 className="w-4 h-4"/>Options avancées <ChevronDown className={"w-4 h-4 transition " + (advancedOpen?"rotate-180":"")}/></Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label>Seuil de détection du type ({threshold})</Label>
                  <Slider value={[threshold]} min={1} max={6} step={1} onValueChange={v=>setThreshold(v[0])}/>
                  <p className="text-xs text-muted-foreground">Nombre minimum d'indices pour activer une stratégie automatique. Sinon → Mixte.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={forceKind} onCheckedChange={setForceKind} id="force"/>
                  <Label htmlFor="force" className="cursor-pointer">Forcer la stratégie d'extraction (ignorer la détection)</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={strictTranslations} onCheckedChange={setStrictTranslations} id="strictTr"/>
                  <Label htmlFor="strictTr" className="cursor-pointer">Exiger prompts FR/AR (et options) à la validation</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={strictExplanations} onCheckedChange={setStrictExplanations} id="strictEx"/>
                  <Label htmlFor="strictEx" className="cursor-pointer">Exiger explications FR/AR (QCM/grammaire)</Label>
                </div>
                {Object.keys(scores).length > 0 && (
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                    Scores détectés: {Object.entries(scores).map(([k,v]) => <Badge key={k} variant="secondary">{k}: {v}</Badge>)}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div>
              <Label>Fichier</Label>
              <Input type="file" accept=".txt,.pdf,.md" disabled={extracting} onChange={e=>e.target.files?.[0] && onFile(e.target.files[0])}/>
            </div>
            {extracting && (
              <div className="space-y-1">
                <Progress value={progress}/>
                <div className="text-xs text-muted-foreground">{progressLabel} — {progress}%</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Aperçu du texte extrait</CardTitle>
            <CardDescription>Corrigez ou supprimez les passages indésirables avant l'extraction IA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={14} value={text} onChange={e=>setText(e.target.value)} placeholder="Le texte extrait apparaîtra ici…" className="font-mono text-xs"/>
            <div className="flex flex-wrap gap-2 items-center">
              <Button onClick={extract} disabled={busy || !text.trim()}><Sparkles className="w-4 h-4 mr-2"/>{busy?"Extraction IA…":"Extraire les questions"}</Button>
              <Button variant="outline" onClick={()=>{ const m = applyDetection(text); toast.success(`Détecté: ${m.source}/${m.level}/${m.kind}`); }} disabled={!text.trim()}>
                <Wand2 className="w-4 h-4 mr-2"/>Re-détecter
              </Button>
              <Badge variant="secondary">{text.length} caractères</Badge>
            </div>
          </CardContent>
        </Card>

        {draft.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2 items-start justify-between">
                <div>
                  <CardTitle>3. Brouillon ({draft.filter(d=>d._selected).length}/{draft.length})</CardTitle>
                  <CardDescription>Éditez chaque question, exportez ou enregistrez.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportJson}><Download className="w-4 h-4 mr-1"/>JSON</Button>
                  <Button size="sm" variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1"/>CSV</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border rounded-md p-2 bg-muted/30 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium mr-2">Édition en masse:</span>
                  <Button size="sm" variant="ghost" onClick={()=>selectAll(true)}>Tout cocher</Button>
                  <Button size="sm" variant="ghost" onClick={()=>selectAll(false)}>Tout décocher</Button>
                  <Select value={bulkSkill} onValueChange={setBulkSkill}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Skill…"/></SelectTrigger>
                    <SelectContent>{["lesen","hoeren","schreiben","wortschatz","grammatik","sprechen"].map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={bulkKind} onValueChange={setBulkKind}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Type…"/></SelectTrigger>
                    <SelectContent>{["qcm","translate","write","audio","speak"].map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min={1} max={10} placeholder="Pts" className="h-8 w-16 text-xs" value={bulkPoints} onChange={e=>setBulkPoints(e.target.value)}/>
                  <Button size="sm" onClick={applyBulk}>Appliquer</Button>
                </div>

                <div className="grid md:grid-cols-3 gap-2 pt-1 border-t">
                  <Input placeholder="🇩🇪 Définir prompt DE…" className="h-8 text-xs" value={bulkPromptDe} onChange={e=>setBulkPromptDe(e.target.value)}/>
                  <Input placeholder="🇫🇷 Définir prompt FR…" className="h-8 text-xs" value={bulkPromptFr} onChange={e=>setBulkPromptFr(e.target.value)}/>
                  <Input placeholder="🇸🇦 Définir prompt AR…" className="h-8 text-xs" dir="rtl" value={bulkPromptAr} onChange={e=>setBulkPromptAr(e.target.value)}/>
                  <Input placeholder="Explication FR…" className="h-8 text-xs" value={bulkExplFr} onChange={e=>setBulkExplFr(e.target.value)}/>
                  <Input placeholder="Explication AR…" className="h-8 text-xs" dir="rtl" value={bulkExplAr} onChange={e=>setBulkExplAr(e.target.value)}/>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={()=>applyBulkText("set")}>Définir</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline"><Eraser className="w-3 h-3 mr-1"/>Réinit.</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Réinitialiser les textes ?</AlertDialogTitle>
                          <AlertDialogDescription>Vide prompts DE/FR/AR et explications FR/AR sur les questions sélectionnées.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={()=>applyBulkText("reset")}>Confirmer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
                  <span className="text-xs font-medium">Copier la réponse depuis:</span>
                  <Select value={copySrcId} onValueChange={setCopySrcId}>
                    <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Question source…"/></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {draft.map(d => <SelectItem key={d._id} value={String(d._id)}>#{d._id+1} — {String(d.prompt_de||"").slice(0,40)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={copyExpl} onChange={e=>setCopyExpl(e.target.checked)}/>+ explications</label>
                  <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={copyOpts} onChange={e=>setCopyOpts(e.target.checked)}/>+ options QCM</label>
                  <Button size="sm" onClick={copyAnswerToSelected}><Copy className="w-3 h-3 mr-1"/>Copier vers sélection</Button>
                </div>
              </div>

              {validation.length > 0 && (
                totalErrors === 0 ? (
                  <Alert>
                    <CheckCircle2 className="w-4 h-4"/>
                    <AlertTitle>Validation OK</AlertTitle>
                    <AlertDescription>Les {validation.length} questions sélectionnées sont prêtes.</AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4"/>
                    <AlertTitle className="flex items-center justify-between gap-2">
                      <span>{totalErrors} erreur(s) à corriger</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline"><Trash2 className="w-3 h-3 mr-1"/>Supprimer les invalides ({invalidIds.length})</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer {invalidIds.length} question(s) invalide(s) ?</AlertDialogTitle>
                            <AlertDialogDescription>Toutes les questions sélectionnées en erreur de validation seront retirées du brouillon. Action irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={removeInvalidSelected}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="text-xs list-disc pl-5 mt-1 space-y-0.5 max-h-48 overflow-auto">
                        {validation.filter(v=>v.errors.length).map(v => (
                          <li key={v.id}>
                            <span className="font-medium">#{v.id+1} {v.prompt.slice(0,50)}</span>:{" "}
                            {v.errors.map((e, i) => (
                              <button key={i} type="button" onClick={()=>focusField(v.id, e.field)} className="underline underline-offset-2 hover:text-destructive-foreground hover:bg-destructive/30 rounded px-1 mr-1">
                                {e.msg}
                              </button>
                            ))}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )
              )}

              {draft.map(d => {
                const errs = d._selected ? validateOne(d) : [];
                return (
                <div key={d._id} className={"border rounded p-3 space-y-2 " + (d._selected ? "" : "opacity-50") + (errs.length ? " border-destructive" : "")}>
                  {errs.length > 0 && (
                    <div className="text-xs text-destructive flex items-center gap-1 flex-wrap">
                      <AlertTriangle className="w-3 h-3"/>
                      {errs.map((e, i) => (
                        <button key={i} type="button" onClick={()=>focusField(d._id, e.field)} className="underline underline-offset-2 hover:bg-destructive/20 rounded px-1">{e.msg}</button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={d._selected} onChange={e=>updateDraft(d._id,{_selected:e.target.checked})}/>
                      <Select value={d.kind} onValueChange={v=>updateDraft(d._id,{kind:v})}>
                        <SelectTrigger ref={setRef(`${d._id}:kind`) as any} className="h-7 w-32 text-xs"><SelectValue/></SelectTrigger>
                        <SelectContent>{["qcm","translate","write","audio","speak"].map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={d.skill} onValueChange={v=>updateDraft(d._id,{skill:v})}>
                        <SelectTrigger ref={setRef(`${d._id}:skill`) as any} className="h-7 w-36 text-xs"><SelectValue/></SelectTrigger>
                        <SelectContent>{["lesen","hoeren","schreiben","wortschatz","grammatik","sprechen"].map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" min={1} max={10} className="h-7 w-16 text-xs" value={d.points||1} onChange={e=>updateDraft(d._id,{points:parseInt(e.target.value)||1})}/>
                      <span className="text-xs text-muted-foreground">pt</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={()=>removeDraft(d._id)}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-2">
                    <div><Label className="text-xs">🇩🇪 Prompt DE</Label><Textarea ref={setRef(`${d._id}:prompt_de`) as any} rows={2} value={d.prompt_de||""} onChange={e=>updateDraft(d._id,{prompt_de:e.target.value})}/></div>
                    <div><Label className="text-xs">🇫🇷 Prompt FR</Label><Textarea ref={setRef(`${d._id}:prompt_fr`) as any} rows={2} value={d.prompt_fr||""} onChange={e=>updateDraft(d._id,{prompt_fr:e.target.value})}/></div>
                    <div><Label className="text-xs">🇸🇦 Prompt AR</Label><Textarea ref={setRef(`${d._id}:prompt_ar`) as any} rows={2} dir="rtl" value={d.prompt_ar||""} onChange={e=>updateDraft(d._id,{prompt_ar:e.target.value})}/></div>
                  </div>
                  {d.kind === "qcm" && (
                    <div className="grid md:grid-cols-3 gap-2">
                      {(["de","fr","ar"] as const).map(lang => (
                        <div key={lang} className="space-y-1">
                          <Label className="text-xs">Options {lang.toUpperCase()}</Label>
                          {[0,1,2,3].map(i => (
                            <Input key={i} ref={setRef(`${d._id}:opt-${lang}-${i}`) as any} dir={lang==="ar"?"rtl":"ltr"} placeholder={`Option ${i}`} value={(d[`options_${lang}`]||[])[i]||""} onChange={e=>updateOption(d._id,lang,i,e.target.value)} className="h-8 text-xs"/>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid md:grid-cols-3 gap-2">
                    <div><Label className="text-xs">✅ Réponse correcte {d.kind==="qcm" && "(0-3)"}</Label><Input ref={setRef(`${d._id}:correct_answer`) as any} value={d.correct_answer||""} onChange={e=>updateDraft(d._id,{correct_answer:e.target.value})}/></div>
                    <div><Label className="text-xs">Explication FR</Label><Input ref={setRef(`${d._id}:explanation_fr`) as any} value={d.explanation_fr||""} onChange={e=>updateDraft(d._id,{explanation_fr:e.target.value})}/></div>
                    <div><Label className="text-xs">Explication AR</Label><Input ref={setRef(`${d._id}:explanation_ar`) as any} dir="rtl" value={d.explanation_ar||""} onChange={e=>updateDraft(d._id,{explanation_ar:e.target.value})}/></div>
                  </div>
                </div>
              );})}
              <div className="flex gap-2 pt-2">
                <Button onClick={insert}><Save className="w-4 h-4 mr-2"/>Enregistrer dans la banque</Button>
                <Button variant="outline" onClick={exportJson}><Download className="w-4 h-4 mr-2"/>Export JSON</Button>
                <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2"/>Export CSV</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
