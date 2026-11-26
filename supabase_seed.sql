-- ==============================================================================
-- BLUEPRINT MASTER SEED DATA UNTUK BAPEKKRIS BANK MANDIRI
-- (Badan Pembinaan Kerohanian Kristen Bank Mandiri)
--
-- STANDAR: MURNI ZERO MOCK DATA (KOSONG DARI SEED DUMMY / FALLBACK DATA).
-- Seluruh record akan diinput secara mandiri dan murni oleh Admin Bapekkris.
-- Template ini menjamin struktur tabel dapat diisi tanpa konflik (ON CONFLICT DO NOTHING).
-- ==============================================================================

-- 1. tenures (Periode Kepengurusan)
-- INSERT INTO public.tenures (id, code, title, theme_tagline, hero_headline, hero_highlight, visi, misi, is_active, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 2. tenure_roles (Role & Jabatan)
-- INSERT INTO public.tenure_roles (id, tenure_id, name, level, max_quota, requires_division, requires_sub_division, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 3. divisions (Divisi / Komisi Pelayanan)
-- INSERT INTO public.divisions (id, tenure_id, name, color, motto, description, focus_areas, is_recruiting, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 5. sub_divisions (Sub-Divisi / Tim Kerja)
-- INSERT INTO public.sub_divisions (id, division_id, name, code, description, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 6. members (Pengurus & Pelayan)
-- INSERT INTO public.members (id, tenure_id, division_id, sub_division_id, role_id, name, image, color, whatsapp, motto, responsibilities, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 7. events (Program Kerja & Ibadah)
-- INSERT INTO public.events (id, tenure_id, division_id, title, category, start_date, end_date, location, peserta, description, total_rab, status, is_public, is_limited, max_quota, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 8. galleries (Galeri Dokumentasi Ibadah & Kegiatan)
-- INSERT INTO public.galleries (id, tenure_id, division_id, event_id, title, date, description, photos, doc_links, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 9. forms (Formulir Pendaftaran)
-- INSERT INTO public.forms (id, tenure_id, event_id, title, subtitle, category, deadline, description, notes, fields, is_open, requires_tracking, is_show_accepted, is_limited, max_quota, is_event_connected, is_lucky_draw, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 11. submissions (Berkas Pendaftaran)
-- INSERT INTO public.submissions (id, form_id, data, files, status, admin_notes, checked_in_at)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 12. lucky_draws (Pengundian Doorprize)
-- INSERT INTO public.lucky_draws (id, event_id, submission_id, form_id, prize_name, drawn_at, sort_order, details)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 12. event_rsvps (Daftar Hadir & RSVP)
-- INSERT INTO public.event_rsvps (id, event_id, attendee_name, attendance_mode, notes, sort_order, checked_in_at)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 14. faqs (Tanya Jawab & Panduan)
-- INSERT INTO public.faqs (id, question, answer, category, asked_by, is_published, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 15. brand_assets (Katalog Logo & Liturgi Resmi)
-- INSERT INTO public.brand_assets (id, title, category, description, file_url, preview_url, file_type, file_size, badge, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 16. page_settings (Konfigurasi Visibilitas Global & Banner Sistem)
INSERT INTO public.page_settings (key, value, updated_at)
VALUES 
  ('page_visibility', '{"navbar":true,"home":true,"organisasi":true,"event":true,"program":true,"renungan":true,"alkitab":true,"lagu":true,"easyworship":true,"galeri":true,"assets":true,"form":true,"oprec":true}'::jsonb, NOW()),
  ('announcement_bar', '{"isActive":false,"message":"Selamat Datang di Website Resmi Bapekkris PT Bank Mandiri (Persero) Tbk.","badge":"INFO","ctaText":"Lihat Jadwal","ctaTab":"event"}'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 17. daily_devotions (Renungan Harian)
-- INSERT INTO public.daily_devotions (id, title, devotion_date, scripture_ref, scripture_text, body, prayer, author, theme, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 18. worship_songs (Kidung Jemaat & Lagu Rohani Tambahan)
-- INSERT INTO public.worship_songs (id, title, song_number, category, key_signature, author, lyrics, youtube_url, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 19. easy_worship_schedules (Jadwal & Tata Ibadah EasyWorship)
-- INSERT INTO public.easy_worship_schedules (id, event_id, title, service_date, items, theme_settings, sort_order)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 20. admin_profiles (Akun Admin & Peran). Buat user di Authentication → Users terlebih dahulu.
-- INSERT INTO public.admin_profiles (user_id, email, role, division_id)
-- SELECT id, lower(email), 'super_admin', NULL FROM auth.users WHERE lower(email) = lower('EMAIL_ADMIN')
-- ON CONFLICT (user_id) DO NOTHING;

-- 21. prayer_requests (Pokok Doa). Permohonan dikirim jemaat lewat RPC submit_prayer_request.
-- INSERT INTO public.prayer_requests (id, requester_name, request, is_anonymous, is_private, status)
-- VALUES (...) ON CONFLICT (id) DO NOTHING;

-- 22. page_view_daily (Statistik pengunjung). Diisi otomatis lewat RPC track_page_view; tanpa seed.

-- 23. admin_audit_log (Log aktivitas admin). Diisi otomatis oleh trigger log_admin_change; tanpa seed.
