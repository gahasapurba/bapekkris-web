import { Copy, Download, MessageCircle, Paperclip, Trash2 } from 'lucide-react';
import { formatWaPhone } from '../adminConstants';
import { formatWibTimestamp } from '../../utils/dateUtils';
import { Badge, Button, Input, Pagination, cn } from '../../ui';
import type { BadgeTone } from '../../ui/Badge';
import { AdminEmpty, AdminPanel, FilterSelect, IconButton, SearchBox } from '../AdminUi';
import { downloadCsv } from '../../utils/csv';
import { useAdminPortal } from '../AdminPortalContext';
import { getFormFields } from '../../utils/formMeta';
import { participantName } from '../../utils/participantInfo';
import type { FormField, SubmittedFile } from '../../types/content';
import type { AppItem } from '../../lib/supabase';

const PER_PAGE = 5;
const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  Submitted: { label: 'Baru masuk', tone: 'info' },
  Reviewed: { label: 'Ditinjau', tone: 'gold' },
  Interview: { label: 'Wawancara', tone: 'navy' },
  Accepted: { label: 'Diterima', tone: 'success' },
  Rejected: { label: 'Ditolak / arsip', tone: 'danger' }
};
const selectClass = 'h-9 cursor-pointer rounded-full border border-line bg-surface pl-3.5 pr-3 text-[0.84rem] font-medium text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink';

