import { AlertCircle } from 'lucide-react';
import { Button, EmptyState } from '../../../ui';
import { useProgramSectionContext } from '../ProgramSectionContext';

/** Shown when a shared link points at an event that no longer exists. */
export default function EventNotFoundNotice() {
  const { navigateTo, onSelectEventUrl, setEventNotFound } = useProgramSectionContext();
  return (
    <EmptyState
      className="border-danger-line bg-danger-tint"
      icon={<AlertCircle size={22} />}
      title="Acara tidak ditemukan"
      description="Tautan acara yang Anda tuju tidak ditemukan atau sudah dihapus pengelola."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => { setEventNotFound(false); onSelectEventUrl?.(null); navigateTo('/#home'); }}>Kembali ke Beranda</Button>
          <Button onClick={() => { setEventNotFound(false); onSelectEventUrl?.(null); }}>Lihat semua acara</Button>
        </div>
      }
    />
  );
}
