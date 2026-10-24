# Sistema de Monitoreo del Proceso de Fabricación de Pan Trenza

Aplicación web que **genera el tablero de control del proceso de fabricación de pan trenza a partir de un archivo de datos de producción** (Excel o CSV, una fila por lote) o de lotes registrados manualmente. Calcula los indicadores de las fichas técnicas (% defectos, % aprobación, productividad, % desperdicio y tiempo promedio), los compara con metas y muestra gráficos, carta de control p y hallazgos automáticos.

- **Aplicación:** https://juanjosegg7.github.io/Proyecto-Aula/ (GitHub Pages) · sin internet: abrir `frontend/index.html`
- **Repositorio:** https://github.com/juanjosegg7/Proyecto-Aula

> Proyecto de aula — Gerencia de Proyectos, Ingeniería Industrial, Universidad de Medellín (Cód. 6350, Grupo 161) · 2026-2

**Estado actual:** 🟢 Sprint 3 — aplicación reconstruida: el tablero se genera con cualquier archivo de producción (requisito de la demostración en vivo de la entrega final).

## Equipo

| Integrante | Rol | Función |
|---|---|---|
| Juan Pablo | Scrum Master | Facilitar Scrum y responsable de historias de gestión/documentación |
| María Camila | QA | Pruebas, validación y apoyo en historias no técnicas |
| Juan José | Desarrollador | Desarrollo técnico de la aplicación (Sprint 2) |
| Iván Santiago | Desarrollador | Desarrollo técnico de la aplicación (Sprint 2) |

Docente: Ronal Alexander Álvarez Valencia

## Arquitectura

```
Archivo Excel/CSV ─┐
                   ├─► Importador ─► Indicadores ─► Tablero (tarjetas, gráficos, carta p, hallazgos)
Formulario de lote ┘   (mapeo y      (fórmulas de     │
                        validación)   las fichas)     └─► Exportar CSV / Imprimir PDF
```

- **Interfaz (`frontend/index.html`, `css/`, `js/app.js`):** HTML, CSS y JavaScript sin framework.
- **Importador (`js/importador.js`):** lee Excel (SheetJS) o CSV, encuentra la hoja y la fila de encabezados, reconoce las columnas por sinónimos (diccionario de datos), permite corregir la correspondencia y valida cada fila (reglas de HU-09).
- **Indicadores (`js/indicadores.js`):** cálculos puros y probados: consolidados por razón de sumas, agrupación por periodo, carta p con límites 3σ, tiempos por etapa y semáforo.
- **Almacenamiento:** `localStorage` del navegador (último archivo, lotes manuales, metas y estado del backlog). El archivo nunca sale del equipo.
- **Despliegue:** sitio estático en GitHub Pages; también funciona abriendo el archivo localmente, sin servidor ni internet.

### Cambio de arquitectura (control de cambios)

La versión anterior (Google Apps Script + Google Sheets) fue rechazada en la revisión. Problemas: el código no quedaba en el repositorio, dependía de una hoja de cálculo y no podía generar el tablero con un archivo distinto. Decisión: reconstruir como aplicación web estática con código propio versionado en Git. El tablero se genera con cualquier archivo que entregue el docente, y los indicadores quedan cubiertos por pruebas automáticas. Las historias HU-14 a HU-16 se agregaron al backlog (Sprint 3).

## Estructura del repositorio

```
.
├── index.html                 # Redirige a la aplicación (GitHub Pages)
├── frontend/
│   ├── index.html             # Aplicación
│   ├── css/styles.css
│   ├── js/importador.js       # Lectura, mapeo y validación de archivos
│   ├── js/indicadores.js      # Fórmulas de los indicadores
│   ├── js/contenido.js        # Fichas técnicas, empresa, SIPOC y backlog
│   ├── js/app.js              # Interfaz y gráficos
│   ├── datos/                 # Datos de ejemplo (simulación) en CSV
│   └── vendor/                # Chart.js 4.4.1 (MIT) y SheetJS 0.18.5 (Apache 2.0)
├── tests/                     # Pruebas unitarias (node --test)
├── docs/                      # Historias de usuario, fichas, business case, simulación
│   └── anexos/                # Diccionario de datos, manual, plan de pruebas, declaración de IA
└── planings/                  # Planificación de sprints
```

## Cómo ejecutar

- **Usar:** abrir https://juanjosegg7.github.io/Proyecto-Aula/ o `frontend/index.html` con doble clic. Cargar un archivo en «Cargar datos» o usar los datos de ejemplo.
- **Pruebas:** `npm test` (requiere Node.js 18 o superior; no hay dependencias que instalar).
- **Servidor local opcional:** `npm start` y abrir http://localhost:8080/frontend/.

