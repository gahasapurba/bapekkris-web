// Pokok Doa: public prayer wall (RPC, anonymous names masked server-side) and super-admin moderation.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RpcError, supabase } from './supabase';

export type PrayerStatus = 'pending' | 'approved' | 'answered' | 'archived';

export interface PrayerWallItem {
  id: string;
  displayName: string;
  request: string;
  status: PrayerStatus;
  prayedCount: number;
  createdAt: string;
}

export interface PrayerRequest {
  id: string;
  requesterName: string;
  request: string;
  isAnonymous: boolean;
  isPrivate: boolean;
  status: PrayerStatus;
  prayedCount: number;
  createdAt: string;
}

export const PRAYER_REQUEST_MIN = 10;
export const PRAYER_REQUEST_MAX = 1000;
export const PRAYER_NAME_MAX = 120;

const wallKey = ['prayers', 'wall'] as const;
const adminKey = ['prayers', 'admin'] as const;

function rpcError(error: { message?: string }): RpcError {
  const [code, detail] = String(error.message || '').split(':');
  return new RpcError(code, detail, error.message);
}

export async function fetchPrayerWall(): Promise<PrayerWallItem[]> {
  const { data, error } = await supabase.rpc('get_prayer_wall');
  if (error) throw rpcError(error);
  return (data || []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    request: row.request,
    status: row.status as PrayerStatus,
    prayedCount: row.prayed_count,
    createdAt: row.created_at
  }));
}

export async function submitPrayerRequest(input: { name: string; request: string; isAnonymous: boolean; isPrivate: boolean }): Promise<string> {
  const { data, error } = await supabase.rpc('submit_prayer_request', {
    p_name: input.name.trim(),
    p_request: input.request.trim(),
    p_is_anonymous: input.isAnonymous,
    p_is_private: input.isPrivate
  });
  if (error) throw rpcError(error);
  return data as string;
}

export async function prayForRequest(id: string): Promise<number> {
  const { data, error } = await supabase.rpc('pray_for_request', { p_id: id });
  if (error) throw rpcError(error);
  return data as number;
}

export async function listPrayerRequests(): Promise<PrayerRequest[]> {
  const { data, error } = await supabase.from('prayer_requests').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Gagal memuat pokok doa: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    requesterName: row.requester_name,
    request: row.request,
    isAnonymous: row.is_anonymous,
    isPrivate: row.is_private,
    status: row.status as PrayerStatus,
    prayedCount: row.prayed_count,
    createdAt: row.created_at || ''
  }));
}

export async function updatePrayerStatus(id: string, status: PrayerStatus): Promise<void> {
  const { error } = await supabase.from('prayer_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(`Gagal memperbarui pokok doa: ${error.message}`);
}

export async function deletePrayerRequest(id: string): Promise<void> {
  const { error } = await supabase.from('prayer_requests').delete().eq('id', id);
  if (error) throw new Error(`Gagal menghapus pokok doa: ${error.message}`);
}

export function usePrayerWall() {
  return useQuery({ queryKey: wallKey, queryFn: fetchPrayerWall, staleTime: 60_000 });
}

export function useAdminPrayerRequests(enabled: boolean) {
  return useQuery({ queryKey: adminKey, queryFn: listPrayerRequests, enabled });
}

/** Refreshes both the public wall and the admin list after a change. */
export function useInvalidatePrayers() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['prayers'] });
}

// Devices remember which requests they already prayed for, so the counter is not inflated by
// repeated taps (the server cannot tell visitors apart without accounts).
const PRAYED_STORAGE_KEY = 'bapekkris_prayed_requests';

export function loadPrayedIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(PRAYED_STORAGE_KEY) || '[]')); } catch { return new Set(); }
}

export function rememberPrayed(id: string): void {
  try {
    const ids = loadPrayedIds();
    ids.add(id);
    localStorage.setItem(PRAYED_STORAGE_KEY, JSON.stringify([...ids].slice(-500)));
  } catch { /* storage unavailable */ }
}
