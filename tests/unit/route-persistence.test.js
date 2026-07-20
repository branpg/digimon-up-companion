/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for route persistence (Bug 1.8):
 * - handleModuleSelect updates window.location.hash
 * - initApp reads hash and loads the correct module
 * - Fallback to default module when hash is empty or invalid
 */

const mockModules = [
  { id: 'memory-helper', name: 'modules.memoryHelper.name', icon: '🎴', path: 'modules/memory-helper', default: true },
  { id: 'passive-calc', name: 'modules.passiveCalc.name', icon: '💎', path: 'modules/passive-calc' },
];

vi.mock('../../public/js/registry.js', () => ({
  loadRegistry: vi.fn(),
}));

vi.mock('../../public/js/i18n.js', () => ({
  initI18n: vi.fn(() => Promise.resolve('en')),
  t: vi.fn((key) => key),
  setLocale: vi.fn(),
  getCurrentLocale: vi.fn(() => 'en'),
}));

vi.mock('../../public/js/router.js', () => ({
  loadModule: vi.fn(),
}));

/**
 * Helper that imports app.js fresh (triggers DOMContentLoaded listener registration)
 * and then dispatches the event to trigger initApp().
 * Waits for the async initApp() to complete by flushing microtasks.
 */
async function triggerAppInit() {
  // Import app.js — registers DOMContentLoaded listener
  await import('../../public/js/app.js');

  // Dispatch DOMContentLoaded to invoke initApp
  document.dispatchEvent(new Event('DOMContentLoaded'));

  // Flush all microtasks/promises so initApp() completes
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

describe('Route Persistence', () => {
  let loadRegistry;
  let loadModule;

  beforeEach(async () => {
    vi.resetModules();

    // Re-import mocks after resetModules
    const registryMod = await import('../../public/js/registry.js');
    const routerMod = await import('../../public/js/router.js');
    loadRegistry = registryMod.loadRegistry;
    loadModule = routerMod.loadModule;

    loadRegistry.mockResolvedValue(mockModules);

    // Set up minimal DOM for app.js
    document.body.innerHTML = `
      <nav class="sidebar-nav"></nav>
      <select id="lang-select">
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    `;

    // Clear hash
    window.location.hash = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    window.location.hash = '';
  });

  describe('handleModuleSelect updates window.location.hash', () => {
    it('sets hash to module id when a module is selected via sidebar click', async () => {
      await triggerAppInit();

      // Click the passive-calc button
      const btn = document.querySelector('[data-module-id="passive-calc"]');
      expect(btn).not.toBeNull();
      btn.click();

      expect(window.location.hash).toBe('#passive-calc');
    });

    it('updates hash when switching between modules', async () => {
      await triggerAppInit();

      // Click passive-calc
      const calcBtn = document.querySelector('[data-module-id="passive-calc"]');
      calcBtn.click();
      expect(window.location.hash).toBe('#passive-calc');

      // Click memory-helper
      const memBtn = document.querySelector('[data-module-id="memory-helper"]');
      memBtn.click();
      expect(window.location.hash).toBe('#memory-helper');
    });
  });

  describe('initApp reads hash and loads the correct module', () => {
    it('loads the module matching the URL hash on init', async () => {
      window.location.hash = '#passive-calc';

      await triggerAppInit();

      expect(loadModule).toHaveBeenCalledWith('passive-calc', mockModules[1]);
    });

    it('marks the hash-matched module as active in the sidebar', async () => {
      window.location.hash = '#passive-calc';

      await triggerAppInit();

      const btn = document.querySelector('[data-module-id="passive-calc"]');
      expect(btn.classList.contains('active')).toBe(true);
    });
  });

  describe('fallback to default module when hash is empty or invalid', () => {
    it('loads the default module when hash is empty', async () => {
      window.location.hash = '';

      await triggerAppInit();

      // memory-helper is the default module
      expect(loadModule).toHaveBeenCalledWith('memory-helper', mockModules[0]);
    });

    it('loads the default module when hash contains an invalid module id', async () => {
      window.location.hash = '#nonexistent-module';

      await triggerAppInit();

      // Should fall back to the default module
      expect(loadModule).toHaveBeenCalledWith('memory-helper', mockModules[0]);
    });

    it('loads the first module when no default is marked and hash is invalid', async () => {
      // Override with modules that have no default
      const noDefaultModules = [
        { id: 'mod-a', name: 'Module A', icon: '🅰️', path: 'modules/mod-a' },
        { id: 'mod-b', name: 'Module B', icon: '🅱️', path: 'modules/mod-b' },
      ];
      loadRegistry.mockResolvedValue(noDefaultModules);

      window.location.hash = '#nonexistent';

      await triggerAppInit();

      // Falls back to first module
      expect(loadModule).toHaveBeenCalledWith('mod-a', noDefaultModules[0]);
    });
  });
});
