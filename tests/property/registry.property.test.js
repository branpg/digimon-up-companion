/**
 * Feature: sidebar-multi-utility-app, Property 3: Module registry schema validation
 *
 * For any module entry in the registry, if `name` has length > 50, or `icon` is empty,
 * or `path` is empty/missing, the entry SHALL be rejected as invalid. Conversely, if all
 * fields are present and within constraints, the entry SHALL be accepted as valid.
 *
 * Validates: Requirements 3.4, 3.5
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateModuleEntry } from '../../public/js/registry.js';

describe('Property 3: Module registry schema validation', () => {
  it('valid entries (all fields present, name ≤ 50, icon non-empty, path non-empty, id non-empty) always return true', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          icon: fc.string({ minLength: 1, maxLength: 5 }),
          path: fc.string({ minLength: 1, maxLength: 50 })
        }),
        (entry) => {
          expect(validateModuleEntry(entry)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('entries with name > 50 chars always return false', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          name: fc.string({ minLength: 51, maxLength: 100 }),
          icon: fc.string({ minLength: 1, maxLength: 5 }),
          path: fc.string({ minLength: 1, maxLength: 50 })
        }),
        (entry) => {
          expect(validateModuleEntry(entry)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('entries with empty icon always return false', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          icon: fc.constant(''),
          path: fc.string({ minLength: 1, maxLength: 50 })
        }),
        (entry) => {
          expect(validateModuleEntry(entry)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('entries with empty path always return false', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          icon: fc.string({ minLength: 1, maxLength: 5 }),
          path: fc.constant('')
        }),
        (entry) => {
          expect(validateModuleEntry(entry)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('entries with empty id always return false', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.constant(''),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          icon: fc.string({ minLength: 1, maxLength: 5 }),
          path: fc.string({ minLength: 1, maxLength: 50 })
        }),
        (entry) => {
          expect(validateModuleEntry(entry)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('boundary: name exactly 50 chars is valid, name 51 chars is invalid', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          icon: fc.string({ minLength: 1, maxLength: 5 }),
          path: fc.string({ minLength: 1, maxLength: 50 })
        }),
        (fields) => {
          const validEntry = { ...fields, name: 'x'.repeat(50) };
          const invalidEntry = { ...fields, name: 'x'.repeat(51) };
          expect(validateModuleEntry(validEntry)).toBe(true);
          expect(validateModuleEntry(invalidEntry)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
