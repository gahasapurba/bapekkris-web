-- ==============================================================================
-- PENGERASAN KEAMANAN (28 Nov 2026)
--
-- 1. Cek Status pendaftaran (track_submissions) tidak lagi mengirim seluruh isi
--    formulir (NIP, WhatsApp, email, tautan berkas) ke publik; cukup status,
--    catatan panitia, nama, dan keterangan singkat (unit/divisi/pilihan).
-- 2. Fungsi yang dibuat setelah REVOKE awal mewarisi EXECUTE untuk PUBLIC (berarti
--    anon juga). Dicabut; hak anon/authenticated tetap diberikan eksplisit.
--    Fungsi admin (assign/revoke) hanya untuk authenticated (tetap dicek super admin).
-- 3. Unggahan publik ke storage hanya untuk ekstensi lampiran yang wajar
--    (tanpa .html/.svg/.js/.exe), dan policy admin tidak lagi menyebut bucket
--    cnt-media peninggalan template.
-- Idempotent.
-- ==============================================================================

-- 1. Cek Status: hanya data yang ditampilkan halaman
DROP FUNCTION IF EXISTS public.track_submissions(TEXT);
CREATE FUNCTION public.track_submissions(p_query TEXT)
RETURNS TABLE (id TEXT, form_id TEXT, status TEXT, admin_notes TEXT, participant_name TEXT, participant_detail TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
    q TEXT := lower(btrim(coalesce(p_query, '')));
    q_clean TEXT := regexp_replace(lower(btrim(coalesce(p_query, ''))), '\s+', '', 'g');
    q_digits TEXT := regexp_replace(coalesce(p_query, ''), '\D', '', 'g');
BEGIN
    IF char_length(q) < 3 THEN
        RETURN;
    END IF;
    RETURN QUERY
    SELECT
        s.id,
        s.form_id,
        s.status,
        s.admin_notes,
        coalesce(nullif(s.data->>nf.fid, ''), ''),
        coalesce(s.data->>df.fid, ''),
        s.created_at
    FROM public.submissions s
    JOIN public.forms f ON f.id = s.form_id
    LEFT JOIN LATERAL (
        SELECT fld->>'id' AS fid
        FROM jsonb_array_elements(f.fields) WITH ORDINALITY AS t(fld, ord)
        WHERE coalesce(fld->>'type', '') <> 'file'
        ORDER BY (coalesce(fld->>'label', '') ~* '(nama|name|squad|tim)') DESC, ord
        LIMIT 1
    ) nf ON true
    LEFT JOIN LATERAL (
        -- Hanya kolom yang memang keterangan (unit/divisi/pilihan); tidak pernah NIP/WA/email
        SELECT fld->>'id' AS fid
        FROM jsonb_array_elements(f.fields) WITH ORDINALITY AS t(fld, ord)
        WHERE coalesce(fld->>'type', '') <> 'file'
          AND (fld->>'id') IS DISTINCT FROM nf.fid
          AND coalesce(fld->>'label', '') ~* '(unit|department|dept|divisi|pilihan|cabor)'
        ORDER BY ord
        LIMIT 1
    ) df ON true
    WHERE f.requires_tracking IS NOT FALSE
      AND (
        lower(s.id) IN (q, q_clean)
        OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(f.fields) fld
            WHERE fld->>'isSearchIndex' = 'true'
              AND (
                lower(btrim(s.data->>(fld->>'id'))) = q
                OR regexp_replace(lower(s.data->>(fld->>'id')), '\s+', '', 'g') = q_clean
                OR (char_length(q_digits) >= 4 AND regexp_replace(s.data->>(fld->>'id'), '\D', '', 'g') = q_digits)
              )
        )
      )
    ORDER BY s.created_at DESC
    LIMIT 20;
END;
$$;

-- 2. Hak eksekusi: tanpa PUBLIC, hanya peran yang memang perlu
REVOKE ALL ON FUNCTION
    public.track_submissions(TEXT),
    public.get_registration_counts(),
    public.get_event_attendees(TEXT),
    public.is_submission_value_taken(TEXT, TEXT, TEXT),
    public.get_accepted_submissions(TEXT),
    public.submit_form(TEXT, JSONB, JSONB),
    public.submit_rsvp(TEXT, TEXT, TEXT, TEXT),
    public.assign_admin_role(TEXT, TEXT, TEXT, TEXT),
    public.revoke_admin_role(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
    public.track_submissions(TEXT),
    public.get_registration_counts(),
    public.get_event_attendees(TEXT),
    public.is_submission_value_taken(TEXT, TEXT, TEXT),
    public.get_accepted_submissions(TEXT),
    public.submit_form(TEXT, JSONB, JSONB),
    public.submit_rsvp(TEXT, TEXT, TEXT, TEXT)
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.assign_admin_role(TEXT, TEXT, TEXT, TEXT),
    public.revoke_admin_role(UUID)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.track_submissions(TEXT) TO service_role;

-- 3. Storage
DROP POLICY IF EXISTS "Public upload submission files" ON storage.objects;
CREATE POLICY "Public upload submission files" ON storage.objects FOR INSERT TO anon, authenticated
    WITH CHECK (
        bucket_id = 'bapekkris-media'
        AND (storage.foldername(name))[1] = 'submissions'
        AND lower(storage.extension(name)) = ANY (ARRAY[
            'pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'heic', 'heif',
            'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv',
            'zip', 'rar', '7z', 'mp3', 'mp4', 'mov'
        ])
    );

DROP POLICY IF EXISTS "Admin manage media" ON storage.objects;
CREATE POLICY "Admin manage media" ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'bapekkris-media' AND public.is_admin())
    WITH CHECK (bucket_id = 'bapekkris-media' AND public.is_admin());
