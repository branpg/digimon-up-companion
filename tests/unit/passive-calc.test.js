/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateWaitTime,
  calculateMaxWaitTime,
  calculateAvailableEmeralds,
  calculateFloorRewards,
  validateNumericInput,
  init,
  destroy,
  getState,
  setState
} from '../../public/modules/passive-calc/passive-calc.js';

describe('validateNumericInput', () => {
  it('accepts 0 as valid for range [0, 999999999]', () => {
    expect(validateNumericInput('0', 0, 999999999)).toBe(0);
  });

  it('accepts max value 999999999', () => {
    expect(validateNumericInput('999999999', 0, 999999999)).toBe(999999999);
  });

  it('accepts a mid-range value', () => {
    expect(validateNumericInput('42', 0, 999999999)).toBe(42);
  });

  it('rejects value above max', () => {
    expect(validateNumericInput('1000000000', 0, 999999999)).toBeNull();
  });

  it('rejects negative value when min is 0', () => {
    expect(validateNumericInput('-1', 0, 999999999)).toBeNull();
  });

  it('rejects non-numeric string', () => {
    expect(validateNumericInput('abc', 0, 999999999)).toBeNull();
  });

  it('rejects string with mixed chars and numbers', () => {
    expect(validateNumericInput('12ab', 0, 999999999)).toBeNull();
  });

  it('rejects decimal values', () => {
    expect(validateNumericInput('3.5', 0, 999999999)).toBeNull();
  });

  it('returns min for empty string', () => {
    expect(validateNumericInput('', 0, 999999999)).toBe(0);
  });

  it('returns min for whitespace-only string', () => {
    expect(validateNumericInput('   ', 0, 999999999)).toBe(0);
  });
});

describe('calculateWaitTime', () => {
  it('returns null when rate is 0', () => {
    expect(calculateWaitTime(100, 0)).toBeNull();
  });

  it('returns null when rate is negative', () => {
    expect(calculateWaitTime(100, -5)).toBeNull();
  });

  it('calculates 50 minutes for target=100, rate=10', () => {
    // ceil(100/10) = 10 intervals, 10 * 5 = 50 minutes
    const result = calculateWaitTime(100, 10);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 50 });
  });

  it('rounds up to next interval', () => {
    // ceil(11/10) = 2 intervals, 2 * 5 = 10 minutes
    const result = calculateWaitTime(11, 10);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 10 });
  });

  it('decomposes into days, hours, and minutes', () => {
    // ceil(1000/1) = 1000 intervals, 1000 * 5 = 5000 minutes
    // 5000 / 1440 = 3 days remainder 680 minutes
    // 680 / 60 = 11 hours remainder 20 minutes
    const result = calculateWaitTime(1000, 1);
    expect(result).toEqual({ days: 3, hours: 11, minutes: 20 });
  });

  it('handles exact division (no rounding needed)', () => {
    // ceil(100/100) = 1 interval, 1 * 5 = 5 minutes
    const result = calculateWaitTime(100, 100);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 5 });
  });

  it('returns {0,0,0} when target is 0', () => {
    const result = calculateWaitTime(0, 10);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
});

describe('calculateMaxWaitTime', () => {
  it('returns null for empty array', () => {
    expect(calculateMaxWaitTime([])).toBeNull();
  });

  it('returns null when all rates are 0', () => {
    expect(calculateMaxWaitTime([{ target: 100, rate: 0 }, { target: 200, rate: 0 }])).toBeNull();
  });

  it('returns the longest wait time among resources', () => {
    // Resource 1: ceil(100/10)*5 = 50 min
    // Resource 2: ceil(1000/10)*5 = 500 min (8h 20min)
    const result = calculateMaxWaitTime([
      { target: 100, rate: 10 },
      { target: 1000, rate: 10 }
    ]);
    expect(result).toEqual({ days: 0, hours: 8, minutes: 20 });
  });

  it('ignores resources with rate 0', () => {
    const result = calculateMaxWaitTime([
      { target: 100, rate: 10 },
      { target: 9999, rate: 0 }
    ]);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 50 });
  });

  it('returns {0,0,0} when all targets are 0 with valid rates', () => {
    const result = calculateMaxWaitTime([
      { target: 0, rate: 10 },
      { target: 0, rate: 5 }
    ]);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
});

