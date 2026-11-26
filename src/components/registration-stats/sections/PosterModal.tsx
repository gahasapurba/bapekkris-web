import { Download } from 'lucide-react';
import { Button, Dialog } from '../../../ui';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function PosterModal() {
  const { posterModal, setPosterModal } = useRegistrationStats();
  if (!posterModal) return null;
  const { blob } = posterModal;
  const close = () => setPosterModal(null);
  const download = () => {
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = posterModal.fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 2000);
  };
  return (
    <Dialog open onClose={close} title="Poster QR pendaftaran"
      footer={<>
        <Button variant="secondary" onClick={close}>Tutup</Button>
        <Button variant="gold" icon={<Download size={15} aria-hidden="true" />} onClick={download}>Unduh PNG</Button>
      </>}>
      <img src={posterModal.dataUrl} alt="Poster QR formulir pendaftaran" className="h-auto w-full rounded-md border border-line" />
      <p className="mt-4 rounded-md border border-info-line bg-info-tint px-4 py-3 text-[0.86rem] leading-relaxed text-ink">
        <strong>Di ponsel:</strong> tekan dan tahan gambar poster, lalu pilih “Simpan Gambar” atau bagikan ke WhatsApp.
      </p>
    </Dialog>
  );
}
