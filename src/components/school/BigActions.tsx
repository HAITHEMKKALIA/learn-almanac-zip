import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Action = {
  to: string;
  title: string;
  desc?: string;
  icon: any;
  badge?: string | number;
  accent?: string;
};

export function BigActions({ actions }: { actions: Action[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {actions.map((a) => (
        <Link key={a.to + a.title} to={a.to} className="group">
          <Card className="relative h-full p-5 border-border/60 hover:border-primary/50 hover:shadow-elev transition-all hover:-translate-y-0.5">
            <div className={`h-12 w-12 rounded-xl grid place-items-center mb-3 ${a.accent || "bg-primary/10 text-primary"}`}>
              <a.icon className="h-6 w-6" />
            </div>
            <div className="font-display text-lg font-bold leading-tight">{a.title}</div>
            {a.desc && <div className="text-xs text-muted-foreground mt-1">{a.desc}</div>}
            {a.badge !== undefined && a.badge !== 0 && (
              <Badge className="absolute top-3 end-3">{a.badge}</Badge>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
