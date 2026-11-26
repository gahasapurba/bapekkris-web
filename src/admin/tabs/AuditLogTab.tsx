import { useState } from 'react';
import { ChevronDown, ChevronUp, PencilLine, PlusCircle, Trash2 } from 'lucide-react';
import { Badge, Pagination } from '../../ui';
import { formatWibTimestamp } from '../../utils/dateUtils';
import {
  AUDIT_PAGE_SIZE, AUDIT_TABLE_LABELS, useAuditDetail, useAuditLog,
  type AuditAction, type AuditEntry, type AuditFilters
} from '../../lib/auditLog';
import { AdminEmpty, AdminPanel, FilterSelect, ListToolbar, SearchBox } from '../AdminUi';

const ACTIONS: Record<AuditAction, { label: string; tone: 'success' | 'info' | 'danger'; icon: typeof PlusCircle }> = {
  insert: { label: 'Tambah', tone: 'success', icon: PlusCircle },
  update: { label: 'Ubah', tone: 'info', icon: PencilLine },
  delete: { label: 'Hapus', tone: 'danger', icon: Trash2 }
};
const RANGES = [{ days: 1, label: '24 jam terakhir' }, { days: 7, label: '7 hari terakhir' }, { days: 30, label: '30 hari terakhir' }, { days: 90, label: '90 hari terakhir' }, { days: 0, label: 'Semua waktu' }];
const ROLE_LABELS: Record<string, string> = { super_admin: 'Super admin', division_admin: 'Admin divisi' };
/** Columns that only add noise to a change summary. */
const HIDDEN_COLUMNS = new Set(['updated_at', 'created_at']);

const tableLabel = (t: string) => AUDIT_TABLE_LABELS[t] || t;
const columnLabel = (c: string) => c.replace(/_/g, ' ');

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.length > 220 ? `${text.slice(0, 217)}…` : text;
}

