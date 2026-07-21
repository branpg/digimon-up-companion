# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt der [Semantischen Versionierung](https://semver.org/lang/de/).

## [1.1.0] - 2025-07-21

### Verbessert

- Memory Helper: Digimon, die bereits 2 Kopien auf dem Brett haben, werden im Selektor abgedunkelt und können nicht ausgewählt werden

### Geändert

- Das Changelog-Modul lädt jetzt sprachspezifische Changelogs aus `/changelogs/{locale}.md`
- Changelogs in allen 6 unterstützten Sprachen verfügbar (en, es, it, pt, de, ja)
- Dupliziertes `public/CHANGELOG.md` zugunsten sprachspezifischer Dateien entfernt

## [1.0.0] - 2025-01-20

### Hinzugefügt

- Multi-Utility-Architektur mit App Shell und Seitenleisten-Navigation (Sidebar)
- Statischer Node.js-Server ohne externe Abhängigkeiten
- Internationalisierungssystem (i18n) mit Unterstützung für 6 Sprachen
- Zentrales Modulregister für Erweiterbarkeit
- Memory Game Helper Modul (aus dem ursprünglichen Monolithen extrahiert)
- Passiver Gewinn-Rechner Modul (neues Werkzeug)
- Lokale Digimon-Bilder (12 PNG)
- Responsives Design mit einklappbarer Sidebar auf Mobilgeräten
- Versionierungssystem mit Changelog

### Geändert

- Refaktorierung der monolithischen Anwendung (einzelne HTML) zur modularen Architektur
- Migration externer Bilder zu lokalen Dateien
