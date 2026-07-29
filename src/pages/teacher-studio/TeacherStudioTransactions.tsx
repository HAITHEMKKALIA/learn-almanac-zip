import { SchoolLayout } from "@/components/school/SchoolLayout";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import TransactionsPanel from "@/components/finance/TransactionsPanel";

export default function TeacherStudioTransactions() {
  const { user } = useAuth();
  const { activeSchool } = useActiveSchool();
  const schoolId = activeSchool?.id ?? null;

  if (!user || !schoolId) {
    return (
      <SchoolLayout title="Mes transactions">
        <p className="text-muted-foreground">Sélectionnez d'abord votre studio.</p>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout title="Mes transactions" subtitle="Revenus de vos élèves et dépenses de votre studio.">
      <div className="max-w-6xl mx-auto">
        <TransactionsPanel
          scope="teacher_studio"
          schoolId={schoolId}
          ownerUserId={user.id}
          title="Transactions du studio"
          description="Suivez vos encaissements et vos dépenses avec filtres par jour, semaine, mois ou année."
        />
      </div>
    </SchoolLayout>
  );
}
