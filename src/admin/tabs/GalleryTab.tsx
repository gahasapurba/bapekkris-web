import { Edit2, Image as ImageIcon, Link2, Plus, Trash2, X } from 'lucide-react';
import { formatLastUpdatedWib, formatWibDateTime } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select, Textarea } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, FileButton, FilterSelect, IconButton, ListToolbar, SearchBox } from '../AdminUi';
import { FlexibleDateField } from '../FlexibleDateField';
import { useAdminPortal } from '../AdminPortalContext';

const PER_PAGE = 8;

export default function GalleryTab() {
  const {
    activeTenure, addDocLinkField, adminGalleryPage, clearFieldError, divisions, events, formErrors, galDateMode, galDateVal, galDates, galDesc,
    galDivision, galDivisionId, galDocLinks, galEndDate, galEventId, galMonth, galPhotos, galStartDate, galTenureId, galTitle, galYear, galleries,
    galleryDivFilter, gallerySearchQuery, galleryTenureFilter, handleCreateGallery, handleDeleteGalleryClick, handlePhotoUpload, removeDocLinkField,
    removeUploadedPhoto, setAdminGalleryPage, setEditingItem, setFormErrors, setGalDateMode, setGalDateVal, setGalDates, setGalDesc, setGalDivision,
    setGalDivisionId, setGalEndDate, setGalEventId, setGalMonth, setGalPhotos, setGalStartDate, setGalTenureId, setGalTitle, setGalYear,
    setGalleryDivFilter, setGallerySearchQuery, setGalleryTenureFilter, tenures, updateDocLinkField, uploadedPhotos
  } = useAdminPortal();

  const tenureId = galTenureId || activeTenure?.id || '';
  const divsForTenure = divisions.filter((d: any) => d.tenureId === tenureId);
  const currentDivId = galDivisionId || divsForTenure.find((d: any) => d.name === galDivision)?.id || '';

  const q = gallerySearchQuery.trim().toLowerCase();
  const filtered = galleries.filter((g: any) => {
    const gTenure = g.tenureId || divisions.find((d: any) => d.id === g.divisionId || d.name === g.division)?.tenureId;
    return (!q || (g.title || '').toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q)) &&
      (galleryTenureFilter === 'all' || gTenure === galleryTenureFilter) &&
      (galleryDivFilter === 'all' || g.divisionId === galleryDivFilter || g.division === galleryDivFilter);
  });
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, adminGalleryPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminPanel title={`Galeri kegiatan (${galleries.length})`} description="Album foto kegiatan yang tampil di halaman Galeri, bisa dihubungkan ke acara dan diberi tautan folder dokumentasi lengkap.">
      <AdminSubsection title="Tambah album">
        <form onSubmit={handleCreateGallery} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Judul kegiatan" required error={formErrors.galTitle}>
            <Input placeholder="Contoh: Ibadah Paskah 2026" value={galTitle} onChange={(e) => { setGalTitle(e.target.value); clearFieldError('galTitle'); }} />
          </Field>
          <Field label="Periode" required>
            <Select value={tenureId} onChange={(e) => { setGalTenureId(e.target.value); setGalDivision(''); }}>
              {tenures.map((t: any) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <FlexibleDateField mode={galDateMode} onModeChange={setGalDateMode}
              value={{ date: galDateVal, dates: galDates, startDate: galStartDate, endDate: galEndDate, month: galMonth, year: galYear }}
              onChange={(p) => {
                if (p.date !== undefined) setGalDateVal(p.date);
                if (p.dates !== undefined) setGalDates(p.dates);
                if (p.startDate !== undefined) setGalStartDate(p.startDate);
                if (p.endDate !== undefined) setGalEndDate(p.endDate);
                if (p.month !== undefined) setGalMonth(p.month);
                if (p.year !== undefined) setGalYear(p.year);
              }} />
          </div>
          <Field label="Divisi penyelenggara" required error={formErrors.galDivision || (divsForTenure.length === 0 ? 'Belum ada divisi di periode ini. Buat dulu di menu Divisi.' : undefined)}>
            <Select value={currentDivId} disabled={divsForTenure.length === 0} onChange={(e) => {
              setGalDivisionId(e.target.value);
              setGalDivision(divsForTenure.find((d: any) => d.id === e.target.value)?.name || '');
              clearFieldError('galDivision');
            }}>
              <option value="">Pilih divisi</option>
              {divsForTenure.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Hubungkan ke acara" hint="Opsional. Album akan tampil di halaman acara tersebut.">
            <Select value={galEventId} onChange={(e) => setGalEventId(e.target.value)}>
              <option value="">Tidak terhubung</option>
              {(events || []).filter((ev: any) => !galTenureId || ev.tenureId === galTenureId).map((ev: any) => <option key={ev.id} value={ev.id}>{ev.title}{ev.date ? ` (${ev.date})` : ''}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Deskripsi" required error={formErrors.galDesc}>
              <Textarea rows={3} value={galDesc} onChange={(e) => { setGalDesc(e.target.value); clearFieldError('galDesc'); }} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <p className="text-[0.86rem] font-semibold text-ink">Foto <span className="text-danger" aria-hidden="true">*</span> <span className="font-normal text-muted">— unggah berkas, tempel tautan, atau keduanya</span></p>
            <div><FileButton icon={<ImageIcon size={15} aria-hidden="true" />} accept="image/*" multiple onChange={handlePhotoUpload}>Pilih foto (bisa banyak)</FileButton></div>
            {uploadedPhotos.length > 0 && (
              <ul className="flex list-none flex-wrap gap-2">
                {uploadedPhotos.map((src: string, i: number) => (
                  <li key={i} className="relative">
                    <img src={src} alt={`Foto ${i + 1}`} className="h-14 w-20 rounded-md border border-line object-cover" />
                    <button type="button" onClick={() => removeUploadedPhoto(i)} aria-label={`Hapus foto ${i + 1}`}
                      className="absolute -right-1.5 -top-1.5 inline-flex size-6 cursor-pointer items-center justify-center rounded-full border-0 bg-danger text-white"><X size={13} aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Tautan foto" error={formErrors.galPhotos} hint="Satu tautan per baris. Tautan diperiksa sebelum disimpan.">
              <Textarea rows={2} placeholder={'https://…/foto-1.jpg\nhttps://…/foto-2.png'} value={galPhotos}
                onChange={(e) => { setGalPhotos(e.target.value); if (formErrors.galPhotos && e.target.value.trim()) setFormErrors((prev: any) => ({ ...prev, galPhotos: null })); }} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-3 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-[0.88rem] font-semibold text-ink"><Link2 size={15} aria-hidden="true" className="text-gold-ink" />Folder dokumentasi lengkap</p>
              <Button type="button" size="sm" variant="secondary" icon={<Plus size={14} aria-hidden="true" />} onClick={addDocLinkField}>Tambah tautan</Button>
            </div>
            <p className="text-[0.82rem] text-muted">Google Drive, OneDrive, atau Teams, beserta teks tombolnya.</p>
            {galDocLinks.map((link: any, i: number) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                <Input aria-label={`Teks tombol ${i + 1}`} placeholder="Teks tombol, mis. Foto HD" value={link.text} onChange={(e) => updateDocLinkField(i, 'text', e.target.value)} />
                <Input type="url" aria-label={`Tautan ${i + 1}`} placeholder="https://drive.google.com/…" value={link.url} onChange={(e) => updateDocLinkField(i, 'url', e.target.value)} />
                {galDocLinks.length > 1 ? <IconButton label={`Hapus tautan ${i + 1}`} tone="danger" onClick={() => removeDocLinkField(i)}><Trash2 size={15} aria-hidden="true" /></IconButton> : <span className="hidden sm:block sm:w-9" />}
              </div>
            ))}
          </div>
          <div className="flex justify-end md:col-span-2"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Terbitkan album</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Arsip album <span className="font-normal text-muted">({filtered.length} dari {galleries.length})</span></>}>
          <SearchBox label="Cari album" placeholder="Cari judul atau deskripsi" value={gallerySearchQuery} onChange={(v) => { setGallerySearchQuery(v); setAdminGalleryPage(1); }} />
          <FilterSelect label="Saring periode" value={galleryTenureFilter} onChange={(v) => { setGalleryTenureFilter(v); setGalleryDivFilter('all'); setAdminGalleryPage(1); }}>
            <option value="all">Semua periode</option>
            {tenures.map((t: any) => <option key={t.id} value={t.id}>Periode {t.code || t.title}</option>)}
          </FilterSelect>
          <FilterSelect label="Saring divisi" value={galleryDivFilter} onChange={(v) => { setGalleryDivFilter(v); setAdminGalleryPage(1); }}>
            <option value="all">Semua divisi</option>
            {(galleryTenureFilter === 'all' ? divisions : divisions.filter((d: any) => d.tenureId === galleryTenureFilter)).map((d: any) => {
              const t = tenures.find((x: any) => x.id === d.tenureId);
              return <option key={d.id} value={d.id}>{d.name}{t ? ` (${t.code || t.title})` : ''}</option>;
            })}
          </FilterSelect>
        </ListToolbar>
        {filtered.length === 0 ? <AdminEmpty>{galleries.length === 0 ? 'Belum ada album.' : 'Tidak ada album yang cocok.'}</AdminEmpty> : (
          <ul className="flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
            {visible.map((g: any) => {
              const div = divisions.find((d: any) => d.id === g.divisionId)?.name || g.divisionName || g.division || 'Umum';
              const evt = g.eventId ? (events || []).find((e: any) => String(e.id) === String(g.eventId)) : null;
              const cover = Array.isArray(g.photos) && g.photos[0];
              return (
                <li key={g.id} className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {cover ? <img src={cover} alt="" className="h-12 w-16 shrink-0 rounded-md border border-line object-cover" /> : <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-subtle text-dim"><ImageIcon size={18} aria-hidden="true" /></span>}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{g.title}</p>
                      <p className="text-[0.82rem] text-muted">{formatWibDateTime(g.date)} · {div} · {g.photos?.length || 0} foto</p>
                      {g.eventId && <p className="text-[0.8rem] text-navy-ink">Acara: <strong>{evt?.title || g.eventId}</strong></p>}
                      {g.updatedAt && <p className="text-[0.74rem] text-dim">{formatLastUpdatedWib(g.updatedAt)}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge tone="success" className="hidden sm:inline-flex">Tampil</Badge>
                    <IconButton label={`Edit ${g.title}`} onClick={() => setEditingItem({ type: 'gallery', item: { ...g } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                    <IconButton label={`Hapus ${g.title}`} tone="danger" onClick={() => handleDeleteGalleryClick(g)}><Trash2 size={15} aria-hidden="true" /></IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setAdminGalleryPage} itemLabel="album" total={filtered.length} pageSize={PER_PAGE} />
      </div>
    </AdminPanel>
  );
}
