# Dashboard de Monitoreo de Producción — Línea Galletas Noel

Aplicación web para centralizar los indicadores de producción, calidad e inventario de una línea de galletas en un tablero único, que agilice la toma de decisiones de supervisores y gerentes de planta.

> Proyecto de aula — Gerencia de Proyectos, Ingeniería Industrial, Universidad de Medellín (Cód. 6350, Grupo 161) · 2026-2

**Estado actual:** 🟡 Sprint 0 — configuración del repositorio y decisiones de arquitectura. Prototipo v0 (HU1 + HU2 + HU3) previsto para el 8 de septiembre de 2026. Entrega final con demo en vivo: 29 de octubre de 2026.

## Equipo

| Integrante | Rol Scrum |
|---|---|
| María Camila Tamayo Cuesta | Product Owner |
| Iván Santiago Cardona Monroy | Scrum Master |
| Juan Pablo Velásquez | Development Team |
| Juan José Galicia | Development Team — enfocado en pruebas |

Docente: Ronal Alexander Álvarez Valencia

## Arquitectura

Arquitectura de tres capas:

```
React (navegador)  ──REST/JSON──▶  Spring Boot  ──▶  PostgreSQL
     frontend                        backend
```

- **Frontend (React):** interfaz del tablero; consume la API únicamente vía REST/JSON.
- **Backend (Spring Boot):** concentra la lógica de negocio, incluido el cálculo de los indicadores; es el único componente que se conecta a la base de datos.
- **Base de datos (PostgreSQL):** almacena producción, calidad, mantenimiento, inventario y usuarios (diccionario de datos completo en `/docs`).

El canal de carga de archivo (CSV/Excel) hacia el backend es la ruta que se usará el 29 de octubre, cuando el docente entregue un archivo de datos distinto al de prueba.

## Estructura del repositorio

```
.
├── frontend/   # Aplicación React
├── backend/    # API Spring Boot
├── db/         # Esquema y scripts de PostgreSQL
└── docs/       # Informe del proyecto, evidencia de sprints, pruebas
```

## Funcionalidades (backlog priorizado)

| ID | Historia de usuario | Prioridad |
|---|---|---|
| HU1 | Panel principal con los KPI críticos de un vistazo | Alta |
| HU2 | Eficiencia de líneas por turno y fecha | Alta |
| HU3 | Carga de archivo (CSV/Excel) que recalcula el tablero | Alta — crítica para la demo final |
| HU4 | % de productos defectuosos por lote | Alta |
| HU5 | Alerta visual cuando un indicador sale de rango | Media |
| HU6 | Disponibilidad de maquinaria e historial de paradas | Media |
| HU7 | Inventario de materia prima y producto terminado | Media |
| HU8 | Desperdicio de materia prima por línea | Baja |

Criterios de aceptación completos en `/docs` (Anexo A del informe).

## Indicadores (KPI)

1. Eficiencia de líneas
2. Disponibilidad de maquinaria
3. Desperdicio de materia prima
4. % de productos defectuosos
5. Nivel de inventario (días de cobertura)
6. Producción por turno
7. Cumplimiento del plan de producción
8. Tiempo promedio de parada no programada
9. Rotación de inventario de producto terminado
10. Tiempo de ciclo de producción

Fórmula, unidad, frecuencia y fuente de cada indicador en `/docs` (Anexo B del informe).

## Stack tecnológico

- **Frontend:** React
- **Backend:** Spring Boot (Java)
- **Base de datos:** PostgreSQL
- **Control de versiones:** Git + GitHub · tablero en GitHub Projects

## Cómo ejecutar el proyecto

> Entorno en configuración durante el Sprint 0-1. Esta sección se completa con los comandos reales apenas el equipo defina la estructura final de `frontend/` y `backend/`.

```bash
# Backend (Spring Boot)
cd backend
./mvnw spring-boot:run

# Frontend (React)
cd frontend
npm install
npm start
```

Variables de entorno y configuración de la base de datos: ver `db/README.md` (pendiente de crear en el Sprint 1).

## Metodología

Trabajo en Scrum, con sprints semanales:

| Sprint | Fechas | Objetivo |
|---|---|---|
| Sprint 0 | 11-17 ago | Repo en GitHub, entorno, backlog refinado, decisiones de arquitectura |
| Sprint 1 | 18-24 ago | Esquema de BD + API REST básica + shell de React |
| Sprint 2 | 25-31 ago | HU1, HU2 y HU3 funcionando de extremo a extremo con datos de prueba |
| Sprint 3 | 1-7 sep | Pulir el v0, redactar el informe, ensayar la sustentación |
| Sprints 4-8 | 9 sep - 28 oct | Resto del backlog, pruebas, modelo de negocio y financiación |

**Tablero:** GitHub Projects — `Backlog → Sprint actual → En progreso → En revisión → Terminado`.

**Definición de terminado:**
- Código en `main` sin errores
- Probado con datos de prueba
- El commit hace referencia a la historia de usuario correspondiente
- Cumple sus criterios de aceptación
- Revisado por otro integrante del equipo (Pull Request)

## Pruebas

Plan de pruebas completo en `/docs` (Anexo D). La evidencia (capturas, resultados, fecha) se documenta en `/docs/pruebas`, por sprint.

## Documentación completa

El informe completo del proyecto —SIPOC, estrategia corporativa, business case, gestión del alcance y del riesgo, y fichas técnicas de los indicadores— está en [`/docs`](./docs).

## Licencia

Proyecto académico desarrollado para el curso de Gerencia de Proyectos, Universidad de Medellín. Uso educativo.