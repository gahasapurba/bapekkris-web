import { useState } from 'react';
import { Archive, Check, CheckCheck, Lock, RotateCcw, Trash2, UserX } from 'lucide-react';
import { Badge, useFeedback } from '../../ui';
import { formatWibTimestamp } from '../../utils/dateUtils';
import {
  deletePrayerRequest, updatePrayerStatus, useAdminPrayerRequests, useInvalidatePrayers,
  type PrayerRequest, type PrayerStatus
} from '../../lib/prayers';
import { AdminEmpty, AdminPanel, FilterSelect, IconButton, ListToolbar, SearchBox } from '../AdminUi';

const STATUS: Record<PrayerStatus, { label: string; tone: 'gold' | 'info' | 'success' | 'neutral' }> = {
  pending: { label: 'Menunggu tinjauan', tone: 'gold' },
  approved: { label: 'Tampil di dinding doa', tone: 'info' },
  answered: { label: 'Terjawab', tone: 'success' },
  archived: { label: 'Diarsipkan', tone: 'neutral' }
};

/** Super-admin moderation of prayer requests: approve, mark answered, archive or delete. */
export default function PrayerRequestsTab() {
  const { data: requests = [], isLoading, isError } = useAdminPrayerRequests(true);
  const invalidate = useInvalidatePrayers();
  const { toast, confirm } = useFeedback();
  const [filter, setFilter] = useState<'all' | PrayerStatus>('pending');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const setStatus = async (p: PrayerRequest, status: PrayerStatus, message: string) => {
    setBusyId(p.id);
    try {
      await updatePrayerStatus(p.id, status);
      await invalidate();
      toast(message);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: PrayerRequest) => {
    const ok = await confirm({ title: 'Hapus pokok doa?', message: 'Permohonan ini akan dihapus permanen.', confirmLabel: 'Hapus', danger: true });
    if (!ok) return;
    setBusyId(p.id);
    try {
      await deletePrayerRequest(p.id);
      await invalidate();
      toast('Pokok doa dihapus');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = requests.filter((p) => p.status === 'pending').length;
  const q = search.trim().toLowerCase();
  const visible = requests
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => !q || p.request.toLowerCase().includes(q) || p.requesterName.toLowerCase().includes(q));

  return (
    <AdminPanel title={`Pokok doa (${requests.length})`}
      description="Permohonan doa dari jemaat. Permohonan publik tampil di dinding doa setelah disetujui; permohonan khusus pengurus tidak pernah ditampilkan.">
      <ListToolbar title={pendingCount > 0 ? `${pendingCount} menunggu tinjauan` : 'Semua permohonan sudah ditinjau'}>
        <SearchBox value={search} onChange={setSearch} placeholder="Cari permohonan atau nama" label="Cari pokok doa" />
        <FilterSelect value={filter} onChange={(v) => setFilter(v as 'all' | PrayerStatus)} label="Filter status">
          <option value="pending">Menunggu tinjauan</option>
          <option value="approved">Tampil di dinding doa</option>
          <option value="answered">Terjawab</option>
          <option value="archived">Diarsipkan</option>
          <option value="all">Semua status</option>
        </FilterSelect>
      </ListToolbar>

      {isLoading ? <AdminEmpty>Memuat pokok doa…</AdminEmpty>
        : isError ? <AdminEmpty>Pokok doa gagal dimuat. Coba sinkronkan ulang.</AdminEmpty>
        : visible.length === 0 ? <AdminEmpty>Tidak ada pokok doa pada filter ini.</AdminEmpty>
        : (
          <ul aria-label="Daftar pokok doa" className="m-0 flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line p-0">
            {visible.map((p) => {
              const busy = busyId === p.id;
              return (
                <li key={p.id} className="flex flex-col gap-3 bg-surface px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[0.78rem] text-muted">
                      <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                      {p.isPrivate && <Badge tone="navy"><Lock size={11} aria-hidden="true" />Khusus pengurus</Badge>}
                      {p.isAnonymous && <Badge tone="neutral"><UserX size={11} aria-hidden="true" />Nama disembunyikan</Badge>}
                      <span>{formatWibTimestamp(p.createdAt).exact}</span>
                      {p.prayedCount > 0 && <span>· didoakan {p.prayedCount} kali</span>}
                    </div>
                    <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-ink">{p.request}</p>
                    <p className="mt-1 text-[0.84rem] text-muted">{p.requesterName || 'Tanpa nama'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {p.status === 'pending' && !p.isPrivate && (
                      <IconButton label="Setujui & tampilkan" disabled={busy} onClick={() => setStatus(p, 'approved', 'Ditampilkan di dinding doa')}><Check size={17} aria-hidden="true" /></IconButton>
                    )}
                    {p.status !== 'answered' && (
                      <IconButton label="Tandai terjawab" disabled={busy} onClick={() => setStatus(p, 'answered', 'Ditandai sebagai doa terjawab')}><CheckCheck size={17} aria-hidden="true" /></IconButton>
                    )}
                    {p.status !== 'archived' ? (
                      <IconButton label="Arsipkan" disabled={busy} onClick={() => setStatus(p, 'archived', 'Pokok doa diarsipkan')}><Archive size={16} aria-hidden="true" /></IconButton>
                    ) : (
                      <IconButton label="Kembalikan ke tinjauan" disabled={busy} onClick={() => setStatus(p, 'pending', 'Dikembalikan ke tinjauan')}><RotateCcw size={16} aria-hidden="true" /></IconButton>
                    )}
                    <IconButton label="Hapus" tone="danger" disabled={busy} onClick={() => remove(p)}><Trash2 size={16} aria-hidden="true" /></IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
    </AdminPanel>
  );
}
