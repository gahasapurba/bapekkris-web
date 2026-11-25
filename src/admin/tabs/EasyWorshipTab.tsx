import { Trash2 } from 'lucide-react';
import { useFeedback } from '../../ui';
import { useAdminPortal } from '../AdminPortalContext';

export default function EasyWorshipTab() {
  const {
    activeTab,
    easyWorshipSchedules,
    onDeleteEasyWorshipSchedule,
    showToast
  } = useAdminPortal();
  const { confirm } = useFeedback();

  return (
    <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
          Kelola Jadwal & Agenda EasyWorship Live ({easyWorshipSchedules.length})
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Daftar tata ibadah multimedia yang disimpan dari menu EasyWorship Live Bapekkris Bank Mandiri.
        </p>
      </div>

      <div>
        {easyWorshipSchedules.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            Belum ada jadwal tata ibadah EasyWorship yang tersimpan. Simpan jadwal ibadah dari menu <strong>EasyWorship Live</strong>.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {easyWorshipSchedules.map((sch) => (
              <div key={sch.id} style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge-gold" style={{ fontSize: '0.7rem' }}>{sch.serviceDate || 'Ibadah Rutin'}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                      {Array.isArray(sch.playlist) ? `${sch.playlist.length} Item Tayangan` : '1 Item'}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{sch.title}</h4>
                  {sch.description && <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sch.description}</p>}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (await confirm({ title: `Hapus jadwal EasyWorship "${sch.title}"?`, message: 'Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', danger: true })) {
                      if (onDeleteEasyWorshipSchedule) onDeleteEasyWorshipSchedule(sch.id);
                      showToast('Jadwal berhasil dihapus.');
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
