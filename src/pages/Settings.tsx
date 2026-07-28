import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Globe, Bell, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/school/UserAvatar";
import { AvatarLibrary } from "@/components/school/AvatarLibrary";
import { useI18n } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";

function MessengerToggle() {
  const { tt } = useI18n();
  const [on, setOn] = useState<boolean>(localStorage.getItem("show_floating_messenger") !== "false");
  const toggle = (v: boolean) => {
    setOn(v);
    localStorage.setItem("show_floating_messenger", v ? "true" : "false");
    window.dispatchEvent(new CustomEvent("messenger-visibility-changed"));
  };
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-medium">{tt({ fr: "Bulle messagerie flottante", de: "Schwebende Nachrichten-Blase", ar: "فقاعة الرسائل العائمة" })}</div>
        <div className="text-xs text-muted-foreground">{tt({ fr: "Affiche un raccourci messagerie en bas à droite, sur toutes les pages.", de: "Zeigt eine Nachrichten-Verknüpfung unten rechts auf allen Seiten.", ar: "يعرض اختصار الرسائل في الأسفل يمينًا على جميع الصفحات." })}</div>
      </div>
      <Switch checked={on} onCheckedChange={toggle} />
    </div>
  );
}

export default function Settings() {
  const { user, roles, signOut } = useAuth();
  const { tt } = useI18n();
  const [displayName, setDisplayName] = useState("");
  const [lang, setLang] = useState("fr");
  const [gender, setGender] = useState<"male"|"female"|"other"|"">("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles")
        .select("display_name, preferred_lang, gender, avatar_url")
        .eq("user_id", user.id).maybeSingle();
      if (data) {
        setDisplayName(data.display_name || "");
        setLang(data.preferred_lang || "fr");
        setGender((data as any).gender || "");
        setAvatarUrl((data as any).avatar_url || "");
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      display_name: displayName, preferred_lang: lang,
      gender: gender || null, avatar_url: avatarUrl || null,
    } as any).eq("user_id", user.id);
    if (error) toast.error(error.message); else toast.success(tt({ fr: "Profil mis à jour", de: "Profil aktualisiert", ar: "تم تحديث الملف" }));
  };

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl } as any).eq("user_id", user.id);
    toast.success(tt({ fr: "Photo mise à jour", de: "Foto aktualisiert", ar: "تم تحديث الصورة" }));
    setUploading(false);
  };

  return (
    <SchoolLayout
      title={tt({ fr: "Paramètres", de: "Einstellungen", ar: "الإعدادات" })}
      subtitle={tt({ fr: "Compte, langue et notifications", de: "Konto, Sprache und Benachrichtigungen", ar: "الحساب واللغة والإشعارات" })}
      breadcrumbs={[{ label: tt({ fr: "Paramètres", de: "Einstellungen", ar: "الإعدادات" }) }]}
    >
      <div className="grid lg:grid-cols-2 gap-4 max-w-4xl">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><User className="h-5 w-5 text-primary"/>{tt({ fr: "Profil", de: "Profil", ar: "الملف الشخصي" })}</CardTitle>
            <CardDescription>{tt({ fr: "Photo, genre et identité", de: "Foto, Geschlecht und Identität", ar: "الصورة والجنس والهوية" })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <UserAvatar name={displayName} url={avatarUrl} gender={gender || undefined} size="xl" />
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4 me-1"/>{uploading ? tt({ fr: "Envoi…", de: "Hochladen…", ar: "جارٍ الإرسال…" }) : tt({ fr: "Changer la photo", de: "Foto ändern", ar: "تغيير الصورة" })}
                  </Button>
                  <AvatarLibrary
                    value={avatarUrl}
                    onPick={async (u) => {
                      setAvatarUrl(u);
                      if (user) await supabase.from("profiles").update({ avatar_url: u } as any).eq("user_id", user.id);
                      toast.success(tt({ fr: "Avatar mis à jour", de: "Avatar aktualisiert", ar: "تم تحديث الصورة" }));
                    }}
                  />
                  {avatarUrl && <Button size="sm" variant="ghost" onClick={() => { setAvatarUrl(""); save(); }}>{tt({ fr: "Retirer", de: "Entfernen", ar: "إزالة" })}</Button>}
                </div>
              </div>
            </div>
            <div><Label>{tt({ fr: "E-mail", de: "E-Mail", ar: "البريد" })}</Label><Input value={user?.email || ""} disabled/></div>
            <div><Label>{tt({ fr: "Nom affiché", de: "Anzeigename", ar: "الاسم المعروض" })}</Label><Input value={displayName} onChange={e=>setDisplayName(e.target.value)} disabled={loading}/></div>
            <div>
              <Label>{tt({ fr: "Genre", de: "Geschlecht", ar: "الجنس" })}</Label>
              <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                <SelectTrigger><SelectValue placeholder={tt({ fr: "Choisir…", de: "Wählen…", ar: "اختر…" })}/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{tt({ fr: "Homme", de: "Männlich", ar: "ذكر" })}</SelectItem>
                  <SelectItem value="female">{tt({ fr: "Femme", de: "Weiblich", ar: "أنثى" })}</SelectItem>
                  <SelectItem value="other">{tt({ fr: "Autre", de: "Andere", ar: "آخر" })}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{tt({ fr: "Détermine l'avatar par défaut H/F si aucune photo.", de: "Bestimmt den Standard-Avatar.", ar: "يحدد الصورة الافتراضية." })}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <Label className="w-full mb-1">{tt({ fr: "Rôles", de: "Rollen", ar: "الأدوار" })}</Label>
              {roles.length ? roles.map(r=>(
                <Badge key={r} className={r==="admin"?"bg-destructive/15 text-destructive border-destructive/30":r==="teacher"?"bg-primary/15 text-primary border-primary/30":"bg-muted text-muted-foreground"} variant="outline">{r}</Badge>
              )) : <span className="text-xs text-muted-foreground">—</span>}
            </div>
            <Button onClick={save} className="w-full">{tt({ fr: "Enregistrer", de: "Speichern", ar: "حفظ" })}</Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Globe className="h-5 w-5 text-primary"/>{tt({ fr: "Langue & affichage", de: "Sprache & Anzeige", ar: "اللغة والعرض" })}</CardTitle>
            <CardDescription>{tt({ fr: "Préférence d'interface", de: "Oberflächensprache", ar: "تفضيل الواجهة" })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>{tt({ fr: "Langue préférée", de: "Bevorzugte Sprache", ar: "اللغة المفضلة" })}</Label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} variant="outline" className="w-full">{tt({ fr: "Enregistrer", de: "Speichern", ar: "حفظ" })}</Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/>{tt({ fr: "Affichage", de: "Anzeige", ar: "العرض" })}</CardTitle>
            <CardDescription>{tt({ fr: "Personnaliser l'interface", de: "Oberfläche anpassen", ar: "تخصيص الواجهة" })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MessengerToggle />
            <PushToggle />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/>{tt({ fr: "Sécurité", de: "Sicherheit", ar: "الأمان" })}</CardTitle>
            <CardDescription>{tt({ fr: "Session et déconnexion", de: "Sitzung und Abmeldung", ar: "الجلسة وتسجيل الخروج" })}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signOut} variant="destructive" className="w-full">{tt({ fr: "Se déconnecter", de: "Abmelden", ar: "تسجيل الخروج" })}</Button>
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}
