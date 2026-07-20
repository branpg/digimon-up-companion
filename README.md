# Digimon UP Companion

Aplicación web companion multi-utilidad para el juego **Digimon**, con navegación lateral (sidebar) y arquitectura modular para alojar diferentes herramientas.

## Funcionalidades

### App Shell con Sidebar
- Navegación lateral fija con lista de utilidades disponibles
- Área de contenido dinámica que carga módulos independientes
- Diseño responsive: sidebar fijo en desktop (≥768px), menú hamburguesa en móvil
- Preservación de estado entre cambios de utilidad

### Memory Game Helper
- Tablero visual de 24 casillas (4×6) para trackear posiciones de memoria
- Selección rápida entre 12 Digimon con iconos locales
- Deshacer última asignación e historial de acciones
- Modo pantalla completa optimizado para jugar en mesa
- Imágenes almacenadas localmente (funciona sin conexión)

### Calculador de Ganancia Pasiva
- Configuración de recursos obtenidos cada 5 minutos: Bits, Tickets de Holograma y Digiesmeraldas
- Cálculo de tiempo de espera para acumular una cantidad objetivo de recursos
- Cálculo de esmeraldas disponibles para gastar sin comprometer las tiradas diarias
- Hora límite para gastar recursos según la hora de tirada configurada
- Persistencia de configuración en almacenamiento local

### Internacionalización (i18n)
- 6 idiomas soportados: inglés, español, italiano, portugués, alemán y japonés
- Detección automática del idioma del navegador
- Selector de idioma accesible desde cualquier pantalla
- Persistencia de preferencia en localStorage

### Sistema de Versionado
- Versionado semántico (MAJOR.MINOR.PATCH)
- Changelog con categorías: Añadido, Cambiado, Corregido, Eliminado
- Versión visible en el footer de la aplicación

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla, sin frameworks)
- **Servidor**: Node.js vanilla (`http` + `fs`), 0 dependencias externas
- **Carga de módulos**: Fetch dinámico con aislamiento CSS por prefijo de clase
- **i18n**: Archivos JSON por locale con carga bajo demanda
- **Tests**: Vitest + fast-check (property-based testing) + Playwright (E2E)

## Estructura del Proyecto

```
├── server.js                    # Servidor estático Node.js
├── CHANGELOG.md                 # Historial de cambios
├── package.json                 # Metadatos y script de inicio
├── public/                      # Directorio raíz servido
│   ├── index.html               # App Shell (SPA entry point)
│   ├── css/app-shell.css
│   ├── js/
│   │   ├── app.js               # Inicialización
│   │   ├── router.js            # Carga dinámica de módulos
│   │   ├── i18n.js              # Internacionalización
│   │   └── registry.js          # Registro de módulos
│   ├── config/modules.json      # Registro central de utilidades
│   ├── locales/                 # Traducciones (en, es, it, pt, de, ja)
│   ├── assets/img/digimon/      # Imágenes PNG locales
│   └── modules/
│       ├── memory-helper/       # Módulo Memory Game Helper
│       └── passive-calc/        # Módulo Calculador de Ganancia Pasiva
```

## Uso

```bash
# Clonar el repositorio
git clone https://github.com/branpg/digimon-up-companion.git
cd digimon-up-companion

# Iniciar el servidor
node server.js [directorio] [puerto]
# Por defecto: ./public en puerto 8080
```

## Arquitectura Modular

Para añadir una nueva utilidad solo hace falta:
1. Crear el directorio del módulo en `public/modules/` con su HTML, CSS y JS
2. Añadir una entrada en `public/config/modules.json`

No es necesario modificar ningún otro archivo existente.

## Contribuir

1. Fork del repositorio
2. Crear una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de los cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

## Licencia

MIT
