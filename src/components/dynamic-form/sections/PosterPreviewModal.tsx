import { Download } from 'lucide-react';
import { Button, ButtonLink, Dialog } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function PosterPreviewModal() {
  const { posterPreview, setPosterPreview } = useDynamicFormContext();
  if (!posterPreview) return null;
  const close = () => setPosterPreview(null);
  return (
    <Dialog open onClose={close} size="sm" title="Poster QR formulir"
      footer={<><Button variant="secondary" onClick={close}>Tutup</Button><ButtonLink href={posterPreview.url} download={posterPreview.filename} icon={<Download size={16} aria-hidden="true" />}>Unduh PNG</ButtonLink></>}>
      <img src={posterPreview.url} alt={posterPreview.title} className="mx-auto max-h-[60vh] w-auto rounded-md border border-line" />
      <p className="mt-4 text-[0.86rem] text-muted">Di ponsel, tekan dan tahan gambar lalu pilih “Simpan gambar”, atau gunakan tombol unduh.</p>
    </Dialog>
  );
}
