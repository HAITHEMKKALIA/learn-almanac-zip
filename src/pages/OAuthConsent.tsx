import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthClient = { name?: string; client_name?: string; redirect_uri?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
const oauth = () => (supabase.auth as any).oauth as {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { tt } = useI18n();

  const T = {
    title: { fr: "Autoriser l'accès", de: "Zugriff erlauben", ar: "منح الوصول" },
    subtitle: {
      fr: "Cette application veut se connecter à votre compte Deutsch Meister.",
      de: "Diese Anwendung möchte sich mit Ihrem Deutsch-Meister-Konto verbinden.",
      ar: "يريد هذا التطبيق الاتصال بحسابك في Deutsch Meister.",
    },
    scopeLine: {
      fr: "Elle pourra utiliser les outils de l'application en votre nom, dans les limites de vos permissions.",
      de: "Sie kann die Tools der App in Ihrem Namen und im Rahmen Ihrer Berechtigungen verwenden.",
      ar: "يمكنها استخدام أدوات التطبيق نيابةً عنك، ضمن حدود صلاحياتك.",
    },
    approve: { fr: "Approuver", de: "Genehmigen", ar: "موافقة" },
    deny: { fr: "Refuser", de: "Ablehnen", ar: "رفض" },
    loading: { fr: "Chargement…", de: "Lädt…", ar: "جارٍ التحميل…" },
    missing: { fr: "Requête d'autorisation invalide.", de: "Ungültige Autorisierungsanfrage.", ar: "طلب تفويض غير صالح." },
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError(tt(T.missing));
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-academy-hero">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{tt(T.title)}</CardTitle>
          <CardDescription>{tt(T.subtitle)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !details ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {tt(T.loading)}
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-semibold">
                  {details.client?.client_name || details.client?.name || "External application"}
                </div>
                {details.client?.redirect_uri && (
                  <div className="text-xs text-muted-foreground break-all mt-1">{details.client.redirect_uri}</div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{tt(T.scopeLine)}</p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => decide(true)} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 me-2 animate-spin" />} {tt(T.approve)}
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => decide(false)} disabled={busy}>
                  {tt(T.deny)}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
