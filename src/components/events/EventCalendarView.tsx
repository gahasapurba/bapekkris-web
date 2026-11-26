import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Pencil } from 'lucide-react';
import type { AppItem, RegistrationCounts } from '../../lib/supabase';
import { formatWibEventRange, isEventPassed, toWibIsoDate } from '../../utils/dateUtils';
import { getUnifiedEventAttendees } from '../../utils/quotaUtils';
import { Badge, Button, Card, EmptyState, Pagination, cn, type BadgeTone } from '../../ui';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const EVENTS_PER_PAGE = 9;
const FALLBACK_COLOR = '#0b2f5e';

/** rgba() tint of a division colour (#rgb / #rrggbb); html2canvas-safe, unlike color-mix(). */
function tint(color: string | undefined, alpha: number): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color || '') ? color!.slice(1) : FALLBACK_COLOR.slice(1);
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function statusOf(evt: AppItem): { label: string; tone: BadgeTone } {
  if (evt.status === 'Completed' || isEventPassed(evt.startDate, evt.endDate)) return { label: 'Selesai', tone: 'neutral' };
  if (evt.status === 'Ongoing') return { label: 'Berlangsung', tone: 'success' };
  return { label: 'Akan datang', tone: 'gold' };
}

interface EventCalendarViewProps {
  events?: AppItem[];
  divisions?: AppItem[];
  forms?: AppItem[];
  registrationCounts?: RegistrationCounts;
  activeTenure?: AppItem | null;
  onSelectEvent?: ((evt: AppItem, sameDayEvents?: AppItem[]) => void) | null;
  onEditEvent?: ((evt: AppItem) => void) | null;
  /** Admin portal: shows drafts (dashed), public/draft counts and an edit button. */
  isAdmin?: boolean;
}

