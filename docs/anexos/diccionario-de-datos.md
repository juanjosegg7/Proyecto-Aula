# Diccionario de datos — Tablero de control Pan Trenza

Archivo de entrada: Excel (`.xlsx`, `.xls`, `.ods`) o CSV (separador `,`, `;` o tabulador). **Una fila por lote.**
Si el libro tiene varias hojas, la aplicación elige la que tiene más columnas reconocidas (el usuario puede cambiarla).
La fila de encabezados puede estar debajo de un título (se busca en las primeras 15 filas).

## Campos del lote

| Campo interno | Nombre en la app | Tipo / unidad | ¿Obligatorio? | Encabezados que se reconocen automáticamente | Regla de validación |
|---|---|---|---|---|---|
| `fecha` | Fecha | fecha (AAAA-MM-DD, DD/MM/AAAA o fecha de Excel) | No* | Fecha, Fecha de producción, Fecha lote | — |
| `dia` | Día | entero | No* | Día, Jornada, Día de producción | — |
| `lote` | Lote | texto | No (si falta se numera) | Lote, Código lote, N° Lote, Número de lote, Batch | — |
| `responsable` | Responsable | texto | No | Responsable, Operario, Panadero, Encargado | — |
| `masa` | Masa preparada | kg | No | Masa, Masa preparada (kg) | > 0 |
| `producidos` | Panes producidos | unidades | **Sí** | Panes, Panes producidos, Producidos, Unidades producidas, Producción | > 0 |
| `defectuosos` | Panes defectuosos | unidades | **Sí** (o aprobados) | Defectuosos, Defectos, Rechazados, No conformes | ≥ 0 y ≤ producidos |
| `aprobados` | Panes aprobados | unidades | No (se calcula) | Aprobados, Unidades aprobadas, Conformes | ≤ producidos; si falta: producidos − defectuosos |
| `tiempo` | Tiempo de producción | min | No** | Tiempo total, Tiempo, Tiempo de producción (min), Duración | > 0 |
| `materia` | Materia prima utilizada | kg | No** | Material kg, Materia prima, Materia prima utilizada (kg) | > 0 |
| `desperdicio` | Materia prima desperdiciada | kg | No** | Desperdicio, Desperdicio kg, Merma (kg) | ≥ 0 y ≤ materia prima |
| `desperdicioPct` | Desperdicio (%) | % o fracción | No | Desperdicio %, % desperdicio, Merma % | Se convierte a kg = materia × % |
| `etapas` | Tiempo por etapa | min | No | Dosificación, Mezclado, Amasado, Cilindro, Multiformadora, Moldeo, Enbolado, Fermentación, Horneo, Empaque, Pesaje, División, Formado, Horneado, Enfriamiento | Si no hay tiempo total, se suman |

\* El periodo del tablero es la fecha; si no existe, el día; si tampoco existe, cada lote es un periodo.
\** Sin tiempo no se calcula la productividad; sin materia prima y desperdicio no se calcula el % de desperdicio (el tablero muestra N/D).

Reglas generales:

- Los encabezados se comparan sin tildes, mayúsculas ni signos. Columnas con `%` no se toman como cantidades.
- Se aceptan números con coma decimal (`4,5`) y separador de miles (`1.234,5`).
- Las filas vacías y las filas de totales (`Total`, `Promedio`, `Suma`) se ignoran.
- Las filas que incumplen una regla no se cargan y se listan con su número de fila y el motivo.
- Si el archivo trae aprobados y defectuosos y no cuadran, se usa producidos − defectuosos y se muestra una advertencia.
- Si alguna columna no se reconoce, el usuario la asigna en «Cargar datos › Correspondencia de columnas».

## Indicadores calculados

| Indicador | Fórmula | Unidad |
|---|---|---|
| % defectos | Σ defectuosos / Σ producidos × 100 | % |
| % producción aprobada | Σ aprobados / Σ producidos × 100 | % |
| Productividad | Σ producidos / Σ tiempo | panes/min (× 60 = panes/h) |
| % desperdicio | Σ desperdicio / Σ materia prima × 100 | % |
| Tiempo promedio por lote | Σ tiempo / n.º de lotes | min |
| Carta p | p̄ = Σ defectuosos / Σ producidos; LSC/LIC = p̄ ± 3·√(p̄(1−p̄)/nᵢ) | fracción |

Los consolidados se calculan como razón de sumas (no promedio de porcentajes), por lo que coinciden con los totales del periodo.

