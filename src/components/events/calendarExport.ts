import type { AppItem } from '../../lib/supabase';

/** All-day range of an event as iCalendar dates (end is exclusive, hence +1 day). */
function icsDates(evt: AppItem): { start: string; end: string } {
  const fallback = new Date().toISOString().slice(0, 10);
  const start = String(evt.startDate || fallback).replace(/-/g, '');
  const endDate = new Date(evt.endDate || evt.startDate || fallback);
  endDate.setDate(endDate.getDate() + 1);
  return { start, end: endDate.toISOString().split('T')[0].replace(/-/g, '') };
}

/** Downloads an .ics file (Outlook, Apple Calendar, ...). */
export function downloadIcs(evt: AppItem): void {
  const { start, end } = icsDates(evt);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bapekkris Bank Mandiri//ID',
    'BEGIN:VEVENT',
    `UID:${evt.id}@bapekkris-mandiri.netlify.app`,
    `DTSTAMP:${start}T010000Z`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${evt.title} - Bapekkris Bank Mandiri`,
    `DESCRIPTION:${String(evt.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${evt.location || 'Plaza Mandiri'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${String(evt.title).replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(evt: AppItem): string {
  const { start, end } = icsDates(evt);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${evt.title} (Bapekkris Bank Mandiri)`,
    dates: `${start}/${end}`,
    details: evt.description || '',
    location: evt.location || 'Plaza Mandiri'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
