// New requirements F1–F5.
import { describe, expect, it } from 'vitest';
import { rooms } from '@/data/rooms';
import { checkAvailability } from '@/lib/availability';
import { filterRooms, parseAttendees, resolveSelection } from '@/lib/filterRooms';
import { makeRoom, NOW } from './fixtures';

const ids = (list: { id: string }[]) => list.map((r) => r.id);

describe('catalog', () => {
  it('C1 has at least four rooms with id, name, capacity, equipment, blocked and bookings', () => {
    expect(rooms.length >= 4).toBe(true);
    for (const r of rooms) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.name).toBe('string');
      expect(typeof r.capacity).toBe('number');
      expect(Array.isArray(r.equipment)).toBe(true);
      expect(typeof r.blocked).toBe('boolean');
      expect(Array.isArray(r.bookings)).toBe(true);
    }
  });
});

describe('F1 capacity filter', () => {
  it('F1-a includes a room whose capacity equals the attendees (25 → B-204)', () => {
    expect(ids(filterRooms(rooms, { attendees: 25, equipment: [] }))).toContain('B-204');
  });
  it('F1-b excludes a room with insufficient capacity (26 → no B-204)', () => {
    expect(ids(filterRooms(rooms, { attendees: 26, equipment: [] }))).not.toContain('B-204');
  });
  it('F1-c rejects invalid attendee input (0, -3, 2.5, empty)', () => {
    expect(parseAttendees('0')).toBeNull();
    expect(parseAttendees('-3')).toBeNull();
    expect(parseAttendees('2.5')).toBeNull();
    expect(parseAttendees('')).toBeNull();
    expect(parseAttendees('12')).toBe(12);
  });
});

describe('F2 equipment filter', () => {
  it('F2-a requires ALL selected items (Projector + Video conferencing)', () => {
    const result = filterRooms(rooms, { attendees: 1, equipment: ['Projector', 'Video conferencing'] });
    expect(ids(result)).toEqual(['C-310', 'E-220']);
  });
  it('F2-b a room missing one selected item is excluded', () => {
    const room = makeRoom({ equipment: ['Projector'] });
    expect(filterRooms([room], { attendees: 1, equipment: ['Projector', 'Whiteboard'] })).toHaveLength(0);
  });
  it('F2-c no selected equipment keeps every room', () => {
    expect(filterRooms(rooms, { attendees: 1, equipment: [] })).toHaveLength(rooms.length);
  });
});

describe('F3 blocked rooms', () => {
  it('F3 a blocked room is never available, even for a free valid slot', () => {
    const blocked = rooms.find((r) => r.blocked)!;
    for (const [s, e] of [[600, 660], [720, 840], [1380, 1440]]) {
      expect(checkAvailability(blocked, s, e, NOW).available).toBe(false);
    }
  });
});

describe('F4 empty state', () => {
  it('F4 returns an empty list when nothing matches (100 attendees)', () => {
    expect(filterRooms(rooms, { attendees: 100, equipment: [] })).toEqual([]);
  });
});

describe('F5 room switching', () => {
  it('F5-a the check uses the chosen room bookings, not another room', () => {
    const a = rooms.find((r) => r.id === 'A-101')!;
    const b = rooms.find((r) => r.id === 'B-204')!;
    expect(checkAvailability(a, 600, 660, NOW).available).toBe(true);
    expect(checkAvailability(b, 600, 660, NOW).available).toBe(false);
  });
  it('F5-b keeps a visible selection, otherwise falls back to the first match or none', () => {
    const list = filterRooms(rooms, { attendees: 30, equipment: [] }); // A-101, E-220
    expect(resolveSelection(list, 'E-220')).toBe('E-220');
    expect(resolveSelection(list, 'B-204')).toBe('A-101');
    expect(resolveSelection([], 'A-101')).toBeNull();
  });
  it('F5-c filtering does not modify the catalog', () => {
    const before = JSON.parse(JSON.stringify(rooms));
    filterRooms(rooms, { attendees: 30, equipment: ['Projector'] });
    expect(rooms).toEqual(before);
  });
});
