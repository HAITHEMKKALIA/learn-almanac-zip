
CREATE TABLE public.kapitel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  number integer NOT NULL,
  slug text NOT NULL,
  title_de text NOT NULL,
  title_fr text,
  subtitle text,
  objectives jsonb DEFAULT '[]'::jsonb,
  vocab_themes text[] DEFAULT '{}',
  icon text,
  color text DEFAULT '#0ea5e9',
  cover_url text,
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(level, number),
  UNIQUE(level, slug)
);

CREATE TABLE public.kapitel_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kapitel_id uuid NOT NULL REFERENCES public.kapitel(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_minutes integer DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kapitel_sections_kapitel ON public.kapitel_sections(kapitel_id, position);

CREATE TABLE public.kapitel_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section_id uuid NOT NULL REFERENCES public.kapitel_sections(id) ON DELETE CASCADE,
  kapitel_id uuid NOT NULL REFERENCES public.kapitel(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  score integer,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)
);

CREATE INDEX idx_kapitel_progress_user ON public.kapitel_progress(user_id, kapitel_id);

ALTER TABLE public.kapitel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kapitel_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kapitel_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kapitel read" ON public.kapitel FOR SELECT TO authenticated USING (true);
CREATE POLICY "kapitel write" ON public.kapitel FOR ALL TO authenticated USING (is_teacher_or_admin(auth.uid())) WITH CHECK (is_teacher_or_admin(auth.uid()));

CREATE POLICY "kapitel_sections read" ON public.kapitel_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "kapitel_sections write" ON public.kapitel_sections FOR ALL TO authenticated USING (is_teacher_or_admin(auth.uid())) WITH CHECK (is_teacher_or_admin(auth.uid()));

