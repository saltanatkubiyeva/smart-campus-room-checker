// @vitest-environment jsdom
// UI / integration checks: real React rendering of the whole page in a DOM.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import RoomChecker from '@/components/RoomChecker';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<RoomChecker />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const $ = <T extends Element>(sel: string) => container.querySelector<T>(sel);

function typeInto(selector: string, value: string) {
  const input = $<HTMLInputElement>(selector)!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function click(el: Element | null) {
  act(() => (el as HTMLElement).click());
}

const button = (text: string) =>
  Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) ?? null;
const checkbox = (label: string) =>
  Array.from(container.querySelectorAll('label')).find((l) => l.textContent === label)?.querySelector('input') ?? null;
const visibleRoomIds = () =>
  Array.from(container.querySelectorAll('[data-room-id]')).map((b) => b.getAttribute('data-room-id'));
const resultText = () => $('[data-testid="result"]')?.textContent ?? '';

describe('UI behaviour', () => {
  it('UI-1 shows the empty state when no room fits 100 attendees (F4)', () => {
    typeInto('#attendees', '100');
    expect(container.textContent).toContain('No rooms match your requirements.');
    expect(visibleRoomIds()).toEqual([]);
    expect(button('Check Availability')).toBeNull();
  });

  it('UI-2 capacity + equipment filters show only matching rooms (F1, F2)', () => {
    typeInto('#attendees', '30');
    click(checkbox('Video conferencing'));
    expect(visibleRoomIds()).toEqual(['E-220']);
  });

  it('UI-3 switching rooms refreshes the result with the new room bookings (F5)', () => {
    click(button('Room A-101'));
    typeInto('#start', '10:00');
    typeInto('#end', '11:00');
    click(button('Check Availability'));
    expect(resultText()).toContain('Available');
    expect(resultText()).toContain('Room A-101 is available');

    click(button('Room B-204'));
    expect($('[data-testid="selected-room"]')?.textContent).toBe('Room B-204');
    expect(resultText()).toContain('Unavailable');
    expect(resultText()).toContain('Physics Lab');
  });

  it('UI-5 an invalid attendee value shows the error and no rooms (never filters as 1)', () => {
    typeInto('#attendees', '2.5');
    expect(container.textContent).toContain(
      'Attendees must be a whole number from 1 to 500.'
    );
    expect(visibleRoomIds()).toEqual([]);
    expect(container.textContent).toContain('No rooms match your requirements.');
  });

  it('UI-6 explain button appears after a check and the mock box never changes the banner (AC1-AC6)', async () => {
    // Before a result exists there is no explain button.
    expect($('[data-testid="explain-button"]')).toBeNull();
    click(button('Room A-101'));
    typeInto('#start', '10:00');
    typeInto('#end', '11:00');
    click(button('Check Availability'));
    expect(resultText()).toContain('Available');

    const bannerBefore = $('[data-testid="result"]')?.textContent;
    click($('[data-testid="explain-button"]'));
    // The box appears with its mock disclaimer and settles into the explanation.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150)); // mock resolves after ~50ms
    });
    expect($('[data-testid="explain-box"]')?.textContent).toContain(
      'AI-generated explanation (mock) — not a booking confirmation'
    );
    expect($('[data-testid="explain-box"]')?.textContent).toContain('Room A-101');
    // The deterministic banner is untouched by the explanation.
    expect($('[data-testid="result"]')?.textContent).toBe(bannerBefore);

    // A new check resets the stale explanation (button hidden until re-check).
    typeInto('#start', '10:30');
    expect($('[data-testid="explain-button"]')).toBeNull();
    expect($('[data-testid="explain-box"]')).toBeNull();
  });

  it('UI-7 switching rooms never leaves an explanation for the previous room (AC2)', async () => {
    click(button('Room A-101'));
    typeInto('#start', '10:00');
    typeInto('#end', '11:00');
    click(button('Check Availability'));
    click($('[data-testid="explain-button"]'));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });
    expect($('[data-testid="explain-box"]')?.textContent).toContain('Room A-101 is available');

    click(button('Room B-204'));
    expect(resultText()).toContain('Unavailable');
    // The old A-101 explanation must be gone; the student has to ask again.
    expect($('[data-testid="explain-box"]')).toBeNull();
    expect(container.textContent).not.toContain('Room A-101 is available from 10:00 to 11:00 because');
  });

  it('UI-4 the blocked room is shown as Unavailable (F3, AC3) and a 00:00 end works', () => {
    click(button('Room C-310'));
    typeInto('#start', '23:00');
    typeInto('#end', '00:00');
    click(button('Check Availability'));
    expect(resultText()).toContain('Unavailable');
    click(button('Room A-101'));
    expect(resultText()).toContain('available from 23:00 to 24:00');
  });
});
