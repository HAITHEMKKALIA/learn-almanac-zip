import { Link } from "react-router-dom";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { LEGAL_UPDATED_AT, TERMS_VERSION } from "@/lib/legal";

export default function Terms() {
  const { tt, lang } = useI18n();
  const t = (fr: string, de: string, ar: string) => tt({ fr, de, ar });

  const sections = [
    {
      title: t("Objet et acceptation", "Gegenstand und Annahme", "الموضوع والقبول"),
      body: t(
        "Ces conditions encadrent l’utilisation de Deutsch Meister AI par les écoles, enseignants, élèves, parents et autres utilisateurs. La création ou l’utilisation d’un compte implique l’acceptation de la version affichée de ces conditions et de la politique de confidentialité.",
        "Diese Bedingungen regeln die Nutzung von Deutsch Meister AI durch Schulen, Lehrkräfte, Lernende, Eltern und andere Nutzer. Die Kontoerstellung oder Nutzung setzt die Zustimmung zu diesen Bedingungen und zur Datenschutzerklärung voraus.",
        "تنظم هذه الشروط استخدام Deutsch Meister AI من قبل المدارس والمدرسين والطلاب والأولياء وبقية المستخدمين. إنشاء الحساب أو استخدامه يعني قبول هذه الشروط وسياسة الخصوصية."
      ),
    },
    {
      title: t("Comptes, rôles et espaces privés", "Konten, Rollen und private Bereiche", "الحسابات والأدوار والمساحات الخاصة"),
      body: t(
        "Chaque compte est personnel. L’accès dépend du rôle attribué et de l’établissement approuvé. Une école, un professeur, un élève ou un parent ne peut accéder qu’aux données nécessaires dans son propre espace. Toute tentative de contourner les autorisations, d’accéder à une autre école ou d’usurper un rôle est interdite.",
        "Jedes Konto ist persönlich. Der Zugriff richtet sich nach Rolle und freigegebener Einrichtung. Nutzer dürfen nur auf die erforderlichen Daten ihres eigenen Bereichs zugreifen. Das Umgehen von Berechtigungen oder der Zugriff auf eine andere Schule ist untersagt.",
        "كل حساب شخصي. يعتمد الوصول على الدور والمؤسسة الموافق عليها. لا يجوز للمستخدم الوصول إلا إلى البيانات اللازمة داخل مساحته الخاصة. يمنع تجاوز الصلاحيات أو دخول مساحة مدرسة أخرى أو انتحال دور."
      ),
    },
    {
      title: t("Approbation et contrôle de la plateforme", "Freigabe und Plattformkontrolle", "الموافقة وإدارة المنصة"),
      body: t(
        "Le propriétaire de la plateforme peut approuver, refuser, suspendre ou archiver un compte, une adhésion, une école ou un contenu lorsqu’une vérification, un risque de sécurité, un impayé ou un non-respect des présentes conditions le justifie. Les décisions importantes sont enregistrées dans un journal d’audit.",
        "Der Plattforminhaber kann Konten, Mitgliedschaften, Schulen oder Inhalte freigeben, ablehnen, sperren oder archivieren, wenn Prüfung, Sicherheit, Zahlung oder Regelverstöße dies erfordern. Wichtige Entscheidungen werden protokolliert.",
        "يمكن لمالك المنصة قبول أو رفض أو تعليق أو أرشفة حساب أو عضوية أو مدرسة أو محتوى عند الحاجة للتحقق أو للأمن أو عدم الدفع أو مخالفة الشروط. يتم تسجيل القرارات المهمة."
      ),
    },
    {
      title: t("Intelligence artificielle et avatar", "KI und Avatar", "الذكاء الاصطناعي والأفاتار"),
      body: t(
        "L’avatar, les corrections, recommandations, prédictions et contenus générés par IA sont des aides pédagogiques. Ils peuvent comporter des erreurs et ne remplacent pas le jugement d’un enseignant, une certification officielle ni un conseil médical, juridique ou psychologique. Les décisions scolaires sensibles doivent être validées par une personne habilitée.",
        "Avatar, Korrekturen, Empfehlungen, Prognosen und KI-Inhalte sind Lernhilfen. Sie können Fehler enthalten und ersetzen weder Lehrkräfte noch offizielle Zertifizierungen oder professionelle Beratung. Wichtige Schulentscheidungen müssen menschlich geprüft werden.",
        "الأفاتار والتصحيحات والتوصيات والتوقعات والمحتوى المولد بالذكاء الاصطناعي أدوات تعليمية وقد تخطئ. لا تعوض المدرس أو الشهادة الرسمية أو الاستشارة المهنية. يجب أن يراجع شخص مخول القرارات التعليمية الحساسة."
      ),
    },
    {
      title: t("Usage acceptable et communauté", "Zulässige Nutzung und Community", "الاستخدام المقبول والمجتمع"),
      body: t(
        "Sont interdits : harcèlement, haine, fraude, triche organisée, contenu illégal, atteinte aux droits d’auteur, collecte abusive de données, logiciels malveillants et tentative d’endommager le service. Les publications communautaires et de marketplace peuvent être modérées ou retirées.",
        "Verboten sind Belästigung, Hass, Betrug, organisierte Täuschung, illegale Inhalte, Urheberrechtsverletzungen, missbräuchliche Datenerhebung, Schadsoftware und Angriffe auf den Dienst. Community- und Marktplatzinhalte können moderiert oder entfernt werden.",
        "يمنع التحرش والكراهية والاحتيال والغش المنظم والمحتوى غير القانوني وانتهاك حقوق النشر وجمع البيانات تعسفياً والبرمجيات الضارة ومحاولة الإضرار بالخدمة. يمكن مراجعة أو حذف محتوى المجتمع والسوق."
      ),
    },
    {
      title: t("Mineurs et espace parents", "Minderjährige und Elternbereich", "القصر ومساحة الأولياء"),
      body: t(
        "Pour les utilisateurs de moins de 16 ans, l’accord d’un parent ou tuteur est requis. Le parent ne voit que les enfants auxquels il est relié de manière vérifiée. L’école reste responsable de la légitimité des données pédagogiques qu’elle saisit.",
        "Für Nutzer unter 16 Jahren ist die Zustimmung eines Elternteils oder Erziehungsberechtigten erforderlich. Eltern sehen nur verifiziert verknüpfte Kinder. Die Schule bleibt für ihre eingegebenen Lerndaten verantwortlich.",
        "يلزم موافقة الولي للمستخدمين دون 16 سنة. لا يرى الولي إلا الأطفال المرتبطين به بعد التحقق. تبقى المدرسة مسؤولة عن شرعية البيانات التعليمية التي تدخلها."
      ),
    },
    {
      title: t("Abonnements, paiement et marketplace", "Abos, Zahlung und Marktplatz", "الاشتراكات والدفع والسوق"),
      body: t(
        "Les prix, limites, options et périodes applicables sont ceux affichés lors de la souscription ou dans le devis accepté. Une offre impayée peut être suspendue après notification. Les vendeurs de la marketplace garantissent disposer des droits sur leurs contenus ; commissions, remboursements et fiscalité sont précisés avant publication ou achat.",
        "Es gelten die bei Abschluss oder im angenommenen Angebot genannten Preise, Grenzen und Laufzeiten. Bei Zahlungsverzug kann der Zugang nach Mitteilung gesperrt werden. Marktplatzanbieter müssen die Rechte an ihren Inhalten besitzen.",
        "تطبق الأسعار والحدود والمدة المعروضة عند الاشتراك أو في عرض السعر المقبول. يمكن تعليق الخدمة غير المدفوعة بعد الإشعار. يضمن بائع السوق امتلاكه حقوق المحتوى وتوضح العمولة والاسترجاع والضرائب قبل البيع."
      ),
    },
    {
      title: t("Propriété intellectuelle", "Geistiges Eigentum", "الملكية الفكرية"),
      body: t(
        "La plateforme, son logiciel, sa marque et ses contenus officiels restent protégés. L’utilisateur conserve ses droits sur les contenus originaux qu’il dépose et accorde uniquement la licence technique nécessaire pour les héberger, les traiter et les afficher dans le service.",
        "Plattform, Software, Marke und offizielle Inhalte bleiben geschützt. Nutzer behalten ihre Rechte an eigenen Inhalten und erteilen nur die für Hosting, Verarbeitung und Anzeige erforderliche technische Lizenz.",
        "تبقى المنصة والبرنامج والعلامة والمحتوى الرسمي محمية. يحتفظ المستخدم بحقوق محتواه الأصلي ويمنح فقط الترخيص التقني اللازم لاستضافته ومعالجته وعرضه داخل الخدمة."
      ),
    },
    {
      title: t("Disponibilité et responsabilité", "Verfügbarkeit und Haftung", "التوفر والمسؤولية"),
      body: t(
        "Nous cherchons à maintenir un service fiable et sécurisé, sans garantir une disponibilité ininterrompue. Sauf obligation légale contraire, la responsabilité est limitée aux dommages directs prévisibles et au montant payé pour le service concerné pendant les douze derniers mois.",
        "Wir bemühen uns um einen zuverlässigen und sicheren Dienst, garantieren aber keine ununterbrochene Verfügbarkeit. Soweit gesetzlich zulässig, ist die Haftung auf vorhersehbare direkte Schäden und die in den letzten zwölf Monaten gezahlten Entgelte begrenzt.",
        "نسعى لتوفير خدمة موثوقة وآمنة دون ضمان العمل المتواصل. في حدود القانون، تقتصر المسؤولية على الضرر المباشر المتوقع والمبلغ المدفوع للخدمة خلال آخر اثني عشر شهراً."
      ),
    },
    {
      title: t("Droit applicable et contact", "Anwendbares Recht und Kontakt", "القانون المعمول به والاتصال"),
      body: t(
        "Ces conditions sont régies par le droit tunisien, sous réserve des protections impératives applicables au consommateur. Toute réclamation doit d’abord être adressée à support@deutschmeister.app afin de rechercher une solution amiable.",
        "Diese Bedingungen unterliegen tunesischem Recht, vorbehaltlich zwingender Verbraucherschutzregeln. Beschwerden sind zunächst an support@deutschmeister.app zu richten.",
        "تخضع هذه الشروط للقانون التونسي مع احترام قواعد حماية المستهلك الإلزامية. ترسل الشكاوى أولاً إلى support@deutschmeister.app لمحاولة الحل الودي."
      ),
    },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/">
            <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
            {t("Accueil", "Startseite", "الرئيسية")}
          </Link>
        </Button>

        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">
              {t("Conditions générales d’utilisation", "Nutzungsbedingungen", "شروط الاستخدام")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Deutsch Meister AI · v{TERMS_VERSION} · {t("mise à jour", "aktualisiert", "آخر تحديث")} {LEGAL_UPDATED_AT}
            </p>
          </div>
        </div>

        <Card className="space-y-6 p-6 text-sm leading-relaxed">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="mb-2 text-base font-semibold">
                {index + 1}. {section.title}
              </h2>
              <p>{section.body}</p>
            </section>
          ))}

          <p className="border-t pt-4 text-muted-foreground">
            {t(
              "Consultez également notre ",
              "Lesen Sie auch unsere ",
              "راجع كذلك "
            )}
            <Link to="/privacy" className="text-primary underline">
              {t("politique de confidentialité", "Datenschutzerklärung", "سياسة الخصوصية")}
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}

