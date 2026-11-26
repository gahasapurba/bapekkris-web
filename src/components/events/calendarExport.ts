import type { AppItem } from '../../lib/supabase';
import { parseWibDateTime, toWibIsoDate } from '../../utils/dateUtils';
import { downloadBlob } from '../../utils/download';

const SITE_URL = 'https://bapekkris-mandiri.netlify.app';
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

type CalendarRange =
  | { allDay: true; start: string; end: string }   // YYYYMMDD, end exclusive
  | { allDay: false; start: string; end: string };  // YYYYMMDDTHHMMSSZ (UTC)

const hasTime = (value: unknown) => /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(String(value || ''));
const compactDate = (iso: string) => iso.slice(0, 10).replace(/-/g, '');
const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Event dates are WIB wall-clock strings. Timed events become UTC instants (default 2 hours when
 * no end time is set); date-only events become all-day ranges.
 */
export function calendarRange(evt: AppItem): CalendarRange {
  const startRaw = String(evt.startDate || evt.date || toWibIsoDate());
  const endRaw = String(evt.endDate || '');
  if (hasTime(startRaw)) {
    const start = parseWibDateTime(startRaw) as Date;
    const end = hasTime(endRaw) ? (parseWibDateTime(endRaw) as Date) : new Date(start.getTime() + DEFAULT_DURATION_MS);
    return { allDay: false, start: utcStamp(start), end: utcStamp(end > start ? end : new Date(start.getTime() + DEFAULT_DURATION_MS)) };
  }
  const startDate = startRaw.slice(0, 10);
  const endDate = (endRaw || startRaw).slice(0, 10);
  return { allDay: true, start: compactDate(startDate), end: compactDate(addDays(endDate >= startDate ? endDate : startDate, 1)) };
}

/** RFC 5545 text escaping. */
function escapeText(value: unknown): string {
  return String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Folds lines longer than 75 characters, as RFC 5545 requires. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join('\r\n');
}

export function eventUrl(evt: AppItem): string {
  return `${SITE_URL}/?event=${encodeURIComponent(evt.id)}#event`;
}

/** iCalendar document with reminders one day and one hour before the event. */
export function buildIcs(evt: AppItem, now: Date = new Date()): string {
  const range = calendarRange(evt);
  const description = [String(evt.description || '').trim(), `Detail acara: ${eventUrl(evt)}`].filter(Boolean).join('\n\n');
  const alarm = (trigger: string, label: string) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(label)}`, `TRIGGER:${trigger}`, 'END:VALARM'];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bapekkris Bank Mandiri//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${evt.id}@bapekkris-mandiri.netlify.app`,
    `DTSTAMP:${utcStamp(now)}`,
    ...(range.allDay
      ? [`DTSTART;VALUE=DATE:${range.start}`, `DTEND;VALUE=DATE:${range.end}`]
      : [`DTSTART:${range.start}`, `DTEND:${range.end}`]),
    `SUMMARY:${escapeText(`${evt.title} - Bapekkris Bank Mandiri`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(evt.location || 'Menyesuaikan')}`,
    `URL:${eventUrl(evt)}`,
    // All-day events: reminder at 09:00 the day before; timed events: one day and one hour before.
    ...(range.allDay
      ? alarm('-PT15H', `Besok: ${evt.title}`)
      : [...alarm('-P1D', `Besok: ${evt.title}`), ...alarm('-PT1H', `1 jam lagi: ${evt.title}`)]),
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Downloads the .ics file (Outlook, Apple Calendar, Google Calendar import, ...). */
export function downloadIcs(evt: AppItem): void {
  downloadBlob(new Blob([buildIcs(evt)], { type: 'text/calendar;charset=utf-8' }), `${String(evt.title || 'acara').replace(/[^\w-]+/g, '_')}.ics`);
}

export function googleCalendarUrl(evt: AppItem): string {
  const range = calendarRange(evt);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${evt.title} (Bapekkris Bank Mandiri)`,
    dates: `${range.start}/${range.end}`,
    details: [String(evt.description || '').trim(), `Detail acara: ${eventUrl(evt)}`].filter(Boolean).join('\n\n'),
    location: evt.location || 'Menyesuaikan'
  });
  if (!range.allDay) params.set('ctz', 'Asia/Jakarta');
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
