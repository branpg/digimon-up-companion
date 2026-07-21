/**
 * Memory Game Helper Module
 * 
 * Manages a 4x6 grid where each cell can be assigned one of 12 Digimon.
 * Supports undo, clear (with confirmation), and fullscreen mode.
 * 
 * Module interface: init(container), destroy(), getState(), setState(state)
 */

import { t } from '/js/i18n.js';

const DIGIMON_DATA = [
  { id: "guilmon", name: "Guilmon", color: "#4a7abf", abbr: "GUI" },
  { id: "veemon", name: "Veemon", color: "#d4b800", abbr: "VEE" },
  { id: "renamon", name: "Renamon", color: "#5c2d91", abbr: "REN" },
  { id: "hawkmon", name: "Hawkmon", color: "#8b6914", abbr: "HAW" },
  { id: "wormmon", name: "Wormmon", color: "#d4760a", abbr: "WOR" },
  { id: "gomamon", name: "Gomamon", color: "#c94b7a", abbr: "GOM" },
  { id: "patamon", name: "Patamon", color: "#7b2d8b", abbr: "PAT" },
  { id: "terriermon", name: "Terriermon", color: "#8b8b2d", abbr: "TER" },
  { id: "agumon", name: "Agumon", color: "#1e90d4", abbr: "AGU" },
  { id: "gabumon", name: "Gabumon", color: "#7b2d8b", abbr: "GAB" },
  { id: "salamon", name: "Salamon", color: "#2255bb", abbr: "SAL" },
  { id: "biyomon", name: "Biyomon", color: "#2ecc40", abbr: "BIY" }
];

const GRID_SIZE = 24;

/** @type {(number|null)[]} */
let gridState = new Array(GRID_SIZE).fill(null);

/** @type {number[]} */
let history = [];

/** @type {boolean} */
let isFullscreen = false;

/** @type {HTMLElement|null} */
let containerEl = null;

/**
 * Initialize the Memory Helper module in the given container.
 * @param {HTMLElement} container - The DOM container element
 */
export function init(container) {
  containerEl = container;
  bindEvents();
  renderGrid();
}

/**
 * Cleanup when the module is unloaded.
 */
export function destroy() {
  // Exit fullscreen if active
  if (isFullscreen) {
    const modContainer = containerEl && containerEl.querySelector('.mod-memory-container');
    if (modContainer) {
      modContainer.classList.remove('mod-memory-fullscreen');
    }
    isFullscreen = false;
  }
  containerEl = null;
}

/**
 * Returns the current state of the module for persistence.
 * @returns {{ gridState: (number|null)[], history: number[] }}
 */
export function getState() {
  return {
    gridState: [...gridState],
    history: [...history]
  };
}

/**
 * Restores a previously saved state.
 * @param {{ gridState: (number|null)[], history: number[] }} state
 */
export function setState(state) {
  if (state && Array.isArray(state.gridState) && Array.isArray(state.history)) {
    gridState = [...state.gridState];
    history = [...state.history];
    renderGrid();
  }
}

/**
 * Bind event listeners to the control buttons.
 */
function bindEvents() {
  if (!containerEl) return;

  const undoBtn = containerEl.querySelector('#mod-memory-undo-btn');
  const clearBtn = containerEl.querySelector('#mod-memory-clear-btn');
  const fullscreenBtn = containerEl.querySelector('#mod-memory-fullscreen-btn');

  if (undoBtn) {
    undoBtn.addEventListener('click', deselectLast);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAll);
  }
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }
}

/**
 * Counts how many times each Digimon has been placed on the grid.
 * @returns {number[]} Array of length DIGIMON_DATA.length with usage counts.
 */
function getDigimonUsageCount() {
  const counts = new Array(DIGIMON_DATA.length).fill(0);
  for (let i = 0; i < GRID_SIZE; i++) {
    if (gridState[i] !== null) {
      counts[gridState[i]]++;
    }
  }
  return counts;
}

/**
 * Renders the 4x6 grid based on the current gridState.
 */
