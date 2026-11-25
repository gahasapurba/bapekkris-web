import { useAdminPortal } from '../../AdminPortalContext';
import { Input, Textarea } from '../../../ui';

/** Fields of the edit dialog for `tenure` items. */
export default function TenureFields() {
  const {
    editingItem,
    setEditingItem
  } = useAdminPortal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-tenure-1" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Nama Kepengurusan <span style={{ color: '#f43f5e' }}>*</span></label>
          <Input id="ef-tenure-1"
            type="text"
            value={editingItem.item.title || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
          />
        </div>
        <div>
          <label htmlFor="ef-tenure-2" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Tagline Budaya</label>
          <Input id="ef-tenure-2"
            type="text"
            value={editingItem.item.themeTagline || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, themeTagline: e.target.value } })}
          />
        </div>
      </div>
      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-tenure-3" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Headline Hero</label>
          <Input id="ef-tenure-3"
            type="text"
            value={editingItem.item.heroHeadline || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, heroHeadline: e.target.value } })}
          />
        </div>
        <div>
          <label htmlFor="ef-tenure-4" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Highlight Hero</label>
          <Input id="ef-tenure-4"
            type="text"
            value={editingItem.item.heroHighlight || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, heroHighlight: e.target.value } })}
          />
        </div>
      </div>
      <div>
        <label htmlFor="ef-tenure-5" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Visi Bapekkris (Dinamis)</label>
        <Textarea id="ef-tenure-5"
          rows={3}
          value={editingItem.item.visi || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, visi: e.target.value } })}
        />
      </div>
      <div>
        <label htmlFor="ef-tenure-6" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Misi Bapekkris (1 baris per misi)</label>
        <Textarea id="ef-tenure-6"
          rows={4}
          placeholder="Tulis poin misi (satu baris per misi)..."
          value={editingItem.item.rawMisi !== undefined ? editingItem.item.rawMisi : (Array.isArray(editingItem.item.misi) ? editingItem.item.misi.join('\n') : (editingItem.item.misi || ''))}
          onChange={(e) => {
            const textVal = e.target.value;
            setEditingItem({
              ...editingItem,
              item: {
                ...editingItem.item,
                rawMisi: textVal,
                misi: textVal.split('\n').map(s => s.trim()).filter(Boolean)
              }
            });
          }}
        />
      </div>
    </div>
  );
}
