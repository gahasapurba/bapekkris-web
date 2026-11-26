import { Edit2, Image as ImageIcon, Link2, Plus, Trash2, X } from 'lucide-react';
import { buildFlexibleDate, formatLastUpdatedWib, formatWibDateTime, toWibIsoDate } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select, Textarea } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, FileButton, FilterSelect, IconButton, ListToolbar, SearchBox } from '../AdminUi';
import { FlexibleDateField, type FlexibleDateMode, type FlexibleDateValue } from '../FlexibleDateField';
import { useAdminPortal } from '../AdminPortalContext';
import { z } from 'zod';
import { uploadMediaToCloud } from '../../lib/supabase';
import { galleryCreateSchema } from '../validation/schemas';
import { useAdminDraftForm } from '../useAdminDraftForm';

type DocLink = { text: string; url: string };
type GalleryForm = {
  galTitle: string; galTenureId: string; galDateMode: FlexibleDateMode; galDate: FlexibleDateValue; galDivisionId: string; galEventId: string;
  galDesc: string; galPhotos: string; pendingGalFiles: File[]; uploadedPhotos: string[]; galDocLinks: DocLink[];
};
const DEFAULT_DOC_LINK: DocLink = { text: 'Folder Dokumentasi Full HD (Google Drive)', url: '' };

function emptyDate(): FlexibleDateValue {
  const today = toWibIsoDate();
  const inTwoDays = toWibIsoDate(new Date(Date.now() + 2 * 86400000));
  return { date: today, dates: [today, inTwoDays], startDate: today, endDate: today, month: today.slice(0, 7), year: today.slice(0, 4) };
}
const splitPhotoUrls = (text: string) => (text.trim() ? text.split(/[\n,]+/).map((u) => u.trim()).filter(Boolean) : []);

const PER_PAGE = 8;