## Backlog priorizado

### Sprint 1 — Gestión y documentación (Juan Pablo + María Camila)

| ID | Historia de usuario | Responsable | Puntos |
|---|---|---|---|
| HU-01 | Registrar información de la panadería y del proceso ([docs/hu-01-informacion-empresa-proceso.md](docs/hu-01-informacion-empresa-proceso.md)) | Juan Pablo | 3 |
| HU-02 | Registrar el SIPOC del proceso | María Camila | 4 |
| HU-03 | Registrar la estrategia corporativa y el objetivo ([docs/hu-03-estrategia-corporativa-objetivo.md](docs/hu-03-estrategia-corporativa-objetivo.md)) | Juan Pablo | 3 |
| HU-04 | Registrar portafolio, programa y proyecto | María Camila | 2 |
| HU-05 | Clasificar el proyecto ([docs/hu-05-clasificacion-del-proyecto.md](docs/hu-05-clasificacion-del-proyecto.md)) | Juan Pablo | 2 |
| HU-06 | Registrar prefactibilidad y factibilidad ([docs/hu-06-business-case-factibilidad.md](docs/hu-06-business-case-factibilidad.md)) | María Camila | 4 |

### Sprint 2 — Desarrollo de la aplicación (Juan José + Iván Santiago)

| ID | Historia de usuario | Responsable | Puntos |
|---|---|---|---|
| HU-07 | Gestión del alcance | Juan Pablo | 2 |
| HU-08 | Gestión del riesgo | María Camila | 3 |
| HU-09 | Registrar datos de producción diaria | Juan José | 4 |
| HU-10 | Calcular y visualizar indicadores | Iván Santiago | 5 |
| HU-11 | Documentar pruebas y validaciones | María Camila | 3 |
| HU-12 | Construir módulos de registro y consulta | Juan José | 13 |
| HU-13 | Construir arquitectura y prototipo V0 | Iván Santiago | 13 |

### Sprint 3 — Reconstrucción de la aplicación

| ID | Historia de usuario | Responsable | Puntos |
|---|---|---|---|
| HU-14 | Generar el tablero a partir de un archivo de datos (Excel/CSV) | Juan José | 8 |
| HU-15 | Reconocer y validar columnas del archivo (diccionario de datos) | Iván Santiago | 5 |
| HU-16 | Configurar metas, alertas y exportar el tablero | Juan José | 3 |

**Total: 75 puntos**

## Stack tecnológico y justificación

| Componente | Elección | Justificación |
|---|---|---|
| Interfaz | HTML + CSS + JavaScript (sin framework) | Costo cero, curva de aprendizaje baja (lo que el equipo ya sabía), sin compilación |
| Gráficos | Chart.js 4.4.1 | Licencia MIT, documentación amplia, liviana |
| Lectura de Excel | SheetJS 0.18.5 | Licencia Apache 2.0; lee .xlsx, .xls y .ods en el navegador |
| Almacenamiento | localStorage del navegador | Sin servidor ni cuentas; los datos de la panadería no salen del equipo |
| Despliegue | GitHub Pages | Gratis, ligado al repositorio; también funciona sin internet |
| Pruebas | `node:test` | Incluido en Node.js, sin dependencias |
| Versiones | Git + GitHub · tablero en [GitHub Projects](https://github.com/users/juanjosegg7/projects/1/views/1?system_template=kanban) | Evidencia de la ejecución por sprints |

Sostenibilidad: las librerías van dentro del repositorio (`frontend/vendor/`), así que la aplicación no depende de servicios externos ni de versiones remotas.

## Metodología

Trabajo en Scrum con sprints semanales.

**Definición de terminado (Definition of Done):**
- La historia cumple todos sus criterios de aceptación
- La funcionalidad o documentación correspondiente está completa
- Cuando corresponde, los datos se guardan y consultan correctamente
- Las pruebas automáticas (`npm test`) pasan
- Las funcionalidades desarrolladas son probadas por QA (María Camila)
- No existen errores conocidos que impidan demostrar la historia
- La historia puede presentarse en la revisión del Sprint
- El responsable y QA validan el cumplimiento de los criterios

## Pruebas

Plan y evidencia en [docs/anexos/plan-y-evidencia-de-pruebas.md](docs/anexos/plan-y-evidencia-de-pruebas.md). Anexos: [diccionario de datos](docs/anexos/diccionario-de-datos.md), [manual de usuario](docs/anexos/manual-de-usuario.md), [declaración de uso de IA](docs/anexos/declaracion-uso-ia.md).

## Licencia

Proyecto académico desarrollado para el curso de Gerencia de Proyectos, Universidad de Medellín. Uso educativo.
