import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Baby } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ParentChildren() {
  const { user } = useAuth();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { tt } = useI18n();

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await (supabase as any)
        .from("guardian_links")
        .select("id, student_id, relationship, status, profiles:student_id(display_name, email)")
        .eq("guardian_id", user.id);
      setLinks(data || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <SchoolLayout
      title={tt({ fr: "Mes enfants", de: "Meine Kinder", ar: "أطفالي" })}
      subtitle={tt({
        fr: "Suivi détaillé par enfant lié à votre compte",
        de: "Detaillierte Übersicht für jedes mit Ihrem Konto verknüpfte Kind",
        ar: "متابعة تفصيلية لكل طفل مرتبط بحسابك",
      })}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">{tt({ fr: "Chargement…", de: "Laden…", ar: "جارٍ التحميل…" })}</p>
      ) : links.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Baby className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {tt({
                fr: "Aucun enfant lié à votre compte. Contactez l'école pour créer la liaison.",
                de: "Kein Kind ist mit Ihrem Konto verknüpft. Wenden Sie sich an die Schule, um die Verknüpfung herzustellen.",
                ar: "لا يوجد طفل مرتبط بحسابك. اتصل بالمدرسة لإنشاء الارتباط.",
              })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {links.map((l) => (
            <Card key={l.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{l.profiles?.display_name || l.profiles?.email || tt({ fr: "Enfant", de: "Kind", ar: "طفل" })}</CardTitle>
                    <CardDescription>{l.relationship || tt({ fr: "Parent", de: "Elternteil", ar: "ولي الأمر" })}</CardDescription>
                  </div>
                  <Badge variant={l.status === "approved" ? "secondary" : "outline"}>{l.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <Link to="/parent" className="text-primary underline">
                  {tt({ fr: "Voir le tableau de bord →", de: "Dashboard anzeigen →", ar: "عرض لوحة التحكم →" })}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SchoolLayout>
  );
}
