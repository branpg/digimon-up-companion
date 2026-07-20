/**
 * App Shell Initialization
 * Main entry point that ties together registry, i18n, router, and responsive behavior.
 */

import { loadRegistry } from './registry.js';
import { initI18n, t, setLocale, getCurrentLocale, updateDOM } from './i18n.js';
import { loadModule } from './router.js';

/**
 * Renders the sidebar navigation with registered modules.
 * @param {import('./registry.js').ModuleEntry[]} modules - List of valid modules
 */
function renderSidebar(modules) {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  const ul = document.createElement('ul');
  ul.className = 'sidebar-nav-list';

  for (const mod of modules) {
    const li = document.createElement('li');
    li.className = 'sidebar-nav-item';

    const button = document.createElement('button');
    button.className = 'sidebar-nav-link';
    button.setAttribute('data-module-id', mod.id);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'sidebar-nav-icon';
    iconSpan.textContent = mod.icon;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'sidebar-nav-label';
    labelSpan.setAttribute('data-i18n', mod.name);
    labelSpan.textContent = t(mod.name);

    button.appendChild(iconSpan);
    button.appendChild(labelSpan);

    button.addEventListener('click', () => {
      handleModuleSelect(mod, button);
    });

    li.appendChild(button);
    ul.appendChild(li);
  }

  nav.appendChild(ul);
}

/**
 * Handles module selection from the sidebar.
 * @param {import('./registry.js').ModuleEntry} mod - The module entry
 * @param {HTMLButtonElement} button - The clicked button element
 */
function handleModuleSelect(mod, button) {
  // Update active state
  const allLinks = document.querySelectorAll('.sidebar-nav-link');
  for (const link of allLinks) {
    link.classList.remove('active');
  }
  button.classList.add('active');

  // Load the module
  loadModule(mod.id, mod);

  // Persist active module to URL hash
  window.location.hash = '#' + mod.id;

  // Auto-close sidebar on mobile
  if (window.innerWidth < 768) {
    closeSidebar();
  }
}

/**
 * Closes the sidebar (mobile overlay state).
 */
function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.querySelector('.hamburger-btn');
  const backdrop = document.querySelector('.sidebar-backdrop');

  if (sidebar) sidebar.classList.remove('is-open');
  if (hamburger) hamburger.classList.remove('is-active');
  if (backdrop) backdrop.classList.remove('is-visible');
}

/**
 * Opens the sidebar (mobile overlay state).
 */
function openSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.querySelector('.hamburger-btn');
  const backdrop = document.querySelector('.sidebar-backdrop');

  if (sidebar) sidebar.classList.add('is-open');
  if (hamburger) hamburger.classList.add('is-active');
  if (backdrop) backdrop.classList.add('is-visible');
}

/**
 * Manages responsive sidebar behavior:
 * - Hamburger toggle
 * - Backdrop click to close
 * - Auto-close on module selection in mobile
 * - Viewport resize handling
 */
function initResponsive() {
  const hamburger = document.querySelector('.hamburger-btn');
  const backdrop = document.querySelector('.sidebar-backdrop');

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && sidebar.classList.contains('is-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  // Backdrop click to close
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeSidebar();
    });
  }

  // On resize crossing 768px: remove mobile classes
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      closeSidebar();
    }
  });
}

/**
 * Initializes the application:
 * - Loads the module registry
 * - Initializes i18n
 * - Renders the sidebar
 * - Loads the default module
 */
async function initApp() {
  const modules = await loadRegistry();
  await initI18n();

  // Sync lang-select dropdown with detected/persisted locale
  const langSelect = document.querySelector('#lang-select');
  if (langSelect) {
    langSelect.value = getCurrentLocale();
    langSelect.addEventListener('change', (event) => {
      setLocale(event.target.value);
    });
  }

  renderSidebar(modules);
  initResponsive();

  // Check URL hash for a previously active module
  const hash = window.location.hash.slice(1); // remove '#'
  const hashModule = hash ? modules.find(m => m.id === hash) : null;
  const moduleToLoad = hashModule || modules.find(m => m.default === true) || modules[0];

  if (moduleToLoad) {
    loadModule(moduleToLoad.id, moduleToLoad);
    const btn = document.querySelector(`.sidebar-nav-link[data-module-id="${moduleToLoad.id}"]`);
    if (btn) btn.classList.add('active');
  }
}

// Run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
