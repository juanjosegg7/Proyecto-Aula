# CÁLCULO DE INDICADORES DE PRODUCCIÓN --- FABRICACIÓN DE PAN TRENZA
**HU-10 | Calcular indicadores de producción**

## 1. Objetivo del cálculo

Como desarrollador, quiero calcular automáticamente los indicadores del proceso, para medir productividad, calidad y desperdicio. Los indicadores se calculan a partir de los registros reales guardados en la hoja **PRODUCCION** (HU-09); no se usan valores inventados ni fijos.

## 2. Indicadores a calcular

| Indicador | Fórmula | Unidad |
|---|---|---|
| Porcentaje de defectos | Defectuosos / producidos × 100 | % |
| Porcentaje de producción aprobada | Aprobados / producidos × 100 | % |
| Productividad | Panes producidos / tiempo | panes/min o panes/h |
| Porcentaje de desperdicio | Desperdicio / materia prima utilizada × 100 | % |

Cada resultado queda relacionado con el lote del cual se calculó, para poder consultarlo junto con los datos de origen.

## 3. Ejemplo de cálculo con datos de referencia (fuente externa)

Estos valores no son datos reales del proyecto, sino un ejemplo de cómo se aplican las fórmulas, usando el lote de referencia del estudio de tiempos de la Universidad Autónoma de Occidente (112 panes, 66 min de armado).

| Indicador | Cálculo de ejemplo | Resultado |
|---|---|---|
| Productividad | 112 panes / 66 min | **1.70 panes/min** (≈ 101.82 panes/hora) |
| Porcentaje de defectos (escenario de prueba) | 5.6 defectuosos / 112 × 100 | **5%** (con p = 0.05, supuesto de simulación) |
| Porcentaje de producción aprobada (escenario de prueba) | 106.4 aprobados / 112 × 100 | **95%** |
| Porcentaje de desperdicio (escenario de prueba) | 2.5 kg / 50 kg × 100 | **5%** (con TRIA(2%, 5%, 8%), supuesto de simulación) |

## 4. Validaciones del cálculo

- Los indicadores solo se calculan cuando el lote tiene registrados los datos necesarios (producidos, defectuosos, aprobados, tiempo, materia prima y desperdicio).
- Los resultados deben coincidir exactamente con los datos del lote de origen; no se permiten valores recalculados manualmente.
- Si el tiempo o la materia prima utilizada es cero, el cálculo de productividad o de desperdicio no se ejecuta (para evitar divisiones por cero).

## 5. Criterios de aceptación

- **CA1.** Los indicadores se calculan automáticamente.
- **CA2.** Defectos = defectuosos / producidos × 100.
- **CA3.** Aprobación = aprobados / producidos × 100.
- **CA4.** Productividad = panes producidos / tiempo.
- **CA5.** Desperdicio = desperdicio / materia utilizada × 100.
- **CA6.** Los resultados coinciden con los datos.

---

**Nota:** los valores del escenario de prueba (p = 0.05 para defectos, TRIA(2%, 5%, 8%) para desperdicio) son supuestos de simulación tomados del documento de parámetros del proyecto, no mediciones reales. Deben reemplazarse por los resultados que arrojen las fórmulas aplicadas a los lotes reales registrados mediante HU-09.

**Fuente de referencia:** Universidad Autónoma de Occidente. Estudio de tiempos Pan Trenza (4@).
https://red.uao.edu.co/bitstreams/33b53389-b16d-46d1-92b4-6eee22b07b9b/download

**Responsable:** Iván Santiago | **Apoyo:** Juan José + María Camila (QA)
**Puntos de estimación:** 5 puntos
