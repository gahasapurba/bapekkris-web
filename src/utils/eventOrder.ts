import type { AppItem } from '../lib/supabase';
import { isEventPassed } from './dateUtils';

const startOf = (e: AppItem) => String(e.startDate || e.date || '');

/** True while an event is still to come or running (not marked Completed and its end has not passed). */
export const isUpcomingEvent = (e: AppItem) => e.status !== 'Completed' && !isEventPassed(e.startDate, e.endDate || e.startDate);

/**
 * List order for event pages: upcoming events first (soonest first), then finished ones (most recent first).
 * Data order (sort_order / creation) must not decide what visitors see first.
 */
export function sortEventsForList<T extends AppItem>(events: T[]): T[] {
  const upcoming = events.filter(isUpcomingEvent).sort((a, b) => startOf(a).localeCompare(startOf(b)));
  const past = events.filter((e) => !isUpcomingEvent(e)).sort((a, b) => startOf(b).localeCompare(startOf(a)));
  return [...upcoming, ...past];
}
