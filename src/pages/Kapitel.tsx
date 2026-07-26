import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";

type Kapitel = {
  id: string;
  level: string;
  number: number;
  slug: string;
  title_de: string;
  title_fr: string | null;
  subtitle: string | null;
  objectives: any;
  icon: string | null;
  color: string | null;
};

const LEVELS = ["A1", "A2", "B1", "B2"] as const;
type Level = typeof LEVELS[number];

export default function Kapitel() {
  const [level, setLevel] = useState<Level>("A1");
  const [items, setItems] = useState<Kapitel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("kapitel")
      .select("*")
      .eq("level", level)
      .order("number")
      .then(({ data }) => {
        setItems((data as any) || []);
        setLoading(false);
      });
  }, [level]);

  return (
    <SchoolLayout>
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Kapitel</h1>
            <p className="text-muted-foreground text-sm">
              Parcours pédagogique complet inspiré du programme CECRL — A1 à B2.
            </p>
          </div>
        </div>

        <Tabs value={level} onValueChange={(v) => setLevel(v as Level)}>
          <TabsList>
            {LEVELS.map((l) => (
              <TabsTrigger key={l} value={l}>{l}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((k) => (
              <Link key={k.id} to={`/kapitel/${k.level}/${k.slug}`}>
                <Card
                  className="p-5 h-full hover:shadow-lg transition-all hover:-translate-y-0.5 border-l-4"
                  style={{ borderLeftColor: k.color || "hsl(var(--primary))" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{k.icon || "📘"}</div>
                    <Badge variant="outline">Kapitel {k.number}</Badge>
                  </div>
                  <h3 className="font-bold text-lg leading-tight">{k.title_de}</h3>
                  {k.title_fr && <p className="text-sm text-muted-foreground italic">{k.title_fr}</p>}
                  {k.subtitle && <p className="text-sm mt-2">{k.subtitle}</p>}
                  {Array.isArray(k.objectives) && k.objectives.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {k.objectives.slice(0, 3).map((o: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{o}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-end text-xs text-primary font-medium">
                    Ouvrir <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
