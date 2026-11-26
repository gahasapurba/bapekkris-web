import { describe, expect, it } from 'vitest';
import { buildIcs, calendarRange, googleCalendarUrl } from './calendarExport';

const timed = { id: 'E1', title: 'Ibadah Natal', description: 'Ibadah, persekutuan; makan', startDate: '2026-12-20T09:00', endDate: '2026-12-20T12:00', location: 'Plaza Mandiri, Jakarta' };

describe('calendarRange', () => {
  it('converts WIB wall-clock times to UTC', () => {
    expect(calendarRange(timed)).toEqual({ allDay: false, start: '20261220T020000Z', end: '20261220T050000Z' });
  });
  it('defaults to two hours when no end time is set', () => {
    expect(calendarRange({ ...timed, endDate: '' })).toMatchObject({ start: '20261220T020000Z', end: '20261220T040000Z' });
  });
  it('treats date-only events as all-day with an exclusive end', () => {
    expect(calendarRange({ id: 'E2', startDate: '2026-12-24', endDate: '2026-12-26' })).toEqual({ allDay: true, start: '20261224', end: '20261227' });
    expect(calendarRange({ id: 'E3', startDate: '2026-12-31' })).toEqual({ allDay: true, start: '20261231', end: '20270101' });
  });
});

describe('buildIcs', () => {
  const ics = buildIcs(timed, new Date('2026-11-26T03:00:00Z'));
  const unfolded = ics.replace(/\r\n /g, '');
  it('writes valid timed dates and escapes text', () => {
    expect(ics).toContain('DTSTART:20261220T020000Z');
    expect(ics).toContain('DTEND:20261220T050000Z');
    expect(unfolded).toContain('LOCATION:Plaza Mandiri\\, Jakarta');
    expect(unfolded).toContain('Ibadah\\, persekutuan\\; makan');
  });
  it('adds reminders one day and one hour before', () => {
    expect(ics).toContain('TRIGGER:-P1D');
    expect(ics).toContain('TRIGGER:-PT1H');
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });
  it('folds long lines and uses CRLF', () => {
    expect(ics.split('\r\n').every((line) => line.length <= 75)).toBe(true);
  });
});

describe('googleCalendarUrl', () => {
  it('passes UTC times and the Jakarta timezone for timed events', () => {
    const url = new URL(googleCalendarUrl(timed));
    expect(url.searchParams.get('dates')).toBe('20261220T020000Z/20261220T050000Z');
    expect(url.searchParams.get('ctz')).toBe('Asia/Jakarta');
  });
});
