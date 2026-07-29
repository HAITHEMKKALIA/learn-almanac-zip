import { SchoolLayout } from "@/components/school/SchoolLayout";
import { useActiveSchool } from "@/contexts/ActiveSchoolContext";
import TransactionsPanel from "@/components/finance/TransactionsPanel";

export default function SchoolTransactions() {
  const { activeSchool } = useActiveSchool();
  const schoolId = activeSchool?.id ?? null;

  if (!schoolId) {
    return (
      <SchoolLayout title="Mes transactions">
        <p className="text-muted-foreground">Sélectionnez d'abord un espace école.</p>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout title="Mes transactions" subtitle="Revenus des abonnements et dépenses de l'école.">
      <div className="max-w-6xl mx-auto">
        <TransactionsPanel
          scope="school"
          schoolId={schoolId}
          title="Transactions de l'école"
          description="Revenus (abonnements élèves) et dépenses (loyer, STEG, SONEDE, CNSS, salaires, matériel…) avec filtres et export CSV."
        />
      </div>
    </SchoolLayout>
  );
}
