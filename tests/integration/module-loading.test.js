/**
 * @vitest-environment jsdom
 *
 * Integration tests for module loading lifecycle.
 * Tests full load/unload cycle with state preservation, error handling,
 * and sidebar resilience after errors.
 *
 * Validates: Requirements 1.7, 2.4, 3.5
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ─── Shared helpers ──────────────────────────────────────────────────────────

/**
 * Creates a fresh DOM environment with a content-area element and a
 * simulated sidebar button, then stubs document globals on `globalThis`.
 * Returns handles to the content-area and the module-css-link tracker.
 */
function setupDOM() {
  const contentArea = document.createElement('div');
  contentArea.id = 'content-area';
  document.body.appendChild(contentArea);

  return { contentArea };
}

function teardownDOM() {
  document.body.innerHTML = '';
}

/**
 * Creates a minimal mock module instance that implements the full module API.
 * `initSpy`, `destroySpy`, `getStateSpy`, `setStateSpy` are vi.fn() instances
 * you can inspect.
 */
function createMockModule(initialState = { value: 'initial' }) {
  let state = { ...initialState };

  const instance = {
    init: vi.fn((_container) => {}),
    destroy: vi.fn(() => {}),
    getState: vi.fn(() => ({ ...state })),
    setState: vi.fn((s) => { state = { ...s }; }),
  };

  return instance;
}

// ─── Suite 1: Full load/unload cycle with state preservation ─────────────────

describe('Integration: full load/unload cycle with state preservation', () => {
  let router;
  let moduleA;
  let moduleB;

  beforeEach(async () => {
    vi.resetModules();
    setupDOM();

    // Module A: a mock module that will be "dynamically imported" for moduleA
    moduleA = createMockModule({ data: 'module-a-state', counter: 42 });
    // Module B: a second mock module
    moduleB = createMockModule({ data: 'module-b-state', counter: 0 });

    // Mock fetch so HTML loads succeed for both modules
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url.includes('module-a') || url.includes('module-b')) {
        return { ok: true, status: 200, text: async () => '<div>module content</div>' };
      }
      return { ok: false, status: 404 };
    }));

    // Mock dynamic import: intercept import() calls by path
    // We stub globalThis.__importModule which the router doesn't use directly,
    // so instead we use vi.doMock on each known JS path before loading the router.
    // Since the router calls: await import(`/${config.path}/${moduleId}.js`)
    // We mock those virtual paths.
    vi.doMock('/modules/module-a/module-a.js', () => moduleA);
    vi.doMock('/modules/module-b/module-b.js', () => moduleB);

    router = await import('../../public/js/router.js');
  });

  afterEach(() => {
    teardownDOM();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('calls init on the newly loaded module', async () => {
    const configA = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };

    await router.loadModule('module-a', configA);

    expect(moduleA.init).toHaveBeenCalledTimes(1);
    expect(router.getCurrentModuleId()).toBe('module-a');
  });

  it('calls destroy on the current module when loading a new one', async () => {
    const configA = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };
    const configB = { id: 'module-b', name: 'Module B', icon: '🅱️', path: 'modules/module-b' };

    // Load module A first
    await router.loadModule('module-a', configA);
    expect(router.getCurrentModuleId()).toBe('module-a');

    // Load module B — should destroy module A
    await router.loadModule('module-b', configB);

    expect(moduleA.destroy).toHaveBeenCalledTimes(1);
    expect(moduleB.init).toHaveBeenCalledTimes(1);
    expect(router.getCurrentModuleId()).toBe('module-b');
  });

  it('saves module A state before switching to module B', async () => {
    const configA = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };
    const configB = { id: 'module-b', name: 'Module B', icon: '🅱️', path: 'modules/module-b' };

    // Override getState to return a specific state
    const specificState = { data: 'important-data', counter: 99 };
    moduleA.getState.mockReturnValue(specificState);

    await router.loadModule('module-a', configA);
    await router.loadModule('module-b', configB);

    // getState should have been called when switching away from A
    expect(moduleA.getState).toHaveBeenCalled();
  });

  it('restores module A state when switching back after visiting module B', async () => {
    const configA = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };
    const configB = { id: 'module-b', name: 'Module B', icon: '🅱️', path: 'modules/module-b' };

    const savedState = { data: 'persisted-data', counter: 77 };
    moduleA.getState.mockReturnValue(savedState);

    // Load A, then B, then A again
    await router.loadModule('module-a', configA);
    await router.loadModule('module-b', configB);
    await router.loadModule('module-a', configA);

    // setState on module A should have been called with the previously saved state
    expect(moduleA.setState).toHaveBeenCalledWith(savedState);
  });

  it('does not call setState on first load of a module (no prior state)', async () => {
    const configA = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };

    await router.loadModule('module-a', configA);

    // First load: setState should NOT be called because there is no saved state
    expect(moduleA.setState).not.toHaveBeenCalled();
  });

  it('preserves distinct states for multiple modules independently', async () => {
    const configA = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };
    const configB = { id: 'module-b', name: 'Module B', icon: '🅱️', path: 'modules/module-b' };

    const stateA = { data: 'state-of-A', counter: 10 };
    const stateB = { data: 'state-of-B', counter: 20 };
    moduleA.getState.mockReturnValue(stateA);
    moduleB.getState.mockReturnValue(stateB);

    // A → B → A (B's state should also be saved and A restored)
    await router.loadModule('module-a', configA);
    await router.loadModule('module-b', configB);
    await router.loadModule('module-a', configA);

    // When switching back to A, setState is called with A's saved state
    expect(moduleA.setState).toHaveBeenCalledWith(stateA);
    // B's state was saved (getState called when leaving B)
    expect(moduleB.getState).toHaveBeenCalled();
  });
});

