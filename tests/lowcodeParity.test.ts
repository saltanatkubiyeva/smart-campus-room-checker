// Parity check between the two Practice 13 implementations.
// The Appsmith JS Object (lowcode/appsmith/Rules.js, copied verbatim from the
// Appsmith editor) and the code-based contract (src/lib/contract.ts) must
// return the same reasonCode and availability for the same inputs.
import { describe, expect, it } from 'vitest';
import { rooms } from '@/data/rooms';
import { evaluateRequest } from '@/lib/contract';
// @ts-expect-error plain JS object exported from Appsmith (no type declarations)
import Rules from '../lowcode/appsmith/Rules.js';

type LowCodeResult = { available: boolean; reasonCode: string; message: string };
const lowCode = Rules as {
  evaluate: (start: string, duration: string, status: string) => LowCodeResult;
  runTests: () => { id: string; pass: boolean }[];
  bookings: { start: string; end: string }[];
};

const A101 = rooms.find((r) => r.id === 'A-101')!;

describe('low-code (Appsmith) vs code-based parity', () => {
  it('the low-code bookings are the same fictional bookings as rooms.ts', () => {
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    expect(lowCode.bookings.map((b) => [toMin(b.start), toMin(b.end)])).toEqual(
      A101.bookings.map((b) => [b.start, b.end])
    );
  });

  it('runTests() inside the Appsmith object reports T1-T8 as passing', () => {
    const rows = lowCode.runTests();
    expect(rows.map((r) => r.id)).toEqual(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']);
    expect(rows.every((r) => r.pass)).toBe(true);
  });

  it('same reasonCode and availability for a grid of 1,500+ inputs', () => {
    const starts: string[] = [];
    for (let m = 0; m < 1440; m += 15) {
      starts.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
    starts.push('', '9:00', '24:00', '10:3', 'abc');
    const durations = [-5, 0, 1, 30, 59, 60, 120, 121, 1.5];
    let compared = 0;
    for (const start of starts) {
      for (const d of durations) {
        for (const status of ['Open', 'Blocked'] as const) {
          const code = evaluateRequest(A101, { start, durationMinutes: d, roomStatus: status });
          const low = lowCode.evaluate(start, String(d), status);
          expect({ start, d, status, code: low.reasonCode, ok: low.available }).toEqual({
            start,
            d,
            status,
            code: code.reasonCode,
            ok: code.available,
          });
          compared += 1;
        }
      }
    }
    expect(compared).toBeGreaterThan(1500);
  });
});
