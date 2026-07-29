
-- Storage policies for certificates bucket: school admins & issuer manage; students read their own
CREATE POLICY "certificates_read_own_or_admin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.certificates c
      WHERE c.pdf_url LIKE '%' || storage.objects.name
        AND (c.student_id = auth.uid()
             OR public.is_school_owner(c.school_id, auth.uid())
             OR public.has_role(auth.uid(),'admin')
             OR public.has_role(auth.uid(),'school_admin'))
    )
  )
);

CREATE POLICY "certificates_write_admin"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'school_admin')
    OR public.has_role(auth.uid(),'academic_director')
    OR public.has_role(auth.uid(),'examiner')
    OR EXISTS (SELECT 1 FROM public.schools s WHERE s.owner_id = auth.uid())
  )
);

CREATE POLICY "certificates_update_admin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'certificates' AND (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'school_admin')
    OR EXISTS (SELECT 1 FROM public.schools s WHERE s.owner_id = auth.uid())
  )
);

CREATE POLICY "certificates_delete_admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'certificates' AND (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'school_admin')
    OR EXISTS (SELECT 1 FROM public.schools s WHERE s.owner_id = auth.uid())
  )
);

-- Allow admins to update certificates row to attach pdf_url after upload
CREATE POLICY "cert_update_pdf_url"
ON public.certificates FOR UPDATE TO authenticated
USING (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'school_admin'))
WITH CHECK (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'school_admin'));
