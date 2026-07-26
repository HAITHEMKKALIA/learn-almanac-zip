import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  description?: string;
  features?: string[];
}

export function ModulePlaceholder({ title, subtitle, icon: Icon = Construction, description, features = [] }: Props) {
  const { tt } = useI18n();
  return (
    <SchoolLayout title={title} subtitle={subtitle} breadcrumbs={[{ label: title }]}>
      <Card className="border-border/60 max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl grid place-items-center bg-gradient-warm text-white shadow-elev">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="font-display">{title}</CardTitle>
              <CardDescription>{description || tt({ fr: "Module en cours d'activation.", de: "Modul wird gerade aktiviert.", ar: "الوحدة قيد التفعيل." })}</CardDescription>
            </div>
          </div>
        </CardHeader>
        {features.length > 0 && (
          <CardContent>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {tt({ fr: "Fonctionnalités prévues", de: "Geplante Funktionen", ar: "الميزات المخطط لها" })}
            </div>
            <ul className="space-y-2 text-sm">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"/>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </SchoolLayout>
  );
}
