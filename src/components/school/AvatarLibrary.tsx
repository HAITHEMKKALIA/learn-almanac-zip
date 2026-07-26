import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = [
  { id: "adventurer", label: "Aventurier" },
  { id: "avataaars", label: "Cartoon" },
  { id: "big-smile", label: "Smile" },
  { id: "bottts", label: "Robots" },
  { id: "fun-emoji", label: "Emoji" },
  { id: "lorelei", label: "Lorelei" },
  { id: "miniavs", label: "Mini" },
  { id: "notionists", label: "Notion" },
  { id: "personas", label: "Personas" },
  { id: "pixel-art", label: "Pixel" },
  { id: "thumbs", label: "Thumbs" },
];

const SEEDS = [
  "Anna","Lukas","Mia","Noah","Lina","Felix","Emma","Paul","Sara","Ben",
  "Lea","Tim","Lara","Max","Hana","Leo","Nora","Jonas","Yara","Omar",
  "Lily","Noor","Adam","Zoe","Eli","Maya","Nael","Ines","Ali","Sami",
];

function url(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

type Props = {
  value?: string | null;
  onPick: (url: string) => void;
  trigger?: React.ReactNode;
};

export function AvatarLibrary({ value, onPick, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState(STYLES[0].id);
  const items = useMemo(() => SEEDS.map((s) => ({ seed: s, src: url(style, s) })), [style]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1">
            <ImageIcon className="h-4 w-4" /> Bibliothèque d'avatars
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choisir un avatar</DialogTitle>
        </DialogHeader>
        <Tabs value={style} onValueChange={setStyle} className="w-full">
          <TabsList className="flex flex-wrap h-auto justify-start">
            {STYLES.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="text-xs">{s.label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={style} className="mt-3">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-80 overflow-y-auto p-1">
              {items.map((it) => {
                const selected = value === it.src;
                return (
                  <button
                    key={it.seed}
                    type="button"
                    onClick={() => { onPick(it.src); setOpen(false); }}
                    className={cn(
                      "relative rounded-lg p-1 hover:bg-muted transition border-2",
                      selected ? "border-primary bg-primary/10" : "border-transparent"
                    )}
                    title={it.seed}
                  >
                    <Avatar className="h-14 w-14 mx-auto">
                      <AvatarImage src={it.src} alt={it.seed} />
                    </Avatar>
                    {selected && (
                      <span className="absolute top-0 end-0 h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
