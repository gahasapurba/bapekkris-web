import { Trophy } from 'lucide-react';
import { Badge, Button, Dialog } from '../../../ui';
import { useRegistrationStats } from '../RegistrationStatsContext';
import { fieldValue } from '../participantInfo';

/** Shown right after a draw: every new winner with all of their form answers. */
export default function LatestWinnersModal() {
  const { formFields, formSubmissions, latestWinners, prizeName, setShowLatestWinnersModal } = useRegistrationStats();
  const close = () => setShowLatestWinnersModal(false);
  return (
    <Dialog open onClose={close} size="lg"
      title={<span className="inline-flex items-center gap-2"><Trophy size={20} aria-hidden="true" className="text-gold-ink" />Selamat kepada pemenang!</span>}
      description={prizeName}
      footer={<Button variant="gold" onClick={close}>Simpan & tutup</Button>}>
      <ol className="flex list-none flex-col gap-4">
        {latestWinners.map((w, idx) => {
          const sub = formSubmissions.find((s) => s.id === w.submissionId) ||
            formSubmissions.find((s) => (s.name || '').toLowerCase() === (w.winnerName || '').toLowerCase());
          const data = w.submissionData || sub?.data || {};
          return (
            <li key={w.id || idx} className="rounded-lg border border-gold-line bg-gold-tint p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gold-line pb-2">
                <span className="font-display text-[1.1rem] font-semibold text-ink">Pemenang #{w.drawNumber || idx + 1}</span>
                <Badge tone="gold">{w.prizeName || 'Doorprize utama'}</Badge>
              </div>
              <dl className="grid gap-2 sm:grid-cols-2">
                {formFields.map((f) => {
                  const val = fieldValue(data, f) ?? (f.label.toLowerCase().includes('nama') ? w.winnerName : '-');
                  return (
                    <div key={f.id} className="rounded-md border border-line bg-surface px-3 py-2">
                      <dt className="text-[0.72rem] font-semibold uppercase tracking-wide text-dim">{f.label}</dt>
                      <dd className="break-words font-semibold text-ink">{String(val || '-')}</dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
      </ol>
    </Dialog>
  );
}
