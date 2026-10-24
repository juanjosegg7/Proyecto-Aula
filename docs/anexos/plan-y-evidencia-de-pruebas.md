# Plan y evidencia de pruebas — Tablero de control Pan Trenza

## 1. Estrategia

| Nivel | Qué se prueba | Herramienta | Responsable |
|---|---|---|---|
| Unitario | Cálculo de indicadores, carta p, semáforo, lectura de CSV, reconocimiento de columnas, conversión de números/fechas, validaciones de HU-09 | `node --test` (`npm test`), carpeta `tests/` | Desarrolladores |
| Integración / extremo a extremo | Cargar archivo → tablero; mapeo manual; registro manual; filtros; persistencia; vista móvil | Navegador (Chromium) con Playwright y prueba manual | QA (María Camila) |
| Aceptación | Criterios de aceptación HU-09 a HU-16 | Lista de chequeo (sección 4) | QA + Scrum Master |
| Validación con el usuario | Uso del tablero por el responsable del proceso | Sesión guiada | Equipo |

## 2. Pruebas unitarias automatizadas

Ejecutar `npm test` (Node.js 18 o superior). Resultado al 24-10-2026: **19 pruebas, 19 aprobadas, 0 fallidas.**

| # | Prueba | Criterio cubierto |
|---|---|---|
| 1 | Reconoce encabezados con otros nombres, tildes y unidades | HU-15 |
| 2 | No confunde columnas de porcentaje con cantidades | HU-15 |
| 3 | Detecta la fila de encabezados bajo un título | HU-14 |
| 4 | Números con coma decimal y separador de miles | HU-14 |
| 5 | Fechas ISO, DD/MM/AAAA y serie de Excel | HU-14 |
| 6 | Valida filas y calcula aprobados = producidos − defectuosos | HU-09 CA2–CA4 |
| 7 | Acepta aprobados en lugar de defectuosos | HU-09 CA4 |
| 8 | Desperdicio en % (fracción o porcentaje) a kg | HU-10 CA5 |
| 9 | Suma tiempos de etapa cuando no hay tiempo total | HU-10 CA4 |
| 10 | Informa columnas obligatorias faltantes | HU-15 |
| 11 | Elige la hoja con datos entre varias | HU-14 |
| 12 | CSV con punto y coma, comillas y BOM | HU-14 |
| 13 | Fórmulas de las fichas con el lote de referencia (5,36 %, 94,64 %, 1,70 panes/min, 5 %) | HU-10 CA2–CA5 |
| 14 | Consolidado como razón de sumas | HU-10 CA6 |
| 15 | Sin tiempo o materia prima → N/D, sin división por cero | HU-10 |
| 16 | La simulación mensual coincide con la hoja *Indicadores* del Excel (4.928 panes, 226 defectuosos, 4,586 %, 0,5649 panes/min, 4,76 %) | HU-10 CA6, HU-12 CA2 |
| 17 | Carta p: límites 3σ y detección de un lote fuera de control | HU-12 |
| 18 | Semáforo frente a la meta | HU-16 |
| 19 | Tiempos por etapa y cuello de botella | HU-12 |

## 3. Pruebas extremo a extremo (navegador)

Archivos usados: la simulación del repositorio y dos archivos con formato distinto creados para simular el archivo del docente:
(a) Excel con título en la fila 1, encabezados «Fecha de producción, N° Lote, Operario, Unidades producidas, Rechazados, Tiempo de producción (min), Materia prima (kg), Merma (kg)», fechas de Excel, una fila «Total» y una fila con defectuosos > producidos;
(b) CSV en Windows-1252 con `;`, coma decimal, «Desperdicio %» y una fila con defectuosos negativos.

| Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| E1 | Usar datos de ejemplo | 44 lotes; 4.928 panes; 4,59 % defectos; 33,9 panes/h; 4,76 % desperdicio | Correcto |
| E2 | Cargar Excel (a) | Hoja y encabezados detectados; 30 lotes; fila 34 rechazada; fila Total ignorada; fechas convertidas | Correcto |
| E3 | Cargar CSV (b) | 3 lotes válidos; fila con −1 rechazada; % desperdicio convertido a kg | Correcto (4,50 %) |
| E4 | Guardar formulario vacío | Mensaje de campos obligatorios | Correcto |
| E5 | Defectuosos (200) > producidos (112) | Mensaje de error, no guarda | Correcto |
| E6 | Lote válido 112/6 | Aprobados = 106 automático; confirmación; aparece en tablero con filtro «manual» (5,36 %) | Correcto |
| E7 | Recargar la página | Se conservan archivo y lotes manuales | Correcto |
| E8 | Cambiar estado de HU en Backlog | La tarjeta cambia de columna y se conserva | Correcto |
| E9 | Vista móvil 390 px | Sin desplazamiento horizontal | Correcto (ancho 390 px) |
| E10 | Consola del navegador | Sin errores de JavaScript | Correcto |

## 4. Lista de chequeo de aceptación

| Historia | Criterio | Estado |
|---|---|---|
| HU-09 | CA1 fecha, lote y responsable · CA2 positivos · CA3 aprobados ≤ producidos · CA4 aprobados calculados · CA5 almacenado · CA6 confirmación | Cumple |
| HU-10 | CA1 automático · CA2–CA5 fórmulas · CA6 coinciden con los datos | Cumple |
| HU-11 | Fichas con nombre, objetivo, fórmula, unidad, frecuencia, responsable, fuente, meta y tipo; consultables | Cumple |
| HU-12 | Valores coinciden · filtro por periodo/lote · se actualiza con datos nuevos · gráficos de producción y defectos/desperdicio · web app | Cumple (los datos ya no vienen de Google Sheets: cambio aprobado, ver README) |
| HU-14 | Genera el tablero con un archivo distinto al de desarrollo | Cumple |
| HU-15 | Reconoce columnas, permite corregir la correspondencia y reporta filas inválidas | Cumple |
| HU-16 | Metas configurables, semáforo, exportar CSV e imprimir | Cumple |

## 5. Validación con el usuario

*Pendiente de diligenciar por el equipo:* fecha de la sesión, usuario (responsable del proceso), tareas realizadas (cargar archivo, filtrar, interpretar hallazgos), tiempo empleado, observaciones y ajustes resultantes.
