import { Edit2, ExternalLink, Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select, Textarea } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, FileButton, FilterSelect, IconButton, ListToolbar, PendingFile, SearchBox } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';
import { uploadMediaToCloud } from '../../lib/supabase';
import { z } from 'zod';
import { brandAssetCreateSchema } from '../validation/schemas';
import { useAdminDraftForm } from '../useAdminDraftForm';

type AssetForm = {
  assetTitle: string; assetCategory: string; assetBadge: string; assetFileType: string; assetFileSize: string;
  assetFileUrl: string; assetPreviewUrl: string; assetDesc: string; pendingAssetFile: File | null; pendingPreviewFile: File | null;
};
const EMPTY_ASSET: AssetForm = {
  assetTitle: '', assetCategory: '', assetBadge: '', assetFileType: '', assetFileSize: '',
  assetFileUrl: '', assetPreviewUrl: '', assetDesc: '', pendingAssetFile: null, pendingPreviewFile: null
};
const isImageUrl = (url: string) => /\.(png|jpe?g|svg|webp|gif|avif)($|\?)/i.test(url) || (url || '').startsWith('data:image/');

const PER_PAGE = 9;
export const ASSET_CATEGORIES: [string, string][] = [['Logo & Brand', 'Logo & brand'], ['Template Presentasi', 'Template presentasi (PPT)'], ['Virtual Background', 'Virtual background (Teams / Zoom)'], ['Media & Publikasi', 'Media, twibbon & publikasi']];

