import { useState, useMemo } from "react";
import { COURSE_MODULES, type CourseModule, type BilingualItem } from "@/data/courseModules";
import { SpeakBtn } from "./SpeakBtn";

interface Props {
  onBack: () => void;
}

interface SearchHit {
  module: CourseModule;
  section: string;
  item: BilingualItem;
}

export function CourseComplete({ onBack }: Props) {
  const [selected, setSelected] = useState<CourseModule | null>(null);
  const [query, setQuery] = useState("");

  // Build flat searchable index
  const searchIndex: SearchHit[] = useMemo(() => {
    const index: SearchHit[] = [];
    for (const m of COURSE_MODULES) {
      for (const sec of m.sections) {
        for (const item of sec.items || []) {
          index.push({ module: m, section: sec.title, item });
        }
      }
    }
    return index;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return searchIndex
      .filter(({ item }) => {
        return (
          item.de.toLowerCase().includes(q) ||
          item.fr.toLowerCase().includes(q) ||
          item.ex?.toLowerCase().includes(q) ||
          item.exFr?.toLowerCase().includes(q)
        );
      })
      .slice(0, 80);
  }, [query, searchIndex]);

  // ===== DETAIL VIEW =====
  if (selected) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
          <button onClick={() => setSelected(null)} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
          <h3 className="text-foreground m-0 text-base flex-1">{selected.icon} {selected.title}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-muted-foreground text-xs mb-4 italic">{selected.subtitle}</p>

          {selected.sections.map((sec, si) => (
            <div key={si} className="mb-5">
              <h4 className="text-primary font-bold text-sm mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" /> {sec.title}
              </h4>
              {sec.intro && (
                <p className="text-muted-foreground text-[11px] mb-2 italic px-1">💡 {sec.intro}</p>
              )}
              <div className="flex flex-col gap-1.5">
                {sec.items?.map((item, i) => (
                  <div key={i} className="p-2.5 bg-card rounded-lg border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-foreground font-bold text-sm">🇩🇪 {item.de}</span>
                          {item.pron && (
                            <span className="text-muted-foreground text-[10px] italic">[{item.pron}]</span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">🇫🇷 {item.fr}</div>
                        {item.ex && (
                          <div className="mt-1.5 pt-1.5 border-t border-border/50">
                            <div className="flex items-center gap-1.5">
                              <span className="text-foreground text-[11px]">🇩🇪 {item.ex}</span>
                              <SpeakBtn text={item.ex} size={11} />
                            </div>
                            {item.exFr && (
                              <div className="text-muted-foreground text-[10px] italic">🇫🇷 {item.exFr}</div>
                            )}
                          </div>
                        )}
                        {item.note && (
                          <div className="text-primary text-[10px] mt-1">⚠️ {item.note}</div>
                        )}
                      </div>
                      <SpeakBtn text={item.de} size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-foreground text-xs font-bold">🎤 Pratiquez ce module avec le Prof IA !</p>
            <p className="text-muted-foreground text-[11px] mt-1">
              Il vous testera oralement sur ce vocabulaire et corrigera votre prononciation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <h3 className="text-foreground m-0 text-base">📚 Cours Complet Approfondi</h3>
      </div>

      {/* Search bar (sticky) */}
      <div className="px-3 py-2.5 border-b border-border bg-background">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un mot allemand ou français..."
            className="w-full h-10 pl-9 pr-9 rounded-xl bg-card border border-border text-foreground text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted text-muted-foreground border-none cursor-pointer flex items-center justify-center text-xs hover:bg-accent transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* SEARCH RESULTS */}
        {query.trim().length >= 2 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-muted-foreground text-xs">
                {results.length === 0 ? "Aucun résultat" : `${results.length} résultat${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`} pour <b className="text-foreground">"{query}"</b>
              </p>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-foreground font-bold text-sm mb-1">Aucun mot trouvé</p>
                <p className="text-muted-foreground text-xs max-w-xs">
                  Essayez un autre mot, en allemand ou en français.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {results.map((hit, i) => {
                  const q = query.trim().toLowerCase();
                  const highlight = (text: string) => {
                    const lower = text.toLowerCase();
                    const idx = lower.indexOf(q);
                    if (idx === -1) return text;
                    return (
                      <>
                        {text.slice(0, idx)}
                        <mark className="bg-primary/30 text-foreground rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
                        {text.slice(idx + q.length)}
                      </>
                    );
                  };
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelected(hit.module); setQuery(""); }}
                      className="p-3 bg-card rounded-lg border border-border text-left cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">{hit.module.icon} {hit.module.title}</span>
                        <span className="text-muted-foreground">› {hit.section}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground font-bold text-sm truncate">🇩🇪 {highlight(hit.item.de)}</div>
                          <div className="text-muted-foreground text-xs truncate">🇫🇷 {highlight(hit.item.fr)}</div>
                        </div>
                        <SpeakBtn text={hit.item.de} size={14} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          // ===== MODULES LIST =====
          <>
            <p className="text-muted-foreground text-xs mb-3">
              {COURSE_MODULES.length} modules complets avec audio 🔊 sur chaque mot et phrase.
            </p>
            <div className="flex flex-col gap-2">
              {COURSE_MODULES.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-muted-foreground">Module {i + 1}</div>
                    <div className="font-bold text-foreground text-sm">{m.title}</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">{m.subtitle}</div>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
