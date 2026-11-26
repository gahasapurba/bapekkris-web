-- ==============================================================================
-- CHECK-IN KEHADIRAN DI LOKASI ACARA
--
-- Peserta menunjukkan QR berisi ID pendaftaran (sub-… dari formulir, rsvp-… dari RSVP).
-- Admin acara memindai / mengetik ID atau field indeks pencarian (mis. NIP), dan
-- check_in_registration menandai kehadiran secara atomik. Idempotent.
-- ==============================================================================

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.event_rsvps ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.event_rsvps ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Hasil: status = 'checked_in' (baru ditandai) | 'already' (sudah hadir sebelumnya) | 'not_found'
CREATE OR REPLACE FUNCTION public.check_in_registration(p_event_id TEXT, p_code TEXT)
RETURNS TABLE (status TEXT, kind TEXT, registration_id TEXT, checked_in_at TIMESTAMPTZ)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
    v_code TEXT := btrim(coalesce(p_code, ''));
    v_code_lower TEXT := lower(btrim(coalesce(p_code, '')));
    v_digits TEXT := regexp_replace(coalesce(p_code, ''), '\D', '', 'g');
    v_form_id TEXT;
    v_id TEXT;
    v_checked TIMESTAMPTZ;
BEGIN
    IF NOT public.can_manage_event(p_event_id) THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;
    IF char_length(v_code) < 3 THEN
        RETURN QUERY SELECT 'not_found'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- 1. RSVP langsung ke acara ini
    SELECT r.id, r.checked_in_at INTO v_id, v_checked
    FROM public.event_rsvps r
    WHERE r.event_id = p_event_id AND lower(r.id) = v_code_lower
    FOR UPDATE;
    IF FOUND THEN
        IF v_checked IS NOT NULL THEN
            RETURN QUERY SELECT 'already'::TEXT, 'rsvp'::TEXT, v_id, v_checked;
            RETURN;
        END IF;
        UPDATE public.event_rsvps SET checked_in_at = now(), checked_in_by = auth.uid(), updated_at = now()
        WHERE id = v_id RETURNING event_rsvps.checked_in_at INTO v_checked;
        RETURN QUERY SELECT 'checked_in'::TEXT, 'rsvp'::TEXT, v_id, v_checked;
        RETURN;
    END IF;

    -- 2. Pendaftaran lewat formulir yang terhubung ke acara: cocok ID atau field indeks pencarian
    SELECT f.id INTO v_form_id
    FROM public.forms f
    WHERE f.event_id = p_event_id AND f.is_event_connected
    ORDER BY f.updated_at DESC NULLS LAST
    LIMIT 1;

    IF v_form_id IS NOT NULL THEN
        SELECT s.id, s.checked_in_at INTO v_id, v_checked
        FROM public.submissions s
        JOIN public.forms f ON f.id = s.form_id
        WHERE s.form_id = v_form_id
          AND s.status NOT IN ('Rejected', 'Ditolak')
          AND (
            lower(s.id) = v_code_lower
            OR EXISTS (
                SELECT 1 FROM jsonb_array_elements(f.fields) fld
                WHERE fld->>'isSearchIndex' = 'true'
                  AND (
                    lower(btrim(s.data->>(fld->>'id'))) = v_code_lower
                    OR (char_length(v_digits) >= 4 AND regexp_replace(s.data->>(fld->>'id'), '\D', '', 'g') = v_digits)
                  )
            )
          )
        ORDER BY s.created_at
        LIMIT 1
        FOR UPDATE OF s;
        IF FOUND THEN
            IF v_checked IS NOT NULL THEN
                RETURN QUERY SELECT 'already'::TEXT, 'submission'::TEXT, v_id, v_checked;
                RETURN;
            END IF;
            UPDATE public.submissions SET checked_in_at = now(), checked_in_by = auth.uid(), updated_at = now()
            WHERE id = v_id RETURNING submissions.checked_in_at INTO v_checked;
            RETURN QUERY SELECT 'checked_in'::TEXT, 'submission'::TEXT, v_id, v_checked;
            RETURN;
        END IF;
    END IF;

    RETURN QUERY SELECT 'not_found'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ;
END;
$$;

-- Membatalkan check-in yang salah pindai
CREATE OR REPLACE FUNCTION public.undo_check_in(p_event_id TEXT, p_registration_id TEXT)
RETURNS VOID LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.can_manage_event(p_event_id) THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;
    UPDATE public.event_rsvps SET checked_in_at = NULL, checked_in_by = NULL, updated_at = now()
    WHERE id = p_registration_id AND event_id = p_event_id;
    UPDATE public.submissions s SET checked_in_at = NULL, checked_in_by = NULL, updated_at = now()
    FROM public.forms f
    WHERE s.id = p_registration_id AND f.id = s.form_id AND f.event_id = p_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.check_in_registration(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.undo_check_in(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_in_registration(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.undo_check_in(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
