
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homework_class_id_fkey') THEN
    ALTER TABLE public.homework ADD CONSTRAINT homework_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homework_teacher_id_fkey') THEN
    ALTER TABLE public.homework ADD CONSTRAINT homework_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homework_submissions_student_id_fkey') THEN
    ALTER TABLE public.homework_submissions ADD CONSTRAINT homework_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;
