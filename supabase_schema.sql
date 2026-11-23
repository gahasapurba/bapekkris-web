-- ==============================================================================
-- SKEMA MASTER DATABASE SUPABASE UNTUK OFFICIAL WEBSITE BAPEKKRIS BANK MANDIRI
-- (Badan Pembinaan Kerohanian Kristen Bank Mandiri)
--
-- Blueprint Lengkap 19 Tabel, Relasi Foreign Key, Indexing, Row Level Security (RLS),
-- dan Storage Bucket (bapekkris-media).
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
-- ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.aspirasi CASCADE;

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

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename IN (
            'tenures', 'tenure_roles', 'divisions', 'sub_divisions',
            'members', 'events', 'galleries', 'forms', 'submissions', 
            'lucky_draws', 'event_rsvps', 'faqs', 'brand_assets', 'page_settings',
            'daily_devotions', 'worship_songs', 'easy_worship_schedules'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public full access %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public full access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- STORAGE BUCKET UNTUK MEDIA & DOKUMEN (bapekkris-media)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('bapekkris-media', 'bapekkris-media', true, 20971520)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

DROP POLICY IF EXISTS "Public Access bapekkris-media" ON storage.objects;
CREATE POLICY "Public Access bapekkris-media" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'bapekkris-media') WITH CHECK (bucket_id = 'bapekkris-media');

-- Storage bucket alias untuk kompatibilitas jika ada upload lama
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('cnt-media', 'cnt-media', true, 20971520)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

DROP POLICY IF EXISTS "Public Access cnt-media" ON storage.objects;
CREATE POLICY "Public Access cnt-media" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'cnt-media') WITH CHECK (bucket_id = 'cnt-media');

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

