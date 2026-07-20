# Requirements Document

## Introduction

Refactorización de la aplicación actual "Digimon Memory Helper" (un único archivo HTML) en una aplicación web multi-utilidad con navegación lateral (sidebar). La aplicación servirá como plataforma para alojar múltiples herramientas/utilidades relacionadas con el juego Digimon, comenzando con el Memory Game Helper existente y un Calculador de Ganancia Pasiva. El servidor debe ser lo más ligero posible, dado que se espera concurrencia prácticamente nula.

## Glossary

- **App_Shell**: Estructura principal de la aplicación que contiene el sidebar de navegación y el área de contenido donde se renderizan las utilidades.
- **Sidebar**: Menú de navegación lateral fijo que lista las utilidades disponibles y permite cambiar entre ellas.
- **Utilidad**: Módulo funcional independiente que se carga dentro del área de contenido del App_Shell (por ejemplo, el Digimon Memory Helper).
- **Área_De_Contenido**: Zona principal de la interfaz donde se renderiza la utilidad activa seleccionada desde el Sidebar.
- **Servidor**: Proceso ligero que sirve los archivos estáticos de la aplicación.
- **Memory_Game_Helper**: La utilidad existente (anteriormente "Digimon Memory Helper") que permite gestionar una cuadrícula 4x6 con selección de personajes Digimon.
- **Calculador_De_Ganancia_Pasiva**: Utilidad que calcula tiempos y disponibilidad de recursos del juego basándose en las recompensas pasivas que se otorgan cada 5 minutos.
- **Bits**: Recurso del juego obtenido mediante recompensas pasivas. La cantidad varía según el nivel del jugador.
- **Ticket_De_Holograma**: Recurso del juego obtenido mediante recompensas pasivas. La cantidad es fija independientemente del nivel.
- **Digiesmeraldas**: Recurso del juego obtenido mediante recompensas pasivas. La cantidad es fija independientemente del nivel.
- **Intervalo_De_Recompensa**: Período de 5 minutos entre cada entrega de recompensas pasivas del juego.
- **Selector_De_Idioma**: Componente de la interfaz que permite al usuario cambiar el idioma de la aplicación.
- **Idiomas_Soportados**: Inglés (por defecto), español, italiano, portugués, alemán y japonés.
- **Sistema_De_Versionado**: Mecanismo que registra la versión actual de la aplicación y mantiene un historial de cambios (changelog).
- **Changelog**: Archivo que documenta todos los cambios realizados en la aplicación, organizados por versión.

## Requirements

### Requisito 1: Estructura de App Shell con Sidebar

**User Story:** Como usuario, quiero una barra lateral de navegación que me permita acceder a diferentes utilidades, para poder cambiar fácilmente entre herramientas disponibles.

#### Criterios de Aceptación

1. THE App_Shell SHALL presentar un Sidebar con posición fija en el viewport en el lado izquierdo de la pantalla, visible en todo momento sin desplazarse con el scroll del contenido, con la lista de utilidades disponibles.
2. THE App_Shell SHALL presentar un Área_De_Contenido a la derecha del Sidebar que ocupe el espacio restante del viewport.
3. WHEN el usuario hace clic en un elemento del Sidebar, THE App_Shell SHALL reemplazar el contenido actual del Área_De_Contenido con la Utilidad correspondiente al elemento seleccionado.
4. WHILE una Utilidad está activa, THE Sidebar SHALL resaltar visualmente el elemento correspondiente a la Utilidad activa con un estilo diferenciado del resto de elementos.
5. THE Sidebar SHALL mostrar el nombre y un icono representativo para cada Utilidad disponible.
6. WHEN la aplicación se carga por primera vez, THE App_Shell SHALL seleccionar y mostrar la primera Utilidad de la lista en el Área_De_Contenido como utilidad activa por defecto.
7. IF una Utilidad no puede cargarse en el Área_De_Contenido, THEN THE App_Shell SHALL mostrar un mensaje de error indicando que la utilidad no está disponible, manteniendo el Sidebar funcional para permitir la navegación a otras utilidades.