export default function SubmissionsTab() {
  const {
    applications, forms, luckyDraws, onDeleteSubmission, onUpdateSubmission, selectedSubFilter, setDeleteConfirm, setSelectedSubFilter,
    setSubCurrentPage, setSubSearchQuery, setSubStatusFilter, setSubTenureFilter, showToast, subCurrentPage, subSearchQuery, subStatusFilter,
    subTenureFilter, submissions, tenures
  } = useAdminPortal();

  const formOf = (s: AppItem) => forms.find((f) => f.id === s.formId);
  const formTitle = (s: AppItem) => formOf(s)?.title || 'Formulir';
  const formTenure = (s: AppItem) => formOf(s)?.tenureId || '';
  const labelFor = (k: string, schema: FormField[] = []) => {
    const m = schema.find((f) => f.id === k || f.id === `f-${k}`);
    if (m?.label) return m.label;
    for (const f of forms) { const x = getFormFields(f).find((fld) => fld.id === k || fld.id === `f-${k}`); if (x?.label) return x.label; }
    return k.replace(/^f-/, '').replace(/([A-Z])/g, ' $1').trim();
  };
  const phoneOf = (data: Record<string, unknown> = {}) => { for (const [k, v] of Object.entries(data)) if (/wa|whatsapp|phone|telp|hp/i.test(k) && v) return formatWaPhone(String(v)); return ''; };
  const nameOf = (s: AppItem) => participantName(s.data, getFormFields(formOf(s))) || 'Peserta';

  const q = subSearchQuery.trim().toLowerCase();
  const filtered = submissions.filter((s) =>
    (subTenureFilter === 'all' || formTenure(s) === subTenureFilter) &&
    (selectedSubFilter === 'all' || s.formId === selectedSubFilter) &&
    (subStatusFilter === 'all' || (s.status || 'Submitted') === subStatusFilter) &&
    (!q || (s.id || '').toLowerCase().includes(q) || JSON.stringify(s.data || {}).toLowerCase().includes(q) || formTitle(s).toLowerCase().includes(q) || (s.adminNotes || '').toLowerCase().includes(q)));
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, subCurrentPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const countOf = (st: string) => submissions.filter((s) => (s.status || 'Submitted') === st).length;

  const exportCsv = () => {
    if (filtered.length === 0) { showToast('Tidak ada data pengisian untuk diexport.', 'error'); return; }
    const keys = Array.from(new Set(filtered.flatMap((s) => s.data ? Object.keys(s.data) : ['fullName', 'nip', 'unitSquad', 'div1', 'div2', 'whatsapp', 'email', 'motivation']))) as string[];
    downloadCsv(`data_pengisian_form_bapekkris_${Date.now()}.csv`,
      ['ID Berkas', 'Judul Formulir', 'Status Seleksi', 'Catatan Admin', 'Waktu Submit', ...keys.map((k) => labelFor(k).toUpperCase() === k ? k : labelFor(k)), 'Lampiran File'],
      filtered.map((s) => [s.id, formTitle(s), s.status || 'Submitted', s.adminNotes || '', formatWibTimestamp(s.createdAt || s.submittedAt).exact || s.submittedAt || s.createdAt || '',
        ...keys.map((k) => (s.data ? s.data[k] ?? '' : s[k] ?? '')), s.files ? Object.values(s.files as Record<string, SubmittedFile>).map((f) => f.name).join('; ') : '']));
    showToast(`Berhasil mengunduh ${filtered.length} data pengisian ke CSV!`);
  };

  const pills = [{ id: 'all', label: 'Semua', n: submissions.length }, ...Object.entries(STATUS).map(([id, m]) => ({ id, label: m.label, n: countOf(id) }))];

  return (
    <AdminPanel title={`Data pendaftaran (${submissions.length + applications.length})`} description="Jawaban formulir dari pendaftar: ubah status seleksi, tambahkan catatan, hubungi lewat WhatsApp, atau unduh CSV."
      actions={<Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={exportCsv}>Ekspor CSV</Button>}>
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox className="sm:w-72" label="Cari pendaftar" placeholder="Cari nama, ID, NIP, divisi" value={subSearchQuery} onChange={(v) => { setSubSearchQuery(v); setSubCurrentPage(1); }} />
        <FilterSelect label="Saring periode" value={subTenureFilter} onChange={(v) => { setSubTenureFilter(v); setSelectedSubFilter('all'); setSubCurrentPage(1); }}>
          <option value="all">Semua periode</option>
          {tenures.map((t) => <option key={t.id} value={t.id}>Periode {t.code || t.title}</option>)}
        </FilterSelect>
        <FilterSelect label="Saring formulir" value={selectedSubFilter} onChange={(v) => { setSelectedSubFilter(v); setSubCurrentPage(1); }} className="max-w-[260px]">
          <option value="all">Semua formulir</option>
          {(subTenureFilter === 'all' ? forms : forms.filter((f) => f.tenureId === subTenureFilter)).map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
        </FilterSelect>
      </div>
      <div role="group" aria-label="Saring status" className="-mt-1 flex flex-wrap gap-1.5">
        {pills.map((p) => (
          <button key={p.id} type="button" aria-pressed={subStatusFilter === p.id} onClick={() => { setSubStatusFilter(p.id); setSubCurrentPage(1); }}
            className={cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[0.8rem] font-semibold',
              subStatusFilter === p.id ? 'border-action bg-action text-on-action' : 'border-line bg-surface text-muted hover:text-ink')}>
            {p.label}<span className="tabular-nums opacity-75">{p.n}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <AdminEmpty>{submissions.length === 0 ? 'Belum ada data pendaftaran.' : 'Tidak ada data yang cocok dengan filter.'}</AdminEmpty> : (
        <ul className="flex list-none flex-col gap-3">
          {visible.map((sub) => {
            const status = sub.status || 'Submitted';
            const meta = STATUS[status] || STATUS.Submitted;
            const name = nameOf(sub);
            const wa = phoneOf(sub.data);
            const title = formTitle(sub);
            const schema = getFormFields(formOf(sub));
            const keys = Object.keys(sub.data || {});
            const ordered = [...schema.map((f) => f.id).filter((id: string) => keys.includes(id)), ...keys.filter((k) => !schema.some((f) => f.id === k))];
            return (
              <li key={sub.id} className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">{name}<Badge tone={meta.tone}>{meta.label}</Badge></p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-muted">
                      <span>{title}</span>
                      <span>{formatWibTimestamp(sub.submittedAt || sub.createdAt).exact || sub.submittedAt}</span>
                      <button type="button" title="Salin ID pendaftaran" onClick={() => { navigator.clipboard?.writeText(sub.id); showToast(`ID Submission "${sub.id}" berhasil disalin!`); }}
                        className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-mono text-[0.78rem] text-gold-ink hover:underline"><Copy size={12} aria-hidden="true" />{sub.id}</button>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <select aria-label={`Status ${name}`} value={status} className={selectClass} onChange={(e) => {
                      onUpdateSubmission?.({ ...sub, status: e.target.value });
                      showToast(`Status berkas "${name}" diubah menjadi ${STATUS[e.target.value]?.label || e.target.value}`);
                    }}>
                      {Object.entries(STATUS).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
                    </select>
                    {wa && (
                      <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Halo ${name}, kami dari Pengurus Bapekkris Bank Mandiri ingin menindaklanjuti pendaftaran Anda pada "${title}".`)}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-success-line bg-success-tint px-3 text-[0.82rem] font-semibold text-success hover:border-success"><MessageCircle size={14} aria-hidden="true" />WhatsApp</a>
                    )}
                    {onDeleteSubmission && (
                      <IconButton label={`Hapus berkas ${name}`} tone="danger" onClick={() => {
                        const won = (luckyDraws || []).find((ld) => ld.submissionId === sub.id);
                        setDeleteConfirm(won
                          ? { type: 'submission', id: sub.id, name: `Berkas ${name}`, isBlocked: true, drawPrize: won.prizeName, drawnAt: won.drawnAt }
                          : { type: 'submission', id: sub.id, name: `Berkas ${name}` });
                      }}><Trash2 size={15} aria-hidden="true" /></IconButton>
                    )}
                  </div>
                </div>

                <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ordered.map((k: string) => {
                    const v = sub.data?.[k];
                    if (v === undefined || v === null || v === '') return null;
                    return (
                      <div key={k} className="min-w-0 rounded-md bg-subtle px-3 py-2">
                        <dt className="text-[0.74rem] font-semibold text-dim">{labelFor(k, schema)}</dt>
                        <dd className="break-words text-[0.88rem] font-medium text-ink">{typeof v === 'object' ? (v.name || JSON.stringify(v)) : String(v)}</dd>
                      </div>
                    );
                  })}
                </dl>
                {sub.files && Object.entries(sub.files as Record<string, SubmittedFile>).map(([k, f]) => (
                  <a key={k} href={f.dataUrl} download={f.name} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[0.86rem] font-semibold text-navy-ink hover:underline">
                    <Paperclip size={14} aria-hidden="true" />{f.name} ({f.size})
                  </a>
                ))}
                <Input aria-label={`Catatan pengurus untuk ${name}`} placeholder="Catatan pengurus, mis. jadwal wawancara Kamis 14.00 (tersimpan saat kolom ditinggalkan)" defaultValue={sub.adminNotes || ''}
                  onBlur={(e) => { const v = e.target.value.trim(); if (v !== (sub.adminNotes || '') && onUpdateSubmission) { onUpdateSubmission({ ...sub, adminNotes: v }); showToast('Catatan seleksi berhasil disimpan!'); } }} />
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} onChange={setSubCurrentPage} itemLabel="pendaftaran" total={filtered.length} pageSize={PER_PAGE} />
    </AdminPanel>
  );
}
