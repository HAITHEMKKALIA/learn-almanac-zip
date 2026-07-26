# Campagne QA — Workflow Devoirs IA

Pré-requis : 1 compte prof, 1 classe avec ≥ 2 élèves, 1 devoir contenant 1 QCM + 1 question ouverte.

## Scénarios

### S1 — Happy path
1. Élève A et B passent le devoir et soumettent.
2. Prof ouvre `Assignment Review` → bouton « Re-tenter tout » lance `ai-grade`.
3. Vérifier : chaque question passe `pending → ai_running → ai_graded` ; `awarded_points` rempli ; `grading_events` contient `ai_attempt_start` puis `ai_attempt_success`.
4. Bouton « Publier » devient actif → cliquer → `submissions.released_at` non null, event `released` logué.
5. Élève A ouvre ses résultats → voit score, commentaire, explication IA.

### S2 — Re-tenter une seule question
1. Sur S1 publié, prof clique « Re-tenter » sur Q2 d'un élève.
2. Q2 passe `ai_running` ; champs Q2 désactivés ; bouton « Publier » désactivé tant que Q2 ≠ ready.
3. Q1 reste intacte ; `grading_events` ajoute un nouveau `ai_attempt_*` pour Q2.

### S3 — Édition manuelle
1. Sur Q1, prof modifie score + commentaire → « Sauver ».
2. `grading_status = manual_graded`, `ai_graded = false`, badge violet.
3. `grading_events` contient `manual_save` avec `actor_id`.

### S4 — Échec IA
1. Couper temporairement `LOVABLE_API_KEY` (ou mocker erreur réseau) → re-tenter.
2. Question passe `ai_failed`, message d'erreur visible, `grading_events.kind = ai_attempt_failure`.
3. Publication bloquée, tooltip liste la question fautive.
4. Prof édite manuellement → `manual_graded` → publication débloquée.

### S5 — Protection édition pendant ai_running
1. Lancer re-correction puis tenter de modifier le score AVANT que le statut soit `ai_graded`.
2. Champs grisés, bandeau « Correction en cours » visible, sauvegarde impossible.

### S6 — Isolation élève (gate released_at)
1. Avant publication : élève ouvre `StudentExamResult` → message « Résultats pas encore publiés », pas de score visible, pas d'accès aux énoncés via réseau.
2. Après publication : tout est visible.

### S7 — Isolation prof (RLS)
1. Prof B (autre classe) tente d'accéder à `/teacher/assignment/<id>` du prof A → 403 / liste vide.
2. Tester en SQL : `SELECT * FROM submissions` côté prof B ne retourne rien.

### S8 — Historique audit
1. Sur une question, ouvrir le panneau « Historique ».
2. Vérifier : ordre chronologique, auteur (prof / IA / système) affiché, timestamps en local.
3. Confirmer présence des 4 événements clés : `ai_attempt_start`, `ai_attempt_success` ou `_failure`, `manual_save`, `released`.

### S9 — Réactivité statuts
1. Lancer re-correction longue (texte volumineux).
2. Pendant le `ai_running`, vérifier que la sidebar élèves et le détail question affichent le même chip et que la cohérence de couleur/icône respecte `STATUS_META`.

### S10 — Idempotence publication
1. Cliquer « Publier » deux fois.
2. `released_at` n'est pas écrasé (pas de double event `released`), bouton devient « Publié ✓ ».

## Vérifications transverses

- [ ] Aucune erreur 403 sur `has_role`, `is_class_member`, `is_class_teacher`, `is_teacher_or_admin`, `student_can_access_questions` (cf. migration GRANT EXECUTE).
- [ ] `grading_events` insert RLS : `actor_id = auth.uid()` requis côté prof.
- [ ] Pas de `console.error` dans la session (`code--read_console_logs`).
- [ ] Network : pas de 5xx sur `/functions/v1/ai-grade`.
- [ ] Mobile (375px) : éditeur question scrollable, sidebar collapsable.

## Commandes utiles

```bash
# Logs edge function
supabase--edge_function_logs ai-grade

# Test direct
supabase--curl_edge_functions POST /ai-grade body='{"submission_id":"…","question_id":"…"}'

# Vérifier statut côté DB
supabase--read_query "SELECT question_id, grading_status, awarded_points FROM submission_answers WHERE submission_id='…';"
```
