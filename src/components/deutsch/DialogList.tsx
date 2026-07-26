import { ALL_DIALOGS, getDialog, type InteractiveDialog as DialogData } from "@/data/dialogs";
import { InteractiveDialog } from "./InteractiveDialog";
import { useState } from "react";

interface Props {
  onBack: () => void;
}

export function DialogList({ onBack }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialog: DialogData | undefined = activeId ? getDialog(activeId) : undefined;

  if (dialog) {
    return <InteractiveDialog dialog={dialog} onBack={() => setActiveId(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3.5 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="bg-transparent border-none text-primary text-lg cursor-pointer">←</button>
        <h3 className="text-foreground m-0 text-base">🎭 Dialogues audio interactifs</h3>
        <span dir="rtl" className="text-muted-foreground text-xs ml-auto">حوارات صوتية</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-muted-foreground text-xs mb-1">
          Audio synchronisé mot par mot · Surlignage en temps réel · Traduction française commutable
        </p>
        <p dir="rtl" className="text-muted-foreground text-xs mb-3">
          صوت متزامن كلمة بكلمة · إبراز فوري · ترجمة فرنسية قابلة للتبديل
        </p>
        <div className="flex flex-col gap-2.5">
          {ALL_DIALOGS.map(d => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className="flex items-center gap-3 p-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-left cursor-pointer hover:border-primary hover:opacity-90 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-3xl shrink-0">{d.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-primary font-bold uppercase tracking-wide">⭐ Audio interactif</div>
                <div className="font-bold text-foreground text-sm">{d.title}</div>
                <div className="text-muted-foreground text-[11px] mt-0.5 truncate">{d.subtitle} · {d.lines.length} répliques</div>
              </div>
              <span className="text-primary text-lg">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
