import type { Room } from '@/data/rooms';
import { minutesToTime } from '@/lib/time';

export default function BookingList({ room }: { room: Room }) {
  if (room.blocked || room.bookings.length === 0) return null;
  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Existing Bookings</h3>
      <ul className="space-y-1.5">
        {room.bookings.map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between text-sm rounded-lg bg-slate-50 px-3 py-2"
          >
            <span className="text-slate-700 font-medium">{b.title}</span>
            <span className="text-slate-500 tabular-nums">
              {minutesToTime(b.start)}–{minutesToTime(b.end)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
