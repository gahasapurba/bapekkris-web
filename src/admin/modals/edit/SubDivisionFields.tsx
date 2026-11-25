import { useAdminPortal } from '../../AdminPortalContext';

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
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Sub-Divisi <span style={{ color: '#f43f5e' }}>*</span></label>
          <input
            type="text"
            value={editingItem.item.name || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
            placeholder="Contoh: Sie Multimedia / Sie Musik"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: isDark ? 'var(--input-bg)' : '#f8fafc', border: isDark ? '1px solid var(--input-border)' : '1px solid #cbd5e1', color: 'var(--text-main)', fontSize: '0.86rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kode Singkat</label>
          <input
            type="text"
            value={editingItem.item.code || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, code: e.target.value.toUpperCase() } })}
            placeholder="Contoh: MULTI"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: isDark ? 'var(--input-bg)' : '#f8fafc', border: isDark ? '1px solid var(--input-border)' : '1px solid #cbd5e1', color: 'var(--text-main)', fontSize: '0.86rem' }}
          />
        </div>
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Tugas / Lingkup Kerja (Opsional)</label>
        <textarea
          rows={3}
          value={editingItem.item.description || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
          placeholder="Deskripsi tugas atau tanggung jawab sub-divisi ini..."
          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: isDark ? 'var(--input-bg)' : '#f8fafc', border: isDark ? '1px solid var(--input-border)' : '1px solid #cbd5e1', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
