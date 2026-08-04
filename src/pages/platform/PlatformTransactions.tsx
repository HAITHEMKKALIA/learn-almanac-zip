import TransactionsPanel from "@/components/finance/TransactionsPanel";

export default function PlatformTransactions() {
  return (
    <div className="p-4 md:p-6">
      <TransactionsPanel
        scope="platform"
        title="Mes transactions"
        description="Revenus (abonnements élèves, écoles, professeurs) et dépenses de la plateforme : loyer, STEG, SONEDE, internet, bureautique, recette des finances, CNSS, salaires, matériel, maintenance, logiciels…"
      />
    </div>
  );
}
