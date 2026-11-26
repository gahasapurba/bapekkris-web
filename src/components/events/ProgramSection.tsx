import { CalendarDays, ChevronDown, Filter, LayoutGrid } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { PageHeader, cn } from '../../ui';
import EventCalendarView from './EventCalendarView';
import { useProgramSection, type UseProgramSectionProps } from './useProgramSection';
import { ProgramSectionContext } from './ProgramSectionContext';
import DraftEventNotice from './sections/DraftEventNotice';
import EventNotFoundNotice from './sections/EventNotFoundNotice';
import EventGrid from './sections/EventGrid';
import EventDetailModal from './sections/EventDetailModal';
import RsvpConfirmDialog from './sections/RsvpConfirmDialog';

export default function ProgramSection(props: UseProgramSectionProps) {
  const state = useProgramSection(props);
  const {
    activeTab,
    activeTenure,
    calendarEvents,
    confirmRsvpOpen,
    divisions,
    eventDraftHidden,
    eventNotFound,
    filterDiv,
    forms,
    handleOpenEventModal,
    publicEvents,
    registrationCounts,
    rsvpModalEvent,
    scopedDivisions,
    scopedEvents,
    setActiveTab,
    setEventPage,
    setFilterDiv,
    setTenureFilter,
    setViewMode,
    tenureFilter,
    tenures,
    viewMode
  } = state;



  const resetPage = () => setEventPage(1);
  const pill = (active: boolean) => cn(
    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 px-4 text-[0.86rem] font-semibold transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink',
    active ? 'bg-action text-on-action' : 'bg-transparent text-muted hover:bg-subtle hover:text-ink'
  );

  // Divisions for the filter: the browsed tenure, or every tenure grouped by period.
  const divisionOptions = (() => {
    if (tenureFilter === 'active') return scopedDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>);
    const seen = new Set<string>();
    const groups = (tenures || []).map((t) => {
      const inTenure = divisions.filter((d) => d.tenureId === t.id);
      inTenure.forEach((d) => seen.add(d.id));
      if (inTenure.length === 0) return null;
      return (
        <optgroup key={t.id} label={`Periode ${t.code} (${t.title || 'Kepengurusan'})`}>
          {inTenure.map((d) => <option key={d.id} value={d.id}>{d.name} ({t.code})</option>)}
        </optgroup>
      );
    }).filter(Boolean);
    const rest = divisions.filter((d) => !seen.has(d.id));
    return (
      <>
        {groups}
        {rest.length > 0 && <optgroup label="Divisi lainnya">{rest.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>}
      </>
    );
  })();

  return (
    <ProgramSectionContext.Provider value={state}>
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-24 md:px-6">
        <PageHeader
          eyebrow="Ibadah & Acara"
          title="Bertumbuh bersama dalam persekutuan"
          description="Persekutuan doa, kebaktian, pembinaan rohani, dan aksi kasih keluarga besar Bapekkris PT Bank Mandiri (Persero) Tbk."
        />

        {eventDraftHidden && <div className="mb-8"><DraftEventNotice /></div>}
        {eventNotFound && <div className="mb-8"><EventNotFoundNotice /></div>}

        <div className="mb-8 flex flex-col gap-4 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Tampilan" className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
              <button type="button" aria-pressed={viewMode === 'grid'} onClick={() => { setViewMode('grid'); resetPage(); }} className={pill(viewMode === 'grid')}>
                <LayoutGrid size={15} aria-hidden="true" />Daftar
              </button>
              <button type="button" aria-pressed={viewMode === 'calendar'} onClick={() => setViewMode('calendar')} className={pill(viewMode === 'calendar')}>
                <CalendarDays size={15} aria-hidden="true" />Kalender
              </button>
            </div>
            <div role="group" aria-label="Status acara" className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
              <button type="button" aria-pressed={activeTab === 'upcoming'} onClick={() => { setActiveTab('upcoming'); resetPage(); }} className={pill(activeTab === 'upcoming')}>
                Akan datang
              </button>
              <button type="button" aria-pressed={activeTab === 'all'} onClick={() => { setActiveTab('all'); resetPage(); }} className={pill(activeTab === 'all')}>
                Semua ({scopedEvents.length})
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {activeTenure && (
              <div role="group" aria-label="Periode" className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
                <button type="button" aria-pressed={tenureFilter === 'active'} onClick={() => { setTenureFilter('active'); resetPage(); }} className={pill(tenureFilter === 'active')}>
                  Periode {activeTenure?.code || activeTenure?.title || ''}
                </button>
                <button type="button" aria-pressed={tenureFilter === 'all'} onClick={() => { setTenureFilter('all'); resetPage(); }} className={pill(tenureFilter === 'all')}>
                  Semua periode ({publicEvents.length})
                </button>
              </div>
            )}
            <label className="relative inline-flex items-center">
              <span className="sr-only">Filter divisi</span>
              <Filter size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 text-dim" />
              <select value={filterDiv} onChange={(e) => { setFilterDiv(e.target.value); resetPage(); }}
                className="h-11 cursor-pointer appearance-none rounded-full border border-line bg-surface pl-9 pr-9 text-[0.86rem] font-semibold text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink">
                <option value="all">Semua divisi{scopedDivisions.length > 0 ? ` (${scopedDivisions.length})` : ''}</option>
                {divisionOptions}
              </select>
              <ChevronDown size={15} aria-hidden="true" className="pointer-events-none absolute right-3.5 text-dim" />
            </label>
          </div>
        </div>

        {viewMode === 'grid' && <EventGrid />}
        {viewMode === 'calendar' && (
          <EventCalendarView
            events={calendarEvents}
            divisions={divisions}
            forms={forms}
            registrationCounts={registrationCounts}
            activeTenure={activeTenure}
            onSelectEvent={(evt: AppItem, sameDayEvents?: AppItem[]) => handleOpenEventModal(evt, sameDayEvents)}
            isAdmin={false}
          />
        )}

        {rsvpModalEvent && <EventDetailModal />}
        {confirmRsvpOpen && rsvpModalEvent && <RsvpConfirmDialog />}
      </div>
    </ProgramSectionContext.Provider>
  );
}