## Base relacional OEE (segundo formato de entrada)

Si el libro trae una hoja de **producción** con máquina, fecha, turno y unidades, y al menos una tabla relacionada (paros, turnos o productos), la aplicación cambia al **tablero OEE**. Cada tabla se reconoce por sus columnas (en inglés o español), sin importar el nombre de la hoja.

| Tabla | Columnas obligatorias | Columnas opcionales | Uso |
|---|---|---|---|
| Producción (hechos) | `machine_id`, `shift_date`, `shift_id`, `units_produced` | `units_defective`, `product_id`, `order_id`, `duration_min`, `timestamp_start`, `timestamp_end`, `operator_id` | Unidades, calidad, tiempo ideal, horas-hombre |
| Paros (hechos) | `machine_id`, `shift_date`, `shift_id`, `reason_id`, `duration_min` | `timestamp_start`, `timestamp_end` | Disponibilidad y Pareto |
| Productos | `product_id`, `std_cycle_time_sec` | `product_name`, `std_units_per_cycle` (1 si falta) | Tiempo ideal por unidad = ciclo / unidades por ciclo |
| Turnos | `shift_id`, `duration_min` | — | Tiempo base del turno |
| Motivos de paro | `reason_id` y `ppt_excluded` (Y/N) o `type` | `reason_name` | `Y` = se resta del tiempo programado (pausas, almuerzo) |
| Máquinas | `machine_id` y `machine_name` o `line` | — | Nombres y filtro por línea |
| Operadores | `operator_id`, `operator_name` | — | Nombres en productividad de mano de obra |
| Pedidos *(para SLA)* | `order_id`, `due_date`, `delivery_date` | `qty_ordered`, `qty_delivered` | Pedido a tiempo = entrega ≤ compromiso (y completo) |
| Ventas *(para % no vendido)* | `units_sold` | `fecha`, `product_id`, `units_unsold` | % no vendido |

También se aceptan nombres en español: máquina/equipo/horno, fecha, turno, producto, unidades producidas, defectuosas, duración, motivo, operario, tiempo de ciclo, unidades por ciclo, fecha compromiso, fecha de entrega, unidades vendidas, etc. (lista completa en `frontend/js/oee.js`).

### Fórmulas (iguales a la hoja OEE de referencia)

Por máquina, fecha y turno:

| Columna | Fórmula |
|---|---|
| Tiempo base | duración del turno (tabla de turnos) |
| Paros programados y excluidos | Σ duración de paros cuyo motivo tiene `ppt_excluded = Y` |
| Tiempo total programado | tiempo base − paros excluidos |
| Paros | Σ duración de paros cuyo motivo tiene `ppt_excluded = N` |
| Tiempo total producido | tiempo programado − paros |
| Disponibilidad (A) | tiempo producido / tiempo programado |
| Calidad (Q) | (unidades − defectuosas) / unidades |
| Tiempo total ideal | Σ unidades × ciclo / unidades por ciclo / 60 (min) |
| Rendimiento (R) | tiempo ideal / tiempo producido |
| OEE | A × R × Q |

Los consolidados (por día, máquina, turno o todo el periodo) suman los componentes y recalculan las razones.
Un motivo de paro que no esté en la tabla de motivos no se cuenta en ningún grupo (igual que el `XLOOKUP` de la hoja de referencia) y se muestra una advertencia.
Si falta la tabla de turnos, el tiempo base sale del primer al último registro con hora.

| Indicador adicional | Fórmula |
|---|---|
| Productividad de mano de obra | Σ unidades buenas / Σ horas de operador en registros de producción |
| SLA | pedidos entregados a tiempo (y completos) / total de pedidos × 100 |
| % no vendido | (unidades buenas − vendidas) / unidades buenas × 100, o no vendidas / buenas × 100 |

Verificación: con `Base_OEE_relacional.xlsx` la app da 160 turnos-máquina, A = 70,67 %, R = 88,95 %, Q = 98,45 % y **OEE = 61,89 %**, igual a la hoja OEE del libro (prueba automática en `tests/oee.test.js`).

## Almacenamiento

| Clave (localStorage del navegador) | Contenido |
|---|---|
| `pt.archivo` | Último archivo cargado (nombre, fecha de carga y lotes válidos) |
| `pt.manuales` | Lotes registrados con el formulario |
| `pt.metas` | Metas configuradas para el semáforo |
| `pt.backlog` | Estado de las historias de usuario en el tablero Scrum |
