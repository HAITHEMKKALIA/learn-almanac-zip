# Mes Transactions — Revenus & Dépenses

## Objectif
Ajouter un module de gestion financière dans la sidebar de :
- **Admin école** (`/school-admin/transactions`) — revenus des abonnements élèves + dépenses de l'école
- **Professeur indépendant** (`/teacher-studio/transactions`) — revenus de ses élèves + ses dépenses
- **Platform Admin** (`/platform/transactions`) — revenus globaux : abonnements payés par les écoles + profs indépendants + élèves indépendants (pas de dépenses ici)

## 1. Base de données

Nouvelle table `public.transactions` :
- `id`, `created_at`, `updated_at`
- `scope` : `school` | `teacher_studio` | `student_solo` | `platform`
- `school_id` (nullable, pour scopes école/teacher/solo)
- `owner_user_id` (nullable, pour teacher_studio/student_solo)
- `direction` : `income` | `expense`
- `category` : enum (voir ci-dessous)
- `description` (text)
- `amount_tnd` (numeric)
- `transaction_date` (date)
- `payment_method` (virement/chèque/espèces/carte)
- `reference` (n° facture/reçu)
- `related_subscription_id` (FK optionnel vers `subscriptions`)
- `created_by` (auth.uid)

**Catégories dépenses** : `rent`, `electricity_steg`, `water_sonede`, `internet`, `office_supplies`, `cnss`, `salary`, `salary_advance`, `equipment_purchase`, `maintenance`, `software_subscription`, `tax`, `other`.
**Catégorie revenu** : `subscription`, `other_income`.

**RLS** :
- Admin école (owner) : full CRUD sur `scope='school'` de son `school_id`.
- Prof indép : full CRUD sur `scope='teacher_studio'` de son espace.
- Élève solo : lecture ses transactions (facultatif).
- Super admin : accès `scope='platform'` + lecture globale.

**Génération auto** des revenus : trigger sur `subscriptions` (paid_at) qui insère une transaction revenu correspondante dans le bon scope. Sur Platform Admin, chaque paiement d'abonnement école/prof/élève solo génère une transaction `scope='platform'`, `direction='income'`.

## 2. UI partagée

Composant `src/components/finance/TransactionsPanel.tsx` avec props `{ scope, schoolId?, ownerId?, allowExpenses }` :
- Cartes KPI : Total revenus, Total dépenses, Solde (période)
- Filtres période : Jour / Semaine / Mois / Année / Personnalisé (date range picker)
- Filtre catégorie et direction
- Table historique (date, catégorie, description, méthode, référence, montant, action)
- Bouton "Ajouter dépense" (dialog avec formulaire) — masqué sur Platform Admin
- Bouton "Ajouter revenu manuel" (autre revenu hors abonnement)
- Bouton "Exporter" — génère un CSV et un PDF avec le même filtre appliqué

Formulaire dépense : catégorie (select), description (textarea), montant TND, date, mode paiement, référence.

## 3. Pages & sidebar

- `src/pages/school/SchoolTransactions.tsx` → utilise `TransactionsPanel scope="school"`
- `src/pages/teacher-studio/TeacherStudioTransactions.tsx` → `scope="teacher_studio"`
- `src/pages/platform/PlatformTransactions.tsx` → `scope="platform"` (revenus uniquement)
- Ajouter routes dans `src/App.tsx`
- Ajouter entrée "Mes transactions" (icône Wallet) dans :
  - `AppSidebar.tsx` (visible pour school_admin/owner et teacher_studio)
  - `PlatformAdminLayout.tsx` sidebar

## 4. Export
- CSV : util local (Blob download).
- PDF : réutiliser `jspdf` (déjà utilisé) — tableau simple + totaux.

## Détails techniques
- Migration crée table + GRANT + RLS + trigger `subscriptions_to_transaction`.
- Génération PDF via helper `src/lib/transactionsPdf.ts`.
- i18n : libellés FR uniquement dans un premier temps (comme le reste du billing).
- Trigger idempotent : ON CONFLICT sur `related_subscription_id` pour éviter doublons.

Livrable en une seule passe : migration + composant partagé + 3 pages + entrées sidebar + export CSV/PDF.
