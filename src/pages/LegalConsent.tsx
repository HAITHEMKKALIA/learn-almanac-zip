import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileCheck2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export default function LegalConsent() {
  const { tt } = useI18n();
  const { refreshLegal } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!accepted) {
      toast.error(tt({
        fr: "Veuillez accepter les documents pour continuer.",
        de: "Bitte stimmen Sie den Dokumenten zu.",
        ar: "يرجى قبول الوثائق للمتابعة.",
      }));
      return;
    }

    setBusy(true);
    const { error } = await supabase.rpc("record_my_legal_consent", {
      _terms_version: TERMS_VERSION,
      _privacy_version: PRIVACY_VERSION,
      _user_agent: navigator.userAgent,
    });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    await refreshLegal();
    toast.success(tt({
      fr: "Votre consentement a été enregistré.",
      de: "Ihre Zustimmung wurde gespeichert.",
      ar: "تم تسجيل موافقتك.",
    }));
    navigate("/app", { replace: true });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="font-display text-2xl">
            {tt({
              fr: "Mise à jour juridique",
              de: "Rechtliche Aktualisierung",
              ar: "تحديث قانوني",
            })}
          </CardTitle>
          <CardDescription>
            {tt({
              fr: "Avant de continuer, prenez connaissance des conditions et de la politique de confidentialité en vigueur.",
              de: "Lesen Sie vor dem Fortfahren die aktuellen Bedingungen und die Datenschutzerklärung.",
              ar: "قبل المتابعة، يرجى الاطلاع على شروط الاستخدام وسياسة الخصوصية الحالية.",
            })}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline">
              <Link to="/terms" target="_blank">
                <FileCheck2 className="me-2 h-4 w-4" />
                {tt({ fr: "Lire les CGU", de: "AGB lesen", ar: "قراءة الشروط" })} v{TERMS_VERSION}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/privacy" target="_blank">
                <ShieldCheck className="me-2 h-4 w-4" />
                {tt({ fr: "Confidentialité", de: "Datenschutz", ar: "الخصوصية" })} v{PRIVACY_VERSION}
              </Link>
            </Button>
          </div>

          <label className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1"
            />
            <span>
              {tt({
                fr: "J’ai lu et j’accepte les conditions générales d’utilisation et la politique de confidentialité.",
                de: "Ich habe die Nutzungsbedingungen und die Datenschutzerklärung gelesen und stimme ihnen zu.",
                ar: "قرأت شروط الاستخدام وسياسة الخصوصية وأوافق عليهما.",
              })}
            </span>
          </label>

          <Button className="w-full" onClick={submit} disabled={!accepted || busy}>
            {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {tt({ fr: "Accepter et continuer", de: "Akzeptieren und fortfahren", ar: "قبول ومتابعة" })}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