function renderGrid() {
  if (!containerEl) return;

  const gridEl = containerEl.querySelector('#mod-memory-grid');
  if (!gridEl) return;

  gridEl.innerHTML = '';

  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'mod-memory-cell' + (gridState[i] !== null ? ' mod-memory-cell-filled' : '');

    // Cell number
    const num = document.createElement('span');
    num.className = 'mod-memory-cell-number';
    num.textContent = String(i + 1);
    cell.appendChild(num);

    if (gridState[i] !== null) {
      const idx = gridState[i];
      const digimon = DIGIMON_DATA[idx];
      cell.style.background = digimon.color;

      const selected = document.createElement('div');
      selected.className = 'mod-memory-selected';
      selected.title = digimon.name;
      selected.addEventListener('click', () => clearCell(i));

      const img = document.createElement('img');
      img.src = `/assets/img/digimon/${digimon.id}.png`;
      img.alt = digimon.name;
      img.onerror = function () {
        this.style.display = 'none';
        const fb = document.createElement('span');
        fb.className = 'mod-memory-fallback-big';
        fb.textContent = digimon.name;
        selected.appendChild(fb);
      };
      selected.appendChild(img);
      cell.appendChild(selected);
    } else {
      const selector = document.createElement('div');
      selector.className = 'mod-memory-selector';

      // Count how many times each Digimon has been used
      const usageCount = getDigimonUsageCount();

      DIGIMON_DATA.forEach((d, di) => {
        const mini = document.createElement('div');
        const isExhausted = usageCount[di] >= 2;
        mini.className = 'mod-memory-mini-item' + (isExhausted ? ' mod-memory-mini-exhausted' : '');
        mini.style.background = d.color;
        mini.title = isExhausted ? `${d.name} (×2)` : d.name;

        if (!isExhausted) {
          mini.addEventListener('click', () => selectCell(i, di));
        }

        const img = document.createElement('img');
        img.src = `/assets/img/digimon/${d.id}.png`;
        img.alt = d.name;
        img.onerror = function () {
          this.style.display = 'none';
          const fb = document.createElement('span');
          fb.className = 'mod-memory-mini-fallback';
          fb.textContent = d.abbr;
          mini.appendChild(fb);
        };
        mini.appendChild(img);
        selector.appendChild(mini);
      });

      cell.appendChild(selector);
    }

    gridEl.appendChild(cell);
  }
}

/**
 * Select a Digimon for a cell.
 * @param {number} cellIndex
 * @param {number} digimonIndex
 */
function selectCell(cellIndex, digimonIndex) {
  gridState[cellIndex] = digimonIndex;
  history.push(cellIndex);
  renderGrid();
}

/**
 * Clear a specific cell (click on selected Digimon image).
 * @param {number} cellIndex
 */
function clearCell(cellIndex) {
  gridState[cellIndex] = null;
  renderGrid();
}

/**
 * Undo the last selection.
 */
function deselectLast() {
  if (history.length > 0) {
    const last = history.pop();
    gridState[last] = null;
    renderGrid();
  }
}

/**
 * Clear all cells with confirmation.
 */
function clearAll() {
  const message = t('modules.memoryHelper.confirmClear') || '¿Limpiar todo el tablero?';
  if (confirm(message)) {
    gridState = new Array(GRID_SIZE).fill(null);
    history = [];
    renderGrid();
  }
}

/**
 * Toggle fullscreen mode.
 */
function toggleFullscreen() {
  if (!containerEl) return;

  const modContainer = containerEl.querySelector('.mod-memory-container');
  if (!modContainer) return;

  isFullscreen = !isFullscreen;
  modContainer.classList.toggle('mod-memory-fullscreen', isFullscreen);

  const btn = containerEl.querySelector('#mod-memory-fullscreen-btn');
  if (btn) {
    const textSpan = btn.querySelector('[data-i18n]');
    if (textSpan) {
      // Update the i18n key for proper translation support
      if (isFullscreen) {
        textSpan.setAttribute('data-i18n', 'modules.memoryHelper.exitFullscreen');
        textSpan.textContent = 'Exit';
      } else {
        textSpan.setAttribute('data-i18n', 'modules.memoryHelper.fullscreen');
        textSpan.textContent = 'Fullscreen';
      }
    }
  }
}
