import { useEditDialogContext } from '../../AdminPortalContext';
import { Input, Select, Textarea } from '../../../ui';

/** Fields of the edit dialog for `division` items. */
export default function DivisionFields() {
  const {
    activeTenure,
    divisions,
    editingItem,
    setEditingItem,
    tenures
  } = useEditDialogContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-division-1" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Nama Divisi</label>
          <Input id="ef-division-1"
            type="text"
            value={editingItem.item.name || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
          />
        </div>
        <div>
          <label htmlFor="ef-division-2" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Periode Kepengurusan</label>
          <Select id="ef-division-2"
            value={editingItem.item.tenureId || activeTenure?.id || ''}
            onChange={(e) => {
              const newTenure = e.target.value;
              const validDivs = divisions.filter(d => d.tenureId === newTenure);
              const keepDiv = validDivs.some(d => d.id === editingItem.item.divisionId);
              setEditingItem({
                ...editingItem,
                item: {
                  ...editingItem.item,
                  tenureId: newTenure,
                  divisionId: keepDiv ? editingItem.item.divisionId : undefined
                }
              });
            }}
          >
            {tenures.map(t => (
              <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-division-3" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Status Rekrutmen Divisi (Publik)</label>
          <Select id="ef-division-3"
            value={Boolean(editingItem.item.isRecruiting) ? 'open' : 'closed'}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, isRecruiting: e.target.value === 'open' } })}
          >
            <option value="open">● Membuka Rekrutmen (Rekrutmen Buka)</option>
            <option value="closed">○ Ditutup (Badge Hilang di Web)</option>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Warna Identitas Divisi</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input aria-label="Pilih warna divisi"
              type="color"
              value={editingItem.item.color || '#0284c7'}
              onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, color: e.target.value } })}
              style={{ width: '40px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
            <Input aria-label="Kode warna divisi (hex)" className="min-w-0 flex-1"
              type="text"
              value={editingItem.item.color || '#0284c7'}
              onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, color: e.target.value } })}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="ef-division-4" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Motto Divisi</label>
        <Input id="ef-division-4"
          type="text"
          value={editingItem.item.motto || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, motto: e.target.value } })}
        />
      </div>

      <div>
        <label htmlFor="ef-division-5" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Deskripsi Peran</label>
        <Textarea id="ef-division-5"
          rows={3}
          value={editingItem.item.description || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
        />
      </div>

      <div>
        <label htmlFor="ef-division-6" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Fokus Area (Pisahkan dengan koma)</label>
        <Input id="ef-division-6"
          type="text"
          value={editingItem.item.rawFocusAreas !== undefined ? editingItem.item.rawFocusAreas : (Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas.join(', ') : '')}
          onChange={(e) => {
            const textVal = e.target.value;
            const parsed = textVal.split(',').map(s => s.trim()).filter(Boolean);
            setEditingItem({
              ...editingItem,
              item: {
                ...editingItem.item,
                rawFocusAreas: textVal,
                focusAreas: parsed
              }
            });
          }}
          placeholder="Contoh: Internal Engagement, Wellness, Learning"
        />
        <div style={{ marginTop: '5px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          {Array.isArray(editingItem.item.focusAreas) && editingItem.item.focusAreas.length > 0 ? (
            <span>Fokus aktif ({editingItem.item.focusAreas.length}): <strong style={{ color: 'var(--neon-cyan)' }}>{editingItem.item.focusAreas.join(' • ')}</strong></span>
          ) : (
            <span>Ketik fokus area dipisahkan koma (contoh: <code>Internal Engagement, Wellness, Learning</code>)</span>
          )}
        </div>
      </div>
    </div>
  );
}
