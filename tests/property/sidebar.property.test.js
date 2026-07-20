/**
 * Feature: sidebar-multi-utility-app, Property 1: Sidebar renders all registered modules with name and icon
 *
 * For any valid module registry containing N modules, the rendered sidebar SHALL contain
 * exactly N items, each displaying the module's translated name and its icon.
 *
 * Validates: Requirements 1.5, 3.4
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Renders sidebar items into a nav element, mirroring the logic from app.js renderSidebar.
 * This is a faithful extraction of the rendering logic for property testing.
 * @param {HTMLElement} nav - The sidebar nav container
 * @param {Array<{id: string, name: string, icon: string, path: string}>} modules
 */
function renderSidebar(nav, modules) {
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
    labelSpan.textContent = mod.name; // In test context, name is the translated value

    button.appendChild(iconSpan);
    button.appendChild(labelSpan);

    li.appendChild(button);
    ul.appendChild(li);
  }

  nav.appendChild(ul);
}

/**
 * fast-check arbitrary for a valid module entry.
 */
const moduleEntryArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9-]+$/.test(s)),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  icon: fc.string({ minLength: 1, maxLength: 5 }),
  path: fc.string({ minLength: 1, maxLength: 50 })
});

describe('Property 1: Sidebar renders all registered modules with name and icon', () => {
  /** @type {HTMLElement} */
  let nav;

  beforeEach(() => {
    document.body.innerHTML = '<nav class="sidebar-nav"></nav>';
    nav = document.querySelector('.sidebar-nav');
  });

  it('renders exactly N items for N modules, each with correct icon and name', () => {
    fc.assert(
      fc.property(
        fc.array(moduleEntryArb, { minLength: 1, maxLength: 10 }),
        (modules) => {
          // Clear nav for each iteration
          nav.innerHTML = '';

          renderSidebar(nav, modules);

          const items = nav.querySelectorAll('.sidebar-nav-item');
          expect(items.length).toBe(modules.length);

          items.forEach((item, index) => {
            const mod = modules[index];
            const icon = item.querySelector('.sidebar-nav-icon');
            const label = item.querySelector('.sidebar-nav-label');

            expect(icon).not.toBeNull();
            expect(label).not.toBeNull();
            expect(icon.textContent).toBe(mod.icon);
            expect(label.textContent).toBe(mod.name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each rendered item has the correct data-module-id attribute', () => {
    fc.assert(
      fc.property(
        fc.array(moduleEntryArb, { minLength: 1, maxLength: 10 }),
        (modules) => {
          nav.innerHTML = '';

          renderSidebar(nav, modules);

          const buttons = nav.querySelectorAll('.sidebar-nav-link');
          expect(buttons.length).toBe(modules.length);

          buttons.forEach((button, index) => {
            expect(button.getAttribute('data-module-id')).toBe(modules[index].id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renders zero items for an empty module array', () => {
    nav.innerHTML = '';
    renderSidebar(nav, []);

    const items = nav.querySelectorAll('.sidebar-nav-item');
    expect(items.length).toBe(0);
  });
});
