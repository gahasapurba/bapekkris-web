-- Hapus sisa skema lama (template CNT) yang tidak lagi dipakai aplikasi.
ALTER TABLE public.event_rsvps DROP COLUMN IF EXISTS department_id;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.aspirasi CASCADE;
