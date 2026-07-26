import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkles, BookOpen, FileText, BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AcademicDashboard() {
  const { tt } = useI18n();
  const tiles = [
    { icon: BookOpen, label: tt({ fr: "Cours publiés", de: "Veröffentlichte Kurse", ar: "الدروس المنشورة" }), value: "—" },
    { icon: Sparkles, label: tt({ fr: "Contenus IA à valider", de: "KI-Inhalte zu prüfen", ar: "محتوى ذكاء اصطناعي للمراجعة" }), value: "—" },
    { icon: FileText, label: tt({ fr: "Examens modèles", de: "Musterprüfungen", ar: "نماذج الامتحانات" }), value: "—" },
    { icon: BarChart3, label: tt({ fr: "Progression moyenne", de: "Durchschnittlicher Fortschritt", ar: "متوسط التقدم" }), value: "—" },
  ];
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-2">
              <t.icon className="h-5 w-5" />
            </div>
            <CardDescription>{t.label}</CardDescription>
            <CardTitle className="text-3xl">{t.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>{tt({ fr: "Curriculum A1 → B2", de: "Lehrplan A1 → B2", ar: "المنهج A1 → B2" })}</CardTitle>
          <CardDescription>{tt({ fr: "Organisation pédagogique des sous-niveaux et compétences.", de: "Pädagogische Gliederung der Unterstufen und Kompetenzen.", ar: "التنظيم التربوي للمستويات الفرعية والكفاءات." })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {["A1.1","A1.2","A2.1","A2.2","B1.1","B1.2","B2.1","B2.2"].map((lvl) => (
              <div key={lvl} className="rounded-xl border p-4 text-center">
                <div className="font-display text-2xl font-bold">{lvl}</div>
                <div className="text-xs text-muted-foreground mt-1">Hören · Lesen · Sprechen · Schreiben</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
