export default function StatusBadge({ blocked }: { blocked: boolean }) {
  const style = blocked ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50';
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style}`}
    >
      {blocked ? 'Blocked' : 'Open'}
    </span>
  );
}
