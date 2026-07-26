
-- announcements: drop redundant INSERT policy
DROP POLICY IF EXISTS "Teachers and admins create announcements" ON public.announcements;

-- assignments: split ALL into SELECT/UPDATE/DELETE (INSERT handled by approval policy)
DROP POLICY IF EXISTS "Teacher manage own assignments" ON public.assignments;
CREATE POLICY "Teacher select own assignments" ON public.assignments FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teacher update own assignments" ON public.assignments FOR UPDATE USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teacher delete own assignments" ON public.assignments FOR DELETE USING (auth.uid() = teacher_id);

-- direct_messages: drop redundant INSERT policy
DROP POLICY IF EXISTS "Sender can send" ON public.direct_messages;

-- homework: split ALL into SELECT/UPDATE/DELETE
DROP POLICY IF EXISTS "Teacher manage own homework" ON public.homework;
CREATE POLICY "Teacher select own homework" ON public.homework FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teacher update own homework" ON public.homework FOR UPDATE USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teacher delete own homework" ON public.homework FOR DELETE USING (auth.uid() = teacher_id);

-- homework_submissions: split ALL into SELECT/UPDATE/DELETE
DROP POLICY IF EXISTS "Student manage own submission" ON public.homework_submissions;
CREATE POLICY "Student select own submission" ON public.homework_submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Student update own submission" ON public.homework_submissions FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Student delete own submission" ON public.homework_submissions FOR DELETE USING (auth.uid() = student_id);

-- submissions: drop redundant INSERT policy
DROP POLICY IF EXISTS "Student create submission" ON public.submissions;
