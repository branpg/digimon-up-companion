# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt der [Semantischen Versionierung](https://semver.org/lang/de/).

## [1.2.0] - 2025-07-21

### Hinzugefügt

- Passiver Gewinn: neuer Tab „Gacha-Level" zur Berechnung, wann das Gacha aufsteigt
  - Zwei Gachas: Karten und Support, jeweils mit Ziehungen gemacht/Ziel/verbleibend und aktuellen Tickets
  - Mechanik: 30 Tickets pro Multi (ergibt 35 Ziehungen), jedes Ticket kostet 20 DigiSmaragde
  - Berechnet Multi-Ziehungen, Ticketkosten, DigiSmaragd-Kosten und passive Zeit

### Geändert

- Passiver Gewinn: in 3 Sub-Tabs aufgeteilt (Wartezeit, Smaragde, Gacha-Level)
- Belohnungskonfiguration immer über allen Tabs sichtbar
- Ergebnisbereich verborgen bis Berechnen gedrückt wird (alle 3 Tabs)
- Wenn kein Stockwerk konfiguriert ist, wird gewarnt und die Berechnung blockiert
- Berechnen-Button in voller Breite

## [1.1.0] - 2025-07-21

### Verbessert

- Memory Helper: Digimon, die bereits 2 Kopien auf dem Brett haben, werden im Selektor abgedunkelt und können nicht ausgewählt werden

### Hinzugefügt

- `deploy.sh`-Skript zur Automatisierung von Docker-Build, Push und Remote-Deployment

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
