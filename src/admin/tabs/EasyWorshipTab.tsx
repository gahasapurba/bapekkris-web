import { MonitorPlay, Trash2 } from 'lucide-react';
import { Badge, Button, useFeedback } from '../../ui';
import { formatToIndonesianDate } from '../../utils/dateUtils';
import { setPageIntent } from '../../lib/pageIntent';
import { useAppNavigate } from '../../lib/appNavigation';
import { AdminEmpty, AdminList, AdminListRow, AdminPanel, IconButton } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

/** Service orders saved from the Multimedia Live console; open one in the console or delete it. */
export default function EasyWorshipTab() {
  const { easyWorshipSchedules, onDeleteEasyWorshipSchedule, showToast } = useAdminPortal();
  const { confirm } = useFeedback();
  const navigateTo = useAppNavigate();

  return (
    <AdminPanel title={`Jadwal EasyWorship (${easyWorshipSchedules.length})`}
      description="Tata ibadah yang disimpan dari halaman Multimedia Live (tombol Simpan sebagai jadwal, saat Anda masuk sebagai admin). Operator dapat memuatnya di konsol mana pun.">
      {easyWorshipSchedules.length === 0 ? (
        <AdminEmpty>Belum ada jadwal tersimpan. Susun tata ibadah di halaman <strong className="text-ink">Multimedia Live</strong>, lalu pilih <strong className="text-ink">Simpan sebagai jadwal</strong>.</AdminEmpty>
      ) : (
        <AdminList label="Jadwal EasyWorship">
          {easyWorshipSchedules.map((sch) => (
            <AdminListRow key={sch.id}
              meta={<><Badge tone="gold">{sch.serviceDate ? formatToIndonesianDate(sch.serviceDate) : 'Tanpa tanggal'}</Badge><span>{Array.isArray(sch.items) ? sch.items.length : 0} tayangan</span></>}
              title={sch.title}
              actions={<>
                <Button size="sm" variant="secondary" icon={<MonitorPlay size={14} aria-hidden="true" />}
                  onClick={() => { setPageIntent('easyworship', { scheduleId: sch.id }); navigateTo('/#easyworship'); }}>Buka di konsol</Button>
                <IconButton label={`Hapus jadwal ${sch.title}`} tone="danger" onClick={async () => {
                  if (await confirm({ title: `Hapus jadwal "${sch.title}"?`, message: 'Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', danger: true })) {
                    onDeleteEasyWorshipSchedule(sch.id);
                    showToast('Jadwal berhasil dihapus.');
                  }
                }}><Trash2 size={16} aria-hidden="true" /></IconButton>
              </>} />
          ))}
        </AdminList>
      )}
    </AdminPanel>
  );
}
