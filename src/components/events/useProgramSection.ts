import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { fetchEventAttendees, type AppItem, type RegistrationCounts } from '../../lib/supabase';
import { formatWibEventRange } from '../../utils/dateUtils';
import { getPublicBaseUrl } from '../../utils/urlUtils';
import { useAppNavigate } from '../../lib/appNavigation';

export interface RsvpInput {
  eventId: string;
  attendeeName: string;
  attendanceMode: string;
  notes: string;
}

/** A confirmed attendee as listed in the event modal (names and attendance mode only). */
export interface EventAttendee {
  id: string;
  eventId: string;
  attendeeName: string;
  attendanceMode: string;
  createdAt?: string;
}

export interface UseProgramSectionProps {
  events?: AppItem[];
  divisions?: AppItem[];
  activeTenure?: AppItem | null;
  registrationCounts?: RegistrationCounts;
  onAddEventRsvp?: (rsvp: RsvpInput) => Promise<EventAttendee>;
  onNavigateOprec?: () => void;
  initialEventId?: string | null;
  onSelectEventUrl?: (eventId: string | null) => void;
  tenures?: AppItem[];
  forms?: AppItem[];
  onNavigateForm?: (formId: string) => void;
  onNavigateEventStats?: (eventId: string) => void;
  galleries?: AppItem[];
  onNavigateGallery?: (galleryId: string) => void;
}

export type ProgramSectionState = ReturnType<typeof useProgramSection>;

