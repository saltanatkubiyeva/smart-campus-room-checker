import type { Equipment, Room } from '@/data/rooms';

export interface RoomRequirements {
  attendees: number;
  equipment: readonly Equipment[];
}

/** F1: capacity must be greater than or equal to the requested attendees. */
export function hasCapacity(room: Room, attendees: number): boolean {
  return room.capacity >= attendees;
}

/** F2: the room must contain ALL selected equipment items. */
export function hasAllEquipment(room: Room, required: readonly Equipment[]): boolean {
  return required.every((item) => room.equipment.includes(item));
}

/** Rooms satisfying F1 and F2. Returns a new array; the catalog is not modified. */
export function filterRooms(rooms: readonly Room[], req: RoomRequirements): Room[] {
  return rooms.filter((r) => hasCapacity(r, req.attendees) && hasAllEquipment(r, req.equipment));
}

/**
 * Parse the "Attendees" field. Whole number from 1 to 500, otherwise null.
 */
export function parseAttendees(text: string): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const n = parseInt(text, 10);
  return n >= 1 && n <= 500 ? n : null;
}

/**
 * F5 helper: keep the current selection if it is still visible,
 * otherwise select the first matching room (or none for the empty state).
 */
export function resolveSelection(visible: readonly Room[], selectedId: string | null): string | null {
  if (selectedId && visible.some((r) => r.id === selectedId)) return selectedId;
  return visible.length > 0 ? visible[0].id : null;
}
