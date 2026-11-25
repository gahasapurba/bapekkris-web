import { findMatchingRole, getTenureRoles } from '../utils/memberQuotaUtils';
import { useAdminPortal } from './AdminPortalContext';

export default function AdminSummaryBar() {
  const {
    activeTenure,
    devotions,
    divisions,
    easyWorshipSchedules,
    events,
    forms,
    isDark,
    members,
    roleQuotas,
    submissions,
    tenureRoles,
    tenures,
    worshipSongs
  } = useAdminPortal();

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

  // Top devotions
  const totalDevotionsCount = devotions.length;
  const totalSongsCount = worshipSongs.length;

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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px'
    }}>
      <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--mandiri-gold)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Personel ({tenureLabel})
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
          {scopedMembers.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Orang</span>
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2px 6px',
            alignItems: 'center'
          }}
        >
          {roleCounts.length > 0 ? (
            roleCounts.map((rc, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span>
                  <strong style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>{rc.count}</strong> {rc.name}
                </span>
                {idx < roleCounts.length - 1 && (
                  <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                )}
              </span>
            ))
          ) : (
            <span>Belum ada role di periode ini</span>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Realisasi Event ({tenureLabel})
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
          {completedEvents}/{scopedEvents.length} <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>({eventPercent}%)</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {scopedEvents.length - completedEvents} Agenda Upcoming / Berjalan
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--neon-cyan)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Total RAB ({tenureLabel})
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
          Rp {(totalRab / 1000000).toFixed(1)} Jt
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Akumulasi {scopedEvents.length} Event Periode {tenureLabel}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Data Respon ({tenureLabel})
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
          {scopedSubs.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Respon</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: '#10b981' }}>{acceptedSubs} Diterima</strong> • {pendingSubs} Perlu Review
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #f43f5e' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Pelayanan Rohani & Firman
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
          {devotions.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Renungan</span> • {worshipSongs.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pujian</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          EasyWorship: {easyWorshipSchedules.length} Jadwal
        </div>
      </div>
    </div>
  );

}
