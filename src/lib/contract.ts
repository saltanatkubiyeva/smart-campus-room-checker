// Practice 13 contract: a thin, deterministic adapter over the existing
// booking rules. It NEVER re-implements a rule — evaluateRequest() reuses
// checkAvailability() — it only maps the contract's inputs/outputs onto it.
import type { Room } from '@/data/rooms';
import type { ReasonCode } from '@/lib/availability';
import { checkAvailability } from '@/lib/availability';
import { CURRENT_MINUTES, MINUTES_IN_DAY } from '@/lib/constants';
export type ContractReasonCode =
  | 'AVAILABLE'
  | 'OVERLAP'
  | 'BLOCKED'
  | 'PAST_START'
  | 'INVALID_DURATION'
  | 'INVALID_INPUT';

export interface ContractResult {
  available: boolean;
  reasonCode: ContractReasonCode;
  message: string;
}

export interface ContractRequest {
  start: string; // "HH:MM"
  durationMinutes: number; // integer > 0
  roomStatus: 'Open' | 'Blocked';
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * AC6 — validation only: malformed input, non-integer/non-positive durations
 * and requests that would end after 24:00 are rejected before any rule runs.
 * Returns the parsed start/end in minutes, or an invalid-input result.
 */
export function validateRequest(
  req: unknown
): { ok: true; start: number; end: number } | { ok: false; result: ContractResult } {
  if (typeof req !== 'object' || req === null) {
    return {
      ok: false,
      result: {
        available: false,
        reasonCode: 'INVALID_INPUT',
        message: 'The request must be an object with start, durationMinutes and roomStatus.',
      },
    };
  }
  const r = req as Record<string, unknown>;
  const { start, durationMinutes, roomStatus } = r;
  if (typeof start !== 'string' || !TIME_RE.test(start)) {
    return {
      ok: false,
      result: {
        available: false,
        reasonCode: 'INVALID_INPUT',
        message: 'Start must be a time in HH:MM format (00:00–23:59).',
      },
    };
  }
  if (
    typeof durationMinutes !== 'number' ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return {
      ok: false,
      result: {
        available: false,
        reasonCode: 'INVALID_DURATION',
        message: 'Duration must be a whole number of minutes greater than zero.',
      },
    };
  }
  if (durationMinutes > 120) {
    return {
      ok: false,
      result: {
        available: false,
        reasonCode: 'INVALID_DURATION',
        message: 'Duration must be at most 120 minutes.',
      },
    };
  }
  if (roomStatus !== 'Open' && roomStatus !== 'Blocked') {
    return {
      ok: false,
      result: {
        available: false,
        reasonCode: 'INVALID_INPUT',
        message: 'Room status must be either "Open" or "Blocked".',
      },
    };
  }
  const h = parseInt((start as string).slice(0, 2), 10);
  const m = parseInt((start as string).slice(3, 5), 10);
  const startMin = h * 60 + m;
  const endMin = startMin + (durationMinutes as number);
  // The booking must end by 24:00.
  if (endMin > MINUTES_IN_DAY) {
    return {
      ok: false,
      result: {
        available: false,
        reasonCode: 'INVALID_INPUT',
        message: 'The booking must end by 24:00.',
      },
    };
  }
  return { ok: true, start: startMin, end: endMin };
}

const CONTRACT_CODES: Record<ReasonCode, ContractReasonCode> = {
  AVAILABLE: 'AVAILABLE',
  OVERLAP: 'OVERLAP',
  BLOCKED: 'BLOCKED',
  PAST_TIME: 'PAST_START',
  TOO_LONG: 'INVALID_DURATION',
  INVALID_INTERVAL: 'INVALID_INPUT',
};

/**
 * Evaluate the P13 contract against one room. All booking rules come from
 * checkAvailability(); this only translates the result into contract codes.
 */
export function evaluateRequest(room: Room, req: unknown): ContractResult {
  const valid = validateRequest(req);
  if (!valid.ok) return valid.result;

  const parsed = req as Record<string, unknown>;
  const status = parsed.roomStatus as 'Open' | 'Blocked';
  const probe: Room = status === 'Blocked' ? { ...room, blocked: true } : room;

  const result = checkAvailability(probe, valid.start, valid.end, CURRENT_MINUTES);
  return {
    available: result.available,
    reasonCode: CONTRACT_CODES[result.reasonCode],
    message: result.reason,
  };
}
