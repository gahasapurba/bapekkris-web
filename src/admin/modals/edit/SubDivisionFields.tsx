import { useAdminPortal } from '../../AdminPortalContext';
import { Input, Textarea } from '../../../ui';

/** Fields of the edit dialog for `sub_division` items. */
export default function SubDivisionFields() {
  const {
    editingItem,
    isDark,
    setEditingItem
  } = useAdminPortal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-subdivision-1" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Nama Sub-Divisi <span style={{ color: '#f43f5e' }}>*</span></label>
          <Input id="ef-subdivision-1"
            type="text"
            value={editingItem.item.name || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
            placeholder="Contoh: Sie Multimedia / Sie Musik"
          />
        </div>
        <div>
          <label htmlFor="ef-subdivision-2" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Kode Singkat</label>
          <Input id="ef-subdivision-2"
            type="text"
            value={editingItem.item.code || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, code: e.target.value.toUpperCase() } })}
            placeholder="Contoh: MULTI"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ef-subdivision-3" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Deskripsi Tugas / Lingkup Kerja (Opsional)</label>
        <Textarea id="ef-subdivision-3"
          rows={3}
          value={editingItem.item.description || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
          placeholder="Deskripsi tugas atau tanggung jawab sub-divisi ini..."
        />
      </div>
    </div>
  );
}
