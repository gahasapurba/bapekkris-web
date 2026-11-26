import { Edit2, Plus, Trash2 } from 'lucide-react';
import { LEVEL_OPTIONS, canDeleteRole, formatLevelOptionLabel } from '../../utils/memberQuotaUtils';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select } from '../../ui';
import { AdminPanel, AdminSubsection, AdminTable, CheckField, FilterSelect, IconButton, ListToolbar, SearchBox, tdClass, thClass } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';
import { ROLE_NAME_REQUIRED, roleCreateSchema } from '../validation/schemas';
import { useAdminDraftForm } from '../useAdminDraftForm';

type RoleForm = { newRoleName: string; newRoleTenureId: string; newRoleLevel: number; newRoleMax: number; newRoleRequiresDivision: boolean; newRoleRequiresSubDivision: boolean };

const PER_PAGE = 8;

export default function RolesTab() {
  const {
    activeTenure, members, onAddTenureRole, roleLevelFilter, rolePage, roleSearchQuery, roleTenureFilter, setDeleteConfirm, setEditingItem,
    setRoleLevelFilter, setRolePage, setRoleSearchQuery, setRoleTenureFilter, showToast, tenureRoles, tenures
  } = useAdminPortal();

  const tenureOf = (id: string) => id || activeTenure?.id || tenures[0]?.id || '';
  const takenNamesIn = (tenureId: string) => (tenureRoles || []).filter((r: any) => r.tenureId === tenureId).map((r: any) => String(r?.name || '').toLowerCase().trim());
  const { handleSubmit, field, watch, setValue, resetToDefaults, formState: { errors } } = useAdminDraftForm<RoleForm>(
    'role',
    (v) => roleCreateSchema({ takenNames: takenNamesIn(tenureOf(v.newRoleTenureId)) }),
    { newRoleName: '', newRoleTenureId: activeTenure?.id || '', newRoleLevel: 5, newRoleMax: 0, newRoleRequiresDivision: false, newRoleRequiresSubDivision: false }
  );
  const values = watch();
  const formTenureId = tenureOf(values.newRoleTenureId);
  const createRole = handleSubmit((v) => {
    const nowIso = new Date().toISOString();
    onAddTenureRole?.({
      id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenureId: formTenureId,
      name: v.newRoleName.trim(),
      level: Number(v.newRoleLevel ?? 5),
      max: Number(v.newRoleMax || 0),
      maxQuota: Number(v.newRoleMax || 0),
      requiresDivision: Boolean(v.newRoleRequiresDivision),
      requiresSubDivision: Boolean(v.newRoleRequiresDivision && v.newRoleRequiresSubDivision),
      sortOrder: tenureRoles.length,
      createdAt: nowIso,
      updatedAt: nowIso
    });
    // The period and level stay selected for the next role, as before.
    resetToDefaults();
    setValue('newRoleTenureId', v.newRoleTenureId);
    setValue('newRoleLevel', v.newRoleLevel);
    showToast(`Role "${v.newRoleName}" berhasil ditambahkan & disinkronkan ke Cloud!`);
  }, (errs) => {
    const message = errs.newRoleName?.message;
    showToast(message === ROLE_NAME_REQUIRED ? 'Mohon isi Nama Jabatan terlebih dahulu' : message || 'Periksa kembali isian role', 'error');
  });
  const filtered = (tenureRoles || []).filter((r: any) =>
    (r.name || '').toLowerCase().includes(roleSearchQuery.toLowerCase()) &&
    (roleTenureFilter === 'all' || r.tenureId === roleTenureFilter) &&
    (roleLevelFilter === 'all' || String(r.level) === String(roleLevelFilter)));
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, rolePage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminPanel title={`Role & jabatan (${tenureRoles.length})`} description="Jabatan per periode dengan kuota maksimal, tingkat di bagan organisasi (level 0–5), dan kewajiban penempatan divisi.">
      <AdminSubsection title="Tambah role">
        <form onSubmit={createRole} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Nama jabatan" required error={errors.newRoleName?.message}>
            <Input placeholder="Contoh: Sekretaris, Ketua Divisi" {...field('newRoleName')} />
          </Field>
          <Field label="Periode" required>
            <Select {...field('newRoleTenureId')}>
              {tenures.map((t: any) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
            </Select>
          </Field>
          <Field label="Tingkat di bagan" required>
            <Select {...field('newRoleLevel', { valueAsNumber: true })}>
              {LEVEL_OPTIONS.map((lvl: any) => <option key={lvl.level} value={lvl.level}>{formatLevelOptionLabel(lvl, tenureRoles, formTenureId)}</option>)}
            </Select>
          </Field>
          <Field label="Kuota maksimal" hint={values.newRoleMax > 0 ? `${values.newRoleMax} orang per ${values.newRoleRequiresDivision ? 'divisi' : 'periode'}` : '0 = tanpa batas'}>
            <Input type="number" min={0} max={100} {...field('newRoleMax', { setValueAs: (v) => parseInt(v, 10) || 0 })} />
          </Field>
          <CheckField checked={values.newRoleRequiresDivision} onChange={(v) => setValue('newRoleRequiresDivision', v)} label="Wajib memilih divisi" description="Untuk jabatan yang ditempatkan di divisi tertentu, misalnya Ketua Divisi." />
          {values.newRoleRequiresDivision && (
            <CheckField checked={values.newRoleRequiresSubDivision} onChange={(v) => setValue('newRoleRequiresSubDivision', v)} label="Wajib memilih sub-divisi juga" description="Personel ditempatkan di sub-divisi di bawah divisi yang dipilih." />
          )}
          <div className="flex justify-end md:col-span-2"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Tambah role</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Daftar role <span className="font-normal text-muted">({filtered.length})</span></>}>
          <SearchBox label="Cari role" placeholder="Cari nama jabatan" value={roleSearchQuery} onChange={(v) => { setRoleSearchQuery(v); setRolePage(1); }} />
          <FilterSelect label="Saring periode" value={roleTenureFilter} onChange={(v) => { setRoleTenureFilter(v); setRolePage(1); }}>
            <option value="all">Semua periode</option>
            {tenures.map((t: any) => <option key={t.id} value={t.id}>{t.title || t.code}</option>)}
          </FilterSelect>
          <FilterSelect label="Saring tingkat" value={roleLevelFilter} onChange={(v) => { setRoleLevelFilter(v); setRolePage(1); }}>
            <option value="all">Semua tingkat</option>
            {LEVEL_OPTIONS.map((lvl: any) => <option key={lvl.level} value={String(lvl.level)}>{formatLevelOptionLabel(lvl, tenureRoles, roleTenureFilter === 'all' ? null : roleTenureFilter, true)}</option>)}
          </FilterSelect>
        </ListToolbar>
        <AdminTable label="Daftar role">
          <thead>
            <tr>
              <th scope="col" className={thClass}>Jabatan</th>
              <th scope="col" className={thClass}>Periode</th>
              <th scope="col" className={thClass}>Tingkat</th>
              <th scope="col" className={thClass}>Penempatan</th>
              <th scope="col" className={thClass}>Terisi</th>
              <th scope="col" className={thClass}>Diperbarui</th>
              <th scope="col" className={thClass}><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Tidak ada role yang cocok.</td></tr>
            ) : visible.map((role: any) => {
              const levelInfo = LEVEL_OPTIONS.find((l: any) => l.level === role.level);
              const tObj = tenures.find((t: any) => t.id === role.tenureId);
              const matched = members.filter((m: any) => !role.tenureId || m.tenureId === role.tenureId).filter((m: any) => {
                if (m.roleId && m.roleId === role.id) return true;
                const mRole = String(m.role || '').toLowerCase().trim();
                const rName = String(role?.name || '').toLowerCase().trim();
                return mRole === rName || (role.requiresDivision && mRole.startsWith(rName));
              });
              const count = matched.length;
              const maxQ = Number(role.maxQuota ?? role.max ?? 0);
              const full = maxQ > 0 && count >= maxQ;
              const names = matched.map((m: any) => m.name).join(', ');
              return (
                <tr key={role.id} className="hover:bg-surface-hover">
                  <td className={`${tdClass} font-semibold`}>{role.name}</td>
                  <td className={tdClass}><Badge>{tObj?.code || tObj?.title || 'Global'}</Badge></td>
                  <td className={`${tdClass} whitespace-nowrap`}>{levelInfo?.shortLabel || `Level ${role.level}`}</td>
                  <td className={`${tdClass} text-[0.82rem]`}>
                    {role.requiresDivision ? <>Divisi{role.requiresSubDivision && ' + sub-divisi'}</> : <span className="text-muted">Global</span>}
                  </td>
                  <td className={tdClass} title={names ? `Terisi oleh: ${names}` : undefined}>
                    <Badge tone={full ? 'danger' : count > 0 ? 'success' : 'neutral'}>{count}{maxQ > 0 ? `/${maxQ}` : ''}{full ? ' · penuh' : maxQ === 0 ? ' · tanpa batas' : ''}</Badge>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-[0.78rem] text-dim`}>{formatLastUpdatedWib(role.updatedAt || role.createdAt)}</td>
                  <td className={`${tdClass} text-right`}>
                    <div className="inline-flex gap-1">
                      <IconButton label={`Edit ${role.name}`} onClick={() => setEditingItem({ type: 'role', item: { ...role } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                      <IconButton label={`Hapus ${role.name}`} tone="danger" onClick={() => {
                        const check = canDeleteRole(role, role.tenureId, members);
                        setDeleteConfirm({ type: 'role', id: role.id, name: role.name, tenureId: role.tenureId, isBlocked: !check.canDelete, dependentMembers: check.members, dependentCount: check.count, reason: check.reason });
                      }}><Trash2 size={15} aria-hidden="true" /></IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
        <Pagination page={page} pageCount={pageCount} onChange={setRolePage} itemLabel="role" total={filtered.length} pageSize={PER_PAGE} />
      </div>
    </AdminPanel>
  );
}
