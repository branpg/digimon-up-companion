/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the i18n module before importing changelog
vi.mock('/js/i18n.js', () => ({
  t: (key) => key
}));

describe('Changelog Module', () => {
  let changelog;
  let container;

  beforeEach(async () => {
    vi.resetModules();

    // Re-mock after resetModules
    vi.mock('/js/i18n.js', () => ({
      t: (key) => key
    }));

    // Create container matching changelog.html structure
    container = document.createElement('div');
    container.innerHTML = `
      <div class="mod-changelog-container">
        <div class="mod-changelog-content" id="mod-changelog-content">
          <p class="mod-changelog-loading" data-i18n="modules.changelog.loading">Loading...</p>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    changelog = await import('../../public/modules/changelog/changelog.js');
  });

  afterEach(() => {
    if (changelog && changelog.destroy) {
      changelog.destroy();
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Fetching and rendering', () => {
    it('fetches /CHANGELOG.md and renders parsed HTML into the content element', async () => {
      const mdContent = '# Changelog\n\n## [1.0.0]\n\n### Added\n\n- First feature\n- Second feature';

      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mdContent)
        })
      ));

      await changelog.init(container);

      expect(fetch).toHaveBeenCalledWith('/CHANGELOG.md');
      const contentEl = container.querySelector('#mod-changelog-content');
      expect(contentEl.innerHTML).not.toContain('Loading...');
      expect(contentEl.innerHTML).toContain('<h1>');
      expect(contentEl.innerHTML).toContain('<li>');
    });

    it('renders version headers (## [1.0.0]) as h2 elements', async () => {
      const mdContent = '## [1.0.0]\n\n- Some change';

      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mdContent)
        })
      ));

      await changelog.init(container);

      const contentEl = container.querySelector('#mod-changelog-content');
      const h2 = contentEl.querySelector('h2');
      expect(h2).not.toBeNull();
      expect(h2.textContent).toContain('[1.0.0]');
    });

    it('renders change categories (### Added) as h3 elements', async () => {
      const mdContent = '### Added\n\n- New feature';

      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mdContent)
        })
      ));

      await changelog.init(container);

      const contentEl = container.querySelector('#mod-changelog-content');
      const h3 = contentEl.querySelector('h3');
      expect(h3).not.toBeNull();
      expect(h3.textContent).toBe('Added');
    });

    it('renders list items (- Item text) as <li> elements', async () => {
      const mdContent = '- First item\n- Second item\n- Third item';

      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mdContent)
        })
      ));

      await changelog.init(container);

      const contentEl = container.querySelector('#mod-changelog-content');
      const items = contentEl.querySelectorAll('li');
      expect(items).toHaveLength(3);
      expect(items[0].textContent).toBe('First item');
      expect(items[1].textContent).toBe('Second item');
      expect(items[2].textContent).toBe('Third item');
    });
  });

  describe('Error handling', () => {
    it('shows an error message when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.reject(new Error('Network error'))
      ));

      await changelog.init(container);

      const contentEl = container.querySelector('#mod-changelog-content');
      const errorEl = contentEl.querySelector('.mod-changelog-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl.textContent).toBe('errors.loadFailed');
    });

    it('shows an error message when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404
        })
      ));

      await changelog.init(container);

      const contentEl = container.querySelector('#mod-changelog-content');
      const errorEl = contentEl.querySelector('.mod-changelog-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl.textContent).toBe('errors.loadFailed');
    });
  });

  describe('getState and setState', () => {
    it('getState() returns null', () => {
      const result = changelog.getState();
      expect(result).toBeNull();
    });

    it('setState() is a no-op (does not throw)', () => {
      expect(() => changelog.setState({ anything: true })).not.toThrow();
      expect(() => changelog.setState(null)).not.toThrow();
    });
  });
});
