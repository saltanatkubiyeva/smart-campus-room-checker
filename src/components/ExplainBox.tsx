import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { CheckResult } from '@/lib/availability';
import {
  EXPLAIN_SYSTEM_PROMPT,
  explainWithTimeout,
  fallbackExplanation,
  mockExplainAdapter,
  validateExplainRequest,
  validateExplanation,
  type Explanation,
} from '@/lib/explain';

interface ExplainBoxProps {
  result: CheckResult;
  roomLabel: string;
  start: string;
  end: string;
}

/**
 * MOCK explanation box. The adapter never touches the network; a real
 * integration would run server-side (e.g. a Supabase Edge Function) so no API
 * key ever reaches the browser. The banner above stays authoritative — this
 * box only rephrases the already-decided result.
 */
export default function ExplainBox({ result, roomLabel, start, end }: ExplainBoxProps) {
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);

  const onExplain = () => {
    // Validation at the adapter boundary, even though the inputs are built
    // from the already-validated checker output.
    const req = validateExplainRequest({
      roomLabel,
      start,
      end,
      isAvailable: result.available,
      reasonCode: result.reasonCode,
    });
    if (!req) return;
    setLoading(true);
    setExplanation(null);
    explainWithTimeout(mockExplainAdapter('ok'), req, EXPLAIN_SYSTEM_PROMPT)
      .then((out) => validateExplanation(out, req) ?? fallbackExplanation(req))
      .catch(() => fallbackExplanation(req))
      .then((final) => {
        setExplanation(final);
        setLoading(false);
      });
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onExplain}
        disabled={loading}
        data-testid="explain-button"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 disabled:opacity-60"
      >
        <Sparkles className="w-4 h-4 text-sky-600" />
        {loading ? 'Explaining…' : 'Explain availability'}
      </button>

      {(explanation || loading) && (
        <div
          data-testid="explain-box"
          className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              AI-generated explanation (mock) — not a booking confirmation
            </p>
            {loading ? (
              <p className="text-sm mt-1 text-slate-500" role="status">
                Thinking…
              </p>
            ) : (
              <p className="text-sm mt-1 text-slate-700">{explanation?.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