### Requisito 2: Integración del Memory Game Helper como primera utilidad

**User Story:** Como usuario, quiero que el Memory Game Helper existente funcione como una utilidad dentro de la nueva estructura, para no perder la funcionalidad actual.

#### Criterios de Aceptación

1. THE App_Shell SHALL cargar el Memory_Game_Helper como utilidad por defecto al iniciar la aplicación.
2. WHEN el Memory_Game_Helper se carga en el Área_De_Contenido, THE Memory_Game_Helper SHALL mantener toda la funcionalidad existente: selección de Digimon en cuadrícula 4x6, deshacer última asignación, limpiar tablero completo, y modo pantalla completa.
3. THE Memory_Game_Helper SHALL adaptar su cuadrícula al espacio disponible en el Área_De_Contenido sin desbordarse ni generar scroll horizontal.
4. WHEN el usuario cambia a otra Utilidad y regresa al Memory_Game_Helper, THE App_Shell SHALL restaurar el estado previo del tablero incluyendo las selecciones realizadas y el historial de deshacer.

### Requisito 3: Arquitectura modular para utilidades

**User Story:** Como desarrollador, quiero una arquitectura modular que facilite añadir nuevas utilidades, para poder extender la aplicación con mínimo esfuerzo.

#### Criterios de Aceptación

1. THE App_Shell SHALL cargar cada Utilidad como un módulo independiente que contenga su propio HTML, CSS y JavaScript en archivos separados del resto de módulos.
2. THE App_Shell SHALL aislar los estilos CSS de cada Utilidad de modo que las reglas CSS definidas en un módulo no afecten a los elementos de otro módulo ni del App_Shell.
3. WHEN se añade una nueva Utilidad, THE App_Shell SHALL requerir únicamente la adición de una entrada en un único archivo de configuración central, sin modificar ningún otro archivo existente.
4. THE App_Shell SHALL proveer una interfaz de registro que defina, como mínimo, nombre (máximo 50 caracteres), icono (referencia a un identificador de icono válido) y ruta relativa del módulo de cada Utilidad.
5. IF el archivo de configuración central contiene una entrada con campos obligatorios ausentes o una ruta de módulo que no resuelve a un archivo existente, THEN THE App_Shell SHALL mostrar un mensaje de error indicando el módulo afectado y el problema detectado, y SHALL continuar cargando el resto de módulos válidos.
6. WHEN el App_Shell carga un módulo registrado, THE App_Shell SHALL mostrar la Utilidad disponible en la navegación en un máximo de 2 segundos desde el inicio de la aplicación.

### Requisito 4: Servidor ligero de archivos estáticos

**User Story:** Como desarrollador, quiero un servidor lo más simple y ligero posible para servir la aplicación, dado que se espera concurrencia prácticamente nula.

#### Criterios de Aceptación

1. THE Servidor SHALL servir archivos estáticos (HTML, CSS, JS, imágenes) desde un directorio raíz especificado como argumento en el comando de inicio, aplicando el Content-Type correspondiente a la extensión del archivo.
2. THE Servidor SHALL iniciar con un único comando que acepte como parámetros opcionales el directorio raíz y el puerto, usando por defecto el directorio actual y el puerto 8080 si no se especifican.
3. THE Servidor SHALL tener dependencias mínimas (máximo una dependencia externa de runtime).
4. WHEN se recibe una petición a una ruta sin extensión de archivo que no corresponde a un archivo existente, THE Servidor SHALL responder con el archivo index.html del directorio raíz y código de estado HTTP 200 para soportar navegación del lado del cliente.
5. IF se recibe una petición a una ruta con extensión de archivo que no corresponde a un archivo existente en el directorio raíz, THEN THE Servidor SHALL responder con código de estado HTTP 404 y un cuerpo que indique que el recurso no fue encontrado.

