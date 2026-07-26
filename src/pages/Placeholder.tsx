import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export default function Placeholder({ title, hint }: { title: string; hint?: string }) {
  const { tt } = useI18n();
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/app" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3"/>{tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}
        </Link>
        <Card className="mt-4">
          <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {hint || tt({
                fr: "Module en cours de construction — sera livré dans la phase suivante.",
                de: "Modul in Arbeit — wird in der nächsten Phase geliefert.",
                ar: "الوحدة قيد الإنشاء — ستُسلَّم في المرحلة التالية.",
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
