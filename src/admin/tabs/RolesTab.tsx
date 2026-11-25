import { Edit2, Plus, Trash2 } from 'lucide-react';
import { LEVEL_OPTIONS, canDeleteRole, formatLevelOptionLabel } from '../../utils/memberQuotaUtils';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select } from '../../ui';
import { AdminPanel, AdminSubsection, AdminTable, CheckField, FilterSelect, IconButton, ListToolbar, SearchBox, tdClass, thClass } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

const PER_PAGE = 8;

export default function RolesTab() {
  const {
    activeTenure, clearFieldError, formErrors, handleCreateRole, members, newRoleLevel, newRoleMax, newRoleName, newRoleRequiresDivision,
    newRoleRequiresSubDivision, newRoleTenureId, roleLevelFilter, rolePage, roleSearchQuery, roleTenureFilter, setDeleteConfirm, setEditingItem,
    setNewRoleLevel, setNewRoleMax, setNewRoleName, setNewRoleRequiresDivision, setNewRoleRequiresSubDivision, setNewRoleTenureId,
    setRoleLevelFilter, setRolePage, setRoleSearchQuery, setRoleTenureFilter, tenureRoles, tenures
  } = useAdminPortal();

  const formTenureId = newRoleTenureId || activeTenure?.id || tenures[0]?.id || '';
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
        <form onSubmit={handleCreateRole} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Nama jabatan" required error={formErrors.newRoleName}>
            <Input placeholder="Contoh: Sekretaris, Ketua Divisi" value={newRoleName} onChange={(e) => { setNewRoleName(e.target.value); clearFieldError('newRoleName'); }} />
          </Field>
          <Field label="Periode" required>
            <Select value={formTenureId} onChange={(e) => setNewRoleTenureId(e.target.value)}>
              {tenures.map((t: any) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
            </Select>
          </Field>
          <Field label="Tingkat di bagan" required>
            <Select value={newRoleLevel} onChange={(e) => setNewRoleLevel(Number(e.target.value))}>
              {LEVEL_OPTIONS.map((lvl: any) => <option key={lvl.level} value={lvl.level}>{formatLevelOptionLabel(lvl, tenureRoles, formTenureId)}</option>)}
            </Select>
          </Field>
          <Field label="Kuota maksimal" hint={newRoleMax > 0 ? `${newRoleMax} orang per ${newRoleRequiresDivision ? 'divisi' : 'periode'}` : '0 = tanpa batas'}>
            <Input type="number" min={0} max={100} value={newRoleMax} onChange={(e) => setNewRoleMax(parseInt(e.target.value) || 0)} />
          </Field>
          <CheckField checked={newRoleRequiresDivision} onChange={setNewRoleRequiresDivision} label="Wajib memilih divisi" description="Untuk jabatan yang ditempatkan di divisi tertentu, misalnya Ketua Divisi." />
          {newRoleRequiresDivision && (
            <CheckField checked={newRoleRequiresSubDivision} onChange={setNewRoleRequiresSubDivision} label="Wajib memilih sub-divisi juga" description="Personel ditempatkan di sub-divisi di bawah divisi yang dipilih." />
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
