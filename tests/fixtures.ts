import type { Room } from '@/data/rooms';
import { CURRENT_MINUTES } from '@/lib/constants';

/** Same base data as the A3 Python tests: now = 540, one booking 600–660. */
export const NOW = CURRENT_MINUTES;

export function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'T-1',
    name: 'Test Room',
    building: 'Test Block',
    capacity: 20,
    equipment: ['Projector', 'Whiteboard'],
    blocked: false,
    bookings: [{ id: 'x1', start: 600, end: 660, title: 'Existing', bookedBy: 'Test' }],
    ...overrides,
  };
}
