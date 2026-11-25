import { EyeOff } from 'lucide-react';
import { Button, EmptyState } from '../../../ui';
import { useProgramSectionContext } from '../ProgramSectionContext';

/** Shown when a shared link points at an event that is still a draft. */
export default function DraftEventNotice() {
  const { navigateTo, onSelectEventUrl, setEventDraftHidden } = useProgramSectionContext();
  return (
    <EmptyState
      className="border-gold-line bg-gold-tint"
      icon={<EyeOff size={22} />}
      title="Kegiatan ini belum dipublikasikan"
      description="Agenda yang Anda tuju masih dipersiapkan pengurus dan belum dibuka untuk umum. Silakan kembali lagi nanti atau pantau pengumuman resmi Bapekkris."
      action={
        <Button variant="secondary" onClick={() => { setEventDraftHidden(false); onSelectEventUrl?.(null); navigateTo('/#event'); }}>
          Lihat acara lainnya
        </Button>
      }
    />
  );
}
