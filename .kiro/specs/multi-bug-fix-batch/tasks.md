# Plan de Implementación: Corrección de Bugs en Lote

## Resumen

Corrección de 10 bugs que afectan la aplicación "Digimon Up Companion": auto-cálculo basado en piso para recompensas, detección/persistencia de idioma, imágenes rotas en Memory Helper, título incorrecto, encabezado no deseado en sidebar, persistencia de ruta al recargar, layout del calculador pasivo, y visibilidad del changelog. Se agrupan fixes relacionados para minimizar conflictos.

## Tasks

- [x] 1. Fix app title and remove unwanted sidebar heading (Bugs 1.6, 1.7)
  - [x] 1.1 Update HTML title and h1 default text to "Digimon Up Companion"
    - In `public/index.html`: change `<title>DigiMemory</title>` to `<title>Digimon Up Companion</title>`
    - In `public/index.html`: change `<h1 data-i18n="app.title">DigiMemory</h1>` default text to `Digimon Up Companion`
    - _Requirements: 2.6_

  - [x] 1.2 Update all 6 locale files with correct app title
    - In `public/locales/en.json`, `es.json`, `it.json`, `pt.json`, `de.json`, `ja.json`: change `"app.title": "DigiMemory"` to `"app.title": "Digimon Up Companion"`
    - _Requirements: 2.6_

  - [x] 1.3 Remove unwanted `<h2>` sidebar heading
    - In `public/index.html`: remove the `<h2 data-i18n="sidebar.title">Utilidades</h2>` element entirely
    - _Requirements: 2.7_

- [x] 2. Fix language dropdown persistence and setLocale call (Bugs 1.2, 1.3, 1.4)
  - [x] 2.1 Add change event listener on `#lang-select` that calls `setLocale()`
    - In `public/js/app.js`: after `initI18n()` resolves, add a `change` event listener on `#lang-select` that calls `setLocale(event.target.value)` from i18n.js
    - This single fix addresses bugs 1.3 and 1.4 simultaneously since `setLocale()` already persists to localStorage and updates the DOM
    - _Requirements: 2.3, 2.4_

  - [x] 2.2 Sync `#lang-select` dropdown value with detected/persisted locale on init
    - After `initI18n()` resolves, set `document.querySelector('#lang-select').value` to `getCurrentLocale()` so the dropdown reflects the active locale (fixes bug 1.2 visual feedback)
    - _Requirements: 2.2, 3.2_

  - [x] 2.3 Write unit test for language change event listener
    - Test that changing the `#lang-select` value triggers `setLocale()` with the correct locale code
    - Test that on init, `#lang-select` reflects the detected/persisted locale
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 3. Fix route persistence on page reload (Bug 1.8)
  - [x] 3.1 Persist active module ID to URL hash on module navigation
    - In `public/js/app.js` `handleModuleSelect()`: update `window.location.hash` to `#${mod.id}` when a module is selected
    - _Requirements: 2.8_

  - [x] 3.2 Restore module from URL hash on page load
    - In `public/js/app.js` `initApp()`: before loading the default module, check `window.location.hash` for a valid module ID; if found and present in registry, load that module instead of the default
    - Mark the restored module as active in the sidebar
    - _Requirements: 2.8, 3.6_

  - [x] 3.3 Write unit test for route persistence
    - Test that `handleModuleSelect` updates `window.location.hash`
    - Test that `initApp` reads hash and loads the correct module
    - Test fallback to default module when hash is empty or invalid
    - _Requirements: 2.8_

- [x] 4. Fix Memory Helper broken images (Bug 1.5)
  - [x] 4.1 Verify image files are valid PNGs and fix if needed
    - Check file sizes of images in `public/assets/img/digimon/`; if any are 0 bytes or invalid, replace them with valid 1x1 placeholder PNGs
    - Ensure the fallback mechanism (onerror → show text abbreviation) works correctly when images fail to load
    - _Requirements: 2.5, 3.4_

  - [x] 4.2 Write unit test for image fallback behavior
    - Test that when an image fails to load, the fallback text (full name for large view, 3-char abbreviation for miniature selector) is displayed
    - _Requirements: 2.5, 3.4_

