# Plan — Architecture Learning Space (3 modes)

Objectif : faire évoluer l'app vers 3 modes (École / Professeur indépendant / Élève indépendant) sans casser ce qui existe. La table `schools` devient le porteur du concept "learning space" via `tenant_type`. Aucune route ni table n'est supprimée. Toute la donnée reste isolée par `school_id`.

## Approche en 4 phases livrables

Je propose de livrer **par phases** plutôt qu'en un seul gros patch, parce que :
- chaque phase est testable séparément
- on évite de bloquer toute l'app sur une seule migration géante
- on peut valider l'UX au fur et à mesure

Tu valides ce plan d'ensemble, puis on enchaîne phase par phase.

---

## PHASE 1 — Fondations DB + onboarding (cette première itération)

### Migration SQL (additive, zéro casse)

1. `schools` : ajout colonnes
   - `tenant_type` enum (`school` | `independent_teacher` | `independent_student` | `platform`), default `school`
   - `is_independent` boolean default false
   - backfill : toutes les écoles existantes → `tenant_type='school'`

2. Nouvelles tables :
   - `teacher_studio_settings` (studio_name, public_profile_enabled, allow_student_self_join, require_teacher_approval, default_level, max_students_per_class, …)
   - `solo_student_settings` (current_level, target_level, weekly_goal_minutes, ai_tutor_enabled, …)

3. Nouveaux helpers SQL (security definer) :
   - `is_independent_teacher_owner(uid, school_id)`
   - `is_independent_student_owner(uid, school_id)`
   - `can_access_learning_space(uid, school_id)`
   - `can_manage_learning_space(uid, school_id)`

4. Nouvelles RPC :
   - `create_independent_teacher_space(studio_name)` → crée `schools` (tenant_type=independent_teacher) + `school_members` owner + `teacher_studio_settings`, renvoie school_id
   - `create_independent_student_space(current_level)` → idem pour élève solo
   - `my_learning_spaces()` → étend `my_schools` avec `tenant_type`

5. RLS : ajustements **additifs** sur tables sensibles (classes, assignments, certificates, ai_quotas, calendar_events, direct_messages) pour autoriser owner d'espace indépendant à gérer SES propres données via `is_independent_teacher_owner` / `is_independent_student_owner`. Les policies existantes restent en place.

6. `certificates` : ajout `certificate_kind` (`official_school` | `teacher_private` | `self_progress`) + `issuer_type`. Defaults compatibles → existants restent valides.

### Frontend Phase 1

- **`/onboarding`** : page après inscription avec 5 choix (école, prof indé, élève indé, code de classe, parent). Appelle la RPC correspondante puis redirige.
- **`AppHome.tsx`** : étend la logique de redirection — si owner d'un `independent_teacher` → `/teacher-studio`, si owner d'un `independent_student` → `/student` (mode solo détecté).
- **`ActiveSchoolContext`** : on ajoute `activeSpaceType` (dérivé de `tenant_type`) et l'alias `useActiveLearningSpace()`. `useActiveSchool()` reste 100 % compatible.
- **`/choose-space`** : page de sélection si l'utilisateur a plusieurs espaces (école + studio + perso, etc.).

---

## PHASE 2 — Interface Teacher Studio

- Routes `/teacher-studio`, `/teacher-studio/classes`, `/students`, `/homework`, `/exams`, `/certificates`, `/reports`, `/settings`.
- Layout `TeacherStudioLayout` avec son propre thème (variante du theme `teacher` déjà existant, accent "studio").
- Réutilise au max les composants existants (Assignments, ClassDetail, etc.) en les paramétrant sur l'`activeSpaceId`.
- `SchoolSwitcher` étendu pour afficher les studios indépendants à côté des écoles.

## PHASE 3 — Mode Solo Student

- Détection mode solo dans `/student` (si `activeSpaceType === 'independent_student'`) → menu simplifié + tableau de bord motivant + parcours A1→B2.
- Route alias `/solo-student` pour clarté.
- Examens blancs, attestations personnelles (`certificate_kind='self_progress'`).

## PHASE 4 — Quotas, certificats, messagerie, polish

- Quotas IA par `quota_type` (school / teacher_studio / solo_student).
- 3 templates de certificats selon `certificate_kind` avec mention claire.
- RLS messagerie : isolation par espace.
- Tests d'isolation (super admin voit tout, école ne voit pas studios, etc.).

---

## Détails techniques importants

- **`school_id` n'est pas renommé.** C'est désormais sémantiquement un `learning_space_id` mais le nom reste pour ne pas casser les ~50 tables et le code existant. Helpers et noms d'API utilisent "learning space".
- **Rétro-compatibilité** : `useActiveSchool`, `my_schools`, `is_school_owner`, `school_members` restent tels quels. Tout ce qui est nouveau s'ajoute à côté.
- **Super Admin `haithem.kalia@gmail.com`** : inchangé, conserve accès global via `is_super_admin`.
- **Aucune route existante supprimée.** Aucune table supprimée. Aucune policy retirée — uniquement ajoutées ou élargies.

---

## Ce que je fais juste après ton "go"

Je commence **Phase 1 uniquement** :
1. Migration SQL (tenant_type, 2 tables settings, helpers, RPC, policies additives, certificate_kind).
2. Page `/onboarding` + redirection depuis `AppHome`.
3. Extension `ActiveSchoolContext` avec `activeSpaceType` + `useActiveLearningSpace`.
4. Page `/choose-space` minimale.

Puis on valide ensemble avant Phase 2.

Confirme-tu ce plan (et veux-tu démarrer Phase 1 maintenant) ?
