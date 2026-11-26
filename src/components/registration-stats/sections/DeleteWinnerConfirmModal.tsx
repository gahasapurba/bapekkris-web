import { Button, Dialog } from '../../../ui';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function DeleteWinnerConfirmModal() {
  const { getWinnerDisplayName, onDeleteLuckyDraw, setWinnerToDelete, winnerToDelete } = useRegistrationStats();
  if (!winnerToDelete) return null;
  const close = () => setWinnerToDelete(null);
  return (
    <Dialog open onClose={close} size="sm" title="Hapus pemenang ini?"
      description={<>Pemenang <strong className="text-ink">{getWinnerDisplayName(winnerToDelete)}</strong> akan dibatalkan dan peserta ini bisa diundi lagi pada sesi berikutnya.</>}
      footer={<>
        <Button variant="secondary" onClick={close}>Batal</Button>
        <Button variant="danger" onClick={() => { onDeleteLuckyDraw?.(winnerToDelete.id); close(); }}>Ya, hapus pemenang</Button>
      </>} />
  );
}
