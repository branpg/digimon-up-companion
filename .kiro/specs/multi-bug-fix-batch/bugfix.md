# Bugfix Requirements Document

## Introduction

This document covers a batch of 10 bugs affecting the "Digimon Up Companion" application. The issues span i18n (language detection, persistence, and UI update), the passive calculator (floor-based reward input and layout), the memory helper (broken images), branding (wrong app title), sidebar cleanup (unwanted heading), route persistence on page reload, and changelog visibility.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user enters Bits and Hologram Tickets manually in the Reward Configuration section THEN the system requires manual calculation instead of deriving values from a Floor number using the formulas: Tickets = 1 + floor(Piso / 20), Bits = (floor(Piso / 20) + 3) * 25

1.2 WHEN the browser has a default language that is supported (e.g., "es", "pt-BR") and no locale is persisted in localStorage THEN the system does not detect and apply the browser's locale on first load

1.3 WHEN the user changes the language via the `#lang-select` dropdown THEN the system does not persist the selected locale to localStorage and the selection is lost on reload

1.4 WHEN the user changes the language via the `#lang-select` dropdown THEN the system does not call `setLocale()` and no visual update occurs in the UI

1.5 WHEN the memory helper module renders Digimon images using paths like `/assets/img/digimon/${id}.png` THEN the images are not visible because the server cannot resolve the path correctly

1.6 WHEN the app loads or displays its title THEN the system shows "DigiMemory" instead of "Digimon Up Companion"

1.7 WHEN the sidebar is rendered THEN the system displays an `<h2>` element with text "Utilidades" (data-i18n="sidebar.title") that should not be present

1.8 WHEN the user is on a specific module (e.g., passive-calc) and reloads the page THEN the system loads the default module instead of restoring the previously active module

1.9 WHEN the Passive Gain section is rendered THEN the layout does not match the desired structure: "Reward Configuration" spanning 2 columns with Floor input on the first row, then Bits/Hologram Tickets/DigiEmeralds on a second row, followed by "Wait Time" and "Available Emeralds" side by side in two columns

1.10 WHEN the user wants to see the application changelog THEN there is no way to view it within the web application; the CHANGELOG.md file exists only as a raw Markdown file in the repository root with no web-accessible rendering

### Expected Behavior (Correct)

2.1 WHEN the user enters a Floor number in the Reward Configuration section THEN the system SHALL auto-calculate Bits as `(floor(Piso / 20) + 3) * 25` and Hologram Tickets as `1 + floor(Piso / 20)`, while the DigiEmeralds field remains manual input; the calculated fields (Bits, Hologram Tickets) SHALL still be editable by the user for overriding

2.2 WHEN the browser has a default language that is supported and no locale is persisted in localStorage THEN the system SHALL detect the browser's locale via `navigator.languages` or `navigator.language` and apply it on first load

2.3 WHEN the user changes the language via the `#lang-select` dropdown THEN the system SHALL persist the selected locale to localStorage so it is restored on next page load

2.4 WHEN the user changes the language via the `#lang-select` dropdown THEN the system SHALL call `setLocale()` with the selected value and update all `[data-i18n]` and `[data-i18n-placeholder]` elements in the DOM

2.5 WHEN the memory helper module renders Digimon images THEN the system SHALL serve the image files correctly and display them in the grid cells

2.6 WHEN the app loads or displays its title THEN the system SHALL show "Digimon Up Companion" in the HTML `<title>`, the sidebar header `<h1>`, and all locale files

2.7 WHEN the sidebar is rendered THEN the system SHALL NOT display the `<h2 data-i18n="sidebar.title">` element; it SHALL be removed entirely from the HTML

2.8 WHEN the user reloads the page while on a specific module THEN the system SHALL persist the current module ID (via URL hash or localStorage) and restore that module on initialization

2.9 WHEN the Passive Gain section is rendered THEN the system SHALL display the layout as: a "Reward Configuration" section header spanning 2 columns, with a Floor input on the first row, then Bits/Hologram Tickets/DigiEmeralds on a second row; below that, "Wait Time" and "Available Emeralds" sections side by side in two columns

2.10 WHEN the user navigates to a "Changelog" section in the app (e.g., via a sidebar link or footer link) THEN the system SHALL display the changelog content rendered as HTML, ordered from newest to oldest (which is already the file order), with proper formatting for version headers, dates, and change categories

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user manually overrides the calculated Bits or Hologram Tickets values THEN the system SHALL CONTINUE TO use the overridden values for wait time and emerald calculations

3.2 WHEN a locale is already persisted in localStorage THEN the system SHALL CONTINUE TO use the persisted locale instead of browser detection

3.3 WHEN the user interacts with other elements in the app (module navigation, calculations) THEN the system SHALL CONTINUE TO function correctly regardless of the active locale

3.4 WHEN the memory helper module loads with valid image paths THEN the system SHALL CONTINUE TO support the fallback abbreviation text when images fail to load

3.5 WHEN the passive calculator calculates wait times and emerald availability THEN the system SHALL CONTINUE TO produce correct results based on the configured reward rates

3.6 WHEN the user navigates between modules without reloading the page THEN the system SHALL CONTINUE TO preserve module state in memory via the existing router state mechanism

3.7 WHEN the user is on mobile and uses the hamburger menu THEN the system SHALL CONTINUE TO open/close the sidebar correctly

3.8 WHEN the DigiEmeralds field is edited by the user THEN the system SHALL CONTINUE TO accept manual input without being overwritten by floor-based calculation

3.9 WHEN the changelog is displayed THEN the system SHALL CONTINUE TO maintain the existing CHANGELOG.md file as the single source of truth (the web view reads from it, it is not duplicated)
