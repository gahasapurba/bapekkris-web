import { Edit2, MessageCircle, Plus, Trash2, Upload } from 'lucide-react';
import { LEVEL_OPTIONS, findMatchingRole, getCategoryFromLevel, getTenureRoles, validateMemberQuota } from '../../utils/memberQuotaUtils';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, FileButton, FilterSelect, IconButton, ListToolbar, SearchBox } from '../AdminUi';
import { formatWaPhone } from '../adminConstants';
import { useAdminPortal } from '../AdminPortalContext';
import { uploadMediaToCloud } from '../../lib/supabase';
import { memberCreateSchema } from '../validation/schemas';
import { useAdminDraftForm } from '../useAdminDraftForm';

type MemberForm = {
  memName: string; memWhatsapp: string; memTenureId: string; memRoleId: string; memDivisionId: string; memSubDivisionId: string;
  memMotto: string; memImage: string; pendingMemberPhoto: File | null;
};

const PER_PAGE = 12;
const roleMatches = (m: any, role: any) => {
  if (m.roleId && m.roleId === role.id) return true;
  const mRole = String(m.role || '').toLowerCase().trim();
  const rName = String(role?.name || '').toLowerCase().trim();
  return mRole === rName || (role?.requiresDivision && rName && mRole.startsWith(rName));
};
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function MembersTab() {
  const {
    activeTenure, adminMemCatFilter, adminMemDivFilter, adminMemPage, adminMemSearch, adminMemTenureFilter, divisions,
    handleDeleteMemberClick, members, onAddMember, roleQuotas, setAdminMemCatFilter, setAdminMemDivFilter, setAdminMemPage, setAdminMemSearch,
    setAdminMemTenureFilter, setEditingItem, showToast, subDivisions, tenureRoles, tenures, verifyImageUrl
  } = useAdminPortal();

  // --- create form
  const tenureOf = (id: string) => id || activeTenure?.id || '';
  const rolesOf = (tid: string) => getTenureRoles(tenureOf(tid), roleQuotas, tenureRoles);
  const { handleSubmit, field, watch, setValue, setError, clearErrors, resetToDefaults, formState: { errors, isSubmitting } } = useAdminDraftForm<MemberForm>(
    'member',
    (v) => {
      const tid = tenureOf(v.memTenureId);
      const available = rolesOf(v.memTenureId);
      return memberCreateSchema({
        roleCount: available.length,
        selectedRole: available.find((r: any) => r.id === v.memRoleId) || null,
        divisionIds: divisions.filter((d: any) => d.tenureId === tid).map((d: any) => d.id),
        subDivisionIdsOf: (divisionId) => subDivisions.filter((sd: any) => sd.divisionId === divisionId).map((sd: any) => sd.id)
      });
    },
    { memName: '', memWhatsapp: '', memTenureId: activeTenure?.id || '', memRoleId: '', memDivisionId: '', memSubDivisionId: '', memMotto: '', memImage: '', pendingMemberPhoto: null }
  );
  const fv = watch();
  const err = errors as Record<string, { message?: string } | undefined>;
  const tenureId = tenureOf(fv.memTenureId);
  const roles = rolesOf(fv.memTenureId);
  const role = roles.find((r: any) => r.id === fv.memRoleId) || null;
  const divsForTenure = divisions.filter((d: any) => d.tenureId === tenureId);
  const subsForDiv = subDivisions.filter((sd: any) => sd.divisionId === fv.memDivisionId);

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setValue('pendingMemberPhoto', file);
    setValue('memImage', URL.createObjectURL(file));
    clearErrors('memImage');
    showToast(`Foto "${file.name}" dipilih (akan diunggah saat Anda klik Tambah Personel)`);
  };

  const createMember = handleSubmit(async (f) => {
    const selectedRole = role;
    const needsDivision = Boolean(selectedRole?.requiresDivision);
    const needsSub = needsDivision && Boolean(selectedRole?.requiresSubDivision);
    // Role quotas depend on the current members, so they are checked here rather than in the schema
    const quota = validateMemberQuota(
      { tenureId, roleId: selectedRole?.id, role: selectedRole?.name, divisionId: needsDivision ? f.memDivisionId : undefined, subDivisionId: needsSub ? f.memSubDivisionId : undefined },
      members, divisions, roleQuotas, tenureRoles, subDivisions
    );
    if (!quota.isValid) {
      setError((quota.field || 'memRole') as never, { message: quota.error });
      showToast(quota.error, 'error');
      return;
    }
    let imageUrl = (f.memImage || '').trim();
    if (imageUrl && !f.pendingMemberPhoto && !imageUrl.startsWith('blob:')) {
      showToast('Memverifikasi tautan foto profil...');
      const check = await verifyImageUrl(imageUrl, { requireHttps: true, allowRelative: false });
      if (!check.valid) {
        setError('memImage', { message: check.error });
        showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
        return;
      }
    }
    if (f.pendingMemberPhoto) {
      showToast('Mengunggah foto profil ke Cloud Storage...');
      try {
        imageUrl = await uploadMediaToCloud(f.pendingMemberPhoto, 'members');
      } catch (e) {
        showToast('Gagal mengunggah foto profil: ' + ((e as Error).message || 'Error'), 'error');
        return;
      }
    }
    const divObj = needsDivision ? divisions.find((d: any) => d.id === f.memDivisionId) : null;
    const roleName = needsDivision && String(selectedRole?.name || '').toLowerCase() === 'pimpro' && divObj ? `Pimpro ${divObj.name}` : (selectedRole?.name || 'Anggota Divisi');
    onAddMember({
      id: 'mem-' + Date.now(),
      tenureId,
      divisionId: needsDivision ? f.memDivisionId : undefined,
      subDivisionId: needsSub ? f.memSubDivisionId : undefined,
      roleId: selectedRole?.id,
      category: getCategoryFromLevel(selectedRole?.level ?? 5),
      name: f.memName,
      role: roleName,
      title: divObj?.name || '',
      image: imageUrl,
      color: divObj?.color || '#FFB800',
      whatsapp: f.memWhatsapp.trim(),
      motto: f.memMotto.trim(),
      responsibilities: []
    });
    // Period and division stay selected for the next person, as before.
    resetToDefaults();
    setValue('memTenureId', f.memTenureId);
    setValue('memDivisionId', f.memDivisionId);
    showToast(`Pengurus/Anggota "${f.memName}" berhasil ditambahkan & tersimpan di Cloud!`);
  }, () => showToast('Mohon lengkapi kolom wajib pada form Personel', 'error'));
  const tenureMembers = members.filter((m: any) => !tenureId || m.tenureId === tenureId);
  const tenureObj = tenures.find((t: any) => t.id === tenureId);

  // --- list
  const filterRoles = (adminMemTenureFilter === 'all' ? tenures.flatMap((t: any) => getTenureRoles(t.id, roleQuotas, tenureRoles)) : getTenureRoles(adminMemTenureFilter, roleQuotas, tenureRoles))
    .sort((a: any, b: any) => a.level - b.level || a.sortOrder - b.sortOrder);
  const q = adminMemSearch.trim().toLowerCase();
  const filtered = members.filter((m: any) => {
    const matchesSearch = !q || [m.name, m.role, m.title, m.whatsapp].some((v) => String(v || '').toLowerCase().includes(q));
    const matchesCat = adminMemCatFilter === 'all' || (() => {
      const target = filterRoles.find((r: any) => r.id === adminMemCatFilter);
      if (!target) return m.roleId === adminMemCatFilter || m.category === adminMemCatFilter;
      if (m.tenureId && target.tenureId && m.tenureId !== target.tenureId) return false;
      if (m.roleId && m.roleId === target.id) return true;
      const matched = findMatchingRole(m, getTenureRoles(m.tenureId, roleQuotas, tenureRoles));
      return matched ? matched.id === target.id : (m.role || '').toLowerCase().trim() === String(target.name || '').toLowerCase().trim();
    })();
    return matchesSearch && (adminMemTenureFilter === 'all' || m.tenureId === adminMemTenureFilter) && matchesCat && (adminMemDivFilter === 'all' || m.divisionId === adminMemDivFilter);
  });
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, adminMemPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const yearOf = (tid: string) => { const t = tenures.find((x: any) => x.id === tid); return adminMemTenureFilter === 'all' && t ? ` (${t.code || t.title})` : ''; };

  return (
    <AdminPanel title={`Pengurus & pelayan (${members.length})`} description="Pimpinan, pembina, ketua divisi, dan anggota pelayan di bagan organisasi, lengkap dengan nomor WhatsApp untuk koordinasi.">
      <AdminSubsection title="Tambah personel">
        <form onSubmit={createMember} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Nama lengkap" required error={err.memName?.message}>
            <Input placeholder="Contoh: Maria Simanjuntak" {...field('memName')} />
          </Field>
          <Field label="Nomor WhatsApp" hint="Opsional. Contoh: 0812…"><Input type="tel" inputMode="tel" {...field('memWhatsapp')} /></Field>
          <Field label="Periode" required>
            <Select value={tenureId} onChange={(e) => { setValue('memTenureId', e.target.value); setValue('memRoleId', ''); setValue('memDivisionId', ''); clearErrors(['memDivisionId', 'memRole' as never]); }}>
              {tenures.map((t: any) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
            </Select>
          </Field>
          <Field label="Jabatan" required error={err.memRole?.message || (roles.length === 0 ? 'Belum ada role di periode ini. Buat dulu di menu Role & jabatan.' : undefined)}>
            <Select value={role?.id || ''} disabled={roles.length === 0} onChange={(e) => {
              const r = roles.find((x: any) => x.id === e.target.value);
              setValue('memRoleId', r?.id || '');
              if (r && !r.requiresDivision) setValue('memDivisionId', '');
              clearErrors(['memRole' as never, 'memDivisionId']);
            }}>
              <option value="">Pilih jabatan</option>
              {roles.map((r: any) => {
                const lvl = LEVEL_OPTIONS.find((l: any) => l.level === r.level);
                return <option key={r.id} value={r.id}>{r.name} ({lvl?.shortLabel || `Level ${r.level}`} · {r.max > 0 ? `maks ${r.max}` : 'tanpa batas'}{r.requiresDivision ? ' · perlu divisi' : ''})</option>;
              })}
            </Select>
          </Field>
          {role?.requiresDivision && (
            <Field label="Divisi" required error={err.memDivisionId?.message || (divsForTenure.length === 0 ? 'Belum ada divisi di periode ini. Buat dulu di menu Divisi.' : undefined)} hint={`Wajib untuk jabatan ${role.name}.`}>
              <Select value={fv.memDivisionId} disabled={divsForTenure.length === 0} onChange={(e) => { setValue('memDivisionId', e.target.value); setValue('memSubDivisionId', ''); clearErrors('memDivisionId'); }}>
                <option value="">Pilih divisi</option>
                {divsForTenure.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
          )}
          {role?.requiresDivision && role?.requiresSubDivision && (
            <Field label="Sub-divisi" required error={err.memSubDivisionId?.message || (fv.memDivisionId && subsForDiv.length === 0 ? 'Divisi ini belum punya sub-divisi. Tambahkan di menu Divisi.' : undefined)} hint={!fv.memDivisionId ? 'Pilih divisi terlebih dahulu.' : undefined}>
              <Select value={fv.memSubDivisionId} disabled={!fv.memDivisionId || subsForDiv.length === 0} onChange={(e) => { setValue('memSubDivisionId', e.target.value); clearErrors('memSubDivisionId'); }}>
                <option value="">Pilih sub-divisi</option>
                {subsForDiv.map((sd: any) => <option key={sd.id} value={sd.id}>{sd.name}{sd.code ? ` (${sd.code})` : ''}</option>)}
              </Select>
            </Field>
          )}

          {roles.length > 0 && (
            <div className="rounded-md border border-line bg-surface p-3 md:col-span-2">
              <p className="mb-2 text-[0.82rem] text-muted"><strong className="text-ink">Kuota {tenureObj?.title || tenureObj?.code || 'periode ini'}</strong> · {tenureMembers.length} personel</p>
              <ul className="flex list-none flex-wrap gap-1.5">
                {roles.map((r: any) => {
                  const matched = tenureMembers.filter((m: any) => roleMatches(m, r));
                  const full = r.max > 0 && matched.length >= r.max;
                  return (
                    <li key={r.id} title={matched.length ? `Terisi oleh: ${matched.map((m: any) => m.name).join(', ')}` : undefined}>
                      <Badge tone={full ? 'danger' : matched.length ? 'success' : 'neutral'}>{r.name}: {matched.length}{r.max > 0 ? `/${r.max}` : ''}{full ? ' · penuh' : ''}</Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="md:col-span-2"><Field label="Motto"><Input placeholder="Contoh: Melayani dengan kasih" {...field('memMotto')} /></Field></div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Field label="Foto profil" error={err.memImage?.message} hint="Unggah berkas atau tempel tautan gambar.">
              <Input placeholder="https://…" {...field('memImage')} />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              {fv.memImage && <img src={fv.memImage} alt="Pratinjau foto" className="size-11 rounded-full border border-line object-cover" />}
              <FileButton icon={<Upload size={15} aria-hidden="true" />} accept="image/*" onChange={pickPhoto}>Unggah foto</FileButton>
              {fv.memImage && <Button type="button" size="sm" variant="ghost" className="text-danger" onClick={() => { setValue('memImage', ''); setValue('pendingMemberPhoto', null); clearErrors('memImage'); }}>Hapus foto</Button>}
            </div>
          </div>
          <div className="flex justify-end md:col-span-2"><Button type="submit" loading={isSubmitting} icon={<Plus size={16} aria-hidden="true" />}>{isSubmitting ? 'Menyimpan…' : 'Simpan personel'}</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Personel <span className="font-normal text-muted">({filtered.length} dari {members.length})</span></>}>
          <SearchBox label="Cari personel" placeholder="Cari nama atau jabatan" value={adminMemSearch} onChange={(v) => { setAdminMemSearch(v); setAdminMemPage(1); }} />
          <FilterSelect label="Saring periode" value={adminMemTenureFilter} onChange={(v) => { setAdminMemTenureFilter(v); setAdminMemCatFilter('all'); setAdminMemDivFilter('all'); setAdminMemPage(1); }}>
            <option value="all">Semua periode</option>
            {tenures.map((t: any) => <option key={t.id} value={t.id}>Periode {t.code || t.title}</option>)}
          </FilterSelect>
          <FilterSelect label="Saring jabatan" value={adminMemCatFilter} onChange={(v) => { setAdminMemCatFilter(v); setAdminMemPage(1); }}>
            <option value="all">Semua jabatan</option>
            {filterRoles.map((r: any) => <option key={r.id} value={r.id}>{r.name}{yearOf(r.tenureId)}</option>)}
          </FilterSelect>
          <FilterSelect label="Saring divisi" value={adminMemDivFilter} onChange={(v) => { setAdminMemDivFilter(v); setAdminMemPage(1); }}>
            <option value="all">Semua divisi</option>
            {(adminMemTenureFilter === 'all' ? divisions : divisions.filter((d: any) => d.tenureId === adminMemTenureFilter)).map((d: any) => <option key={d.id} value={d.id}>{d.name}{yearOf(d.tenureId)}</option>)}
          </FilterSelect>
        </ListToolbar>
        {visible.length === 0 ? <AdminEmpty>Tidak ada personel yang cocok.</AdminEmpty> : (
          <ul className="grid list-none gap-3 lg:grid-cols-2">
            {visible.map((m: any) => {
              const roleName = findMatchingRole(m, tenureRoles)?.name || m.role || 'Anggota';
              const div = (divisions || []).find((d: any) => d.id === m.divisionId);
              const subtitle = div?.name && !roleName.toLowerCase().includes(div.name.toLowerCase()) ? `${roleName} · ${div.name}` : roleName;
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {m.image
                      ? <img src={m.image} alt="" className="size-10 shrink-0 rounded-full border border-line object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      : <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-tint text-[0.82rem] font-semibold text-navy-ink">{initials(m.name || '?')}</span>}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{m.name}</p>
                      <p className="truncate text-[0.82rem] text-muted">{subtitle}</p>
                      {m.updatedAt && <p className="truncate text-[0.74rem] text-dim">{formatLastUpdatedWib(m.updatedAt)}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {m.whatsapp && (
                      <a href={`https://wa.me/${formatWaPhone(m.whatsapp)}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${m.name}`} title="WhatsApp"
                        className="inline-flex size-9 items-center justify-center rounded-full text-success hover:bg-success-tint"><MessageCircle size={16} aria-hidden="true" /></a>
                    )}
                    <IconButton label={`Edit ${m.name}`} onClick={() => setEditingItem({ type: 'member', item: { ...m, rawResponsibilities: Array.isArray(m.responsibilities) ? m.responsibilities.join('\n') : (m.responsibilities || '') } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                    <IconButton label={`Hapus ${m.name}`} tone="danger" onClick={() => handleDeleteMemberClick(m)}><Trash2 size={15} aria-hidden="true" /></IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setAdminMemPage} itemLabel="personel" total={filtered.length} pageSize={PER_PAGE} />
      </div>
    </AdminPanel>
  );
}
