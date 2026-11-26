-- ==============================================================================
-- POKOK DOA (PRAYER REQUESTS)
--
-- Jemaat mengirim permohonan doa (boleh anonim, boleh khusus pengurus). Permohonan publik
-- tampil di dinding doa setelah disetujui super admin. Tabel tidak dapat dibaca langsung oleh
-- publik: dinding doa diambil lewat RPC yang menyamarkan nama anonim. Idempotent.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id TEXT PRIMARY KEY DEFAULT ('prayer-' || gen_random_uuid()::TEXT),
    requester_name TEXT NOT NULL DEFAULT '',
    request TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    is_private BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'answered', 'archived')),
    prayed_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT prayer_request_length CHECK (char_length(request) BETWEEN 10 AND 1000),
    CONSTRAINT prayer_name_length CHECK (char_length(requester_name) <= 120)
);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON public.prayer_requests(status, created_at DESC);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prayer_requests FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prayer_requests TO authenticated;

DROP POLICY IF EXISTS "Super admin manage prayer_requests" ON public.prayer_requests;
CREATE POLICY "Super admin manage prayer_requests" ON public.prayer_requests FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Kirim permohonan doa (selalu berstatus menunggu peninjauan)
CREATE OR REPLACE FUNCTION public.submit_prayer_request(p_name TEXT, p_request TEXT, p_is_anonymous BOOLEAN DEFAULT false, p_is_private BOOLEAN DEFAULT false)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id TEXT;
BEGIN
    IF char_length(btrim(coalesce(p_request, ''))) NOT BETWEEN 10 AND 1000
       OR char_length(btrim(coalesce(p_name, ''))) > 120 THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD';
    END IF;
    INSERT INTO public.prayer_requests (requester_name, request, is_anonymous, is_private)
    VALUES (btrim(coalesce(p_name, '')), btrim(p_request), coalesce(p_is_anonymous, false), coalesce(p_is_private, false))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- Dinding doa: hanya permohonan publik yang disetujui / terjawab; nama anonim disamarkan
CREATE OR REPLACE FUNCTION public.get_prayer_wall()
RETURNS TABLE (id TEXT, display_name TEXT, request TEXT, status TEXT, prayed_count INT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT p.id,
           CASE WHEN p.is_anonymous OR btrim(p.requester_name) = '' THEN 'Anonim' ELSE p.requester_name END,
           p.request, p.status, p.prayed_count, p.created_at
    FROM public.prayer_requests p
    WHERE p.status IN ('approved', 'answered') AND NOT p.is_private
    ORDER BY (p.status = 'answered'), p.created_at DESC
    LIMIT 100;
$$;

-- "Saya turut mendoakan": menambah hitungan pada permohonan yang tampil di dinding doa
CREATE OR REPLACE FUNCTION public.pray_for_request(p_id TEXT)
RETURNS INT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE public.prayer_requests
    SET prayed_count = prayed_count + 1
    WHERE id = p_id AND status IN ('approved', 'answered') AND NOT is_private
    RETURNING prayed_count INTO v_count;
    IF v_count IS NULL THEN
        RAISE EXCEPTION 'PRAYER_NOT_FOUND';
    END IF;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_prayer_request(TEXT, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_prayer_wall() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pray_for_request(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_prayer_request(TEXT, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_prayer_wall() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pray_for_request(TEXT) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
