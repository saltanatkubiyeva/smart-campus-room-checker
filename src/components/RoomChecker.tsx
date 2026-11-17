import { useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { rooms as catalog, type Equipment, type Room } from '@/data/rooms';
import { CURRENT_MINUTES } from '@/lib/constants';
import { checkAvailability } from '@/lib/availability';
import { filterRooms, parseAttendees, resolveSelection } from '@/lib/filterRooms';
import { parseTimeRange, type TimeRange } from '@/lib/time';
import RoomFilters from '@/components/RoomFilters';
import RoomList from '@/components/RoomList';
import AvailabilityPanel from '@/components/AvailabilityPanel';

interface RoomCheckerProps {
  rooms?: readonly Room[];
  currentMinutes?: number;
}

/** Container: holds state and connects the pure rule modules to the UI. */
export default function RoomChecker({
  rooms = catalog,
  currentMinutes = CURRENT_MINUTES,
}: RoomCheckerProps) {
  const [attendeesText, setAttendeesText] = useState('1');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(rooms[0]?.id ?? null);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  // The last checked request; the result is derived from it and the selected room.
  const [checked, setChecked] = useState<TimeRange | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const attendees = parseAttendees(attendeesText);
  // While the attendee input is invalid, no requirement is known, so no room
  // is offered as matching; the filter error tells the user why.
  const visibleRooms = useMemo(
    () => (attendees === null ? [] : filterRooms(rooms, { attendees, equipment })),
    [rooms, attendees, equipment]
  );

  // F5: if the selected room is filtered out, fall back to the first visible room.
  const activeId = resolveSelection(visibleRooms, selectedId);
  const selectedRoom = visibleRooms.find((r) => r.id === activeId) ?? null;

  // F5: the result is always computed for the room that is selected now,
  // using that room's own bookings.
  const result = useMemo(
    () =>
      selectedRoom && checked
        ? checkAvailability(selectedRoom, checked.start, checked.end, currentMinutes)
        : null,
    [selectedRoom, checked, currentMinutes]
  );

  const editTime = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setChecked(null); // inputs changed: hide the old result until the user checks again
  };

  const handleCheck = () => {
    const range = parseTimeRange(startTime, endTime);
    if (!range) {
      setFormError('Please enter valid start and end times.');
      setChecked(null);
      return;
    }
    setFormError(null);
    setChecked(range);
  };

  const toggleEquipment = (item: Equipment) =>
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Smart Campus Room Availability
            </h1>
            <p className="text-xs text-slate-500">Find a room and check it before you book — prototype</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <RoomFilters
          attendeesText={attendeesText}
          onAttendeesChange={setAttendeesText}
          attendeesError={
            attendees === null ? 'Attendees must be a whole number from 1 to 500.' : null
          }
          equipment={equipment}
          onToggleEquipment={toggleEquipment}
        />

        <RoomList
          rooms={visibleRooms}
          totalCount={rooms.length}
          selectedId={activeId}
          onSelect={setSelectedId}
        />

        {selectedRoom && (
          <AvailabilityPanel
            room={selectedRoom}
            currentMinutes={currentMinutes}
            startTime={startTime}
            endTime={endTime}
            onStartChange={editTime(setStartTime)}
            onEndChange={editTime(setEndTime)}
            onCheck={handleCheck}
            formError={formError}
            result={result}
          />
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Prototype only — checking availability does not save or confirm a booking.
        </p>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
