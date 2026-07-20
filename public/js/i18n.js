/**
 * i18n Manager
 * Handles internationalization: locale detection, translation loading,
 * DOM updates, and persistence.
 */

/**
 * Supported locales with metadata.
 */
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' }
];

const STORAGE_KEY = 'digimemory-locale';

/** Current translations object (nested JSON structure). */
let translations = {};

/** Current active locale code. */
let currentLocale = 'en';

/**
 * Checks if localStorage is available and writable.
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__i18n_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Reads the persisted locale from localStorage.
 * @returns {string|null} The stored locale code, or null if unavailable.
 */
function getStoredLocale() {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Persists the locale code to localStorage. Fails silently if unavailable.
 * @param {string} locale
 */
function persistLocale(locale) {
  if (!isLocalStorageAvailable()) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch (e) {
    // Silently ignore — session-only operation
  }
}

/**
 * Detects the best matching locale from the browser's language settings.
 * @returns {string} A supported locale code, or 'en' as fallback.
 */
function detectBrowserLocale() {
  const supportedCodes = SUPPORTED_LOCALES.map(l => l.code);

  // Try navigator.languages first, then navigator.language
  const candidates = navigator.languages
    ? [...navigator.languages]
    : [navigator.language || ''];

  for (const candidate of candidates) {
    // Exact match (e.g. "es")
    const lower = candidate.toLowerCase();
    if (supportedCodes.includes(lower)) {
      return lower;
    }
    // Prefix match (e.g. "es-MX" → "es")
    const prefix = lower.split('-')[0];
    if (supportedCodes.includes(prefix)) {
      return prefix;
    }
  }

  return 'en';
}

/**
 * Fetches a locale JSON file from the server.
 * @param {string} locale - Locale code (e.g. 'en', 'es')
 * @returns {Promise<object|null>} Parsed translations object, or null on failure.
 */
async function fetchLocaleFile(locale) {
  try {
    const response = await fetch(`/locales/${locale}.json`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (e) {
    return null;
  }
}

/**
 * Updates all DOM elements that have a `data-i18n` attribute,
 * setting their textContent to the translated value.
 * Also handles `data-i18n-placeholder` attributes for placeholder text.
 * @param {HTMLElement|Document} [root=document] - Root element to search within
 */
export function updateDOM(root) {
  const scope = root || document;
  // Update textContent for data-i18n elements
  const elements = scope.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  }

  // Update placeholder for data-i18n-placeholder elements
  const placeholderElements = scope.querySelectorAll('[data-i18n-placeholder]');
  for (const el of placeholderElements) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.placeholder = t(key);
    }
  }
}

/**
 * Returns the current active locale code.
 * @returns {string}
 */
export function getCurrentLocale() {
  return currentLocale;
}

/**
 * Retrieves the translation for a dot-notation key.
 * Traverses nested objects: "modules.memoryHelper.name" →
 * translations["modules"]["memoryHelper"]["name"]
 *
 * @param {string} key - Dot-notation translation key
 * @returns {string} Translated text, or the key itself if not found
 */
export function t(key) {
  if (!key || typeof key !== 'string') {
    return key || '';
  }

  const parts = key.split('.');
  let current = translations;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return key;
    }
    current = current[part];
  }

  if (typeof current === 'string') {
    return current;
  }

  return key;
}

/**
 * Sets the active locale, fetching translations and updating the UI.
 *
 * 1. Fetches /locales/{locale}.json
 * 2. Parses JSON into current translations object
 * 3. Updates all [data-i18n] elements with translated text
 * 4. Updates all [data-i18n-placeholder] elements
 * 5. Persists locale code to localStorage
 * 6. Updates <html lang> attribute
 *
 * If fetch fails and locale != 'en', falls back to English.
 *
 * @param {string} locale - Locale code to activate
 * @returns {Promise<void>}
 */
export async function setLocale(locale) {
  const supportedCodes = SUPPORTED_LOCALES.map(l => l.code);

  // Validate the locale is supported
  if (!supportedCodes.includes(locale)) {
    locale = 'en';
  }

  let data = await fetchLocaleFile(locale);

  // If fetch fails and it's not English, try English as fallback
  if (!data && locale !== 'en') {
    console.warn(`i18n: Failed to load locale "${locale}", falling back to English`);
    data = await fetchLocaleFile('en');
    locale = 'en';
  }

  // If even English fails, keep current translations (or empty)
  if (data) {
    translations = data;
    currentLocale = locale;
  }

  // Update HTML lang attribute
  document.documentElement.setAttribute('lang', currentLocale);

  // Update all translated elements in the DOM
  updateDOM();

  // Persist the chosen locale
  persistLocale(currentLocale);
}

/**
 * Initializes the i18n system:
 * 1. Checks localStorage for a persisted locale preference
 * 2. If not found, detects the browser language
 * 3. If browser language is not supported, defaults to 'en'
 * 4. Loads the determined locale
 *
 * @returns {Promise<string>} The active locale code after initialization
 */
export async function initI18n() {
  // 1. Check for persisted preference
  const stored = getStoredLocale();
  const supportedCodes = SUPPORTED_LOCALES.map(l => l.code);

  let locale;

  if (stored && supportedCodes.includes(stored)) {
    locale = stored;
  } else {
    // 2. Detect browser language
    locale = detectBrowserLocale();
  }

  // 3. Load the locale
  await setLocale(locale);

  return currentLocale;
}