### Requisito 5: Diseño responsive del sidebar

**User Story:** Como usuario, quiero que la aplicación sea usable en diferentes tamaños de pantalla, para poder acceder desde distintos dispositivos.

#### Criterios de Aceptación

1. WHILE el ancho del viewport es menor a 768px, THE Sidebar SHALL ocultarse automáticamente y mostrar un botón de menú (hamburguesa) para desplegarlo.
2. WHILE el ancho del viewport es igual o mayor a 768px, THE Sidebar SHALL permanecer visible de forma fija.
3. WHEN el usuario hace clic en el botón de menú en pantallas pequeñas, THE Sidebar SHALL desplegarse como overlay sobre el Área_De_Contenido, y el usuario podrá cerrarlo haciendo clic fuera del Sidebar o en un botón de cierre.
4. WHEN el usuario selecciona una Utilidad en el Sidebar desplegado, THE Sidebar SHALL cerrarse automáticamente en pantallas pequeñas.
5. WHILE el Sidebar está desplegado como overlay en pantallas pequeñas, THE Área_De_Contenido SHALL bloquear las interacciones del usuario hasta que el Sidebar se cierre.
6. WHEN el viewport cambia de tamaño cruzando el umbral de 768px, THE Sidebar SHALL transicionar entre su estado fijo y su estado oculto sin perder la selección de la Utilidad activa.

### Requisito 6: Internacionalización (i18n)

**User Story:** Como usuario, quiero poder usar la aplicación en mi idioma preferido, para tener una experiencia más cómoda y accesible.

#### Criterios de Aceptación

1. THE App_Shell SHALL presentar todos los textos visibles de la interfaz (etiquetas, botones, mensajes, placeholders y textos alternativos) traducidos al idioma activo, soportando los siguientes idiomas: inglés, español, italiano, portugués, alemán y japonés.
2. WHEN la aplicación se carga y existe una preferencia de idioma persistida del usuario, THE App_Shell SHALL utilizar el idioma persistido como idioma activo, ignorando el idioma del navegador.
3. WHEN la aplicación se carga por primera vez sin preferencia persistida, THE App_Shell SHALL detectar el idioma principal del navegador del usuario y seleccionar el idioma correspondiente si está disponible en los Idiomas_Soportados.
4. IF el idioma del navegador no está disponible en los Idiomas_Soportados y no existe preferencia persistida, THEN THE App_Shell SHALL utilizar inglés como idioma por defecto.
5. THE App_Shell SHALL mostrar un Selector_De_Idioma visible y operable desde cualquier pantalla que permita al usuario cambiar el idioma manualmente, listando los 6 idiomas soportados con su nombre nativo.
6. WHEN el usuario selecciona un idioma en el Selector_De_Idioma, THE App_Shell SHALL actualizar todos los textos visibles de la interfaz al idioma elegido en un máximo de 1 segundo y sin recargar la página.
7. WHEN el usuario selecciona un idioma en el Selector_De_Idioma, THE App_Shell SHALL persistir la preferencia de idioma en almacenamiento local del navegador de modo que sobreviva al cierre y reapertura del navegador.
8. IF el almacenamiento local no está disponible o la persistencia falla, THEN THE App_Shell SHALL aplicar el idioma seleccionado para la sesión actual sin mostrar error al usuario.

### Requisito 7: Imágenes locales de Digimon

**User Story:** Como desarrollador, quiero tener las imágenes de los Digimon almacenadas localmente en el proyecto, para que la aplicación funcione independientemente de la disponibilidad de servidores externos.

#### Criterios de Aceptación

