import { Building2, MapPin, SearchX, Users } from 'lucide-react';
import type { Room } from '@/data/rooms';
import StatusBadge from '@/components/StatusBadge';

interface RoomListProps {
  rooms: readonly Room[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function RoomList({ rooms, totalCount, selectedId, onSelect }: RoomListProps) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">
        Matching rooms{' '}
        <span className="font-normal text-slate-500" data-testid="match-count">
          ({rooms.length} of {totalCount})
        </span>
      </h2>

      {rooms.length === 0 ? (
        // F4: clear empty state
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600"
        >
          <SearchX className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-800">No rooms match your requirements.</p>
            <p className="mt-0.5">Lower the number of attendees or remove an equipment item.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const active = room.id === selectedId;
            return (
              <button
                key={room.id}
                type="button"
                aria-pressed={active}
                data-room-id={room.id}
                onClick={() => onSelect(room.id)}
                className={[
                  'text-left rounded-2xl border p-4 transition-all duration-200',
                  active
                    ? 'border-sky-500 ring-2 ring-sky-200 bg-white shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800 text-sm">{room.name}</span>
                  </div>
                  <StatusBadge blocked={room.blocked} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {room.building}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {room.capacity}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{room.equipment.join(' · ')}</p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
