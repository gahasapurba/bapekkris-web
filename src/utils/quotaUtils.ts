/**
 * Utility functions for Unified Quota Calculation
 * Synchronizes attendance and quota limits between Events and connected Registration Forms.
 */

import type { RegistrationCounts } from '../lib/supabase';

type Id = string | number;

/** Fields of an event that quota calculations read. */
export interface QuotaEvent {
  id: Id;
  title?: string;
  isLimited?: boolean;
  maxQuota?: number | string;
}

/** Fields of a form that quota calculations read. */
export interface QuotaForm {
  id: Id;
  eventId?: Id | null;
  isEventConnected?: boolean;
  isLimited?: boolean;
  maxQuota?: number | string;
}

interface RegistrationRow {
  formId?: Id | null;
  eventId?: Id | null;
  status?: string;
  [column: string]: unknown;
}

export interface EventAttendees<F extends QuotaForm> {
  count: number;
  rsvpCount: number;
  formSubCount: number;
  isConnected: boolean;
  connectedForm: F | null;
  isLimited: boolean;
  maxQuota: number;
  isFull: boolean;
  remaining: number;
}

export interface FormQuota<E extends QuotaEvent> {
  isConnected: boolean;
  connectedEvent: E | null;
  isLimited: boolean;
  maxQuota: number;
  count: number;
  formSubCount: number;
  initialRsvpCount: number;
  isFull: boolean;
  remaining: number;
  label: string;
}

/** Whether the form is the registration form of the event (forms.is_event_connected + event_id). */
export function isFormConnectedToEvent(form: QuotaForm | null | undefined, eventId: Id | null | undefined): boolean {
  if (!form?.isEventConnected || !form.eventId || eventId === null || eventId === undefined || eventId === '') return false;
  return String(form.eventId) === String(eventId);
}

export function getConnectedFormForEvent<F extends QuotaForm>(
  evt: QuotaEvent | null | undefined,
  forms: F[] = []
): F | null {
  if (!evt) return null;
  return forms.find(f => isFormConnectedToEvent(f, evt.id)) || null;
}

export function getConnectedEventForForm<E extends QuotaEvent>(
  form: QuotaForm | null | undefined,
  events: E[] = []
): E | null {
  if (!form?.isEventConnected || !form.eventId) return null;
  return events.find(e => String(e.id) === String(form.eventId)) || null;
}

const REJECTED_STATUSES = ['Rejected', 'Ditolak'];

export const EMPTY_REGISTRATION_COUNTS: RegistrationCounts = { forms: {}, events: {} };

/**
 * Builds registration counts from full lists (admin view). Rejected submissions free up their seat,
 * matching the server-side count returned by the get_registration_counts RPC.
 */
export function deriveRegistrationCounts(
  submissions: RegistrationRow[] = [],
  eventRsvps: RegistrationRow[] = []
): RegistrationCounts {
  const counts: RegistrationCounts = { forms: {}, events: {} };
  submissions.forEach((s) => {
    if (!s.formId || REJECTED_STATUSES.includes(s.status ?? '')) return;
    counts.forms[s.formId] = (counts.forms[s.formId] || 0) + 1;
  });
  eventRsvps.forEach((r) => {
    if (!r.eventId) return;
    counts.events[r.eventId] = (counts.events[r.eventId] || 0) + 1;
  });
  return counts;
}

function countFor(map: Record<string, number> | undefined, id: Id): number {
  return Number(map?.[String(id)] || 0);
}

export function getUnifiedEventAttendees<F extends QuotaForm>(
  evt: QuotaEvent | null | undefined,
  forms: F[] = [],
  counts: RegistrationCounts = EMPTY_REGISTRATION_COUNTS
): EventAttendees<F> {
  if (!evt) {
    return {
      count: 0,
      rsvpCount: 0,
      formSubCount: 0,
      isConnected: false,
      connectedForm: null,
      isLimited: false,
      maxQuota: 0,
      isFull: false,
      remaining: 0
    };
  }

  const rsvpCount = countFor(counts.events, evt.id);
  const connForm = getConnectedFormForEvent(evt, forms);

  // Not connected to a form: use the event's own limits and RSVP count
  if (!connForm) {
    const isLimited = Boolean(evt.isLimited);
    const maxQuota = Number(evt.maxQuota || 0);
    const isFull = isLimited && maxQuota > 0 && rsvpCount >= maxQuota;
    return {
      count: rsvpCount,
      rsvpCount,
      formSubCount: 0,
      isConnected: false,
      connectedForm: null,
      isLimited,
      maxQuota,
      isFull,
      remaining: Math.max(0, maxQuota - rsvpCount)
    };
  }

  // Connected to a form: quota and count follow the form (earlier RSVPs are kept but not counted)
  const isLimited = Boolean(connForm.isLimited);
  const maxQuota = Number(connForm.maxQuota || 0);
  const count = countFor(counts.forms, connForm.id);
  const isFull = isLimited && maxQuota > 0 && count >= maxQuota;

  return {
    count,
    rsvpCount,
    formSubCount: count,
    isConnected: true,
    connectedForm: connForm,
    isLimited,
    maxQuota,
    isFull,
    remaining: Math.max(0, maxQuota - count)
  };
}

export function getUnifiedFormQuota<E extends QuotaEvent>(
  form: QuotaForm | null | undefined,
  events: E[] = [],
  counts: RegistrationCounts = EMPTY_REGISTRATION_COUNTS
): FormQuota<E> {
  if (!form) {
    return {
      isConnected: false,
      connectedEvent: null,
      isLimited: false,
      maxQuota: 0,
      count: 0,
      formSubCount: 0,
      initialRsvpCount: 0,
      isFull: false,
      remaining: 0,
      label: ''
    };
  }

  const connEvent = getConnectedEventForForm(form, events);
  const isLimited = Boolean(form.isLimited);
  const maxQuota = Number(form.maxQuota || 0);
  const count = countFor(counts.forms, form.id);
  const isFull = isLimited && maxQuota > 0 && count >= maxQuota;
  const base = {
    isLimited,
    maxQuota,
    count,
    formSubCount: count,
    isFull,
    remaining: Math.max(0, maxQuota - count)
  };

  if (connEvent) {
    return {
      ...base,
      isConnected: true,
      connectedEvent: connEvent,
      initialRsvpCount: countFor(counts.events, connEvent.id),
      label: `Acara: ${connEvent.title}`
    };
  }

  return {
    ...base,
    isConnected: false,
    connectedEvent: null,
    initialRsvpCount: 0,
    label: 'Formulir Mandiri'
  };
}
