import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';
import { Button } from '../../ui';

interface RegistrationQrProps {
  /** Registration ID encoded in the QR (sub-… or rsvp-…), scanned by the committee at check-in. */
  code: string;
  /** Shown under the QR and used for the downloaded file name. */
  label?: string;
}

/** QR code a participant shows at the venue so the committee can mark attendance. */
export default function RegistrationQr({ code, label = 'QR check-in acara' }: RegistrationQrProps) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    // Colours are fixed (dark on white) so scanners read it in both themes.
    QRCode.toDataURL(code, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0b2545', light: '#ffffff' } })
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch((err) => console.error('QR generation failed:', err));
    return () => { cancelled = true; };
  }, [code]);

  return (
    <figure className="m-0 flex flex-col items-center gap-3 rounded-lg border border-line bg-page px-6 py-5">
      <figcaption className="inline-flex items-center gap-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-dim">
        <QrCode size={14} aria-hidden="true" />{label}
      </figcaption>
      <div className="flex size-[180px] items-center justify-center rounded-md bg-white p-2">
        {dataUrl
          ? <img src={dataUrl} alt={`QR berisi ID pendaftaran ${code}`} width={164} height={164} />
          : <span className="text-[0.8rem] text-dim">Membuat QR…</span>}
      </div>
      <p className="max-w-[34ch] text-center text-[0.82rem] text-muted">Tunjukkan QR ini kepada panitia saat tiba di lokasi acara.</p>
      {dataUrl && (
        <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />}
          onClick={() => { const a = document.createElement('a'); a.href = dataUrl; a.download = `qr-${code}.png`; a.click(); }}>
          Simpan QR
        </Button>
      )}
    </figure>
  );
}
