/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SUPPORTED_LOCALES, t, setLocale, initI18n, getCurrentLocale } from '../../public/js/i18n.js';

describe('SUPPORTED_LOCALES', () => {
  it('contains exactly 6 locales', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(6);
  });

  it('contains en, es, it, pt, de, ja', () => {
    const codes = SUPPORTED_LOCALES.map(l => l.code);
    expect(codes).toEqual(['en', 'es', 'it', 'pt', 'de', 'ja']);
  });

  it('has nativeName for each locale', () => {
    const nativeNames = SUPPORTED_LOCALES.map(l => l.nativeName);
    expect(nativeNames).toEqual(['English', 'Español', 'Italiano', 'Português', 'Deutsch', '日本語']);
  });

  it('each entry has code, name, and nativeName fields', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(locale).toHaveProperty('code');
      expect(locale).toHaveProperty('name');
      expect(locale).toHaveProperty('nativeName');
      expect(typeof locale.code).toBe('string');
      expect(typeof locale.name).toBe('string');
      expect(typeof locale.nativeName).toBe('string');
    }
  });
});

describe('t(key)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the key itself when no translations are loaded', async () => {
    // Load empty translations
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ));
    await setLocale('en');

    expect(t('some.missing.key')).toBe('some.missing.key');
  });

  it('returns a top-level translation value', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ greeting: 'Hello' }) })
    ));
    await setLocale('en');

    expect(t('greeting')).toBe('Hello');
  });

  it('traverses nested objects with dot notation', async () => {
    const translations = {
      modules: {
        memoryHelper: {
          name: 'Memory Helper'
        }
      }
    };
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(translations) })
    ));
    await setLocale('en');

    expect(t('modules.memoryHelper.name')).toBe('Memory Helper');
  });

  it('returns the key if intermediate path does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ app: { title: 'DigiMemory' } }) })
    ));
    await setLocale('en');

    expect(t('app.nonexistent.deep')).toBe('app.nonexistent.deep');
  });

  it('returns the key if value is not a string (e.g. an object)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ modules: { helper: {} } }) })
    ));
    await setLocale('en');

    expect(t('modules.helper')).toBe('modules.helper');
  });

  it('returns empty string for null/undefined key', async () => {
    expect(t(null)).toBe('');
    expect(t(undefined)).toBe('');
  });

  it('returns the key for empty string input', async () => {
    expect(t('')).toBe('');
  });
});

describe('setLocale(locale)', () => {
  let mockStorage;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, val) => { mockStorage[key] = val; }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; })
    });

    // Minimal DOM setup
    document.documentElement.setAttribute('lang', 'en');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the locale JSON file and updates translations', async () => {
    const translations = { app: { title: 'Hola' } };
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(translations) })
    ));

    await setLocale('es');
    expect(fetch).toHaveBeenCalledWith('/locales/es.json');
    expect(t('app.title')).toBe('Hola');
  });

  it('persists locale to localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ));

    await setLocale('de');
    expect(localStorage.setItem).toHaveBeenCalledWith('digimemory-locale', 'de');
  });

  it('updates the html lang attribute', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ));

    await setLocale('ja');
    expect(document.documentElement.getAttribute('lang')).toBe('ja');
  });

  it('falls back to English if locale fetch fails', async () => {
    const enTranslations = { app: { title: 'English Title' } };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/locales/es.json') {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(enTranslations) });
    }));

    await setLocale('es');
    expect(getCurrentLocale()).toBe('en');
    expect(t('app.title')).toBe('English Title');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('falls back to en for unsupported locale code', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ key: 'val' }) })
    ));

    await setLocale('xx');
    expect(fetch).toHaveBeenCalledWith('/locales/en.json');
    expect(getCurrentLocale()).toBe('en');
  });

  it('updates data-i18n elements in the DOM', async () => {
    const el = document.createElement('span');
    el.setAttribute('data-i18n', 'sidebar.title');
    document.body.appendChild(el);

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ sidebar: { title: 'Utilidades' } }) })
    ));

    await setLocale('es');
    expect(el.textContent).toBe('Utilidades');

    document.body.removeChild(el);
  });

  it('updates data-i18n-placeholder elements in the DOM', async () => {
    const input = document.createElement('input');
    input.setAttribute('data-i18n-placeholder', 'search.placeholder');
    document.body.appendChild(input);

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ search: { placeholder: 'Buscar...' } }) })
    ));

    await setLocale('es');
    expect(input.placeholder).toBe('Buscar...');

    document.body.removeChild(input);
  });

  it('handles localStorage being unavailable gracefully', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => { throw new Error('SecurityError'); }),
      setItem: vi.fn(() => { throw new Error('SecurityError'); }),
      removeItem: vi.fn(() => { throw new Error('SecurityError'); })
    });

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ key: 'value' }) })
    ));

    // Should not throw
    await expect(setLocale('it')).resolves.toBeUndefined();
    expect(getCurrentLocale()).toBe('it');
  });
});

describe('initI18n()', () => {
  let mockStorage;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, val) => { mockStorage[key] = val; }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; })
    });

    document.documentElement.setAttribute('lang', 'en');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses persisted locale from localStorage if available', async () => {
    mockStorage['digimemory-locale'] = 'de';

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ lang: 'de' }) })
    ));

    const result = await initI18n();
    expect(result).toBe('de');
    expect(fetch).toHaveBeenCalledWith('/locales/de.json');
  });

  it('detects browser language if no stored preference', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      languages: ['it-IT', 'en'],
      language: 'it-IT'
    });

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ));

    const result = await initI18n();
    expect(result).toBe('it');
  });

  it('falls back to English if browser language is not supported', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      languages: ['zh-CN', 'ko'],
      language: 'zh-CN'
    });

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ));

    const result = await initI18n();
    expect(result).toBe('en');
  });

  it('ignores stored locale if it is not supported', async () => {
    mockStorage['digimemory-locale'] = 'xx';

    vi.stubGlobal('navigator', {
      ...navigator,
      languages: ['es'],
      language: 'es'
    });

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ));

    const result = await initI18n();
    expect(result).toBe('es');
  });
});

describe('getCurrentLocale()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the current active locale after setLocale', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ));

    await setLocale('pt');
    expect(getCurrentLocale()).toBe('pt');
  });
});
