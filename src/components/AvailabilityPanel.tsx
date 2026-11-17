import { CalendarCheck, DoorClosed, Info } from 'lucide-react';
import type { Room } from '@/data/rooms';
import type { CheckResult } from '@/lib/availability';
import { minutesToTime } from '@/lib/time';
import Timeline from '@/components/Timeline';
import TimeField from '@/components/TimeField';
import ResultBanner from '@/components/ResultBanner';
import ExplainBox from '@/components/ExplainBox';
import BookingList from '@/components/BookingList';

interface AvailabilityPanelProps {
  room: Room;
  currentMinutes: number;
  startTime: string;
  endTime: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onCheck: () => void;
  formError: string | null;
  result: CheckResult | null;
}

export default function AvailabilityPanel(props: AvailabilityPanelProps) {
  const { room, currentMinutes, formError, result } = props;
  return (
    <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <DoorClosed className="w-5 h-5 text-sky-600" />
        <h2 className="text-base font-bold text-slate-900" data-testid="selected-room">
          {room.name}
        </h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        {room.building} · Capacity {room.capacity} · {room.equipment.join(', ')}
        {room.blocked && <span className="text-red-600 font-medium"> · {room.blockReason}</span>}
      </p>

      <Timeline room={room} currentMinutes={currentMinutes} />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <TimeField id="start" label="Start time" value={props.startTime} onChange={props.onStartChange} />
        <TimeField id="end" label="End time" value={props.endTime} onChange={props.onEndChange} />
        <div>
          <p className="block text-sm font-medium text-slate-700 mb-1.5">Current time</p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {minutesToTime(currentMinutes)} <span className="text-slate-400">(fixed)</span>
          </p>
        </div>
      </div>

      {formError && (
        <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5" role="alert">
          <Info className="w-4 h-4" /> {formError}
        </p>
      )}

      <button
        type="button"
        onClick={props.onCheck}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 active:bg-sky-800"
      >
        <CalendarCheck className="w-4 h-4" />
        Check Availability
      </button>

      <ResultBanner result={result} />
      {/* The deterministic banner above stays authoritative. */}
      {result && (
        <ExplainBox
          // Remount (and so reset) the explanation whenever the room, result or
          // times change, so it can never describe a different decision (AC2).
          key={`${room.id}|${result.reasonCode}|${props.startTime}|${props.endTime}`}
          result={result}
          roomLabel={room.name}
          start={props.startTime}
          end={props.endTime}
        />
      )}
      <BookingList room={room} />

    </section>
  );
}