export default function EventCalendarView({
  events = [], divisions = [], forms = [], registrationCounts, activeTenure = null, onSelectEvent = null, onEditEvent = null, isAdmin = false
}: EventCalendarViewProps) {
  const [currentYear, setCurrentYear] = useState(() => {
    const first = events.find((e) => e.startDate && e.status !== 'Completed') || events.find((e) => e.startDate);
    if (first?.startDate) {
      const y = new Date(first.startDate).getFullYear();
      if (!isNaN(y) && y > 2000 && y < 2100) return y;
    }
    const tenureYear = parseInt(activeTenure?.code, 10);
    if (!isNaN(tenureYear) && tenureYear > 2000 && tenureYear < 2100) return tenureYear;
    return new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const nowM = new Date().getMonth();
    const inYear = events.filter((e) => e.startDate && e.status !== 'Completed' && new Date(e.startDate).getFullYear() === currentYear);
    if (inYear.length > 0) {
      const upcoming = inYear.filter((e) => new Date(e.startDate).getMonth() >= nowM);
      return new Date((upcoming[0] || inYear[0]).startDate).getMonth();
    }
    return nowM;
  });
  const [page, setPage] = useState(1);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Jump to the browsed tenure's events when the tenure changes.
  useEffect(() => {
    if (!activeTenure?.id) return;
    const tenureEvents = events.filter((e) => e.tenureId === activeTenure.id && e.startDate);
    if (tenureEvents.length > 0) {
      const target = tenureEvents.find((e) => e.status !== 'Completed' && new Date(e.startDate) >= new Date()) || tenureEvents[0];
      const d = new Date(target.startDate);
      if (!isNaN(d.getFullYear())) { setCurrentYear(d.getFullYear()); setCurrentMonth(d.getMonth()); setPage(1); }
    } else {
      const y = parseInt(activeTenure?.code, 10);
      if (!isNaN(y) && y > 2000 && y < 2100) { setCurrentYear(y); setPage(1); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenure?.id, activeTenure?.code]);

  const monthEvents = events.filter((evt) => {
    if (!evt.startDate) return false;
    const s = new Date(evt.startDate);
    const e = evt.endDate ? new Date(evt.endDate) : s;
    return s <= new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999) && e >= new Date(currentYear, currentMonth, 1);
  });
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const offset = new Date(currentYear, currentMonth, 1).getDay();
  const today = toWibIsoDate();

  const goMonth = (delta: number) => {
    setPage(1);
    const m = currentMonth + delta;
    setCurrentYear((y) => y + Math.floor(m / 12));
    setCurrentMonth(((m % 12) + 12) % 12);
  };
  const open = (evt: AppItem, sameDay: AppItem[] = []) => {
    if (onSelectEvent) onSelectEvent(evt, sameDay);
    else if (isAdmin && onEditEvent) onEditEvent(evt);
  };
  const colorOf = (evt: AppItem) => divisions.find((d) => d.id === evt.divisionId)?.color;

  const pageCount = Math.ceil(monthEvents.length / EVENTS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(1, page), pageCount);
  const visible = monthEvents.slice((safePage - 1) * EVENTS_PER_PAGE, safePage * EVENTS_PER_PAGE);
  const publicCount = monthEvents.filter((e) => e.isPublic === true).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[1.8rem] font-semibold leading-tight text-ink" aria-live="polite">{MONTHS[currentMonth]} {currentYear}</h2>
          <p className="text-[0.88rem] text-muted">
            {monthEvents.length} acara bulan ini{isAdmin && ` · ${publicCount} publik, ${monthEvents.length - publicCount} draft`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => goMonth(-1)} aria-label="Bulan sebelumnya" className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-navy-ink"><ChevronLeft size={18} aria-hidden="true" /></button>
          <Button variant="secondary" onClick={() => { const n = new Date(); setCurrentMonth(n.getMonth()); setCurrentYear(n.getFullYear()); setPage(1); }}>Bulan ini</Button>
          <button type="button" onClick={() => goMonth(1)} aria-label="Bulan berikutnya" className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-navy-ink"><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      </div>

      {isAdmin && (
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.84rem] text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-4 w-1 rounded-full bg-navy" aria-hidden="true" />Garis penuh: acara publik</span>
          <span className="inline-flex items-center gap-2"><span className="h-4 w-0 border-l-[3px] border-dashed border-gold-ink" aria-hidden="true" />Garis putus-putus: draft (hanya admin)</span>
          <span>Warna mengikuti divisi.</span>
        </p>
      )}

      <Card padding="none" className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-7 border-b border-line">
            {DAYS.map((d, i) => (
              <div key={d} className={cn('px-3 py-3 text-center text-[0.74rem] font-semibold uppercase tracking-[0.12em]', i === 0 ? 'text-danger' : 'text-dim')}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} className="min-h-28 border-b border-r border-line bg-page" />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter((evt) => evt.startDate && date >= evt.startDate.slice(0, 10) && date <= (evt.endDate || evt.startDate).slice(0, 10));
              const slot = offset + i;
              const col = slot % 7;
              const isToday = date === today;
              return (
                <div key={day}
                  onClick={() => dayEvents.length > 0 && open(dayEvents[0], dayEvents)}
                  onMouseEnter={() => dayEvents.length > 0 && setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={cn('relative flex min-h-28 flex-col gap-1 border-b border-r border-line p-2', dayEvents.length > 0 && 'cursor-pointer bg-surface hover:bg-surface-hover', col === 6 && 'border-r-0')}>
                  <span className={cn('inline-flex size-7 items-center justify-center rounded-full text-[0.84rem] font-semibold', isToday ? 'bg-action text-on-action' : col === 0 ? 'text-danger' : 'text-ink')}>
                    {day}
                  </span>
                  {dayEvents.slice(0, 2).map((ev) => {
                    const done = ev.status === 'Completed' || isEventPassed(ev.startDate, ev.endDate);
                    const draft = isAdmin && ev.isPublic !== true;
                    return (
                      <button key={ev.id} type="button" onClick={(e) => { e.stopPropagation(); open(ev, dayEvents); }}
                        title={`${ev.title}${done ? ' (selesai)' : ''}${isAdmin ? (ev.isPublic !== true ? ' — draft' : ' — publik') : ''}`}
                        style={{ borderLeftColor: done ? 'var(--text-dim)' : colorOf(ev) || FALLBACK_COLOR, background: tint(colorOf(ev), 0.1) }}
                        className={cn('w-full cursor-pointer truncate rounded-sm border-0 border-l-[3px] px-1.5 py-0.5 text-left text-[0.74rem] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-navy-ink',
                          draft && 'border-dashed', done && 'text-dim line-through decoration-1')}>
                        {draft && <span className="mr-1 text-gold-ink">Draft ·</span>}{ev.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); open(dayEvents[0], dayEvents); }} className="cursor-pointer border-0 bg-transparent p-0 text-left text-[0.72rem] font-semibold text-navy-ink hover:underline">
                      +{dayEvents.length - 2} lagi
                    </button>
                  )}
                  {hoveredDate === date && dayEvents.length > 0 && (
                    <div onClick={(e) => e.stopPropagation()}
                      className={cn('absolute z-20 w-64 rounded-lg border border-line bg-surface p-3 shadow-card',
                        slot < 14 ? 'top-full mt-1' : 'bottom-full mb-1', col <= 1 ? 'left-0' : col >= 5 ? 'right-0' : 'left-1/2 -translate-x-1/2')}>
                      <p className="mb-2 flex items-center justify-between text-[0.8rem] font-semibold text-ink">
                        <span>{day} {MONTHS[currentMonth]}</span><span className="text-dim">{dayEvents.length} agenda</span>
                      </p>
                      <ul className="flex list-none flex-col gap-1.5">
                        {dayEvents.map((ev) => (
                          <li key={ev.id}>
                            <button type="button" onClick={() => open(ev, dayEvents)} className="w-full cursor-pointer rounded-md border border-line bg-page px-2.5 py-2 text-left hover:border-line-strong">
                              <span className="flex items-center gap-2 text-[0.82rem] font-semibold text-ink">
                                <span className="size-2 shrink-0 rounded-full" style={{ background: colorOf(ev) || FALLBACK_COLOR }} aria-hidden="true" />
                                <span className="truncate">{ev.title}</span>
                                {isAdmin && <span className="ml-auto text-[0.7rem] font-semibold text-gold-ink">{ev.isPublic === true ? 'Publik' : 'Draft'}</span>}
                              </span>
                              <span className="block truncate pl-4 text-[0.74rem] text-dim">{[ev.divisionName, ev.location].filter(Boolean).join(' · ')}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[0.72rem] text-dim">{isAdmin ? 'Klik agenda untuk melihat atau mengubah.' : 'Klik agenda untuk detail & RSVP.'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <section aria-label={`Acara bulan ${MONTHS[currentMonth]} ${currentYear}`}>
        <h3 className="mb-4 font-display text-[1.25rem] font-semibold text-ink">Acara bulan {MONTHS[currentMonth]}</h3>
        {monthEvents.length === 0 ? (
          <EmptyState icon={<CalendarDays size={22} />} title={`Tidak ada acara di bulan ${MONTHS[currentMonth]} ${currentYear}`} description="Gunakan tombol bulan untuk melihat agenda bulan lainnya." />
        ) : (
          <div className="flex flex-col gap-6">
            <ul className="grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((evt) => {
                const status = statusOf(evt);
                const attendance = getUnifiedEventAttendees(evt, forms, registrationCounts);
                const draft = evt.isPublic !== true;
                return (
                  <li key={evt.id}>
                    <Card interactive padding="sm" className={cn('relative flex h-full flex-col gap-2 border-l-4', isAdmin && draft && 'border-dashed')} style={{ borderLeftColor: colorOf(evt) || FALLBACK_COLOR }}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-auto text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-dim">{evt.divisionName || divisions.find((d) => d.id === evt.divisionId)?.name}</span>
                        {isAdmin && <Badge tone={draft ? 'gold' : 'navy'}>{draft ? 'Draft' : 'Publik'}</Badge>}
                        {attendance.isLimited && attendance.maxQuota > 0 && <Badge tone={attendance.isFull ? 'danger' : 'gold'}>Kuota {attendance.count}/{attendance.maxQuota}</Badge>}
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <h4 className="font-display text-[1.1rem] font-semibold leading-snug text-ink">
                        <button type="button" onClick={() => open(evt)} className="cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] [color:inherit] after:absolute after:inset-0 focus-visible:outline-none [&:focus-visible]:after:outline-2 [&:focus-visible]:after:outline-navy-ink">{evt.title}</button>
                      </h4>
                      <p className="font-display text-[0.92rem] italic text-gold-ink">{formatWibEventRange(evt.startDate, evt.endDate, evt.date)}</p>
                      <div className="mt-auto flex items-center justify-between gap-2 text-[0.84rem] text-muted">
                        {evt.location && <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin size={14} aria-hidden="true" /><span className="truncate">{evt.location}</span></span>}
                        {isAdmin && onEditEvent && (
                          <Button size="sm" variant="secondary" className="relative z-10" icon={<Pencil size={13} aria-hidden="true" />} onClick={() => onEditEvent(evt)}>Edit</Button>
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage} itemLabel="acara" total={monthEvents.length} pageSize={EVENTS_PER_PAGE} />
          </div>
        )}
      </section>
    </div>
  );
}