CREATE POLICY "kapitel_progress own" ON public.kapitel_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_kapitel_updated BEFORE UPDATE ON public.kapitel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_kapitel_sections_updated BEFORE UPDATE ON public.kapitel_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_kapitel_progress_updated BEFORE UPDATE ON public.kapitel_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: 12 Kapitel A1, 12 A2, 10 B1, 10 B2 (titres inspirés du programme CECRL/Netzwerk)
INSERT INTO public.kapitel (level, number, slug, title_de, title_fr, subtitle, objectives, vocab_themes, icon, color, position) VALUES
-- A1
('A1', 1, 'guten-tag', 'Guten Tag!', 'Bonjour !', 'Sich begrüßen und vorstellen', '["Begrüßungen","sich vorstellen","Länder & Sprachen"]'::jsonb, ARRAY['begruessungen','laender'], '👋', '#10b981', 1),
('A1', 2, 'freunde-kollegen', 'Freunde, Kollegen und ich', 'Amis, collègues et moi', 'Personen beschreiben', '["Familie","Berufe","Personen beschreiben"]'::jsonb, ARRAY['familie','berufe'], '👥', '#22c55e', 2),
('A1', 3, 'in-der-stadt', 'In der Stadt', 'En ville', 'Orte und Wegbeschreibungen', '["Stadt","Orte","Wegbeschreibung"]'::jsonb, ARRAY['stadt','wegbeschreibung'], '🏙️', '#06b6d4', 3),
('A1', 4, 'guten-appetit', 'Guten Appetit!', 'Bon appétit !', 'Essen & Trinken', '["Lebensmittel","Mahlzeiten","Restaurant"]'::jsonb, ARRAY['lebensmittel','restaurant'], '🍽️', '#f59e0b', 4),
('A1', 5, 'tag-fuer-tag', 'Tag für Tag', 'Au jour le jour', 'Tagesablauf & Uhrzeit', '["Uhrzeit","Tagesablauf","Wochentage"]'::jsonb, ARRAY['uhrzeit','tagesablauf'], '⏰', '#8b5cf6', 5),
('A1', 6, 'zeit-mit-freunden', 'Zeit mit Freunden', 'Du temps avec les amis', 'Hobbys & Verabredungen', '["Hobbys","Freizeit","Verabredung"]'::jsonb, ARRAY['hobbys','freizeit'], '🎮', '#ec4899', 6),
('A1', 7, 'kaufen-und-schenken', 'Kaufen und schenken', 'Acheter et offrir', 'Einkaufen & Geschenke', '["Kleidung","Farben","Geschenke","Geld"]'::jsonb, ARRAY['kleidung','farben'], '🛍️', '#ef4444', 7),
('A1', 8, 'im-alltag', 'Im Alltag', 'Au quotidien', 'Wohnen & Möbel', '["Wohnung","Möbel","Geräte","Zimmer"]'::jsonb, ARRAY['moebel','zimmer'], '🛋️', '#3b82f6', 8),
('A1', 9, 'was-ist-passiert', 'Was ist passiert?', 'Que s''est-il passé ?', 'Perfekt & Vergangenheit', '["Erlebnisse","Reisen","Wochenende"]'::jsonb, ARRAY['reisen'], '📅', '#0ea5e9', 9),
('A1', 10, 'wir-feiern', 'Wir feiern!', 'On fête !', 'Feste & Einladungen', '["Feste","Einladungen","Glückwünsche"]'::jsonb, ARRAY['feste'], '🎉', '#f43f5e', 10),
('A1', 11, 'mit-dem-koerper', 'Mit dem Körper', 'Avec le corps', 'Körper & Gesundheit', '["Körperteile","Gesundheit","Medikamente"]'::jsonb, ARRAY['koerper','medikamente'], '💪', '#14b8a6', 11),
('A1', 12, 'wetter-und-jahreszeiten', 'Wetter und Jahreszeiten', 'Météo et saisons', 'Wetter & Reisen', '["Wetter","Jahreszeiten","Reisen"]'::jsonb, ARRAY['wetter'], '☀️', '#eab308', 12),
-- A2
('A2', 1, 'menschen', 'Menschen', 'Les gens', 'Beziehungen & Charakter', '["Charakter","Gefühle","Beziehungen"]'::jsonb, ARRAY['charakter','gefuehle'], '🧑‍🤝‍🧑', '#10b981', 1),
('A2', 2, 'wohnen', 'Wohnen', 'Habiter', 'Wohnung & Stadtviertel', '["Wohnen","Nachbarschaft","Hausordnung"]'::jsonb, ARRAY['wohnen'], '🏠', '#22c55e', 2),
('A2', 3, 'essen-und-trinken', 'Essen und Trinken', 'Manger et boire', 'Rezepte & Restaurant', '["Rezepte","Lebensmittel","Restaurant"]'::jsonb, ARRAY['lebensmittel'], '🍳', '#f59e0b', 3),
('A2', 4, 'arbeit-und-beruf', 'Arbeit und Beruf', 'Travail et métier', 'Berufe & Bewerbung', '["Berufe","Arbeitsplatz","Bewerbung"]'::jsonb, ARRAY['berufe','arbeit'], '💼', '#0ea5e9', 4),
('A2', 5, 'sport-und-fitness', 'Sport und Fitness', 'Sport et forme', 'Sportarten & Gesundheit', '["Sport","Fitness","Gesundheit"]'::jsonb, ARRAY['sport'], '🏃', '#ef4444', 5),
('A2', 6, 'ausbildung-schule', 'Ausbildung & Schule', 'Formation & école', 'Schule & Ausbildung', '["Schule","Ausbildung","Studium"]'::jsonb, ARRAY['schule'], '🎓', '#8b5cf6', 6),
('A2', 7, 'feste-und-traditionen', 'Feste und Traditionen', 'Fêtes et traditions', 'Feiertage & Bräuche', '["Feste","Traditionen","Bräuche"]'::jsonb, ARRAY['feste'], '🎊', '#ec4899', 7),
('A2', 8, 'medien', 'Medien', 'Médias', 'Internet & Geräte', '["Medien","Internet","Geräte"]'::jsonb, ARRAY['medien'], '📱', '#06b6d4', 8),
('A2', 9, 'reisen-und-verkehr', 'Reisen und Verkehr', 'Voyages et transports', 'Reise & Verkehrsmittel', '["Reisen","Verkehr","Hotel"]'::jsonb, ARRAY['reisen','verkehr'], '✈️', '#3b82f6', 9),
('A2', 10, 'natur-und-umwelt', 'Natur und Umwelt', 'Nature et environnement', 'Umwelt & Tiere', '["Natur","Tiere","Umwelt"]'::jsonb, ARRAY['natur'], '🌳', '#22c55e', 10),
('A2', 11, 'gesundheit', 'Gesundheit', 'Santé', 'Beim Arzt & Apotheke', '["Gesundheit","Krankheit","Arzt"]'::jsonb, ARRAY['gesundheit'], '🩺', '#14b8a6', 11),
('A2', 12, 'zukunftsplaene', 'Zukunftspläne', 'Projets d''avenir', 'Pläne & Wünsche', '["Zukunft","Pläne","Wünsche"]'::jsonb, ARRAY['zukunft'], '🚀', '#f43f5e', 12),
-- B1
('B1', 1, 'identitaet', 'Identität', 'Identité', 'Persönlichkeit & Lebenslauf', '["Identität","Persönlichkeit","Biografie"]'::jsonb, ARRAY['persoenlichkeit'], '🪪', '#10b981', 1),
('B1', 2, 'arbeitswelt', 'Arbeitswelt', 'Monde du travail', 'Beruf & Karriere', '["Karriere","Bewerbung","Arbeitsmarkt"]'::jsonb, ARRAY['arbeit'], '🏢', '#0ea5e9', 2),
('B1', 3, 'medien-digital', 'Medien & Digitales', 'Médias & numérique', 'Soziale Medien & Datenschutz', '["Internet","soziale Medien","Datenschutz"]'::jsonb, ARRAY['medien'], '💻', '#06b6d4', 3),
('B1', 4, 'gesellschaft', 'Gesellschaft', 'Société', 'Politik & Engagement', '["Gesellschaft","Politik","Ehrenamt"]'::jsonb, ARRAY['gesellschaft'], '🏛️', '#8b5cf6', 4),
('B1', 5, 'kultur-kunst', 'Kultur & Kunst', 'Culture & art', 'Literatur, Musik, Kino', '["Kunst","Literatur","Musik","Film"]'::jsonb, ARRAY['kultur'], '🎭', '#ec4899', 5),
('B1', 6, 'globale-themen', 'Globale Themen', 'Thèmes mondiaux', 'Migration & Globalisierung', '["Migration","Globalisierung","Sprachen"]'::jsonb, ARRAY['globalisierung'], '🌍', '#3b82f6', 6),
('B1', 7, 'umwelt-nachhaltigkeit', 'Umwelt & Nachhaltigkeit', 'Environnement & durabilité', 'Klima & Konsum', '["Umwelt","Klima","Nachhaltigkeit"]'::jsonb, ARRAY['umwelt'], '♻️', '#22c55e', 7),
('B1', 8, 'wissenschaft-technik', 'Wissenschaft & Technik', 'Sciences & technique', 'Forschung & Innovation', '["Wissenschaft","Technik","Forschung"]'::jsonb, ARRAY['wissenschaft'], '🔬', '#14b8a6', 8),
('B1', 9, 'gesundheit-wohlbefinden', 'Gesundheit & Wohlbefinden', 'Santé & bien-être', 'Ernährung, Stress, Sport', '["Ernährung","Stress","Wellness"]'::jsonb, ARRAY['gesundheit'], '🧘', '#f59e0b', 9),
('B1', 10, 'zukunft-traeume', 'Zukunft & Träume', 'Avenir & rêves', 'Visionen & Lebensentwürfe', '["Zukunft","Träume","Visionen"]'::jsonb, ARRAY['zukunft'], '🌠', '#f43f5e', 10),
-- B2
('B2', 1, 'sprache-und-identitaet', 'Sprache und Identität', 'Langue et identité', 'Mehrsprachigkeit', '["Sprache","Identität","Mehrsprachigkeit"]'::jsonb, ARRAY['sprache'], '🗣️', '#10b981', 1),
('B2', 2, 'arbeitsmarkt', 'Arbeitsmarkt', 'Marché du travail', 'Karriere & New Work', '["Arbeitsmarkt","Karriere","New Work"]'::jsonb, ARRAY['arbeit'], '📈', '#0ea5e9', 2),
('B2', 3, 'medien-und-meinung', 'Medien und Meinung', 'Médias et opinion', 'Journalismus & Fake News', '["Medien","Journalismus","Meinung"]'::jsonb, ARRAY['medien'], '📰', '#06b6d4', 3),
('B2', 4, 'wirtschaft-konsum', 'Wirtschaft & Konsum', 'Économie & consommation', 'Markt & Verbraucher', '["Wirtschaft","Konsum","Markt"]'::jsonb, ARRAY['wirtschaft'], '💶', '#8b5cf6', 4),
('B2', 5, 'kultur-gesellschaft', 'Kultur & Gesellschaft', 'Culture & société', 'Werte & Wandel', '["Kultur","Werte","Wandel"]'::jsonb, ARRAY['kultur'], '🎨', '#ec4899', 5),
('B2', 6, 'globalisierung', 'Globalisierung', 'Mondialisation', 'Welt & Verantwortung', '["Globalisierung","Verantwortung","Politik"]'::jsonb, ARRAY['gesellschaft'], '🌐', '#3b82f6', 6),
('B2', 7, 'umwelt-klima', 'Umwelt & Klima', 'Environnement & climat', 'Klimakrise & Lösungen', '["Klima","Energie","Nachhaltigkeit"]'::jsonb, ARRAY['umwelt'], '🌱', '#22c55e', 7),
('B2', 8, 'forschung-ethik', 'Forschung & Ethik', 'Recherche & éthique', 'KI, Bioethik, Innovation', '["Forschung","Ethik","KI"]'::jsonb, ARRAY['wissenschaft'], '🧬', '#14b8a6', 8),
('B2', 9, 'gesundheit-system', 'Gesundheit & System', 'Santé & système', 'Medizin & Pflege', '["Gesundheit","Medizin","Pflege"]'::jsonb, ARRAY['gesundheit'], '🏥', '#f59e0b', 9),
('B2', 10, 'zukunft-und-utopien', 'Zukunft und Utopien', 'Avenir et utopies', 'Visionen für morgen', '["Zukunft","Utopie","Vision"]'::jsonb, ARRAY['zukunft'], '🛸', '#f43f5e', 10);
