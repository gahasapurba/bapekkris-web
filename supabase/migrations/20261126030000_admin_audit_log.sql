-- ==============================================================================
-- AUDIT LOG ADMIN (SIAPA MENGUBAH APA)
--
-- Setiap tambah/ubah/hapus oleh admin yang sedang masuk pada tabel konten dicatat oleh trigger,
-- sehingga perubahan lewat portal maupun langsung lewat API sama-sama terekam. Aksi publik
-- (formulir, RSVP, pokok doa, statistik kunjungan) tidak dicatat karena tidak membawa sesi admin.
-- Hanya super admin yang dapat membaca; tidak ada yang dapat mengubah atau menghapus entri.
-- Idempotent.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id UUID,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    table_name TEXT NOT NULL,
    row_id TEXT,
    summary TEXT,
    changed_fields TEXT[],
    old_data JSONB,
    new_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_time ON public.admin_audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_table ON public.admin_audit_log(table_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON public.admin_audit_log(actor_email, occurred_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;

DROP POLICY IF EXISTS admin_audit_log_super_admin_read ON public.admin_audit_log;
CREATE POLICY admin_audit_log_super_admin_read ON public.admin_audit_log
    FOR SELECT TO authenticated USING (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.log_admin_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_profile public.admin_profiles%ROWTYPE;
    v_old JSONB := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
    v_new JSONB := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
    v_row JSONB := coalesce(v_new, v_old);
    v_changed TEXT[];
BEGIN
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT * INTO v_profile FROM public.admin_profiles WHERE user_id = v_uid;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        SELECT array_agg(n.key ORDER BY n.key) INTO v_changed
        FROM jsonb_each(v_new) n
        WHERE n.key NOT IN ('updated_at') AND n.value IS DISTINCT FROM (v_old -> n.key);
        -- Saves that change nothing but the timestamp are not worth an entry
        IF v_changed IS NULL THEN
            RETURN NULL;
        END IF;
    END IF;

    INSERT INTO public.admin_audit_log (actor_id, actor_email, actor_role, action, table_name, row_id, summary, changed_fields, old_data, new_data)
    VALUES (
        v_uid,
        v_profile.email,
        v_profile.role,
        lower(TG_OP),
        TG_TABLE_NAME,
        coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'user_id'),
        left(coalesce(v_row ->> 'title', v_row ->> 'name', v_row ->> 'question', v_row ->> 'attendee_name',
                      v_row ->> 'prize_name', v_row ->> 'email', v_row ->> 'request', v_row ->> 'key', v_row ->> 'id'), 200),
        v_changed,
        v_old,
        v_new
    );
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_change() FROM PUBLIC;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'tenures', 'tenure_roles', 'divisions', 'sub_divisions', 'members', 'events', 'galleries', 'forms',
        'submissions', 'lucky_draws', 'event_rsvps', 'faqs', 'brand_assets', 'page_settings', 'daily_devotions',
        'worship_songs', 'easy_worship_schedules', 'admin_profiles', 'prayer_requests'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%1$s ON public.%1$I', t);
        EXECUTE format('CREATE TRIGGER trg_audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.log_admin_change()', t);
    END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
