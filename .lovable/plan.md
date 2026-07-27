# Refonte du module « Devoirs à la maison »

Objectif : le professeur peut créer un devoir de 4 façons, l'élève répond selon le type, puis reçoit une correction (manuelle ou IA) avec bon/mauvais par question. Le tout avec notifications push (bip + interne + externe).

## 1. Types de devoirs supportés

| Type | Prof crée | Élève rend |
|---|---|---|
| `pdf` | Upload d'un PDF (+ catégorie/niveau) | Télécharge, remplit, ré-upload PDF/image | 
| `manual` | Jusqu'à 50 questions {titre, réponse attendue} | Répond à chaque question dans un champ texte |
| `ai` | Génère N questions via IA (choix du type : Schreiben, Grammatik, Lesen…) | Idem `manual` |
| `audio` | Upload MP3/WAV + questions manuelles | Écoute + répond par question |

## 2. Changements base de données

Nouvelles colonnes sur `homework` :
- `kind` text ('pdf' | 'manual' | 'ai' | 'audio'), défaut 'manual'
- `audio_url` text
- `pdf_url` text (le PDF de consigne)

Nouvelle table `homework_questions` :
- `homework_id`, `position` (1..50), `prompt` text, `expected_answer` text, `points` int
- RLS : lecture pour élèves de la classe + prof du devoir ; écriture prof/admin

Nouvelle table `homework_question_answers` :
- `submission_id`, `question_id`, `answer` text, `is_correct` boolean, `teacher_comment` text, `awarded_points` numeric
- RLS : élève lit/écrit ses réponses (sans toucher `is_correct`/`awarded_points`), prof corrige

Trigger anti-triche : l'élève ne peut pas modifier `is_correct` / `awarded_points` / `teacher_comment`.

## 3. Interface Professeur (`TeacherHomework.tsx`)

Dialogue de création enrichi :
- Sélecteur **Type de devoir** (PDF / Manuel / IA / Audio)
- Sélecteur **Catégorie pédagogique** (Schreiben, Grammatik, Lesen, Hören, Sprechen, Wortschatz)
- Selon type : uploader PDF, uploader audio, ou builder de questions (Ajouter question ↑↓ supprimer, max 50)
- Bouton **Générer avec IA** (déjà présent) → remplit automatiquement les questions selon la catégorie choisie
- Vue **corrections** : pour chaque soumission, liste question par question avec cases ✅/❌, note et commentaire ; bouton **Corriger avec IA** → propose réponses annotées ; bouton **Appliquer correction & terminer** → notifie l'élève

## 4. Interface Élève (`StudentHomework.tsx`)

Section **« Mes devoirs à la maison »** avec badges de statut :
- 🔴 À faire · 🟠 En attente de correction · 🟢 Corrigé
- Selon `kind` : télécharger PDF + ré-upload / répondre par question / lecteur audio + questions
- Bouton **Terminer** → statut `submitted`, notifie le prof
- Après correction : affiche pour chaque question ✅/❌, réponse attendue, commentaire prof, note globale

## 5. Notifications push

- Bip sonore court (WebAudio oscillator) + toast persistant
- Nouvelle table `notifications` (`user_id`, `type`, `title`, `body`, `link`, `read_at`)
- Cloche dans la sidebar (badge non-lus, popover liste, temps réel Supabase)
- Web Push externe via `Notification` API (avec `requestPermission()` au premier login)
- Événements déclencheurs :
  - Prof crée un devoir → tous les élèves de la classe
  - Élève soumet → le prof
  - Prof termine correction → l'élève

## 6. Détails techniques

- Stockage : bucket `homework-files` (privé) créé via tool, signed URLs
- Génération IA : réutilise `ai-pedagogy` avec `mode: "homework_questions"` → retourne `questions[]`
- Correction IA : nouvelle branche dans `ai-grade` (`kind: "homework_questions"`) qui prend `submission_id` et note question par question
- Realtime : subscribe sur `notifications` filtré `user_id=eq.<uid>`
- i18n : FR / DE / AR sur toutes les nouvelles chaînes
- RLS et GRANTs stricts pour toutes les nouvelles tables

## 7. Ordre d'exécution

1. Migration SQL (colonnes + 3 tables + policies + triggers) + bucket storage
2. Edge functions : extension `ai-pedagogy` (questions) + `ai-grade` (par question)
3. `TeacherHomework.tsx` : builder de questions, uploads, dialogue de correction
4. `StudentHomework.tsx` : rendu par type, réponses par question, vue corrigée
5. Système de notifications (table + cloche + bip + Web Push)
6. Câblage des triggers de notifications côté client aux 3 événements clés
