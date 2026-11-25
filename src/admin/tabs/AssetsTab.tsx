import { Edit2, ExternalLink, Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select, Textarea } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, FileButton, FilterSelect, IconButton, ListToolbar, PendingFile, SearchBox } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

const PER_PAGE = 9;
const CATEGORIES: [string, string][] = [['Logo & Brand', 'Logo & brand'], ['Template Presentasi', 'Template presentasi (PPT)'], ['Virtual Background', 'Virtual background (Teams / Zoom)'], ['Media & Publikasi', 'Media, twibbon & publikasi']];

export default function AssetsTab() {
  const {
    assetBadge, assetCatFilter, assetCategory, assetDesc, assetFileSize, assetFileType, assetFileUrl, assetPage, assetPreviewUrl, assetSearchQuery, assetTitle,
    brandAssets, clearFieldError, formErrors, handleBrandAssetUpload, handleCreateBrandAsset, isUploadingMedia, pendingAssetFile, pendingPreviewFile,
    setAssetBadge, setAssetCatFilter, setAssetCategory, setAssetDesc, setAssetFileSize, setAssetFileType, setAssetFileUrl, setAssetPage, setAssetPreviewUrl,
    setAssetSearchQuery, setAssetTitle, setDeleteConfirm, setEditingItem, setPendingAssetFile, setPendingPreviewFile
  } = useAdminPortal();

  const q = assetSearchQuery.trim().toLowerCase();
  const filtered = brandAssets.filter((a: any) =>
    (!q || [a.title, a.description, a.badge, a.fileType].some((v) => String(v || '').toLowerCase().includes(q))) &&
    (assetCatFilter === 'all' || a.category === assetCatFilter));
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, assetPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminPanel title={`Aset & logo (${brandAssets.length})`} description="Logo, template presentasi, virtual background, dan dokumen panduan yang bisa diunduh di halaman Aset & Logo.">
      <AdminSubsection title="Tambah aset">
        <form onSubmit={handleCreateBrandAsset} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Judul" required error={formErrors.assetTitle}>
            <Input placeholder="Contoh: Template PPT Ibadah 2026" value={assetTitle} onChange={(e) => { setAssetTitle(e.target.value); clearFieldError('assetTitle'); }} />
          </Field>
          <Field label="Kategori" required error={formErrors.assetCategory}>
            <Select value={assetCategory} onChange={(e) => { setAssetCategory(e.target.value); clearFieldError('assetCategory'); }}>
              <option value="">Pilih kategori</option>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Label tambahan" hint="Contoh: Official Asset, HD"><Input value={assetBadge} onChange={(e) => setAssetBadge(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Format" required error={formErrors.assetFileType}>
              <Input placeholder="PNG / PPTX" value={assetFileType} onChange={(e) => { setAssetFileType(e.target.value); clearFieldError('assetFileType'); }} />
            </Field>
            <Field label="Ukuran"><Input placeholder="Otomatis" value={assetFileSize} onChange={(e) => setAssetFileSize(e.target.value)} /></Field>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Field label="Berkas atau tautan unduhan" required error={formErrors.assetFileUrl} hint="Pilih berkas dari komputer, atau tempel tautan (https://… atau /assets/…).">
              <Input placeholder="https://…" value={assetFileUrl} onChange={(e) => { setAssetFileUrl(e.target.value); clearFieldError('assetFileUrl'); }} />
            </Field>
            <div>
              <FileButton icon={<Upload size={15} aria-hidden="true" />} accept="*/*,.zip,.rar,.7z,.pdf,.pptx,.ppt,.png,.jpg,.jpeg,.svg,.docx,.xlsx" onChange={(e) => handleBrandAssetUpload(e, 'fileUrl', false)}>
                {pendingAssetFile ? 'Ganti berkas' : 'Pilih berkas'}
              </FileButton>
            </div>
            {pendingAssetFile && (
              <PendingFile onCancel={() => { setPendingAssetFile(null); setAssetFileUrl(''); setAssetFileSize(''); }}>
                <strong>{pendingAssetFile.name}</strong> ({assetFileSize}) akan diunggah saat disimpan.
              </PendingFile>
            )}
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Field label="Gambar pratinjau (opsional)" hint="Kosongkan jika sama dengan berkas.">
              <Input placeholder="https://…" value={assetPreviewUrl} onChange={(e) => setAssetPreviewUrl(e.target.value)} />
            </Field>
            <div>
              <FileButton icon={<ImageIcon size={15} aria-hidden="true" />} accept="image/*" onChange={(e) => handleBrandAssetUpload(e, 'previewUrl', false)}>
                {pendingPreviewFile ? 'Ganti pratinjau' : 'Pilih gambar pratinjau'}
              </FileButton>
            </div>
            {pendingPreviewFile && (
              <PendingFile onCancel={() => { setPendingPreviewFile(null); setAssetPreviewUrl(''); }}>
                Pratinjau <strong>{pendingPreviewFile.name}</strong> akan diunggah saat disimpan.
              </PendingFile>
            )}
          </div>

          <div className="md:col-span-2"><Field label="Deskripsi"><Textarea rows={2} placeholder="Kegunaan berkas atau template" value={assetDesc} onChange={(e) => setAssetDesc(e.target.value)} /></Field></div>
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" loading={isUploadingMedia} icon={<Plus size={16} aria-hidden="true" />}>{isUploadingMedia ? 'Mengunggah…' : 'Simpan aset'}</Button>
          </div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Katalog <span className="font-normal text-muted">({filtered.length} dari {brandAssets.length})</span></>}>
          <SearchBox label="Cari aset" placeholder="Cari judul atau format" value={assetSearchQuery} onChange={(v) => { setAssetSearchQuery(v); setAssetPage(1); }} />
          <FilterSelect label="Saring kategori" value={assetCatFilter} onChange={(v) => { setAssetCatFilter(v); setAssetPage(1); }}>
            <option value="all">Semua kategori</option>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </FilterSelect>
        </ListToolbar>
        {filtered.length === 0 ? <AdminEmpty>{brandAssets.length === 0 ? 'Belum ada aset.' : 'Tidak ada aset yang cocok.'}</AdminEmpty> : (
          <ul className="grid list-none gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item: any) => (
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