export default function GalleryTab() {
  const {
    activeTenure, adminGalleryPage, divisions, events, galleries, galleryDivFilter, gallerySearchQuery, galleryTenureFilter,
    handleDeleteGalleryClick, onAddGallery, setAdminGalleryPage, setEditingItem, setGalleryDivFilter, setGallerySearchQuery, setGalleryTenureFilter,
    showToast, tenures, verifyImageUrl
  } = useAdminPortal();

  const divisionsOf = (tid: string) => divisions.filter((d) => d.tenureId === (tid || activeTenure?.id || ''));
  const { handleSubmit, field, watch, setValue, setError, clearErrors, resetToDefaults, formState: { errors, isSubmitting } } = useAdminDraftForm<GalleryForm>(
    'gallery',
    (v) => {
      const divs = divisionsOf(v.galTenureId);
      return z.preprocess(
        (x) => { const v = x as GalleryForm; return { ...v, photoUrlCount: splitPhotoUrls(v.galPhotos || '').length, pendingFileCount: (v.pendingGalFiles || []).length }; },
        galleryCreateSchema({ divisionCount: divs.length, hasSelectedDivision: divs.some((d) => d.id === v.galDivisionId) })
      );
    },
    {
      galTitle: '', galTenureId: activeTenure?.id || '', galDateMode: 'date', galDate: emptyDate(), galDivisionId: '', galEventId: '',
      galDesc: '', galPhotos: '', pendingGalFiles: [], uploadedPhotos: [], galDocLinks: [DEFAULT_DOC_LINK]
    }
  );
  const v = watch();
  const tenureId = v.galTenureId || activeTenure?.id || '';
  const divsForTenure = divisionsOf(v.galTenureId);

  const pickPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setValue('pendingGalFiles', [...v.pendingGalFiles, ...files]);
    setValue('uploadedPhotos', [...v.uploadedPhotos, ...files.map((f) => URL.createObjectURL(f))]);
    clearErrors('galPhotos');
    showToast(`${files.length} foto dipilih (akan diunggah saat Anda klik Publikasikan)`);
  };
  const removePhoto = (i: number) => {
    setValue('pendingGalFiles', v.pendingGalFiles.filter((_, idx) => idx !== i));
    setValue('uploadedPhotos', v.uploadedPhotos.filter((_, idx) => idx !== i));
  };
  const setDocLinks = (links: DocLink[]) => setValue('galDocLinks', links);

  const createGallery = handleSubmit(async (f) => {
    const targetTenureId = f.galTenureId || activeTenure?.id || '';
    const selectedDiv = divisionsOf(f.galTenureId).find((d) => d.id === f.galDivisionId);
    const urlPhotos = splitPhotoUrls(f.galPhotos);
    // Linked photos must be reachable images before the album is published
    if (urlPhotos.length > 0) {
      showToast('Memverifikasi tautan foto...');
      for (const u of urlPhotos) {
        const check = await verifyImageUrl(u);
        if (!check.valid) {
          setError('galPhotos', { message: `Tautan "${u}" tidak valid: ${check.error}` });
          showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
          return;
        }
      }
    }
    const cloudPhotos: string[] = [];
    if (f.pendingGalFiles.length > 0) {
      showToast(`Mengunggah ${f.pendingGalFiles.length} foto ke Cloud Storage...`);
      try {
        for (const file of f.pendingGalFiles) {
          const url = await uploadMediaToCloud(file, 'gallery');
          if (url) cloudPhotos.push(url);
        }
      } catch (err) {
        showToast('Gagal mengunggah foto galeri: ' + ((err as Error).message || 'Error'), 'error');
        return;
      }
    }
    onAddGallery({
      id: 'gal-' + Date.now(),
      tenureId: targetTenureId,
      divisionId: selectedDiv?.id || '',
      division: selectedDiv?.name || '',
      divisionName: selectedDiv?.name || '',
      eventId: f.galEventId || null,
      title: f.galTitle,
      date: buildFlexibleDate(f.galDateMode, f.galDate),
      description: f.galDesc,
      photos: [...cloudPhotos, ...urlPhotos],
      docLinks: f.galDocLinks.filter((l) => l.url.trim() && l.text.trim())
    });
    resetToDefaults();
    setValue('galDate', emptyDate());
    showToast(`Dokumentasi "${f.galTitle}" berhasil ditambahkan ke Galeri Kegiatan!`);
  }, () => showToast('Mohon lengkapi kolom wajib pada form Galeri', 'error'));

  const q = gallerySearchQuery.trim().toLowerCase();
  const filtered = galleries.filter((g) => {
    const gTenure = g.tenureId || divisions.find((d) => d.id === g.divisionId || d.name === g.division)?.tenureId;
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
        <form onSubmit={createGallery} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Judul kegiatan" required error={errors.galTitle?.message}>
            <Input placeholder="Contoh: Ibadah Paskah 2026" {...field('galTitle')} />
          </Field>
          <Field label="Periode" required>
            <Select value={tenureId} onChange={(e) => { setValue('galTenureId', e.target.value); setValue('galDivisionId', ''); }}>
              {tenures.map((t) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <FlexibleDateField mode={v.galDateMode} onModeChange={(m) => setValue('galDateMode', m)}
              value={v.galDate} onChange={(patch) => setValue('galDate', { ...v.galDate, ...patch })} />
          </div>
          <Field label="Divisi penyelenggara" required error={errors.galDivisionId?.message || (divsForTenure.length === 0 ? 'Belum ada divisi di periode ini. Buat dulu di menu Divisi.' : undefined)}>
            <Select value={v.galDivisionId} disabled={divsForTenure.length === 0} onChange={(e) => { setValue('galDivisionId', e.target.value); clearErrors('galDivisionId'); }}>
              <option value="">Pilih divisi</option>
              {divsForTenure.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Hubungkan ke acara" hint="Opsional. Album akan tampil di halaman acara tersebut.">
            <Select {...field('galEventId')}>
              <option value="">Tidak terhubung</option>
              {(events || []).filter((ev) => !v.galTenureId || ev.tenureId === v.galTenureId).map((ev) => <option key={ev.id} value={ev.id}>{ev.title}{ev.date ? ` (${ev.date})` : ''}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Deskripsi" required error={errors.galDesc?.message}>
              <Textarea rows={3} {...field('galDesc')} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <p className="text-[0.86rem] font-semibold text-ink">Foto <span className="text-danger" aria-hidden="true">*</span> <span className="font-normal text-muted">— unggah berkas, tempel tautan, atau keduanya</span></p>
            <div><FileButton icon={<ImageIcon size={15} aria-hidden="true" />} accept="image/*" multiple onChange={pickPhotos}>Pilih foto (bisa banyak)</FileButton></div>
            {v.uploadedPhotos.length > 0 && (
              <ul className="flex list-none flex-wrap gap-2">
                {v.uploadedPhotos.map((src: string, i: number) => (
                  <li key={i} className="relative">
                    <img src={src} alt={`Foto ${i + 1}`} className="h-14 w-20 rounded-md border border-line object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} aria-label={`Hapus foto ${i + 1}`}
                      className="absolute -right-1.5 -top-1.5 inline-flex size-6 cursor-pointer items-center justify-center rounded-full border-0 bg-danger text-white"><X size={13} aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Tautan foto" error={errors.galPhotos?.message} hint="Satu tautan per baris. Tautan diperiksa sebelum disimpan.">
              <Textarea rows={2} placeholder={'https://…/foto-1.jpg\nhttps://…/foto-2.png'} {...field('galPhotos')} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-3 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-[0.88rem] font-semibold text-ink"><Link2 size={15} aria-hidden="true" className="text-gold-ink" />Folder dokumentasi lengkap</p>
              <Button type="button" size="sm" variant="secondary" icon={<Plus size={14} aria-hidden="true" />} onClick={() => setDocLinks([...v.galDocLinks, { text: '', url: '' }])}>Tambah tautan</Button>
            </div>
            <p className="text-[0.82rem] text-muted">Google Drive, OneDrive, atau Teams, beserta teks tombolnya.</p>
            {v.galDocLinks.map((link: DocLink, i: number) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                <Input aria-label={`Teks tombol ${i + 1}`} placeholder="Teks tombol, mis. Foto HD" value={link.text} onChange={(e) => setDocLinks(v.galDocLinks.map((l, idx) => (idx === i ? { ...l, text: e.target.value } : l)))} />
                <Input type="url" aria-label={`Tautan ${i + 1}`} placeholder="https://drive.google.com/…" value={link.url} onChange={(e) => setDocLinks(v.galDocLinks.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l)))} />
                {v.galDocLinks.length > 1 ? <IconButton label={`Hapus tautan ${i + 1}`} tone="danger" onClick={() => setDocLinks(v.galDocLinks.filter((_, idx) => idx !== i))}><Trash2 size={15} aria-hidden="true" /></IconButton> : <span className="hidden sm:block sm:w-9" />}
              </div>
            ))}
          </div>
          <div className="flex justify-end md:col-span-2"><Button type="submit" loading={isSubmitting} icon={<Plus size={16} aria-hidden="true" />}>{isSubmitting ? 'Mengunggah…' : 'Terbitkan album'}</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Arsip album <span className="font-normal text-muted">({filtered.length} dari {galleries.length})</span></>}>
          <SearchBox label="Cari album" placeholder="Cari judul atau deskripsi" value={gallerySearchQuery} onChange={(v) => { setGallerySearchQuery(v); setAdminGalleryPage(1); }} />
          <FilterSelect label="Saring periode" value={galleryTenureFilter} onChange={(v) => { setGalleryTenureFilter(v); setGalleryDivFilter('all'); setAdminGalleryPage(1); }}>
            <option value="all">Semua periode</option>
            {tenures.map((t) => <option key={t.id} value={t.id}>Periode {t.code || t.title}</option>)}
          </FilterSelect>
          <FilterSelect label="Saring divisi" value={galleryDivFilter} onChange={(v) => { setGalleryDivFilter(v); setAdminGalleryPage(1); }}>
            <option value="all">Semua divisi</option>
            {(galleryTenureFilter === 'all' ? divisions : divisions.filter((d) => d.tenureId === galleryTenureFilter)).map((d) => {
              const t = tenures.find((x) => x.id === d.tenureId);
              return <option key={d.id} value={d.id}>{d.name}{t ? ` (${t.code || t.title})` : ''}</option>;
            })}
          </FilterSelect>
        </ListToolbar>
        {filtered.length === 0 ? <AdminEmpty>{galleries.length === 0 ? 'Belum ada album.' : 'Tidak ada album yang cocok.'}</AdminEmpty> : (
          <ul className="flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
            {visible.map((g) => {
              const div = divisions.find((d) => d.id === g.divisionId)?.name || g.divisionName || g.division || 'Umum';
              const evt = g.eventId ? (events || []).find((e) => String(e.id) === String(g.eventId)) : null;
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
