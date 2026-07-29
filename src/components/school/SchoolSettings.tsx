import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Trash2, Image as ImageIcon, Save, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // ~10 years

export function SchoolSettings({ schoolId }: { schoolId: string }) {
  const { tt } = useI18n();
  const { refresh } = useActiveSchool();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("schools")
        .select("name, slug, logo_url")
        .eq("id", schoolId)
        .maybeSingle();
      if (!alive) return;
      if (error) toast.error(error.message);
      setName(data?.name ?? "");
      setSlug(data?.slug ?? "");
      setLogoUrl(data?.logo_url ?? null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [schoolId]);

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error(tt({ fr: "Le nom est requis", de: "Name erforderlich", ar: "الاسم مطلوب" }));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("schools")
      .update({ name: name.trim(), slug: slug.trim() || null })
      .eq("id", schoolId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(tt({ fr: "Profil enregistré", de: "Profil gespeichert", ar: "تم حفظ الملف" }));
    refresh();
  };

  const uploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(tt({ fr: "Veuillez choisir une image", de: "Bitte ein Bild wählen", ar: "الرجاء اختيار صورة" }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(tt({ fr: "Image trop grande (max 2 Mo)", de: "Bild zu groß (max 2 MB)", ar: "الصورة كبيرة (حد أقصى 2 ميغا)" }));
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${schoolId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("school-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("school-logos")
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (sErr) throw sErr;
      const url = signed?.signedUrl ?? null;
      const { error: updErr } = await supabase
        .from("schools")
        .update({ logo_url: url })
        .eq("id", schoolId);
      if (updErr) throw updErr;
      setLogoUrl(url);
      toast.success(tt({ fr: "Logo mis à jour", de: "Logo aktualisiert", ar: "تم تحديث الشعار" }));
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!logoUrl) return;
    if (!confirm(tt({ fr: "Supprimer le logo ?", de: "Logo entfernen?", ar: "حذف الشعار؟" }))) return;
    const { error } = await supabase.from("schools").update({ logo_url: null }).eq("id", schoolId);
    if (error) { toast.error(error.message); return; }
    setLogoUrl(null);
    toast.success(tt({ fr: "Logo supprimé", de: "Logo entfernt", ar: "تم الحذف" }));
    refresh();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {tt({ fr: "Profil de l'école", de: "Schulprofil", ar: "ملف المدرسة" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="school-name">{tt({ fr: "Nom de l'école", de: "Schulname", ar: "اسم المدرسة" })}</Label>
            <Input id="school-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="school-slug">{tt({ fr: "Identifiant (slug)", de: "Kennung (slug)", ar: "المعرّف" })}</Label>
            <Input id="school-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="alfa-academy" />
          </div>
          <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {tt({ fr: "Enregistrer", de: "Speichern", ar: "حفظ" })}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            {tt({ fr: "Logo de l'école", de: "Schullogo", ar: "شعار المدرسة" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {tt({
              fr: "Le logo apparaîtra à côté de « Deutsch Meister » dans la barre latérale de tous les membres.",
              de: "Das Logo erscheint neben „Deutsch Meister" in der Seitenleiste aller Mitglieder.",
              ar: "سيظهر الشعار بجانب « Deutsch Meister » في الشريط الجانبي لجميع الأعضاء.",
            })}
          </p>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border grid place-items-center overflow-hidden bg-muted/30">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadLogo(f);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {logoUrl
                    ? tt({ fr: "Remplacer", de: "Ersetzen", ar: "استبدال" })
                    : tt({ fr: "Téléverser", de: "Hochladen", ar: "رفع" })}
                </Button>
                {logoUrl && (
                  <Button size="sm" variant="outline" onClick={removeLogo}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {tt({ fr: "Supprimer", de: "Entfernen", ar: "حذف" })}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP, SVG · max 2 Mo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