// ─── Suite 2: Error handling when module path doesn't exist ──────────────────

describe('Integration: error handling when module path does not exist', () => {
  let router;

  beforeEach(async () => {
    vi.resetModules();
    setupDOM();

    // Fetch returns 404 for any module HTML
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })));

    router = await import('../../public/js/router.js');
  });

  afterEach(() => {
    teardownDOM();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows an error message in the content area when module HTML fetch returns 404', async () => {
    const config = { id: 'nonexistent', name: 'Ghost Module', icon: '👻', path: 'modules/nonexistent' };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await router.loadModule('nonexistent', config);
    consoleSpy.mockRestore();

    const contentArea = document.getElementById('content-area');
    expect(contentArea.innerHTML).toContain('data-i18n="errors.loadFailed"');
  });

  it('shows the fallback error text in the content area', async () => {
    const config = { id: 'nonexistent', name: 'Ghost Module', icon: '👻', path: 'modules/nonexistent' };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await router.loadModule('nonexistent', config);
    consoleSpy.mockRestore();

    const contentArea = document.getElementById('content-area');
    expect(contentArea.innerHTML).toContain('Error loading module');
  });

  it('sets currentModuleId to null after a 404 fetch error', async () => {
    const config = { id: 'nonexistent', name: 'Ghost Module', icon: '👻', path: 'modules/nonexistent' };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await router.loadModule('nonexistent', config);
    consoleSpy.mockRestore();

    expect(router.getCurrentModuleId()).toBe(null);
  });

  it('sets currentModuleId to null after a network error (fetch throws)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('Network failure');
    }));

    const config = { id: 'broken', name: 'Broken Module', icon: '💥', path: 'modules/broken' };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await router.loadModule('broken', config);
    consoleSpy.mockRestore();

    expect(router.getCurrentModuleId()).toBe(null);
  });

  it('shows error message in content area after a network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('Network failure');
    }));

    const config = { id: 'broken', name: 'Broken Module', icon: '💥', path: 'modules/broken' };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await router.loadModule('broken', config);
    consoleSpy.mockRestore();

    const contentArea = document.getElementById('content-area');
    expect(contentArea.innerHTML).toContain('module-error');
  });
});

// ─── Suite 3: Sidebar remains functional after module load error ──────────────

describe('Integration: sidebar remains functional after module load error', () => {
  let router;
  let moduleA;

  beforeEach(async () => {
    vi.resetModules();
    setupDOM();

    moduleA = createMockModule({ data: 'ok' });

    // fetch: first call fails (simulates bad module), subsequent calls succeed for module-a
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url.includes('bad-module')) {
        return { ok: false, status: 404 };
      }
      if (url.includes('module-a')) {
        return { ok: true, status: 200, text: async () => '<div>module-a content</div>' };
      }
      return { ok: false, status: 404 };
    }));

    vi.doMock('/modules/module-a/module-a.js', () => moduleA);

    router = await import('../../public/js/router.js');
  });

  afterEach(() => {
    teardownDOM();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('router does not throw after a failed module load', async () => {
    const badConfig = { id: 'bad-module', name: 'Bad Module', icon: '❌', path: 'modules/bad-module' };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(router.loadModule('bad-module', badConfig)).resolves.toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('can successfully load a valid module after a previous load error', async () => {
    const badConfig = { id: 'bad-module', name: 'Bad Module', icon: '❌', path: 'modules/bad-module' };
    const goodConfig = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // First load fails
    await router.loadModule('bad-module', badConfig);
    expect(router.getCurrentModuleId()).toBe(null);

    consoleSpy.mockRestore();

    // Second load (valid module) should succeed
    await router.loadModule('module-a', goodConfig);
    expect(router.getCurrentModuleId()).toBe('module-a');
    expect(moduleA.init).toHaveBeenCalledTimes(1);
  });

  it('content area shows a valid module after recovering from an error', async () => {
    const badConfig = { id: 'bad-module', name: 'Bad Module', icon: '❌', path: 'modules/bad-module' };
    const goodConfig = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await router.loadModule('bad-module', badConfig);
    consoleSpy.mockRestore();

    const contentArea = document.getElementById('content-area');
    expect(contentArea.innerHTML).toContain('module-error');

    // Now load a working module
    await router.loadModule('module-a', goodConfig);

    // Error message should be gone; module content is now rendered
    expect(contentArea.innerHTML).toContain('module-a content');
    expect(contentArea.innerHTML).not.toContain('module-error');
  });

  it('multiple consecutive load errors do not crash the router', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    for (let i = 0; i < 3; i++) {
      const config = { id: 'bad-module', name: 'Bad', icon: '❌', path: 'modules/bad-module' };
      await expect(router.loadModule('bad-module', config)).resolves.toBeUndefined();
      expect(router.getCurrentModuleId()).toBe(null);
    }

    consoleSpy.mockRestore();
  });

  it('successfully loads a module and getCurrentModuleId reflects correct state after errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Error → Error → Success sequence
    const badConfig = { id: 'bad-module', name: 'Bad', icon: '❌', path: 'modules/bad-module' };
    await router.loadModule('bad-module', badConfig);
    await router.loadModule('bad-module', badConfig);

    consoleSpy.mockRestore();

    const goodConfig = { id: 'module-a', name: 'Module A', icon: '🅰️', path: 'modules/module-a' };
    await router.loadModule('module-a', goodConfig);

    expect(router.getCurrentModuleId()).toBe('module-a');
  });
});
