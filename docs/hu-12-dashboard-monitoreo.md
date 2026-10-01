# TABLERO DE MONITOREO --- FABRICACIÓN DE PAN TRENZA
**HU-12 | Construir tablero de monitoreo**

## 1. Objetivo del tablero

El tablero permite visualizar de forma rápida el comportamiento del proceso de fabricación del pan trenza, a partir de los registros reales guardados en la hoja PRODUCCION (HU-09) y de los indicadores calculados automáticamente (HU-10). No muestra datos inventados: toda la información proviene de los lotes que el equipo registra en el sistema.

## 2. Fuente de los datos

El tablero consulta directamente la hoja **PRODUCCION** de Google Sheets por medio de Google Apps Script, que actúa como intermediario entre la interfaz (HTML/CSS) y el almacenamiento de datos. Esto sigue la misma arquitectura definida para el proyecto:

**Usuario → HTML/CSS/JavaScript → Apps Script → Google Sheets → Dashboard**

## 3. Indicadores mostrados

El tablero muestra los siguientes valores, calculados a partir de los registros de producción:

| Indicador | Fórmula | Unidad |
|---|---|---|
| Producción total | Suma de panes producidos | panes |
| Panes aprobados | Producidos − defectuosos | panes |
| Panes defectuosos | Registro directo del lote | panes |
| Porcentaje de desperdicio | Desperdicio / materia utilizada × 100 | % |
| Productividad | Panes producidos / tiempo | panes/min o panes/h |
| Tiempo promedio de producción | Promedio del tiempo registrado por lote | min |

A modo de referencia (no como dato fijo del sistema), si se usara únicamente el lote de referencia del estudio de tiempos (112 panes en 66 min de armado), la productividad de referencia sería de **1.70 panes/min**, aproximadamente **101.82 panes/hora**. Este valor no representa la productividad real de la panadería del proyecto; es solo un ejemplo de cálculo hecho con datos publicados en la fuente externa, y se reemplaza por los resultados reales en cuanto existan lotes registrados.

## 4. Filtros disponibles

- Por fecha.
- Por lote.
- Por periodo (rango de fechas).

## 5. Visualizaciones

- Gráfico de producción (panes producidos por lote o periodo).
- Gráfico de defectos y desperdicio (porcentaje de defectos y de desperdicio por lote o periodo).

## 6. Actualización de datos

El tablero se actualiza automáticamente cada vez que se registra un nuevo lote en la hoja PRODUCCION, sin necesidad de recargar manualmente los datos base; la consulta a Apps Script trae siempre la información más reciente.

## 7. Criterios de aceptación

- **CA1.** El tablero carga datos desde Google Sheets mediante Apps Script.
- **CA2.** Los valores coinciden con los registros.
- **CA3.** Se puede seleccionar periodo o lote.
- **CA4.** Los indicadores se actualizan con nuevos datos.
- **CA5.** Existe gráfico de producción y de desperdicio o defectos.
- **CA6.** Funciona como aplicación web.

---

**Nota:** los indicadores y gráficos del tablero dependen directamente de que existan lotes registrados mediante HU-09. Mientras no haya registros reales, el tablero mostrará los campos vacíos o en cero, y no valores de referencia o supuestos.

**Fuente de referencia del cálculo de ejemplo:** Universidad Autónoma de Occidente. Estudio de tiempos Pan Trenza (4@).
https://red.uao.edu.co/bitstreams/33b53389-b16d-46d1-92b4-6eee22b07b9b/download

**Responsable:** Juan José | **Apoyo:** Iván Santiago + María Camila (QA)
**Puntos de estimación:** 13 puntos
