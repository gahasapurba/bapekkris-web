import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, MonitorSmartphone, Power } from 'lucide-react';
import { Badge, Button, Dialog } from '../../ui';
import { getPublicBaseUrl } from '../../utils/urlUtils';
import { projectorRoomUrl } from '../../lib/projectorSync';

interface RemoteProjectorDialogProps {
  open: boolean;
  onClose: () => void;
  roomCode: string | null;
  connectedScreens: number;
  onStop: () => void;
}

/** Shows the room code, link and QR a projector device opens to mirror this console. */
export default function RemoteProjectorDialog({ open, onClose, roomCode, connectedScreens, onStop }: RemoteProjectorDialogProps) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const url = roomCode ? projectorRoomUrl(getPublicBaseUrl(), roomCode) : '';

  useEffect(() => {
    if (!url) { setQr(''); return undefined; }
    let cancelled = false;
    QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: '#0b2545', light: '#ffffff' } })
      .then((data) => { if (!cancelled) setQr(data); })
      .catch((err) => console.error('QR generation failed:', err));
    return () => { cancelled = true; };
  }, [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Layar proyektor di perangkat lain"
      description="Buka tautan atau pindai QR ini di laptop/TV yang terhubung ke proyektor. Slide akan mengikuti konsol ini secara langsung."
      footer={(
        <>
          <Button variant="danger" icon={<Power size={16} aria-hidden="true" />} onClick={() => { onStop(); onClose(); }}>Akhiri sesi</Button>
          <Button onClick={onClose}>Selesai</Button>
        </>
      )}
    >
      {roomCode && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div>
            <p className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-dim">Kode ruang</p>
            <p className="mt-1 font-mono text-[2.2rem] font-semibold tracking-[0.3em] text-ink" aria-label={`Kode ruang ${roomCode.split('').join(' ')}`}>{roomCode}</p>
          </div>
          <div className="flex size-[200px] items-center justify-center rounded-md bg-white p-2">
            {qr ? <img src={qr} alt="QR tautan layar proyektor" width={184} height={184} /> : <span className="text-[0.8rem] text-dim">Membuat QR…</span>}
          </div>
          <div className="flex w-full items-center gap-2 rounded-md border border-line bg-page px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-left font-mono text-[0.8rem] text-muted">{url}</span>
            <Button size="sm" variant="secondary" icon={copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} onClick={copy}>
              {copied ? 'Tersalin' : 'Salin'}
            </Button>
          </div>
          <Badge tone={connectedScreens > 0 ? 'success' : 'neutral'}>
            <MonitorSmartphone size={13} aria-hidden="true" />
            {connectedScreens > 0 ? `${connectedScreens} layar tersambung` : 'Menunggu layar tersambung…'}
          </Badge>
          <p className="text-[0.82rem] text-dim">Bagikan kode hanya kepada operator. Sesi berakhir saat Anda menekan “Akhiri sesi”.</p>
        </div>
      )}
    </Dialog>
  );
}
