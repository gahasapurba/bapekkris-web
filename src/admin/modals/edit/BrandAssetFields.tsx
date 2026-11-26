import { Image as ImageIcon, Upload } from 'lucide-react';
import { useAdminPortal } from '../../AdminPortalContext';
import { Input, Select, Textarea } from '../../../ui';

/** Fields of the edit dialog for `brand_asset` items. */
export default function BrandAssetFields() {
  const {
    editingItem,
    handleBrandAssetUpload,
    setEditingItem
  } = useAdminPortal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label htmlFor="ef-brandasset-1" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Judul Asset / Template</label>
        <Input id="ef-brandasset-1"
          type="text"
          value={editingItem.item.title || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
        />
      </div>
      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-brandasset-2" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Kategori</label>
          <Select id="ef-brandasset-2"
            value={editingItem.item.category || 'Logo & Brand'}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
          >
            <option value="Logo & Brand">Logo & Brand</option>
            <option value="Template Presentasi">Template Presentasi (PPT)</option>
            <option value="Virtual Background">Virtual Background (Teams / Zoom)</option>
            <option value="Media & Publikasi">Media, Twibbon & Publikasi</option>
          </Select>
        </div>
        <div>
          <label htmlFor="ef-brandasset-3" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Label Kategori Tambahan / Tag</label>
          <Input id="ef-brandasset-3"
            type="text"
            value={editingItem.item.badge || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, badge: e.target.value } })}
          />
        </div>
      </div>
      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-brandasset-4" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Format File</label>
          <Input id="ef-brandasset-4"
            type="text"
            value={editingItem.item.fileType || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileType: e.target.value } })}
          />
        </div>
        <div>
          <label htmlFor="ef-brandasset-5" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Ukuran File</label>
          <Input id="ef-brandasset-5"
            type="text"
            value={editingItem.item.fileSize || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileSize: e.target.value } })}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[0.86rem] font-semibold text-ink">File Asset / Template (Cloud Storage)</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(56, 189, 248, 0.14)',
            border: '1px solid var(--neon-cyan)',
            color: 'var(--neon-cyan)',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            <Upload size={13} />
            <span>{editingItem.pendingFile ? 'Ganti File Pilihan' : 'Pilih File Baru'}</span>
            <input
              type="file"
              accept="*/*,.zip,.rar,.7z,.pdf,.pptx,.ppt,.png,.jpg,.jpeg,.svg,.docx,.xlsx"
              onChange={(e) => handleBrandAssetUpload(e, 'fileUrl')}
              style={{ display: 'none' }}
            />
          </label>
          <Input className="min-w-0 flex-1"
            type="text"
            aria-label="Atau tempel URL file langsung" placeholder="Atau tempel URL file langsung"
            value={editingItem.item.fileUrl || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileUrl: e.target.value } })}
          />
        </div>
        {editingItem.pendingFile && (
          <div style={{
            marginTop: '6px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px dashed var(--neon-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-main)'
          }}>
            <span>File baru: <strong>{editingItem.pendingFile.name}</strong> ({editingItem.item.fileSize}) &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
            <button
              type="button"
              onClick={() => setEditingItem((prev: any) => prev ? ({ ...prev, pendingFile: null, item: { ...prev.item, fileUrl: prev.originalFileUrl || '' } }) : null)}
              style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕ Batalkan
            </button>
          </div>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Preview Thumbnail Gambar (Opsional)</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {editingItem.item.previewUrl && (
            <img src={editingItem.item.previewUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-card)' }} />
          )}
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 184, 0, 0.12)',
            border: '1px solid var(--mandiri-gold)',
            color: 'var(--mandiri-gold)',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            <ImageIcon size={13} />
            <span>{editingItem.pendingPreviewFile ? 'Ganti Preview' : 'Pilih Gambar'}</span>
            <input type="file" accept="image/*" onChange={(e) => handleBrandAssetUpload(e, 'previewUrl')} style={{ display: 'none' }} />
          </label>
          <Input className="min-w-0 flex-1"
            type="text"
            aria-label="URL Gambar Thumbnail" placeholder="URL Gambar Thumbnail..."
            value={editingItem.item.previewUrl || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, previewUrl: e.target.value } })}
          />
        </div>
        {editingItem.pendingPreviewFile && (
          <div style={{
            marginTop: '6px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 184, 0, 0.08)',
            border: '1px dashed var(--mandiri-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-main)'
          }}>
            <span>Preview baru: <strong>{editingItem.pendingPreviewFile.name}</strong> &bull; <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
            <button
              type="button"
              onClick={() => setEditingItem((prev: any) => prev ? ({ ...prev, pendingPreviewFile: null, item: { ...prev.item, previewUrl: '' } }) : null)}
              style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕ Batalkan
            </button>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="ef-brandasset-6" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Deskripsi</label>
        <Textarea id="ef-brandasset-6"
          rows={3}
          value={editingItem.item.description || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
        />
      </div>
    </div>
  );
}
