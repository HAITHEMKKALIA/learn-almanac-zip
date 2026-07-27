
-- Helper: can a user manage a class (teacher of class, school owner, school teacher, super admin)
CREATE OR REPLACE FUNCTION public.can_manage_class(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = _class_id
        AND (
          c.teacher_id = _user_id
          OR public.is_school_owner(c.school_id, _user_id)
          OR public.is_school_teacher(c.school_id, _user_id)
        )
    )
$$;

-- Rewrite classes SELECT policy: use SECURITY DEFINER helpers instead of raw subqueries
DROP POLICY IF EXISTS classes_select_isolated ON public.classes;
CREATE POLICY classes_select_isolated ON public.classes
FOR SELECT
USING (
  public.is_super_admin((SELECT auth.uid()))
  OR (
    public.is_school_member(school_id, (SELECT auth.uid()))
    AND (
      public.is_school_teacher(school_id, (SELECT auth.uid()))
      OR teacher_id = (SELECT auth.uid())
      OR public.is_class_teacher_any(id, (SELECT auth.uid()))
      OR public.is_class_member(id, (SELECT auth.uid()))
    )
  )
);

-- Rewrite class_members SELECT policy: no direct query on classes
DROP POLICY IF EXISTS class_members_select_isolated ON public.class_members;
CREATE POLICY class_members_select_isolated ON public.class_members
FOR SELECT
USING (
  student_id = (SELECT auth.uid())
  OR public.can_manage_class(class_id, (SELECT auth.uid()))
);

-- Rewrite class_members DELETE policy similarly
DROP POLICY IF EXISTS class_members_delete_isolated ON public.class_members;
CREATE POLICY class_members_delete_isolated ON public.class_members
FOR DELETE
USING (
  student_id = (SELECT auth.uid())
  OR public.can_manage_class(class_id, (SELECT auth.uid()))
);