/** State, data and handlers of ProgramSection; the markup lives in ProgramSection.tsx and ./sections. */
export function useProgramSection({
  events = [],
  divisions = [],
  activeTenure = null,
  registrationCounts,
  onAddEventRsvp,
  onNavigateOprec,
  initialEventId = null,
  onSelectEventUrl,
  tenures = [],
  forms = [],
  onNavigateForm,
  onNavigateEventStats,
  galleries = [],
  onNavigateGallery
}: UseProgramSectionProps) {
  const navigateTo = useAppNavigate();
  const publicEvents = events.filter((evt) => evt.isPublic === true);
  const [filterDiv, setFilterDiv] = useState('all');
  const [tenureFilter, setTenureFilter] = useState<'active' | 'all'>('active');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [eventPage, setEventPage] = useState(1);
  const [rsvpModalEvent, setRsvpModalEvent] = useState<AppItem | null>(null);
  const [modalAttendees, setModalAttendees] = useState<EventAttendee[]>([]);
  // ID of the RSVP just submitted in the open modal, shown as a check-in QR
  const [lastRsvpCode, setLastRsvpCode] = useState<string | null>(null);

  // Attendee names for the open RSVP modal come from a public RPC (names and attendance mode only).
  useEffect(() => {
    setModalAttendees([]);
    setLastRsvpCode(null);
    if (!rsvpModalEvent?.id) return undefined;
    let cancelled = false;
    fetchEventAttendees(rsvpModalEvent.id)
      .then((list) => { if (!cancelled) setModalAttendees(list); })
      .catch((err) => console.error(err));
    return () => { cancelled = true; };
  }, [rsvpModalEvent?.id]);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const lastHandledInitialId = useRef<string | null>(null);

  const handleCloseEventModal = useCallback(() => {
    setRsvpModalEvent(null);
    setRsvpErrors({});
    setRsvpSuccess(false);
    lastHandledInitialId.current = null;
    if (onSelectEventUrl) onSelectEventUrl(null);
  }, [onSelectEventUrl]);

  const [eventNotFound, setEventNotFound] = useState(false);
  const [eventDraftHidden, setEventDraftHidden] = useState(false);

  // Handle initial event from direct deep link only once
  useEffect(() => {
    if (initialEventId && events.length > 0) {
      if (lastHandledInitialId.current !== initialEventId) {
        lastHandledInitialId.current = initialEventId;
        const found = events.find(e => e.id === initialEventId);
        if (found) {
          if (found.isPublic === true) {
            setRsvpModalEvent(found);
            setEventNotFound(false);
            setEventDraftHidden(false);
            if (activeTenure?.id && found.tenureId && found.tenureId !== activeTenure.id) {
              setTenureFilter('all');
            }
          } else {
            // Event ini dalam status Draft (disembunyikan dari publik)
            setRsvpModalEvent(null);
            setEventNotFound(false);
            setEventDraftHidden(true);
          }
        } else {
          setEventNotFound(true);
          setEventDraftHidden(false);
        }
      }
    } else if (!initialEventId) {
      lastHandledInitialId.current = null;
      setRsvpModalEvent(null);
      setEventNotFound(false);
      setEventDraftHidden(false);
    }
  }, [initialEventId, events, activeTenure]);

  // Close modal on Escape key
  useEffect(() => {
    if (!rsvpModalEvent) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseEventModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rsvpModalEvent, handleCloseEventModal]);

  const handleOpenEventModal = (evt: AppItem) => {
    setRsvpModalEvent(evt);
    lastHandledInitialId.current = evt?.id || null;
    if (onSelectEventUrl && evt?.id) {
      onSelectEventUrl(evt.id);
    }
  };

  const getEventDirectUrl = (evtId: string) => {
    return `${getPublicBaseUrl()}/?event=${encodeURIComponent(evtId)}#event`;
  };

  const handleCopyEventLink = (evt: AppItem | null) => {
    if (!evt) return;
    try {
      navigator.clipboard.writeText(getEventDirectUrl(evt.id));
      setCopiedEventId(evt.id);
      setTimeout(() => setCopiedEventId(null), 2200);
    } catch { /* clipboard unavailable */ }
  };

  const handleShareEventWa = (evt: AppItem | null) => {
    if (!evt) return;
    const url = getEventDirectUrl(evt.id);
    const dateText = formatWibEventRange(evt.startDate, evt.endDate, evt.date);
    const locText = evt.location || 'Plaza Mandiri';
    const text = `🎉 *Agenda Kegiatan Bapekkris Bank Mandiri*\n*${evt.title}*\n📅 ${dateText} • 📍 ${locText}\n\nYuk ikuti & konfirmasi kehadiranmu (RSVP) di:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Quick RSVP form states
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpMode, setRsvpMode] = useState('Hadir Onsite');
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [rsvpErrors, setRsvpErrors] = useState<{ rsvpName?: string }>({});
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [confirmRsvpOpen, setConfirmRsvpOpen] = useState(false);

  const handleOpenConfirmRsvp = (e: FormEvent) => {
    e.preventDefault();
    if (!rsvpModalEvent || isSubmittingRsvp) return;
    const errs: { rsvpName?: string } = {};
    if (!rsvpName.trim()) errs.rsvpName = 'Nama lengkap wajib diisi';
    setRsvpErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setConfirmRsvpOpen(true);
  };

  const handleFinalSubmitRsvp = async () => {
    if (!rsvpModalEvent || isSubmittingRsvp) return;
    setConfirmRsvpOpen(false);
    setIsSubmittingRsvp(true);
    if (onAddEventRsvp) {
      try {
        const stored = await onAddEventRsvp({
          eventId: rsvpModalEvent.id,
          attendeeName: rsvpName.trim(),
          attendanceMode: rsvpMode,
          notes: rsvpNotes.trim()
        });
        setModalAttendees(prev => [stored, ...prev]);
        setLastRsvpCode(stored.id);
      } catch (err) {
        console.error(err);
        setIsSubmittingRsvp(false);
        const error = err as Error & { code?: string };
        setRsvpErrors({ rsvpName: error.code ? error.message : 'Konfirmasi kehadiran gagal dikirim ke server. Silakan periksa koneksi lalu coba lagi.' });
        return;
      }
    }

    setRsvpSuccess(true);
    setRsvpName('');
    setRsvpNotes('');
    setRsvpErrors({});
    setTimeout(() => setIsSubmittingRsvp(false), 500);
    setTimeout(() => setRsvpSuccess(false), 4000);
  };

  const scopedEvents = (tenureFilter === 'active' && activeTenure?.id)
    ? publicEvents.filter((evt) => evt.tenureId === activeTenure.id)
    : publicEvents;

  const scopedDivisions = (tenureFilter === 'active' && activeTenure?.id)
    ? divisions.filter(d => d.tenureId === activeTenure.id)
    : divisions;

  useEffect(() => {
    if (filterDiv !== 'all' && !scopedDivisions.some(d => d.id === filterDiv)) {
      setFilterDiv('all');
    }
  }, [tenureFilter, activeTenure?.id, divisions]);

  const filteredEvents = scopedEvents.filter((evt) => {
    const matchesDiv = filterDiv === 'all' || evt.divisionId === filterDiv;
    const matchesTab = activeTab === 'all' || (activeTab === 'upcoming' && evt.status !== 'Completed');
    return matchesDiv && matchesTab;
  });

  // Calendar View always displays all scheduled events of the month (including Completed) matching the selected division filter
  const calendarEvents = scopedEvents.filter((evt) => {
    return filterDiv === 'all' || evt.divisionId === filterDiv;
  });

  return {
    activeTab,
    activeTenure,
    calendarEvents,
    confirmRsvpOpen,
    copiedEventId,
    divisions,
    eventDraftHidden,
    eventNotFound,
    eventPage,
    filterDiv,
    filteredEvents,
    forms,
    galleries,
    handleCloseEventModal,
    handleCopyEventLink,
    handleFinalSubmitRsvp,
    handleOpenConfirmRsvp,
    handleOpenEventModal,
    handleShareEventWa,
    isSubmittingRsvp,
    modalAttendees,
    navigateTo,
    onNavigateEventStats,
    onNavigateForm,
    onNavigateGallery,
    onNavigateOprec,
    onSelectEventUrl,
    publicEvents,
    registrationCounts,
    rsvpErrors,
    rsvpModalEvent,
    rsvpMode,
    rsvpName,
    rsvpNotes,
    rsvpSuccess,
    lastRsvpCode,
    scopedDivisions,
    scopedEvents,
    setActiveTab,
    setConfirmRsvpOpen,
    setEventDraftHidden,
    setEventNotFound,
    setEventPage,
    setFilterDiv,
    setRsvpErrors,
    setRsvpMode,
    setRsvpName,
    setRsvpNotes,
    setTenureFilter,
    setViewMode,
    tenureFilter,
    tenures,
    viewMode
  };
}
