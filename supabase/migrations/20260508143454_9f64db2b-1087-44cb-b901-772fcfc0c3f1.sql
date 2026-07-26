
-- Wortschatz themes
CREATE TABLE public.vocab_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name_de text NOT NULL,
  name_fr text NOT NULL,
  level text NOT NULL CHECK (level IN ('A1','A2','B1','B2')),
  icon text,
  color text DEFAULT '#0ea5e9',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level, slug)
);

-- Vocabulary entries
CREATE TABLE public.vocab_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  article text CHECK (article IN ('der','die','das')),
  plural text,
  ipa text,
  pos text,
  level text NOT NULL CHECK (level IN ('A1','A2','B1','B2')),
  chapter int,
  theme_slug text,
  translation_fr text,
  translation_ar text,
  example_de text,
  example_fr text,
  frequency int DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level, word, article)
);
CREATE INDEX idx_vocab_level_theme ON public.vocab_entries(level, theme_slug);
CREATE INDEX idx_vocab_word ON public.vocab_entries(word);

-- Per-user SRS progress
CREATE TABLE public.vocab_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vocab_id uuid NOT NULL REFERENCES public.vocab_entries(id) ON DELETE CASCADE,
  box int NOT NULL DEFAULT 1,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  correct_count int NOT NULL DEFAULT 0,
  wrong_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, vocab_id)
);
CREATE INDEX idx_vocab_progress_user ON public.vocab_progress(user_id, next_review_at);

ALTER TABLE public.vocab_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_progress ENABLE ROW LEVEL SECURITY;

-- Themes & entries: public read for authenticated, write for teachers/admins
CREATE POLICY "vocab_themes read" ON public.vocab_themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "vocab_themes write" ON public.vocab_themes FOR ALL TO authenticated
  USING (public.is_teacher_or_admin(auth.uid()))
  WITH CHECK (public.is_teacher_or_admin(auth.uid()));

CREATE POLICY "vocab_entries read" ON public.vocab_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "vocab_entries write" ON public.vocab_entries FOR ALL TO authenticated
  USING (public.is_teacher_or_admin(auth.uid()))
  WITH CHECK (public.is_teacher_or_admin(auth.uid()));

-- Progress: user owns row
CREATE POLICY "vocab_progress own" ON public.vocab_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER trg_vocab_progress_updated
  BEFORE UPDATE ON public.vocab_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Netzwerk-style themes for A1/A2/B1/B2
INSERT INTO public.vocab_themes (slug,name_de,name_fr,level,icon,color,position) VALUES
-- A1
('kleidung','Kleidung','Vêtements','A1','👕','#ef4444',1),
('farben','Farben','Couleurs','A1','🎨','#f59e0b',2),
('moebel','Möbel & Geräte','Meubles & Appareils','A1','🛋️','#a855f7',3),
('zimmer','Zimmer','Pièces de la maison','A1','🏠','#10b981',4),
('koerperteile','Körperteile','Parties du corps','A1','🦴','#ec4899',5),
('wetter','Wetter','Météo','A1','☀️','#0ea5e9',6),
('berufe','Berufe','Métiers','A1','💼','#6366f1',7),
('medien','Medien','Médias','A1','💻','#14b8a6',8),
('adjektive','Adjektive','Adjectifs','A1','✨','#f97316',9),
('essen','Essen & Trinken','Manger & Boire','A1','🍽️','#84cc16',10),
('familie','Familie','Famille','A1','👨‍👩‍👧','#e11d48',11),
('zahlen_zeit','Zahlen & Zeit','Nombres & Heure','A1','🕐','#06b6d4',12),
-- A2
('reisen','Reisen','Voyages','A2','✈️','#0ea5e9',1),
('stadt','Stadt & Verkehr','Ville & Transport','A2','🚌','#6366f1',2),
('gesundheit','Gesundheit','Santé','A2','🏥','#ef4444',3),
('arbeit','Arbeit','Travail','A2','💼','#a855f7',4),
('feste','Feste & Traditionen','Fêtes & Traditions','A2','🎉','#f59e0b',5),
('gefuehle','Gefühle','Sentiments','A2','💖','#ec4899',6),
('umwelt_a2','Umwelt','Environnement','A2','🌳','#10b981',7),
('einkaufen','Einkaufen','Shopping','A2','🛒','#14b8a6',8),
-- B1
('beziehungen','Beziehungen','Relations','B1','💞','#ec4899',1),
('beruf_b1','Beruf & Karriere','Métier & Carrière','B1','📈','#6366f1',2),
('konsum','Konsum','Consommation','B1','💳','#a855f7',3),
('politik_b1','Politik & Gesellschaft','Politique & Société','B1','🏛️','#0ea5e9',4),
('kultur_b1','Kultur','Culture','B1','🎭','#f59e0b',5),
('digital_b1','Digitale Welt','Monde numérique','B1','📱','#14b8a6',6),
-- B2
('wirtschaft','Wirtschaft','Économie','B2','📊','#6366f1',1),
('wissenschaft','Wissenschaft','Science','B2','🔬','#0ea5e9',2),
('ethik','Ethik','Éthique','B2','⚖️','#a855f7',3),
('umwelt_b2','Umwelt & Klima','Environnement & Climat','B2','🌍','#10b981',4),
('identitaet','Identität','Identité','B2','🪞','#ec4899',5),
('kunst_b2','Kunst & Literatur','Art & Littérature','B2','🎨','#f59e0b',6);