- [x] 5. Add floor-based auto-calculation to Passive Calc (Bug 1.1)
  - [x] 5.1 Add Floor input field to Reward Configuration HTML
    - In `public/modules/passive-calc/passive-calc.html`: add a "Floor" (`Piso`) input field before Bits/Hologram Tickets/DigiEmeralds in the Reward Configuration section
    - Add `data-i18n` attributes for the label; id: `mod-calc-floor`
    - _Requirements: 2.1_

  - [x] 5.2 Add i18n keys for Floor field in all locale files
    - Add `"modules.passiveCalc.floor"` key to all 6 locale files (e.g., "Floor" in en, "Piso" in es, etc.)
    - _Requirements: 2.1_

  - [x] 5.3 Implement floor-based auto-calculation logic in passive-calc.js
    - On floor input change: auto-calculate Bits = `(Math.floor(floor / 20) + 3) * 25` and Hologram Tickets = `1 + Math.floor(floor / 20)`
    - Update the Bits and Hologram Tickets input fields with calculated values
    - The calculated fields remain editable (user can override)
    - DigiEmeralds is NOT affected by floor changes
    - Persist floor value to localStorage as part of reward config
    - _Requirements: 2.1, 3.1, 3.8_

  - [x] 5.4 Write unit test for floor-based calculation
    - Test formula: floor=0 → Bits=75, Tickets=1; floor=20 → Bits=100, Tickets=2; floor=40 → Bits=125, Tickets=3
    - Test that manual override of Bits/Hologram Tickets is preserved until next floor change
    - Test that DigiEmeralds is not affected by floor changes
    - _Requirements: 2.1, 3.1, 3.5, 3.8_

- [x] 6. Fix Passive Calc layout (Bug 1.9)
  - [x] 6.1 Restructure passive-calc.html for 2-column layout
    - Wrap all sections in a 2-column grid container
    - Reward Configuration section spans both columns; Floor on first row, then Bits/Hologram Tickets/DigiEmeralds on second row
    - Wait Time and Available Emeralds sections are placed side by side (one column each)
    - _Requirements: 2.9_

  - [x] 6.2 Update passive-calc.css for 2-column grid layout
    - Add grid styles for the 2-column layout at desktop widths (≥ 480px)
    - Reward Configuration spans `grid-column: 1 / -1`
    - Wait Time and Available Emeralds each occupy one column
    - Maintain single-column stack on mobile (< 480px)
    - _Requirements: 2.9_

- [x] 7. Add Changelog viewer module (Bug 1.10)
  - [x] 7.1 Register changelog module in modules.json
    - Add a `changelog` entry to `public/config/modules.json` with id: `changelog`, name i18n key, icon (e.g., "📋"), path: `modules/changelog`, default: false
    - _Requirements: 2.10_

  - [x] 7.2 Add i18n keys for changelog module in all locale files
    - Add `"modules.changelog.name"` key (e.g., "Changelog" in en, "Registro de cambios" in es, etc.)
    - _Requirements: 2.10_

  - [x] 7.3 Create changelog module files
    - Create `public/modules/changelog/changelog.html` with a container div for rendered content
    - Create `public/modules/changelog/changelog.css` with styles prefixed `mod-changelog-*`
    - Create `public/modules/changelog/changelog.js` implementing module interface (`init`, `destroy`, `getState`, `setState`)
    - On `init`: fetch `/CHANGELOG.md` (or an exposed endpoint), parse Markdown into HTML (simple parser for headers, lists, bold), and render into the container
    - _Requirements: 2.10, 3.9_

  - [x] 7.4 Expose CHANGELOG.md via server or move to public folder
    - Either configure `server.js` to serve `CHANGELOG.md` at a known path (e.g., `/changelog.md`), or copy/symlink it to `public/`
    - _Requirements: 2.10, 3.9_

  - [x] 7.5 Write unit test for changelog module
    - Test that the module fetches and renders changelog content
    - Test that version headers and change categories are formatted correctly
    - _Requirements: 2.10_

- [x] 8. Final verification checkpoint
  - Run all existing tests to ensure no regressions
  - Verify bugs 1.1–1.10 are resolved
  - Confirm unchanged behaviors (requirements 3.1–3.9) still hold
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

## Notes

- Bugs 1.3 and 1.4 share the exact same root cause (missing event listener on `#lang-select`) and are fixed together in task 2.1
- Bug 1.2 (browser locale detection) — the detection logic in `i18n.js` is already correct; the only issue is the `#lang-select` dropdown not reflecting the detected locale visually (fixed in task 2.2)
- Tasks 5 and 6 both modify `passive-calc.html` — task 5 adds the Floor input, task 6 restructures the layout. They should be implemented in order (5 first, then 6 incorporates the new field)
- Bug 1.5 (broken images) — the JS paths are correct (`/assets/img/digimon/${id}.png`), the fallback mechanism exists; the issue is likely that image files are 0-byte placeholders. Task 4.1 verifies and fixes this
- The project uses Vitest + fast-check for testing, vanilla JavaScript (ES modules), no frameworks
- All CSS isolation uses class prefixes (`mod-calc-*`, `mod-memory-*`, `mod-changelog-*`)
- The localStorage key for i18n is `digimemory-locale` (defined in `i18n.js`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "4.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "3.2", "7.1", "7.2", "7.4"] },
    { "id": 2, "tasks": ["2.3", "3.3", "4.2", "5.1", "5.2", "7.3"] },
    { "id": 3, "tasks": ["5.3", "6.1"] },
    { "id": 4, "tasks": ["5.4", "6.2", "7.5"] },
    { "id": 5, "tasks": ["8"] }
  ]
}
```
