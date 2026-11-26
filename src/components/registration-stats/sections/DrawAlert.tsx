import { Sparkles, X } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

/** Bottom-right notice for each new registrant (queued by the hook). */
export default function DrawAlert() {
  const { activeAlert, setActiveAlert } = useRegistrationStats();
  if (!activeAlert) return null;
  return (
    <div role="status" aria-live="polite"
      className="fixed bottom-6 right-4 z-[99999] flex w-[calc(100vw-32px)] max-w-[380px] items-center gap-3 rounded-lg border border-success-line bg-surface p-4 shadow-card md:right-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-tint text-success"><Sparkles size={18} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-success">Pendaftar baru</p>
        <p className="truncate font-semibold text-ink">Selamat datang, {activeAlert.name}!</p>
      </div>
      <button type="button" onClick={() => setActiveAlert(null)} aria-label="Tutup notifikasi"
        className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-muted hover:bg-subtle hover:text-ink">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
