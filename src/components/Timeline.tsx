import { Clock } from 'lucide-react';
import type { Room } from '@/data/rooms';
import { MINUTES_IN_DAY } from '@/lib/constants';
import { minutesToTime } from '@/lib/time';

const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0..24
const pct = (minutes: number) => `${(minutes / MINUTES_IN_DAY) * 100}%`;

export default function Timeline({ room, currentMinutes }: { room: Room; currentMinutes: number }) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
        <Clock className="w-4 h-4" />
        Today's Schedule — {room.name}
      </div>

      <div className="relative h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 border-l border-slate-200"
            style={{ left: pct(h * 60) }}
          />
        ))}

        {room.bookings.map((b) => (
          <div
            key={b.id}
            className="absolute top-1 bottom-1 rounded bg-sky-500/90 text-white text-[10px] px-1 flex items-center overflow-hidden whitespace-nowrap"
            style={{ left: pct(b.start), width: pct(b.end - b.start) }}
            title={`${b.title} (${minutesToTime(b.start)}–${minutesToTime(b.end)})`}
          >
            <span className="truncate">{b.title}</span>
          </div>
        ))}

        {room.blocked && (
          <div className="absolute inset-0 bg-red-100/80 flex items-center justify-center text-red-700 text-xs font-semibold">
            Blocked
          </div>
        )}

        <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500" style={{ left: pct(currentMinutes) }}>
          <span className="absolute -top-0 -translate-y-full text-[9px] text-amber-600 font-medium whitespace-nowrap">
            Now
          </span>
        </div>
      </div>

      <div className="relative h-5 mt-1">
        {HOURS.filter((h) => h % 3 === 0).map((h) => (
          <span
            key={h}
            className="absolute text-[10px] text-slate-400 -translate-x-1/2"
            style={{ left: pct(h * 60) }}
          >
            {minutesToTime(h * 60)}
          </span>
        ))}
      </div>
    </div>
  );
}
