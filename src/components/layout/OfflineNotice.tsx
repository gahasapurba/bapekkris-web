import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Thin bar shown while the device is offline; content then comes from the offline cache. */
export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);

  useEffect(() => {
    const update = () => setIsOffline(navigator.onLine === false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!isOffline) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b border-gold-line bg-gold-tint px-4 py-2 text-center text-[0.86rem] font-medium text-ink">
      <WifiOff size={15} aria-hidden="true" className="shrink-0 text-gold-ink" />
      Anda sedang offline. Renungan, Alkitab, dan lirik yang pernah dibuka tetap bisa dibaca; pendaftaran perlu koneksi internet.
    </div>
  );
}
