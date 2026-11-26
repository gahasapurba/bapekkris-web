import { useState } from 'react';
import { ChevronDown, Download, Edit2, Layers, Plus, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { getDivisionLead, getDivisionStructure } from '../../utils/memberQuotaUtils';
import { Badge, Button, Field, Input, Pagination, Select, Textarea, cn } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, FilterSelect, IconButton, ListToolbar, SearchBox, Switch } from '../AdminUi';
import { downloadCsv } from '../csv';
import { useAdminPortal } from '../AdminPortalContext';
import { divisionCreateSchema, subDivisionDraftSchema } from '../validation/schemas';
import { useAdminDraftForm } from '../useAdminDraftForm';

type DivisionForm = { newDivName: string; newDivTenureId: string; newDivDesc: string; newDivFocus: string };
type SubDivisionForm = { newSubDivDivisionId: string; newSubDivName: string; newSubDivCode: string };
const DEFAULT_DIVISION_COLOR = '#00529B';

const PER_PAGE = 8;

export default function DivisionsTab() {
  const {
    activeTenure, divPage, divRecruitFilter, divSearchQuery, divTenureFilter, divisions, expandedDivSubId,
    handleDeleteDivisionClick, members, onAddDivision, onAddSubDivision, onUpdateDivision, setDeleteConfirm, setDivPage, setDivRecruitFilter,
    setDivSearchQuery, setDivTenureFilter, setEditModalError, setEditingItem, setExpandedDivSubId, showToast, subDivisions, tenureRoles, tenures
  } = useAdminPortal();
  const { handleSubmit, field, resetToDefaults, formState: { errors } } = useAdminDraftForm<DivisionForm>('division', divisionCreateSchema,
    { newDivName: '', newDivTenureId: activeTenure?.id || '', newDivDesc: '', newDivFocus: '' });
  const createDivision = handleSubmit((v) => {
    onAddDivision({
      id: 'div-' + Date.now(),
      tenureId: v.newDivTenureId || activeTenure?.id || '',
      name: v.newDivName,
      slug: v.newDivName.toLowerCase().replace(/\s+/g, '-'),
      memberId: null,
      leadName: '',
      color: DEFAULT_DIVISION_COLOR,
      motto: '',
      description: v.newDivDesc.trim(),
      focusAreas: v.newDivFocus ? v.newDivFocus.split(',').map((s) => s.trim()).filter(Boolean) : [],
      isRecruiting: false
    });
    resetToDefaults();
    showToast(`Divisi "${v.newDivName}" berhasil ditambahkan & disinkronkan!`);
  }, () => showToast('Mohon isi Nama Divisi terlebih dahulu', 'error'));

  const q = divSearchQuery.toLowerCase().trim();
  const filtered = (divisions || []).filter((d: any) => {
    const lead = getDivisionLead(d, members, tenureRoles);
    const matchesSearch = !q || [d.name, d.description, lead.name].some((v) => String(v || '').toLowerCase().includes(q)) ||
      (Array.isArray(d.focusAreas) && d.focusAreas.some((fa: string) => (fa || '').toLowerCase().includes(q)));
    const recruiting = Boolean(d.isRecruiting);
    return matchesSearch && (divTenureFilter === 'all' || d.tenureId === divTenureFilter) &&
      (divRecruitFilter === 'all' || (divRecruitFilter === 'open' && recruiting) || (divRecruitFilter === 'closed' && !recruiting));
  });
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, divPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () => {
    downloadCsv(`daftar_divisi_bapekkris_${Date.now()}.csv`, ['ID Divisi', 'Nama Divisi', 'Periode', 'Pimpinan', 'Fokus Area', 'Status Rekrutmen', 'Warna'],
      divisions.map((d: any) => {
        const t = tenures.find((x: any) => x.id === d.tenureId);
        const fa = Array.isArray(d.focusAreas) ? d.focusAreas.join('; ') : (d.focusAreas || '');
        return [d.id, d.name, t ? t.code || t.title : d.tenureId, getDivisionLead(d, members, tenureRoles).name || '-', fa, d.isRecruiting ? 'Buka' : 'Tutup', d.color || ''];
      }));
    showToast('Data divisi diunduh sebagai CSV.');
  };

  // Inline "add sub-division" row: one draft, tied to the division it was typed into
  const subForm = useAdminDraftForm<SubDivisionForm>('subdivision', subDivisionDraftSchema, { newSubDivDivisionId: '', newSubDivName: '', newSubDivCode: '' });
  const sub = subForm.watch();
  const [subDivError, setSubDivError] = useState<{ divId: string | null; message: string }>({ divId: null, message: '' });
  const typeSub = (divId: string, key: 'newSubDivName' | 'newSubDivCode', value: string) => {
    if (sub.newSubDivDivisionId !== divId) {
      subForm.setValue('newSubDivDivisionId', divId);
      subForm.setValue(key === 'newSubDivName' ? 'newSubDivCode' : 'newSubDivName', '');
    }
    subForm.setValue(key, value);
  };

  const addSub = (d: any, currentSubs: any[]) => {
    const name = (sub.newSubDivDivisionId === d.id ? sub.newSubDivName : '').trim();
    const code = (sub.newSubDivDivisionId === d.id ? sub.newSubDivCode : '').trim().toUpperCase();
    if (!name) { setSubDivError({ divId: d.id, message: 'Nama sub-divisi wajib diisi.' }); showToast('Nama Sub-Divisi wajib diisi', 'error'); return; }
    if (currentSubs.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) {
      setSubDivError({ divId: d.id, message: `Sub-divisi "${name}" sudah terdaftar pada divisi ini.` });
      showToast(`Sub-divisi "${name}" sudah terdaftar pada divisi ini!`, 'error');
      return;
    }
    setSubDivError({ divId: null, message: '' });
    if (!onAddSubDivision) return;
    onAddSubDivision({ id: 'subdiv-' + Date.now(), divisionId: d.id, name, code: code || undefined, description: '', sortOrder: currentSubs.length });
    subForm.resetToDefaults();
    showToast(`Sub-divisi "${name}" berhasil ditambahkan ke divisi ${d.name}!`);
  };

  return (
    <AdminPanel title={`Divisi (${divisions.length})`} description="Divisi per periode, pimpinannya, status rekrutmen di situs, dan sub-divisi di bawahnya."
      actions={divisions.length > 0 && <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={exportCsv}>Ekspor CSV</Button>}>
      <AdminSubsection title="Tambah divisi">
        <form onSubmit={createDivision} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Nama divisi" required error={errors.newDivName?.message}>
            <Input placeholder="Contoh: Pelayanan Kasih" {...field('newDivName')} />
          </Field>
          <Field label="Periode" required>
            <Select {...field('newDivTenureId')}>
              {tenures.map((t: any) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2"><Field label="Deskripsi tugas"><Textarea rows={2} {...field('newDivDesc')} /></Field></div>
          <div className="md:col-span-2"><Field label="Fokus program" hint="Pisahkan dengan koma."><Input placeholder="Contoh: Bakti sosial, Kunjungan kasih" {...field('newDivFocus')} /></Field></div>
          <div className="flex justify-end md:col-span-2"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Tambah divisi</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Daftar divisi <span className="font-normal text-muted">({filtered.length} dari {divisions.length})</span></>}>
          <SearchBox label="Cari divisi" placeholder="Cari divisi, pimpinan, fokus" value={divSearchQuery} onChange={(v) => { setDivSearchQuery(v); setDivPage(1); }} />
          <FilterSelect label="Saring periode" value={divTenureFilter} onChange={(v) => { setDivTenureFilter(v); setDivPage(1); }}>
            <option value="all">Semua periode</option>
            {tenures.map((t: any) => <option key={t.id} value={t.id}>Periode {t.code || t.title}</option>)}
          </FilterSelect>
          <FilterSelect label="Saring rekrutmen" value={divRecruitFilter} onChange={(v) => { setDivRecruitFilter(v); setDivPage(1); }}>
            <option value="all">Semua rekrutmen</option>
            <option value="open">Rekrutmen buka</option>
            <option value="closed">Rekrutmen tutup</option>
          </FilterSelect>
        </ListToolbar>

        {visible.length === 0 ? <AdminEmpty>Tidak ada divisi yang cocok.</AdminEmpty> : (
          <ul className="flex list-none flex-col gap-3">
            {visible.map((d: any) => {
              const { leaders } = getDivisionStructure(d, members, tenureRoles);
              const lead = leaders.length === 0 ? getDivisionLead(d, members, tenureRoles) : null;
              const subs = subDivisions.filter((sd: any) => sd.divisionId === d.id);
              const open = expandedDivSubId === d.id;
              const recruiting = Boolean(d.isRecruiting);
              const err = subDivError.divId === d.id ? subDivError.message : '';
              return (
                <li key={d.id} className="overflow-hidden rounded-md border border-line bg-surface">
                  <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">{d.name}{d.tenureId && <Badge>{tenures.find((t: any) => t.id === d.tenureId)?.code || d.tenureId}</Badge>}</p>
                      <p className="mt-0.5 text-[0.86rem] text-muted">
                        {leaders.length > 0
                          ? leaders.map((l: any, i: number) => <span key={l.id || i} className="mr-3">{l.role ? `${l.role}: ` : ''}<strong className="text-ink">{l.name}</strong></span>)
                          : lead?.name ? <>{lead.roleName || 'Pimpinan'}: <strong className="text-ink">{lead.name}</strong></> : 'Belum ada pimpinan'}
                      </p>
                      {d.updatedAt && <p className="mt-0.5 text-[0.76rem] text-dim">{formatLastUpdatedWib(d.updatedAt)}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-2 text-[0.82rem] text-muted">
                        Rekrutmen {recruiting ? 'buka' : 'tutup'}
                        <Switch checked={recruiting} label={`Rekrutmen ${d.name}`} onChange={(next) => {
                          onUpdateDivision?.({ ...d, isRecruiting: next });
                          showToast(`Rekrutmen "${d.name}" ${next ? 'dibuka' : 'ditutup'}.`);
                        }} />
                      </span>
                      <IconButton label={`Edit ${d.name}`} onClick={() => setEditingItem({ type: 'division', item: { ...d, rawFocusAreas: Array.isArray(d.focusAreas) ? d.focusAreas.join(', ') : (d.focusAreas || '') } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                      <IconButton label={`Hapus ${d.name}`} tone="danger" onClick={() => handleDeleteDivisionClick(d)}><Trash2 size={15} aria-hidden="true" /></IconButton>
                    </div>
                  </div>

                  <div className="border-t border-line bg-subtle">
                    <button type="button" aria-expanded={open} onClick={() => setExpandedDivSubId(open ? null : d.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-4 py-2.5 text-left text-[0.86rem] text-ink hover:bg-surface-hover">
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <Layers size={15} aria-hidden="true" className="text-gold-ink" /><strong className="font-semibold">Sub-divisi ({subs.length})</strong>
                        {!open && subs.slice(0, 4).map((s: any) => <Badge key={s.id} tone="gold">{s.name}</Badge>)}
                        {!open && subs.length > 4 && <span className="text-muted">+{subs.length - 4}</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[0.82rem] font-semibold text-navy-ink">{open ? 'Tutup' : 'Kelola'}<ChevronDown size={15} aria-hidden="true" className={cn('transition-transform', open && 'rotate-180')} /></span>
                    </button>
                    {open && (
                      <div className="flex flex-col gap-3 border-t border-line px-4 py-4">
                        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-start">
                          <Field label="Nama sub-divisi" required error={err || undefined}>
                            <Input placeholder="Contoh: Sie Multimedia" value={sub.newSubDivDivisionId === d.id ? sub.newSubDivName : ''}
                              onChange={(e) => { typeSub(d.id, 'newSubDivName', e.target.value); if (subDivError.divId === d.id) setSubDivError({ divId: null, message: '' }); }} />
                          </Field>
                          <Field label="Kode singkat"><Input placeholder="MULTI" value={sub.newSubDivDivisionId === d.id ? sub.newSubDivCode : ''} onChange={(e) => typeSub(d.id, 'newSubDivCode', e.target.value)} /></Field>
                          <Button type="button" icon={<Plus size={15} aria-hidden="true" />} onClick={() => addSub(d, subs)} className="sm:mt-[30px]">Tambah</Button>
                        </div>
                        {subs.length === 0 ? <p className="text-[0.84rem] text-muted">Belum ada sub-divisi.</p> : (
                          <ul className="flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
                            {subs.map((sd: any) => {
                              const count = (members || []).filter((m: any) => m.subDivisionId === sd.id).length;
                              return (
                                <li key={sd.id} className="flex items-center justify-between gap-2 bg-surface px-3 py-2">
                                  <span className="flex flex-wrap items-center gap-2 text-[0.88rem] font-semibold text-ink">{sd.name}{sd.code && <Badge tone="gold">{sd.code}</Badge>}{count > 0 && <span className="text-[0.8rem] font-normal text-muted">{count} anggota</span>}</span>
                                  <span className="flex items-center gap-1">
                                    <IconButton label={`Edit ${sd.name}`} onClick={() => { setEditModalError(''); setEditingItem({ type: 'sub_division', item: { ...sd } }); }}><Edit2 size={14} aria-hidden="true" /></IconButton>
                                    <IconButton label={`Hapus ${sd.name}`} tone="danger" onClick={() => setDeleteConfirm({ type: 'sub_division', id: sd.id, name: sd.name, divName: d.name, memCount: count, isBlocked: count > 0 })}><Trash2 size={14} aria-hidden="true" /></IconButton>
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setDivPage} itemLabel="divisi" total={filtered.length} pageSize={PER_PAGE} />
      </div>
    </AdminPanel>
  );
}
