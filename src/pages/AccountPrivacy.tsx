import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Link, useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AccountPrivacy() {
  const { tt, lang } = useI18n();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const t = (fr: string, de: string, ar: string) => tt({ fr, de, ar });

  const exportData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("gdpr_export_my_data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deutsch-meister-export-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("Export téléchargé","Export heruntergeladen","تم تنزيل التصدير"));
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  const requestDeletion = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("gdpr_request_deletion");
      if (error) throw error;
      toast.success(t("Demande enregistrée. Un admin la traitera sous 30 jours.","Anfrage gespeichert. Ein Admin bearbeitet sie innerhalb von 30 Tagen.","تم تسجيل الطلب. سيعالجه المسؤول خلال 30 يومًا."));
      setTimeout(() => { supabase.auth.signOut(); nav("/"); }, 2000);
    } catch (e: any) {
      toast.error(e.message);
    }
    setDeleting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/app"><Button variant="ghost" size="sm" className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> {t("Retour","Zurück","رجوع")}</Button></Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <h1 className="text-3xl font-display font-bold">{t("Ma confidentialité","Mein Datenschutz","خصوصيتي")}</h1>
            <p className="text-sm text-muted-foreground">{t("Contrôlez vos données personnelles (RGPD)","Kontrollieren Sie Ihre Daten (DSGVO)","تحكم في بياناتك (GDPR)")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Download className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{t("Exporter mes données","Meine Daten exportieren","تصدير بياناتي")}</h3>
                <p className="text-sm text-muted-foreground mb-3">{t("Téléchargez un fichier JSON contenant toutes vos données : profil, cours, exercices, examens, certificats, chat IA, badges, etc.",
                  "Laden Sie eine JSON-Datei mit all Ihren Daten herunter.",
                  "قم بتنزيل ملف JSON يحتوي على جميع بياناتك.")}</p>
                <Button onClick={exportData} disabled={loading}>{loading ? t("Préparation…","Vorbereitung…","جاري التحضير…") : t("Télécharger l'export JSON","JSON-Export herunterladen","تنزيل JSON")}</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-destructive/30">
            <div className="flex items-start gap-4">
              <Trash2 className="h-6 w-6 text-destructive shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1 text-destructive">{t("Supprimer mon compte","Konto löschen","حذف حسابي")}</h3>
                <p className="text-sm text-muted-foreground mb-3">{t("Demande de suppression définitive. Vos données, progression, certificats et messages seront supprimés sous 30 jours. Action irréversible.",
                  "Endgültige Löschanfrage. Ihre Daten werden innerhalb von 30 Tagen gelöscht.",
                  "طلب حذف نهائي. سيتم حذف بياناتك خلال 30 يومًا.")}</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>{t("Demander la suppression","Löschung anfordern","طلب الحذف")}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("Confirmer la suppression ?","Löschung bestätigen?","تأكيد الحذف؟")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("Cette action est irréversible. Vous serez déconnecté immédiatement.","Diese Aktion ist unumkehrbar.","لا رجعة في هذا الإجراء.")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("Annuler","Abbrechen","إلغاء")}</AlertDialogCancel>
                      <AlertDialogAction onClick={requestDeletion} className="bg-destructive hover:bg-destructive/90">{t("Confirmer","Bestätigen","تأكيد")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground">{t("Consultez notre ","Siehe unsere ","اطلع على ")}<Link to="/privacy" className="text-primary underline">{t("politique de confidentialité complète","vollständige Datenschutzerklärung","سياسة الخصوصية الكاملة")}</Link>.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
