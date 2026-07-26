import { useMemo, useState } from "react";
import { VERBS_DICT, VERB_GROUP_LABELS, type VerbGroup, type VerbEntry } from "@/data/verbsDictionary";
import { SpeakBtn } from "./SpeakBtn";
import { useI18n, translateFrToAr } from "@/lib/i18n";

interface Props { onBack: () => void }

// Arabic labels for verb groups
const GROUP_AR: Record<VerbGroup, string> = {
  regular: "أفعال منتظمة",
  irregular: "أفعال شاذة",
  modal: "أفعال ناقصة (modaux)",
  separable: "أفعال قابلة للفصل",
  reflexive: "أفعال انعكاسية",
};

// Arabic labels for grammatical cases
const CAS_AR: Record<string, string> = {
  "Akk": "المفعول به (Akk)",
  "Dat": "حالة الجر (Dat)",
  "Gen": "حالة الإضافة (Gen)",
  "Akk + Dat": "مفعول به + جر",
  "Akk+Dat": "مفعول به + جر",
};

function ArInline({ fr, force, className = "" }: { fr?: string; force?: string; className?: string }) {
  const { showAr, deOnly } = useI18n();
  if (deOnly || !showAr) return null;
  const ar = force ?? (fr ? translateFrToAr(fr) : "");
  if (!ar) return null;
  return <div dir="rtl" className={`text-emerald-400 text-[10px] mt-0.5 ${className}`}>🇸🇦 {ar}</div>;
}

export function VerbsDictionary({ onBack }: Props) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<VerbGroup | "all">("all");

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return VERBS_DICT.filter(v =>
      (group === "all" || v.group === group) &&
      (!qn || v.de.toLowerCase().includes(qn) || v.fr.toLowerCase().includes(qn))
    );
  }, [q, group]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <div className="flex-1">
          <h3 className="text-foreground m-0 text-base">📚 Verbes — dictionnaire ({VERBS_DICT.length})</h3>
          <ArInline force={`📚 قاموس الأفعال (${VERBS_DICT.length})`} />
          <div className="text-muted-foreground text-[11px]">Recherche par allemand ou français · groupe + cas régi</div>
          <ArInline force="ابحث بالألمانية أو الفرنسية · المجموعة + الحالة الإعرابية" />
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border flex flex-col gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="🔎 essen, manger, gehen…  /  كل، يأكل…"
          className="w-full p-2.5 rounded-xl bg-card border border-border text-foreground text-sm outline-none focus:border-primary"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setGroup("all")}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${
              group === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
            }`}
          >
            <div>Tous ({VERBS_DICT.length})</div>
            <div dir="rtl" className="text-[9px] opacity-80">الكل ({VERBS_DICT.length})</div>
          </button>
          {Object.entries(VERB_GROUP_LABELS).map(([g, meta]) => {
            const count = VERBS_DICT.filter(v => v.group === g).length;
            return (
              <button
                key={g}
                onClick={() => setGroup(g as VerbGroup)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${
                  group === g ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                }`}
              >
                <div>{meta.emoji} {meta.label} ({count})</div>
                <div dir="rtl" className="text-[9px] opacity-80">{GROUP_AR[g as VerbGroup]} ({count})</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {filtered.map(v => <VerbRow key={v.de} v={v} />)}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground text-sm p-6">
            Aucun verbe trouvé.
            <ArInline force="لم يتم العثور على أي فعل." />
          </div>
        )}
      </div>
    </div>
  );
}

function VerbRow({ v }: { v: VerbEntry }) {
  const meta = VERB_GROUP_LABELS[v.group];
  const { showAr, deOnly } = useI18n();
  const showArabic = !deOnly && showAr;
  const arSense = showArabic ? translateFrToAr(v.fr) : "";
  return (
    <div className="p-2.5 rounded-xl border border-border bg-card flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-foreground text-sm">{v.de}</span>
          <span className="text-muted-foreground text-xs">— {v.fr}</span>
        </div>
        {showArabic && arSense && (
          <div dir="rtl" className="text-emerald-400 text-[11px] mt-0.5">🇸🇦 {arSense}</div>
        )}
        <div className="flex gap-1 flex-wrap mt-0.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-foreground">
            {meta.emoji} {meta.label}
            {showArabic && <span dir="rtl" className="ml-1 opacity-80">· {GROUP_AR[v.group]}</span>}
          </span>
          {v.cas && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-semibold">
              {v.cas}
              {showArabic && <span dir="rtl" className="ml-1 opacity-80">· {CAS_AR[v.cas] ?? v.cas}</span>}
            </span>
          )}
          {v.past && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              Prät: {v.past}
              {showArabic && <span dir="rtl" className="ml-1 opacity-80">· الماضي</span>}
            </span>
          )}
          {v.pp && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success">
              PP: {v.pp}
              {showArabic && <span dir="rtl" className="ml-1 opacity-80">· اسم المفعول</span>}
            </span>
          )}
        </div>
      </div>
      <SpeakBtn text={v.de} size={16} />
    </div>
  );
}
