import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, FileUp, X } from "lucide-react";
import { extractPdfText } from "@/lib/pdfExtract";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type Props = {
  mode: "homework" | "exam";
  level: string;
  category: string;
  title?: string;
  count?: number;
  buttonLabel?: string;
  /** For homework: receives ({title, instructions, exercises}). For exam: receives ({question_ids, questions}). */
  onResult: (data: any) => void;
};

export function AiGenerateButton(p: Props) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { tt } = useI18n();

  async function run() {
    setLoading(true);
    try {
      let source_text = "";
      if (pdfFile) {
        toast.info(tt({ fr: "📄 Lecture du PDF…", de: "📄 PDF wird gelesen…", ar: "📄 جارٍ قراءة الـ PDF…" }));
        source_text = await extractPdfText(pdfFile);
      }
      const { data, error } = await supabase.functions.invoke("ai-pedagogy", {
        body: {
          mode: p.mode,
          level: p.level,
          category: p.category,
          title: p.title || "",
          hint,
          source_text,
          count: p.count ?? 8,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(tt({ fr: "✨ Généré par IA", de: "✨ Von KI generiert", ar: "✨ تم التوليد بواسطة الذكاء الاصطناعي" }));
      p.onResult(data);
      setOpen(false);
      setHint("");
      setPdfFile(null);
    } catch (e: any) {
      toast.error(e.message || tt({ fr: "Erreur génération", de: "Generierungsfehler", ar: "خطأ في التوليد" }));
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        {p.buttonLabel || tt({ fr: "Générer avec IA", de: "Mit KI generieren", ar: "توليد بالذكاء الاصطناعي" })}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> {tt({ fr: "Génération IA", de: "KI-Generierung", ar: "توليد بالذكاء الاصطناعي" })} — {p.mode === "exam" ? tt({ fr: "examen", de: "Prüfung", ar: "امتحان" }) : tt({ fr: "devoir", de: "Hausaufgabe", ar: "واجب" })} ({p.level})
        </div>
        <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
      </div>
      <div>
        <Label className="text-xs">{tt({ fr: "Idée / précision (optionnel)", de: "Idee / Präzisierung (optional)", ar: "فكرة / تفاصيل (اختياري)" })}</Label>
        <Input value={hint} onChange={(e) => setHint(e.target.value)} placeholder={tt({ fr: "Ex: dialogue au restaurant, vocabulaire des couleurs…", de: "Bsp.: Dialog im Restaurant, Wortschatz Farben…", ar: "مثال: حوار في المطعم، مفردات الألوان…" })} />
      </div>
      <div>
        <Label className="text-xs">{tt({ fr: "PDF source (optionnel)", de: "Quell-PDF (optional)", ar: "ملف PDF مصدر (اختياري)" })}</Label>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()} className="gap-1">
            <FileUp className="h-3.5 w-3.5" /> {pdfFile ? tt({ fr: "Changer", de: "Ändern", ar: "تغيير" }) : tt({ fr: "Choisir un PDF", de: "PDF auswählen", ar: "اختيار ملف PDF" })}
          </Button>
          {pdfFile && (
            <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
              {pdfFile.name}
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setPdfFile(null)}><X className="h-3 w-3" /></Button>
            </span>
          )}
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
        </div>
      </div>
      <Button type="button" onClick={run} disabled={loading} className="w-full gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {tt({ fr: "Générer maintenant", de: "Jetzt generieren", ar: "توليد الآن" })}
      </Button>
    </div>
  );
}
