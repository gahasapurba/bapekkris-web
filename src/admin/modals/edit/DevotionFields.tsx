import { useAdminPortal } from '../../AdminPortalContext';
import { Input, Textarea } from '../../../ui';

/** Fields of the edit dialog for `devotion` items. */
export default function DevotionFields() {
  const {
    editingItem,
    setEditingItem
  } = useAdminPortal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label htmlFor="ef-devotion-1" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Judul Renungan</label>
        <Input id="ef-devotion-1"
          type="text"
          value={editingItem.item.title || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
        />
      </div>
      <div>
        <label htmlFor="ef-devotion-2" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Referensi Nats</label>
        <Input id="ef-devotion-2"
          type="text"
          value={editingItem.item.scriptureRef || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, scriptureRef: e.target.value } })}
        />
      </div>
      <div>
        <label htmlFor="ef-devotion-3" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Isi Renungan</label>
        <Textarea id="ef-devotion-3"
          rows={5}
          value={editingItem.item.body || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, body: e.target.value } })}
        />
      </div>
    </div>
  );
}
