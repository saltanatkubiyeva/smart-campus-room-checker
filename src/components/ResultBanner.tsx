import { CheckCircle2, XCircle } from 'lucide-react';
import type { CheckResult } from '@/lib/availability';

const VARIANTS = {
  available: {
    title: 'Available',
    Icon: CheckCircle2,
    box: 'border-emerald-200 bg-emerald-50',
    icon: 'text-emerald-600',
    heading: 'text-emerald-800',
    text: 'text-emerald-700',
  },
  unavailable: {
    title: 'Unavailable',
    Icon: XCircle,
    box: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    heading: 'text-red-800',
    text: 'text-red-700',
  },
} as const;

/** One banner with two style variants (was two duplicated JSX branches). */
export default function ResultBanner({ result }: { result: CheckResult | null }) {
  if (!result) return null;
  const v = result.available ? VARIANTS.available : VARIANTS.unavailable;
  return (
    <div
      role="status"
      data-testid="result"
      className={`mt-6 flex items-start gap-3 rounded-xl border p-4 animate-[fadeIn_0.3s_ease] ${v.box}`}
    >
      <v.Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${v.icon}`} />
      <div>
        <p className={`font-semibold ${v.heading}`}>{v.title}</p>
        <p className={`text-sm mt-0.5 ${v.text}`}>{result.reason}</p>
      </div>
    </div>
  );
}
