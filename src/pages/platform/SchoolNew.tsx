import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);

export default function PlatformSchoolNew() {
  const nav = useNavigate();
  const { tt } = useI18n();
  const [form, setForm] = useState({
    name: "", legal_name: "", slug: "",
    city: "", country: "", phone: "", email: "", website: "",
    address: "", status: "active" as "pending" | "active" | "suspended",
    owner_email: "", owner_password: "", owner_name: "",
  });
  const [busy, setBusy] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v, ...(k === "name" && !f.slug ? { slug: slugify(v) } : {}) }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error(tt({ fr: "Nom requis", de: "Name erforderlich", ar: "الاسم مطلوب" })); return; }
    if (form.owner_email.trim() && form.owner_password && form.owner_password.length < 8) {
      toast.error(tt({ fr: "Mot de passe: 8 caractères min.", de: "Passwort: min. 8 Zeichen", ar: "كلمة المرور: 8 أحرف على الأقل" }));
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-school", {
        body: {
          name: form.name.trim(),
          slug: form.slug.trim() || slugify(form.name),
          legal_name: form.legal_name || null,
          city: form.city || null,
          country: form.country || null,
          phone: form.phone || null,
          email: form.email || null,
          website: form.website || null,
          address: form.address || null,
          status: form.status,
          owner_email: form.owner_email.trim() || null,
          owner_password: form.owner_password || null,
          owner_name: form.owner_name || null,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success(tt({ fr: "École créée", de: "Schule erstellt", ar: "تم إنشاء المدرسة" }));
      nav(`/platform-admin/schools/${(data as any).id}`);
    } catch (e: any) {
      toast.error(e.message || tt({ fr: "Erreur création école", de: "Fehler beim Erstellen der Schule", ar: "خطأ في إنشاء المدرسة" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to="/platform-admin/schools" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {tt({ fr: "Retour aux écoles", de: "Zurück zu den Schulen", ar: "العودة إلى المدارس" })}
      </Link>
      <h1 className="text-3xl font-display font-bold mb-2">{tt({ fr: "Créer une école", de: "Schule erstellen", ar: "إنشاء مدرسة" })}</h1>
      <p className="text-muted-foreground mb-6">
        {tt({ fr: "Nouveau tenant indépendant sur la plateforme.", de: "Neuer unabhängiger Mandant auf der Plattform.", ar: "مستأجر مستقل جديد على المنصة." })}
      </p>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>{tt({ fr: "Nom de l'école *", de: "Schulname *", ar: "اسم المدرسة *" })}</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Deutsch Center Tunis" />
          </div>
          <div>
            <Label>{tt({ fr: "Slug", de: "Slug", ar: "المعرّف" })}</Label>
            <Input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} placeholder="deutsch-center-tunis" />
          </div>
          <div>
            <Label>{tt({ fr: "Nom légal", de: "Rechtlicher Name", ar: "الاسم القانوني" })}</Label>
            <Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} />
          </div>
          <div>
            <Label>{tt({ fr: "Ville", de: "Stadt", ar: "المدينة" })}</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div>
            <Label>{tt({ fr: "Pays", de: "Land", ar: "البلد" })}</Label>
            <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
          </div>
          <div>
            <Label>{tt({ fr: "Téléphone", de: "Telefon", ar: "الهاتف" })}</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <Label>{tt({ fr: "Email", de: "E-Mail", ar: "البريد الإلكتروني" })}</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>{tt({ fr: "Site web", de: "Webseite", ar: "الموقع الإلكتروني" })}</Label>
            <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://…" />
          </div>
          <div className="col-span-2">
            <Label>{tt({ fr: "Adresse", de: "Adresse", ar: "العنوان" })}</Label>
            <Textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={2} />
          </div>
          <div className="col-span-2">
            <Label>{tt({ fr: "Statut", de: "Status", ar: "الحالة" })}</Label>
            <select value={form.status} onChange={(e) => update("status", e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              <option value="active">{tt({ fr: "active", de: "aktiv", ar: "نشطة" })}</option>
              <option value="pending">{tt({ fr: "en attente", de: "ausstehend", ar: "قيد الانتظار" })}</option>
              <option value="suspended">{tt({ fr: "suspendue", de: "gesperrt", ar: "موقوفة" })}</option>
            </select>
          </div>

          <div className="col-span-2 mt-2 rounded-lg border border-dashed p-4 space-y-3 bg-muted/30">
            <div className="text-sm font-medium">
              {tt({ fr: "Compte admin de l'école (optionnel)", de: "Schul-Admin-Konto (optional)", ar: "حساب مسؤول المدرسة (اختياري)" })}
            </div>
            <div className="text-xs text-muted-foreground">
              {tt({
                fr: "Renseignez email + mot de passe pour créer directement l'accès admin école. Si vide, vous serez le propriétaire.",
                de: "E-Mail + Passwort eingeben, um den Schul-Admin-Zugang sofort zu erstellen. Wenn leer, werden Sie Inhaber.",
                ar: "أدخل البريد وكلمة المرور لإنشاء حساب مسؤول المدرسة مباشرة. إذا تُرك فارغًا، ستكون أنت المالك.",
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{tt({ fr: "Email du propriétaire", de: "E-Mail des Inhabers", ar: "بريد المالك الإلكتروني" })}</Label>
                <Input type="email" value={form.owner_email} onChange={(e) => update("owner_email", e.target.value)} placeholder="owner@school.com" />
              </div>
              <div>
                <Label>{tt({ fr: "Nom affiché", de: "Anzeigename", ar: "الاسم المعروض" })}</Label>
                <Input value={form.owner_name} onChange={(e) => update("owner_name", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>{tt({ fr: "Mot de passe (8+ caractères)", de: "Passwort (mind. 8 Zeichen)", ar: "كلمة المرور (8+ أحرف)" })}</Label>
                <Input type="password" minLength={8} autoComplete="new-password" value={form.owner_password} onChange={(e) => update("owner_password", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" asChild><Link to="/platform-admin/schools">{tt({ fr: "Annuler", de: "Abbrechen", ar: "إلغاء" })}</Link></Button>
          <Button onClick={submit} disabled={busy}>
            <Save className="h-4 w-4 mr-2" />
            {busy
              ? tt({ fr: "Création…", de: "Erstellen…", ar: "جارٍ الإنشاء…" })
              : tt({ fr: "Créer l'école", de: "Schule erstellen", ar: "إنشاء المدرسة" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
