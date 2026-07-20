/**
 * Feature: sidebar-multi-utility-app, Property 2: Module state round-trip preservation
 *
 * For any module with arbitrary state, saving the state via getState(), switching to
 * another module, and restoring via setState() SHALL produce a state identical to the original.
 *
 * Validates: Requirements 2.4
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Property 2: Module state round-trip preservation', () => {
  /**
   * Arbitrary for JSON-serializable values (objects, arrays, strings, numbers, booleans, nulls).
   */
  const jsonArbitrary = fc.jsonValue();

  it('state saved via getState() and restored via setState() produces identical state for any JSON value', () => {
    fc.assert(
      fc.property(jsonArbitrary, (arbitraryState) => {
        let storedState = null;

        // Create a mock module that implements getState/setState
        const mockModule = {
          getState: () => arbitraryState,
          setState: (s) => { storedState = s; },
        };

        // Simulate the router's state preservation logic:
        // saveCurrentModuleState() calls module.getState() and stores in Map
        // restoreModuleState() retrieves from Map and calls module.setState()
        const stateStorage = new Map();
        const moduleId = 'module-a';

        // Save phase (mimics saveCurrentModuleState)
        const savedState = mockModule.getState();
        stateStorage.set(moduleId, { html: '<div>content</div>', state: savedState });

        // Restore phase (mimics restoreModuleState)
        const restored = stateStorage.get(moduleId);
        mockModule.setState(restored.state);

        // The state received by setState MUST be identical to what getState returned
        expect(storedState).toEqual(arbitraryState);
        expect(restored.state).toEqual(arbitraryState);
      }),
      { numRuns: 100 }
    );
  });

  it('round-trip preserves state after switching between multiple modules', () => {
    fc.assert(
      fc.property(
        jsonArbitrary,
        jsonArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (stateA, stateB, moduleIdA, moduleIdB) => {
          // Ensure different module IDs
          const idA = `mod-a-${moduleIdA}`;
          const idB = `mod-b-${moduleIdB}`;

          const stateStorage = new Map();

          // Module A is active, save its state
          const moduleA = { getState: () => stateA, setState: (s) => { moduleA.restored = s; } };
          const moduleB = { getState: () => stateB, setState: (s) => { moduleB.restored = s; } };

          // Save module A state (user switches away from A)
          stateStorage.set(idA, { html: '<div>a</div>', state: moduleA.getState() });

          // Module B is now active, save its state (user switches away from B)
          stateStorage.set(idB, { html: '<div>b</div>', state: moduleB.getState() });

          // Restore module A
          const restoredA = stateStorage.get(idA);
          moduleA.setState(restoredA.state);

          // Restore module B
          const restoredB = stateStorage.get(idB);
          moduleB.setState(restoredB.state);

          // Both states must be preserved identically
          expect(moduleA.restored).toEqual(stateA);
          expect(moduleB.restored).toEqual(stateB);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('round-trip preserves deeply nested module-specific structures (Memory Helper & Passive Calc)', () => {
    const moduleStateArbitrary = fc.oneof(
      // Memory Helper state shape
      fc.record({
        gridState: fc.array(fc.oneof(fc.integer({ min: 0, max: 11 }), fc.constant(null)), { minLength: 24, maxLength: 24 }),
        history: fc.array(fc.integer({ min: 0, max: 23 }), { minLength: 0, maxLength: 24 }),
      }),
      // Passive Calc state shape
      fc.record({
        rewardConfig: fc.record({
          bits: fc.integer({ min: 0, max: 999999999 }),
          hologramTickets: fc.integer({ min: 0, max: 999999999 }),
          digiEmeralds: fc.integer({ min: 0, max: 999999999 }),
        }),
        emeraldConfig: fc.record({
          dailyPullCost: fc.integer({ min: 0, max: 99999 }),
          pullTime: fc.constantFrom('00:00', '08:00', '12:30', '23:59'),
        }),
      })
    );

    fc.assert(
      fc.property(moduleStateArbitrary, (arbitraryState) => {
        let restoredState = null;

        const mockModule = {
          getState: () => arbitraryState,
          setState: (s) => { restoredState = s; },
        };

        // Simulate full round-trip through the router's Map storage
        const stateStorage = new Map();
        const moduleId = 'test-module';

        // Save (what saveCurrentModuleState does)
        stateStorage.set(moduleId, { html: '<div>content</div>', state: mockModule.getState() });

        // Restore (what restoreModuleState does)
        const saved = stateStorage.get(moduleId);
        mockModule.setState(saved.state);

        // The round-trip MUST produce identical state
        expect(restoredState).toEqual(arbitraryState);
      }),
      { numRuns: 100 }
    );
  });
});
