import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEGAL_UPDATED_AT, PRIVACY_VERSION } from "@/lib/legal";

export default function Privacy() {
  const { tt, lang } = useI18n();
  const t = (fr: string, de: string, ar: string) => tt({ fr, de, ar });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/"><Button variant="ghost" size="sm" className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> {t("Accueil","Startseite","الرئيسية")}</Button></Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 grid place-items-center text-white"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <h1 className="text-3xl font-display font-bold">{t("Politique de confidentialité","Datenschutzerklärung","سياسة الخصوصية")}</h1>
            <p className="text-sm text-muted-foreground">
              Deutsch Meister · v{PRIVACY_VERSION} · {t("Dernière mise à jour","Zuletzt aktualisiert","آخر تحديث")}: {LEGAL_UPDATED_AT}
            </p>
          </div>
        </div>

        <Card className="p-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-base mb-2">1. {t("Responsable du traitement","Verantwortlicher","المسؤول عن المعالجة")}</h2>
            <p>{t(
              "Cette application est éditée par l'équipe Deutsch Meister. Cette page décrit comment nous collectons et protégeons vos données.",
              "Diese Anwendung wird vom Deutsch Meister-Team betrieben. Diese Seite beschreibt, wie wir Ihre Daten erheben und schützen.",
              "يتم تشغيل هذا التطبيق من قبل فريق Deutsch Meister. تصف هذه الصفحة كيفية جمع بياناتك وحمايتها."
            )}</p>
          </section>
          <section>
            <h2 className="font-semibold text-base mb-2">2. {t("Données collectées","Erhobene Daten","البيانات المجمعة")}</h2>
            <ul className="list-disc ps-6 space-y-1">
              <li>{t("Identité : email, nom, avatar, langue préférée","Identität: E-Mail, Name, Avatar, Sprache","الهوية: البريد، الاسم، الصورة، اللغة")}</li>
              <li>{t("Apprentissage : progression, exercices, examens, vocabulaire","Lernen: Fortschritt, Übungen, Prüfungen, Wortschatz","التعلم: التقدم، التمارين، الامتحانات، المفردات")}</li>
              <li>{t("Interactions : messages, présence, historique de chat IA","Interaktionen: Nachrichten, Anwesenheit, KI-Chat-Verlauf","التفاعلات: الرسائل، الحضور، سجل الدردشة")}</li>
              <li>{t("Techniques : logs anonymisés, cookies de session","Technisch: anonymisierte Logs, Session-Cookies","تقنية: سجلات مجهولة، ملفات تعريف الجلسة")}</li>
            </ul>
          </section>
          <section>
            <h2 className="font-semibold text-base mb-2">3. {t("Base légale","Rechtsgrundlage","الأساس القانوني")}</h2>
            <p>{t("Exécution du contrat pédagogique, obligations légales (établissements), et consentement pour les mineurs (via l'accord parental).",
                  "Vertragserfüllung, gesetzliche Pflichten und elterliche Einwilligung für Minderjährige.",
                  "تنفيذ العقد التعليمي، الالتزامات القانونية، وموافقة الوالدين للقصر.")}</p>
          </section>
          <section>
            <h2 className="font-semibold text-base mb-2">4. {t("Vos droits","Ihre Rechte","حقوقك")}</h2>
            <p>{t("Vous pouvez à tout moment accéder, exporter ou supprimer vos données via ",
                  "Sie können jederzeit über den folgenden Bereich auf Ihre Daten zugreifen, sie exportieren oder löschen: ",
                  "يمكنك الوصول إلى بياناتك أو تصديرها أو حذفها في أي وقت من: ")}
              <Link to="/account/privacy" className="text-primary underline">{t("Mon compte → Confidentialité","Mein Konto → Datenschutz","حسابي ← الخصوصية")}</Link>.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-base mb-2">5. {t("Mineurs","Minderjährige","القاصرون")}</h2>
            <p>{t("Pour les élèves de moins de 16 ans, un accord parental est requis lors de l'inscription. Le parent peut à tout moment demander la suppression du compte.",
                  "Für Schüler unter 16 Jahren ist bei der Registrierung die elterliche Einwilligung erforderlich.",
                  "بالنسبة للطلاب دون سن 16، مطلوب موافقة الوالدين عند التسجيل.")}</p>
          </section>
          <section>
            <h2 className="font-semibold text-base mb-2">6. {t("Conservation","Aufbewahrung","الاحتفاظ")}</h2>
            <p>{t("Données pédagogiques : durée de la scolarité + 3 ans. Certificats : 10 ans. Logs techniques : 12 mois maximum.",
                  "Lerndaten: Schulzeit + 3 Jahre. Zertifikate: 10 Jahre. Technische Logs: max. 12 Monate.",
                  "بيانات التعلم: مدة الدراسة + 3 سنوات. الشهادات: 10 سنوات. السجلات: 12 شهرًا كحد أقصى.")}</p>
          </section>
          <section>
            <h2 className="font-semibold text-base mb-2">7. {t("Contact","Kontakt","اتصال")}</h2>
            <p>privacy@deutsch-meister.app</p>
          </section>
        </Card>
      </div>
    </div>
  );
}
