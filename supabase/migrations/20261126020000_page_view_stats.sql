-- ==============================================================================
-- ANALYTICS RINGAN (TANPA DATA PRIBADI)
--
-- Hanya jumlah kunjungan per halaman per hari (tanggal WIB). Tidak ada cookie, IP, atau
-- identitas pengunjung yang disimpan. Pengunjung menambah hitungan lewat track_page_view;
-- hanya super admin yang dapat membaca statistiknya. Idempotent.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.page_view_daily (
    day DATE NOT NULL,
    page TEXT NOT NULL,
    views INT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, page)
);

ALTER TABLE public.page_view_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.page_view_daily FROM anon, authenticated;

-- Halaman yang dihitung: halaman publik situs. Nilai lain diabaikan tanpa error.
CREATE OR REPLACE FUNCTION public.track_page_view(p_page TEXT)
RETURNS VOID LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF p_page IS NULL OR p_page NOT IN ('home', 'organisasi', 'event', 'renungan', 'alkitab', 'lagu', 'doa', 'easyworship', 'galeri', 'assets', 'form') THEN
        RETURN;
    END IF;
    INSERT INTO public.page_view_daily (day, page, views)
    VALUES ((now() AT TIME ZONE 'Asia/Jakarta')::DATE, p_page, 1)
    ON CONFLICT (day, page) DO UPDATE SET views = page_view_daily.views + 1;
END;
$$;

-- Statistik N hari terakhir (maks. 366), khusus super admin
CREATE OR REPLACE FUNCTION public.get_page_view_stats(p_days INT DEFAULT 30)
RETURNS TABLE (day DATE, page TEXT, views INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;
    RETURN QUERY
    SELECT v.day, v.page, v.views
    FROM public.page_view_daily v
    WHERE v.day > (now() AT TIME ZONE 'Asia/Jakarta')::DATE - LEAST(GREATEST(coalesce(p_days, 30), 1), 366)
    ORDER BY v.day, v.page;
END;
$$;

REVOKE ALL ON FUNCTION public.track_page_view(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_page_view_stats(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_page_view(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_page_view_stats(INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
