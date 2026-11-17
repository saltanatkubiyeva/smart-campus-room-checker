import { describe, expect, it } from 'vitest';
import { parseTimeRange } from '@/lib/time';

describe('time parsing (moved out of the UI during refactoring)', () => {
  it('T1 treats an end time of 00:00 as midnight (1440)', () => {
    expect(parseTimeRange('23:00', '00:00')).toEqual({ start: 1380, end: 1440 });
  });
  it('T2 returns null for malformed input', () => {
    expect(parseTimeRange('', '11:00')).toBeNull();
    expect(parseTimeRange('10:00', '25:00')).toBeNull();
  });
});
