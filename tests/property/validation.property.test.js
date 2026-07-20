/**
 * Property-Based Tests: Numeric Input Field Validation
 *
 * Feature: sidebar-multi-utility-app, Property 9: Numeric input field validation
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.7, 9.1
 *
 * Property 9: For any numeric input field with configured range [min, max] and
 * for any integer value v: if min ≤ v ≤ max, the field SHALL accept the value;
 * if v < min or v > max or v is non-numeric, the field SHALL reject the input
 * and retain the previous valid value.
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { validateNumericInput } from '../../public/modules/passive-calc/passive-calc.js';

// ─── Range Constants ──────────────────────────────────────────────────────────

const REWARD_MIN = 0;
const REWARD_MAX = 999999999;
const EMERALD_MIN = 0;
const EMERALD_MAX = 99999;

// ─── Property 9: In-range values are accepted ─────────────────────────────────

describe('Property 9: Numeric input field validation', () => {
  /**
   * In-range values are accepted (reward config range [0, 999999999])
   * Validates: Requirements 8.1, 8.2
   */
  it('accepts any integer v in reward range [0, 999999999]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: REWARD_MIN, max: REWARD_MAX }),
        (v) => {
          const result = validateNumericInput(String(v), REWARD_MIN, REWARD_MAX);
          return result === v;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * In-range values are accepted (emerald config range [0, 99999])
   * Validates: Requirements 8.1, 8.2
   */
  it('accepts any integer v in emerald range [0, 99999]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: EMERALD_MIN, max: EMERALD_MAX }),
        (v) => {
          const result = validateNumericInput(String(v), EMERALD_MIN, EMERALD_MAX);
          return result === v;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Above-range values are rejected
   * Validates: Requirements 8.3
   */
  it('rejects any integer v > 999999999 (above reward max)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: REWARD_MAX + 1, max: 2000000000 }),
        (v) => {
          const result = validateNumericInput(String(v), REWARD_MIN, REWARD_MAX);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Above-range values are rejected for emerald range
   * Validates: Requirements 8.3
   */
  it('rejects any integer v > 99999 (above emerald max)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: EMERALD_MAX + 1, max: 2000000000 }),
        (v) => {
          const result = validateNumericInput(String(v), EMERALD_MIN, EMERALD_MAX);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Below-range values are rejected (negative integers when min is 0)
   * Validates: Requirements 8.3
   */
  it('rejects any negative integer v < 0 (below reward min)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000000000, max: -1 }),
        (v) => {
          const result = validateNumericInput(String(v), REWARD_MIN, REWARD_MAX);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Below-range values are rejected for emerald range
   * Validates: Requirements 8.3
   */
  it('rejects any negative integer v < 0 (below emerald min)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000000000, max: -1 }),
        (v) => {
          const result = validateNumericInput(String(v), EMERALD_MIN, EMERALD_MAX);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Non-numeric strings are rejected
   * Validates: Requirements 8.7
   */
  it('rejects non-numeric strings for reward range', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !/^-?\d+$/.test(s.trim()) && s.trim() !== ''),
        (s) => {
          const result = validateNumericInput(s, REWARD_MIN, REWARD_MAX);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Non-numeric strings are rejected for emerald range
   * Validates: Requirements 8.7
   */
  it('rejects non-numeric strings for emerald range', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !/^-?\d+$/.test(s.trim()) && s.trim() !== ''),
        (s) => {
          const result = validateNumericInput(s, EMERALD_MIN, EMERALD_MAX);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Boundary values (min and max) are accepted
   * Validates: Requirements 8.1, 8.2, 9.1
   */
  it('accepts boundary values: v = min and v = max for reward range', () => {
    const atMin = validateNumericInput(String(REWARD_MIN), REWARD_MIN, REWARD_MAX);
    const atMax = validateNumericInput(String(REWARD_MAX), REWARD_MIN, REWARD_MAX);

    if (atMin !== REWARD_MIN) throw new Error(`Expected ${REWARD_MIN} but got ${atMin}`);
    if (atMax !== REWARD_MAX) throw new Error(`Expected ${REWARD_MAX} but got ${atMax}`);
  });

  /**
   * Boundary values (min and max) are accepted for emerald range
   * Validates: Requirements 8.1, 8.2, 9.1
   */
  it('accepts boundary values: v = min and v = max for emerald range', () => {
    const atMin = validateNumericInput(String(EMERALD_MIN), EMERALD_MIN, EMERALD_MAX);
    const atMax = validateNumericInput(String(EMERALD_MAX), EMERALD_MIN, EMERALD_MAX);

    if (atMin !== EMERALD_MIN) throw new Error(`Expected ${EMERALD_MIN} but got ${atMin}`);
    if (atMax !== EMERALD_MAX) throw new Error(`Expected ${EMERALD_MAX} but got ${atMax}`);
  });
});
