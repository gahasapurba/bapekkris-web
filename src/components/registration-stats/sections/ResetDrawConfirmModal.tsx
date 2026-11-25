import { Button, Dialog } from '../../../ui';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function ResetDrawConfirmModal() {
  const { event, eventWinners, onResetLuckyDraw, setResetConfirmOpen } = useRegistrationStats();
  const close = () => setResetConfirmOpen(false);
  return (
    <Dialog open onClose={close} size="sm" title="Reset semua pemenang?"
      description={`Seluruh data ${eventWinners.length} pemenang undian acara ini akan dihapus, dan semua pendaftar kembali masuk ke undian.`}
      footer={<>
        <Button variant="secondary" onClick={close}>Batal</Button>
        <Button variant="danger" onClick={() => { onResetLuckyDraw?.(event.id); close(); }}>Ya, reset pemenang</Button>
      </>} />
  );
}
