# Sistema de Monitoreo del Proceso de Fabricación de Pan Trenza

Aplicación web para registrar, monitorear y visualizar los indicadores del proceso de fabricación de pan trenza, que centraliza la información en un tablero único para agilizar la toma de decisiones.

> Proyecto de aula — Gerencia de Proyectos, Ingeniería Industrial, Universidad de Medellín (Cód. 6350, Grupo 161) · 2026-2

**Estado actual:** 🟡 Sprint 1 en curso — definición de empresa, proceso, SIPOC, estrategia, portafolio y clasificación.

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
Usuario → HTML/CSS/JS → Google Apps Script → Google Sheets → Dashboard
```

- **Frontend (HTML/CSS/JS):** interfaz web que el usuario opera directamente.
- **Backend (Google Apps Script):** lógica de negocio; guarda y consulta datos en Google Sheets.
- **Base de datos (Google Sheets):** almacena la información en hojas separadas por módulo (EMPRESA, SIPOC, ESTRATEGIA, PROYECTO, PRODUCCIÓN, INDICADORES).
- **Despliegue:** Google Apps Script Web App — sin servidor externo.

## Estructura del repositorio

```
.
├── frontend/    # HTML, CSS y JavaScript de la interfaz
├── backend/     # Código de Google Apps Script
├── docs/        # Informe, evidencia de sprints y pruebas
```

## Backlog priorizado

### Sprint 1 — Gestión y documentación (Juan Pablo + María Camila)

| ID | Historia de usuario | Responsable | Puntos |
|---|---|---|---|
| HU-01 | Registrar información de la panadería y del proceso | Juan Pablo | 3 |
| HU-02 | Registrar el SIPOC del proceso | María Camila | 4 |
| HU-03 | Registrar la estrategia corporativa y el objetivo | Juan Pablo | 3 |
| HU-04 | Registrar portafolio, programa y proyecto | María Camila | 2 |
| HU-05 | Clasificar el proyecto | Juan Pablo | 2 |
| HU-06 | Registrar prefactibilidad y factibilidad | María Camila | 4 |

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

**Total: 59 puntos**

## Stack tecnológico

- **Frontend:** HTML + CSS + JavaScript
- **Backend:** Google Apps Script
- **Base de datos:** Google Sheets
- **Despliegue:** Google Apps Script Web App
- **Control de versiones:** Git + GitHub · tablero en [GitHub Projects](https://github.com/users/juanjosegg7/projects/1/views/1?system_template=kanban)

## Metodología

Trabajo en Scrum con sprints semanales.

**Definición de terminado (Definition of Done):**
- La historia cumple todos sus criterios de aceptación
- La funcionalidad o documentación correspondiente está completa
- Cuando corresponde, los datos se guardan y consultan correctamente en Google Sheets
- Las funcionalidades desarrolladas son probadas por QA (María Camila)
- No existen errores conocidos que impidan demostrar la historia
- La historia puede presentarse en la revisión del Sprint
- El responsable y QA validan el cumplimiento de los criterios

## Pruebas

La evidencia de pruebas (capturas, resultados, fecha) se documenta en `/docs/pruebas`, por sprint.

## Licencia

Proyecto académico desarrollado para el curso de Gerencia de Proyectos, Universidad de Medellín. Uso educativo.
