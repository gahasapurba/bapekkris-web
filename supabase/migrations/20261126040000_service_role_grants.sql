-- ==============================================================================
-- HAK AKSES SERVICE ROLE (BACKUP & PEMULIHAN)
--
-- service_role adalah kunci server Supabase (melewati RLS) yang hanya dipakai skrip backup/restore;
-- kuncinya tidak pernah dikirim ke browser. Hak baca/tulis bawaannya hilang dari tabel public,
-- sehingga backup harian menghasilkan 0 baris. Dikembalikan di sini, termasuk untuk tabel baru.
-- Idempotent.
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON ROUTINES TO service_role;
