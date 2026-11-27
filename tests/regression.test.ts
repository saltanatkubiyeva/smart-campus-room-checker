// Focused regression tests requested for AC1–AC5 (AC6 is UI-only, see
// tests/roomChecker.ui.test.tsx). Complements — never replaces — the
// assertions in tests/availability.test.ts.
import { describe, expect, it } from 'vitest';
import { checkAvailability } from '@/lib/availability';
import { rooms, type Booking } from '@/data/rooms';
import { makeRoom, NOW } from './fixtures';

const check = (start: number, end: number, room = makeRoom()) =>
  checkAvailability(room, start, end, NOW);

describe('AC1 past time and reversed interval', () => {
  it('rejects a start strictly before the current time (500–560)', () => {
    // AC1: start must be strictly after now (540), so 500 is in the past.
    const r = check(500, 560);
    expect(r.available).toBe(false);
    expect(r.reason).toContain('after the current time');
  });

  it('rejects a reversed interval (800–700) as invalid', () => {
    // AC1: start >= end is an invalid interval, rejected before any other rule.
    const r = check(800, 700);
    expect(r.available).toBe(false);
    expect(r.reason).toContain('Invalid time interval');
  });
});

describe('AC2 121-minute duration', () => {
  it('rejects 720–841 (121 min) even in a fully free room', () => {
    // AC2: maximum duration is 120 minutes; exactly 120 would be allowed.
    const r = check(720, 841, makeRoom({ bookings: [] }));
    expect(r.available).toBe(false);
    expect(r.reason).toContain('121 min');
  });
});

describe('AC3 blocked room', () => {
  it('reports the room-specific block reason', () => {
    // AC3: a blocked room is never available, whatever the slot.
    const r = check(660, 720, makeRoom({ blocked: true, blockReason: 'Closed for cleaning.' }));
    expect(r.available).toBe(false);
    expect(r.reason).toBe('Closed for cleaning.');
  });
});

describe('AC4 overlap and touching endpoints', () => {
  it('rejects an interval that fully encloses an existing booking (590–670)', () => {
    // AC4: any intersection with an existing booking is an overlap.
    expect(check(590, 670).available).toBe(false);
  });

  it('allows intervals touching the existing 600–660 booking at either endpoint', () => {
    // AC4: half-open [start, end) intervals — 600–660 and 660–720 share only
    // an endpoint, so both 540–600 (before) and 660–720 (after) are free.
    expect(check(540 + 1, 600).available).toBe(true);
    expect(check(660, 720).available).toBe(true);
  });
});

describe('AC5 unchanged fixtures', () => {
  it('leaves the room catalog and its bookings byte-identical after checks', () => {
    // AC5: checkAvailability is pure — the shipped fixtures must never be
    // mutated by running availability checks against catalog rooms.
    const before = JSON.stringify(rooms);
    for (const room of rooms) {
      checkAvailability(room, NOW + 1, NOW + 61, NOW);
      checkAvailability(room, 600, 660, NOW);
    }
    expect(JSON.stringify(rooms)).toBe(before);
  });

  it('the catalog is deep-frozen: mutating a booking or the bookings array throws TypeError', () => {
    // Runtime immutability: `readonly` is erased in JS, so rooms.ts deep-freezes
    // the catalog at module load. Mutations must throw and change nothing.
    const a101 = rooms.find((r) => r.id === 'A-101')!;
    expect(Object.isFrozen(a101.bookings)).toBe(true);
    expect(Object.isFrozen(a101)).toBe(true);
    expect(Object.isFrozen(a101.bookings[0])).toBe(true);

    const before = JSON.stringify(rooms);
    expect(() => (a101.bookings as Booking[]).push({ id: 'x', start: 0, end: 1, title: 'x', bookedBy: 'x' })).toThrow(TypeError);
    expect(a101.bookings).toHaveLength(3);

    const originalStart = a101.bookings[0].start;
    expect(() => ((a101.bookings[0] as Booking).start = 1)).toThrow(TypeError);
    expect(a101.bookings[0].start).toBe(originalStart);
    expect(JSON.stringify(rooms)).toBe(before);
  });
});
