// Date utilities for Indonesian locale & form deadlines

/** Date strings as stored in the database or typed by admins (ISO, Indonesian text, empty). */
export type DateInput = string | null | undefined;

/** Anything `new Date()` accepts, as used for created_at / updated_at timestamps. */
export type TimestampInput = string | number | Date | null | undefined;

export interface DeadlineStatus {
  isValidDate: boolean;
  isExpired: boolean;
  isToday: boolean;
  daysLeft: number | null;
  hoursLeft: number | null;
  isoDate: string;
  formatted: string;
  statusText: string;
  statusBadge: 'expired' | 'today' | 'urgent' | null;
}

export interface WibTimestamp {
  relative: string;
  exact: string;
  shortDate?: string;
  full: string;
}

export type FlexibleDateMode = 'date' | 'dates' | 'range' | 'month' | 'year';

export interface FlexibleDate {
  mode: FlexibleDateMode;
  date: string;
  startDate: string;
  endDate: string;
  month: string;
  year: string;
  dates?: string[];
}

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const WIB_OFFSET_HOURS = 7;
const WIB_TIME_ZONE = 'Asia/Jakarta';
/**
 * Event, deadline and gallery dates are stored as WIB wall-clock text ("YYYY-MM-DD[THH:mm[:ss]]").
 * Like the database (parse_wib_deadline), the clock digits are always read as WIB and any trailing
 * offset or "Z" is ignored, so the same string means the same moment everywhere.
 */
const WIB_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;
const NO_DEADLINE = new Set(['menyesuaikan', 'tanpa batas', 'tanpa batas waktu']);

/** Builds the instant of a wall-clock time in WIB (Asia/Jakarta, UTC+7, no daylight saving). */
function wibInstant(year: number, month: number, day: number, hour = 0, minute = 0, second = 0, ms = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - WIB_OFFSET_HOURS, minute, second, ms));
}

/** Day name of a calendar date; independent of the browser's time zone. */
function weekdayOf(year: number, month: number, day: number): string {
  return INDONESIAN_DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] || '';
}

/** Calendar and clock parts of an instant in WIB, keyed by Intl part type. */
function wibParts(date: Date, options: Intl.DateTimeFormatOptions, locale = 'id-ID'): Record<string, string> {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat(locale, { timeZone: WIB_TIME_ZONE, hourCycle: 'h23', ...options })
    .formatToParts(date)
    .forEach((p) => { parts[p.type] = p.value; });
  return parts;
}

