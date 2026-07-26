import { useState } from "react";
import { SpeakBtn } from "./SpeakBtn";
import type { VocabItem } from "@/data/curriculum";

interface FlashcardDeckProps {
  vocab: VocabItem[];
  onClose: () => void;
}

export function FlashcardDeck({ vocab, onClose }: FlashcardDeckProps) {
  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  const [known, setKnown] = useState(new Set<number>());
  const card = vocab[idx];

  const nxt = (ok: boolean) => {
    if (ok) setKnown(p => new Set([...p, idx]));
    setFlip(false);
    setTimeout(() => setIdx(p => (p + 1) % vocab.length), 150);
  };

  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex justify-between mb-3.5">
        <h3 className="text-foreground m-0 text-base">🃏 Flashcards</h3>
        <button onClick={onClose} className="bg-transparent border-none text-muted-foreground text-xl cursor-pointer">✕</button>
      </div>
      <div className="bg-card rounded-md p-0.5 mb-1.5">
        <div className="bg-success h-1 rounded transition-all duration-500" style={{ width: `${(known.size / vocab.length) * 100}%` }} />
      </div>
      <div className="text-muted-foreground text-center text-xs mb-3.5">{known.size}/{vocab.length}</div>

      <div
        onClick={() => setFlip(!flip)}
        className={`flex-1 max-h-[300px] flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-card to-card-hover rounded-2xl border-2 p-6 mb-3.5 min-h-[180px] transition-colors ${
          flip ? "border-primary" : "border-border"
        }`}
      >
        <div className="text-[11px] text-text-dim uppercase tracking-widest mb-2">
          {flip ? "Français" : "Deutsch"}
        </div>
        <div className="text-2xl font-bold text-foreground text-center">
          {flip ? card.fr : card.de}
        </div>
        {flip && card.ex && (
          <div className="text-sm text-primary-light mt-1.5 italic">"{card.ex}"</div>
        )}
        <div className="flex gap-2.5 mt-2.5">
          <SpeakBtn text={card.de} size={24} />
          {card.ex && <SpeakBtn text={card.ex} size={18} className="opacity-60" />}
        </div>
      </div>

      <div className="flex gap-2.5">
        <button onClick={() => nxt(false)}
          className="flex-1 p-3.5 rounded-xl border-2 border-destructive bg-transparent text-destructive font-bold cursor-pointer">
          ✗ À revoir
        </button>
        <button onClick={() => nxt(true)}
          className="flex-1 p-3.5 rounded-xl border-none bg-success text-success-foreground font-bold cursor-pointer">
          ✓ Maîtrisé
        </button>
      </div>
    </div>
  );
}
