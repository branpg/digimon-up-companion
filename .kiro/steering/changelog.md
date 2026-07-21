---
inclusion: auto
---

# Regla: Actualización del Changelog

Siempre que realices cambios funcionales en el código de este proyecto (nuevas features, mejoras, correcciones de bugs, cambios de comportamiento), debes actualizar el changelog.

## Estructura

- `CHANGELOG.md` (raíz) — changelog principal de referencia para el repositorio, en inglés.
- `public/changelogs/{locale}.md` — changelogs por idioma que muestra la app. Idiomas: `en`, `es`, `it`, `pt`, `de`, `ja`.

## Formato

Usa el formato [Keep a Changelog](https://keepachangelog.com/). Las secciones válidas son:

- **Added / Añadido / Aggiunto / Adicionado / Hinzugefügt / 追加** — para nuevas funcionalidades
- **Changed / Cambiado / Modificato / Alterado / Geändert / 変更** — para cambios en funcionalidades existentes
- **Improved / Mejorado / Migliorato / Melhorado / Verbessert / 改善** — para mejoras
- **Fixed / Corregido / Corretto / Corrigido / Behoben / 修正** — para correcciones de bugs
- **Removed / Eliminado / Rimosso / Removido / Entfernt / 削除** — para funcionalidades eliminadas

## Instrucciones

1. Si no existe una versión `[Unreleased]` al inicio, créala con la fecha de hoy.
2. Añade la entrada bajo la sección correspondiente.
3. Actualiza **todos los 7 archivos**: el `CHANGELOG.md` de raíz y los 6 de `public/changelogs/`.
4. Traduce la entrada a cada idioma de forma natural (no literal).
5. No actualices el changelog para cambios puramente internos (refactors sin impacto visible, cambios en tests, cambios en configuración de CI).