/** Parses a free-form timestamp (e.g. created_at); null when it is not a date. */
function toDate(value: TimestampInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parses "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm[:ss]" as WIB wall-clock time. A missing time becomes
 * 23:59:59.999 when endOfDay is set, otherwise 00:00; missing seconds become :59 when endOfDay is
 * set. Returns null when the string does not start with such a date.
 */
export function parseWibDateTime(str: DateInput, { endOfDay = false }: { endOfDay?: boolean } = {}): Date | null {
  const match = String(str || '').trim().match(WIB_DATE_TIME_PATTERN);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  if (h === undefined) {
    return endOfDay
      ? wibInstant(+y, +mo, +d, 23, 59, 59, 999)
      : wibInstant(+y, +mo, +d);
  }
  const seconds = s !== undefined ? +s : (endOfDay ? 59 : 0);
  return wibInstant(+y, +mo, +d, +h, +mi, seconds);
}

/** Calendar date ("YYYY-MM-DD") of the given instant in WIB. Defaults to now. */
export function toWibIsoDate(date: Date = new Date()): string {
  const parts = wibParts(date, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA');
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * Parses an Indonesian date string (e.g. "31 Maret 2026") or ISO string ("2026-03-31")
 * into a valid ISO string "YYYY-MM-DD". Returns empty string if invalid.
 */
export function parseDateToIso(str: unknown): string {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (match) {
    const day = String(parseInt(match[1], 10)).padStart(2, '0');
    const monthKey = match[2].toLowerCase();
    const year = match[3];
    const monthIdx = INDONESIAN_MONTHS.findIndex(m => m.toLowerCase() === monthKey);
    if (monthIdx !== -1) {
      const month = String(monthIdx + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback try standard JS Date
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return toWibIsoDate(d);
  }

  return '';
}

/**
 * Formats an ISO string (YYYY-MM-DD) into Indonesian date string ("31 Maret 2026").
 */
export function formatToIndonesianDate(isoOrDateStr: DateInput): string {
  if (!isoOrDateStr) return '';
  const str = String(isoOrDateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;
  }
  return str;
}

/**
 * Deadline as Indonesian text with day name and WIB time, e.g. "Kamis, 05 November 2026 - 17.00 WIB".
 * A date without time is the end of that day (23.59 WIB), matching the database.
 */
export function formatDeadlineWib(deadlineStr: DateInput): string {
  const trimmed = String(deadlineStr || '').trim();
  if (!trimmed || NO_DEADLINE.has(trimmed.toLowerCase())) return 'Tanpa batas waktu';

  const match = trimmed.match(WIB_DATE_TIME_PATTERN);
  if (match) {
    const [, y, mo, d, h = '23', mi = '59', sec] = match;
    const time = sec && sec !== '00' && sec !== '59' ? `${h}.${mi}.${sec}` : `${h}.${mi}`;
    return `${weekdayOf(+y, +mo, +d)}, ${d} ${INDONESIAN_MONTHS[+mo - 1] || ''} ${y} - ${time} WIB`;
  }

  const date = toDate(trimmed);
  if (!date) return trimmed;
  const p = wibParts(date, { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const time = p.second && p.second !== '00' ? `${p.hour}.${p.minute}.${p.second}` : `${p.hour}.${p.minute}`;
  return `${p.weekday}, ${p.day} ${p.month} ${p.year} - ${time} WIB`;
}

/**
 * Converts date or timestamptz string into HTML5 <input type="datetime-local" step="1"> value
 * strictly in Asia/Jakarta (WIB) timezone: YYYY-MM-DDTHH:mm:ss.
 */
export function toDatetimeLocalSecondsValue(str: DateInput): string {
  if (!str) return '';
  const trimmed = String(str).trim();
  // Directly extracts calendar date and clock time from the ISO prefix.
  // Preserves user-entered WIB clock digits without +7 shift even if string has Z or +00:00 offset.
  const directMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/);
  if (directMatch) {
    const sec = directMatch[3] !== undefined ? directMatch[3] : '00';
    return `${directMatch[1]}T${directMatch[2]}:${sec}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T23:59:59`;
  }
  const d = toDate(trimmed);
  if (!d) return '';
  const m = wibParts(d, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}`;
}

/**
 * Returns deadline status: isExpired, isToday, daysLeft, hoursLeft, and Indonesian formatted string.
 */
export function getDeadlineStatus(deadlineStr: unknown): DeadlineStatus {
  const undated = (text: string): DeadlineStatus => ({
    isValidDate: false, isExpired: false, isToday: false, daysLeft: null, hoursLeft: null,
    isoDate: '', formatted: text, statusText: text, statusBadge: null
  });
  const trimmed = typeof deadlineStr === 'string' ? deadlineStr.trim() : '';
  if (!trimmed || NO_DEADLINE.has(trimmed.toLowerCase())) return undated('Tanpa batas waktu');

  // Deadlines are WIB wall-clock times, matching the database (parse_wib_deadline)
  let deadlineDate = parseWibDateTime(trimmed, { endOfDay: true });
  if (!deadlineDate) {
    const iso = parseDateToIso(trimmed);
    if (iso) deadlineDate = parseWibDateTime(iso, { endOfDay: true });
  }

  if (!deadlineDate) return undated(trimmed);

  const now = new Date();
  const isExpired = now.getTime() > deadlineDate.getTime();
  const formatted = formatDeadlineWib(trimmed);

  const isToday = toWibIsoDate(now) === toWibIsoDate(deadlineDate);
  const msDiff = deadlineDate.getTime() - now.getTime();
  const hoursLeft = Math.floor(msDiff / (1000 * 60 * 60));
  const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

  let statusText = formatted;
  let statusBadge: DeadlineStatus['statusBadge'] = null;

  if (isExpired) {
    statusText = `Ditutup (${formatted})`;
    statusBadge = 'expired';
  } else if (isToday) {
    if (hoursLeft > 0) {
      statusText = `Hari Terakhir! Sisa ${hoursLeft} jam (${formatted})`;
    } else {
      statusText = `Hari Terakhir! (${formatted})`;
    }
    statusBadge = 'today';
  } else if (daysLeft > 0 && daysLeft <= 3) {
    statusText = `Sisa ${daysLeft} hari (${formatted})`;
    statusBadge = 'urgent';
  }

  return {
    isValidDate: true,
    isExpired,
    isToday,
    daysLeft,
    hoursLeft,
    isoDate: deadlineDate.toISOString(),
    formatted,
    statusText,
    statusBadge
  };
}

/**
 * Dynamically formats an ISO timestamp into Indonesian relative time and exact WIB time.
 * Example: "1 Hari yang lalu (Rabu, 04 November 2026 - 18:32 WIB)"
 */
export function formatWibTimestamp(isoStr: TimestampInput): WibTimestamp {
  if (!isoStr) return { relative: 'Baru saja', exact: '', full: 'Baru saja' };
  const d = toDate(isoStr);
  if (!d) return { relative: String(isoStr), exact: String(isoStr), full: String(isoStr) };

  const partMap = wibParts(d, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const weekday = partMap.weekday || '';
  const day = (partMap.day || '').padStart(2, '0');
  const month = partMap.month || '';
  const year = partMap.year || '';
  const hour = (partMap.hour || '00').padStart(2, '0');
  const minute = (partMap.minute || '00').padStart(2, '0');

  const exact = `${weekday}, ${day} ${month} ${year} - ${hour}:${minute} WIB`;
  const shortDate = `${day} ${month.slice(0, 3)} ${year}, ${hour}:${minute} WIB`;

  // Relative time calculation
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));

  let relative = 'Baru saja';
  if (diffSec < 60) {
    relative = 'Baru saja';
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    relative = `${mins} Menit yang lalu`;
  } else if (diffSec < 86400) {
    const hrs = Math.floor(diffSec / 3600);
    relative = `${hrs} Jam yang lalu`;
  } else if (diffSec < 86400 * 30) {
    const days = Math.floor(diffSec / 86400);
    relative = `${days} Hari yang lalu`;
  } else if (diffSec < 86400 * 365) {
    const months = Math.floor(diffSec / (86400 * 30));
    relative = `${months} Bulan yang lalu`;
  } else {
    const years = Math.floor(diffSec / (86400 * 365));
    relative = `${years} Tahun yang lalu`;
  }

  return {
    relative,
    exact,
    shortDate,
    full: `${relative} (${exact})`
  };
}

/**
 * Convert any date / datetime / ISO string into standard HTML <input type="datetime-local"> value (YYYY-MM-DDTHH:mm)
 * strictly evaluated in WIB (Asia/Jakarta) timezone.
 */
export function toDatetimeLocalValue(str: DateInput): string {
  if (!str) return '';
  const trimmed = String(str).trim();
  // Directly extracts calendar date and clock time (HH:mm) from the ISO prefix.
  // Preserves user-entered WIB clock digits without +7 shift even if string has Z or +00:00 offset.
  const directMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (directMatch) {
    return `${directMatch[1]}T${directMatch[2]}`;
  }
  // Plain YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T09:00`;
  }
  // Other parseable timestamps, read in WIB
  const d = toDate(trimmed);
  if (d) {
    const m = wibParts(d, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
  }
  // Try parseDateToIso
  const iso = parseDateToIso(trimmed);
  if (iso) return `${iso}T09:00`;
  return '';
}

/**
 * Convert any date / datetime / legacy string into standard HTML <input type="date"> value (YYYY-MM-DD).
 */
export function toDateInputValue(str: DateInput): string {
  if (!str) return '';
  const dt = toDatetimeLocalValue(str);
  if (dt) return dt.split('T')[0];
  return parseDateToIso(str) || '';
}

/**
 * Format flexible date string into Indonesian text with WIB timezone.
 * Supports 5 modes:
 * 1. Tahun Saja: "2026" -> "2026"
 * 2. Bulan & Tahun: "2026-05" -> "Mei 2026"
 * 3. Rentang Tanggal: "2026-08-18/2026-08-20" -> "18 - 20 Agustus 2026"
 * 4. Tanggal Lengkap: "2026-03-10" -> "10 Maret 2026"
 * 5. Pilih Tanggal (Multiple): "2026-11-23, 2026-11-25" -> "23, 25 November 2026"
 * Also supports ISO datetime / timestamptz with hours (e.g. "2026-03-10T14:30" -> "10 Maret 2026 • 14:30 WIB")
 */
export function formatWibDateTime(str: DateInput, options: { includeWeekday?: boolean } = {}): string {
  if (!str) return '';
  const trimmed = String(str).trim();

  // 0. Multiple Dates (dipisahkan koma, contoh: "2026-11-23, 2026-11-25" atau "2026-10-25, 2026-11-25")
  if (trimmed.includes(',')) {
    const rawParts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    if (rawParts.length > 1 && rawParts.every(p => /^\d{4}-\d{2}-\d{2}/.test(p))) {
      return formatMultipleDates(rawParts);
    }
  }

  // 1. Tahun saja (YYYY)
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Bulan & Tahun (YYYY-MM)
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [y, m] = trimmed.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      return `${INDONESIAN_MONTHS[m - 1]} ${y}`;
    }
  }

  // 3. Rentang Tanggal (YYYY-MM-DD/YYYY-MM-DD atau YYYY-MM-DD to YYYY-MM-DD)
  if (trimmed.includes('/') || /\sto\s/i.test(trimmed)) {
    const parts = trimmed.split(/[\/]|\sto\s/i).map(s => s.trim());
    if (parts.length === 2 && /^\d{4}-\d{2}-\d{2}/.test(parts[0]) && /^\d{4}-\d{2}-\d{2}/.test(parts[1])) {
      return formatWibEventRange(parts[0], parts[1]);
    }
  }

  // 4. If plain YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;
  }

  // Check if timestamptz was created from date-only (midnight UTC) or has actual time
  const isMidnightUtc = /T00:00(:00)?(\.0+)?(Z|\+00:?00)?$/i.test(trimmed);
  const isPlainDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const hasTime = !isMidnightUtc && !isPlainDate && (trimmed.includes('T') || /:\d{2}/.test(trimmed));

  // If it has date and time in ISO format: extract directly to prevent +7 hours jumping
  const dtMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dtMatch && hasTime && dtMatch[4] !== undefined) {
    const y = parseInt(dtMatch[1], 10);
    const mo = parseInt(dtMatch[2], 10);
    const dNum = parseInt(dtMatch[3], 10);
    const h = dtMatch[4];
    const mi = dtMatch[5] || '00';

    const weekday = weekdayOf(y, mo, dNum);
    const day = String(dNum);
    const month = INDONESIAN_MONTHS[mo - 1] || '';
    const year = String(y);

    let res = `${day} ${month} ${year}`;
    if (options.includeWeekday && weekday) {
      res = `${weekday}, ${res}`;
    }
    res = `${res} • ${h}:${mi} WIB`;
    return res;
  }

  const d = toDate(trimmed);
  if (d) {
    const m = wibParts(d, {
      weekday: options.includeWeekday ? 'long' : undefined,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: hasTime ? '2-digit' : undefined,
      minute: hasTime ? '2-digit' : undefined
    });

    let res = `${m.day || ''} ${m.month || ''} ${m.year || ''}`.trim();
    if (options.includeWeekday && m.weekday) {
      res = `${m.weekday}, ${res}`;
    }
    if (hasTime && m.hour && m.minute) {
      res = `${res} • ${m.hour}:${m.minute} WIB`;
    }
    return res;
  }

  return trimmed;
}

/**
 * Parse an existing date string into components and active mode.
 * Modes: 'date' (Tanggal Lengkap), 'range' (Rentang Tanggal), 'month' (Bulan & Tahun), 'year' (Tahun Saja)
 */
export function parseFlexibleDate(str: DateInput): FlexibleDate {
  const today = toWibIsoDate();
  const [curYear, curMonth] = [Number(today.slice(0, 4)), today.slice(5, 7)];

  if (!str) {
    return {
      mode: 'date',
      date: today,
      startDate: today,
      endDate: today,
      month: `${curYear}-${curMonth}`,
      year: String(curYear)
    };
  }

  const trimmed = String(str).trim();

  // Mode 5: Pilih Tanggal / Multiple Dates (dipisahkan koma, contoh: "2026-11-23, 2026-11-25")
  if (trimmed.includes(',')) {
    const rawParts = trimmed.split(',').map(s => s.trim().split('T')[0]).filter(Boolean);
    if (rawParts.length > 1 && rawParts.every(p => /^\d{4}-\d{2}-\d{2}/.test(p))) {
      const sorted = Array.from(new Set(rawParts)).sort();
      const first = sorted[0] || today;
      const last = sorted[sorted.length - 1] || first;
      return {
        mode: 'dates',
        dates: sorted,
        date: first,
        startDate: first,
        endDate: last,
        month: first.slice(0, 7) || `${curYear}-${curMonth}`,
        year: first.slice(0, 4) || String(curYear)
      };
    }
  }

  // Mode 4: Year only (e.g. "2026")
  if (/^\d{4}$/.test(trimmed)) {
    return {
      mode: 'year',
      year: trimmed,
      date: `${trimmed}-01-01`,
      startDate: `${trimmed}-01-01`,
      endDate: `${trimmed}-12-31`,
      month: `${trimmed}-01`,
      dates: [`${trimmed}-01-01`]
    };
  }

  // Mode 1: Month & Year (e.g. "2026-05")
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [y] = trimmed.split('-');
    return {
      mode: 'month',
      month: trimmed,
      year: y,
      date: `${trimmed}-01`,
      startDate: `${trimmed}-01`,
      endDate: `${trimmed}-28`,
      dates: [`${trimmed}-01`]
    };
  }

  // Mode 3: Date range (e.g. "2026-08-18/2026-08-20")
  if (trimmed.includes('/') || /\sto\s/i.test(trimmed)) {
    const parts = trimmed.split(/[\/]|\sto\s/i).map(s => s.trim());
    const sDate = parts[0]?.split('T')[0] || today;
    const eDate = parts[1]?.split('T')[0] || sDate;
    return {
      mode: 'range',
      startDate: sDate,
      endDate: eDate,
      date: sDate,
      month: sDate.slice(0, 7) || `${curYear}-${curMonth}`,
      year: sDate.slice(0, 4) || String(curYear),
      dates: [sDate, eDate]
    };
  }

  // Mode 2: Specific date (YYYY-MM-DD or timestamptz)
  const dVal = trimmed.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dVal)) {
    return {
      mode: 'date',
      date: dVal,
      startDate: dVal,
      endDate: dVal,
      month: dVal.slice(0, 7) || `${curYear}-${curMonth}`,
      year: dVal.slice(0, 4) || String(curYear),
      dates: [dVal]
    };
  }

  // Legacy string fallback (e.g. "Mei 2026" or "10 Maret 2026")
  const isoMatch = parseDateToIso(trimmed);
  if (isoMatch) {
    return {
      mode: 'date',
      date: isoMatch,
      startDate: isoMatch,
      endDate: isoMatch,
      month: isoMatch.slice(0, 7),
      year: isoMatch.slice(0, 4),
      dates: [isoMatch]
    };
  }

  return {
    mode: 'date',
    date: today,
    startDate: today,
    endDate: today,
    month: `${curYear}-${curMonth}`,
    year: String(curYear),
    dates: [today]
  };
}

