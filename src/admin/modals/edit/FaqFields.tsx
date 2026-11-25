import { useAdminPortal } from '../../AdminPortalContext';

/** Fields of the edit dialog for `faq` items. */
export default function FaqFields() {
  const {
    editingItem,
    setEditingItem
  } = useAdminPortal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Topik</label>
        <select
          value={editingItem.item.category || 'Umum'}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
        >
          <option value="Tentang Bapekkris">Tentang Bapekkris</option>
          <option value="Kegiatan & Event">Kegiatan & Event</option>
          <option value="Pelayanan & Operasional">Pelayanan & Operasional</option>
          <option value="Doa & Pelayanan Kasih">Doa & Pelayanan Kasih</option>
          <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
          <option value="Umum">Umum</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pertanyaan (Question)</label>
        <input
          type="text"
          value={editingItem.item.question || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, question: e.target.value } })}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
        />
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Jawaban Lengkap (Answer)</label>
        <textarea
          rows={4}
          value={editingItem.item.answer || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, answer: e.target.value } })}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
        />
      </div>
    </div>
  );
}