1. THE App_Shell SHALL servir una imagen local en formato de imagen web (PNG, SVG o WebP) para cada uno de los 12 Digimon definidos en la aplicación.
2. THE Memory_Game_Helper SHALL referenciar las imágenes de Digimon exclusivamente desde rutas locales relativas al proyecto, sin dependencia de URLs externas.
3. IF una imagen local no puede cargarse (archivo inexistente o error de carga), THEN THE Memory_Game_Helper SHALL mostrar el nombre completo del Digimon como texto de respaldo cuando se muestra en tamaño grande, y una abreviación del nombre (máximo 3 caracteres) cuando se muestra en la vista miniatura del selector.
4. WHEN la aplicación se ejecuta sin conexión a internet, THE Memory_Game_Helper SHALL mostrar todas las imágenes de Digimon correctamente desde los archivos locales.

### Requisito 8: Calculador de ganancia pasiva — Configuración de recompensas

**User Story:** Como jugador, quiero configurar la cantidad de recursos que recibo cada 5 minutos según mi nivel actual, para que los cálculos de la aplicación reflejen mi situación real en el juego.

#### Criterios de Aceptación

1. THE Calculador_De_Ganancia_Pasiva SHALL permitir al usuario configurar la cantidad de Bits recibidos por cada Intervalo_De_Recompensa mediante un campo numérico que acepte valores enteros entre 0 y 999,999,999.
2. THE Calculador_De_Ganancia_Pasiva SHALL permitir al usuario configurar la cantidad de Tickets_De_Holograma recibidos por cada Intervalo_De_Recompensa mediante un campo numérico que acepte valores enteros entre 0 y 999,999,999.
3. THE Calculador_De_Ganancia_Pasiva SHALL permitir al usuario configurar la cantidad de Digiesmeraldas recibidas por cada Intervalo_De_Recompensa mediante un campo numérico que acepte valores enteros entre 0 y 999,999,999.
4. WHEN el usuario modifica el valor de cualquier campo de configuración de recompensas, THE Calculador_De_Ganancia_Pasiva SHALL persistir la configuración completa en el almacenamiento local del navegador.
5. WHEN el usuario regresa a la aplicación y existe una configuración previamente guardada, THE Calculador_De_Ganancia_Pasiva SHALL cargar la configuración de recompensas previamente guardada y mostrar los valores en los campos correspondientes.
6. IF no existe una configuración previamente guardada en el almacenamiento local, THEN THE Calculador_De_Ganancia_Pasiva SHALL mostrar todos los campos de configuración de recompensas con valor 0.
7. IF el usuario introduce un valor no numérico o fuera del rango permitido, THEN THE Calculador_De_Ganancia_Pasiva SHALL rechazar la entrada y mantener el último valor válido en el campo.

### Requisito 9: Calculador de ganancia pasiva — Cálculo de tiempo de espera

**User Story:** Como jugador, quiero saber cuánto tiempo necesito esperar para acumular una cantidad específica de recursos, para planificar mis sesiones de juego.

#### Criterios de Aceptación

1. THE Calculador_De_Ganancia_Pasiva SHALL permitir al usuario introducir la cantidad objetivo de uno o más recursos (Bits, Tickets_De_Holograma, Digiesmeraldas) como un número entero positivo entre 1 y 999,999,999.
2. WHEN el usuario introduce una cantidad objetivo, THE Calculador_De_Ganancia_Pasiva SHALL calcular el tiempo de espera necesario dividiendo la cantidad objetivo entre la ganancia configurada por Intervalo_De_Recompensa y redondeando hacia arriba al siguiente intervalo completo de 5 minutos.
3. THE Calculador_De_Ganancia_Pasiva SHALL mostrar el tiempo de espera en formato descompuesto: días (si el resultado es igual o superior a 24 horas), horas y minutos.
4. WHEN se solicitan múltiples recursos simultáneamente, THE Calculador_De_Ganancia_Pasiva SHALL mostrar el tiempo de espera más largo de entre todos los recursos solicitados como tiempo total necesario.
5. IF la ganancia configurada para un recurso solicitado es cero o no ha sido configurada, THEN THE Calculador_De_Ganancia_Pasiva SHALL mostrar un mensaje indicando que la configuración de recompensas es necesaria para ese recurso en lugar del tiempo de espera.

