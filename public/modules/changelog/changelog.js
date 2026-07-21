/**
 * Changelog Module
 *
 * Fetches /CHANGELOG.md from the server, parses basic Markdown into HTML,
 * and renders it into the module container.
 *
 * Module interface: init(container), destroy(), getState(), setState(state)
 */

import { t, getCurrentLocale } from '/js/i18n.js';

/** @type {HTMLElement|null} */
let containerEl = null;

/**
 * Convert a simple subset of Markdown to HTML.
 * Supports: # H1, ## H2, ### H3, - list items, **bold**, [text](url), paragraph breaks.
 * @param {string} md - Raw Markdown text
 * @returns {string} HTML string
 */
function parseMarkdown(md) {
  const lines = md.split('\n');
  const htmlParts = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Close list if current line is not a list item
    if (inList && !line.startsWith('- ')) {
      htmlParts.push('</ul>');
      inList = false;
    }

    // Headings
    if (line.startsWith('### ')) {
      htmlParts.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      htmlParts.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      htmlParts.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    }
    // List items
    else if (line.startsWith('- ')) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      htmlParts.push(`<li>${inlineFormat(line.slice(2))}</li>`);
    }
    // Empty line = paragraph break
    else if (line.trim() === '') {
      // skip empty lines (they separate blocks)
    }
    // Regular text
    else {
      htmlParts.push(`<p>${inlineFormat(line)}</p>`);
    }
  }

  // Close any open list
  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

/**
 * Handle inline formatting: **bold** and [text](url)
 * @param {string} text
 * @returns {string}
 */
function inlineFormat(text) {
  // Escape HTML entities
  let result = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  return result;
}

/**
 * Initialize the Changelog module in the given container.
 * @param {HTMLElement} container - The DOM container element
 */
export async function init(container) {
  containerEl = container;
  const contentEl = container.querySelector('#mod-changelog-content');
  if (!contentEl) return;

  try {
    const locale = getCurrentLocale();
    const response = await fetch(`/changelogs/${locale}.md`);
    if (!response.ok) {
      // Fallback to English if locale-specific changelog not found
      const fallback = await fetch('/changelogs/en.md');
      if (!fallback.ok) throw new Error(`HTTP ${fallback.status}`);
      const md = await fallback.text();
      contentEl.innerHTML = parseMarkdown(md);
      return;
    }
    const md = await response.text();
    contentEl.innerHTML = parseMarkdown(md);
  } catch (err) {
    contentEl.innerHTML = `<p class="mod-changelog-error">${t('errors.loadFailed')}</p>`;
  }
}

/**
 * Cleanup when the module is unloaded.
 */
export function destroy() {
  containerEl = null;
}

/**
 * Get current module state (no meaningful state for changelog).
 * @returns {null}
 */
export function getState() {
  return null;
}

/**
 * Restore module state (no-op for changelog).
 * @param {*} _state
 */
export function setState(_state) {
  // no-op
}