/**
 * Format multiple arbitrary ISO dates into human Indonesian text.
 * Examples:
 * - 23 & 25 Nov 2026 -> "23, 25 November 2026"
 * - 25 Okt & 25 Nov 2026 -> "25 Oktober, 25 November 2026"
 * - 21 Mar 2025 & 25 Agu 2027 -> "21 Maret 2025, 25 Agustus 2027"
 */
export function formatMultipleDates(dates: DateInput[] = []): string {
  const validDates = dates
    .map(d => String(d || '').trim().split('T')[0])
    .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));

  if (validDates.length === 0) return '';
  if (validDates.length === 1) {
    const [y, m, d] = validDates[0].split('-').map(Number);
    return `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;
  }

  // Sort dates chronologically ascending and remove duplicates
  const sorted = Array.from(new Set(validDates)).sort();

  // Group by Year -> Month -> Days
  const yearMap = new Map<number, Map<number, number[]>>();
  for (const dateStr of sorted) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!yearMap.has(y)) {
      yearMap.set(y, new Map());
    }
    const monthMap = yearMap.get(y)!;
    if (!monthMap.has(m)) {
      monthMap.set(m, []);
    }
    monthMap.get(m)!.push(d);
  }

  const yearParts: string[] = [];
  for (const [year, monthMap] of yearMap.entries()) {
    const monthParts: string[] = [];
    for (const [monthNum, days] of monthMap.entries()) {
      const monthName = INDONESIAN_MONTHS[monthNum - 1];
      const daysText = days.join(', ');
      monthParts.push(`${daysText} ${monthName}`);
    }
    yearParts.push(`${monthParts.join(', ')} ${year}`);
  }

  return yearParts.join(', ');
}

/**
 * Builds the compact standard ISO string based on the chosen mode.
 */
export function buildFlexibleDate(mode: FlexibleDateMode, fields: Partial<FlexibleDate> = {}): string {
  const today = toWibIsoDate();
  const [curYear, curMonth] = [Number(today.slice(0, 4)), today.slice(5, 7)];

  if (mode === 'dates') {
    const list = Array.isArray(fields.dates) ? fields.dates : [];
    const valid = list
      .map(d => String(d || '').trim().split('T')[0])
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (valid.length > 0) {
      return Array.from(new Set(valid)).sort().join(', ');
    }
    return String(fields.date || today).trim();
  }

  if (mode === 'year') {
    return String(fields.year || curYear).trim();
  }
  if (mode === 'month') {
    return String(fields.month || `${curYear}-${curMonth}`).trim();
  }
  if (mode === 'range') {
    const s = String(fields.startDate || today).trim();
    const e = String(fields.endDate || s).trim();
    return `${s}/${e}`;
  }
  // Default mode: 'date'
  return String(fields.date || today).trim();
}

/**
 * Format event date range (start & end) in Indonesian WIB format.
 * Handles datetime-local (with hours) as well as date-only (YYYY-MM-DD).
 */
export function formatWibEventRange(startDateStr: DateInput, endDateStr: DateInput, fallback = ''): string {
  if (!startDateStr && !endDateStr) return fallback;
  const s = String(startDateStr || '').trim();
  const e = String(endDateStr || s).trim();
  if (!s && !e) return fallback;

  const sHasTime = s.includes('T') || /\d{2}:\d{2}/.test(s);
  const eHasTime = e.includes('T') || /\d{2}:\d{2}/.test(e);

  const sDt = toDatetimeLocalValue(s);
  const eDt = toDatetimeLocalValue(e);

  if (!sDt) return s || fallback;

  const [sDatePart, sTimePart] = sDt.split('T');
  const [eDatePart, eTimePart] = (eDt || sDt).split('T');

  const [sY, sM, sD] = sDatePart.split('-').map(Number);
  const [eY, eM, eD] = eDatePart.split('-').map(Number);

  const sMonth = INDONESIAN_MONTHS[sM - 1];
  const eMonth = INDONESIAN_MONTHS[eM - 1];

  // Same day
  if (sDatePart === eDatePart) {
    if (sHasTime && eHasTime && sTimePart !== eTimePart) {
      return `${sD} ${sMonth} ${sY}, ${sTimePart} - ${eTimePart} WIB`;
    }
    if (sHasTime) {
      return `${sD} ${sMonth} ${sY}, ${sTimePart} WIB`;
    }
    return `${sD} ${sMonth} ${sY}`;
  }

  // Same month & year
  if (sY === eY && sM === eM) {
    return `${sD} - ${eD} ${sMonth} ${sY}`;
  }

  // Different month, same year
  if (sY === eY) {
    return `${sD} ${sMonth} - ${eD} ${eMonth} ${sY}`;
  }

  // Different year
  return `${sD} ${sMonth} ${sY} - ${eD} ${eMonth} ${eY}`;
}

/**
 * Format updated_at timestamp into human-readable relative + WIB date-time.
 * Pattern: "Terakhir diubah : 2 hari yang lalu (04 November 2026 - 13.30 WIB)"
 */
export function formatLastUpdatedWib(timestamp: TimestampInput): string {
  const d = toDate(timestamp);
  if (!d) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  let relativeText = 'Baru saja';
  if (diffMs > 0) {
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) {
      relativeText = 'Baru saja';
    } else if (diffMins < 60) {
      relativeText = `${diffMins} menit yang lalu`;
    } else if (diffHours < 24) {
      relativeText = `${diffHours} jam yang lalu`;
    } else if (diffDays < 30) {
      relativeText = `${diffDays} hari yang lalu`;
    } else if (diffMonths < 12) {
      relativeText = `${diffMonths} bulan yang lalu`;
    } else {
      relativeText = `${diffYears} tahun yang lalu`;
    }
  }

  const m = wibParts(d, { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const day = m.day || '01';
  const month = m.month || '';
  const year = m.year || '';
  const hour = m.hour || '00';
  const minute = m.minute || '00';

  const wibTime = `${day} ${month} ${year} - ${hour}.${minute} WIB`;

  return `Terakhir diubah : ${relativeText} (${wibTime})`;
}

/**
 * Check if an event has already ended / passed the current time in WIB.
 * If endDate has time (e.g. 2026-11-11T13:00), compares against exact timestamp.
 * If date only (e.g. 2026-11-11), considers passed after 23:59:59 WIB of that date.
 */
export function isEventPassed(startDateStr: DateInput, endDateStr: DateInput): boolean {
  if (!startDateStr && !endDateStr) return false;
  const targetStr = String(endDateStr || startDateStr || '').trim();
  if (!targetStr) return false;

  const end = parseWibDateTime(targetStr, { endOfDay: true })
    || parseWibDateTime(targetStr.slice(0, 10), { endOfDay: true });
  return end ? Date.now() > end.getTime() : false;
}




