import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Award, CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function VerifyCertificate() {
  const { number } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { tt } = useI18n();
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).rpc("verify_certificate", { _number: number });
      setData(Array.isArray(data) ? data[0] : data);
      setLoading(false);
    })();
  }, [number]);
  if (loading) return <div className="min-h-screen grid place-items-center">{tt({ fr: "Vérification…", de: "Überprüfung…", ar: "جارٍ التحقق…" })}</div>;
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-md w-full bg-card border rounded-xl shadow-elev p-8 text-center">
        <Award className="h-12 w-12 text-primary mx-auto mb-3" />
        <h1 className="text-2xl font-display font-bold mb-2">
          {tt({ fr: "Vérification de certificat", de: "Zertifikatsüberprüfung", ar: "التحقق من الشهادة" })}
        </h1>
        <p className="text-xs font-mono text-muted-foreground mb-6">{number}</p>
        {data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="h-5 w-5" /> {tt({ fr: "Certificat authentique", de: "Echtes Zertifikat", ar: "شهادة أصلية" })}
            </div>
            <div className="text-left text-sm bg-muted rounded p-4 space-y-1">
              <div><b>{tt({ fr: "Élève", de: "Schüler", ar: "الطالب" })}:</b> {data.student_name}</div>
              <div><b>{tt({ fr: "École", de: "Schule", ar: "المدرسة" })}:</b> {data.school_name}</div>
              <div><b>{tt({ fr: "Niveau", de: "Niveau", ar: "المستوى" })}:</b> {data.sub_level}</div>
              <div><b>{tt({ fr: "Note", de: "Note", ar: "العلامة" })}:</b> {data.final_score}/100 {data.mention && `(${data.mention})`}</div>
              <div><b>{tt({ fr: "Émis le", de: "Ausgestellt am", ar: "صدر في" })}:</b> {new Date(data.issued_at).toLocaleDateString()}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-destructive font-semibold">
            <XCircle className="h-5 w-5" /> {tt({ fr: "Certificat introuvable ou révoqué", de: "Zertifikat nicht gefunden oder widerrufen", ar: "الشهادة غير موجودة أو ملغاة" })}
          </div>
        )}
      </div>
    </div>
  );
}
