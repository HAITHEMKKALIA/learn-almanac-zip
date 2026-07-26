import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Sparkles, Volume2, BookOpen, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

type Theme = {
  id: string; slug: string; name_de: string; name_fr: string;
  level: "A1"|"A2"|"B1"|"B2"; icon: string|null; color: string|null; position: number;
};
type Entry = {
  id: string; word: string; article: string|null; plural: string|null;
  level: string; theme_slug: string|null; translation_fr: string|null;
  translation_ar: string|null; example_de: string|null; example_fr: string|null; pos: string|null;
};

const LEVELS = ["A1","A2","B1","B2"] as const;
type Level = typeof LEVELS[number];

const ARTICLE_COLOR: Record<string,string> = {
  der: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  die: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  das: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

export default function Wortschatz() {
  const { isTeacher, isAdmin } = useAuth();
  const { tt } = useI18n();
  const [level, setLevel] = useState<Level>("A1");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState("");
  const [activeTheme, setActiveTheme] = useState<string|"all">("all");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string|null>(null);

  async function load() {
    setLoading(true);
    const [{ data: th }, { data: en }] = await Promise.all([
      supabase.from("vocab_themes").select("*").eq("level", level).order("position"),
      supabase.from("vocab_entries").select("*").eq("level", level).order("word").limit(2000),
    ]);
    setThemes((th as any) || []);
    setEntries((en as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [level]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return entries.filter(e =>
      (activeTheme === "all" || e.theme_slug === activeTheme) &&
      (!s || e.word.toLowerCase().includes(s) ||
        (e.translation_fr || "").toLowerCase().includes(s))
    );
  }, [entries, search, activeTheme]);

  const countByTheme = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of entries) if (e.theme_slug) m[e.theme_slug] = (m[e.theme_slug] || 0) + 1;
    return m;
  }, [entries]);

  async function generateForTheme(slug: string) {
    if (!isTeacher && !isAdmin) return;
    setGenerating(slug);
    try {
      const { data, error } = await supabase.functions.invoke("vocab-generate", {
        body: { level, theme_slug: slug, count: 30 },
      });
      if (error) throw error;
      toast.success(tt({ fr: `+${data?.inserted ?? 0} mots ajoutés`, de: `+${data?.inserted ?? 0} Wörter hinzugefügt`, ar: `تمت إضافة ${data?.inserted ?? 0} كلمة` }));
      await load();
    } catch (e: any) {
      toast.error(e?.message || tt({ fr: "Erreur de génération", de: "Generierungsfehler", ar: "خطأ في التوليد" }));
    } finally {
      setGenerating(null);
    }
  }

  const grouped = useMemo(() => {
    const m: Record<string, Entry[]> = {};
    for (const e of filtered) {
      const k = e.word[0]?.toUpperCase() || "?";
      (m[k] ||= []).push(e);
    }
    return Object.entries(m).sort(([a],[b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <SchoolLayout
      title="Wortschatz"
      subtitle={tt({ fr: "Vocabulaire structuré A1 → B2 (style Netzwerk neu)", de: "Strukturierter Wortschatz A1 → B2 (Netzwerk-Stil)", ar: "مفردات منظمة A1 → B2 (على نمط Netzwerk)" })}
      actions={
        <Link to="/wortschatz/flashcards">
          <Button size="sm" variant="outline"><BookOpen className="w-4 h-4 mr-1"/>Flashcards</Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Level tabs */}
        <Tabs value={level} onValueChange={(v) => setLevel(v as Level)}>
          <TabsList>
            {LEVELS.map(l => <TabsTrigger key={l} value={l}>{tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })} {l}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {/* Themes grid */}
        <Card className="p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {tt({ fr: "Groupes thématiques", de: "Thematische Wortgruppen", ar: "مجموعات موضوعية" })}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTheme("all")}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                activeTheme === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              }`}
            >{tt({ fr: "Tous", de: "Alle", ar: "الكل" })} ({entries.length})</button>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTheme(t.slug)}
                style={activeTheme === t.slug ? { background: t.color || undefined, color: "#fff", borderColor: t.color || undefined } : { borderColor: (t.color||"#999") + "55" }}
                className="px-3 py-1.5 rounded-full text-sm border bg-background hover:bg-accent flex items-center gap-1.5"
              >
                <span>{t.icon}</span>
                <span className="font-medium">{t.name_de}</span>
                <span className="text-xs opacity-70">({countByTheme[t.slug] || 0})</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Search + actions */}
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder={tt({ fr: "Recherche : mot ou traduction…", de: "Suche: Wort oder Übersetzung…", ar: "بحث: كلمة أو ترجمة…" })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {(isTeacher || isAdmin) && activeTheme !== "all" && (
            <Button
              size="sm"
              onClick={() => generateForTheme(activeTheme)}
              disabled={generating === activeTheme}
            >
              {generating === activeTheme ? <Loader2 className="w-4 h-4 mr-1 animate-spin"/> : <Sparkles className="w-4 h-4 mr-1"/>}
              {tt({ fr: "Mots IA pour ce thème", de: "KI-Wörter für dieses Thema", ar: "كلمات بالذكاء الاصطناعي لهذا الموضوع" })}
            </Button>
          )}
          <div className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <ListOrdered className="w-4 h-4"/>{filtered.length} {tt({ fr: "mots", de: "Wörter", ar: "كلمات" })}
          </div>
        </div>

        {/* Empty state for teacher */}
        {!loading && entries.length === 0 && (isTeacher || isAdmin) && (
          <Card className="p-6 text-center space-y-3">
            <div className="text-4xl">📚</div>
            <div className="font-bold">{tt({ fr: `Aucun mot pour ${level} encore.`, de: `Noch keine Wörter für ${level}.`, ar: `لا توجد كلمات لـ ${level} بعد.` })}</div>
            <div className="text-sm text-muted-foreground">
              {tt({ fr: "Sélectionne un thème ci-dessus et clique sur « Mots IA pour ce thème » pour générer le vocabulaire.", de: "Wähle oben ein Thema und klicke auf „KI-Wörter für dieses Thema“, um Wortschatz zu generieren.", ar: "اختر موضوعًا أعلاه وانقر على « كلمات بالذكاء الاصطناعي » لتوليد المفردات." })}
            </div>
          </Card>
        )}

        {/* Alphabetical list */}
        {loading ? (
          <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([letter, words]) => (
              <div key={letter}>
                <div className="sticky top-14 z-10 bg-background/95 backdrop-blur py-1 -mx-1 px-1">
                  <div className="text-2xl font-bold text-primary">{letter}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {words.map(w => <WordCard key={w.id} entry={w} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}

function WordCard({ entry }: { entry: Entry }) {
  const speakable = entry.article ? `${entry.article} ${entry.word}` : entry.word;
  return (
    <Card className="p-3 hover:shadow-md transition group">
      <div className="flex items-start gap-2">
        {entry.article && (
          <Badge variant="outline" className={`shrink-0 ${ARTICLE_COLOR[entry.article]}`}>
            {entry.article}
          </Badge>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate">{entry.word}</span>
            {entry.plural && <span className="text-xs text-muted-foreground">·  {entry.plural}</span>}
            <button
              onClick={() => speak(speakable)}
              className="ml-auto opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-primary"
              aria-label="Écouter"
            >
              <Volume2 className="w-4 h-4"/>
            </button>
          </div>
          {entry.translation_fr && (
            <div className="text-sm text-muted-foreground truncate">{entry.translation_fr}</div>
          )}
          {entry.translation_ar && (
            <div dir="rtl" className="text-sm text-emerald-600 truncate">{entry.translation_ar}</div>
          )}
          {entry.example_de && (
            <div className="text-xs italic text-muted-foreground mt-1 line-clamp-2">„{entry.example_de}"</div>
          )}
        </div>
      </div>
    </Card>
  );
}
