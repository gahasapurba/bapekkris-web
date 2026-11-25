import { Send } from 'lucide-react';
import { formatWibEventRange } from '../../../utils/dateUtils';
import { Button, Dialog } from '../../../ui';
import { useProgramSectionContext } from '../ProgramSectionContext';

export default function RsvpConfirmDialog() {
  const { handleFinalSubmitRsvp, isSubmittingRsvp, rsvpModalEvent: evt, rsvpMode, rsvpName, rsvpNotes, setConfirmRsvpOpen } = useProgramSectionContext();
  const close = () => setConfirmRsvpOpen(false);
  return (
    <Dialog open onClose={close} size="sm" title="Konfirmasi kehadiran" description="Periksa kembali rincian sebelum disimpan."
      footer={<><Button variant="secondary" onClick={close}>Cek ulang</Button><Button onClick={handleFinalSubmitRsvp} loading={isSubmittingRsvp} icon={<Send size={15} aria-hidden="true" />} data-autofocus>{isSubmittingRsvp ? 'Mengirim…' : 'Ya, kirim sekarang'}</Button></>}>
      <dl className="grid gap-3 text-[0.92rem]">
        <div><dt className="text-dim">Acara</dt><dd className="font-semibold text-ink">{evt.title}</dd></div>
        <div><dt className="text-dim">Jadwal & lokasi</dt><dd className="text-ink">{formatWibEventRange(evt.startDate, evt.endDate, evt.date)} · {evt.location || 'Plaza Mandiri'}</dd></div>
        <div><dt className="text-dim">Nama</dt><dd className="font-semibold text-ink">{rsvpName}</dd></div>
        <div><dt className="text-dim">Kehadiran</dt><dd className="text-ink">{rsvpMode === 'Hadir Online' ? 'Hadir online / Teams' : 'Hadir di lokasi'}</dd></div>
        {rsvpNotes.trim() && <div><dt className="text-dim">Catatan</dt><dd className="italic text-ink">“{rsvpNotes.trim()}”</dd></div>}
      </dl>
    </Dialog>
  );
}
