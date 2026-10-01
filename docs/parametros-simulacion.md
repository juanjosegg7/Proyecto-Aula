# Parámetros para Simulación

**Proceso:** Fabricación de pan trenza  
**Objetivo:** Este documento deja los parámetros numéricos listos para llevarlos a una simulación. Los tiempos se calculan a partir de las 8 observaciones del estudio de tiempos de Pan Trenza (4 arrobas). Para simular los tiempos se propone usar una distribución triangular TRIA(mínimo, moda, máximo), tomando el promedio como valor central. Esto es una decisión de modelación y no una distribución demostrada estadísticamente.

---

## 1. Parámetros de tiempo para la simulación

| Actividad | Mínimo (min) | Valor central / moda (min) | Máximo (min) | Distribución para simular | Parámetro |
|---|---|---|---|---|---|
| Dosificación | 2.00 | 2.72 | 3.30 | Triangular | TRIA(2.00, 2.72, 3.30) |
| Mezclado | 1.36 | 1.86 | 2.30 | Triangular | TRIA(1.36, 1.86, 2.30) |
| Amasado | 7.00 | 7.50 | 8.14 | Triangular | TRIA(7.00, 7.50, 8.14) |
| Cilindro | 2.00 | 2.07 | 2.30 | Triangular | TRIA(2.00, 2.07, 2.30) |
| Multiformadora | 20.45 | 23.46 | 26.31 | Triangular | TRIA(20.45, 23.46, 26.31) |
| Moldeo | 26.00 | 27.91 | 30.45 | Triangular | TRIA(26.00, 27.91, 30.45) |
| Enbolado | 13.00 | 14.02 | 15.20 | Triangular | TRIA(13.00, 14.02, 15.20) |
| Horneo | 40.00 | 41.88 | 45.00 | Triangular | TRIA(40.00, 41.88, 45.00) |
| Empaque | 16.00 | 17.09 | 18.30 | Triangular | TRIA(16.00, 17.09, 18.30) |

---

## 2. Otras actividades del proceso

| Actividad | Parámetro | Distribución | Valor para simulación | Observación |
|---|---|---|---|---|
| Fermentación | Tiempo por lata | Constante | 60 min | La fuente reporta 60 minutos y 3 panes por lata. |
| Producción por lote | Cantidad de panes | Constante | 112 panes | La fuente usa 4 arrobas y reporta 112 panes. |
| Tiempo total de armado | Tiempo | Constante | 66 min | Promedio reportado por la fuente. |
| Tiempo total de horneado | Tiempo | Constante | 55.89 min | Promedio reportado por la fuente. |
| Tiempo total de empaque | Tiempo | Constante | 17 min | Promedio reportado por la fuente. |

---

## 3. Defectos y aprobación

La fuente consultada no proporciona cantidades de panes defectuosos ni porcentajes de defecto. Por lo tanto, no es correcto calcular un parámetro real de Binomial con esa fuente.

Para ejecutar una primera simulación del prototipo, se puede utilizar un escenario de prueba con $p = 0.05$ (5 % de probabilidad de defecto). Este valor es un **supuesto** de simulación y debe reemplazarse cuando el proyecto tenga datos reales.

- **Defectuosos:** $X \sim \text{Binomial}(n = 112, p = 0.05)$
- **Aprobados:** $\text{Aprobados} = 112 - X$
- **Aprobación esperada del escenario:** $1 - 0.05 = 0.95 = 95\%$

---

## 4. Desperdicio de materia prima

La fuente de tiempos tampoco reporta kg de materia prima desperdiciada. Para no inventar un dato real, se recomienda manejar el desperdicio como una variable de entrada y reemplazar el supuesto cuando se tengan mediciones.

- **Supuesto inicial para simulación:** $\text{TRIA}(2\%, 5\%, 8\%)$ del material utilizado. Este rango es únicamente un escenario de prueba.
- **Ejemplo con base de 50 kg:** Si se utiliza 50 kg como base de material del lote: $\text{desperdicio} = \text{TRIA}(1.00, 2.50, 4.00)\text{ kg}$. *(La conversión de 4 arrobas a 50 kg es una referencia de unidad, no una medición de desperdicio de la fuente).*

---

## 5. Productividad e indicadores

- $\text{Productividad} = \frac{\text{panes producidos}}{\text{tiempo de producción}}$
- $\% \text{ defectos} = \frac{\text{defectuosos}}{\text{producidos}} \times 100$
- $\% \text{ aprobados} = \frac{\text{aprobados}}{\text{producidos}} \times 100$
- $\% \text{ desperdicio} = \frac{\text{desperdicio}}{\text{materia prima utilizada}} \times 100$

> **Ejemplo con el lote de referencia:**  
> $112\text{ panes} / 66\text{ min} = 1.70\text{ panes/min} \approx 101.82\text{ panes/hora}$.  
> Este resultado es calculado a partir de los datos de referencia.

---

## 6. Tabla rápida para ingresar al simulador

| Variable | Distribución | Parámetros |
|---|---|---|
| Dosificación | TRIA | 2.00, 2.72, 3.30 |
| Mezclado | TRIA | 1.36, 1.86, 2.30 |
| Amasado | TRIA | 7.00, 7.50, 8.14 |
| Cilindro | TRIA | 2.00, 2.07, 2.30 |
| Multiformadora | TRIA | 20.45, 23.46, 26.31 |
| Moldeo | TRIA | 26.00, 27.91, 30.45 |
| Enbolado | TRIA | 13.00, 14.02, 15.20 |
| Horneo | TRIA | 40.00, 41.88, 45.00 |
| Empaque | TRIA | 16.00, 17.09, 18.30 |
| Defectuosos | BINOMIAL | n = 112, p = 0.05* |
| Aprobados | Derivada | 112 − defectuosos |
| Fermentación | CONSTANTE | 60 min |
| Producción por lote | CONSTANTE | 112 panes |
| Desperdicio | TRIA* | 2%, 5%, 8%* |

*\* Los valores marcados con asterisco son supuestos de prueba para poder ejecutar la simulación; deben sustituirse por datos reales cuando se recolecten.*

---

## 7. Fuente

- **Universidad Autónoma de Occidente.** Estudio de tiempos Pan Trenza (4@), incluido en el documento consultado.  
  [Descargar documento](https://red.uao.edu.co/bitstreams/33b53389-b16d-46d1-92b4-6eee22b07b9b/download)
