import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock, ExternalLink, Link2, Lock, MapPin, Users } from 'lucide-react';
import { formatToIndonesianDate, formatWibEventRange, getDeadlineStatus } from '../../utils/dateUtils';
import { Badge, Button, EmptyState, cn } from '../../ui';
import { useEventRegistrationStats } from './useEventRegistrationStats';
import { RegistrationStatsContext } from './RegistrationStatsContext';
import ViewSwitcher from './sections/ViewSwitcher';
import StatsView from './sections/StatsView';
import LuckyDrawView from './sections/LuckyDrawView';
import LatestWinnersModal from './sections/LatestWinnersModal';
import ResetDrawConfirmModal from './sections/ResetDrawConfirmModal';
import DeleteWinnerConfirmModal from './sections/DeleteWinnerConfirmModal';
import PosterModal from './sections/PosterModal';
import DrawAlert from './sections/DrawAlert';

/**
 * Values the hook exposes. Keys are checked; values stay `any` because the hook is still
 * JavaScript, where TypeScript would infer `useState(null)` as always-null.
 */
export type RegistrationStatsState = { [K in keyof ReturnType<typeof useEventRegistrationStats>]: any };

export default function EventRegistrationStats(props: any) {
  const state: RegistrationStatsState = useEventRegistrationStats(props);
  const {
    activeAlert,
    activeView,
    connectedForm,
    effectiveIsLimited,
    effectiveMaxQuota,
    event,
    isFormClosed,
    isLuckyDrawEnabled,
    latestWinners,
    navigateTo,
    onBack,
    onNavigateForm,
    participationRate,
    posterModal,
    resetConfirmOpen,
    showLatestWinnersModal,
    totalPendaftar,
    winnerToDelete
  } = state;

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-[680px] px-4 py-16">
        <EmptyState className="border-danger-line bg-danger-tint" icon={<AlertCircle size={22} />} title="Statistik acara tidak ditemukan"
          description="Acara yang Anda tuju mungkin sudah dihapus atau tautan statistiknya tidak valid."
          action={<div className="flex flex-wrap justify-center gap-3">
            {onBack && <Button variant="secondary" onClick={onBack}>Kembali ke daftar acara</Button>}
            <Button onClick={() => navigateTo('/#home')}>Kembali ke Beranda</Button>
          </div>} />
      </div>
    );
  }

  const start: string = event.startDate || event.date || '';
  const end: string = event.endDate || start;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  let dateLabel = 'Tanggal agenda';
  if (dateOnly.test(start.slice(0, 10)) && dateOnly.test(end.slice(0, 10))) {
    dateLabel = start.slice(0, 10) === end.slice(0, 10) ? formatToIndonesianDate(start.slice(0, 10)) : formatWibEventRange(start.slice(0, 10), end.slice(0, 10));
  } else if (start || end) {
    dateLabel = formatWibEventRange(start, end, event.date || 'Tanggal agenda');
  }
  const timeOf = (v: string) => (v.includes('T') ? v.split('T')[1]?.slice(0, 5) : v.match(/\d{2}:\d{2}/)?.[0]);
  let timeLabel: string | null = null;
  if (event.time && event.time !== 'WIB') timeLabel = event.time;
  else if (start.includes('T') || /\d{2}:\d{2}/.test(start)) {
    const s = timeOf(start); const e = timeOf(end);
    timeLabel = s && e && s !== e ? `${s} – ${e} WIB` : s ? `${s} WIB` : null;
  }

  const hasQuota = effectiveIsLimited && effectiveMaxQuota > 0;
  const formStatus = (() => {
    if (!connectedForm) return null;
    if (isFormClosed) {
      const dl = connectedForm.deadline ? getDeadlineStatus(connectedForm.deadline) : null;
      return { tone: 'danger' as const, label: dl?.isExpired ? 'Ditutup — batas waktu berakhir' : 'Formulir ditutup' };
    }
    if (hasQuota && totalPendaftar >= effectiveMaxQuota) return { tone: 'danger' as const, label: 'Kuota penuh' };
    return { tone: 'success' as const, label: 'Pendaftaran dibuka' };
  })();

  return (
    <RegistrationStatsContext.Provider value={state}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pb-24 pt-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} aria-hidden="true" />} onClick={onBack}>Kembali ke kalender acara</Button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-success-line bg-success-tint px-3 py-1 text-[0.78rem] font-semibold text-success">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />Data diperbarui otomatis
            </span>
            {connectedForm && (
              <Button size="sm" variant={isFormClosed ? 'danger' : 'secondary'} disabled={isFormClosed}
                icon={isFormClosed ? <Lock size={13} aria-hidden="true" /> : <ExternalLink size={13} aria-hidden="true" />}
                onClick={() => { if (!isFormClosed) onNavigateForm?.(connectedForm.id); }}>
                {isFormClosed ? 'Formulir telah ditutup' : 'Buka formulir'}
              </Button>
            )}
          </div>
        </div>

        <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-gold-ink">{isLuckyDrawEnabled ? 'Statistik & undian acara' : 'Statistik acara'}</p>
            <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-tight text-ink">{event.title}</h1>
            <ul className="mt-3 flex list-none flex-wrap gap-x-5 gap-y-2 text-[0.9rem] text-muted">
              <li className="inline-flex items-center gap-1.5"><Calendar size={15} aria-hidden="true" className="text-gold-ink" />{dateLabel}</li>
              <li className="inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" className="text-gold-ink" />{event.location || 'Lokasi menyusul'}</li>
              {timeLabel && <li className="inline-flex items-center gap-1.5"><Clock size={15} aria-hidden="true" className="text-gold-ink" />{timeLabel}</li>}
            </ul>
          </div>
          {connectedForm ? (
            <div className={cn('w-full rounded-lg border p-4 lg:w-[340px]', isFormClosed ? 'border-danger-line bg-danger-tint' : 'border-info-line bg-info-tint')}>
              <p className="inline-flex items-center gap-1.5 text-[0.74rem] font-semibold uppercase tracking-wide text-muted"><Link2 size={13} aria-hidden="true" />Formulir pendaftaran</p>
              <p className="mt-1 font-semibold leading-snug text-ink">{connectedForm.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.8rem] text-muted">
                <span>{hasQuota ? `Kuota ${effectiveMaxQuota} peserta` : 'Kuota tanpa batas'}</span>
                {formStatus && <Badge tone={formStatus.tone}>{formStatus.label}</Badge>}
              </div>
            </div>
          ) : (
            <p className="w-full rounded-lg border border-dashed border-gold-line bg-gold-tint p-4 text-[0.86rem] text-ink lg:w-[340px]">Acara ini belum terhubung ke formulir pendaftaran.</p>
          )}
        </header>

        <section aria-label="Ringkasan peserta" className="rounded-xl border border-line bg-surface p-5 shadow-card md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-wide text-dim">Total peserta terdaftar</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="font-display text-[clamp(2.6rem,6vw,3.8rem)] font-semibold leading-none text-ink">{totalPendaftar}</span>
                <span className="text-[1.05rem] text-muted">{hasQuota ? `dari ${effectiveMaxQuota} kuota` : 'peserta'}</span>
              </p>
            </div>
            {hasQuota ? (
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-gold-tint text-gold-ink"><Users size={20} aria-hidden="true" /></span>
                <div>
                  <p className="text-[0.78rem] font-semibold uppercase tracking-wide text-dim">Keterisian</p>
                  <p className="font-display text-[2rem] font-semibold leading-none text-ink">{participationRate}%</p>
                </div>
              </div>
            ) : (
              <Badge tone="success"><CheckCircle2 size={14} aria-hidden="true" />Tanpa batas kuota</Badge>
            )}
          </div>
          {hasQuota && (
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-label="Keterisian kuota" aria-valuenow={Number(participationRate)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${Math.min(100, Number(participationRate) || 0)}%` }} />
            </div>
          )}
        </section>

        {isLuckyDrawEnabled && <ViewSwitcher />}
        {(!isLuckyDrawEnabled || activeView === 'stats') && <StatsView />}
        {isLuckyDrawEnabled && activeView === 'luckydraw' && <LuckyDrawView />}
        {showLatestWinnersModal && latestWinners.length > 0 && <LatestWinnersModal />}
        {resetConfirmOpen && <ResetDrawConfirmModal />}
        {winnerToDelete && <DeleteWinnerConfirmModal />}
        {posterModal && <PosterModal />}
        {activeAlert && <DrawAlert />}
      </div>
    </RegistrationStatsContext.Provider>
  );
}
