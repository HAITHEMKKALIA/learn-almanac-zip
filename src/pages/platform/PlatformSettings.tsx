import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Globe, BookOpen, TicketCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ContentLib = {
  id: string;
  name: string;
  status: string;
};

export default function PlatformSettings() {
  const { tt } = useI18n();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: "",
    platform_name: "Deutsch Meister",
    platform_logo_url: "",
    support_email: "",
    default_language: "fr",
    default_timezone: "Europe/Paris",
    maintenance_mode: false,
    global_ai_quota_daily: 200,
    terms_url: "",
    privacy_url: "",
  });
  const [officialLibs, setOfficialLibs] = useState<ContentLib[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) {
      setSettings({
        id: data.id,
        platform_name: data.platform_name ?? "Deutsch Meister",
        platform_logo_url: data.platform_logo_url ?? "",
        support_email: data.support_email ?? "",
        default_language: data.default_language ?? "fr",
        default_timezone: data.default_timezone ?? "Europe/Paris",
        maintenance_mode: data.maintenance_mode ?? false,
        global_ai_quota_daily: data.global_ai_quota_daily ?? 200,
        terms_url: data.terms_url ?? "",
        privacy_url: data.privacy_url ?? "",
      });
    }
    const { data: libs } = await supabase
      .from("content_libraries")
      .select("id,name,status")
      .eq("type", "official");
    setOfficialLibs((libs || []) as ContentLib[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const payload: any = { ...settings, extra: {} };
    delete payload.id;
    try {
      if (settings.id) {
        const { error } = await supabase.from("platform_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("platform_settings").insert([payload]);
        if (error) throw error;
      }
      toast({
        title: tt({ fr: "Paramètres enregistrés", de: "Einstellungen gespeichert", ar: "تم حفظ الإعدادات" }),
        description: tt({ fr: "La configuration globale a été mise à jour.", de: "Die globale Konfiguration wurde aktualisiert.", ar: "تم تحديث الإعدادات العامة." }),
      });
      load();
    } catch (e: any) {
      toast({
        title: tt({ fr: "Erreur", de: "Fehler", ar: "خطأ" }),
        description: e.message || tt({ fr: "Impossible d'enregistrer.", de: "Speichern nicht möglich.", ar: "تعذّر الحفظ." }),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold">{tt({ fr: "Paramètres plateforme", de: "Plattform-Einstellungen", ar: "إعدادات المنصة" })}</h1>
        <p className="text-muted-foreground mt-1">
          {tt({ fr: "Configuration globale, licences et contenus officiels.", de: "Globale Konfiguration, Lizenzen und offizielle Inhalte.", ar: "الإعدادات العامة، التراخيص والمحتويات الرسمية." })}
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe className="h-5 w-5 text-primary" />
              {tt({ fr: "Configuration globale", de: "Globale Konfiguration", ar: "الإعدادات العامة" })}
            </CardTitle>
            <CardDescription>
              {tt({ fr: "Identité visuelle, contacts et comportements par défaut de la plateforme.", de: "Visuelle Identität, Kontakte und Standardverhalten der Plattform.", ar: "الهوية البصرية، جهات الاتصال والسلوك الافتراضي للمنصة." })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="platform_name">{tt({ fr: "Nom de la plateforme", de: "Plattformname", ar: "اسم المنصة" })}</Label>
              <Input id="platform_name" value={settings.platform_name} onChange={(e) => update("platform_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform_logo_url">{tt({ fr: "URL du logo", de: "Logo-URL", ar: "رابط الشعار" })}</Label>
              <Input id="platform_logo_url" value={settings.platform_logo_url} onChange={(e) => update("platform_logo_url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_email">{tt({ fr: "Email support", de: "Support-E-Mail", ar: "بريد الدعم" })}</Label>
              <Input id="support_email" type="email" value={settings.support_email} onChange={(e) => update("support_email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_language">{tt({ fr: "Langue par défaut", de: "Standardsprache", ar: "اللغة الافتراضية" })}</Label>
              <Input id="default_language" value={settings.default_language} onChange={(e) => update("default_language", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_timezone">{tt({ fr: "Fuseau horaire par défaut", de: "Standard-Zeitzone", ar: "المنطقة الزمنية الافتراضية" })}</Label>
              <Input id="default_timezone" value={settings.default_timezone} onChange={(e) => update("default_timezone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="global_ai_quota_daily">{tt({ fr: "Quota AI global / jour", de: "Globales KI-Kontingent/Tag", ar: "حصة الذكاء الاصطناعي/يوم" })}</Label>
              <Input id="global_ai_quota_daily" type="number" value={settings.global_ai_quota_daily} onChange={(e) => update("global_ai_quota_daily", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms_url">{tt({ fr: "URL des CGU", de: "AGB-URL", ar: "رابط الشروط" })}</Label>
              <Input id="terms_url" value={settings.terms_url} onChange={(e) => update("terms_url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacy_url">{tt({ fr: "URL de la politique de confidentialité", de: "Datenschutz-URL", ar: "رابط سياسة الخصوصية" })}</Label>
              <Input id="privacy_url" value={settings.privacy_url} onChange={(e) => update("privacy_url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex items-center justify-between md:col-span-2 border rounded-lg p-4">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance_mode" className="text-base">
                  {tt({ fr: "Mode maintenance", de: "Wartungsmodus", ar: "وضع الصيانة" })}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {tt({ fr: "Rendre la plateforme inaccessible aux utilisateurs non-admin.", de: "Plattform für Nicht-Admins unzugänglich machen.", ar: "جعل المنصة غير متاحة لغير المسؤولين." })}
                </p>
              </div>
              <Switch id="maintenance_mode" checked={settings.maintenance_mode} onCheckedChange={(v) => update("maintenance_mode", v)} />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={save} disabled={saving}>
              {saving ? tt({ fr: "Enregistrement…", de: "Wird gespeichert…", ar: "جارٍ الحفظ…" }) : tt({ fr: "Enregistrer", de: "Speichern", ar: "حفظ" })}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TicketCheck className="h-5 w-5 text-primary" />
              {tt({ fr: "Licences & Quotas", de: "Lizenzen & Kontingente", ar: "التراخيص والحصص" })}
            </CardTitle>
            <CardDescription>
              {tt({ fr: "Résumé des quotas et licences actifs sur la plateforme.", de: "Übersicht der aktiven Kontingente und Lizenzen.", ar: "ملخص الحصص والتراخيص النشطة." })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {tt({ fr: "Les quotas par école sont gérés depuis l'admin de chaque école. Le quota AI global par défaut est configurable dans la section « Configuration globale » ci-dessus.", de: "Schulkontingente werden in der jeweiligen Schul-Administration verwaltet. Das globale KI-Standardkontingent ist oben unter „Globale Konfiguration“ einstellbar.", ar: "تُدار حصص كل مدرسة من لوحة المدرسة. الحصة الافتراضية للذكاء الاصطناعي قابلة للضبط أعلاه." })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              {tt({ fr: "Contenus officiels", de: "Offizielle Inhalte", ar: "المحتويات الرسمية" })}
            </CardTitle>
            <CardDescription>
              {tt({ fr: "Bibliothèques de contenu marquées comme officielles et disponibles pour toutes les écoles.", de: "Als offiziell markierte Inhaltsbibliotheken, verfügbar für alle Schulen.", ar: "مكتبات المحتوى الرسمية المتاحة لكل المدارس." })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {officialLibs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {tt({ fr: "Aucun contenu officiel pour le moment.", de: "Derzeit keine offiziellen Inhalte.", ar: "لا توجد محتويات رسمية حالياً." })}
              </div>
            ) : (
              <div className="divide-y">
                {officialLibs.map((lib) => (
                  <div key={lib.id} className="flex items-center justify-between py-3">
                    <div className="font-medium">{lib.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lib.status === "published" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                      {lib.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
