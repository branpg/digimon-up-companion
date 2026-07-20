/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Language select (#lang-select) integration with app.js', () => {
  let mockStorage;

  beforeEach(() => {
    vi.resetModules();

    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, val) => { mockStorage[key] = val; }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
    });

    // Stub fetch for locale loading and registry
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/config/modules.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ modules: [] }),
        });
      }
      // Locale files
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ app: { title: 'Digimon Up Companion' } }),
      });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    document.documentElement.setAttribute('lang', 'en');
  });

  describe('change event listener calls setLocale()', () => {
    it('triggers setLocale with the selected locale code when change event fires', async () => {
      // Set up minimal DOM with #lang-select
      document.body.innerHTML = `
        <select id="lang-select">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ja">日本語</option>
        </select>
      `;

      // Mock window.location.hash
      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      // Import app.js which registers the listener during initApp
      const i18n = await import('../../public/js/i18n.js');
      const setLocaleSpy = vi.spyOn(i18n, 'setLocale');

      // Dynamically import app.js — initApp runs on DOMContentLoaded
      await import('../../public/js/app.js');

      // Trigger DOMContentLoaded to run initApp
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // Wait for async initApp to complete
      await vi.waitFor(() => {
        const langSelect = document.querySelector('#lang-select');
        // initApp sets the value to getCurrentLocale(); verify listener is attached
        return langSelect !== null;
      });

      // Allow initApp's async operations to settle
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Reset spy call count (setLocale is called during initI18n)
      setLocaleSpy.mockClear();

      // Simulate user changing the dropdown to 'es'
      const langSelect = document.querySelector('#lang-select');
      langSelect.value = 'es';
      langSelect.dispatchEvent(new Event('change'));

      // Wait for the async setLocale call to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(setLocaleSpy).toHaveBeenCalledWith('es');
    });

    it('triggers setLocale with "ja" when dropdown is changed to Japanese', async () => {
      document.body.innerHTML = `
        <select id="lang-select">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ja">日本語</option>
        </select>
      `;

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      const i18n = await import('../../public/js/i18n.js');
      const setLocaleSpy = vi.spyOn(i18n, 'setLocale');

      await import('../../public/js/app.js');

      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));
      setLocaleSpy.mockClear();

      const langSelect = document.querySelector('#lang-select');
      langSelect.value = 'ja';
      langSelect.dispatchEvent(new Event('change'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(setLocaleSpy).toHaveBeenCalledWith('ja');
    });
  });

  describe('#lang-select reflects detected/persisted locale on init', () => {
    it('sets dropdown value to getCurrentLocale() after initI18n', async () => {
      // Persist 'de' in storage so initI18n picks it up
      mockStorage['digimemory-locale'] = 'de';

      document.body.innerHTML = `
        <select id="lang-select">
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="es">Español</option>
        </select>
      `;

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      await import('../../public/js/app.js');

      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const langSelect = document.querySelector('#lang-select');
      expect(langSelect.value).toBe('de');
    });

    it('sets dropdown value to browser-detected locale when no stored preference', async () => {
      vi.stubGlobal('navigator', {
        ...navigator,
        languages: ['it-IT', 'en'],
        language: 'it-IT',
      });

      document.body.innerHTML = `
        <select id="lang-select">
          <option value="en">English</option>
          <option value="it">Italiano</option>
          <option value="es">Español</option>
        </select>
      `;

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      await import('../../public/js/app.js');

      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const langSelect = document.querySelector('#lang-select');
      expect(langSelect.value).toBe('it');
    });
  });
});
