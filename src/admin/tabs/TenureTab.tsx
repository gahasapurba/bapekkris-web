import { Download, Edit2, Plus, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Textarea } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, FilterSelect, IconButton, ListToolbar, SearchBox } from '../AdminUi';
import { downloadCsv } from '../csv';
import { useAdminPortal } from '../AdminPortalContext';
import { tenureCreateSchema } from '../validation/schemas';
import { useAdminDraftForm } from '../useAdminDraftForm';
import type { AppItem } from '../../lib/supabase';

type TenureForm = { newTenureCode: string; newTenureTitle: string; newTenureTagline: string; newTenureHeadline: string; newTenureHighlight: string; newTenureVisi: string; newTenureMisi: string };
const EMPTY_TENURE: TenureForm = { newTenureCode: '', newTenureTitle: '', newTenureTagline: '', newTenureHeadline: '', newTenureHighlight: '', newTenureVisi: '', newTenureMisi: '' };

const PER_PAGE = 6;

export default function TenureTab() {
  const {
    activeTenure, handleDeleteTenureClick, onAddTenure, onSelectTenure, onUpdateTenure, setEditingItem, setTenurePage,
    setTenureSearchQuery, setTenureStatusFilter, showToast, tenurePage, tenureSearchQuery, tenureStatusFilter, tenures
  } = useAdminPortal();
  const { handleSubmit, field, resetToDefaults, formState: { errors } } = useAdminDraftForm<TenureForm>('tenure', tenureCreateSchema, EMPTY_TENURE);
  const createTenure = handleSubmit((v) => {
    onAddTenure({
      id: 'tenure-' + v.newTenureCode,
      code: v.newTenureCode,
      title: v.newTenureTitle.trim(),
      themeTagline: v.newTenureTagline.trim(),
      heroHeadline: v.newTenureHeadline.trim(),
      heroHighlight: v.newTenureHighlight.trim(),
      visi: v.newTenureVisi.trim(),
      misi: v.newTenureMisi ? v.newTenureMisi.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      isActive: false
    });
    resetToDefaults();
    showToast(`Periode Kepengurusan "${v.newTenureCode}" beserta Visi Misi berhasil dibuat!`);
  }, () => showToast('Mohon lengkapi field wajib (Kode Tahun & Nama Periode)', 'error'));

  const isActive = (t: AppItem) => activeTenure?.id === t.id || Boolean(t.isActive);
  const q = tenureSearchQuery.toLowerCase().trim();
  const filtered = (tenures || []).filter((t) =>
    (!q || [t.code, t.title, t.themeTagline, t.heroHeadline].some((v) => String(v || '').toLowerCase().includes(q))) &&
    (tenureStatusFilter === 'all' || (tenureStatusFilter === 'active' && isActive(t)) || (tenureStatusFilter === 'archived' && !isActive(t))));
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, tenurePage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () => {
    downloadCsv(`daftar_periode_bapekkris_${Date.now()}.csv`, ['ID Periode', 'Kode Tahun', 'Nama Periode', 'Tagline', 'Headline', 'Status'],
      tenures.map((t) => [t.id, t.code || '', t.title || '', t.themeTagline || '', t.heroHeadline || '', isActive(t) ? 'Aktif' : 'Arsip']));
    showToast('Data periode diunduh sebagai CSV.');
  };

  return (
    <AdminPanel title={`Periode kepengurusan (${tenures.length})`} description="Ganti tahun kepengurusan tanpa menghapus riwayat pengurus lama. Periode aktif menentukan isi beranda dan bagan organisasi."
      actions={tenures.length > 0 && <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={exportCsv}>Ekspor CSV</Button>}>
      <AdminSubsection title="Tambah periode">
        <form onSubmit={createTenure} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Kode tahun" required error={errors.newTenureCode?.message}>
            <Input placeholder="Contoh: 2027" {...field('newTenureCode')} />
          </Field>
          <Field label="Nama periode" required error={errors.newTenureTitle?.message}>
            <Input placeholder="Contoh: Kepengurusan 2026/2027" {...field('newTenureTitle')} />
          </Field>
          <div className="md:col-span-2"><Field label="Tema / tagline"><Input {...field('newTenureTagline')} /></Field></div>
          <Field label="Judul beranda"><Input {...field('newTenureHeadline')} /></Field>
          <Field label="Sorotan judul" hint="Bagian judul yang diberi warna aksen."><Input {...field('newTenureHighlight')} /></Field>
          <div className="md:col-span-2"><Field label="Visi"><Textarea rows={2} {...field('newTenureVisi')} /></Field></div>
          <div className="md:col-span-2"><Field label="Misi" hint="Satu butir misi per baris."><Textarea rows={3} {...field('newTenureMisi')} /></Field></div>
          <div className="flex justify-end md:col-span-2"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Tambah periode</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Daftar periode <span className="font-normal text-muted">({filtered.length} dari {tenures.length})</span></>}>
          <SearchBox label="Cari periode" placeholder="Cari kode, nama, atau tema" value={tenureSearchQuery} onChange={(v) => { setTenureSearchQuery(v); setTenurePage(1); }} />
          <FilterSelect label="Saring status" value={tenureStatusFilter} onChange={(v) => { setTenureStatusFilter(v); setTenurePage(1); }}>
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="archived">Arsip</option>
          </FilterSelect>
        </ListToolbar>
        {visible.length === 0 ? <AdminEmpty>Tidak ada periode yang cocok.</AdminEmpty> : (
          <ul className="flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
            {visible.map((t) => {
              const active = activeTenure?.id === t.id;
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">{t.title}<Badge tone={active ? 'gold' : 'neutral'}>{active ? 'Periode aktif' : 'Arsip'}</Badge><span className="font-mono text-[0.78rem] font-normal text-dim">{t.code}</span></p>
                    {t.themeTagline && <p className="mt-0.5 text-[0.86rem] text-muted">“{t.themeTagline}”</p>}
                    {t.updatedAt && <p className="mt-0.5 text-[0.76rem] text-dim">{formatLastUpdatedWib(t.updatedAt)}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!active && (
                      <Button size="sm" variant="secondary" onClick={() => { onSelectTenure?.(t); onUpdateTenure?.({ ...t, isActive: true }); showToast(`Periode "${t.title}" dijadikan periode aktif!`); }}>Jadikan aktif</Button>
                    )}
                    <IconButton label={`Edit ${t.title}`} onClick={() => setEditingItem({ type: 'tenure', item: { ...t, rawMisi: Array.isArray(t.misi) ? t.misi.join('\n') : (t.misi || '') } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                    <IconButton label={`Hapus ${t.title}`} tone="danger" onClick={() => handleDeleteTenureClick(t)}><Trash2 size={15} aria-hidden="true" /></IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setTenurePage} itemLabel="periode" total={filtered.length} pageSize={PER_PAGE} />
      </div>
    </AdminPanel>
  );
}
