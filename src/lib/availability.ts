import type { Booking, Room } from '@/data/rooms';
import { MAX_BOOKING_MINUTES, MINUTES_IN_DAY } from '@/lib/constants';
import { minutesToTime } from '@/lib/time';

export type ReasonCode =
  | 'AVAILABLE'
  | 'INVALID_INTERVAL'
  | 'PAST_TIME'
  | 'TOO_LONG'
  | 'BLOCKED'
  | 'OVERLAP';

export interface CheckResult {
  available: boolean;
  reason: string;
  /** Machine-readable counterpart of `reason`, added for the explain feature. */
  reasonCode: ReasonCode;
}

/** Half-open intervals [start, end): touching endpoints are NOT an overlap. */
export function intervalsOverlap(a: Booking, start: number, end: number): boolean {
  return start < a.end && end > a.start;
}

/**
 * AC1–AC5 / F3. Pure function: reads `room` (only the selected room's
 * bookings) and never modifies it.
 */
export function checkAvailability(
  room: Room,
  start: number,
  end: number,
  currentMinutes: number
): CheckResult {
  // AC1: valid interval inside one day
  if (start < 0 || end > MINUTES_IN_DAY || start >= end) {
    return {
      available: false,
      reasonCode: 'INVALID_INTERVAL',
      reason:
        'Invalid time interval. Start must be earlier than end, and both must be within 00:00–24:00.',
    };
  }
  // AC1: start strictly after the current time
  if (start <= currentMinutes) {
    return {
      available: false,
      reasonCode: 'PAST_TIME',
      reason: `Start time must be after the current time (${minutesToTime(currentMinutes)}).`,
    };
  }

  // AC2: maximum length
  if (end - start > MAX_BOOKING_MINUTES) {
    return {
      available: false,
      reasonCode: 'TOO_LONG',
      reason: `Booking exceeds the ${MAX_BOOKING_MINUTES}-minute maximum (requested ${end - start} min).`,
    };
  }

  // AC3 / F3: a blocked room is never reported as available
  if (room.blocked) {
    return {
      available: false,
      reasonCode: 'BLOCKED',
      reason: room.blockReason ?? 'This room is currently blocked and cannot be booked.',
    };
  }

  // AC4: overlap with this room's bookings (touching allowed)
  const conflict = room.bookings.find((b) => intervalsOverlap(b, start, end));
  if (conflict) {
    return {
      available: false,
      reasonCode: 'OVERLAP',
      reason: `Overlaps with "${conflict.title}" (${minutesToTime(conflict.start)}–${minutesToTime(conflict.end)}).`,
    };
  }

  // AC5: available — data is not modified
  return {
    available: true,
    reasonCode: 'AVAILABLE',
    reason: `${room.name} is available from ${minutesToTime(start)} to ${minutesToTime(end)}.`,
  };
}
