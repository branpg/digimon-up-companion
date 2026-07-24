---
inclusion: fileMatch
fileMatchPattern: "guides/**"
---

# Gestión de guías

Reglas que aplican siempre que se modifique cualquier archivo dentro de `guides/`:

## Al modificar una guía

1. **Actualizar la fecha de revisión** en la cabecera del documento (campo "Última revisión").
2. **Añadir una entrada al Changelog** al final de la guía con la fecha y un resumen breve de los cambios realizados.
3. **Preguntar al usuario si quiere regenerar el formato Discord** al finalizar las modificaciones. No regenerar automáticamente sin confirmación.

## Al regenerar el formato Discord

1. La versión Discord se genera como un archivo separado con sufijo `-discord.md` en la misma carpeta.
2. Cada bloque debe tener menos de 2000 caracteres para cumplir el límite de Discord.
3. **Marcar los posts que han cambiado** respecto a la versión anterior con un indicador `⚠️ ACTUALIZADO` al inicio del bloque afectado.
4. Incluir un reply de Changelog al final con las últimas entradas. Si el changelog supera los 2000 caracteres, eliminar las entradas más antiguas para que quepa.
5. Tras regenerar, informar al usuario de qué posts necesitan actualizarse en Discord y pedirle que avise cuando lo haya hecho para desmarcar los indicadores `⚠️ ACTUALIZADO`.

## Cuando el usuario confirme que Discord está actualizado

1. Eliminar los indicadores `⚠️ ACTUALIZADO` del archivo Discord.
