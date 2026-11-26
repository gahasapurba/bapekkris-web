import { BookOpen, CalendarCheck, FileCheck2, Users, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { findMatchingRole, getTenureRoles } from '../utils/memberQuotaUtils';
import { useAdminPortal } from './AdminPortalContext';

function formatRupiahShort(n: number): string {
  const fmt = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  if (n >= 1e12) return `Rp ${fmt(n / 1e12)} T`;
  if (n >= 1e9) return `Rp ${fmt(n / 1e9)} M`;
  if (n >= 1e6) return `Rp ${fmt(n / 1e6)} jt`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function Tile({ label, icon, value, unit, children, className = '' }: { label: string; icon: ReactNode; value: ReactNode; unit?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 rounded-lg border border-line bg-surface p-4 shadow-card ${className}`}>
      <p className="flex items-center justify-between gap-2 text-[0.74rem] font-semibold uppercase tracking-wide text-dim">
        <span className="truncate">{label}</span><span className="text-gold-ink" aria-hidden="true">{icon}</span>
      </p>
      <p className="font-display text-[1.7rem] font-semibold leading-tight text-ink">{value}{unit && <span className="ml-1.5 font-sans text-[0.84rem] font-medium text-muted">{unit}</span>}</p>
      {children && <div className="text-[0.8rem] leading-snug text-muted">{children}</div>}
    </div>
  );
}

/** Bento summary of the active tenure, shown above every admin tab. */
export default function AdminSummaryBar() {
  const { activeTenure, devotions, divisions, easyWorshipSchedules, events, forms, members, roleQuotas, submissions, tenureRoles, tenures, worshipSongs } = useAdminPortal();

  const activeTenureId = activeTenure?.id || '';
  const scopedMembers = activeTenureId ? members.filter(m => m.tenureId === activeTenureId) : members;
  const scopedEvents = activeTenureId
    ? events.filter(e => e.tenureId === activeTenureId || (!e.tenureId && divisions.find(d => d.id === e.divisionId)?.tenureId === activeTenureId))
    : events;
  const completedEvents = scopedEvents.filter(e => e.status === 'Completed').length;
  const eventPercent = scopedEvents.length > 0 ? Math.round((completedEvents / scopedEvents.length) * 100) : 0;
  const totalRab = scopedEvents.reduce((acc, e) => acc + Number(e.totalRab || 0), 0);

  const scopedForms = activeTenureId ? forms.filter(f => f.tenureId === activeTenureId) : forms;
  const scopedFormIds = new Set(scopedForms.map(f => f.id));
  const scopedSubs = activeTenureId
    ? submissions.filter(s => s.tenureId === activeTenureId || scopedFormIds.has(s.formId))
    : submissions;
  const acceptedSubs = scopedSubs.filter(s => s.status === 'Accepted').length;
  const pendingSubs = scopedSubs.filter(s => !s.status || s.status === 'Submitted').length;

  const tenureLabel = activeTenure?.code || activeTenure?.title || 'Aktif';


  // Breakdown personel dinamis berdasarkan role yang ada pada periode/tenure ini
  const currentTenureRoles = (activeTenureId
    ? getTenureRoles(activeTenureId, roleQuotas, tenureRoles)
    : (tenures.length > 0 ? getTenureRoles(tenures[0]?.id, roleQuotas, tenureRoles) : [])
  ).sort((a, b) => (Number(a.level ?? 5) - Number(b.level ?? 5)) || (Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)));

  const roleCounts = [];
  if (currentTenureRoles.length > 0) {
    const accountedMemberIds = new Set();
    currentTenureRoles.forEach(r => {
      const matchedMembers = scopedMembers.filter(m => {
        if (m.roleId && m.roleId === r.id) return true;
        const matched = findMatchingRole(m, currentTenureRoles);
        return matched ? matched.id === r.id : (m.role || '').toLowerCase().trim() === String(r?.name || '').toLowerCase().trim();
      });
      matchedMembers.forEach(m => accountedMemberIds.add(m.id));
      roleCounts.push({ name: r.name, count: matchedMembers.length });
    });

    const unassigned = scopedMembers.filter(m => !accountedMemberIds.has(m.id));
    if (unassigned.length > 0) {
      roleCounts.push({ name: 'Lainnya', count: unassigned.length });
    }
  } else {
    const dynamicMap: Record<string, number> = {};
    scopedMembers.forEach(m => {
      const rName = (m.role || m.title || 'Personel').trim();
      dynamicMap[rName] = (dynamicMap[rName] || 0) + 1;
    });
    Object.entries(dynamicMap).forEach(([name, count]) => {
      roleCounts.push({ name, count });
    });
  }

  const tiles = (
    <>
      <Tile className="col-span-2" label={`Personel · ${tenureLabel}`} icon={<Users size={16} />} value={scopedMembers.length} unit="orang">
        {roleCounts.length > 0
          ? <ul className="flex list-none flex-wrap gap-x-3 gap-y-0.5">{roleCounts.map((rc, i) => <li key={i}><strong className="text-ink">{rc.count}</strong> {rc.name}</li>)}</ul>
          : 'Belum ada jabatan di periode ini'}
      </Tile>
      <Tile label="Realisasi acara" icon={<CalendarCheck size={16} />} value={`${completedEvents}/${scopedEvents.length}`} unit={`(${eventPercent}%)`}>
        {scopedEvents.length - completedEvents} akan datang / berjalan
      </Tile>
      <Tile label="Total RAB" icon={<Wallet size={16} />} value={formatRupiahShort(totalRab)}>
        Dari {scopedEvents.length} acara
      </Tile>
      <Tile className="col-span-2 lg:col-span-2" label="Data pendaftaran" icon={<FileCheck2 size={16} />} value={scopedSubs.length} unit="respons">
        <strong className="text-success">{acceptedSubs} diterima</strong> · {pendingSubs} perlu ditinjau
      </Tile>
      <Tile className="col-span-2 lg:col-span-2" label="Pelayanan firman & pujian" icon={<BookOpen size={16} />} value={devotions.length} unit={`renungan · ${worshipSongs.length} lagu`}>
        {easyWorshipSchedules.length} jadwal EasyWorship
      </Tile>
    </>
  );
  return (
    <>
      {/* Desktop: always visible. Phones: folded so each tab's content starts near the top. */}
      <section aria-label={`Ringkasan periode ${tenureLabel}`} className="hidden grid-cols-4 gap-3 lg:grid">{tiles}</section>
      <details className="group rounded-lg border border-line bg-surface shadow-card lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[0.9rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <span>Ringkasan periode {tenureLabel}</span>
          <span className="text-[0.8rem] font-medium text-muted group-open:hidden">Tampilkan</span>
          <span className="hidden text-[0.8rem] font-medium text-muted group-open:inline">Sembunyikan</span>
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-line p-3" aria-label={`Ringkasan periode ${tenureLabel}`}>{tiles}</div>
      </details>
    </>
  );
}
