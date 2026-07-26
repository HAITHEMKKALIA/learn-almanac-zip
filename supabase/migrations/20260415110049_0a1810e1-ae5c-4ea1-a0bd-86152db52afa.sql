
-- User progress tracking
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  vocab_mastered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read progress" ON public.user_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can insert progress" ON public.user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update progress" ON public.user_progress FOR UPDATE USING (true);

CREATE INDEX idx_progress_session ON public.user_progress(session_id);
CREATE UNIQUE INDEX idx_progress_unique ON public.user_progress(session_id, unit_id, lesson_id);

-- Chat history
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  scenario_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat" ON public.chat_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat" ON public.chat_history FOR INSERT WITH CHECK (true);

CREATE INDEX idx_chat_session ON public.chat_history(session_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
