import { CalendarDays, Camera, Check, ChevronRight, MapPin, Share2, Users } from 'lucide-react';
import type { AppItem } from '../../../lib/supabase';
import { formatWibEventRange, isEventPassed } from '../../../utils/dateUtils';
import { getUnifiedEventAttendees } from '../../../utils/quotaUtils';
import { Badge, Button, Card, EmptyState, Pagination, cn } from '../../../ui';
import { useProgramSectionContext } from '../ProgramSectionContext';

const EVENTS_PER_PAGE = 8;

function connectedFormOf(evt: AppItem, forms: AppItem[]): AppItem | undefined {
  return forms.find((f) => (f.isEventConnected || f.fields?.[0]?._isEventConnected) && String(f.eventId || f.fields?.[0]?._eventId) === String(evt.id));
}

function Attendance({ evt, forms, registrationCounts }: { evt: AppItem; forms: AppItem[]; registrationCounts: any }) {
  const info = getUnifiedEventAttendees(evt, forms, registrationCounts);
  if (info.isLimited && info.maxQuota > 0) {
    return (
      <span className={cn('inline-flex items-center gap-2 font-semibold', info.isFull ? 'text-danger' : 'text-gold-ink')}>
        <Users size={15} aria-hidden="true" />
        Kuota {info.count}/{info.maxQuota} · {info.isFull ? 'penuh' : `sisa ${Math.max(0, info.maxQuota - info.count)}`}
      </span>
    );
  }
  return info.count > 0
    ? <span className="inline-flex items-center gap-2 font-semibold text-info"><Users size={15} aria-hidden="true" />{info.count} orang telah terdaftar</span>
    : null;
}

export default function EventGrid() {
  const {
    activeTab, activeTenure, copiedEventId, divisions, eventPage, filterDiv, filteredEvents, forms, galleries,
    handleCopyEventLink, handleOpenEventModal, navigateTo, onNavigateGallery, registrationCounts, scopedEvents,
    setActiveTab, setEventPage, setFilterDiv
  } = useProgramSectionContext();

  if (filteredEvents.length === 0) {
    const filtered = filterDiv !== 'all' || activeTab !== 'all';
    return (
      <EmptyState
        icon={<CalendarDays size={22} />}
        title="Belum ada acara di daftar ini"
        description={scopedEvents.length === 0
          ? `Belum ada ibadah atau acara yang dipublikasikan untuk periode ${activeTenure?.title || activeTenure?.code || 'ini'}.`
          : filtered
            ? 'Tidak ada acara yang cocok dengan filter divisi atau status saat ini.'
            : 'Belum ada ibadah atau acara yang dipublikasikan. Pantau terus informasi dari pengurus.'}
        action={scopedEvents.length > 0 && filtered
          ? <Button variant="secondary" onClick={() => { setFilterDiv('all'); setActiveTab('all'); setEventPage(1); }}>Tampilkan semua acara</Button>
          : undefined}
      />
    );
  }

  const pageCount = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE) || 1;
  const page = Math.min(Math.max(1, eventPage), pageCount);
  const visible: AppItem[] = filteredEvents.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE);

  return (
    <div className="flex flex-col gap-8">
      <ul className="grid list-none gap-5 md:grid-cols-2">
        {visible.map((evt) => {
          const division = divisions.find((d: AppItem) => d.id === evt.divisionId);
          const completed = evt.status === 'Completed' || isEventPassed(evt.startDate, evt.endDate);
          const form = connectedFormOf(evt, forms);
          const lucky = form && (form.isLuckyDraw === true || form.fields?.[0]?._isLuckyDraw === true);
          const gallery = galleries.find((g: AppItem) => String(g.eventId) === String(evt.id));
          const when = formatWibEventRange(evt.startDate, evt.endDate, evt.date);
          return (
            <li key={evt.id}>
              <Card className={cn('flex h-full flex-col gap-4', completed && 'opacity-80')}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-auto text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-dim">{evt.divisionName || division?.name || 'Bapekkris Bank Mandiri'}</span>
                  {completed && <Badge>Selesai</Badge>}
                  {(evt.category || evt.badge) && <Badge tone="navy">{evt.category || evt.badge}</Badge>}
                  {form && <Badge tone="gold">{lucky ? 'Formulir & undian' : 'Formulir terhubung'}</Badge>}
                </div>
                <div className="flex flex-col gap-2">
                  {when && <p className="font-display text-[0.98rem] italic text-gold-ink">{when}</p>}
                  <h3 className="font-display text-[1.4rem] font-semibold leading-snug text-ink">{evt.title}</h3>
                  {evt.description && <p className="text-[0.93rem] leading-relaxed text-muted">{evt.description}</p>}
                </div>
                <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4 text-[0.88rem] text-muted">
                  {evt.location && <span className="inline-flex items-center gap-2"><MapPin size={15} aria-hidden="true" />{evt.location}</span>}
                  {(evt.peserta || evt.kpi) && <span className="inline-flex items-center gap-2"><Users size={15} aria-hidden="true" />Untuk: <span className="text-ink">{evt.peserta || evt.kpi}</span></span>}
                  <Attendance evt={evt} forms={forms} registrationCounts={registrationCounts} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={completed ? 'secondary' : 'primary'} className="btn-rsvp-action flex-1" onClick={() => handleOpenEventModal(evt)} iconRight={<ChevronRight size={16} aria-hidden="true" />}>
                    {completed ? 'Info & daftar hadir' : 'Detail & RSVP'}
                  </Button>
                  {gallery && (
                    <button type="button" aria-label={`Lihat galeri foto: ${gallery.title}`} title={`Galeri: ${gallery.title}`}
                      onClick={() => (onNavigateGallery ? onNavigateGallery(gallery.id) : navigateTo(`/?gallery=${encodeURIComponent(gallery.id)}#galeri`))}
                      className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-navy-ink">
                      <Camera size={17} aria-hidden="true" />
                    </button>
                  )}
                  <button type="button" onClick={() => handleCopyEventLink(evt)} aria-label={copiedEventId === evt.id ? 'Tautan tersalin' : `Salin tautan undangan ${evt.title}`}
                    className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-navy-ink">
                    {copiedEventId === evt.id ? <Check size={17} aria-hidden="true" className="text-success" /> : <Share2 size={17} aria-hidden="true" />}
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      <Pagination page={page} pageCount={pageCount} onChange={setEventPage} itemLabel="acara" total={filteredEvents.length} pageSize={EVENTS_PER_PAGE} />
    </div>
  );
}
