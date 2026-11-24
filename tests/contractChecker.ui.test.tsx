// @vitest-environment jsdom
// UI checks for the Practice 13 contract form: T1/T2 through the form, stale
// result clearing on input change, and the bookings-unchanged evidence line.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ContractChecker from '@/components/ContractChecker';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<ContractChecker />));
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

function selectInto(selector: string, value: string) {
  const select = $<HTMLSelectElement>(selector)!;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function click(el: Element | null) {
  act(() => (el as HTMLElement).click());
}

const button = (text: string) =>
  Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) ?? null;
const resultText = () => $('[data-testid="p13-result"]')?.textContent ?? '';
const integrityText = () => $('[data-testid="p13-integrity"]')?.textContent ?? '';

describe('ContractChecker UI (P13)', () => {
  it('T1 through the form: 10:30 + 60 open -> Available', () => {
    typeInto('#p13-start', '10:30');
    typeInto('#p13-duration', '60');
    click(button('Check'));
    expect(resultText()).toContain('Available');
    expect(resultText()).toContain('AVAILABLE');
    expect(integrityText()).toContain('Checks run: 1');
    expect(integrityText()).toContain('bookings unchanged: yes');
  });

  it('T2 through the form: 12:30 + 60 -> Unavailable / OVERLAP', () => {
    typeInto('#p13-start', '12:30');
    typeInto('#p13-duration', '60');
    click(button('Check'));
    expect(resultText()).toContain('Unavailable');
    expect(resultText()).toContain('OVERLAP');
    expect(integrityText()).toContain('bookings unchanged: yes');
  });

  it('editing any input clears a stale result before the next check', () => {
    typeInto('#p13-start', '10:30');
    typeInto('#p13-duration', '60');
    click(button('Check'));
    expect(resultText()).toContain('Available');

    typeInto('#p13-start', '12:30');
    expect($('[data-testid="p13-result"]')).toBeNull();

    click(button('Check'));
    expect(resultText()).toContain('OVERLAP');

    typeInto('#p13-duration', '30');
    expect($('[data-testid="p13-result"]')).toBeNull();

    selectInto('#p13-status', 'Blocked');
    expect($('[data-testid="p13-result"]')).toBeNull();
  });

  it('T6 through the form: 08:00 + 30 shows Invalid input / PAST_START', () => {
    typeInto('#p13-start', '08:00');
    typeInto('#p13-duration', '30');
    click(button('Check'));
    expect(resultText()).toContain('Invalid input');
    expect(resultText()).toContain('PAST_START');
    expect(integrityText()).toContain('bookings unchanged: yes');
  });

  it('the integrity line reports unchanged bookings after several checks', () => {
    typeInto('#p13-start', '10:30');
    typeInto('#p13-duration', '60');
    click(button('Check'));
    typeInto('#p13-start', '12:30');
    click(button('Check'));
    expect(integrityText()).toContain('Checks run: 2');
    expect(integrityText()).toContain('bookings unchanged: yes');
    // The bookings table still shows all three bookings.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
  });
});
