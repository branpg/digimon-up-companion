# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.4.1] - 2025-07-24

### Fixed

- Typo in Daily Checklist: "Dimensional House" → "Dimensional Box" in all languages

### Changed

- Rank missions text updated: now says to check mission status for trainer rank progression
- "Optional" section removed and replaced with an inline "optional" tag on relevant items

### Added

- New "wait" tag (orange) for items that require waiting
- 2 Dimensional Box items at the end of the list with "wait" tag (remove/replace partners by rounds and after 16h)
- "Check the Gifts tab" item before resource burn section
- 2 optional x2 speed items via ad (recommended for combat missions)
- Optional "Collect daily bonus if available" item

## [1.4.0] - 2025-07-23

### Added

- New Daily Checklist module: complete daily task list to maximize progress
- Check state persisted by stable ID (survives text corrections and new items)
- Automatic daily reset at 08:00 with user confirmation banner
- Manual reset button with confirmation
- DemiDevimon Loop toggle (in-list) with configurable ticket count that repeats mission cycles
- Inline tag badges (Mission, Resource burn, Shop, Camp, PvP)
- "Hide completed" toggle (default on) to keep the list clean
- Full i18n support: all steps and tags translated in 6 languages
- Re-renders on language change via MutationObserver on `<html lang>`

## [1.3.0] - 2025-07-21

### Added

- Gacha Level: "Time without collecting" input (HH:MM:SS) with last collection timestamp tracking
- Gacha Level: "Update" button sets last collected time so elapsed auto-updates on recalculate
- Gacha Level: displays "Last collected: HH:MM" as reference
- Gacha Level: collection reminder alert when passive storage is full (≥8h), shows next recommended collection time (+7h)
- Gacha Level: quick-add buttons (+1, +10, +50, +100) for current DigiEmeralds
- Gacha calculation now accounts for emeralds already accumulated (capped at 8h passive max)

## [1.2.0] - 2025-07-21

### Added

- Passive Gain: new "Gacha Level" tab to calculate when gacha levels up
- Cards gacha and support gacha, each with pulls done/target/remaining and current tickets
- Mechanics: 30 tickets per multi (gives 35 pulls), each ticket costs 20 DigiEmeralds
- Calculates multi-pulls needed, ticket cost, DigiEmerald cost, and passive time

### Changed

- Passive Gain: split into 3 sub-tabs (Wait Time, Emeralds, Gacha Level)
- Reward configuration always visible across all tabs
- Result panel hidden until calculate is pressed (all 3 tabs)
- If no floor data is configured, warns and blocks calculation on all tabs
- Full-width calculate button

## [1.1.0] - 2025-07-21

### Improved

- Memory Helper: Digimon that already have 2 copies on the board are dimmed in the selector and cannot be selected

### Added

- `deploy.sh` script for automated Docker build, push, and remote deployment

### Changed

- Changelog module now loads locale-specific changelogs from `/changelogs/{locale}.md`
- Changelogs available in all 6 supported languages (en, es, it, pt, de, ja)
- Removed duplicated `public/CHANGELOG.md` in favor of per-language files

## [1.0.0] - 2025-01-20

### Added

- Multi-utility architecture with App Shell and sidebar navigation
- Static Node.js server with no external dependencies
- Internationalization system (i18n) with support for 6 languages
- Central module registry for extensibility
- Memory Game Helper module (extracted from original monolith)
- Passive Gain Calculator module (new utility)
- Local Digimon images (12 PNG)
- Responsive design with collapsible sidebar on mobile
- Versioning system with changelog

### Changed

- Refactored monolithic application (single HTML) to modular architecture
- Migrated external images to local files