### Requisito 10: Calculador de ganancia pasiva — Cálculo de esmeraldas disponibles

**User Story:** Como jugador, quiero saber a qué hora puedo gastar mis esmeraldas y aún llegar con suficientes para las tiradas diarias, para optimizar el uso de mis recursos.

#### Criterios de Aceptación

1. THE Calculador_De_Ganancia_Pasiva SHALL permitir al usuario configurar la cantidad de Digiesmeraldas necesarias para las tiradas diarias como un valor entero entre 0 y 99999 (valor por defecto: 5700).
2. THE Calculador_De_Ganancia_Pasiva SHALL permitir al usuario configurar la hora a la que realiza las tiradas diarias en formato HH:MM de 24 horas (valor por defecto: 08:00).
3. THE Calculador_De_Ganancia_Pasiva SHALL permitir al usuario introducir su cantidad actual de Digiesmeraldas como un valor entero entre 0 y 99999 para realizar el cálculo.
4. WHEN el usuario solicita el cálculo, THE Calculador_De_Ganancia_Pasiva SHALL calcular la hora límite restando a la hora de tirada configurada el tiempo necesario para acumular las Digiesmeraldas objetivo partiendo de cero, utilizando la tasa de generación configurada en el Requisito 8.
5. WHEN el usuario solicita el cálculo, THE Calculador_De_Ganancia_Pasiva SHALL calcular las Digiesmeraldas disponibles para gastar como la cantidad actual menos las que necesita reservar para alcanzar el objetivo desde el momento actual hasta la hora de tirada configurada.
6. THE Calculador_De_Ganancia_Pasiva SHALL mostrar la hora límite calculada en formato HH:MM de 24 horas y la cantidad de Digiesmeraldas disponibles para gastar como número entero.
7. IF la hora actual ya supera la hora límite calculada, THEN THE Calculador_De_Ganancia_Pasiva SHALL indicar que no es posible gastar Digiesmeraldas y aún alcanzar el objetivo para la próxima tirada.
8. IF la hora de tirada configurada ya pasó en el día actual, THEN THE Calculador_De_Ganancia_Pasiva SHALL realizar el cálculo tomando como referencia la hora de tirada del día siguiente.

### Requisito 11: Sistema de versionado y changelog

**User Story:** Como desarrollador, quiero un sistema de versionado con changelog, para mantener un registro claro de todos los cambios realizados en la aplicación.

#### Criterios de Aceptación

1. THE App_Shell SHALL mostrar el número de versión actual de la aplicación en formato MAJOR.MINOR.PATCH en el footer de la interfaz.
2. THE Sistema_De_Versionado SHALL mantener un archivo Changelog en el proyecto que documente los cambios realizados en cada versión publicada, organizados por número de versión en orden descendente (más reciente primero).
3. THE Changelog SHALL seguir el formato de versionado semántico (MAJOR.MINOR.PATCH) para identificar cada versión, donde MAJOR indica cambios incompatibles, MINOR indica nueva funcionalidad compatible, y PATCH indica correcciones de errores.
4. WHEN se publica una nueva versión de la aplicación, THE Sistema_De_Versionado SHALL requerir una entrada en el Changelog que incluya el número de versión, la fecha en formato ISO 8601 (YYYY-MM-DD), y al menos una descripción de cambio categorizada.
5. THE Changelog SHALL organizar las entradas por fecha en formato ISO 8601 (YYYY-MM-DD) y categoría, utilizando exactamente las categorías: Añadido, Cambiado, Corregido, Eliminado.
6. IF se intenta publicar una versión sin entrada correspondiente en el Changelog, THEN THE Sistema_De_Versionado SHALL impedir la publicación e indicar un mensaje de error señalando la ausencia de documentación de cambios.
