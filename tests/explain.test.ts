// Unit tests for the mock explain feature (input/output validation, modes,
// timeout and fallback). The deterministic checker stays authoritative.
import { describe, expect, it } from 'vitest';
import {
  EXPLAIN_SYSTEM_PROMPT,
  EXPLAIN_TIMEOUT_MS,
  explainWithTimeout,
  fallbackExplanation,
  mockExplainAdapter,
  validateExplainRequest,
  validateExplanation,
  type ExplainRequest,
} from '@/lib/explain';

const okRequest: ExplainRequest = {
  roomLabel: 'Room A-101',
  start: '10:00',
  end: '11:00',
  isAvailable: true,
  reasonCode: 'AVAILABLE',
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('validateExplainRequest', () => {
  it('accepts a well-formed request', () => {
    expect(validateExplainRequest(okRequest)).toEqual(okRequest);
  });

  it('rejects empty, malformed or overly long input', () => {
    expect(validateExplainRequest(null)).toBeNull();
    expect(validateExplainRequest('nope')).toBeNull();
    expect(validateExplainRequest({ ...okRequest, roomLabel: '   ' })).toBeNull();
    expect(validateExplainRequest({ ...okRequest, roomLabel: 'R'.repeat(61) })).toBeNull();
    expect(validateExplainRequest({ ...okRequest, start: '25:00' })).toBeNull();
    expect(validateExplainRequest({ ...okRequest, end: '9:00' })).toBeNull();
    expect(validateExplainRequest({ ...okRequest, reasonCode: 'MAYBE' })).toBeNull();
    expect(validateExplainRequest({ ...okRequest, isAvailable: 'yes' })).toBeNull();
  });
});

describe('system prompt', () => {
  it('restricts the model to facts, two sentences, never overriding the status', () => {
    expect(EXPLAIN_SYSTEM_PROMPT).toContain('ONLY the facts');
    expect(EXPLAIN_SYSTEM_PROMPT).toContain('two sentences');
    expect(EXPLAIN_SYSTEM_PROMPT).toContain('never');
  });
});

describe('mockExplainAdapter (MOCK, no network)', () => {
  it('mode ok: explanation built only from the structured request', async () => {
    const adapter = mockExplainAdapter('ok');
    const out = await adapter.explain(okRequest, EXPLAIN_SYSTEM_PROMPT);
    expect(out.explanation).toContain('Room A-101 is available from 10:00 to 11:00');
  });

  it('mode slow: exceeds the 3s timeout, so the caller must fall back', async () => {
    const adapter = mockExplainAdapter('slow');
    await expect(
      explainWithTimeout(adapter, okRequest, EXPLAIN_SYSTEM_PROMPT)
    ).rejects.toThrow(/timed out after 3000ms/i);
  });

  it('mode error and no-key: reject deterministically', async () => {
    await expect(
      mockExplainAdapter('error').explain(okRequest, EXPLAIN_SYSTEM_PROMPT)
    ).rejects.toThrow('MOCK: provider error');
    await expect(
      mockExplainAdapter('no-key').explain(okRequest, EXPLAIN_SYSTEM_PROMPT)
    ).rejects.toThrow(/server-side/);
  });

  it('timeout is 3 seconds and a hung mock outlives it', async () => {
    expect(EXPLAIN_TIMEOUT_MS).toBe(3000);
    let settled = false;
    const promise = explainWithTimeout(
      mockExplainAdapter('slow'),
      okRequest,
      EXPLAIN_SYSTEM_PROMPT
    ).then(
      () => (settled = true),
      () => (settled = true)
    );
    await wait(EXPLAIN_TIMEOUT_MS - 200);
    expect(settled).toBe(false); // still pending just before the deadline
    await wait(200);
    expect(settled).toBe(true); // rejected by the timeout, not resolved
    await promise; // exhaust the promise so no unhandled rejection leaks
  });

  it('unavailable request names the rule that fired', async () => {
    const adapter = mockExplainAdapter('ok');
    const out = await adapter.explain(
      { ...okRequest, isAvailable: false, reasonCode: 'OVERLAP' },
      EXPLAIN_SYSTEM_PROMPT
    );
    expect(out.explanation).toContain('not available');
    expect(out.explanation).toContain('overlaps');
  });
});

describe('validateExplanation', () => {
  it('accepts a valid, agreeing explanation', () => {
    expect(validateExplanation({ explanation: 'Room A-101 is available then.' }, okRequest)).toEqual({
      explanation: 'Room A-101 is available then.',
    });
  });

  it('rejects non-object, wrong shape, empty, too long or too many sentences', () => {
    expect(validateExplanation(null, okRequest)).toBeNull();
    expect(validateExplanation('text', okRequest)).toBeNull();
    expect(validateExplanation({ wrong: true }, okRequest)).toBeNull();
    expect(validateExplanation({ explanation: '   ' }, okRequest)).toBeNull();
    expect(validateExplanation({ explanation: 'x'.repeat(301) }, okRequest)).toBeNull();
    const three = 'One. Two. Three.';
    expect(validateExplanation({ explanation: three }, okRequest)).toBeNull();
  });

  it('rejects output that contradicts the deterministic status', () => {
    const bad = validateExplanation(
      { explanation: 'Unfortunately the room is not available at that time.' },
      okRequest
    );
    expect(bad).toBeNull();
  });
});

describe('fallbackExplanation', () => {
  it('is deterministic, agrees with the status and stays within the contract', () => {
    for (const isAvailable of [true, false]) {
      const req = { ...okRequest, isAvailable };
      const out = fallbackExplanation(req);
      expect(validateExplanation(out, req)).toEqual(out);
      expect(out.explanation).toContain(isAvailable ? 'is available' : 'is not available');
    }
  });
});
