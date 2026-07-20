# Implementation Plan: Sidebar Multi-Utility App

## Overview

Refactorización de la aplicación monolítica Digimon Memory Helper en una arquitectura multi-utilidad con navegación lateral. Se implementa un servidor Node.js vanilla, un App Shell con sidebar responsive, sistema i18n, módulo Memory Game Helper (extraído del monolito), y módulo Calculador de Ganancia Pasiva (nuevo). El lenguaje de implementación es JavaScript (vanilla, sin frameworks).

## Tasks

- [x] 1. Set up project structure, server, and core configuration
  - [x] 1.1 Create directory structure and package.json
    - Create all directories: `public/`, `public/css/`, `public/js/`, `public/config/`, `public/locales/`, `public/assets/img/digimon/`, `public/modules/memory-helper/`, `public/modules/passive-calc/`, `tests/unit/`, `tests/property/`, `tests/integration/`
    - Create `package.json` with project metadata, `"start": "node server.js"` script, and devDependencies for vitest and fast-check
    - Create `CHANGELOG.md` with initial v1.0.0 entry documenting the refactoring
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 1.2 Implement Node.js static server (`server.js`)
    - Implement `startServer({ root, port })` using only `http` and `fs` modules
    - Implement MIME type mapping for html, css, js, png, svg, webp, json extensions
    - Implement `handleRequest` with: file serving with correct Content-Type, SPA fallback for extensionless paths (serve index.html with 200), 404 for missing files with extension
    - Accept optional CLI arguments for root directory and port (defaults: `./public`, `8080`)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 1.3 Write property tests for server routing logic
    - **Property 4: Server MIME type mapping correctness**
    - **Property 5: Server SPA fallback for extensionless paths**
    - **Property 6: Server 404 for non-existent files with extension**
    - **Validates: Requirements 4.1, 4.4, 4.5**

  - [x] 1.4 Create module registry (`public/config/modules.json`)
    - Define registry with `version: "1.0.0"` and two module entries: `memory-helper` (default: true) and `passive-calc`
    - Each entry includes: id, name (i18n key), icon (emoji), path, default flag
    - _Requirements: 3.3, 3.4_

- [x] 2. Implement App Shell and core infrastructure
  - [x] 2.1 Create App Shell HTML (`public/index.html`)
    - Semantic HTML structure with sidebar container, content area, hamburger menu button, and language selector
    - Include `data-i18n` attributes on all translatable elements
    - Link to `app-shell.css` and load JS modules (`app.js`, `router.js`, `i18n.js`, `registry.js`)
    - Show version number in footer
    - _Requirements: 1.1, 1.2, 1.5, 5.1, 6.5, 11.1_

  - [x] 2.2 Implement App Shell styles (`public/css/app-shell.css`)
    - Fixed sidebar layout on left, content area filling remaining space
    - Active sidebar item highlight styling
    - Responsive breakpoint at 768px: sidebar hidden, hamburger button visible, overlay behavior
    - Sidebar overlay with backdrop, close on outside click
    - Smooth transitions for sidebar show/hide
    - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2, 5.3, 5.5, 5.6_

  - [x] 2.3 Implement module registry reader (`public/js/registry.js`)
    - Fetch and parse `modules.json`
    - Validate each entry: name ≤ 50 chars, icon non-empty, path non-empty
    - Skip invalid entries with console warning, continue loading valid ones
    - Export validated module list
    - _Requirements: 3.4, 3.5_

  - [x] 2.4 Write property test for module registry validation
    - **Property 3: Module registry schema validation**
    - **Validates: Requirements 3.4, 3.5**

  - [x] 2.5 Implement module router (`public/js/router.js`)
    - Implement `moduleStates` Map for preserving module state across switches
    - Implement `loadModule(moduleId, config)`: fetch module HTML, inject scoped CSS, execute module JS
    - Implement `saveCurrentModuleState()` and `restoreModuleState(moduleId)` using module's `getState()`/`setState()` API
    - Handle module load errors: show localized error message, keep sidebar functional
    - _Requirements: 1.3, 1.7, 2.4, 3.1, 3.2_

  - [x] 2.6 Write property test for module state round-trip
    - **Property 2: Module state round-trip preservation**
    - **Validates: Requirements 2.4**

  - [x] 2.7 Implement App Shell initialization (`public/js/app.js`)
    - `initApp()`: load registry, init i18n, render sidebar, load default module
    - `renderSidebar(modules)`: create sidebar items with icon + translated name for each valid module
    - `initResponsive()`: manage hamburger toggle, overlay close behavior, auto-close on selection in mobile, viewport resize handling
    - _Requirements: 1.5, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 3.6_

- [x] 3. Checkpoint - Ensure App Shell renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement i18n system
  - [x] 4.1 Implement i18n manager (`public/js/i18n.js`)
    - Define `SUPPORTED_LOCALES` array with code, name, and nativeName for 6 languages
    - Implement `initI18n()`: check localStorage → detect browser language → fallback to English
    - Implement `setLocale(locale)`: fetch JSON file, update all `[data-i18n]` elements, persist to localStorage
    - Implement `t(key)`: dot-notation key lookup, return key itself if missing
    - Handle localStorage unavailable gracefully (session-only, no error)
    - Handle locale file fetch failure (fall back to English)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 4.2 Create translation files for all 6 locales
    - Create `public/locales/en.json`, `es.json`, `it.json`, `pt.json`, `de.json`, `ja.json`
    - Include all keys: app title/version, sidebar title, module names, memory helper labels, passive calc labels, error messages, language selector label
    - Ensure all keys present in all files with non-empty values
    - _Requirements: 6.1_

  - [x] 4.3 Write property tests for i18n system
    - **Property 7: i18n translation completeness**
    - **Property 8: i18n DOM update consistency**
    - **Validates: Requirements 6.1, 6.6**

