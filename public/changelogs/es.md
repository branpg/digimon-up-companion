# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.2.0] - 2025-07-21

### Añadido

- Ganancia Pasiva: nueva pestaña "Nivel Gacha" para calcular cuándo sube de nivel el gacha
- Gacha de cartas y gacha de apoyos, cada uno con tiradas hechas/objetivo/restantes y tickets actuales
- Mecánica: 30 tickets por multi (da 35 tiradas), cada ticket vale 20 digiesmeraldas
- Calcula multi-tiradas necesarias, coste en tickets, coste en digiesmeraldas y tiempo pasivo

### Cambiado

- Ganancia Pasiva: dividida en 3 sub-pestañas (Tiempo de espera, Esmeraldas, Nivel Gacha)
- La configuración de recompensas siempre visible en todas las pestañas
- El panel de resultado se oculta hasta pulsar calcular (en las 3 pestañas)
- Si no hay datos del piso configurados, avisa y bloquea el cálculo en todas las pestañas
- Botón calcular a ancho completo

## [1.1.0] - 2025-07-21

### Mejorado

- Memory Helper: los Digimon que ya tienen 2 copias en el tablero se oscurecen en el selector y no se pueden seleccionar

### Añadido

- Script `deploy.sh` para automatizar el build, push y despliegue remoto con Docker

### Cambiado

- El módulo del changelog ahora carga changelogs por idioma desde `/changelogs/{locale}.md`
- Changelogs disponibles en los 6 idiomas soportados (en, es, it, pt, de, ja)
- Eliminado el `public/CHANGELOG.md` duplicado en favor de archivos por idioma

## [1.0.0] - 2025-01-20

### Añadido

- Arquitectura multi-utilidad con App Shell y navegación lateral (sidebar)
- Servidor estático Node.js sin dependencias externas
- Sistema de internacionalización (i18n) con soporte para 6 idiomas
- Registro central de módulos para extensibilidad
- Módulo Memory Game Helper (extraído del monolito original)
- Módulo Calculador de Ganancia Pasiva (nueva utilidad)
- Imágenes locales de Digimon (12 PNG)
- Diseño responsive con sidebar colapsable en móviles
- Sistema de versionado con changelog

### Cambiado

- Refactorización de aplicación monolítica (single HTML) a arquitectura modular
- Migración de imágenes externas a archivos locales
