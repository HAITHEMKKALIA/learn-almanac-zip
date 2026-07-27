# Audit sécurité, multi-tenant et performance

Date : 27 juillet 2026  
Produit : Deutsch Meister AI  
Portée : application React, Supabase/Postgres, fonctions Edge, espaces école/professeur/élève/parent et espace propriétaire.

## Verdict

Avant cette correction, le principal risque était l’utilisation de rôles globaux (`admin`, `teacher`, etc.) pour choisir les interfaces et, dans plusieurs anciennes politiques SQL, pour autoriser un accès transversal. Un administrateur d’école ne doit jamais être traité comme un administrateur de toute la plateforme.

La correction introduit une frontière explicite :

1. le compte doit être approuvé ;
2. l’école doit être active ;
3. l’adhésion à cette école doit être approuvée ;
4. le rôle utilisé est celui de l’adhésion à l’espace actif ;
5. les politiques RLS et les fonctions sensibles recontrôlent l’école côté serveur ;
6. seul `super_admin`, c’est-à-dire le propriétaire de la plateforme, possède une vue globale.

La migration associée est :

`supabase/migrations/20260727075032_strict_tenant_isolation_and_platform_approval.sql`

Elle doit être déployée avant de considérer l’isolation comme active en production.

## Matrice d’accès cible

| Persona | Données visibles | Actions principales | Approbation |
|---|---|---|---|
| Propriétaire plateforme | Toutes les écoles et tous les espaces | Approuver, refuser, suspendre, auditer, gérer abonnements et contenu officiel | Décision finale |
| Admin école | Son école uniquement | Membres, classes, statistiques et paramètres de son école | Peut soumettre une demande, ne peut pas l’approuver |
| Direction pédagogique | Son école uniquement | Curriculum, bibliothèque, validation pédagogique et rapports | Aucun droit global |
| Professeur | Ses classes dans l’école active | Cours, devoirs, examens, correction et suivi de ses élèves | Aucun droit sur une autre école |
| Élève | Son compte et ses classes | Leçons, avatar IA, exercices, examens et progression | Aucun accès administratif |
| Parent | Enfants reliés et vérifiés | Progression, devoirs, résultats et messages | Aucun accès aux autres élèves |
| Professeur indépendant | Son studio actif | Classes privées, élèves, examens et attestations privées | Activation initiale par le propriétaire |
| Élève indépendant | Son espace personnel actif | Parcours, avatar IA, vocabulaire et examens blancs | Activation initiale par le propriétaire |

## Contrôles mis en place

### Base de données

- Ajout de `space_role` sur `school_members` pour rattacher le rôle à une école précise.
- `my_learning_spaces()` ne retourne que les écoles actives et les adhésions approuvées.
- `has_role(..., 'admin')` n’accorde plus un accès global ; ce privilège est réservé à `super_admin`.
- Les helpers `is_school_member`, `is_school_owner`, `is_school_teacher` et `teacher_can_view_student` vérifient désormais l’école, l’adhésion et l’approbation.
- Les politiques RLS critiques ont été reconstruites pour `schools`, `school_members`, `classes`, `class_members`, `direct_messages`, `user_presence`, `subscriptions` et `audit_logs`.
- Un trigger générique bloque les écritures vers un autre `school_id`, y compris en présence d’une ancienne politique permissive.
- Les messages et la présence ne sont visibles qu’entre utilisateurs partageant une école approuvée.
- Les abonnements ne sont visibles que par le propriétaire de la plateforme, le propriétaire de l’abonnement ou le gestionnaire de l’école concernée.
- Le curriculum officiel (`kapitel`, sections et vocabulaire global) est modifiable uniquement par le propriétaire de la plateforme.
- Les fonctions `SECURITY DEFINER` d’approbation vérifient explicitement `auth.uid()`, le statut `super_admin`, un `search_path` sûr et des droits d’exécution restreints.

### Approbations

- Une demande d’école, de studio, d’espace personnel ou de code de classe reste `pending`.
- Le propriétaire traite d’abord les espaces, puis les adhésions de leurs membres.
- Une approbation crée le rôle applicatif nécessaire et, pour un élève, effectue l’affectation à la classe demandée.
- Les décisions sont ajoutées à `audit_logs`.
- Un admin d’école peut créer une demande de compte, mais la fonction Edge ne peut plus approuver le compte ni réinitialiser le mot de passe d’un compte existant.

### Interface

