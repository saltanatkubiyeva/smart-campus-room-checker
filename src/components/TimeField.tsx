interface TimeFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** One labelled time input — replaces three copies of the same markup. */
export default function TimeField({ id, label, value, onChange }: TimeFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
      />
    </div>
  );
}
