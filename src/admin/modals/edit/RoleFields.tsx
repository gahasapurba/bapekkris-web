import { LEVEL_OPTIONS, formatLevelOptionLabel } from '../../../utils/memberQuotaUtils';
import { useAdminPortal } from '../../AdminPortalContext';
import { Input, Select } from '../../../ui';

/** Fields of the edit dialog for `role` items. */
export default function RoleFields() {
  const {
    activeTenure,
    editingItem,
    setEditingItem,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label htmlFor="ef-role-1" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
          Nama Jabatan / Role <span style={{ color: '#f43f5e' }}>*</span>
        </label>
        <Input id="ef-role-1"
          type="text"
          value={editingItem.item.name || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
          placeholder="Contoh: Sekretaris Jenderal"
        />
      </div>

      <div>
        <label htmlFor="ef-role-2" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
          Periode Kepengurusan
        </label>
        <Select id="ef-role-2"
          value={editingItem.item.tenureId || activeTenure?.id || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, tenureId: e.target.value } })}
        >
          {tenures.map(t => (
            <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="ef-role-3" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
          Tingkatan di Bagan Organigram
        </label>
        <Select id="ef-role-3"
          value={editingItem.item.level ?? 5}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, level: Number(e.target.value) } })}
        >
          {LEVEL_OPTIONS.map(lvl => (
            <option key={lvl.level} value={lvl.level}>
              {formatLevelOptionLabel(lvl, tenureRoles, editingItem.item.tenureId || activeTenure?.id || tenures[0]?.id)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="ef-role-4" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
          Batas Maksimal Kuota Personel (0 = Tanpa Batas / Unlimited)
        </label>
        <Input id="ef-role-4"
          type="number"
          min="0"
          max="100"
          value={editingItem.item.max ?? editingItem.item.maxQuota ?? 0}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            setEditingItem({ ...editingItem, item: { ...editingItem.item, max: val, maxQuota: val } });
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-card)'
      }}>
        <input
          type="checkbox"
          id="editRoleRequireDiv"
          checked={Boolean(editingItem.item.requiresDivision)}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, requiresDivision: e.target.checked } })}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <label htmlFor="editRoleRequireDiv" style={{ fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer' }}>
          <strong>Memerlukan Pilihan Divisi</strong> (Personel dengan role ini wajib memilih divisi)
        </label>

        </div>

        {Boolean(editingItem.item.requiresDivision) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px', paddingTop: '6px', borderTop: '1px dashed var(--border-card)' }}>
            <input
              type="checkbox"
              id="editRoleRequireSubDiv"
              checked={Boolean(editingItem.item.requiresSubDivision)}
              onChange={(e) => setEditingItem({
                ...editingItem,
                item: {
                  ...editingItem.item,
                  requiresSubDivision: e.target.checked
                }
              })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="editRoleRequireSubDiv" style={{ fontSize: '0.82rem', color: 'var(--mandiri-gold)', cursor: 'pointer' }}>
              <strong>Memerlukan Pilihan Sub-Divisi Juga</strong> (Wajib memilih sub-divisi)
            </label>
          </div>
        )}
    </div>
  );
}
