import { MINUTES_IN_DAY } from '@/lib/constants';

/** Convert "HH:MM" to minutes-from-midnight. Returns null on malformed input. */
export function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/** Convert minutes-from-midnight to "HH:MM" (1440 is shown as "24:00"). */
export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface TimeRange {
  start: number;
  end: number;
}

/**
 * Parse the form's start/end strings into minutes.
 * An end time of 00:00 means midnight at the close of the day (1440),
 * because an HTML time input cannot represent 24:00.
 * Returns null when either value is malformed.
 */
export function parseTimeRange(startText: string, endText: string): TimeRange | null {
  const start = timeToMinutes(startText);
  const end = timeToMinutes(endText);
  if (start === null || end === null) return null;
  return { start, end: end === 0 ? MINUTES_IN_DAY : end };
}
