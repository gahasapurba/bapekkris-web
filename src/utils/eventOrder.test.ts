import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isUpcomingEvent, sortEventsForList } from './eventOrder';

const ev = (id: string, startDate: string, status = 'Upcoming', endDate = startDate) => ({ id, startDate, endDate, status, title: id });

describe('sortEventsForList', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-26T10:00:00+07:00')); });
  afterEach(() => vi.useRealTimers());

  it('shows the soonest upcoming event first, regardless of data order', () => {
    const list = [ev('natal', '2026-12-20T09:00'), ev('jumat', '2026-11-27T17:00'), ev('retreat', '2027-01-10T08:00')];
    expect(sortEventsForList(list).map((e) => e.id)).toEqual(['jumat', 'natal', 'retreat']);
  });

  it('puts finished events after upcoming ones, most recent first', () => {
    const list = [ev('lama', '2026-09-01T09:00'), ev('natal', '2026-12-20T09:00'), ev('baru', '2026-11-20T09:00'), ev('selesai', '2026-12-01T09:00', 'Completed')];
    expect(sortEventsForList(list).map((e) => e.id)).toEqual(['natal', 'selesai', 'baru', 'lama']);
  });

  it('treats an event that is still running as upcoming', () => {
    expect(isUpcomingEvent(ev('berjalan', '2026-11-25T08:00', 'Ongoing', '2026-11-27T17:00'))).toBe(true);
    expect(isUpcomingEvent(ev('kemarin', '2026-11-25T08:00'))).toBe(false);
  });
});
