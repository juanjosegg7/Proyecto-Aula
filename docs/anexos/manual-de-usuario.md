# Manual de usuario — Tablero de control Pan Trenza

## 1. Abrir la aplicación

- **En línea:** enlace de GitHub Pages del repositorio (ver README).
- **Sin internet:** descargar el repositorio y abrir `frontend/index.html` con doble clic en Chrome, Edge o Firefox. No requiere instalación: las librerías vienen incluidas en `frontend/vendor/`.

## 2. Generar el tablero desde un archivo (demostración en vivo)

1. Ir a **Cargar datos** (o arrastrar el archivo sobre cualquier parte de la página).
2. Seleccionar el Excel o CSV. La aplicación:
   - elige la hoja con datos de lotes y encuentra la fila de encabezados,
   - reconoce las columnas por su nombre (ver diccionario de datos),
   - valida cada fila y descarta las que incumplen las reglas.
3. Si están las columnas obligatorias (panes producidos y defectuosos o aprobados), el tablero se genera de inmediato.
4. Si falta alguna, la app queda en **Cargar datos**: en *Correspondencia de columnas* se elige qué columna del archivo corresponde a cada campo y se pulsa **Generar tablero con esta correspondencia**.
5. En *Filas no cargadas* se ve el número de fila y el motivo de cada fila rechazada.

Para probar sin archivo: **Usar datos de ejemplo (simulación)** carga la simulación mensual del repositorio (datos simulados, no reales).
**Descargar plantilla CSV** entrega un archivo vacío con los encabezados recomendados.

## 3. Leer el tablero

- **Tarjetas:** producción total, aprobados, defectuosos, % defectos, % aprobación, productividad, % desperdicio y tiempo promedio. El borde superior indica el semáforo frente a la meta (verde cumple, amarillo a menos de 10 % de la meta, rojo no cumple, gris sin meta).
- **Hallazgos:** resumen automático: cumplimiento de metas, periodos que superan la meta, lotes fuera de control, etapa de mayor duración y periodos de mayor y menor productividad.
- **Gráficos:** producción por periodo, % defectos y % desperdicio con línea de meta, productividad, carta de control p y tiempo promedio por etapa (si el archivo trae tiempos por etapa; la etapa más larga se resalta).
- **Filtros:** rango de periodos (Desde/Hasta), lote, responsable y origen (archivo o registro manual). Todo el tablero, la tabla de datos y las fichas usan el filtro.
- **Metas:** botón *Metas* para cambiar los valores del semáforo; se guardan en el navegador.
- **Exportar CSV:** descarga los lotes filtrados con sus indicadores (separador `;`, abre directo en Excel).
- **Imprimir / PDF:** imprime el tablero sin menús; elegir «Guardar como PDF» en el diálogo.

## 4. Registrar un lote manualmente

En **Registrar lote** se diligencian los campos (todos obligatorios). Los aprobados se calculan solos. La app no deja guardar si hay campos vacíos, valores no positivos, defectuosos mayores que producidos, desperdicio mayor que la materia prima o un código de lote repetido. Al guardar aparece una confirmación y el lote se suma al tablero (origen «manual»). Los lotes manuales se pueden eliminar desde la tabla inferior.

## 5. Otros módulos

- **Datos:** tabla de cada lote con sus indicadores; búsqueda por lote, periodo o responsable. Los lotes fuera de control en la carta p se resaltan.
- **Fichas técnicas:** las cuatro fichas (HU-11) con el valor actual del indicador según el filtro.
- **Empresa y proceso:** empresa, SIPOC, flujo del proceso, estrategia y arquitectura.
- **Backlog Scrum:** tablero Kanban con las historias de usuario; el estado se cambia con el selector de cada tarjeta y se filtra por sprint. Se pueden agregar historias (estado inicial Backlog).

## 6. Preguntas frecuentes

- **¿Dónde quedan los datos?** Solo en el navegador del equipo (localStorage). El archivo no se sube a ningún servidor. Para borrar: *Quitar datos del archivo* o eliminar los lotes manuales.
- **El tablero muestra N/D en productividad o desperdicio.** El archivo no tiene columna de tiempo o de materia prima/desperdicio; asignarla en la correspondencia de columnas si existe con otro nombre.
- **Las fechas salen como números.** Asignar la columna al campo *Fecha*: los números de serie de Excel se convierten automáticamente.
