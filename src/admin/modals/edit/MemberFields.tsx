import { Upload } from 'lucide-react';
import { LEVEL_OPTIONS, getCategoryFromLevel, getTenureRoles } from '../../../utils/memberQuotaUtils';
import { Field, Input, Select, Textarea } from '../../../ui';
import { FileButton, PendingFile } from '../../AdminUi';
import { useEditBinding } from './useEditBinding';

/** Fields of the edit dialog for `member` items. */
export default function MemberFields() {
  const {
    activeTenure, bind, divisions, editModalError, editingItem, handleMemberPhotoUpload, item, roleQuotas, set,
    setEditModalError, setEditingItem, subDivisions, tenureRoles, tenures
  } = useEditBinding();

  const tenureId = item.tenureId || activeTenure?.id || '';
  const availableRoles = getTenureRoles(tenureId, roleQuotas, tenureRoles);
  const selectedRole = availableRoles.find((r) => r.id === item.roleId)
    || availableRoles.find((r) => String(r?.name || '').toLowerCase() === String(item.role || '').toLowerCase())
    || null;
  const requiresDivision = selectedRole ? selectedRole.requiresDivision : (item.category === 'anggota' || item.category === 'pimpro');
  const tenureDivisions = divisions.filter((d) => d.tenureId === tenureId);
  const divisionSubs = subDivisions.filter((sd) => sd.divisionId === item.divisionId);
  const responsibilitiesText = item.rawResponsibilities !== undefined ? item.rawResponsibilities : Array.isArray(item.responsibilities) ? item.responsibilities.join('\n') : '';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" required><Input {...bind('name')} /></Field>
        <Field label="Periode" required>
          <Select value={tenureId} onChange={(e) => {
            const next = e.target.value;
            const keepDivision = divisions.some((d) => d.tenureId === next && d.id === item.divisionId);
            set({ tenureId: next, divisionId: keepDivision ? item.divisionId : undefined });
          }}>
            {tenures.map((t) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
          </Select>
        </Field>

        <Field label="Jabatan" required
          error={availableRoles.length === 0 ? 'Periode ini belum memiliki role. Buat dulu di tab Role & jabatan.' : undefined}>
          <Select value={selectedRole?.id || ''} disabled={availableRoles.length === 0} onChange={(e) => {
            const role = availableRoles.find((r) => r.id === e.target.value);
            if (role) set({ roleId: role.id, role: role.name, category: getCategoryFromLevel(role.level), divisionId: role.requiresDivision ? item.divisionId : undefined });
          }}>
            <option value="">Pilih jabatan</option>
            {availableRoles.map((r) => {
              const level = LEVEL_OPTIONS.find((l) => l.level === r.level);
              return <option key={r.id} value={r.id}>{r.name} ({level?.shortLabel || `Level ${r.level}`} · {r.max > 0 ? `maks ${r.max}` : 'tanpa batas'}{r.requiresDivision ? ' · butuh divisi' : ''})</option>;
            })}
          </Select>
        </Field>

        {requiresDivision ? (
          <Field label="Divisi" required error={tenureDivisions.length === 0 ? 'Periode ini belum memiliki divisi.' : undefined}>
            <Select value={item.divisionId || ''} onChange={(e) => set({ divisionId: e.target.value || undefined, subDivisionId: undefined })}>
              <option value="">Pilih divisi</option>
              {tenureDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.84rem] font-semibold text-muted">Lingkup tugas</span>
            <p className="m-0 flex h-11 items-center rounded-md border border-line bg-subtle px-3.5 text-[0.9rem] text-muted">Lintas divisi</p>
          </div>
        )}

        {requiresDivision && selectedRole?.requiresSubDivision && (
          <Field label="Sub-divisi" required
            error={item.divisionId && divisionSubs.length === 0 ? 'Divisi ini belum memiliki sub-divisi. Buat dulu di tab Divisi.' : undefined}>
            <Select value={item.subDivisionId || ''} disabled={!item.divisionId || divisionSubs.length === 0}
              onChange={(e) => set({ subDivisionId: e.target.value || undefined })}>
              <option value="">{item.divisionId ? 'Pilih sub-divisi' : 'Pilih divisi terlebih dahulu'}</option>
              {divisionSubs.map((sd) => <option key={sd.id} value={sd.id}>{sd.name}{sd.code ? ` (${sd.code})` : ''}</option>)}
            </Select>
          </Field>
        )}

        <Field label="Nomor WhatsApp"><Input inputMode="tel" placeholder="Contoh: 08123456789" {...bind('whatsapp')} /></Field>
        <Field label="Motto"><Input placeholder="Contoh: Melayani dengan kasih" {...bind('motto')} /></Field>
      </div>

      <Field label="Tanggung jawab utama" hint="Satu poin per baris.">
        <Textarea rows={3} value={responsibilitiesText}
          onChange={(e) => set({ rawResponsibilities: e.target.value, responsibilities: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-[0.84rem] font-semibold text-muted">Foto profil</span>
        <div className="flex flex-wrap items-center gap-2">
          {item.image && <img src={item.image} alt="" className="size-11 shrink-0 rounded-full border-2 border-gold object-cover" />}
          <FileButton icon={<Upload size={15} aria-hidden="true" />} accept="image/*" onChange={handleMemberPhotoUpload}>
            {editingItem.pendingPhoto ? 'Ganti foto' : 'Pilih foto baru'}
          </FileButton>
          <Input className="min-w-0 flex-1" aria-label="URL foto (https://…)" placeholder="URL foto (https://…)" value={item.image || ''}
            onChange={(e) => { set({ image: e.target.value }); if (editModalError) setEditModalError(''); }} />
        </div>
        {editingItem.pendingPhoto && (
          <PendingFile onCancel={() => setEditingItem((prev) => prev ? { ...prev, pendingPhoto: null, item: { ...prev.item, image: '' } } : null)}>
            Foto baru <strong>{editingItem.pendingPhoto.name}</strong> diunggah saat Anda klik Simpan perubahan.
          </PendingFile>
        )}
      </div>
    </div>
  );
}
