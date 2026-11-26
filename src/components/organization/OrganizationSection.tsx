import type { ReactNode } from 'react';
import { Download, MessageCircle, RotateCcw, Search, Users } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { findMatchingRole, getDivisionLead, getDivisionStructure } from '../../utils/memberQuotaUtils';
import { Button, EmptyState, Input, PageHeader, Select } from '../../ui';
import { MemberDialog } from './MemberDialog';
import { OrgMemberCard } from './OrgMemberCard';
import { formatWaNumber, useOrganization, type UseOrganizationProps } from './useOrganization';

/** Thin vertical connector between tiers (plain colour for the PDF export). */
function Connector() {
  return <div className="mx-auto hidden h-8 w-px bg-line-strong opacity-40 lg:block" aria-hidden="true" />;
}

function Tier({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="flex w-full flex-col items-center gap-4">
      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-dim">{label}</p>
      <div className="flex w-full flex-wrap justify-center gap-4">{children}</div>
    </section>
  );
}

export default function OrganizationSection(props: UseOrganizationProps) {
  const state = useOrganization(props);
  const {
    tenures, divisions, subDivisions, onSelectTenure, selectedTenureId, setSelectedTenureId, selectedMember, searchQuery, setSearchQuery,
    roleFilter, setRoleFilter, divisionFilter, setDivisionFilter, subDivisionFilter, setSubDivisionFilter, isExporting, currentTenure,
    handleExportPdf, activeDivisions, activeMembers, currentTenureRoles, penasehats, pembinas, displayLevel2, displayLevel3,
    isFiltering, filteredDirectoryMembers, handleMemberClick
  } = state;

  const roleName = (m: AppItem): string => m.role || findMatchingRole(m, currentTenureRoles)?.name || '';
  const subName = (m: AppItem): string | undefined => subDivisions.find((sd) => sd.id === m.subDivisionId)?.name;
  const card = (m: AppItem, compact = false) => (
    <OrgMemberCard key={m.id} member={m} roleName={roleName(m)} subDivisionName={subName(m)} compact={compact} onClick={() => handleMemberClick(m)} />
  );
  const periodLabel = currentTenure?.title || currentTenure?.code || '';
  const displayDivs: AppItem[] = activeDivisions.length > 0 ? activeDivisions : divisions.filter((d) => activeMembers.some((m) => m.divisionId === d.id));
  const resetFilters = () => { setSearchQuery(''); setRoleFilter('all'); setDivisionFilter('all'); setSubDivisionFilter('all'); };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 md:px-6">
      <PageHeader
        eyebrow={`Struktur Kepengurusan${periodLabel ? ` · ${periodLabel}` : ''}`}
        title="Melayani bersama"
        description="Struktur organisasi Bapekkris PT Bank Mandiri (Persero) Tbk. Pilih nama untuk melihat profil dan tanggung jawab."
        actions={activeMembers.length > 0 ? <Button variant="secondary" loading={isExporting} icon={<Download size={16} aria-hidden="true" />} onClick={handleExportPdf}>{isExporting ? 'Menyiapkan PDF…' : 'Unduh bagan (PDF)'}</Button> : undefined}
      />

      {(activeMembers.length > 0 || tenures.length > 0) && (
        <div className="mb-10 flex flex-col gap-3 border-y border-line py-4">
          <div className="relative">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
            <Input type="search" aria-label="Cari pengurus" placeholder="Cari nama, jabatan, atau tanggung jawab" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="rounded-full pl-11" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            {tenures.length > 0 && (
              <Select aria-label="Periode kepengurusan" value={selectedTenureId} onChange={(e) => { setSelectedTenureId(e.target.value); const t = tenures.find((x) => x.id === e.target.value); if (t) onSelectTenure?.(t); }}>
                {tenures.map((t) => <option key={t.id} value={t.id}>Periode {t.code || t.title}{t.isActive ? ' (aktif)' : ''}</option>)}
              </Select>
            )}
            {currentTenureRoles.length > 0 && (
              <Select aria-label="Jabatan" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">Semua jabatan ({activeMembers.length})</option>
                {currentTenureRoles.map((r) => {
                  const count = activeMembers.filter((m) => m.roleId === r.id || findMatchingRole(m, currentTenureRoles)?.id === r.id).length;
                  return <option key={r.id} value={r.id}>{r.name} ({count})</option>;
                })}
              </Select>
            )}
            {activeDivisions.length > 0 && (
              <Select aria-label="Divisi" value={divisionFilter} onChange={(e) => { setDivisionFilter(e.target.value); setSubDivisionFilter('all'); }}>
                <option value="all">Semua divisi</option>
                {activeDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            )}
            {subDivisions.length > 0 && (
              <Select aria-label="Sub-divisi" value={subDivisionFilter} onChange={(e) => setSubDivisionFilter(e.target.value)}>
                <option value="all">Semua sub-divisi</option>
                {(divisionFilter === 'all' ? subDivisions : subDivisions.filter((sd) => sd.divisionId === divisionFilter)).map((sd) => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
              </Select>
            )}
            {isFiltering && <Button variant="ghost" icon={<RotateCcw size={15} aria-hidden="true" />} onClick={resetFilters}>Reset</Button>}
          </div>
        </div>
      )}

      {isFiltering && (
        <section aria-label="Hasil pencarian" className="mb-14">
          <p className="mb-4 text-[0.86rem] font-semibold text-muted" aria-live="polite">{filteredDirectoryMembers.length} orang ditemukan</p>
          {filteredDirectoryMembers.length === 0
            ? <EmptyState icon={<Search size={22} />} title="Tidak ada yang cocok" description="Coba kata kunci atau filter lain." />
            : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredDirectoryMembers.map((m) => card(m))}</div>}
        </section>
      )}

      {activeMembers.length === 0 ? (
        <EmptyState icon={<Users size={22} />} title="Belum ada struktur organisasi" description={`Belum ada pengurus terdaftar pada periode ${periodLabel || 'ini'}.`} />
      ) : (
        <div id="org-tree-export-container" className="flex flex-col items-center gap-6 rounded-xl bg-page px-2 py-8 md:px-6 lg:gap-0">
          <header className="mb-10 text-center">
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-gold-ink">PT Bank Mandiri (Persero) Tbk.</p>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,3vw,2.1rem)] font-semibold text-ink">Struktur Organisasi Bapekkris Bank Mandiri</h2>
            <p className="mt-1 text-[0.9rem] text-muted">Periode {periodLabel || 'aktif'}</p>
          </header>

          {penasehats.length > 0 && <><Tier label="Dewan Penasehat"><div className="grid w-full max-w-3xl gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">{penasehats.map((m) => card(m))}</div></Tier><Connector /></>}
          {pembinas.length > 0 && <><Tier label="Pembina"><div className="grid w-full max-w-3xl gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">{pembinas.map((m) => card(m))}</div></Tier><Connector /></>}
          {displayLevel2.length > 0 && <><Tier label="Pimpinan"><div className="grid w-full max-w-3xl gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">{displayLevel2.map((m) => card(m))}</div></Tier><Connector /></>}
          {displayLevel3.length > 0 && <><Tier label="Pengurus Harian"><div className="grid w-full max-w-4xl gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">{displayLevel3.map((m) => card(m))}</div></Tier>{displayDivs.length > 0 && <Connector />}</>}

          {displayDivs.length > 0 && (
            <Tier label="Divisi Pelayanan">
              <div className="grid w-full gap-5 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
                {displayDivs.map((div) => {
                  const { leaders, members: divisionMembers } = getDivisionStructure(div, activeMembers, currentTenureRoles);
                  const lead = getDivisionLead(div, activeMembers, currentTenureRoles);
                  const effectiveLeaders: AppItem[] = leaders.length > 0 ? leaders : lead.member ? [lead.member] : div.leadName ? activeMembers.filter((m) => m.name === div.leadName) : [];
                  const accent = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(div.color || '') ? div.color : '#0b2f5e';
                  return (
                    <div key={div.id} data-pdf-card className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-card" style={{ borderTopWidth: 3, borderTopColor: accent }}>
                      <p className="font-display text-[1.15rem] font-semibold text-ink">{div.name}</p>
                      {effectiveLeaders.length > 0
                        ? <div className="flex flex-col gap-2">{effectiveLeaders.map((m) => card(m, true))}</div>
                        : <p className="text-[0.86rem] text-dim">Belum ada pimpinan</p>}
                      {divisionMembers.length > 0 && (
                        <div data-pdf-card className="rounded-md border border-line bg-page p-3">
                          <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-dim">Anggota ({divisionMembers.length})</p>
                          <ul className="flex list-none flex-col divide-y divide-line">
                            {divisionMembers.map((m) => (
                              <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                                <button type="button" onClick={() => handleMemberClick(m)} className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-navy-ink">
                                  <span className="block truncate text-[0.92rem] font-semibold text-ink hover:text-navy-ink">{m.name}</span>
                                  <span className="block truncate text-[0.76rem] text-dim">{roleName(m) || 'Anggota'}{m.motto ? ` · “${m.motto}”` : ''}</span>
                                </button>
                                {m.whatsapp && (
                                  <a href={`https://wa.me/${formatWaNumber(m.whatsapp)}`} target="_blank" rel="noopener noreferrer" aria-label={`Hubungi ${m.name} via WhatsApp`}
                                    className="shrink-0 rounded-full p-1.5 text-success hover:bg-success-tint"><MessageCircle size={16} aria-hidden="true" /></a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Tier>
          )}
        </div>
      )}

      {selectedMember && <MemberDialog member={selectedMember} roleName={roleName(selectedMember)} state={state} />}
    </div>
  );
}
