import { useAdminPortal } from '../../AdminPortalContext';

/** Fields of the edit dialog for `devotion` items. */
export default function DevotionFields() {
  const {
    editingItem,
    setEditingItem
  } = useAdminPortal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Renungan</label>
        <input
          type="text"
          value={editingItem.item.title || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
        />
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Referensi Nats</label>
        <input
          type="text"
          value={editingItem.item.scriptureRef || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, scriptureRef: e.target.value } })}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
        />
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Isi Renungan</label>
        <textarea
          rows={5}
          value={editingItem.item.body || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, body: e.target.value } })}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
