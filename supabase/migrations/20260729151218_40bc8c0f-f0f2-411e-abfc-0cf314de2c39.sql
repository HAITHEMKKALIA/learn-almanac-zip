
DROP POLICY IF EXISTS certificates_write_admin ON storage.objects;
DROP POLICY IF EXISTS certificates_update_admin ON storage.objects;
DROP POLICY IF EXISTS certificates_delete_admin ON storage.objects;
DROP POLICY IF EXISTS certificates_read_own_or_admin ON storage.objects;

CREATE POLICY certificates_write_admin ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'certificates'
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'school_admin'::app_role)
    OR public.is_school_owner(((storage.foldername(name))[1])::uuid, auth.uid())
    OR public.has_school_role(((storage.foldername(name))[1])::uuid, auth.uid(), ARRAY['admin','school_admin','academic_director','teacher','examiner']::app_role[])
  )
);

CREATE POLICY certificates_update_admin ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'certificates'
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'school_admin'::app_role)
    OR public.is_school_owner(((storage.foldername(name))[1])::uuid, auth.uid())
    OR public.has_school_role(((storage.foldername(name))[1])::uuid, auth.uid(), ARRAY['admin','school_admin','academic_director','teacher','examiner']::app_role[])
  )
);

CREATE POLICY certificates_delete_admin ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'certificates'
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'school_admin'::app_role)
    OR public.is_school_owner(((storage.foldername(name))[1])::uuid, auth.uid())
    OR public.has_school_role(((storage.foldername(name))[1])::uuid, auth.uid(), ARRAY['admin','school_admin']::app_role[])
  )
);

CREATE POLICY certificates_read_own_or_admin ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'certificates'
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'school_admin'::app_role)
    OR public.is_school_owner(((storage.foldername(name))[1])::uuid, auth.uid())
    OR public.has_school_role(((storage.foldername(name))[1])::uuid, auth.uid(), ARRAY['admin','school_admin','academic_director','teacher','examiner']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.certificates c
      WHERE c.pdf_url = objects.name AND c.student_id = auth.uid()
    )
  )
);
