import { LEVEL_OPTIONS, formatLevelOptionLabel } from '../../../utils/memberQuotaUtils';
import { Field, Input, Select } from '../../../ui';
import { CheckField } from '../../AdminUi';
import { useEditBinding } from './useEditBinding';

/** Fields of the edit dialog for `role` items. */
export default function RoleFields() {
  const { activeTenure, bind, item, set, tenureRoles, tenures } = useEditBinding();
  const tenureId = item.tenureId || activeTenure?.id || tenures[0]?.id || '';
  return (
    <div className="flex flex-col gap-4">
      <Field label="Nama jabatan / role" required><Input placeholder="Contoh: Sekretaris" {...bind('name')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Periode kepengurusan">
          <Select value={tenureId} onChange={(e) => set({ tenureId: e.target.value })}>
            {tenures.map((t) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
          </Select>
        </Field>
        <Field label="Tingkat di bagan organisasi">
          <Select value={item.level ?? 5} onChange={(e) => set({ level: Number(e.target.value) })}>
            {LEVEL_OPTIONS.map((lvl) => <option key={lvl.level} value={lvl.level}>{formatLevelOptionLabel(lvl, tenureRoles, tenureId)}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Kuota maksimal personel" hint="0 berarti tanpa batas.">
        <Input type="number" min="0" max="100" value={item.max ?? item.maxQuota ?? 0}
          onChange={(e) => { const val = parseInt(e.target.value, 10) || 0; set({ max: val, maxQuota: val }); }} />
      </Field>
      <CheckField checked={Boolean(item.requiresDivision)}
        onChange={(checked) => set({ requiresDivision: checked, requiresSubDivision: checked ? item.requiresSubDivision : false })}
        label="Memerlukan pilihan divisi" description="Personel dengan role ini wajib memilih divisi." />
      {Boolean(item.requiresDivision) && (
        <CheckField className="ml-6" checked={Boolean(item.requiresSubDivision)} onChange={(checked) => set({ requiresSubDivision: checked })}
          label="Memerlukan pilihan sub-divisi juga" description="Personel wajib memilih sub-divisi di dalam divisinya." />
      )}
    </div>
  );
}
