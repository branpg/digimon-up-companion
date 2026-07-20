import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Module Router', () => {
  let router;
  let contentArea;
  let head;
  let mockModuleCssLink;

  beforeEach(async () => {
    vi.resetModules();

    // Mock content area element
    contentArea = {
      id: 'content-area',
      innerHTML: '',
    };

    // Mock CSS link element
    mockModuleCssLink = null;

    // Mock head element
    head = {
      appendChild: vi.fn((el) => { mockModuleCssLink = el; }),
    };

    // Mock document
    vi.stubGlobal('document', {
      getElementById: vi.fn((id) => {
        if (id === 'content-area') return contentArea;
        if (id === 'module-css-link') return mockModuleCssLink;
        return null;
      }),
      createElement: vi.fn((tag) => {
        return { id: '', rel: '', href: '', remove: vi.fn() };
      }),
      head,
    });

    vi.stubGlobal('fetch', vi.fn());

    router = await import('../../public/js/router.js');
  });

  describe('getCurrentModuleId', () => {
    it('returns null when no module is loaded', () => {
      expect(router.getCurrentModuleId()).toBe(null);
    });
  });

  describe('saveCurrentModuleState', () => {
    it('does nothing when no module is active (no throw)', () => {
      expect(() => router.saveCurrentModuleState()).not.toThrow();
    });
  });

  describe('restoreModuleState', () => {
    it('does nothing when no saved state exists for the module', () => {
      expect(() => router.restoreModuleState('nonexistent')).not.toThrow();
    });
  });

  describe('loadModule', () => {
    it('shows error message in content area when HTML fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const config = { id: 'test-mod', name: 'Test', icon: '🧪', path: 'modules/test-mod' };
      await router.loadModule('test-mod', config);

      expect(contentArea.innerHTML).toContain('data-i18n="errors.loadFailed"');
      expect(contentArea.innerHTML).toContain('Error loading module');
    });

    it('sets currentModuleId to null after load error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const config = { id: 'test-mod', name: 'Test', icon: '🧪', path: 'modules/test-mod' };
      await router.loadModule('test-mod', config);

      expect(router.getCurrentModuleId()).toBe(null);
    });

    it('does not crash when content-area is missing', async () => {
      document.getElementById = vi.fn(() => null);

      const config = { id: 'test-mod', name: 'Test', icon: '🧪', path: 'modules/test-mod' };
      await expect(router.loadModule('test-mod', config)).resolves.toBeUndefined();
    });

    it('handles network error gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const config = { id: 'broken-mod', name: 'Broken', icon: '💥', path: 'modules/broken' };

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await router.loadModule('broken-mod', config);

      expect(contentArea.innerHTML).toContain('errors.loadFailed');
      expect(router.getCurrentModuleId()).toBe(null);
      errorSpy.mockRestore();
    });

    it('fetches HTML from correct path based on config', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const config = { id: 'my-module', name: 'My Module', icon: '📦', path: 'modules/my-module' };

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await router.loadModule('my-module', config);

      expect(global.fetch).toHaveBeenCalledWith('/modules/my-module/my-module.html');
      errorSpy.mockRestore();
    });
  });

  describe('exports', () => {
    it('exports loadModule function', () => {
      expect(typeof router.loadModule).toBe('function');
    });

    it('exports saveCurrentModuleState function', () => {
      expect(typeof router.saveCurrentModuleState).toBe('function');
    });

    it('exports restoreModuleState function', () => {
      expect(typeof router.restoreModuleState).toBe('function');
    });

    it('exports getCurrentModuleId function', () => {
      expect(typeof router.getCurrentModuleId).toBe('function');
    });
  });
});
