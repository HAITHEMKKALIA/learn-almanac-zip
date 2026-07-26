-- Phase 4: Extended Roles
-- Add new roles to app_role enum (super_admin, school_admin, academic_director, pedagogical_coordinator, examiner, parent, staff)
-- Keep existing: admin, teacher, student

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'academic_director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pedagogical_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'examiner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
