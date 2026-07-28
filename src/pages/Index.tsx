import { Link } from "react-router-dom";
import { DeutschMeister } from "@/components/deutsch/DeutschMeister";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-[100dvh] w-full bg-background relative overflow-x-hidden">
      <DeutschMeister />
      {/* Floating shortcut to the school dashboards */}
      <Button
        asChild
        size="sm"
        className="fixed top-3 right-3 z-50 shadow-elev bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Link to="/app" aria-label="Aller à mon tableau de bord">
          <LayoutDashboard className="h-4 w-4 mr-1.5" />
          Mon espace
        </Link>
      </Button>
    </div>
  );
};

export default Index;
