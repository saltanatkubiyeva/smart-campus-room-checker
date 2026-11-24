import { useState } from 'react';
import { CalendarCheck, DoorClosed } from 'lucide-react';
import { rooms } from '@/data/rooms';
import { CURRENT_MINUTES } from '@/lib/constants';
import { evaluateRequest, type ContractResult } from '@/lib/contract';
import { minutesToTime } from '@/lib/time';

const A101 = rooms.find((r) => r.id === 'A-101')!;

const BANNER = {
  available: { label: 'Available', style: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  unavailable: { label: 'Unavailable', style: 'border-red-200 bg-red-50 text-red-800' },
  invalid: { label: 'Invalid input', style: 'border-amber-200 bg-amber-50 text-amber-800' },
} as const;

function bannerKind(result: ContractResult): 'available' | 'unavailable' | 'invalid' {
  if (result.reasonCode === 'INVALID_INPUT' || result.reasonCode === 'INVALID_DURATION') {
    return 'invalid';
  }
  return result.available ? 'available' : 'unavailable';
}

/** Practice 13 form: start time, duration, room status. Pure rules live in lib/contract.ts. */
export default function ContractChecker() {
  const [start, setStart] = useState('10:30');
  const [duration, setDuration] = useState('60');
  const [status, setStatus] = useState<'Open' | 'Blocked'>('Open');
  const [result, setResult] = useState<ContractResult | null>(null);

  const handleCheck = () => {
    const minutes = Number(duration);
    setResult(
      evaluateRequest(A101, {
        start,
        durationMinutes: Number.isInteger(minutes) ? minutes : duration,
        roomStatus: status,
      })
    );
  };

  return (
    <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <DoorClosed className="w-5 h-5 text-sky-600" />
        <h2 className="text-base font-bold text-slate-900">{A101.name} — Practice 13 check</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        {A101.building} · Capacity {A101.capacity} · Current time fixed at{' '}
        {minutesToTime(CURRENT_MINUTES)}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="p13-start" className="block text-sm font-medium text-slate-700 mb-1.5">
            Start time
          </label>
          <input
            id="p13-start"
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
          />
        </div>
        <div>
          <label htmlFor="p13-duration" className="block text-sm font-medium text-slate-700 mb-1.5">
            Duration (minutes)
          </label>
          <input
            id="p13-duration"
            type="number"
            min={1}
            max={120}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
          />
        </div>
        <div>
          <label htmlFor="p13-status" className="block text-sm font-medium text-slate-700 mb-1.5">
            Room status
          </label>
          <select
            id="p13-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'Open' | 'Blocked')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
          >
            <option value="Open">Open</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheck}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 active:bg-sky-800"
      >
        <CalendarCheck className="w-4 h-4" />
        Check
      </button>

      {result && (
        <div
          role="status"
          data-testid="p13-result"
          className={`mt-5 rounded-xl border p-4 ${BANNER[bannerKind(result)].style}`}
        >
          <p className="font-semibold">{BANNER[bannerKind(result)].label}</p>
          <p className="text-sm mt-0.5">
            <span className="font-mono text-xs">{result.reasonCode}</span> — {result.message}
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Existing bookings (never changed by a check)
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs">
              <th className="py-1.5 pr-3 font-medium">Booking</th>
              <th className="py-1.5 pr-3 font-medium">Time</th>
              <th className="py-1.5 font-medium">Booked by</th>
            </tr>
          </thead>
          <tbody>
            {A101.bookings.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="py-1.5 pr-3 text-slate-700 font-medium">{b.title}</td>
                <td className="py-1.5 pr-3 text-slate-500 tabular-nums">
                  {minutesToTime(b.start)}–{minutesToTime(b.end)}
                </td>
                <td className="py-1.5 text-slate-500">{b.bookedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
