import { Link } from "react-router-dom";
import { DeutschMeister } from "@/components/deutsch/DeutschMeister";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const Learn = () => {
  const { tt } = useI18n();
  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 me-1.5 rtl:rotate-180" />
              {tt({ fr: "Accueil", de: "Startseite", ar: "الرئيسية" })}
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>🇩🇪</span>
            <span>DeutschMeister</span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/app">
              <LayoutDashboard className="h-4 w-4 me-1.5" />
              {tt({ fr: "Mon espace", de: "Mein Bereich", ar: "مساحتي" })}
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative h-[calc(100vh-49px)] w-full overflow-hidden border-b">
        <DeutschMeister />
      </section>

    </div>
  );
};

export default Learn;
