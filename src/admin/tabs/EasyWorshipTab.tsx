import { Trash2 } from 'lucide-react';
import { Badge, useFeedback } from '../../ui';
import { AdminEmpty, AdminList, AdminListRow, AdminPanel, IconButton } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

export default function EasyWorshipTab() {
  const { easyWorshipSchedules, onDeleteEasyWorshipSchedule, showToast } = useAdminPortal();
  const { confirm } = useFeedback();

  return (
    <AdminPanel title={`Jadwal EasyWorship (${easyWorshipSchedules.length})`} description="Tata ibadah multimedia yang disimpan dari halaman Multimedia Live.">
      {easyWorshipSchedules.length === 0 ? (
        <AdminEmpty>Belum ada jadwal tersimpan. Simpan tata ibadah dari halaman <strong className="text-ink">Multimedia Live</strong>.</AdminEmpty>
      ) : (
        <AdminList label="Jadwal EasyWorship">
          {easyWorshipSchedules.map((sch) => (
            <AdminListRow key={sch.id}
              meta={<><Badge tone="gold">{sch.serviceDate || 'Ibadah rutin'}</Badge><span>{Array.isArray(sch.playlist) ? `${sch.playlist.length} tayangan` : '1 tayangan'}</span></>}
              title={sch.title} subtitle={sch.description || undefined}
              actions={
                <IconButton label={`Hapus jadwal ${sch.title}`} tone="danger" onClick={async () => {
                  if (await confirm({ title: `Hapus jadwal "${sch.title}"?`, message: 'Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', danger: true })) {
                    onDeleteEasyWorshipSchedule?.(sch.id);
                    showToast('Jadwal berhasil dihapus.');
                  }
                }}><Trash2 size={16} aria-hidden="true" /></IconButton>
              } />
          ))}
        </AdminList>
      )}
    </AdminPanel>
  );
}
