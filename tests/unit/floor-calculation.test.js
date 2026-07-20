/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateFloorRewards,
  init,
  destroy,
  getState
} from '../../public/modules/passive-calc/passive-calc.js';

describe('calculateFloorRewards', () => {
  it('floor=0 → Bits=75, Tickets=1, DigiEmeralds=1', () => {
    expect(calculateFloorRewards(0)).toEqual({ bits: 75, hologramTickets: 1, digiEmeralds: 1 });
  });

  it('floor=20 → Bits=100, Tickets=2, DigiEmeralds=2', () => {
    expect(calculateFloorRewards(20)).toEqual({ bits: 100, hologramTickets: 2, digiEmeralds: 2 });
  });

  it('floor=40 → Bits=125, Tickets=3, DigiEmeralds=3', () => {
    expect(calculateFloorRewards(40)).toEqual({ bits: 125, hologramTickets: 3, digiEmeralds: 3 });
  });

  it('floor=19 → Bits=75, Tickets=1, DigiEmeralds=1 (just below threshold)', () => {
    expect(calculateFloorRewards(19)).toEqual({ bits: 75, hologramTickets: 1, digiEmeralds: 1 });
  });

  it('floor=100 → Bits=200, Tickets=6, DigiEmeralds=6', () => {
    expect(calculateFloorRewards(100)).toEqual({ bits: 200, hologramTickets: 6, digiEmeralds: 6 });
  });
});

describe('Floor input DOM behavior', () => {
  let container;
  let localStorageMock;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <input type="number" id="mod-calc-floor" value="0">
      <input type="number" id="mod-calc-bits" value="0">
      <input type="number" id="mod-calc-hologram-tickets" value="0">
      <input type="number" id="mod-calc-digi-emeralds" value="0">
      <input type="number" id="mod-calc-daily-pull-cost" value="5700">
      <input type="time" id="mod-calc-pull-time" value="08:00">
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

  it('changing floor input auto-updates Bits and Hologram Tickets fields', () => {
    init(container);

    const floorInput = container.querySelector('#mod-calc-floor');
    const bitsInput = container.querySelector('#mod-calc-bits');
    const hologramInput = container.querySelector('#mod-calc-hologram-tickets');

    // Change floor to 40
    floorInput.value = '40';
    floorInput.dispatchEvent(new Event('input'));

    // Bits = (floor(40/20) + 3) * 25 = (2+3)*25 = 125
    expect(bitsInput.value).toBe('125');
    // Hologram Tickets = 1 + floor(40/20) = 1+2 = 3
    expect(hologramInput.value).toBe('3');
  });

  it('manually editing Bits after floor calculation is preserved until next floor change', () => {
    init(container);

    const floorInput = container.querySelector('#mod-calc-floor');
    const bitsInput = container.querySelector('#mod-calc-bits');

    // Set floor to 20 → Bits auto-calculates to 100
    floorInput.value = '20';
    floorInput.dispatchEvent(new Event('input'));
    expect(bitsInput.value).toBe('100');

    // Manually override Bits to 999
    bitsInput.value = '999';
    bitsInput.dispatchEvent(new Event('input'));
    expect(bitsInput.value).toBe('999');

    // Verify the override is in the state
    const state = getState();
    expect(state.rewardConfig.bits).toBe(999);

    // Next floor change overwrites the manual edit
    floorInput.value = '40';
    floorInput.dispatchEvent(new Event('input'));
    expect(bitsInput.value).toBe('125');
  });

  it('DigiEmeralds is auto-calculated from floor changes', () => {
    init(container);

    const floorInput = container.querySelector('#mod-calc-floor');
    const emeraldsInput = container.querySelector('#mod-calc-digi-emeralds');

    // Change floor to 60 → DigiEmeralds = 1 + floor(60/20) = 4
    floorInput.value = '60';
    floorInput.dispatchEvent(new Event('input'));

    expect(emeraldsInput.value).toBe('4');
    expect(getState().rewardConfig.digiEmeralds).toBe(4);
  });
});
