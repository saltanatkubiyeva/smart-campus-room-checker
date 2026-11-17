import { Filter, Info } from 'lucide-react';
import { EQUIPMENT_OPTIONS, type Equipment } from '@/data/rooms';

interface RoomFiltersProps {
  attendeesText: string;
  onAttendeesChange: (value: string) => void;
  attendeesError: string | null;
  equipment: readonly Equipment[];
  onToggleEquipment: (item: Equipment) => void;
}

export default function RoomFilters({
  attendeesText,
  onAttendeesChange,
  attendeesError,
  equipment,
  onToggleEquipment,
}: RoomFiltersProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
        <Filter className="w-4 h-4" /> Room requirements
      </h2>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div>
          <label htmlFor="attendees" className="block text-sm font-medium text-slate-700 mb-1.5">
            Attendees
          </label>
          <input
            id="attendees"
            type="number"
            min={1}
            max={500}
            inputMode="numeric"
            value={attendeesText}
            onChange={(e) => onAttendeesChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
          />
        </div>
        <fieldset>
          <legend className="block text-sm font-medium text-slate-700 mb-1.5">
            Required equipment
          </legend>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((item) => {
              const checked = equipment.includes(item);
              return (
                <label
                  key={item}
                  className={[
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer select-none transition-colors',
                    checked
                      ? 'border-sky-500 bg-sky-50 text-sky-800'
                      : 'border-slate-300 text-slate-700 hover:border-slate-400',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleEquipment(item)}
                    className="accent-sky-600"
                  />
                  {item}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
      {attendeesError && (
        <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5" role="alert">
          <Info className="w-4 h-4" /> {attendeesError}
        </p>
      )}
    </section>
  );
}
