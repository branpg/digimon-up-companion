# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.4.5] - 2026-07-28

### Cambiado

- Checklist: precio de tickets de holograma corregido a 160 DigiEsmeraldas (antes 300)
- Checklist: precio de tickets de terminal de combate aclarado como 100 cada uno (5 por 500)
- Checklist: sección de campamento (registro, apoyo, Piximon, Leomon) movida antes del DemiDevimon Loop
- Checklist: primer "Gasta todos tus tickets del terminal de combate" (no opcional) reemplazado por "Entra en Terminal de combate y Grand Prix D-1 para calcular tickets pasivos"

### Añadido

- Checklist: comprar todas las Puertas digitales diarias con Monedas de campamento (opcional, requiere todos los digivices)
- Checklist: comprar 2 tickets de terminal de combate por 500 Monedas de campamento (250 c/u, opcional)
- Checklist: comprar 2 tickets de Grand Prix D-1 por 1000 Monedas de campamento (500 c/u, opcional)
- Checklist: gastar excedente de Monedas de campamento en Tickets de aceleración (opcional)
- Checklist: reclamar recompensas diarias de la Torre del sector perdido (después de intentar subir)

## [1.4.4] - 2026-07-29

### Cambiado

- Checklist: quema de tickets de holograma ahora especifica usar un digimon que no sea nivel 99
- Checklist: primer paso de gastar tickets del terminal de combate indica saltárselo si el PvP no está activo y hacerlo en el siguiente paso de PvP
- Checklist: las batallas de Piximon y Leomon movidas a después de la quema de recursos
- Checklist: el bonus diario movido a justo después del bloque del DemiDevimon Loop
- Checklist: paso del juego de memoria renombrado a "Completa las misiones diarias de Combinación Digimon"
- Checklist: añadido nuevo paso opcional para las misiones diarias de "¡Gran tumulto en la distribución de envíos!"

## [1.4.3] - 2026-07-26

### Añadido

- Checklist: nuevo paso "Torre del sector perdido" después del segundo Apocalymon (ranking)
- Checklist: sección DemiDevimon Loop (y alternativa) ahora muestra solo el siguiente paso con contador de progreso y barra visual en lugar de listar todos los pasos a la vez
- Checklist: tag "opcional" añadido a los tickets de PvP del inicio (Combat Terminal y Grand Prix) ya que el PvP puede estar cerrado a las 08:00

### Cambiado

- Checklist: textos de "Completar 4 veces X" cambiados a "Consume todos tus tickets de X (Incluidos los 2 por anuncios)" para DemiDevimon, Bakemon, Digifábrica, Defensa en red y Mar metálico

## [1.4.2] - 2026-07-25

### Cambiado

- Nivel Gacha: el límite máximo de tiradas aumentó de 9.999 a 100.000

## [1.4.1] - 2026-07-24

### Corregido

- Typo en Checklist Diaria: "Casa Dimensional" → "Caja Dimensional" en todos los idiomas

### Cambiado

- Texto de misiones de rango actualizado: ahora indica comprobar el estado de las misiones para subir el rango de entrenador
- Sección "Opcional" eliminada y reemplazada por un tag "opcional" inline en los items correspondientes

### Añadido

- Nuevo tag "espera" (naranja) para items que requieren esperar un tiempo
- 2 items de Caja Dimensional al final de la lista con tag "espera" (retirar/recolocar colegas por rondas y al cumplir 16h)
- Item "Revisa la pestaña de Regalos" antes de la quema de recursos
- 2 items opcionales de velocidad x2 por anuncio (recomendado para misiones de combate)
- Item opcional "Recoger bonus diario si está disponible"

## [1.4.0] - 2026-07-23

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

## [1.3.0] - 2026-07-21

### Añadido

- Nivel Gacha: campo "Tiempo sin recoger" (HH:MM:SS) con seguimiento de última recogida
- Nivel Gacha: botón "Actualizar" fija la hora de última recogida para que el tiempo transcurrido se auto-actualice al recalcular
- Nivel Gacha: muestra "Última recogida: HH:MM" como referencia
- Nivel Gacha: aviso de recogida cuando el almacén pasivo está lleno (≥8h), muestra próxima hora recomendada (+7h)
- Nivel Gacha: botones rápidos (+1, +10, +50, +100) para digiesmeraldas actuales
- El cálculo de gacha ahora tiene en cuenta las esmeraldas ya acumuladas (tope 8h de pasivo)

## [1.2.0] - 2026-07-21

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

## [1.1.0] - 2026-07-21

### Mejorado

- Memory Helper: los Digimon que ya tienen 2 copias en el tablero se oscurecen en el selector y no se pueden seleccionar

### Añadido

- Script `deploy.sh` para automatizar el build, push y despliegue remoto con Docker

### Cambiado

- El módulo del changelog ahora carga changelogs por idioma desde `/changelogs/{locale}.md`
- Changelogs disponibles en los 6 idiomas soportados (en, es, it, pt, de, ja)
- Eliminado el `public/CHANGELOG.md` duplicado en favor de archivos por idioma

## [1.0.0] - 2026-01-20

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
