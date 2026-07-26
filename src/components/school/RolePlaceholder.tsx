import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Construction, ArrowRight } from "lucide-react";
import { SchoolLayout } from "./SchoolLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface Props {
  title: string;
  subtitle?: string;
  hint?: string;
  parentHref?: string;
  parentLabel?: string;
  actions?: ReactNode;
}

export default function RolePlaceholder({ title, subtitle, hint, parentHref, parentLabel, actions }: Props) {
  const { tt } = useI18n();
  return (
    <SchoolLayout title={title} subtitle={subtitle} actions={actions}>
      <Card className="border-dashed">
        <CardContent className="py-14 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 grid place-items-center mb-4">
            <Construction className="h-6 w-6" />
          </div>
          <div className="font-display font-semibold text-lg">
            {tt({ fr: "Bientôt disponible", de: "Demnächst verfügbar", ar: "متوفر قريباً" })}
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {hint || tt({
              fr: "Cette interface est en cours de finalisation. La structure est en place, le contenu détaillé arrive.",
              de: "Diese Oberfläche wird gerade fertiggestellt. Die Struktur steht, der detaillierte Inhalt folgt.",
              ar: "هذه الواجهة قيد الإنهاء. الهيكل جاهز، والمحتوى التفصيلي قادم.",
            })}
          </p>
          {parentHref && (
            <Button asChild variant="outline" size="sm" className="mt-5">
              <Link to={parentHref}>
                {parentLabel || tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })} <ArrowRight className="h-3 w-3 ms-1" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </SchoolLayout>
  );
}
