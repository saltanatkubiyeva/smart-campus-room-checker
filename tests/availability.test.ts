// Regression tests for the original acceptance criteria AC1–AC5.
import { describe, expect, it } from 'vitest';
import { checkAvailability } from '@/lib/availability';
import { makeRoom, NOW } from './fixtures';

const check = (start: number, end: number, room = makeRoom()) =>
  checkAvailability(room, start, end, NOW);

describe('AC1 valid time', () => {
  it('AC1-a rejects a request that starts exactly now (540–570)', () => {
    expect(check(540, 570).available).toBe(false);
  });
  it('AC1-b accepts a request one minute after now (541–600)', () => {
    expect(check(541, 600).available).toBe(true);
  });
  it('AC1-c rejects zero-length (700–700) and reversed (720–700) intervals', () => {
    expect(check(700, 700).available).toBe(false);
    expect(check(720, 700).available).toBe(false);
  });
  it('AC1-d accepts a booking ending at midnight (1380–1440), rejects 1400–1441', () => {
    expect(check(1380, 1440).available).toBe(true);
    expect(check(1400, 1441).available).toBe(false);
  });
});

describe('AC2 120-minute maximum', () => {
  it('AC2-a accepts exactly 120 minutes (720–840)', () => {
    expect(check(720, 840).available).toBe(true);
  });
  it('AC2-b rejects 121 minutes (720–841) with a clear message', () => {
    const r = check(720, 841);
    expect(r.available).toBe(false);
    expect(r.reason).toContain('120-minute maximum');
  });
});

describe('AC3 blocked room', () => {
  it('AC3 rejects a free slot in a blocked room', () => {
    expect(check(660, 720, makeRoom({ blocked: true })).available).toBe(false);
  });
});

describe('AC4 overlap rules', () => {
  it('AC4-a touching intervals (660–720 after 600–660) do not overlap', () => {
    expect(check(660, 720).available).toBe(true);
    expect(check(570, 600).available).toBe(true);
  });
  it('AC4-b overlapping intervals are rejected (630–690, 659–720, 570–601)', () => {
    expect(check(630, 690).available).toBe(false);
    expect(check(659, 720).available).toBe(false);
    expect(check(570, 601).available).toBe(false);
  });
});

describe('AC5 immutable booking data', () => {
  it('AC5 does not modify the room or its bookings', () => {
    const room = makeRoom({
      bookings: [
        { id: 'x2', start: 720, end: 780, title: 'Later', bookedBy: 'Test' },
        { id: 'x1', start: 600, end: 660, title: 'Earlier', bookedBy: 'Test' },
      ],
    });
    const before = JSON.parse(JSON.stringify(room));
    check(660, 720, room);
    check(630, 690, room);
    expect(room).toEqual(before);
  });
});