export default function AssetsTab() {
  const {
    assetCatFilter, assetPage, assetSearchQuery, brandAssets, onAddBrandAsset, setAssetCatFilter, setAssetPage, setAssetSearchQuery,
    setDeleteConfirm, setEditingItem, showToast
  } = useAdminPortal();
  // The schema checks the typed URLs plus whether a file is waiting to be uploaded.
  const { handleSubmit, field, watch, setValue, getValues, clearErrors, resetToDefaults, formState: { errors, isSubmitting } } = useAdminDraftForm<AssetForm>(
    'asset',
    z.preprocess((x) => { const v = x as AssetForm; return { ...v, hasPendingAssetFile: Boolean(v.pendingAssetFile), hasPendingPreviewFile: Boolean(v.pendingPreviewFile) }; }, brandAssetCreateSchema),
    EMPTY_ASSET
  );
  const v = watch();

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>, target: 'file' | 'preview') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    if (target === 'preview') {
      setValue('pendingPreviewFile', file);
      setValue('assetPreviewUrl', blobUrl);
      showToast(`Gambar preview "${file.name}" dipilih`);
      return;
    }
    const sizeLabel = file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : (file.size / 1024).toFixed(0) + ' KB';
    setValue('pendingAssetFile', file);
    setValue('assetFileUrl', blobUrl);
    setValue('assetFileSize', sizeLabel);
    setValue('assetFileType', (file.name.split('.').pop() || 'FILE').toUpperCase());
    clearErrors(['assetFileUrl', 'assetFileType']);
    if (!getValues('assetTitle')) {
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setValue('assetTitle', clean.charAt(0).toUpperCase() + clean.slice(1));
    }
    if (!getValues('assetPreviewUrl') && /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(file.name)) {
      setValue('pendingPreviewFile', file);
      setValue('assetPreviewUrl', blobUrl);
    }
    showToast(`File "${file.name}" dipilih (akan diunggah saat Anda klik Simpan & Publikasikan)`);
  };

  const createAsset = handleSubmit(async (f) => {
    let fileUrl = f.assetFileUrl.trim();
    let previewUrl = f.assetPreviewUrl.trim();
    try {
      if (f.pendingAssetFile) {
        showToast(`Mengunggah file "${f.pendingAssetFile.name}" ke Cloud Storage...`);
        fileUrl = await uploadMediaToCloud(f.pendingAssetFile, 'assets');
      }
      if (f.pendingPreviewFile) {
        if (f.pendingPreviewFile === f.pendingAssetFile) previewUrl = fileUrl;
        else {
          showToast(`Mengunggah preview "${f.pendingPreviewFile.name}" ke Cloud Storage...`);
          previewUrl = await uploadMediaToCloud(f.pendingPreviewFile, 'assets');
        }
      }
    } catch (err) {
      showToast('Gagal mengunggah file ke Cloud Storage: ' + ((err as Error).message || 'Error jaringan'), 'error');
      return;
    }
    const effectiveFileUrl = fileUrl || (isImageUrl(previewUrl) ? previewUrl : '');
    const effectivePreviewUrl = previewUrl || (isImageUrl(fileUrl) ? fileUrl : '');
    if (!effectiveFileUrl) {
      showToast('Gagal: File asset atau URL download tidak boleh kosong. Silakan pilih berkas kembali.', 'error');
      return;
    }
    onAddBrandAsset?.({
      id: 'asset-' + Date.now(),
      title: f.assetTitle.trim(),
      category: f.assetCategory.trim(),
      badge: f.assetBadge.trim(),
      fileType: f.assetFileType.trim(),
      fileSize: f.assetFileSize.trim(),
      fileUrl: effectiveFileUrl,
      previewUrl: effectivePreviewUrl,
      description: f.assetDesc.trim()
    });
    resetToDefaults();
    showToast(`Asset "${f.assetTitle.trim()}" berhasil disimpan & dipublikasikan!`);
  }, () => showToast('Mohon lengkapi seluruh kolom wajib pada form Asset', 'error'));

  const q = assetSearchQuery.trim().toLowerCase();
  const filtered = brandAssets.filter((a) =>
    (!q || [a.title, a.description, a.badge, a.fileType].some((v) => String(v || '').toLowerCase().includes(q))) &&
    (assetCatFilter === 'all' || a.category === assetCatFilter));
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, assetPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminPanel title={`Aset & logo (${brandAssets.length})`} description="Logo, template presentasi, virtual background, dan dokumen panduan yang bisa diunduh di halaman Aset & Logo.">
      <AdminSubsection title="Tambah aset">
        <form onSubmit={createAsset} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Judul" required error={errors.assetTitle?.message}>
            <Input placeholder="Contoh: Template PPT Ibadah 2026" {...field('assetTitle')} />
          </Field>
          <Field label="Kategori" required error={errors.assetCategory?.message}>
            <Select {...field('assetCategory')}>
              <option value="">Pilih kategori</option>
              {ASSET_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Label tambahan" hint="Contoh: Official Asset, HD"><Input {...field('assetBadge')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Format" required error={errors.assetFileType?.message}>
              <Input placeholder="PNG / PPTX" {...field('assetFileType')} />
            </Field>
            <Field label="Ukuran"><Input placeholder="Otomatis" {...field('assetFileSize')} /></Field>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Field label="Berkas atau tautan unduhan" required error={errors.assetFileUrl?.message} hint="Pilih berkas dari komputer, atau tempel tautan (https://… atau /assets/…).">
              <Input placeholder="https://…" {...field('assetFileUrl')} />
            </Field>
            <div>
              <FileButton icon={<Upload size={15} aria-hidden="true" />} accept="*/*,.zip,.rar,.7z,.pdf,.pptx,.ppt,.png,.jpg,.jpeg,.svg,.docx,.xlsx" onChange={(e) => pickFile(e, 'file')}>
                {v.pendingAssetFile ? 'Ganti berkas' : 'Pilih berkas'}
              </FileButton>
            </div>
            {v.pendingAssetFile && (
              <PendingFile onCancel={() => { setValue('pendingAssetFile', null); setValue('assetFileUrl', ''); setValue('assetFileSize', ''); }}>
                <strong>{v.pendingAssetFile.name}</strong> ({v.assetFileSize}) akan diunggah saat disimpan.
              </PendingFile>
            )}
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Field label="Gambar pratinjau (opsional)" hint="Kosongkan jika sama dengan berkas.">
              <Input placeholder="https://…" {...field('assetPreviewUrl')} />
            </Field>
            <div>
              <FileButton icon={<ImageIcon size={15} aria-hidden="true" />} accept="image/*" onChange={(e) => pickFile(e, 'preview')}>
                {v.pendingPreviewFile ? 'Ganti pratinjau' : 'Pilih gambar pratinjau'}
              </FileButton>
            </div>
            {v.pendingPreviewFile && (
              <PendingFile onCancel={() => { setValue('pendingPreviewFile', null); setValue('assetPreviewUrl', ''); }}>
                Pratinjau <strong>{v.pendingPreviewFile.name}</strong> akan diunggah saat disimpan.
              </PendingFile>
            )}
          </div>

          <div className="md:col-span-2"><Field label="Deskripsi"><Textarea rows={2} placeholder="Kegunaan berkas atau template" {...field('assetDesc')} /></Field></div>
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" loading={isSubmitting} icon={<Plus size={16} aria-hidden="true" />}>{isSubmitting ? 'Mengunggah…' : 'Simpan aset'}</Button>
          </div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Katalog <span className="font-normal text-muted">({filtered.length} dari {brandAssets.length})</span></>}>
          <SearchBox label="Cari aset" placeholder="Cari judul atau format" value={assetSearchQuery} onChange={(v) => { setAssetSearchQuery(v); setAssetPage(1); }} />
          <FilterSelect label="Saring kategori" value={assetCatFilter} onChange={(v) => { setAssetCatFilter(v); setAssetPage(1); }}>
            <option value="all">Semua kategori</option>
            {ASSET_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </FilterSelect>
        </ListToolbar>
        {filtered.length === 0 ? <AdminEmpty>{brandAssets.length === 0 ? 'Belum ada aset.' : 'Tidak ada aset yang cocok.'}</AdminEmpty> : (
          <ul className="grid list-none gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="gold">{item.category || 'Logo & Brand'}</Badge>
                  <span className="font-mono text-[0.74rem] text-dim">{[item.fileType, item.fileSize].filter(Boolean).join(' · ')}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold leading-snug text-ink">{item.title}</p>
                  {item.description && <p className="mt-1 text-[0.84rem] leading-relaxed text-muted">{item.description}</p>}
                  {item.updatedAt && <p className="mt-1.5 text-[0.76rem] text-dim">{formatLastUpdatedWib(item.updatedAt)}</p>}
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2">
                  {item.fileUrl
                    ? <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[0.84rem] font-semibold text-navy-ink hover:underline"><ExternalLink size={13} aria-hidden="true" />Buka berkas</a>
                    : <span className="text-[0.84rem] text-dim">Belum ada berkas</span>}
                  <div className="flex items-center gap-1">
                    <IconButton label={`Edit ${item.title}`} onClick={() => setEditingItem({ type: 'brand_asset', item: { ...item } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                    <IconButton label={`Hapus ${item.title}`} tone="danger" onClick={() => setDeleteConfirm({ type: 'brand_asset', id: item.id, name: item.title })}><Trash2 size={15} aria-hidden="true" /></IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setAssetPage} itemLabel="aset" total={filtered.length} pageSize={PER_PAGE} />
      </div>
    </AdminPanel>
  );
}
