# Plan y evidencia de pruebas — Tablero de indicadores · Panadería San Nicolás

Responsable: María Camila (QA). Se construye a lo largo de los sprints: cada historia de desarrollo trae su archivo de pruebas en `Tests/` y QA lo ejecuta antes de aprobarla.

## 1. Estrategia

| Nivel | Qué se prueba | Herramienta | Responsable |
|---|---|---|---|
| Unitario | Lectura de valores, reconocimiento de tablas, fórmulas de las fichas técnicas, semáforos y validaciones | `npm test` (Node.js 18+), carpeta `Tests/` | Desarrollador de cada historia |
| Verificación cruzada | Los indicadores de la app contra un cálculo independiente: hoja *Verificacion* del Excel simulado y hoja *OEE* de la base del curso | `oee.test.js`, `sla.test.js`, `no-vendido.test.js`, `productividad.test.js`, `archivo-distinto.test.js` | Desarrolladores + QA |
| Archivo distinto | La app genera el tablero con un archivo que no se usó para desarrollar (octubre de 2026, otra semilla, festivo del 12 de octubre; y la base del curso con 4 máquinas) | `archivo-distinto.test.js` y caso E4/E5 | QA |
| Extremo a extremo | Cargar archivo → tablero, filtros, metas, persistencia, móvil, Apps Script | Navegador (casos E1 a E11) | QA |
| Aceptación | Criterios de aceptación de HU-01 a HU-16 | Tablero del equipo (Trello) | QA |

## 2. Pruebas automáticas

Ejecutar `npm test` desde la raíz del repositorio. Resultado esperado con el prototipo final: **33 pruebas, 33 aprobadas, 0 fallidas.**

| # | Prueba | Archivo | Historia |
|---|---|---|---|
| 1 | normaliza encabezados: minúsculas, sin tildes ni signos | `lectura.test.js` | HU-04 |
| 2 | números con coma decimal, separador de miles y porcentaje | `lectura.test.js` | HU-04 |
| 3 | fechas: ISO, dd/mm/aaaa y número de serie de Excel (con hora) | `lectura.test.js` | HU-04 |
| 4 | reconoce las 9 tablas de la plantilla de la panadería | `modelo.test.js` | HU-05 |
| 5 | reconoce cada tabla por sus columnas, no por el nombre de la hoja | `modelo.test.js` | HU-05 |
| 6 | un libro de lotes simple no se toma como relacional | `modelo.test.js` | HU-05 |
| 7 | el archivo de septiembre se carga sin errores; sin columna de máquina todo va al horno | `modelo.test.js` | HU-05 |
| 8 | tiempo ideal por trenza = 22 min ÷ 16 = 1,375 min | `modelo.test.js` | HU-05 |
| 9 | rechaza tandas con defectuosas mayores que producidas y horas de mano de obra no válidas | `modelo.test.js` | HU-05 |
| 10 | septiembre: 22 días × 2 turnos y tiempo base = 480 − 30 de descanso | `oee.test.js` | HU-06 |
| 11 | el motivo MP_08 (horno en otros productos) se excluye del tiempo programado | `oee.test.js` | HU-06 |
| 12 | OEE y sus factores coinciden con el cálculo independiente de la simulación (hoja Verificacion) | `oee.test.js` | HU-06 |
| 13 | base del curso: el OEE coincide con la hoja OEE del Excel de referencia | `oee.test.js` | HU-06 |
| 14 | base del curso: primer registro igual a la fila PR_01 · 05/01/2026 · turno A | `oee.test.js` | HU-06 |
| 15 | SLA de septiembre igual al de la simulación: 70 de 76 pedidos | `sla.test.js` | HU-07 |
| 16 | un pedido entregado un minuto tarde o incompleto no cumple el SLA | `sla.test.js` | HU-07 |
| 17 | sin tabla de pedidos el SLA queda N/D | `sla.test.js` | HU-07 |
| 18 | % no vendido de septiembre igual al de la simulación | `no-vendido.test.js` | HU-08 |
| 19 | se calcula con las ventas del libro aunque la hoja tenga otro nombre | `no-vendido.test.js` | HU-08 |
| 20 | sin tabla de ventas queda N/D | `no-vendido.test.js` | HU-08 |
| 21 | productividad de septiembre igual a la de la simulación: 8,03 trenzas/h-h | `productividad.test.js` | HU-09 |
| 22 | sin tabla de mano de obra se calcula por operador con el tiempo de producción | `productividad.test.js` | HU-09 |
| 23 | indicadores que deben ser altos (OEE, SLA…): verde ≥ meta, rojo < límite | `semaforo.test.js` | HU-10 |
| 24 | % no vendido (debe ser bajo): verde ≤ 10, rojo > 15 | `semaforo.test.js` | HU-10 |
| 25 | sin meta definida no hay color | `semaforo.test.js` | HU-10 |
| 26 | filtro por rango de fechas | `filtros.test.js` | HU-11 |
| 27 | con filtro de turno el % no vendido no se calcula (las ventas son diarias) | `filtros.test.js` | HU-11 |
| 28 | filtro por máquina y turno en la base del curso | `filtros.test.js` | HU-11 |
| 29 | Pareto ordenado de mayor a menor y acumulado hasta 100 % | `graficos.test.js` | HU-12 |
| 30 | el Pareto solo incluye paros no planeados (sin MP_01, MP_02, MP_03 ni MP_08) | `graficos.test.js` | HU-12 |
| 31 | una serie de SLA y % no vendido por día | `graficos.test.js` | HU-12 |
| 32 | octubre: 21 días hábiles × 2 turnos, sin errores | `archivo-distinto.test.js` | HU-15 |
| 33 | octubre: los indicadores coinciden con la hoja Verificacion | `archivo-distinto.test.js` | HU-15 |

