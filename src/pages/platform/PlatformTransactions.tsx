import TransactionsPanel from "@/components/finance/TransactionsPanel";

export default function PlatformTransactions() {
  return (
    <div className="p-4 md:p-6">
      <TransactionsPanel
        scope="platform"
        incomeOnly
        title="Revenus de la plateforme"
        description="Revenus provenant des abonnements des écoles, professeurs indépendants et élèves indépendants."
      />
    </div>
  );
}
