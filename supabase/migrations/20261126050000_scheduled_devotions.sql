-- ==============================================================================
-- RENUNGAN TERJADWAL
--
-- Renungan bertanggal mendatang baru dapat dibaca publik pada tanggalnya (WIB), sehingga pengurus
-- dapat menyiapkan renungan beberapa hari lebih awal tanpa isinya bocor lewat API. Super admin
-- tetap melihat semuanya. Menggantikan kebijakan "Public read daily_devotions" (USING true).
-- Idempotent.
-- ==============================================================================

DROP POLICY IF EXISTS "Public read daily_devotions" ON public.daily_devotions;
CREATE POLICY "Public read daily_devotions" ON public.daily_devotions FOR SELECT
    USING (devotion_date <= (now() AT TIME ZONE 'Asia/Jakarta')::DATE OR public.is_super_admin());

NOTIFY pgrst, 'reload schema';
