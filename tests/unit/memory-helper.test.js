/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the i18n module before importing memory-helper
vi.mock('/js/i18n.js', () => ({
  t: (key) => key
}));

describe('Memory Helper Module', () => {
  let memoryHelper;
  let container;

  beforeEach(async () => {
    vi.resetModules();

    // Re-mock after resetModules
    vi.mock('/js/i18n.js', () => ({
      t: (key) => key
    }));

    // Create a minimal container matching the expected HTML structure
    container = document.createElement('div');
    container.innerHTML = `
      <div class="mod-memory-container">
        <div class="mod-memory-controls">
          <button id="mod-memory-undo-btn">Undo</button>
          <button id="mod-memory-clear-btn">Clear</button>
          <button id="mod-memory-fullscreen-btn">
            <span data-i18n="modules.memoryHelper.fullscreen">Fullscreen</span>
          </button>
        </div>
        <div class="mod-memory-grid" id="mod-memory-grid"></div>
      </div>
    `;
    document.body.appendChild(container);

    memoryHelper = await import('../../public/modules/memory-helper/memory-helper.js');
  });

  afterEach(() => {
    if (memoryHelper && memoryHelper.destroy) {
      memoryHelper.destroy();
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Grid state management', () => {
    it('after init, gridState should be all nulls (24 cells) and history should be empty', () => {
      memoryHelper.init(container);

      const state = memoryHelper.getState();
      expect(state.gridState).toHaveLength(24);
      expect(state.gridState.every(cell => cell === null)).toBe(true);
      expect(state.history).toHaveLength(0);
    });

    it('after selecting a Digimon for a cell, that cell should have the Digimon index', () => {
      memoryHelper.init(container);

      // Simulate clicking on a mini-item (Digimon selector in cell 0, Digimon index 3)
      const grid = container.querySelector('#mod-memory-grid');
      const firstCell = grid.querySelectorAll('.mod-memory-cell')[0];
      const miniItems = firstCell.querySelectorAll('.mod-memory-mini-item');
      miniItems[3].click();

      const state = memoryHelper.getState();
      expect(state.gridState[0]).toBe(3);
      expect(state.history).toEqual([0]);
    });

    it('after undo, the last selected cell should be null again', () => {
      memoryHelper.init(container);

      // Select Digimon 5 in cell 2
      const grid = container.querySelector('#mod-memory-grid');
      let cells = grid.querySelectorAll('.mod-memory-cell');
      cells[2].querySelectorAll('.mod-memory-mini-item')[5].click();

      // Verify selection was made
      let state = memoryHelper.getState();
      expect(state.gridState[2]).toBe(5);

      // Click undo
      const undoBtn = container.querySelector('#mod-memory-undo-btn');
      undoBtn.click();

      state = memoryHelper.getState();
      expect(state.gridState[2]).toBe(null);
      expect(state.history).toHaveLength(0);
    });

    it('after clear with confirm returning true, all cells should be null and history empty', () => {
      memoryHelper.init(container);

      // Select some Digimon
      const grid = container.querySelector('#mod-memory-grid');
      let cells = grid.querySelectorAll('.mod-memory-cell');
      cells[0].querySelectorAll('.mod-memory-mini-item')[0].click();

      // Re-query cells after re-render
      cells = grid.querySelectorAll('.mod-memory-cell');
      cells[1].querySelectorAll('.mod-memory-mini-item')[1].click();

      // Mock confirm to return true
      vi.stubGlobal('confirm', vi.fn(() => true));

      // Click clear
      const clearBtn = container.querySelector('#mod-memory-clear-btn');
      clearBtn.click();

      const state = memoryHelper.getState();
      expect(state.gridState.every(cell => cell === null)).toBe(true);
      expect(state.history).toHaveLength(0);

      vi.unstubAllGlobals();
    });

    it('clear with confirm returning false should NOT clear', () => {
      memoryHelper.init(container);

      // Select a Digimon in cell 0
      const grid = container.querySelector('#mod-memory-grid');
      let cells = grid.querySelectorAll('.mod-memory-cell');
      cells[0].querySelectorAll('.mod-memory-mini-item')[2].click();

      // Mock confirm to return false
      vi.stubGlobal('confirm', vi.fn(() => false));

      // Click clear
      const clearBtn = container.querySelector('#mod-memory-clear-btn');
      clearBtn.click();

      const state = memoryHelper.getState();
      expect(state.gridState[0]).toBe(2);
      expect(state.history).toEqual([0]);

      vi.unstubAllGlobals();
    });
  });

  describe('getState/setState round-trip', () => {
    it('set some grid state manually, call getState(), verify it returns the correct gridState and history', () => {
      memoryHelper.init(container);

      // Select Digimon in multiple cells
      const grid = container.querySelector('#mod-memory-grid');
      let cells = grid.querySelectorAll('.mod-memory-cell');
      cells[0].querySelectorAll('.mod-memory-mini-item')[0].click();

      cells = grid.querySelectorAll('.mod-memory-cell');
      cells[5].querySelectorAll('.mod-memory-mini-item')[7].click();

      cells = grid.querySelectorAll('.mod-memory-cell');
      cells[10].querySelectorAll('.mod-memory-mini-item')[11].click();

      const state = memoryHelper.getState();
      expect(state.gridState[0]).toBe(0);
      expect(state.gridState[5]).toBe(7);
      expect(state.gridState[10]).toBe(11);
      expect(state.history).toEqual([0, 5, 10]);
    });

    it('call setState with a known state, verify getState returns that state', () => {
      memoryHelper.init(container);

      const knownState = {
        gridState: new Array(24).fill(null),
        history: [3, 7, 15]
      };
      knownState.gridState[3] = 1;
      knownState.gridState[7] = 4;
      knownState.gridState[15] = 9;

      memoryHelper.setState(knownState);

      const retrieved = memoryHelper.getState();
      expect(retrieved.gridState).toEqual(knownState.gridState);
      expect(retrieved.history).toEqual(knownState.history);
    });

    it('setState should cause a re-render of the grid', () => {
      memoryHelper.init(container);

      const grid = container.querySelector('#mod-memory-grid');
      const initialHTML = grid.innerHTML;

      const newState = {
        gridState: new Array(24).fill(null),
        history: [0]
      };
      newState.gridState[0] = 6;

      memoryHelper.setState(newState);

      // Grid should have re-rendered (filled cell should now exist)
      expect(grid.innerHTML).not.toBe(initialHTML);
      const filledCells = grid.querySelectorAll('.mod-memory-cell-filled');
      expect(filledCells.length).toBe(1);
    });
  });

  describe('Image fallback behavior', () => {
    it('when an img element fires onerror in large view, the fallback text should appear', () => {
      memoryHelper.init(container);

      // Select a Digimon to create a filled cell (large view)
      const grid = container.querySelector('#mod-memory-grid');
      let cells = grid.querySelectorAll('.mod-memory-cell');
      cells[0].querySelectorAll('.mod-memory-mini-item')[0].click();

      // Find the image in the filled cell
      const filledCell = grid.querySelector('.mod-memory-cell-filled');
      const img = filledCell.querySelector('.mod-memory-selected img');

      // Trigger onerror
      img.onerror.call(img);

      // Check that fallback text appeared with full name
      const fallback = filledCell.querySelector('.mod-memory-fallback-big');
      expect(fallback).not.toBeNull();
      expect(fallback.textContent).toBe('Guilmon');
    });

    it('large view fallback should show the full name', () => {
      memoryHelper.init(container);

      // Select Digimon index 4 (Wormmon)
      const grid = container.querySelector('#mod-memory-grid');
      let cells = grid.querySelectorAll('.mod-memory-cell');
      cells[0].querySelectorAll('.mod-memory-mini-item')[4].click();

      const filledCell = grid.querySelector('.mod-memory-cell-filled');
      const img = filledCell.querySelector('.mod-memory-selected img');
      img.onerror.call(img);

      const fallback = filledCell.querySelector('.mod-memory-fallback-big');
      expect(fallback.textContent).toBe('Wormmon');
    });

    it('miniature fallback should show the 3-char abbreviation', () => {
      memoryHelper.init(container);

      // Get a mini-item image from an empty cell and trigger onerror
      const grid = container.querySelector('#mod-memory-grid');
      const emptyCell = grid.querySelectorAll('.mod-memory-cell')[1]; // cell 1 is empty
      const miniItems = emptyCell.querySelectorAll('.mod-memory-mini-item');

      // Trigger onerror on the first mini image (Guilmon -> "GUI")
      const miniImg = miniItems[0].querySelector('img');
      miniImg.onerror.call(miniImg);

      const fallback = miniItems[0].querySelector('.mod-memory-mini-fallback');
      expect(fallback).not.toBeNull();
      expect(fallback.textContent).toBe('GUI');
    });
  });
});
