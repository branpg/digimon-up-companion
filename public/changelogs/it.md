# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.

Il formato si basa su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Versionamento Semantico](https://semver.org/lang/it/).

## [1.4.0] - 2025-07-23

### Aggiunto

- Nuovo modulo Checklist Giornaliera: lista completa delle attività giornaliere per massimizzare il progresso
- Stato dei check salvato con ID stabile (sopravvive a correzioni di testo e nuovi elementi)
- Reset giornaliero automatico alle 08:00 con banner di conferma
- Pulsante di reset manuale con conferma
- Toggle del DemiDevimon Loop integrato nella lista con numero di ticket configurabile che ripete cicli di missioni
- Badge tag inline (Missione, Consumo risorse, Negozio, Campo, PvP)
- Toggle "Nascondi completati" (attivo di default) per mantenere la lista pulita
- Supporto i18n completo: tutti i passaggi e tag tradotti in 6 lingue
- Re-rendering al cambio lingua tramite MutationObserver su `<html lang>`

## [1.3.0] - 2025-07-21

### Aggiunto

- Livello Gacha: campo "Tempo senza raccogliere" (HH:MM:SS) con tracciamento timestamp ultima raccolta
- Livello Gacha: pulsante "Aggiorna" fissa l'ora dell'ultima raccolta, il tempo trascorso si aggiorna automaticamente al ricalcolo
- Livello Gacha: mostra "Ultima raccolta: HH:MM" come riferimento
- Livello Gacha: avviso di raccolta quando lo stoccaggio passivo è pieno (≥8h), mostra prossimo orario di raccolta consigliato (+7h)
- Livello Gacha: pulsanti rapidi (+1, +10, +50, +100) per DigiSmeraldi attuali
- Il calcolo gacha ora tiene conto degli smeraldi già accumulati (max 8h passivo)

## [1.2.0] - 2025-07-21

### Aggiunto

- Guadagno Passivo: nuovo tab "Livello Gacha" per calcolare quando il gacha sale di livello
- Gacha carte e gacha supporto, ciascuno con tirate fatte/obiettivo/rimanenti e ticket attuali
- Meccanica: 30 ticket per multi (dà 35 tirate), ogni ticket costa 20 DigiSmeraldi
- Calcola multi-tirate necessarie, costo ticket, costo DigiSmeraldi e tempo passivo

### Modificato

- Guadagno Passivo: diviso in 3 sub-tab (Tempo di attesa, Smeraldi, Livello Gacha)
- Configurazione ricompense sempre visibile in tutti i tab
- Pannello risultati nascosto fino alla pressione di Calcola (tutti e 3 i tab)
- Se non ci sono dati del piano configurati, avvisa e blocca il calcolo
- Pulsante calcola a larghezza piena

## [1.1.0] - 2025-07-21

### Migliorato

- Memory Helper: i Digimon che hanno già 2 copie sulla griglia vengono oscurati nel selettore e non possono essere selezionati

### Aggiunto

- Script `deploy.sh` per automatizzare build, push e deploy remoto con Docker

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