## 3. Casos extremo a extremo (navegador)

Archivos: `Frontend/datos/Base_Panaderia_Indicadores_2026-09.xlsx` (desarrollo), `Simulacion/Base_Panaderia_Indicadores_2026-10.xlsx` (**archivo distinto**) y `Base_OEE_relacional.xlsx` (base del curso, 4 máquinas).

| Caso | Pasos | Resultado esperado | Resultado (QA) |
|---|---|---|---|
| E1 | Abrir `Frontend/index.html` | Se ven los módulos Tablero y Cargar datos | |
| E2 | Cargar datos → Descargar plantilla de Excel | Se descarga la plantilla con 9 hojas | |
| E3 | Usar datos de ejemplo | OEE 67,7 %; A 89,9 %; R 78,6 %; Q 95,8 %; SLA 92,1 %; no vendido 2,3 %; productividad 8,03; hallazgos y gráficos | |
| E4 | Cargar `Base_Panaderia_Indicadores_2026-10.xlsx` | 42 turnos, 21 días, OEE 71,1 %, SLA 87,7 % | |
| E5 | Cargar `Base_OEE_relacional.xlsx` | OEE 61,9 %; aparece el gráfico por equipo | |
| E6 | Cargar un archivo con una tanda de defectuosas > producidas | La fila aparece en «Filas no cargadas» con hoja y número | |
| E7 | Metas → cambiar la meta de OEE a 70 | La tarjeta del OEE cambia a amarillo; al recargar se conserva | |
| E8 | Filtrar turno T2 | Se recalcula todo; % no vendido muestra N/D con explicación | |
| E9 | Exportar CSV y abrirlo en Excel | Columnas separadas, decimales con coma | |
| E10 | Abrir en celular y sin internet | Sin desplazamiento horizontal; funciona sin conexión | |
| E11 | Abrir la URL `/exec` de Google Apps Script en incógnito y repetir E3 y E4 | Mismos valores que en GitHub Pages | |

## 4. Aceptación

QA registra el resultado de cada caso en la columna «Resultado (QA)» y mueve la tarjeta de la historia a «Terminado» solo si sus criterios de aceptación se cumplen.
