import { CalendarDays, Users } from 'lucide-react';
import type { AppItem, RegistrationCounts } from '../../lib/supabase';
import { formatToIndonesianDate, formatWibEventRange } from '../../utils/dateUtils';
import { getUnifiedEventAttendees } from '../../utils/quotaUtils';
import { Badge, Card, type BadgeTone } from '../../ui';
import { Container, Section, SectionHeading, truncate } from './shared';
import { isUpcomingEvent, sortEventsForList } from '../../utils/eventOrder';

const EVENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  Ongoing: { label: 'Sedang berlangsung', tone: 'success' },
  Completed: { label: 'Selesai', tone: 'neutral' },
  Upcoming: { label: 'Segera hadir', tone: 'gold' }
};

interface Props {
  events: AppItem[];
  devotions: AppItem[];
  forms: AppItem[];
  registrationCounts: RegistrationCounts;
  periodLabel: string;
  showEvents: boolean;
  showDevotions: boolean;
  go: (tab: string, formId?: string | null, eventId?: string | null) => void;
}

export function AgendaAndDevotions({ events, devotions, forms, registrationCounts, periodLabel, showEvents, showDevotions, go }: Props) {
  const upcoming = showEvents ? sortEventsForList(events).filter(isUpcomingEvent).slice(0, 3) : [];
  const latest = showDevotions ? devotions.slice(0, 3) : [];
  if (upcoming.length === 0 && latest.length === 0) return null;
  return (
    <Section tone="subtle">
      <Container className="flex flex-col gap-20">
        {upcoming.length > 0 && (
          <div>
            <SectionHeading eyebrow="Agenda" title={`Ibadah & acara terdekat${periodLabel ? ` · ${periodLabel}` : ''}`} action={{ label: 'Semua acara & RSVP', onClick: () => go('event') }} />
            <div className="grid gap-5 md:grid-cols-3">
              {upcoming.map((evt) => {
                const attendance = getUnifiedEventAttendees(evt, forms, registrationCounts);
                const status = EVENT_STATUS[evt.status] || EVENT_STATUS.Upcoming;
                const when = formatWibEventRange(evt.startDate, evt.endDate);
                return (
                  <Card key={evt.id} interactive className="relative flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <span className="text-[0.78rem] font-semibold text-dim">{evt.divisionName || evt.category}</span>
                    </div>
                    <h3 className="font-display text-[1.2rem] font-semibold leading-snug text-ink">
                      <button type="button" onClick={() => go('event', null, evt.id)} className="cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] [color:inherit] after:absolute after:inset-0 focus-visible:outline-none [&:focus-visible]:after:outline-2 [&:focus-visible]:after:outline-navy-ink">
                        {evt.title}
                      </button>
                    </h3>
                    {evt.description && <p className="flex-1 text-[0.9rem] leading-relaxed text-muted">{truncate(evt.description, 120)}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[0.82rem] text-muted">
                      {when && <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" />{when}</span>}
                      <span className="inline-flex items-center gap-1.5"><Users size={15} aria-hidden="true" />{attendance.count} {attendance.isConnected ? 'terdaftar' : 'RSVP'}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        {latest.length > 0 && (
          <div>
            <SectionHeading eyebrow="Renungan Harian" title="Santapan rohani hari ini" action={{ label: 'Baca semua renungan', onClick: () => go('renungan') }} />
            <div className="grid gap-5 md:grid-cols-3">
              {latest.map((d) => (
                <Card key={d.id} interactive className="relative flex flex-col gap-3">
                  <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-gold-ink">{d.scriptureRef}</p>
                  <h3 className="font-display text-[1.2rem] font-semibold leading-snug text-ink">
                    <button type="button" onClick={() => go('renungan')} className="cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] [color:inherit] after:absolute after:inset-0 focus-visible:outline-none [&:focus-visible]:after:outline-2 [&:focus-visible]:after:outline-navy-ink">
                      {d.title}
                    </button>
                  </h3>
                  {d.body && <p className="flex-1 font-display text-[0.98rem] italic leading-relaxed text-muted">“{truncate(d.body, 140)}”</p>}
                  <p className="border-t border-line pt-3 text-[0.8rem] text-dim">{d.author || 'Bapekkris'} · {formatToIndonesianDate(d.devotionDate)}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
