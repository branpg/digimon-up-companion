/**
 * Module Registry Reader
 * Fetches and validates the module registry from /config/modules.json
 */

/**
 * @typedef {object} ModuleEntry
 * @property {string} id - Unique identifier (kebab-case)
 * @property {string} name - i18n key for the name (max 50 chars)
 * @property {string} icon - Emoji or icon reference
 * @property {string} path - Relative path to the module directory
 * @property {boolean} [default] - Whether this is the default module
 */

/**
 * Validates a single module entry.
 * @param {object} entry - Raw entry from modules.json
 * @returns {boolean} Whether the entry is valid
 */
export function validateModuleEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  if (typeof entry.id !== 'string' || entry.id.length === 0) {
    return false;
  }

  if (typeof entry.name !== 'string' || entry.name.length === 0 || entry.name.length > 50) {
    return false;
  }

  if (typeof entry.icon !== 'string' || entry.icon.length === 0) {
    return false;
  }

  if (typeof entry.path !== 'string' || entry.path.length === 0) {
    return false;
  }

  return true;
}

/**
 * Fetches and validates the module registry.
 * @returns {Promise<ModuleEntry[]>} Array of valid module entries
 */
export async function loadRegistry() {
  try {
    const response = await fetch('/config/modules.json');
    if (!response.ok) {
      console.error(`Failed to fetch module registry: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    const modules = data.modules;

    if (!Array.isArray(modules)) {
      console.error('Module registry: "modules" field is not an array');
      return [];
    }

    const validModules = [];

    for (let i = 0; i < modules.length; i++) {
      const entry = modules[i];
      if (validateModuleEntry(entry)) {
        validModules.push(entry);
      } else {
        const identifier = (entry && entry.id) ? entry.id : `index ${i}`;
        console.warn(`Module registry: skipping invalid entry "${identifier}" — missing or invalid required fields`);
      }
    }

    return validModules;
  } catch (error) {
    console.error('Failed to load module registry:', error);
    return [];
  }
}
