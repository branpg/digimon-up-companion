# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.4.0] - 2025-07-23

### Añadido

- Nuevo módulo Checklist Diaria: listado completo de tareas diarias para maximizar el avance
- Persistencia de checks por ID estable (no se pierde al corregir textos o añadir items)
- Reset diario automático a las 08:00 con banner de confirmación
- Botón de reset manual con confirmación
- Toggle del DemiDevimon Loop integrado en la lista con número de tickets configurable que repite ciclos de misiones
- Badges inline por tarea (Misión, Quema de recursos, Tienda, Campamento, PvP)
- Toggle "Ocultar completados" (activado por defecto) para mantener la lista limpia
- Soporte i18n completo: todos los pasos y tags traducidos en 6 idiomas
- Re-renderizado al cambiar de idioma mediante MutationObserver en `<html lang>`

## [1.3.0] - 2025-07-21

### Añadido

- Nivel Gacha: campo "Tiempo sin recoger" (HH:MM:SS) con seguimiento de última recogida
- Nivel Gacha: botón "Actualizar" fija la hora de última recogida para que el tiempo transcurrido se auto-actualice al recalcular
- Nivel Gacha: muestra "Última recogida: HH:MM" como referencia
- Nivel Gacha: aviso de recogida cuando el almacén pasivo está lleno (≥8h), muestra próxima hora recomendada (+7h)
- Nivel Gacha: botones rápidos (+1, +10, +50, +100) para digiesmeraldas actuales
- El cálculo de gacha ahora tiene en cuenta las esmeraldas ya acumuladas (tope 8h de pasivo)

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
