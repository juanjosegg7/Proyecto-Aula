# Planificación del Sprint 2

**Proyecto:** Sistema de monitoreo del proceso de fabricación de pan trenza  
**Tecnología:** Google Apps Script + Google Sheets + HTML + CSS + JavaScript  

---

## 1. Antecedentes

El Sprint 2 se ejecuta después del cierre del Sprint 1. En este sprint se continúa el desarrollo del sistema para la panadería de pan trenza, tomando como base los resultados y entregables obtenidos en el Sprint 1.

El Sprint 2 trabaja las historias HU-06 a HU-12. Los puntos 6 y 7 del proyecto permanecen fuera del alcance, de acuerdo con la planificación definida por el equipo.

---

## 2. Equipo y roles

| Integrante | Rol |
|---|---|
| Juan Pablo | Scrum Master |
| María Camila | QA |
| Juan José | Desarrollador |
| Iván Santiago | Desarrollador |

---

## 3. Objetivo del Sprint 2

Construir y validar los componentes necesarios para gestionar el backlog, visualizar el tablero Scrum, registrar la producción del pan trenza, calcular indicadores, documentar sus fichas técnicas, construir el dashboard de monitoreo y desarrollar la arquitectura y el prototipo V0 del sistema utilizando Google Apps Script.

---

## 4. Alcance del Sprint 2

Historias de usuario incluidas:

| ID | Responsable | Puntos |
|---|---|---|
| HU-06 | Juan Pablo | 2 |
| HU-07 | María Camila | 3 |
| HU-08 | Juan José | 4 |
| HU-09 | Iván Santiago | 5 |
| HU-10 | María Camila | 3 |
| HU-11 | Juan José | 13 |
| HU-12 | Iván Santiago | 13 |
| **TOTAL** | | **43** |

---

## 5. Detalle de las historias del Sprint 2

### HU-06 — Gestionar el backlog del producto
Como Scrum Master, quiero gestionar el Product Backlog en Google Sheets para organizar las historias de usuario, su prioridad, sprint, estado y puntos.
- **Criterios de aceptación:**
  - Registrar ID, nombre, prioridad, Sprint, estado y puntos.
  - Permitir prioridades Alta, Media y Baja.
  - Permitir estados Pendiente, En desarrollo, En revisión y Terminada.
  - Guardar la información en la hoja BACKLOG.
  - Permitir consultar y actualizar las historias.

### HU-07 — Visualizar tablero Scrum
Como QA, quiero visualizar un tablero Scrum para conocer el estado de cada historia y facilitar el seguimiento del avance.
- **Criterios de aceptación:**
  - Mostrar las columnas Backlog, Por hacer, En desarrollo, En revisión y Terminado.
  - Mostrar las historias como tarjetas.
  - Permitir actualizar el estado.
  - Permitir filtrar por Sprint.
  - Usar la información registrada en BACKLOG.

### HU-08 — Registrar datos de producción del pan trenza
Como desarrollador, quiero registrar los datos de cada lote de producción para almacenar la información necesaria para calcular indicadores.
- **Criterios de aceptación:**
  - Registrar fecha, lote, responsable, masa, unidades producidas, defectuosas y aprobadas.
  - Registrar tiempo de producción y materia prima utilizada/desperdiciada.
  - Validar que los valores numéricos sean positivos.
  - Validar que las unidades aprobadas no superen las producidas.
  - Permitir calcular aprobadas = producidas - defectuosas.
  - Guardar los registros en PRODUCCION.

### HU-09 — Calcular indicadores de producción
Como desarrollador, quiero calcular indicadores de producción para medir el desempeño del proceso de fabricación de pan trenza.
- **Criterios de aceptación:**
  - Calcular porcentaje de defectos = defectuosas / producidas × 100.
  - Calcular porcentaje de aprobación = aprobadas / producidas × 100.
  - Calcular productividad = producidas / tiempo de producción.
  - Calcular porcentaje de desperdicio = desperdicio / materia prima utilizada × 100.
  - Los cálculos deben utilizar los datos almacenados en PRODUCCION.

### HU-10 — Crear fichas técnicas de los indicadores
Como QA, quiero documentar las fichas técnicas de los indicadores para establecer claramente qué mide cada indicador y cómo se calcula.
- **Criterios de aceptación:**
  - Registrar nombre, objetivo, fórmula, unidad y frecuencia.
  - Registrar responsable, fuente, meta y tipo de indicador.
  - Incluir las fichas de defectos, aprobación, productividad y desperdicio.
  - Guardar la información de forma organizada.
  - Permitir consultar las fichas para validar los indicadores.

