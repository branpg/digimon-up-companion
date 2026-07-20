/**
 * Feature: sidebar-multi-utility-app, Property 10: Wait time calculation correctness
 * Feature: sidebar-multi-utility-app, Property 11: Maximum wait time across multiple resources
 *
 * Property 10: For any target T > 0 and rate R > 0, calculateWaitTime(T, R) returns
 * {days, hours, minutes} where totalMinutes = days*1440 + hours*60 + minutes,
 * totalMinutes = ceil(T/R)*5, minutes is a multiple of 5, 0 ≤ hours < 24, 0 ≤ minutes < 60.
 *
 * Property 11: For any non-empty list of (target, rate) pairs where all rates > 0,
 * calculateMaxWaitTime(resources) equals the maximum of calculateWaitTime(target, rate) individually.
 *
 * Validates: Requirements 9.2, 9.3, 9.4
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateWaitTime, calculateMaxWaitTime } from '../../public/modules/passive-calc/passive-calc.js';

describe('Property 10: Wait time calculation correctness', () => {
  it('totalMinutes decomposes correctly into days, hours, minutes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999999 }),
        fc.integer({ min: 1, max: 999999999 }),
        (target, rate) => {
          const result = calculateWaitTime(target, rate);
          expect(result).not.toBeNull();

          const { days, hours, minutes } = result;
          const totalMinutes = days * 1440 + hours * 60 + minutes;
          const expectedTotal = Math.ceil(target / rate) * 5;

          // totalMinutes = days*1440 + hours*60 + minutes equals ceil(T/R)*5
          expect(totalMinutes).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('minutes is always a multiple of 5', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999999 }),
        fc.integer({ min: 1, max: 999999999 }),
        (target, rate) => {
          const result = calculateWaitTime(target, rate);
          expect(result).not.toBeNull();

          const { minutes } = result;
          expect(minutes % 5).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hours is in range [0, 24) and minutes is in range [0, 60)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999999 }),
        fc.integer({ min: 1, max: 999999999 }),
        (target, rate) => {
          const result = calculateWaitTime(target, rate);
          expect(result).not.toBeNull();

          const { hours, minutes } = result;
          expect(hours).toBeGreaterThanOrEqual(0);
          expect(hours).toBeLessThan(24);
          expect(minutes).toBeGreaterThanOrEqual(0);
          expect(minutes).toBeLessThan(60);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 11: Maximum wait time across multiple resources', () => {
  it('calculateMaxWaitTime equals the maximum of individual calculateWaitTime results', () => {
    const resourceArbitrary = fc.record({
      target: fc.integer({ min: 1, max: 999999999 }),
      rate: fc.integer({ min: 1, max: 999999999 }),
    });

    fc.assert(
      fc.property(
        fc.array(resourceArbitrary, { minLength: 1, maxLength: 5 }),
        (resources) => {
          const maxResult = calculateMaxWaitTime(resources);
          expect(maxResult).not.toBeNull();

          // Compute expected max by calculating each individually
          let expectedMaxMinutes = 0;
          for (const { target, rate } of resources) {
            const individual = calculateWaitTime(target, rate);
            const individualMinutes = individual.days * 1440 + individual.hours * 60 + individual.minutes;
            if (individualMinutes > expectedMaxMinutes) {
              expectedMaxMinutes = individualMinutes;
            }
          }

          const actualMaxMinutes = maxResult.days * 1440 + maxResult.hours * 60 + maxResult.minutes;
          expect(actualMaxMinutes).toBe(expectedMaxMinutes);
        }
      ),
      { numRuns: 100 }
    );
  });
});
