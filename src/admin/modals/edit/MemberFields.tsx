import { LEVEL_OPTIONS, getCategoryFromLevel, getTenureRoles } from '../../../utils/memberQuotaUtils';
import { Upload } from 'lucide-react';
import { useAdminPortal } from '../../AdminPortalContext';
import { Input, Select, Textarea } from '../../../ui';

/** Fields of the edit dialog for `member` items. */
export default function MemberFields() {
  const {
    activeTenure,
    divisions,
    editModalError,
    editingItem,
    handleMemberPhotoUpload,
    roleQuotas,
    setEditModalError,
    setEditingItem,
    subDivisions,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-member-1" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Nama Lengkap <span style={{ color: '#f43f5e' }}>*</span></label>
          <Input id="ef-member-1"
            type="text"
            value={editingItem.item.name || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
          />
        </div>
        <div>
          <label htmlFor="ef-member-2" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Periode Kepengurusan <span style={{ color: '#f43f5e' }}>*</span></label>
          <Select id="ef-member-2"
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

      {/* ROLE & DIVISI SELECTION IN EDIT MODAL */}
      {(() => {
        const editMemberTenureId = editingItem.item.tenureId || activeTenure?.id || '';
        const availableRoles = getTenureRoles(editMemberTenureId, roleQuotas, tenureRoles);
        const selectedRole = availableRoles.find(r => r.id === editingItem.item.roleId) ||
          availableRoles.find(r => String(r?.name || '').toLowerCase() === String(editingItem.item.role || '').toLowerCase()) ||
          null;
        const requiresDiv = selectedRole ? selectedRole.requiresDivision : (editingItem.item.category === 'anggota' || editingItem.item.category === 'pimpro');
        const editMemberDivs = divisions.filter(d => d.tenureId === editMemberTenureId);

        return (
          <div className="mobile-two-col" style={{ gap: '10px' }}>
            <div>
              <label htmlFor="ef-member-3" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
                Jabatan / Role <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <Select id="ef-member-3"
                value={selectedRole?.id || ''}
                onChange={(e) => {
                  const rId = e.target.value;
                  const rObj = availableRoles.find(r => r.id === rId);
                  if (rObj) {
                    const newCat = getCategoryFromLevel(rObj.level);
                    setEditingItem({
                      ...editingItem,
                      item: {
                        ...editingItem.item,
                        roleId: rObj.id,
                        role: rObj.name,
                        category: newCat,
                        divisionId: rObj.requiresDivision ? editingItem.item.divisionId : undefined
                      }
                    });
                  }
                }}
              >
                {availableRoles.length === 0 ? (
                  <option value="" disabled>-- Role kepengurusan masih kosong di periode ini. Silakan buat role baru di menu Kelola Role & Jabatan --</option>
                ) : (
                  <>
                    <option value="">-- Pilih Jabatan / Role --</option>
                    {availableRoles.map((r) => {
                      const levelInfo = LEVEL_OPTIONS.find(l => l.level === r.level);
                      const quotaText = r.max > 0 ? `Maks ${r.max}` : 'Unlimited';
                      const divText = r.requiresDivision ? ' • Butuh Divisi' : '';
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} ({levelInfo?.shortLabel || `Level ${r.level}`} • {quotaText}{divText})
                        </option>
                      );
                    })}
                  </>
                )}
              </Select>
              {availableRoles.length === 0 && (
                <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                  <strong>Role kepengurusan masih kosong</strong> pada periode kepengurusan ini. Silakan buat role baru terlebih dahulu di menu <strong>Kelola Role & Jabatan</strong>.
                </div>
              )}
            </div>

            {requiresDiv ? (
              <div>
                <label htmlFor="ef-member-4" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
                  Divisi Penugasan <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <Select id="ef-member-4"
                  value={editingItem.item.divisionId || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, divisionId: e.target.value || undefined } })}
                >
                  <option value="">-- Pilih Divisi --</option>
                  {editMemberDivs.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
                {editMemberDivs.length === 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '3px' }}>
                    Periode ini belum memiliki divisi.
                  </span>
                )}
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
                  Lingkup Tugas
                </label>
                <div style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Lintas Divisi / Tidak Memerlukan Divisi Khusus
                </div>
              </div>
            )}


            {requiresDiv && selectedRole?.requiresSubDivision ? (
              <div>
                <label htmlFor="ef-member-sub" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">
                  Sub-Divisi Penugasan <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                {(() => {
                  const curDivId = editingItem.item.divisionId;
                  const availableSubs = subDivisions.filter(sd => sd.divisionId === curDivId);
                  return (
                    <>
                      <Select id="ef-member-sub"
                        value={editingItem.item.subDivisionId || ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item, subDivisionId: e.target.value || undefined }
                        })}
                        disabled={!curDivId}
                      >
                        {!curDivId ? (
                          <option value="" disabled>-- Pilih Divisi terlebih dahulu --</option>
                        ) : availableSubs.length === 0 ? (
                          <option value="" disabled>-- Belum ada sub-divisi di divisi ini. Buat di tab Kelola Divisi --</option>
                        ) : (
                          <>
                            <option value="">-- Pilih Sub-Divisi --</option>
                            {availableSubs.map(sd => (
                              <option key={sd.id} value={sd.id}>{sd.name} {sd.code ? `(${sd.code})` : ''}</option>
                            ))}
                          </>
                        )}
                      </Select>
                      {curDivId && availableSubs.length === 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '4px' }}>
                          Divisi ini belum memiliki sub-divisi. Buat terlebih dahulu di tab Kelola Divisi.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : null}                    </div>
        );
      })()}

      <div className="mobile-two-col" style={{ gap: '10px' }}>
        <div>
          <label htmlFor="ef-member-5" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Nomor WhatsApp (Opsional)</label>
          <Input id="ef-member-5"
            type="text"
            placeholder="Contoh: 08123456789 atau 628123456789"
            value={editingItem.item.whatsapp || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, whatsapp: e.target.value } })}
          />
        </div>
        <div>
          <label htmlFor="ef-member-6" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Motto / Pesan Semangat (Opsional)</label>
          <Input id="ef-member-6"
            type="text"
            placeholder="Contoh: Siap melayani dengan integritas dan kasih sesama insan Mandiri"
            value={editingItem.item.motto || ''}
            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, motto: e.target.value } })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ef-member-7" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Tanggung Jawab Utama (1 baris per poin)</label>
        <Textarea id="ef-member-7"
          rows={3}
          placeholder="Tulis tanggung jawab utama (satu poin per baris)..."
          value={editingItem.item.rawResponsibilities !== undefined ? editingItem.item.rawResponsibilities : (Array.isArray(editingItem.item.responsibilities) ? editingItem.item.responsibilities.join('\n') : '')}
          onChange={(e) => {
            const textVal = e.target.value;
            setEditingItem({
              ...editingItem,
              item: {
                ...editingItem.item,
                rawResponsibilities: textVal,
                responsibilities: textVal.split('\n').map(s => s.trim()).filter(Boolean)
              }
            });
          }}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Foto Profil Personel (Cloud Storage)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {editingItem.item.image && (
            <img
              src={editingItem.item.image}
              alt="Avatar"
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mandiri-gold)' }}
            />
          )}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid var(--neon-cyan)',
              color: 'var(--neon-cyan)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Upload size={13} />
            <span>{editingItem.pendingPhoto ? 'Ganti Foto Pilihan' : 'Pilih Foto Baru'}</span>
            <input type="file" accept="image/*" onChange={(e) => handleMemberPhotoUpload(e, true)} style={{ display: 'none' }} />
          </label>
          <Input className="min-w-0 flex-1"
            type="text"
            aria-label="URL Foto (https://...)" placeholder="URL Foto (https://...)"
            value={editingItem.item.image || ''}
            onChange={(e) => {
              setEditingItem({ ...editingItem, item: { ...editingItem.item, image: e.target.value } });
              if (editModalError) setEditModalError('');
            }}
          />
        </div>
        {editingItem.pendingPhoto && (
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
            <span>Foto baru: <strong>{editingItem.pendingPhoto.name}</strong> &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
            <button
              type="button"
              onClick={() => setEditingItem((prev: any) => prev ? ({ ...prev, pendingPhoto: null, item: { ...prev.item, image: '' } }) : null)}
              style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕ Batalkan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
