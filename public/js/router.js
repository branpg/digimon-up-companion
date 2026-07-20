/**
 * Module Router
 * Handles dynamic loading of modules into the content area,
 * including state preservation across module switches.
 */

import { updateDOM } from './i18n.js';

/**
 * State preserved in memory for each module that has been loaded.
 * @type {Map<string, { html: string, state: any }>}
 */
const moduleStates = new Map();

/**
 * Currently active module ID.
 * @type {string|null}
 */
let currentModuleId = null;

/**
 * Reference to the current module's JS interface (init, destroy, getState, setState).
 * @type {{ init?: Function, destroy?: Function, getState?: Function, setState?: Function }|null}
 */
let currentModuleInstance = null;

/**
 * Returns the ID of the currently active module.
 * @returns {string|null}
 */
export function getCurrentModuleId() {
  return currentModuleId;
}

/**
 * Saves the current module's state (HTML + module-reported state) into moduleStates.
 * Uses the module's getState() API if available.
 */
export function saveCurrentModuleState() {
  if (!currentModuleId) {
    return;
  }

  const contentArea = document.getElementById('content-area');
  const savedHtml = contentArea ? contentArea.innerHTML : '';
  let savedState = null;

  if (currentModuleInstance && typeof currentModuleInstance.getState === 'function') {
    try {
      savedState = currentModuleInstance.getState();
    } catch (err) {
      console.warn(`router: failed to get state from module "${currentModuleId}"`, err);
    }
  }

  moduleStates.set(currentModuleId, { html: savedHtml, state: savedState });
}

/**
 * Restores a previously saved state for a module.
 * Calls the module's setState() API if available and state was saved.
 * @param {string} moduleId
 */
export function restoreModuleState(moduleId) {
  const saved = moduleStates.get(moduleId);
  if (!saved || saved.state == null) {
    return;
  }

  if (currentModuleInstance && typeof currentModuleInstance.setState === 'function') {
    try {
      currentModuleInstance.setState(saved.state);
    } catch (err) {
      console.warn(`router: failed to restore state for module "${moduleId}"`, err);
    }
  }
}

/**
 * Loads a module into the content area.
 * Steps:
 * 1. Save state of current module
 * 2. Destroy current module
 * 3. Fetch module HTML
 * 4. Inject module CSS (as <link>)
 * 5. Execute module JS (dynamic import)
 * 6. Call init(container) on the new module
 * 7. Restore state if module was previously loaded
 *
 * @param {string} moduleId - Identifier of the module to load
 * @param {{ id: string, name: string, icon: string, path: string }} config - Module configuration
 * @returns {Promise<void>}
 */
export async function loadModule(moduleId, config) {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) {
    console.error('router: content-area element not found');
    return;
  }

  // Save current module state before switching
  saveCurrentModuleState();

  // Destroy current module
  if (currentModuleInstance && typeof currentModuleInstance.destroy === 'function') {
    try {
      currentModuleInstance.destroy();
    } catch (err) {
      console.warn(`router: error destroying module "${currentModuleId}"`, err);
    }
  }

  try {
    // Fetch module HTML
    const htmlPath = `/${config.path}/${moduleId}.html`;
    const htmlResponse = await fetch(htmlPath);
    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch module HTML: ${htmlResponse.status}`);
    }
    const htmlContent = await htmlResponse.text();

    // Set content area HTML
    contentArea.innerHTML = htmlContent;

    // Translate the newly injected content
    updateDOM(contentArea);

    // Inject module CSS (remove previous module's CSS link first)
    const existingLink = document.getElementById('module-css-link');
    if (existingLink) {
      existingLink.remove();
    }

    const cssPath = `/${config.path}/${moduleId}.css`;
    const link = document.createElement('link');
    link.id = 'module-css-link';
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);

    // Dynamic import of module JS
    const jsPath = `/${config.path}/${moduleId}.js`;
    const moduleJS = await import(jsPath);

    currentModuleInstance = moduleJS;
    currentModuleId = moduleId;

    // Call init on the new module
    if (typeof moduleJS.init === 'function') {
      moduleJS.init(contentArea);
    }

    // Restore state if module was previously loaded
    if (moduleStates.has(moduleId)) {
      restoreModuleState(moduleId);
    }
  } catch (err) {
    console.error(`router: failed to load module "${moduleId}"`, err);
    // Show localized error message in content area, keep sidebar functional
    contentArea.innerHTML = `<div class="module-error" data-i18n="errors.loadFailed">Error loading module</div>`;
    currentModuleId = null;
    currentModuleInstance = null;
  }
}