### HU-11 — Construir dashboard de monitoreo
Como desarrollador, quiero construir un dashboard de monitoreo para visualizar el comportamiento de la producción del pan trenza.
- **Criterios de aceptación:**
  - Construir la interfaz utilizando HTML y CSS.
  - Obtener los datos mediante Google Apps Script.
  - Mostrar producción, aprobados, defectuosos, desperdicio, productividad y tiempo promedio.
  - Permitir filtros por fecha, lote o periodo.
  - Mostrar gráficos de los indicadores.
  - Actualizar la información a partir de PRODUCCION.
  - Publicar el dashboard como Web App de Apps Script.

### HU-12 — Construir arquitectura y prototipo V0
Como desarrollador, quiero construir la arquitectura y el prototipo V0 del sistema para establecer la estructura inicial de la aplicación.
- **Criterios de aceptación:**
  - Definir interfaz, backend y almacenamiento.
  - Utilizar HTML, CSS y JavaScript en la interfaz.
  - Utilizar Google Apps Script como backend.
  - Utilizar Google Sheets como almacenamiento.
  - Construir una pantalla principal y menú.
  - Incluir módulos Empresa, SIPOC, Estrategia, Proyecto, Producción, Indicadores y Dashboard.
  - Definir funciones principales de Apps Script.
  - Validar la comunicación entre frontend, backend y Google Sheets.

---

## 6. Planificación del Sprint

La planificación se realizará al finalizar el Sprint 1. En la reunión de Sprint Planning se revisará el objetivo, la capacidad del equipo, las historias seleccionadas, sus criterios de aceptación y las dependencias entre historias. El equipo podrá ajustar el orden de ejecución sin modificar el alcance definido sin una decisión explícita del equipo.

---

## 7. Orden recomendado de ejecución

| Orden | Actividad | Responsable |
|---|---|---|
| 1 | HU-06 | Juan Pablo |
| 2 | HU-07 | María Camila |
| 3 | HU-12 | Iván Santiago |
| 4 | HU-08 | Juan José |
| 5 | HU-09 | Iván Santiago |
| 6 | HU-10 | María Camila |
| 7 | HU-11 | Juan José |

---

## 8. Seguimiento del Sprint

Se realizarán reuniones de seguimiento en los días intermedios definidos por el equipo. En cada reunión se revisará el avance, bloqueos, historias en desarrollo, historias esperando QA y posibles correcciones.
- Revisar qué historias avanzaron desde la reunión anterior.
- Identificar bloqueos técnicos o de información.
- Verificar que los criterios de aceptación estén siendo considerados.
- Identificar historias listas para pasar a revisión QA.
- Registrar observaciones y responsables de las correcciones.

---

## 9. Flujo obligatorio de QA

Ninguna historia de usuario puede pasar directamente de 'En desarrollo' a 'Terminada'. Antes de finalizar cualquier historia, María Camila debe realizar la revisión de QA.

**Flujo de estados:**
```
POR HACER → EN DESARROLLO → EN REVISIÓN QA → TERMINADA
```

### 9.1 Procedimiento de aprobación
1. El responsable toma la historia y la coloca en **'En desarrollo'**.
2. El responsable implementa o completa la historia según sus criterios de aceptación.
3. Cuando considera que está lista, la pasa a **'En revisión QA'**.
4. María Camila realiza la revisión y las pruebas correspondientes.
5. Si cumple todos los criterios, QA la aprueba y se cambia a **'Terminada'**.
6. Si existe algún incumplimiento, QA registra la observación y la historia regresa a **'En desarrollo'**.
7. Después de corregirla, debe volver a pasar por QA antes de quedar **'Terminada'**.

### 9.2 Aplicación del QA a las historias

| Historia | Responsable | Revisión QA | Condición de terminación |
|---|---|---|---|
| HU-06 | Juan Pablo | María Camila | QA verifica criterios y aprueba. |
| HU-07 | María Camila | María Camila + segunda revisión de Juan Pablo | Revisión aprobada. |
| HU-08 | Juan José | María Camila | Pruebas y criterios aprobados. |
| HU-09 | Iván Santiago | María Camila | Cálculos y criterios aprobados. |
| HU-10 | María Camila | María Camila + segunda revisión de Juan Pablo | Revisión aprobada. |
| HU-11 | Juan José | María Camila | Funcionalidad y criterios aprobados. |
| HU-12 | Iván Santiago | María Camila | Arquitectura, prototipo y criterios aprobados. |

---

## 10. Responsabilidades del equipo

