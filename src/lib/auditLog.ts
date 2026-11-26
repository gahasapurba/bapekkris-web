// Admin activity log (admin_audit_log, written by database triggers; readable by super admins only).

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { Json } from '../types/database';

export type AuditAction = 'insert' | 'update' | 'delete';

export interface AuditEntry {
  id: number;
  occurredAt: string;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  table: string;
  rowId: string;
  summary: string;
  changedFields: string[];
}

export interface AuditFilters {
  table: string;
  action: 'all' | AuditAction;
  days: number;
  search: string;
  page: number;
}

export const AUDIT_PAGE_SIZE = 25;

/** Indonesian names of the logged tables. */
export const AUDIT_TABLE_LABELS: Record<string, string> = {
  tenures: 'Periode kepengurusan', tenure_roles: 'Role & jabatan', divisions: 'Divisi', sub_divisions: 'Sub-divisi',
  members: 'Pengurus', events: 'Acara', galleries: 'Galeri', forms: 'Formulir', submissions: 'Data pendaftaran',
  lucky_draws: 'Undian doorprize', event_rsvps: 'RSVP', faqs: 'FAQ', brand_assets: 'Aset & logo',
  page_settings: 'Pengaturan situs', daily_devotions: 'Renungan', worship_songs: 'Lagu', easy_worship_schedules: 'Jadwal EasyWorship',
  admin_profiles: 'Akun admin', prayer_requests: 'Pokok doa'
};

/** Characters that would break a PostgREST or() filter are dropped from the search text. */
const cleanSearch = (q: string) => q.replace(/[,()*%\\]/g, ' ').trim();

export async function fetchAuditLog(f: AuditFilters): Promise<{ entries: AuditEntry[]; total: number }> {
  let query = supabase
    .from('admin_audit_log')
    .select('id, occurred_at, actor_email, actor_role, action, table_name, row_id, summary, changed_fields', { count: 'exact' })
    .order('occurred_at', { ascending: false })
    .range((f.page - 1) * AUDIT_PAGE_SIZE, f.page * AUDIT_PAGE_SIZE - 1);
  if (f.table !== 'all') query = query.eq('table_name', f.table);
  if (f.action !== 'all') query = query.eq('action', f.action);
  if (f.days > 0) query = query.gte('occurred_at', new Date(Date.now() - f.days * 86_400_000).toISOString());
  const q = cleanSearch(f.search);
  if (q) query = query.or(`summary.ilike.*${q}*,actor_email.ilike.*${q}*,row_id.ilike.*${q}*`);

  const { data, error, count } = await query;
  if (error) throw new Error(`Log aktivitas gagal dimuat: ${error.message}`);
  return {
    total: count || 0,
    entries: (data || []).map((r) => ({
      id: r.id,
      occurredAt: r.occurred_at,
      actorEmail: r.actor_email || '—',
      actorRole: r.actor_role || '',
      action: r.action as AuditAction,
      table: r.table_name,
      rowId: r.row_id || '',
      summary: r.summary || r.row_id || '',
      changedFields: r.changed_fields || []
    }))
  };
}

export function useAuditLog(filters: AuditFilters) {
  return useQuery({ queryKey: ['audit-log', filters], queryFn: () => fetchAuditLog(filters), placeholderData: keepPreviousData, staleTime: 15_000 });
}

export interface AuditDetail { oldData: Record<string, Json> | null; newData: Record<string, Json> | null }

export function useAuditDetail(id: number | null) {
  return useQuery({
    queryKey: ['audit-log', 'detail', id],
    enabled: id !== null,
    queryFn: async (): Promise<AuditDetail> => {
      const { data, error } = await supabase.from('admin_audit_log').select('old_data, new_data').eq('id', id as number).single();
      if (error) throw new Error(`Rincian perubahan gagal dimuat: ${error.message}`);
      return { oldData: data.old_data as AuditDetail['oldData'], newData: data.new_data as AuditDetail['newData'] };
    }
  });
}
