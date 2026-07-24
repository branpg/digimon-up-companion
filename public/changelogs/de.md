# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt der [Semantischen Versionierung](https://semver.org/lang/de/).

## [1.4.1] - 2025-07-24

### Behoben

- Tippfehler in der Täglichen Checkliste: „Dimensionales Haus" → „Dimensionale Box" in allen Sprachen

### Geändert

- Text der Rang-Missionen aktualisiert: weist jetzt auf das Prüfen des Missionsstatus für den Trainer-Rangaufstieg hin
- Abschnitt „Optional" entfernt und durch ein Inline-Tag „optional" bei den entsprechenden Einträgen ersetzt

### Hinzugefügt

- Neues Tag „Warten" (orange) für Einträge, die Wartezeit erfordern
- 2 Einträge zur Dimensionalen Box am Ende der Liste mit Tag „Warten" (Partner nach Runden entfernen/ersetzen und nach 16h)
- Eintrag „Geschenke-Tab prüfen" vor dem Ressourcenverbrauch
- 2 optionale x2-Geschwindigkeits-Einträge per Werbung (empfohlen für Kampfmissionen)
- Optionaler Eintrag „Täglichen Bonus abholen, falls verfügbar"

## [1.4.0] - 2025-07-23

### Hinzugefügt

- Neues Modul Tägliche Checkliste: vollständige tägliche Aufgabenliste zur Maximierung des Fortschritts
- Check-Status wird über stabile ID gespeichert (überlebt Textkorrekturen und neue Einträge)
- Automatischer täglicher Reset um 08:00 mit Bestätigungsbanner
- Manueller Reset-Button mit Bestätigung
- DemiDevimon-Loop-Schalter (in der Liste) mit konfigurierbarer Ticket-Anzahl für wiederholte Missionszyklen
- Inline-Tag-Badges (Mission, Ressourcenverbrauch, Shop, Lager, PvP)
- „Erledigte ausblenden"-Schalter (standardmäßig ein) für eine saubere Liste
- Vollständige i18n-Unterstützung: alle Schritte und Tags in 6 Sprachen übersetzt
- Re-Rendering bei Sprachwechsel über MutationObserver auf `<html lang>`

## [1.3.0] - 2025-07-21

### Hinzugefügt

- Gacha-Level: Eingabefeld „Zeit ohne Abholung" (HH:MM:SS) mit Zeitstempel der letzten Abholung
- Gacha-Level: „Aktualisieren"-Button setzt Abholzeitpunkt, damit verstrichene Zeit automatisch aktualisiert wird
- Gacha-Level: zeigt „Letzte Abholung: HH:MM" als Referenz
- Gacha-Level: Sammlungserinnerung wenn passiver Speicher voll (≥8h), zeigt nächste empfohlene Abholzeit (+7h)
- Gacha-Level: Schnell-Buttons (+1, +10, +50, +100) für aktuelle DigiSmaragde
- Gacha-Berechnung berücksichtigt bereits angesammelte Smaragde (max. 8h passiv)

## [1.2.0] - 2025-07-21

### Hinzugefügt

- Passiver Gewinn: neuer Tab „Gacha-Level" zur Berechnung, wann das Gacha aufsteigt
- Karten-Gacha und Support-Gacha, jeweils mit Ziehungen gemacht/Ziel/verbleibend und aktuellen Tickets
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