- [x] 5. Implement Memory Game Helper module
  - [x] 5.1 Extract Memory Game Helper into module files
    - Create `public/modules/memory-helper/memory-helper.html` with the 4×6 grid layout, Digimon selector, action buttons (undo, clear, fullscreen)
    - Create `public/modules/memory-helper/memory-helper.css` with all styles prefixed using `mod-memory-*` classes for CSS isolation
    - Create `public/modules/memory-helper/memory-helper.js` implementing the module interface: `init(container)`, `destroy()`, `getState()`, `setState(state)`
    - Maintain all existing functionality: cell selection, undo, clear (with confirmation), fullscreen mode
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

  - [x] 5.2 Add local Digimon images
    - Place 12 PNG images in `public/assets/img/digimon/` (guilmon.png, veemon.png, renamon.png, hawkmon.png, wormmon.png, gomamon.png, patamon.png, terriermon.png, agumon.png, gabumon.png, salamon.png, biyomon.png)
    - Update Memory Helper to reference images from local path `/assets/img/digimon/${id}.png`
    - Implement fallback: full name text for large view, 3-char abbreviation for miniature selector if image fails to load
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 5.3 Write unit tests for Memory Helper module
    - Test grid state management (select, undo, clear)
    - Test getState/setState round-trip
    - Test image fallback behavior
    - _Requirements: 2.2, 2.4, 7.3_

- [x] 6. Implement Passive Gain Calculator module
  - [x] 6.1 Create Passive Calc module structure and UI
    - Create `public/modules/passive-calc/passive-calc.html` with sections: reward configuration (3 numeric fields), wait time calculator (target inputs + result display), emerald availability calculator (config + result)
    - Create `public/modules/passive-calc/passive-calc.css` with styles prefixed using `mod-calc-*` classes
    - Use `data-i18n` attributes on all labels and text
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 10.1, 10.2, 10.3, 3.1, 3.2_

  - [x] 6.2 Implement reward configuration logic
    - Create `public/modules/passive-calc/passive-calc.js` with module interface: `init(container)`, `destroy()`, `getState()`, `setState(state)`
    - Implement numeric input validation: reject non-numeric, enforce range [0, 999999999], retain last valid value on invalid input
    - Persist reward config to localStorage on every valid change
    - Load saved config on init, default to 0 if none exists
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 6.3 Implement wait time calculation functions
    - Implement `calculateWaitTime(target, ratePerInterval)`: return `{days, hours, minutes}` or null if rate is 0
    - Formula: `totalMinutes = ceil(target / rate) * 5`, decompose into days/hours/minutes
    - Implement `calculateMaxWaitTime(resources)`: return max wait time across all resource pairs
    - Wire UI: show result on calculation, show "configure rewards first" if rate is 0
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 6.4 Write property tests for wait time calculations
    - **Property 10: Wait time calculation correctness**
    - **Property 11: Maximum wait time across multiple resources**
    - **Validates: Requirements 9.2, 9.3, 9.4**

  - [x] 6.5 Implement emerald availability calculation
    - Implement `calculateAvailableEmeralds(currentEmeralds, dailyPullCost, pullTime, emeraldRate, now)` returning `{deadlineTime, availableToSpend, canSpend}`
    - Handle day rollover when pullTime already passed today
    - Implement emerald config UI: daily pull cost (default 5700), pull time (default 08:00), current emeralds input
    - Show deadline time in HH:MM, available amount, and "cannot spend" message when past deadline
    - Persist emerald config to localStorage
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [x] 6.6 Write property tests for emerald calculations
    - **Property 12: Emerald availability calculation consistency**
    - **Validates: Requirements 10.4, 10.5, 10.7, 10.8**

  - [x] 6.7 Write property test for numeric input validation
    - **Property 9: Numeric input field validation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.7, 9.1**

- [x] 7. Checkpoint - Ensure all modules work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration, sidebar rendering, and final wiring
  - [x] 8.1 Wire sidebar rendering with module registry
    - Ensure sidebar renders all registered modules with translated names and icons
    - Ensure active module is highlighted in sidebar
    - Ensure clicking sidebar item loads corresponding module in content area
    - Ensure default module (memory-helper) loads on app start
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [x] 8.2 Write property test for sidebar rendering
    - **Property 1: Sidebar renders all registered modules with name and icon**
    - **Validates: Requirements 1.5, 3.4**

  - [x] 8.3 Write integration tests for module loading lifecycle
    - Test full load/unload cycle with state preservation
    - Test error handling when module path doesn't exist
    - Test sidebar remains functional after module load error
    - _Requirements: 1.7, 2.4, 3.5_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses JavaScript (ES modules) with Vitest for testing and fast-check for property-based tests
- All CSS isolation is achieved via class prefixes (`mod-memory-*`, `mod-calc-*`) rather than Shadow DOM
- The server has zero external runtime dependencies (Node.js `http` + `fs` only)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3", "2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.7", "4.1"] },
    { "id": 4, "tasks": ["2.6", "4.2"] },
    { "id": 5, "tasks": ["4.3", "5.1", "6.1"] },
    { "id": 6, "tasks": ["5.2", "6.2"] },
    { "id": 7, "tasks": ["5.3", "6.3"] },
    { "id": 8, "tasks": ["6.4", "6.5"] },
    { "id": 9, "tasks": ["6.6", "6.7"] },
    { "id": 10, "tasks": ["8.1"] },
    { "id": 11, "tasks": ["8.2", "8.3"] }
  ]
}
```
