import { FileSpreadsheet, Trophy } from 'lucide-react';
import { cn } from '../../../ui';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function ViewSwitcher() {
  const { activeView, eventWinners, setActiveView } = useRegistrationStats();
  const tab = (id: 'stats' | 'luckydraw', label: string, icon: React.ReactNode) => (
    <button type="button" role="tab" aria-selected={activeView === id} onClick={() => setActiveView(id)}
      className={cn('inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-4 text-[0.88rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink',
        activeView === id ? 'bg-action text-on-action' : 'bg-transparent text-muted hover:text-ink')}>
      {icon}{label}
    </button>
  );
  return (
    <div role="tablist" aria-label="Tampilan" className="mx-auto flex w-full max-w-[460px] gap-1 rounded-full border border-line bg-surface p-1">
      {tab('stats', 'Statistik & QR', <FileSpreadsheet size={15} aria-hidden="true" />)}
      {tab('luckydraw', `Undian (${eventWinners.length})`, <Trophy size={15} aria-hidden="true" />)}
    </div>
  );
}
