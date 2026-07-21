# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.

Il formato si basa su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Versionamento Semantico](https://semver.org/lang/it/).

## [1.1.0] - 2025-07-21

### Migliorato

- Memory Helper: i Digimon che hanno già 2 copie sulla griglia vengono oscurati nel selettore e non possono essere selezionati

### Modificato

- Il modulo changelog ora carica changelog specifici per lingua da `/changelogs/{locale}.md`
- Changelog disponibili in tutte le 6 lingue supportate (en, es, it, pt, de, ja)
- Rimosso il `public/CHANGELOG.md` duplicato a favore di file per lingua

## [1.0.0] - 2025-01-20

### Aggiunto

- Architettura multi-utilità con App Shell e navigazione laterale (sidebar)
- Server statico Node.js senza dipendenze esterne
- Sistema di internazionalizzazione (i18n) con supporto per 6 lingue
- Registro centrale dei moduli per l'estensibilità
- Modulo Memory Game Helper (estratto dal monolite originale)
- Modulo Calcolatore Guadagno Passivo (nuova utilità)
- Immagini locali dei Digimon (12 PNG)
- Design responsive con sidebar comprimibile su mobile
- Sistema di versionamento con changelog

### Modificato

- Rifactorizzazione dell'applicazione monolitica (HTML singolo) ad architettura modulare
- Migrazione delle immagini esterne a file locali
