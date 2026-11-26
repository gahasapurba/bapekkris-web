import { Image as ImageIcon, Upload } from 'lucide-react';
import { Field, Input, Select, Textarea } from '../../../ui';
import { ASSET_CATEGORIES } from '../../tabs/AssetsTab';
import { FileButton, PendingFile } from '../../AdminUi';
import { useEditBinding } from './useEditBinding';

const ASSET_ACCEPT = '.zip,.rar,.7z,.pdf,.pptx,.ppt,.png,.jpg,.jpeg,.svg,.docx,.xlsx';

/** Fields of the edit dialog for `brand_asset` items. */
export default function BrandAssetFields() {
  const { bind, editingItem, handleBrandAssetUpload, item, set, setEditingItem } = useEditBinding();
  return (
    <div className="flex flex-col gap-4">
      <Field label="Judul" required><Input {...bind('title')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori">
          <Select value={item.category || 'Logo & Brand'} onChange={(e) => set({ category: e.target.value })}>
            {ASSET_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Label tambahan"><Input {...bind('badge')} /></Field>
        <Field label="Format"><Input {...bind('fileType')} /></Field>
        <Field label="Ukuran"><Input {...bind('fileSize')} /></Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[0.84rem] font-semibold text-muted">Berkas aset</span>
        <div className="flex flex-wrap items-center gap-2">
          <FileButton icon={<Upload size={15} aria-hidden="true" />} accept={ASSET_ACCEPT} onChange={(e) => handleBrandAssetUpload(e, 'fileUrl')}>
            {editingItem.pendingFile ? 'Ganti berkas' : 'Pilih berkas baru'}
          </FileButton>
          <Input className="min-w-0 flex-1" aria-label="Atau tempel URL berkas" placeholder="Atau tempel URL berkas" {...bind('fileUrl')} />
        </div>
        {editingItem.pendingFile && (
          <PendingFile onCancel={() => setEditingItem((prev) => prev ? { ...prev, pendingFile: null, item: { ...prev.item, fileUrl: prev.originalFileUrl || '' } } : null)}>
            Berkas baru <strong>{editingItem.pendingFile.name}</strong> ({item.fileSize}) diunggah saat Anda klik Simpan perubahan.
          </PendingFile>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[0.84rem] font-semibold text-muted">Gambar pratinjau (opsional)</span>
        <div className="flex flex-wrap items-center gap-2">
          {item.previewUrl && <img src={item.previewUrl} alt="" className="size-10 shrink-0 rounded-md border border-line object-cover" />}
          <FileButton icon={<ImageIcon size={15} aria-hidden="true" />} accept="image/*" onChange={(e) => handleBrandAssetUpload(e, 'previewUrl')}>
            {editingItem.pendingPreviewFile ? 'Ganti gambar' : 'Pilih gambar'}
          </FileButton>
          <Input className="min-w-0 flex-1" aria-label="Gambar pratinjau (opsional)" placeholder="URL gambar pratinjau" {...bind('previewUrl')} />
        </div>
        {editingItem.pendingPreviewFile && (
          <PendingFile onCancel={() => setEditingItem((prev) => prev ? { ...prev, pendingPreviewFile: null, item: { ...prev.item, previewUrl: '' } } : null)}>
            Pratinjau baru <strong>{editingItem.pendingPreviewFile.name}</strong> diunggah saat Anda klik Simpan perubahan.
          </PendingFile>
        )}
      </div>

      <Field label="Deskripsi"><Textarea rows={3} {...bind('description')} /></Field>
    </div>
  );
}
