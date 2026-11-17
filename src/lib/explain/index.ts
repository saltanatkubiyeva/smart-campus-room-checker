// Explanation feature (mock). A real LLM adapter would call its provider from
// server-side code (e.g. a Supabase Edge Function) — never from the browser,
// because an API key in client code is a leaked secret.
import type { ReasonCode } from '@/lib/availability';

export const EXPLAIN_TIMEOUT_MS = 3000;

export interface ExplainRequest {
  roomLabel: string;
  start: string; // HH:MM
  end: string; // HH:MM
  isAvailable: boolean;
  reasonCode: ReasonCode;
}

export interface Explanation {
  explanation: string;
}

export type ExplainMode = 'ok' | 'slow' | 'error' | 'no-key';

const REASON_CODES: readonly ReasonCode[] = [
  'AVAILABLE',
  'INVALID_INTERVAL',
  'PAST_TIME',
  'TOO_LONG',
  'BLOCKED',
  'OVERLAP',
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_LABEL_LENGTH = 60;

/** Rejects empty, malformed or overly long ExplainRequest input. */
export function validateExplainRequest(req: unknown): ExplainRequest | null {
  if (typeof req !== 'object' || req === null) return null;
  const r = req as Record<string, unknown>;
  const { roomLabel, start, end, isAvailable, reasonCode } = r;
  if (
    typeof roomLabel !== 'string' ||
    roomLabel.trim().length === 0 ||
    roomLabel.length > MAX_LABEL_LENGTH
  ) {
    return null;
  }
  if (typeof start !== 'string' || !TIME_RE.test(start)) return null;
  if (typeof end !== 'string' || !TIME_RE.test(end)) return null;
  if (typeof isAvailable !== 'boolean') return null;
  if (
    typeof reasonCode !== 'string' ||
    !REASON_CODES.includes(reasonCode as ReasonCode)
  ) {
    return null;
  }
  return {
    roomLabel,
    start,
    end,
    isAvailable,
    reasonCode: reasonCode as ReasonCode,
  };
}

/**
 * Limits the model to the supplied facts: no new booking data, at most two
 * sentences, never overriding the deterministic availability status.
 */
export const EXPLAIN_SYSTEM_PROMPT = [
  'You explain room availability to a student.',
  'Use ONLY the facts given in the request; invent nothing.',
  'At most two sentences.',
  'The given availability status is final and must never be changed or questioned.',
].join(' ');

export interface ExplainAdapter {
  explain: (req: ExplainRequest, systemPrompt: string) => Promise<Explanation>;
}

export type TestMode = ExplainMode;

/**
 * MOCK adapter — builds an explanation from the structured request only.
 * Never calls the network. `mode` simulates failures for tests.
 */
export function mockExplainAdapter(
  mode: ExplainMode = 'ok',
  clock: { setTimeout: typeof setTimeout } = globalThis
): ExplainAdapter {
  return {
    explain(req, systemPrompt) {
      void systemPrompt; // the mock never sends anything anywhere
      return new Promise<Explanation>((resolve, reject) => {
        if (mode === 'no-key') {
          reject(new Error('MOCK: missing API key — a real adapter runs server-side.'));
          return;
        }
        if (mode === 'error') {
          reject(new Error('MOCK: provider error'));
          return;
        }
        const delay = mode === 'slow' ? EXPLAIN_TIMEOUT_MS + 1000 : 50;
        clock.setTimeout(() => {
          const status = req.isAvailable ? 'available' : 'not available';
          const cause: Record<ReasonCode, string> = {
            AVAILABLE: 'the requested slot is free',
            INVALID_INTERVAL: 'the time interval is invalid',
            PAST_TIME: 'the start time is not after the current time',
            TOO_LONG: 'the request exceeds the 120-minute maximum',
            BLOCKED: 'the room is blocked',
            OVERLAP: 'another booking overlaps the slot',
          };
          const why = req.isAvailable
            ? cause.AVAILABLE
            : cause[req.reasonCode] ?? 'the booking rules reject the request';
          resolve({
            explanation: `${req.roomLabel} is ${status} from ${req.start} to ${req.end} because ${why}.`,
          });
        }, delay);
      });
    },
  };
}

/** Output contract: { explanation: string }, non-empty, ≤2 sentences, ≤300 chars,
 * and it must not contradict the deterministic status. */
export function validateExplanation(
  value: unknown,
  req: ExplainRequest
): Explanation | null {
  if (typeof value !== 'object' || value === null) return null;
  const explanation = (value as Record<string, unknown>).explanation;
  if (typeof explanation !== 'string') return null;
  const text = explanation.trim();
  if (text.length === 0 || text.length > 300) return null;
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0);
  if (sentences.length > 2) return null;
  const agrees = req.isAvailable
    ? !/\bnot available\b|\bunavailable\b/i.test(text)
    : !/\bis available\b/i.test(text);
  if (!agrees) return null;
  return { explanation: text };
}

/** Deterministic text used whenever the adapter fails or returns bad output. */
export function fallbackExplanation(req: ExplainRequest): Explanation {
  const status = req.isAvailable ? 'available' : 'not available';
  return {
    explanation:
      `${req.roomLabel} is ${status} from ${req.start} to ${req.end}, ` +
      'as shown in the result above.',
  };
}

/** Races the adapter against the 3-second timeout; slow/hung providers reject. */
export function explainWithTimeout(
  adapter: ExplainAdapter,
  req: ExplainRequest,
  systemPrompt: string,
  timer: { setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout } = globalThis
): Promise<Explanation> {
  return new Promise<Explanation>((resolve, reject) => {
    const id = timer.setTimeout(
      () => reject(new Error(`Explanation timed out after ${EXPLAIN_TIMEOUT_MS}ms.`)),
      EXPLAIN_TIMEOUT_MS
    );
    adapter
      .explain(req, systemPrompt)
      .then(resolve, reject)
      .finally(() => timer.clearTimeout(id));
  });
}
