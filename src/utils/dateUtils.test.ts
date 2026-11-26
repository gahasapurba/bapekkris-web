import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  formatDeadlineWib, formatLastUpdatedWib, formatWibDateTime, formatWibTimestamp, getDeadlineStatus,
  isEventPassed, parseWibDateTime, toDatetimeLocalValue, toWibIsoDate
} from './dateUtils';

afterEach(() => vi.useRealTimers());

describe('parseWibDateTime', () => {
  it('reads the clock digits as WIB', () => {
    expect(parseWibDateTime('2026-11-27T16:55')?.toISOString()).toBe('2026-11-27T09:55:00.000Z');
    expect(parseWibDateTime('2026-11-27', { endOfDay: true })?.toISOString()).toBe('2026-11-27T16:59:59.999Z');
  });
  it('ignores a trailing offset, like the database', () => {
    expect(parseWibDateTime('2026-11-27T16:55:00Z')?.toISOString()).toBe('2026-11-27T09:55:00.000Z');
    expect(parseWibDateTime('2026-11-27T16:55:00+00:00')?.toISOString()).toBe('2026-11-27T09:55:00.000Z');
  });
  it('rejects non-dates', () => {
    expect(parseWibDateTime('Menyesuaikan')).toBeNull();
  });
});

describe('formatDeadlineWib', () => {
  it('shows the day name and WIB time of the stored digits', () => {
    expect(formatDeadlineWib('2026-11-27T16:55:00')).toBe('Jumat, 27 November 2026 - 16.55 WIB');
    expect(formatDeadlineWib('2026-11-01')).toBe('Minggu, 01 November 2026 - 23.59 WIB');
  });
  it('treats empty and open-ended values as no deadline', () => {
    expect(formatDeadlineWib('')).toBe('Tanpa batas waktu');
    expect(formatDeadlineWib('Menyesuaikan')).toBe('Tanpa batas waktu');
  });
});

describe('getDeadlineStatus', () => {
  it('expires at the same moment the display shows', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-27T09:54:00Z')); // 16.54 WIB
    expect(getDeadlineStatus('2026-11-27T16:55:00Z')).toMatchObject({ isExpired: false, isToday: true, statusBadge: 'today' });
    vi.setSystemTime(new Date('2026-11-27T09:56:00Z')); // 16.56 WIB
    expect(getDeadlineStatus('2026-11-27T16:55:00Z')).toMatchObject({ isExpired: true, statusBadge: 'expired' });
  });
  it('counts the deadline day in WIB, not in the browser time zone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T18:00:00Z')); // 27 Nov 01.00 WIB
    expect(getDeadlineStatus('2026-11-27').isToday).toBe(true);
  });
});

describe('timestamps', () => {
  it('formats instants in WIB', () => {
    expect(toWibIsoDate(new Date('2026-11-26T17:30:00Z'))).toBe('2026-11-27');
    expect(formatWibTimestamp('2026-11-26T17:30:00Z').exact).toBe('Jumat, 27 November 2026 - 00:30 WIB');
    expect(formatLastUpdatedWib('2026-11-26T17:30:00Z')).toContain('(27 November 2026 - 00.30 WIB)');
    expect(toDatetimeLocalValue('2026-11-26T17:30:00.000+00:00')).toBe('2026-11-26T17:30');
  });
  it('formats event dates with the weekday of the stored date', () => {
    expect(formatWibDateTime('2026-11-24T21:41', { includeWeekday: true })).toBe('Selasa, 24 November 2026 • 21:41 WIB');
  });
  it('decides whether an event has passed in WIB', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-27T14:40:00Z')); // 21.40 WIB
    expect(isEventPassed('2026-11-24T21:41', '2026-11-27T21:41')).toBe(false);
    vi.setSystemTime(new Date('2026-11-27T14:42:00Z'));
    expect(isEventPassed('2026-11-24T21:41', '2026-11-27T21:41')).toBe(true);
  });
});
