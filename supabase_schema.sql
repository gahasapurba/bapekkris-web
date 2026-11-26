-- ==============================================================================
-- SKEMA MASTER DATABASE SUPABASE UNTUK OFFICIAL WEBSITE BAPEKKRIS BANK MANDIRI
-- (Badan Pembinaan Kerohanian Kristen Bank Mandiri)
--
-- Blueprint Lengkap 20 Tabel (termasuk admin_profiles), Relasi Foreign Key, Indexing,
-- Row Level Security (RLS) berbasis peran admin, RPC publik, dan Storage Bucket (bapekkris-media).
--
-- MURNI STRUKTUR TABEL & RELASI TANPA DATA MOCK / SEED APAPUN (ZERO MOCK DATA).
-- Jalankan file ini langsung pada SQL Editor project Supabase baru Anda.
-- ==============================================================================

-- 1. Tabel Master Periode Kepengurusan (tenures)
CREATE TABLE IF NOT EXISTS public.tenures (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    theme_tagline TEXT,
    hero_headline TEXT,
    hero_highlight TEXT,
    visi TEXT,
    misi JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Master Role & Jabatan Kepengurusan (tenure_roles)
CREATE TABLE IF NOT EXISTS public.tenure_roles (
    id TEXT PRIMARY KEY,
    tenure_id TEXT REFERENCES public.tenures(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level TEXT DEFAULT '5',
    max_quota INT DEFAULT 0,
    requires_division BOOLEAN DEFAULT true,
    requires_sub_division BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Divisi / Komisi Pelayanan (divisions)
CREATE TABLE IF NOT EXISTS public.divisions (
    id TEXT PRIMARY KEY,
    tenure_id TEXT REFERENCES public.tenures(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#003d79',
    motto TEXT,
    description TEXT,
    focus_areas JSONB DEFAULT '[]'::jsonb,
    is_recruiting BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabel Sub-Divisi / Tim Kerja Pelayanan (sub_divisions)
CREATE TABLE IF NOT EXISTS public.sub_divisions (
    id TEXT PRIMARY KEY,
    division_id TEXT NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabel Struktur Pengurus & Pelayan (members)
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    tenure_id TEXT REFERENCES public.tenures(id) ON DELETE SET NULL,
    division_id TEXT REFERENCES public.divisions(id) ON DELETE SET NULL,
    sub_division_id TEXT REFERENCES public.sub_divisions(id) ON DELETE SET NULL,
    role_id TEXT REFERENCES public.tenure_roles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    image TEXT,
    color TEXT,
    whatsapp TEXT,
    motto TEXT,
    responsibilities JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabel Program Kerja, Ibadah, & Kegiatan Rohani (events)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    tenure_id TEXT REFERENCES public.tenures(id) ON DELETE SET NULL,
    division_id TEXT REFERENCES public.divisions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT,
    start_date TEXT,
    end_date TEXT,
    location TEXT,
    peserta TEXT,
    description TEXT,
    total_rab NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Upcoming',
    is_public BOOLEAN DEFAULT false,
    is_limited BOOLEAN DEFAULT false,
    max_quota INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabel Galeri Dokumentasi Ibadah & Kegiatan (galleries)
CREATE TABLE IF NOT EXISTS public.galleries (
    id TEXT PRIMARY KEY,
    tenure_id TEXT REFERENCES public.tenures(id) ON DELETE SET NULL,
    division_id TEXT REFERENCES public.divisions(id) ON DELETE SET NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    date TEXT,
    description TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    doc_links JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tabel Formulir Pendaftaran Dinamis Kegiatan (forms)
CREATE TABLE IF NOT EXISTS public.forms (
    id TEXT PRIMARY KEY,
    tenure_id TEXT REFERENCES public.tenures(id) ON DELETE SET NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT,
    deadline TEXT,
    description TEXT,
    notes TEXT,
    fields JSONB DEFAULT '[]'::jsonb,
    is_open BOOLEAN DEFAULT true,
    requires_tracking BOOLEAN DEFAULT true,
    is_show_accepted BOOLEAN DEFAULT false,
    is_limited BOOLEAN DEFAULT false,
    max_quota INT DEFAULT 0,
    is_event_connected BOOLEAN DEFAULT false,
    is_lucky_draw BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Tabel Berkas Pendaftaran Masuk (submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT PRIMARY KEY,
    form_id TEXT REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}'::jsonb,
    files JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'Submitted',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Tabel Pengundian Doorprize Acara (lucky_draws)
CREATE TABLE IF NOT EXISTS public.lucky_draws (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    submission_id TEXT NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    form_id TEXT REFERENCES public.forms(id) ON DELETE SET NULL,
    prize_name TEXT NOT NULL DEFAULT 'Doorprize Utama',
    drawn_at TIMESTAMPTZ DEFAULT now(),
    sort_order INT DEFAULT 0,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Tabel Daftar Hadir & RSVP Ibadah (event_rsvps)
CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    attendee_name TEXT NOT NULL,
    attendance_mode TEXT NOT NULL DEFAULT 'Hadir Onsite',
    notes TEXT DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Tabel Pusat Panduan & FAQ Bapekkris (faqs)
CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'Umum',
    asked_by TEXT DEFAULT 'Admin Bapekkris',
    is_published BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Tabel Katalog Asset Logo, Liturgi & Template Resmi (brand_assets)
CREATE TABLE IF NOT EXISTS public.brand_assets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Logo & Brand',
    description TEXT DEFAULT '',
    file_url TEXT NOT NULL,
    preview_url TEXT DEFAULT '',
    file_type TEXT DEFAULT 'PDF / PNG',
    file_size TEXT DEFAULT '',
    badge TEXT DEFAULT 'Official Asset',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Tabel Pengaturan Visibilitas Halaman & Konfigurasi Global (page_settings)
CREATE TABLE IF NOT EXISTS public.page_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Tabel Renungan Harian (daily_devotions)
CREATE TABLE IF NOT EXISTS public.daily_devotions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    devotion_date DATE NOT NULL,
    scripture_ref TEXT NOT NULL,
    scripture_text TEXT DEFAULT '',
    body TEXT NOT NULL,
    prayer TEXT DEFAULT '',
    author TEXT DEFAULT 'Bapekkris Bank Mandiri',
    theme TEXT DEFAULT 'Iman & Pengharapan',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. Tabel Master Kidung Jemaat & Lagu Rohani (worship_songs)
CREATE TABLE IF NOT EXISTS public.worship_songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    song_number TEXT,
    category TEXT DEFAULT 'Kidung Jemaat',
    key_signature TEXT DEFAULT 'C',
    author TEXT DEFAULT '',
    lyrics TEXT NOT NULL,
    youtube_url TEXT DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Tabel Jadwal & Tata Ibadah Multimedia / EasyWorship (easy_worship_schedules)
CREATE TABLE IF NOT EXISTS public.easy_worship_schedules (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    service_date TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    theme_settings JSONB DEFAULT '{}'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- INDEXING UNTUK OPTIMASI QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_members_tenure_id ON public.members(tenure_id);
CREATE INDEX IF NOT EXISTS idx_members_division_id ON public.members(division_id);
CREATE INDEX IF NOT EXISTS idx_members_sub_division_id ON public.members(sub_division_id);
CREATE INDEX IF NOT EXISTS idx_sub_divisions_division_id ON public.sub_divisions(division_id);
CREATE INDEX IF NOT EXISTS idx_events_tenure_id ON public.events(tenure_id);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON public.events(is_public);
CREATE INDEX IF NOT EXISTS idx_galleries_event_id ON public.galleries(event_id);
CREATE INDEX IF NOT EXISTS idx_forms_tenure_id ON public.forms(tenure_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON public.submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draws_event_id ON public.lucky_draws(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_devotions_date ON public.daily_devotions(devotion_date);
CREATE INDEX IF NOT EXISTS idx_songs_category ON public.worship_songs(category);

-- ==============================================================================
-- KEAMANAN AKSES: AKUN ADMIN MULTI-PERAN, RLS PER TABEL, RPC PUBLIK & STORAGE
-- ==============================================================================
ALTER TABLE public.event_rsvps DROP COLUMN IF EXISTS department_id;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.aspirasi CASCADE;

-- ------------------------------------------------------------------------------
-- 1. Detail pemenang undian & larangan pemenang ganda per acara
-- ------------------------------------------------------------------------------
-- Duplikat (submission yang sama menang dua kali di acara yang sama) dibersihkan,
-- menyisakan hasil undian paling awal, sebelum indeks unik dibuat.
DELETE FROM public.lucky_draws a
USING public.lucky_draws b
WHERE a.event_id = b.event_id
  AND a.submission_id = b.submission_id
  AND (a.drawn_at, a.id) > (b.drawn_at, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lucky_draws_event_submission
    ON public.lucky_draws(event_id, submission_id);

-- ------------------------------------------------------------------------------
-- 2. Akun admin & peran
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'division_admin')),
    division_id TEXT REFERENCES public.divisions(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT division_admin_requires_division CHECK (role <> 'division_admin' OR division_id IS NOT NULL)
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Helper otorisasi (SECURITY DEFINER agar dapat membaca admin_profiles dari dalam policy)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_division(p_division_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE user_id = auth.uid()
          AND (role = 'super_admin' OR (role = 'division_admin' AND division_id = p_division_id))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_event(p_event_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.is_super_admin() OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = p_event_id AND public.can_manage_division(e.division_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_form(p_form_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.is_super_admin() OR EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.events e ON e.id = f.event_id
        WHERE f.id = p_form_id AND public.can_manage_division(e.division_id)
    );
$$;

-- ------------------------------------------------------------------------------
-- 3. Hak akses dasar (GRANT). RLS di bawah membatasi baris yang boleh disentuh.
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated, PUBLIC;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON
    public.tenures, public.tenure_roles, public.divisions, public.sub_divisions,
    public.members, public.events, public.galleries, public.forms, public.faqs,
    public.brand_assets, public.page_settings, public.daily_devotions,
    public.worship_songs, public.easy_worship_schedules
TO anon;
GRANT INSERT ON public.faqs TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION
    public.is_admin(), public.is_super_admin(), public.can_manage_division(TEXT),
    public.can_manage_event(TEXT), public.can_manage_form(TEXT)
TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. Row Level Security
-- ------------------------------------------------------------------------------
ALTER TABLE public.tenures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenure_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_devotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.easy_worship_schedules ENABLE ROW LEVEL SECURITY;

-- Hapus seluruh policy lama "Public full access"
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public full access %I" ON public.%I;', tbl, tbl);
    END LOOP;
END $$;

-- 4a. Konten publik: dibaca semua orang, diubah oleh super admin
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'tenures', 'tenure_roles', 'divisions', 'sub_divisions', 'brand_assets',
        'page_settings', 'daily_devotions', 'worship_songs', 'easy_worship_schedules'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public read %I" ON public.%I FOR SELECT USING (true);', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Super admin write %I" ON public.%I;', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "Super admin write %I" ON public.%I FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());',
            tbl, tbl
        );
    END LOOP;
END $$;

-- 4b. Pengurus: publik baca, admin divisi kelola pengurus divisinya
DROP POLICY IF EXISTS "Public read members" ON public.members;
CREATE POLICY "Public read members" ON public.members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Division admin write members" ON public.members;
CREATE POLICY "Division admin write members" ON public.members FOR ALL TO authenticated
    USING (public.can_manage_division(division_id))
    WITH CHECK (public.can_manage_division(division_id));

-- 4c. Acara: publik hanya melihat acara publik; admin melihat semua, menulis acara divisinya
DROP POLICY IF EXISTS "Read events" ON public.events;
CREATE POLICY "Read events" ON public.events FOR SELECT USING (is_public OR public.is_admin());
DROP POLICY IF EXISTS "Division admin write events" ON public.events;
CREATE POLICY "Division admin write events" ON public.events FOR ALL TO authenticated
    USING (public.can_manage_division(division_id))
    WITH CHECK (public.can_manage_division(division_id));

-- 4d. Galeri: publik baca, admin divisi kelola galeri divisi / acaranya
DROP POLICY IF EXISTS "Public read galleries" ON public.galleries;
CREATE POLICY "Public read galleries" ON public.galleries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Division admin write galleries" ON public.galleries;
CREATE POLICY "Division admin write galleries" ON public.galleries FOR ALL TO authenticated
    USING (public.can_manage_division(division_id) OR public.can_manage_event(event_id))
    WITH CHECK (public.can_manage_division(division_id) OR public.can_manage_event(event_id));

-- 4e. Formulir: publik baca, super admin atau admin divisi pemilik acara terhubung menulis
DROP POLICY IF EXISTS "Public read forms" ON public.forms;
CREATE POLICY "Public read forms" ON public.forms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write forms" ON public.forms;
CREATE POLICY "Admin write forms" ON public.forms FOR ALL TO authenticated
    USING (public.is_super_admin() OR public.can_manage_event(event_id))
    WITH CHECK (public.is_super_admin() OR public.can_manage_event(event_id));

-- 4f. FAQ: publik melihat yang terbit & boleh mengirim pertanyaan (belum terbit)
DROP POLICY IF EXISTS "Read faqs" ON public.faqs;
CREATE POLICY "Read faqs" ON public.faqs FOR SELECT USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS "Public ask faqs" ON public.faqs;
CREATE POLICY "Public ask faqs" ON public.faqs FOR INSERT TO anon, authenticated
    WITH CHECK (
        is_published = false
        AND char_length(question) BETWEEN 8 AND 1000
        AND char_length(coalesce(asked_by, '')) <= 120
    );
DROP POLICY IF EXISTS "Super admin write faqs" ON public.faqs;
CREATE POLICY "Super admin write faqs" ON public.faqs FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 4g. Data pribadi: hanya admin yang berwenang atas formulir / acaranya
DROP POLICY IF EXISTS "Admin manage submissions" ON public.submissions;
CREATE POLICY "Admin manage submissions" ON public.submissions FOR ALL TO authenticated
    USING (public.can_manage_form(form_id)) WITH CHECK (public.can_manage_form(form_id));

DROP POLICY IF EXISTS "Admin manage event_rsvps" ON public.event_rsvps;
CREATE POLICY "Admin manage event_rsvps" ON public.event_rsvps FOR ALL TO authenticated
    USING (public.can_manage_event(event_id)) WITH CHECK (public.can_manage_event(event_id));

DROP POLICY IF EXISTS "Admin manage lucky_draws" ON public.lucky_draws;
CREATE POLICY "Admin manage lucky_draws" ON public.lucky_draws FOR ALL TO authenticated
    USING (public.can_manage_event(event_id)) WITH CHECK (public.can_manage_event(event_id));

-- 4h. Profil admin: admin melihat profilnya sendiri, super admin mengelola semuanya
DROP POLICY IF EXISTS "Read admin_profiles" ON public.admin_profiles;
CREATE POLICY "Read admin_profiles" ON public.admin_profiles FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin());
DROP POLICY IF EXISTS "Super admin write admin_profiles" ON public.admin_profiles;
CREATE POLICY "Super admin write admin_profiles" ON public.admin_profiles FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 5. RPC publik (SECURITY DEFINER, hanya mengembalikan data seperlunya)
-- ------------------------------------------------------------------------------

-- Tenggat formulir disimpan sebagai teks waktu WIB ("YYYY-MM-DD" atau "YYYY-MM-DDTHH:MM[:SS]").
-- Tanpa jam berarti akhir hari; tanpa detik berarti detik ke-59 (sama dengan tampilan di web).
CREATE OR REPLACE FUNCTION public.parse_wib_deadline(p_deadline TEXT)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
    m TEXT[];
    v_time TEXT;
BEGIN
    IF p_deadline IS NULL OR btrim(p_deadline) = '' THEN
        RETURN NULL;
    END IF;
    m := regexp_match(btrim(p_deadline), '^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(:\d{2})?)?');
    IF m IS NULL THEN
        RETURN NULL;
    END IF;
    v_time := CASE WHEN m[2] IS NULL THEN '23:59:59' ELSE m[2] || coalesce(m[3], ':59') END;
    RETURN ((m[1] || ' ' || v_time)::TIMESTAMP) AT TIME ZONE 'Asia/Jakarta';
EXCEPTION WHEN others THEN
    RETURN NULL;
END;
$$;

-- Jumlah pendaftar per formulir (tanpa yang ditolak) & jumlah RSVP per acara publik
CREATE OR REPLACE FUNCTION public.get_registration_counts()
RETURNS TABLE (kind TEXT, ref_id TEXT, total INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT 'form'::TEXT, s.form_id, count(*)::INT
    FROM public.submissions s
    WHERE s.form_id IS NOT NULL AND s.status NOT IN ('Rejected', 'Ditolak')
    GROUP BY s.form_id
    UNION ALL
    SELECT 'event'::TEXT, r.event_id, count(*)::INT
    FROM public.event_rsvps r
    JOIN public.events e ON e.id = r.event_id AND e.is_public
    GROUP BY r.event_id;
$$;

-- Daftar rekan yang sudah konfirmasi hadir (nama & mode kehadiran saja)
CREATE OR REPLACE FUNCTION public.get_event_attendees(p_event_id TEXT)
RETURNS TABLE (id TEXT, attendee_name TEXT, attendance_mode TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT r.id, r.attendee_name, r.attendance_mode, r.created_at
    FROM public.event_rsvps r
    JOIN public.events e ON e.id = r.event_id AND e.is_public
    WHERE r.event_id = p_event_id
    ORDER BY r.created_at DESC
    LIMIT 50;
$$;

-- Cek apakah nilai pada field unik sudah pernah didaftarkan (hanya untuk field bertanda isUnique)
CREATE OR REPLACE FUNCTION public.is_submission_value_taken(p_form_id TEXT, p_field_id TEXT, p_value TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.forms f, jsonb_array_elements(f.fields) fld
        WHERE f.id = p_form_id AND fld->>'id' = p_field_id AND fld->>'isUnique' = 'true'
    )
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.form_id = p_form_id
          AND lower(btrim(s.data->>p_field_id)) = lower(btrim(p_value))
    );
$$;

-- Pelacak status mandiri: cocok persis dengan ID pendaftaran atau field indeks pencarian
CREATE OR REPLACE FUNCTION public.track_submissions(p_query TEXT)
RETURNS TABLE (id TEXT, form_id TEXT, status TEXT, admin_notes TEXT, data JSONB, created_at TIMESTAMPTZ)
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
    SELECT s.id, s.form_id, s.status, s.admin_notes, s.data, s.created_at
    FROM public.submissions s
    JOIN public.forms f ON f.id = s.form_id
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

-- Pengumuman peserta diterima: hanya nama & keterangan singkat, untuk formulir yang mengaktifkannya
CREATE OR REPLACE FUNCTION public.get_accepted_submissions(p_form_id TEXT)
RETURNS TABLE (id TEXT, form_id TEXT, created_at TIMESTAMPTZ, admin_notes TEXT, participant_name TEXT, participant_detail TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    WITH form_fields AS (
        SELECT fld->>'id' AS fid, coalesce(fld->>'label', '') AS label, ord
        FROM public.forms f, jsonb_array_elements(f.fields) WITH ORDINALITY AS t(fld, ord)
        WHERE f.id = p_form_id AND f.is_show_accepted AND coalesce(fld->>'type', '') <> 'file'
    ),
    name_field AS (
        SELECT fid FROM form_fields
        ORDER BY (label ~* '(nama|name|squad|tim)') DESC, ord
        LIMIT 1
    ),
    detail_field AS (
        SELECT fid FROM form_fields
        WHERE fid IS DISTINCT FROM (SELECT fid FROM name_field)
        ORDER BY (label ~* '(unit|department|dept|divisi|pilihan|cabor)') DESC, ord
        LIMIT 1
    )
    SELECT
        s.id,
        s.form_id,
        s.created_at,
        s.admin_notes,
        coalesce(nullif(s.data->>(SELECT fid FROM name_field), ''), 'Peserta Terpilih'),
        coalesce(s.data->>(SELECT fid FROM detail_field), '')
    FROM public.submissions s
    WHERE s.form_id = p_form_id
      AND s.status IN ('Accepted', 'Diterima')
      AND EXISTS (SELECT 1 FROM form_fields)
    ORDER BY s.created_at;
$$;

-- Pendaftaran formulir publik: kunci baris formulir agar kuota & keunikan diperiksa atomik
CREATE OR REPLACE FUNCTION public.submit_form(p_form_id TEXT, p_data JSONB, p_files JSONB DEFAULT '{}'::jsonb)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_form public.forms%ROWTYPE;
    v_deadline TIMESTAMPTZ;
    v_count INT;
    v_field JSONB;
    v_value TEXT;
    v_id TEXT := 'sub-' || gen_random_uuid()::TEXT;
BEGIN
    IF p_data IS NULL OR jsonb_typeof(p_data) <> 'object' THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD';
    END IF;
    IF octet_length(p_data::TEXT) > 50000 OR octet_length(coalesce(p_files, '{}'::jsonb)::TEXT) > 20000 THEN
        RAISE EXCEPTION 'PAYLOAD_TOO_LARGE';
    END IF;

    SELECT * INTO v_form FROM public.forms WHERE id = p_form_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'FORM_NOT_FOUND';
    END IF;
    IF v_form.is_open IS FALSE THEN
        RAISE EXCEPTION 'FORM_CLOSED';
    END IF;

    v_deadline := public.parse_wib_deadline(v_form.deadline);
    IF v_deadline IS NOT NULL AND now() > v_deadline THEN
        RAISE EXCEPTION 'FORM_DEADLINE_PASSED';
    END IF;

    IF v_form.is_limited AND v_form.max_quota > 0 THEN
        SELECT count(*) INTO v_count
        FROM public.submissions
        WHERE form_id = p_form_id AND status NOT IN ('Rejected', 'Ditolak');
        IF v_count >= v_form.max_quota THEN
            RAISE EXCEPTION 'FORM_QUOTA_FULL';
        END IF;
    END IF;

    FOR v_field IN SELECT * FROM jsonb_array_elements(v_form.fields) LOOP
        IF v_field->>'isUnique' = 'true' THEN
            v_value := lower(btrim(p_data->>(v_field->>'id')));
            IF v_value IS NOT NULL AND v_value <> '' AND EXISTS (
                SELECT 1 FROM public.submissions s
                WHERE s.form_id = p_form_id AND lower(btrim(s.data->>(v_field->>'id'))) = v_value
            ) THEN
                RAISE EXCEPTION 'FORM_DUPLICATE:%', v_field->>'id';
            END IF;
        END IF;
    END LOOP;

    INSERT INTO public.submissions (id, form_id, data, files, status, admin_notes)
    VALUES (v_id, p_form_id, p_data, coalesce(p_files, '{}'::jsonb), 'Submitted', '');

    RETURN v_id;
END;
$$;

-- RSVP publik: hanya untuk acara publik, kuota acara diperiksa atomik
CREATE OR REPLACE FUNCTION public.submit_rsvp(p_event_id TEXT, p_attendee_name TEXT, p_attendance_mode TEXT, p_notes TEXT DEFAULT '')
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_event public.events%ROWTYPE;
    v_count INT;
    v_id TEXT := 'rsvp-' || gen_random_uuid()::TEXT;
BEGIN
    IF char_length(btrim(coalesce(p_attendee_name, ''))) NOT BETWEEN 1 AND 120
       OR char_length(coalesce(p_notes, '')) > 500
       OR char_length(coalesce(p_attendance_mode, '')) > 60 THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD';
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id AND is_public FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND';
    END IF;

    IF v_event.is_limited AND v_event.max_quota > 0 THEN
        SELECT count(*) INTO v_count FROM public.event_rsvps WHERE event_id = p_event_id;
        IF v_count >= v_event.max_quota THEN
            RAISE EXCEPTION 'RSVP_QUOTA_FULL';
        END IF;
    END IF;

    INSERT INTO public.event_rsvps (id, event_id, attendee_name, attendance_mode, notes)
    VALUES (v_id, p_event_id, btrim(p_attendee_name), coalesce(nullif(btrim(p_attendance_mode), ''), 'Hadir Onsite'), coalesce(btrim(p_notes), ''));

    RETURN v_id;
END;
$$;

-- Kelola akun admin (super admin). Akun dibuat lebih dulu di Supabase Auth.
CREATE OR REPLACE FUNCTION public.assign_admin_role(p_email TEXT, p_role TEXT, p_division_id TEXT DEFAULT NULL, p_display_name TEXT DEFAULT '')
RETURNS UUID LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;
    SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(btrim(p_email));
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'USER_NOT_FOUND';
    END IF;
    IF v_user_id = auth.uid() AND p_role <> 'super_admin' THEN
        RAISE EXCEPTION 'CANNOT_DEMOTE_SELF';
    END IF;

    INSERT INTO public.admin_profiles (user_id, email, display_name, role, division_id)
    VALUES (v_user_id, lower(btrim(p_email)), coalesce(p_display_name, ''), p_role,
            CASE WHEN p_role = 'division_admin' THEN p_division_id ELSE NULL END)
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        division_id = EXCLUDED.division_id,
        updated_at = now();

    RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin_role(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'CANNOT_REVOKE_SELF';
    END IF;
    DELETE FROM public.admin_profiles WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION
    public.parse_wib_deadline(TEXT),
    public.get_registration_counts(),
    public.get_event_attendees(TEXT),
    public.is_submission_value_taken(TEXT, TEXT, TEXT),
    public.track_submissions(TEXT),
    public.get_accepted_submissions(TEXT),
    public.submit_form(TEXT, JSONB, JSONB),
    public.submit_rsvp(TEXT, TEXT, TEXT, TEXT)
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.assign_admin_role(TEXT, TEXT, TEXT, TEXT),
    public.revoke_admin_role(UUID)
TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. Storage: publik hanya boleh mengunggah lampiran pendaftaran; sisanya admin
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('bapekkris-media', 'bapekkris-media', true, 20971520)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

DROP POLICY IF EXISTS "Public Access bapekkris-media" ON storage.objects;
DROP POLICY IF EXISTS "Public Access cnt-media" ON storage.objects;

DROP POLICY IF EXISTS "Public upload submission files" ON storage.objects;
CREATE POLICY "Public upload submission files" ON storage.objects FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'bapekkris-media' AND (storage.foldername(name))[1] = 'submissions');

DROP POLICY IF EXISTS "Admin manage media" ON storage.objects;
CREATE POLICY "Admin manage media" ON storage.objects FOR ALL TO authenticated
    USING (bucket_id IN ('bapekkris-media', 'cnt-media') AND public.is_admin())
    WITH CHECK (bucket_id IN ('bapekkris-media', 'cnt-media') AND public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. Super admin pertama (jalankan sekali setelah membuat user di Authentication → Users):
--
--   INSERT INTO public.admin_profiles (user_id, email, role)
--   SELECT id, lower(email), 'super_admin' FROM auth.users WHERE lower(email) = lower('EMAIL_ADMIN_ANDA')
--   ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', division_id = NULL, updated_at = now();
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- CHECK-IN KEHADIRAN DI LOKASI ACARA
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
