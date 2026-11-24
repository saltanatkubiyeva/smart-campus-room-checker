// Practice 13 contract tests T1–T8. The P13 room is A-101 from the existing
// catalog: bookings 09:00–10:00, 12:00–13:00, 15:00–16:00. Current time 09:00.
import { describe, expect, it } from 'vitest';
import { rooms } from '@/data/rooms';
import { evaluateRequest, validateRequest } from '@/lib/contract';

const A101 = rooms.find((r) => r.id === 'A-101')!;
const bookingsBefore = JSON.stringify(A101.bookings);

const evaluate = (start: string, durationMinutes: number, roomStatus: 'Open' | 'Blocked' = 'Open') =>
  evaluateRequest(A101, { start, durationMinutes, roomStatus });

describe('validateRequest (validation only)', () => {
  it('T-val parses a valid request into minutes', () => {
    const out = validateRequest({ start: '10:30', durationMinutes: 60, roomStatus: 'Open' });
    expect(out).toEqual({ ok: true, start: 630, end: 690 });
  });

  it('T-val rejects malformed input and bookings ending after 24:00', () => {
    expect(validateRequest(null)?.ok).toBe(false);
    expect(validateRequest({ start: '25:00', durationMinutes: 60, roomStatus: 'Open' })?.ok).toBe(false);
    expect(validateRequest({ start: '10:30', durationMinutes: 1.5, roomStatus: 'Open' })?.ok).toBe(false);
    expect(validateRequest({ start: '10:30', durationMinutes: 60, roomStatus: 'Maybe' })?.ok).toBe(false);
    const late = validateRequest({ start: '23:00', durationMinutes: 120, roomStatus: 'Open' });
    expect(late?.ok).toBe(false);
    if (late && !late.ok) {
      expect(late.result.reasonCode).toBe('INVALID_INPUT');
      expect(late.result.message).toContain('24:00');
    }
  });
});

describe('evaluateRequest (T1–T8)', () => {
  it('T1 10:30 + 60 in an open room -> AVAILABLE', () => {
    expect(evaluate('10:30', 60)).toEqual({
      available: true,
      reasonCode: 'AVAILABLE',
      message: expect.any(String),
    });
  });

  it('T2 12:30 + 60 -> OVERLAP (12:00–13:00 booking)', () => {
    const out = evaluate('12:30', 60);
    expect(out.available).toBe(false);
    expect(out.reasonCode).toBe('OVERLAP');
  });

  it('T3 10:30 + 60 in a blocked room -> BLOCKED', () => {
    const out = evaluate('10:30', 60, 'Blocked');
    expect(out.available).toBe(false);
    expect(out.reasonCode).toBe('BLOCKED');
  });

  it('T4 duration 0 -> INVALID_DURATION', () => {
    const out = evaluate('10:30', 0);
    expect(out.available).toBe(false);
    expect(out.reasonCode).toBe('INVALID_DURATION');
  });

  it('T5 duration 121 -> INVALID_DURATION', () => {
    const out = evaluate('10:30', 121);
    expect(out.available).toBe(false);
    expect(out.reasonCode).toBe('INVALID_DURATION');
  });

  it('T5b 08:00 + 121 -> INVALID_DURATION (not PAST_START)', () => {
    const out = evaluate('08:00', 121);
    expect(out.available).toBe(false);
    expect(out.reasonCode).toBe('INVALID_DURATION');
    expect(out.message).toContain('at most 120 minutes');
  });

  it('T5c 23:00 + 121 -> INVALID_DURATION (not "must end by 24:00")', () => {
    const out = evaluate('23:00', 121);
    expect(out.available).toBe(false);
    expect(out.reasonCode).toBe('INVALID_DURATION');
    expect(out.message).toContain('at most 120 minutes');
  });

  it('T6 08:00 + 30 -> PAST_START (current time is 09:00)', () => {
    const out = evaluate('08:00', 30);
    expect(out.available).toBe(false);
    expect(out.reasonCode).toBe('PAST_START');
  });

  it('T7 13:00 + 120 -> AVAILABLE (starts where a booking ends, ends by 24:00)', () => {
    const out = evaluate('13:00', 120);
    expect(out.available).toBe(true);
    expect(out.reasonCode).toBe('AVAILABLE');
  });

  it('T8 bookings are unchanged after all checks', () => {
    evaluate('10:30', 60);
    evaluate('12:30', 60);
    evaluate('10:30', 60, 'Blocked');
    evaluate('10:30', 0);
    evaluate('10:30', 121);
    evaluate('08:00', 30);
    evaluate('13:00', 120);
    expect(JSON.stringify(A101.bookings)).toBe(bookingsBefore);
  });
});
