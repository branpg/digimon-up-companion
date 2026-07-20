// Feature: sidebar-multi-utility-app, Property 7: i18n translation completeness
// Feature: sidebar-multi-utility-app, Property 8: i18n DOM update consistency
// Validates: Requirements 6.1, 6.6

/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', '..', 'public', 'locales');

const LOCALE_CODES = ['en', 'es', 'it', 'pt', 'de', 'ja'];

/**
 * Load all locale JSON files from disk.
 */
function loadLocales() {
  const locales = {};
  for (const code of LOCALE_CODES) {
    const filePath = path.join(LOCALES_DIR, `${code}.json`);
    const content = fs.readFileSync(filePath, 'utf-8');
    locales[code] = JSON.parse(content);
  }
  return locales;
}

/**
 * Recursively extract all leaf keys (dot-notation) from a nested object.
 * Only string values are considered leaves.
 */
function extractKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Resolve a dot-notation key against a nested object.
 * Returns undefined if not found.
 */
function resolveKey(obj, key) {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

// ─── Property 7: i18n translation completeness ──────────────────────────────
// For any supported locale and for any i18n key used in the application source,
// the locale's translation file SHALL contain a non-empty string value for that key.
// **Validates: Requirements 6.1**
describe('Property 7: i18n translation completeness', () => {
  const locales = loadLocales();
  const masterKeys = extractKeys(locales['en']);
  // Non-English locale codes
  const otherLocaleCodes = LOCALE_CODES.filter(code => code !== 'en');

  it('all locale files contain non-empty string values for every key in en.json', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...otherLocaleCodes),
        fc.constantFrom(...masterKeys),
        (localeCode, key) => {
          const value = resolveKey(locales[localeCode], key);
          // Must exist and be a non-empty string
          expect(value).toBeDefined();
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('English locale itself has non-empty string values for all its keys', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...masterKeys),
        (key) => {
          const value = resolveKey(locales['en'], key);
          expect(value).toBeDefined();
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 8: i18n DOM update consistency ────────────────────────────────
// For any DOM element with a data-i18n attribute and for any target locale,
// after calling setLocale(locale), the element's text content SHALL equal
// the value of translations[locale][key] for its i18n key.
// **Validates: Requirements 6.6**
describe('Property 8: i18n DOM update consistency', () => {
  const locales = loadLocales();
  const masterKeys = extractKeys(locales['en']);

  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock localStorage
    const storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, val) => { storage[key] = val; }),
      removeItem: vi.fn((key) => { delete storage[key]; })
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Clean up any DOM elements we added
    document.body.innerHTML = '';
  });

  it('after setLocale, DOM elements with data-i18n have correct textContent', async () => {
    // Dynamic import so mocks are in place
    const { setLocale } = await import('../../public/js/i18n.js');

    // Mock fetch to return locale data from disk
    vi.stubGlobal('fetch', vi.fn((url) => {
      const match = url.match(/\/locales\/([a-z]{2})\.json/);
      if (match && locales[match[1]]) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(locales[match[1]])
        });
      }
      return Promise.resolve({ ok: false });
    }));

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...LOCALE_CODES),
        fc.constantFrom(...masterKeys),
        async (localeCode, key) => {
          // Create a DOM element with the data-i18n attribute
          const el = document.createElement('span');
          el.setAttribute('data-i18n', key);
          document.body.appendChild(el);

          // Call setLocale
          await setLocale(localeCode);

          // Verify the DOM element's textContent matches the translation
          const expectedValue = resolveKey(locales[localeCode], key);
          expect(el.textContent).toBe(expectedValue);

          // Clean up
          document.body.removeChild(el);
        }
      ),
      { numRuns: 100 }
    );
  });
});