- Toutes les routes métier contrôlent le type d’espace et le rôle dans cet espace.
- Le rôle global n’est plus utilisé pour choisir le menu d’une école.
- Chaque persona possède au maximum cinq entrées principales.
- Les pages sont chargées à la demande, y compris l’avatar, les tableaux de bord et l’administration de plateforme.
- Le canal Realtime Presence global a été retiré ; la présence utilise uniquement la table protégée par RLS.

### Conditions d’utilisation

- CGU version 2.0 disponibles sur `/terms`.
- Politique de confidentialité version 2.0 sur `/privacy`.
- Écran de consentement obligatoire sur `/legal-consent` pour les comptes n’ayant pas accepté la version actuelle.
- Consentement versionné enregistré dans `consent_logs`.
- Les CGU couvrent l’isolation des espaces, l’IA, les mineurs, la communauté, la marketplace, les abonnements, la propriété intellectuelle, la suspension et le droit tunisien.

Une validation juridique par un avocat tunisien reste recommandée avant commercialisation.

## Performance

La première compilation auditée produisait un bundle principal d’environ 3,21 Mo (910 Ko gzip). Le chargement par route a réduit le bundle principal à environ 910 Ko (277 Ko gzip), soit près de 70 % de réduction gzip. L’avatar 3D reste volontairement dans un chunk séparé d’environ 993 Ko.

Améliorations suivantes recommandées :

1. compresser le GLB avec Meshopt ou Draco et les textures avec KTX2/Basis ;
2. charger le professeur IA uniquement à l’ouverture d’une leçon ou sur intention utilisateur ;
3. isoler les bibliothèques PDF et graphiques dans des chunks fournisseurs ;
4. ajouter des budgets CI : JavaScript initial inférieur à 350 Ko gzip, GLB inférieur à 8 Mo, texture maximale 2K sur mobile ;
5. ajouter un service worker afin que la PWA fonctionne réellement hors ligne ; le manifeste seul ne suffit pas.

## État des fonctionnalités stratégiques

| Fonction | État actuel | Prochaine étape |
|---|---|---|
| Avatar IA GLB, visèmes, ARKit/Oculus | Socle technique et calibration présents ; asset en cours de remplacement | Valider le GLB final, compresser, tester iOS/Android et enregistrer les profils de morph targets |
| IA personnalisée par élève | Tables de progression, recommandations et prédictions présentes | Construire un profil pédagogique explicable et isolé par école |
| Tableau de bord IA | Tableaux existants mais incomplets | Ajouter risque d’abandon, difficultés par chapitre et délai vers le niveau suivant |
| Communauté, groupes, défis, badges | Modules et tables partiellement présents | Rendre l’école privée par défaut et soumettre toute publication globale à modération |
| Classe virtuelle | Rooms/live partiellement présents | Vérifier autorisation de l’hôte et rattachement école pour chaque événement |
| Création de contenu IA | Génération partielle | Ajouter brouillon → validation pédagogique → publication, avec quota par école |
| Prononciation avancée | Voice coach et avatar présents | Ajouter scores phonème/voyelle/consonne, rythme et intonation avec consentement audio |
| Marketplace | Non finalisée | Concevoir vendeur, licence, commission, remboursement, fiscalité et modération |
| Espace parents | Partiel | Finaliser les liens parent-enfant vérifiés et les vues devoirs/résultats |
| PWA | Manifeste présent, hors-ligne absent | Ajouter service worker, cache, synchronisation différée et notifications |

## Ordre de livraison recommandé

1. Déployer la migration et exécuter des tests RLS avec deux écoles réelles de test.
2. Vérifier les comptes existants et corriger toute adhésion sans `space_role`.
3. Tester le parcours complet : demande → approbation propriétaire → connexion → changement d’espace.
4. Livrer l’avatar IA comme fonctionnalité phare, avec un GLB optimisé et une mesure de prononciation fiable.
5. Ajouter le tableau de bord personnalisé.
6. Ouvrir communauté et marketplace uniquement après la modération et les règles de paiement.

## Critères de validation avant production

- Un admin de l’école A ne peut lire ni modifier aucune ligne de l’école B.
- Un professeur ne voit que ses classes et les élèves qu’il encadre.
- Un élève ne peut appeler aucune route professeur, parent, école ou plateforme.
- Un parent ne voit que les enfants reliés et approuvés.
- Une adhésion `pending`, `rejected` ou `suspended` n’apparaît pas dans `my_learning_spaces()`.
- Une école `pending`, `suspended` ou `archived` n’est pas accessible.
- Toutes les opérations d’approbation produisent un audit.
- Les fonctions Edge utilisant la clé service testent l’utilisateur et le tenant avant toute requête.
- La version courante des CGU et de la politique de confidentialité est acceptée.
- Les tests de build, TypeScript, routes et avatar passent en CI.
