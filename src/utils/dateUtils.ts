/**
 * Utility functions for parsing and formatting timestamps consistently in UTC and converting to user's local timezone.
 * Resolves timezone offset bugs (e.g. 7-hour discrepancy) when ISO strings are parsed or stored without 'Z' or timezone markers.
 */

/**
 * Ensures any date/timestamp input is parsed into a valid Date object.
 * Fixes missing 'Z' suffix or space delimiters so ISO strings are always parsed as UTC,
 * preventing local-time parsing errors (e.g. 7-hour timezone offset bugs).
 */
export function parseUTCDate(input: string | number | Date | null | undefined): Date {
  if (input === null || input === undefined || input === '') return new Date();
  if (input instanceof Date) return isNaN(input.getTime()) ? new Date() : input;
  if (typeof input === 'number') return new Date(input);

  let str = String(input).trim();
  if (!str) return new Date();

  // If numeric string (timestamp in milliseconds)
  if (/^\d+$/.test(str)) {
    return new Date(parseInt(str, 10));
  }

  // Replace space between date and time with 'T' if present (e.g. "2026-07-29 13:58:00" -> "2026-07-29T13:58:00")
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  // If string looks like ISO format (YYYY-MM-DDTHH:mm:ss...) but lacks 'Z' or timezone offset (+/-HH:mm)
  // Appending 'Z' ensures JavaScript parses it as UTC instead of local browser time.
  const hasTimezoneOffset = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(str);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str) && !hasTimezoneOffset) {
    str += 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Ensures timestamp is formatted as a full ISO 8601 string with UTC 'Z' suffix.
 */
export function toISOStringUTC(input: string | number | Date | null | undefined): string {
  if (input === null || input === undefined || input === '') return new Date().toISOString();
  const d = parseUTCDate(input);
  return d.toISOString();
}

/**
 * Formats a timestamp into relative time ("Baru saja", "5m lalu", "2j lalu")
 * and appends local time formatted in user's browser/device local timezone in 24-hour format (e.g., "13:58 WIB").
 */
export function formatRelativeTime(timestamp: string | number | Date | null | undefined): string {
  if (!timestamp) return '';
  const d = parseUTCDate(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  // Handle future dates or tiny negative diff due to minor clock skew
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  const hrs = Math.floor(mins / 60);

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userLocale = navigator.language || 'id-ID';
  const localTime = d.toLocaleTimeString(userLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
    timeZone: userTimeZone
  }).replace(/\s*(AM|PM|am|pm)/gi, '').trim();

  if (mins < 1) return `Baru saja • ${localTime}`;
  if (mins < 60) return `${mins}m lalu • ${localTime}`;
  if (hrs < 24) return `${hrs}j lalu • ${localTime}`;

  const fullTime = d.toLocaleDateString(userLocale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
    timeZone: userTimeZone
  }).replace(/\s*(AM|PM|am|pm)/gi, '').trim();

  return fullTime;
}

/**
 * Formats time string (e.g., "13:58 WIB" or "13:58") in user's browser/device local timezone using 24-hour format.
 */
export function formatLocalTime(
  timestamp: string | number | Date | null | undefined,
  includeTimeZoneName: boolean = true
): string {
  if (!timestamp) return '';
  const d = parseUTCDate(timestamp);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userLocale = navigator.language || 'id-ID';

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: userTimeZone
  };
  if (includeTimeZoneName) {
    options.timeZoneName = 'short';
  }

  return d.toLocaleTimeString(userLocale, options).replace(/\s*(AM|PM|am|pm)/gi, '').trim();
}

/**
 * Formats message timestamp for chat views (e.g., "13:58 WIB" for today, "Kemarin", or day/date) in 24-hour format.
 */
export function formatMessageDate(timestamp: string | number | Date | null | undefined): string {
  if (!timestamp) return '';
  const d = parseUTCDate(timestamp);
  const now = new Date();
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userLocale = navigator.language || 'id-ID';

  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(userLocale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone: userTimeZone }).replace(/\s*(AM|PM|am|pm)/gi, '').trim();
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  }

  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString(userLocale, { weekday: 'short', timeZone: userTimeZone });
  }

  return d.toLocaleDateString(userLocale, { day: 'numeric', month: 'short', timeZone: userTimeZone });
}

/**
 * Formats time string in 24h format like "19.00" or "17.52" matching Android/LinkedIn notification headers.
 */
export function formatLinkedInTime(timestamp: string | number | Date | null | undefined): string {
  if (!timestamp) {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const d = parseUTCDate(timestamp);
  const hrs = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hrs}.${mins}`;
}