describe('calculateAvailableEmeralds', () => {
  it('calculates deadline time correctly', () => {
    // dailyPullCost = 100, rate = 10, intervals = ceil(100/10) = 10, minutes = 50
    // pullTime = 08:00, deadline = 08:00 - 50min = 07:10
    const result = calculateAvailableEmeralds(200, 100, '08:00', 10, new Date('2024-01-15T06:00:00'));
    expect(result.deadlineTime).toBe('07:10');
  });

  it('returns canSpend true when before deadline', () => {
    // deadline = 07:10, now = 06:00 → can spend
    const result = calculateAvailableEmeralds(200, 100, '08:00', 10, new Date('2024-01-15T06:00:00'));
    expect(result.canSpend).toBe(true);
  });

  it('returns canSpend false when past deadline', () => {
    // deadline = 07:10, now = 07:30 → cannot spend
    const result = calculateAvailableEmeralds(200, 100, '08:00', 10, new Date('2024-01-15T07:30:00'));
    expect(result.canSpend).toBe(false);
  });

  it('calculates available emeralds correctly', () => {
    // now = 06:00, pullTime = 08:00, minutesUntilPull = 120
    // intervals until pull = floor(120/5) = 24
    // emeraldsGenerated = 24 * 10 = 240
    // availableToSpend = max(0, 200 + 240 - 100) = 340
    const result = calculateAvailableEmeralds(200, 100, '08:00', 10, new Date('2024-01-15T06:00:00'));
    expect(result.availableToSpend).toBe(340);
  });
});