| Integrante | Rol | Responsabilidades |
|---|---|---|
| Juan Pablo | Scrum Master | HU-06. Organizar backlog, facilitar seguimiento y remover bloqueos. |
| María Camila | QA | HU-07 y HU-10. Revisar además todas las historias antes de marcarlas como Terminadas. |
| Juan José | Desarrollador | HU-08 y HU-11. Implementar registro de producción y dashboard. |
| Iván Santiago | Desarrollador | HU-09 y HU-12. Implementar indicadores y arquitectura/prototipo V0. |

---

## 11. Dependencias entre historias

- **HU-06** debe estar organizada para facilitar el seguimiento de las historias del Sprint.
- **HU-12** define la base de arquitectura que utilizarán los componentes de desarrollo.
- **HU-08** proporciona los datos utilizados por **HU-09**.
- **HU-09** proporciona indicadores que serán utilizados en **HU-10** y **HU-11**.
- **HU-10** documenta las características de los indicadores que serán mostrados en el dashboard.
- **HU-11** integra información de producción e indicadores para el monitoreo.

---

## 12. Definition of Done

1. La historia cumple todos sus criterios de aceptación.
2. El responsable terminó la funcionalidad o documentación correspondiente.
3. La historia fue colocada en 'En revisión QA'.
4. María Camila realizó la revisión y las pruebas correspondientes.
5. Las observaciones encontradas fueron corregidas cuando fue necesario.
6. La historia volvió a pasar por QA después de las correcciones.
7. QA aprobó formalmente la historia.
8. La información se guarda y consulta correctamente cuando la historia lo requiere.
9. No existen errores conocidos que impidan demostrar la historia.
10. El estado final de la historia es 'Terminada'.

---

## 13. Criterios de éxito del Sprint 2

- Las siete historias del Sprint 2 fueron trabajadas según el alcance definido.
- Los componentes de Google Apps Script y Google Sheets funcionan de acuerdo con los criterios de cada historia.
- El registro de producción permite almacenar datos válidos del proceso de pan trenza.
- Los indicadores se calculan con las fórmulas definidas.
- El dashboard permite consultar la información de producción e indicadores.
- Existe una arquitectura y un prototipo V0 funcional para continuar el proyecto.
- Cada historia presentada como Terminada cuenta con revisión y aprobación de QA.

---

## 14. Sprint Review y Retrospective

Al cierre del Sprint 2 se realizará la Sprint Review para demostrar las historias terminadas y verificar el cumplimiento de sus criterios de aceptación. Posteriormente se realizará la Sprint Retrospective para identificar qué funcionó bien, qué dificultades se presentaron y qué acciones de mejora se aplicarán al siguiente ciclo.

---

## 15. Regla general del equipo

> **NINGUNA HISTORIA DE USUARIO SE CONSIDERA TERMINADA HASTA QUE QA LA REVISE Y LA APRUEBE.**

---

## 16. Cronograma del Sprint 2

El Sprint 2 se desarrollará dentro del periodo definido por el equipo y tendrá como fecha de cierre el 29 de septiembre de 2026. El 29 de septiembre se realizará la Sprint Review y la Sprint Retrospective. Las historias que no hayan sido revisadas y aprobadas por QA antes del cierre no podrán registrarse como 'Terminadas'.

| Fecha | Actividad | Resultado esperado |
|---|---|---|
| 26 de septiembre de 2026 | Inicio / ejecución Sprint 2 | Inicio de HU-06, HU-07 y preparación de HU-12. |
| 26 de septiembre de 2026 | Continuación de desarrollo | Avance de backlog, tablero y arquitectura/prototipo. |
| 26 de septiembre de 2026 | Seguimiento | Revisión de avances, bloqueos y posibles historias para QA. |
| 27 de septiembre de 2026 | Desarrollo | Avance de HU-08 y HU-09; continuación de HU-10 y HU-12. |
| 27 de septiembre de 2026 | Seguimiento | Validación de avances y preparación de historias para QA. |
| 28 de septiembre de 2026 | Desarrollo e integración | Avance de HU-11 e integración con producción e indicadores. |
| 28 de septiembre de 2026 | Cierre técnico y QA | Correcciones finales y revisión QA de las historias pendientes. |
| 29 de septiembre de 2026 | Sprint Review + Retrospective | Demostración, validación de historias y cierre del Sprint 2. |

---

## 17. Regla de cierre al 29 de septiembre

> **FECHA LÍMITE: 29 DE SEPTIEMBRE DE 2026 — TODA HISTORIA DEBE HABER PASADO POR QA ANTES DE SER MARCADA COMO TERMINADA.**