function EntryDetail({ entry }: { entry: AuditEntry }) {
  const { data, isLoading, isError } = useAuditDetail(entry.id);
  if (isLoading) return <p className="text-[0.84rem] text-muted">Memuat rincian…</p>;
  if (isError || !data) return <p className="text-[0.84rem] text-danger">Rincian perubahan gagal dimuat.</p>;
  const rows = entry.action === 'update'
    ? entry.changedFields.map((c) => ({ column: c, before: data.oldData?.[c], after: data.newData?.[c] }))
    : Object.entries((entry.action === 'insert' ? data.newData : data.oldData) || {})
      .filter(([c, v]) => !HIDDEN_COLUMNS.has(c) && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
      .map(([column, value]) => ({ column, before: entry.action === 'delete' ? value : undefined, after: entry.action === 'insert' ? value : undefined }));
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[0.82rem]">
        <thead>
          <tr className="text-left text-[0.72rem] uppercase tracking-wide text-dim">
            <th scope="col" className="w-40 pb-1.5 pr-3 font-semibold">Kolom</th>
            {entry.action !== 'insert' && <th scope="col" className="pb-1.5 pr-3 font-semibold">{entry.action === 'update' ? 'Sebelum' : 'Data yang dihapus'}</th>}
            {entry.action !== 'delete' && <th scope="col" className="pb-1.5 font-semibold">{entry.action === 'update' ? 'Sesudah' : 'Data baru'}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.column} className="border-t border-line align-top">
              <th scope="row" className="py-1.5 pr-3 text-left font-medium text-muted">{columnLabel(r.column)}</th>
              {entry.action !== 'insert' && <td className="break-all py-1.5 pr-3 text-ink">{formatValue(r.before)}</td>}
              {entry.action !== 'delete' && <td className="break-all py-1.5 text-ink">{formatValue(r.after)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Super-admin view of who changed what (written by database triggers, cannot be edited). */
export default function AuditLogTab() {
  const [filters, setFilters] = useState<AuditFilters>({ table: 'all', action: 'all', days: 30, search: '', page: 1 });
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, isLoading, isError, isFetching } = useAuditLog(filters);
  const update = (patch: Partial<AuditFilters>) => { setFilters((f) => ({ ...f, page: 1, ...patch })); setOpenId(null); };
  const total = data?.total || 0;

  return (
    <AdminPanel title="Log aktivitas admin"
      description="Catatan otomatis setiap tambah, ubah, dan hapus data oleh admin: siapa, kapan, dan apa yang berubah. Dicatat oleh database sehingga tidak dapat diubah atau dihapus dari portal.">
      <ListToolbar title={isLoading ? 'Memuat…' : `${total} aktivitas${isFetching ? ' · memperbarui…' : ''}`}>
        <SearchBox value={filters.search} onChange={(search) => update({ search })} placeholder="Cari nama data atau email admin" label="Cari aktivitas" />
        <FilterSelect value={filters.table} onChange={(table) => update({ table })} label="Filter jenis data">
          <option value="all">Semua jenis data</option>
          {Object.entries(AUDIT_TABLE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </FilterSelect>
        <FilterSelect value={filters.action} onChange={(action) => update({ action: action as AuditFilters['action'] })} label="Filter aksi">
          <option value="all">Semua aksi</option>
          {(Object.keys(ACTIONS) as AuditAction[]).map((a) => <option key={a} value={a}>{ACTIONS[a].label}</option>)}
        </FilterSelect>
        <FilterSelect value={String(filters.days)} onChange={(v) => update({ days: Number(v) })} label="Rentang waktu">
          {RANGES.map((r) => <option key={r.days} value={r.days}>{r.label}</option>)}
        </FilterSelect>
      </ListToolbar>

      {isLoading ? <AdminEmpty>Memuat log aktivitas…</AdminEmpty>
        : isError ? <AdminEmpty>Log aktivitas gagal dimuat. Coba sinkronkan ulang.</AdminEmpty>
        : total === 0 ? <AdminEmpty>Belum ada aktivitas pada filter ini.</AdminEmpty>
        : (
          <ul aria-label="Daftar aktivitas admin" className="m-0 flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line p-0">
            {data?.entries.map((e) => {
              const action = ACTIONS[e.action];
              const Icon = action.icon;
              const open = openId === e.id;
              const time = formatWibTimestamp(e.occurredAt);
              return (
                <li key={e.id} className="bg-surface">
                  <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : e.id)}
                    className="flex w-full cursor-pointer items-start gap-3 border-0 bg-transparent px-4 py-3 text-left hover:bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink">
                    <Icon size={18} aria-hidden="true" className={`mt-0.5 shrink-0 ${e.action === 'delete' ? 'text-danger' : e.action === 'insert' ? 'text-success' : 'text-navy-ink'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-[0.78rem] text-muted">
                        <Badge tone={action.tone}>{action.label}</Badge>
                        <Badge tone="neutral">{tableLabel(e.table)}</Badge>
                        <span title={time.exact}>{time.relative}</span>
                      </span>
                      <span className="mt-1 block truncate text-[0.94rem] font-medium text-ink">{e.summary || '(tanpa nama)'}</span>
                      <span className="block text-[0.82rem] text-muted">
                        {e.actorEmail}{e.actorRole && ` · ${ROLE_LABELS[e.actorRole] || e.actorRole}`}
                        {e.action === 'update' && e.changedFields.length > 0 && ` · mengubah ${e.changedFields.map(columnLabel).join(', ')}`}
                      </span>
                    </span>
                    {open ? <ChevronUp size={16} aria-hidden="true" className="mt-1 shrink-0 text-dim" /> : <ChevronDown size={16} aria-hidden="true" className="mt-1 shrink-0 text-dim" />}
                  </button>
                  {open && (
                    <div className="border-t border-line bg-page px-4 py-3">
                      <p className="mb-2 text-[0.78rem] text-dim">{time.exact} · ID data {e.rowId || '—'}</p>
                      <EntryDetail entry={e} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      <Pagination page={filters.page} pageCount={Math.ceil(total / AUDIT_PAGE_SIZE)} total={total} pageSize={AUDIT_PAGE_SIZE} itemLabel="aktivitas"
        onChange={(page) => { setFilters((f) => ({ ...f, page })); setOpenId(null); }} />
    </AdminPanel>
  );
}