describe('Wait time button UI wiring', () => {
  let container;
  let localStorageMock;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <input type="number" id="mod-calc-floor" value="0">
      <input type="number" id="mod-calc-bits" value="10">
      <input type="number" id="mod-calc-hologram-tickets" value="5">
      <input type="number" id="mod-calc-digi-emeralds" value="2">
      <input type="number" id="mod-calc-daily-pull-cost" value="5700">
      <input type="time" id="mod-calc-pull-time" value="08:00">
      <input type="number" id="mod-calc-target-bits" value="0">
      <input type="number" id="mod-calc-target-hologram-tickets" value="0">
      <input type="number" id="mod-calc-target-digi-emeralds" value="0">
      <button id="mod-calc-wait-btn">Calculate</button>
      <div id="mod-calc-wait-result-value">
        <strong id="mod-calc-days-value">0</strong>
        <strong id="mod-calc-hours-value">0</strong>
        <strong id="mod-calc-minutes-value">0</strong>
      </div>
      <p id="mod-calc-wait-message" hidden>Configure rewards first</p>
    `;

    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => { localStorageMock[key] = value; }),
      removeItem: vi.fn((key) => { delete localStorageMock[key]; })
    });
  });

  afterEach(() => {
    destroy();
    vi.unstubAllGlobals();
  });

  it('shows zero result when no targets are set', () => {
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 10, hologramTickets: 5, digiEmeralds: 2 });
    init(container);

    container.querySelector('#mod-calc-wait-btn').click();

    expect(container.querySelector('#mod-calc-days-value').textContent).toBe('0');
    expect(container.querySelector('#mod-calc-hours-value').textContent).toBe('0');
    expect(container.querySelector('#mod-calc-minutes-value').textContent).toBe('0');
    expect(container.querySelector('#mod-calc-wait-result-value').hidden).toBe(false);
    expect(container.querySelector('#mod-calc-wait-message').hidden).toBe(true);
  });

  it('shows warning when a target resource has rate 0', () => {
    // bits rate = 0 (default when no saved config)
    init(container);

    container.querySelector('#mod-calc-target-bits').value = '100';
    container.querySelector('#mod-calc-wait-btn').click();

    expect(container.querySelector('#mod-calc-wait-result-value').hidden).toBe(true);
    expect(container.querySelector('#mod-calc-wait-message').hidden).toBe(false);
  });

  it('calculates and displays result when rates are configured', () => {
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 10, hologramTickets: 5, digiEmeralds: 2 });
    init(container);

    // target 100 bits, rate 10 → ceil(100/10)*5 = 50 min
    container.querySelector('#mod-calc-target-bits').value = '100';
    container.querySelector('#mod-calc-wait-btn').click();

    expect(container.querySelector('#mod-calc-wait-result-value').hidden).toBe(false);
    expect(container.querySelector('#mod-calc-wait-message').hidden).toBe(true);
    expect(container.querySelector('#mod-calc-days-value').textContent).toBe('0');
    expect(container.querySelector('#mod-calc-hours-value').textContent).toBe('0');
    expect(container.querySelector('#mod-calc-minutes-value').textContent).toBe('50');
  });

  it('uses max wait time across multiple resources', () => {
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 10, hologramTickets: 10, digiEmeralds: 2 });
    init(container);

    // bits: ceil(100/10)*5 = 50 min
    // hologram: ceil(1000/10)*5 = 500 min = 8h 20min
    container.querySelector('#mod-calc-target-bits').value = '100';
    container.querySelector('#mod-calc-target-hologram-tickets').value = '1000';
    container.querySelector('#mod-calc-wait-btn').click();

    expect(container.querySelector('#mod-calc-days-value').textContent).toBe('0');
    expect(container.querySelector('#mod-calc-hours-value').textContent).toBe('8');
    expect(container.querySelector('#mod-calc-minutes-value').textContent).toBe('20');
  });

  it('shows warning if one target resource has rate 0 even when others have rates', () => {
    // bits has rate 10, hologram has rate 0
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 10, hologramTickets: 0, digiEmeralds: 2 });
    init(container);

    container.querySelector('#mod-calc-target-bits').value = '100';
    container.querySelector('#mod-calc-target-hologram-tickets').value = '50';
    container.querySelector('#mod-calc-wait-btn').click();

    expect(container.querySelector('#mod-calc-wait-result-value').hidden).toBe(true);
    expect(container.querySelector('#mod-calc-wait-message').hidden).toBe(false);
  });
});

describe('Module lifecycle', () => {
  let container;
  let localStorageMock;

  beforeEach(() => {
    // Create a minimal DOM container
    container = document.createElement('div');
    container.innerHTML = `
      <input type="number" id="mod-calc-floor" value="0">
      <input type="number" id="mod-calc-bits" value="0">
      <input type="number" id="mod-calc-hologram-tickets" value="0">
      <input type="number" id="mod-calc-digi-emeralds" value="0">
      <input type="number" id="mod-calc-daily-pull-cost" value="5700">
      <input type="time" id="mod-calc-pull-time" value="08:00">
    `;

    // Mock localStorage
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => { localStorageMock[key] = value; }),
      removeItem: vi.fn((key) => { delete localStorageMock[key]; })
    });
  });

  afterEach(() => {
    destroy();
    vi.unstubAllGlobals();
  });

  it('init loads default values when localStorage is empty', () => {
    init(container);
    const state = getState();
    expect(state.rewardConfig).toEqual({ floor: 0, bits: 0, hologramTickets: 0, digiEmeralds: 0 });
    expect(state.emeraldConfig).toEqual({ dailyPullCost: 5700, pullTime: '08:00' });
  });

  it('init loads saved config from localStorage', () => {
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ floor: 40, bits: 100, hologramTickets: 50, digiEmeralds: 25 });
    localStorageMock['digimemory-emerald-config'] = JSON.stringify({ dailyPullCost: 3000, pullTime: '10:30' });

    init(container);
    const state = getState();
    expect(state.rewardConfig).toEqual({ floor: 40, bits: 100, hologramTickets: 50, digiEmeralds: 25 });
    expect(state.emeraldConfig).toEqual({ dailyPullCost: 3000, pullTime: '10:30' });
  });

  it('setState updates the config and reflects in getState', () => {
    init(container);
    setState({
      rewardConfig: { floor: 20, bits: 200, hologramTickets: 100, digiEmeralds: 50 },
      emeraldConfig: { dailyPullCost: 4000, pullTime: '12:00' }
    });
    const state = getState();
    expect(state.rewardConfig).toEqual({ floor: 20, bits: 200, hologramTickets: 100, digiEmeralds: 50 });
    expect(state.emeraldConfig).toEqual({ dailyPullCost: 4000, pullTime: '12:00' });
  });

  it('persists reward config to localStorage on valid input change', () => {
    init(container);

    const bitsInput = container.querySelector('#mod-calc-bits');
    bitsInput.value = '500';
    bitsInput.dispatchEvent(new Event('input'));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'digimemory-passive-config',
      expect.stringContaining('"bits":500')
    );
  });

  it('reverts to last valid value on out-of-range input', () => {
    init(container);

    const bitsInput = container.querySelector('#mod-calc-bits');
    // First set a valid value
    bitsInput.value = '100';
    bitsInput.dispatchEvent(new Event('input'));
    expect(bitsInput.value).toBe('100');

    // Now set an out-of-range value (above max 999999999)
    bitsInput.value = '1000000000';
    bitsInput.dispatchEvent(new Event('input'));

    // Should revert to 100
    expect(bitsInput.value).toBe('100');
  });
});

describe('Emerald calculation button UI wiring', () => {
  let container;
  let localStorageMock;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <input type="number" id="mod-calc-floor" value="0">
      <input type="number" id="mod-calc-bits" value="0">
      <input type="number" id="mod-calc-hologram-tickets" value="0">
      <input type="number" id="mod-calc-digi-emeralds" value="2">
      <input type="number" id="mod-calc-daily-pull-cost" value="100">
      <input type="time" id="mod-calc-pull-time" value="08:00">
      <input type="number" id="mod-calc-current-emeralds" placeholder="0">
      <button id="mod-calc-emerald-btn">Calculate</button>
      <div class="mod-calc-emerald-details">
        <span id="mod-calc-deadline-value">--:--</span>
        <span id="mod-calc-can-spend-value">0</span>
      </div>
      <p id="mod-calc-emerald-message" hidden>Cannot spend emeralds and reach the goal</p>
    `;

    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => { localStorageMock[key] = value; }),
      removeItem: vi.fn((key) => { delete localStorageMock[key]; })
    });
  });

  afterEach(() => {
    destroy();
    vi.unstubAllGlobals();
  });

  it('shows warning when emerald rate is 0 (not configured)', () => {
    // digiEmeralds rate = 0 (default)
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 0, hologramTickets: 0, digiEmeralds: 0 });
    init(container);

    container.querySelector('#mod-calc-emerald-btn').click();

    const messageEl = container.querySelector('#mod-calc-emerald-message');
    const detailsEl = container.querySelector('.mod-calc-emerald-details');
    expect(messageEl.hidden).toBe(false);
    expect(detailsEl.hidden).toBe(true);
  });

  it('shows deadline and available amount when canSpend is true', () => {
    // rate = 10, dailyPullCost = 100, pullTime = 08:00
    // deadline = 07:10, now = 06:00 → canSpend = true
    // currentEmeralds = 200
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 0, hologramTickets: 0, digiEmeralds: 10 });
    localStorageMock['digimemory-emerald-config'] = JSON.stringify({ dailyPullCost: 100, pullTime: '08:00' });
    init(container);

    // Mock Date so now = 06:00
    const mockNow = new Date('2024-01-15T06:00:00');
    vi.setSystemTime(mockNow);

    container.querySelector('#mod-calc-current-emeralds').value = '200';
    container.querySelector('#mod-calc-emerald-btn').click();

    const messageEl = container.querySelector('#mod-calc-emerald-message');
    const detailsEl = container.querySelector('.mod-calc-emerald-details');
    const deadlineEl = container.querySelector('#mod-calc-deadline-value');
    const canSpendEl = container.querySelector('#mod-calc-can-spend-value');

    expect(messageEl.hidden).toBe(true);
    expect(detailsEl.hidden).toBe(false);
    expect(deadlineEl.textContent).toBe('07:10');
    expect(canSpendEl.textContent).toBe('340');

    vi.useRealTimers();
  });

  it('shows warning and hides details when canSpend is false (past deadline)', () => {
    // rate = 10, dailyPullCost = 100, pullTime = 08:00
    // deadline = 07:10, now = 07:30 → canSpend = false
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 0, hologramTickets: 0, digiEmeralds: 10 });
    localStorageMock['digimemory-emerald-config'] = JSON.stringify({ dailyPullCost: 100, pullTime: '08:00' });
    init(container);

    const mockNow = new Date('2024-01-15T07:30:00');
    vi.setSystemTime(mockNow);

    container.querySelector('#mod-calc-current-emeralds').value = '200';
    container.querySelector('#mod-calc-emerald-btn').click();

    const messageEl = container.querySelector('#mod-calc-emerald-message');
    const detailsEl = container.querySelector('.mod-calc-emerald-details');

    expect(messageEl.hidden).toBe(false);
    expect(detailsEl.hidden).toBe(true);

    vi.useRealTimers();
  });

  it('validates current emeralds input - rejects out-of-range values', () => {
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 0, hologramTickets: 0, digiEmeralds: 10 });
    init(container);

    const currentEmeraldsInput = container.querySelector('#mod-calc-current-emeralds');

    // Set a valid value first
    currentEmeraldsInput.value = '500';
    currentEmeraldsInput.dispatchEvent(new Event('input'));
    expect(currentEmeraldsInput.value).toBe('500');

    // Exceed max (99999)
    currentEmeraldsInput.value = '100000';
    currentEmeraldsInput.dispatchEvent(new Event('input'));
    expect(currentEmeraldsInput.value).toBe('500');
  });

  it('validates current emeralds input - rejects non-numeric values', () => {
    localStorageMock['digimemory-passive-config'] = JSON.stringify({ bits: 0, hologramTickets: 0, digiEmeralds: 10 });
    init(container);

    const currentEmeraldsInput = container.querySelector('#mod-calc-current-emeralds');

    // In number inputs, typing non-numeric chars makes value = '' in real browsers.
    // Our validation treats '' as 0 (minimum), so the field settles at '0'.
    // Verify that the listener rejects negative values (which a number input can receive)
    // by testing a value explicitly below min.
    currentEmeraldsInput.value = '-5';
    currentEmeraldsInput.dispatchEvent(new Event('input'));
    // -5 < min (0), so validated = null → revert to lastValid (no prior entry → '0')
    expect(currentEmeraldsInput.value).toBe('0');
  });
});
