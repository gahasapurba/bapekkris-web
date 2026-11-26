-- A division that still has sub-divisions cannot be deleted: the sub-divisions used to be removed
-- silently by ON DELETE CASCADE. Delete or move the sub-divisions first.
ALTER TABLE public.sub_divisions DROP CONSTRAINT IF EXISTS sub_divisions_division_id_fkey;
ALTER TABLE public.sub_divisions
  ADD CONSTRAINT sub_divisions_division_id_fkey
  FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE RESTRICT;
