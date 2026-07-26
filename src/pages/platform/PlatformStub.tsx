import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function PlatformStub({ title, description }: { title: string; description: string }) {
  const { tt } = useI18n();
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6">{description}</p>
      <div className="rounded-2xl border bg-card p-10 text-center">
        <Construction className="h-10 w-10 mx-auto text-amber-500 mb-3" />
        <div className="font-display font-semibold text-lg">
          {tt({ fr: "Bientôt disponible", de: "Demnächst verfügbar", ar: "متوفر قريباً" })}
        </div>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {tt({
            fr: "Cette page sera livrée dans la prochaine étape (L2/L3/L4 du plan).",
            de: "Diese Seite wird in der nächsten Phase (L2/L3/L4 des Plans) bereitgestellt.",
            ar: "ستتوفر هذه الصفحة في المرحلة التالية (L2/L3/L4 من الخطة).",
          })}
        </p>
        <Link to="/platform-admin" className="inline-block mt-4 text-sm text-primary hover:underline">
          ← {tt({ fr: "Retour au dashboard", de: "Zurück zum Dashboard", ar: "العودة إلى لوحة التحكم" })}
        </Link>
      </div>
    </div>
  );
}
