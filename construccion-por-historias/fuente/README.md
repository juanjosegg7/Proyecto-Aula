# Tablero de Indicadores – Panadería San Nicolás

Aplicación web que **genera el tablero de control del proceso de pan trenza a partir de un libro de Excel** con la estructura de la plantilla `Base_Panaderia_Indicadores` (tablas Dim y Fact). Se publica en **Google Apps Script** y en GitHub Pages; el código fuente vive en este repositorio.

Proyecto de Aula 2026-2 · Gerencia de Proyectos · Ingeniería Industrial · Universidad de Medellín

<!--<HU-16>-->
- **Aplicación (Google Apps Script):** _pegar aquí la URL `/exec`_
- **Aplicación (GitHub Pages):** https://jpablovlsqz16.github.io/Proyecto-de-aula-gerencia-/
- **Sin internet:** abrir `Frontend/index.html`
<!--</HU-16>-->

## Proceso

Producción de pan trenza: pesaje → amasado → fermentación → división → trenzado → barnizado → fermentación final → **horneado** → enfriado → empaque.
Operación de 2 turnos de 8 horas (06:00–14:00 y 14:00–22:00), 22 días al mes. El horno es el cuello de botella.

## Indicadores

| Dimensión | Indicador | Fórmula | Meta (verde) |
|---|---|---|---|
| Equipo | OEE del horno | Disponibilidad × Rendimiento × Calidad | ≥ 65 % |
| Cliente | SLA (OTIF) | Pedidos a tiempo y completos ÷ Total de pedidos | ≥ 95 % |
| Desperdicio | % no vendido | (Unidades buenas − Vendidas) ÷ Unidades buenas | ≤ 10 % |
| Personas | Productividad | Unidades buenas ÷ Horas-hombre | ≥ línea base + 5 % |

## Arquitectura

```
Libro de Excel (Dim + Fact) → Navegador: SheetJS + lectura.js → modelo.js → indicadores.js → app.js + Chart.js (tablero)
Google Apps Script (Backend/Code.gs) y GitHub Pages solo entregan la página.
```

- **Frontend:** HTML, CSS y JavaScript propios; SheetJS 0.18.5 (Apache 2.0) y Chart.js 4.4.1 (MIT).
- **Backend:** Google Apps Script como servidor de la página (`doGet`). `Backend/Index.html` se **genera** desde `Frontend/` con `python Backend/construir_index.py`; no se edita a mano.
- **Datos:** el archivo de Excel que carga el usuario, procesado en su navegador. No se usa Google Sheets ni base de datos.
- Detalle en [Docs/Arquitectura.md](Docs/Arquitectura.md) y justificación (costo, licencias, curva de aprendizaje, dependencia del proveedor y sostenibilidad) en [Docs/Decisiones_Tecnicas.md](Docs/Decisiones_Tecnicas.md).

## Estructura del repositorio

```
.
├── Frontend/          # La aplicación: index.html, css/, js/, vendor/, datos/
├── Backend/           # Publicación en Google Apps Script (Code.gs, appsscript.json, construir_index.py, Index.html)
├── Simulacion/        # Simulación de Montecarlo de los datos (Python)
├── Tests/             # Pruebas automáticas (npm test)
└── Docs/              # Documentación del proyecto
```

## Uso

<!--<hasta HU-16>-->
La aplicación se construye por historias de usuario (Sprint 2: prototipo v0 con el OEE del horno; Sprint 3: prototipo final). Para probar la versión actual: abrir `Frontend/index.html` en el navegador.
<!--</hasta HU-16>-->
<!--<HU-16>-->
1. Abrir la aplicación (enlace o `Frontend/index.html`).
2. **Cargar datos** → arrastrar el libro de Excel, o **Usar datos de ejemplo** (septiembre de 2026, simulados).
3. Leer el **Tablero**: tarjetas con semáforo, hallazgos y gráficos; filtrar por fechas y turno; ajustar metas; exportar o imprimir.

Manual: [Docs/Manual_Usuario.md](Docs/Manual_Usuario.md). Plantilla vacía y datos simulados: `Frontend/datos/`.
<!--</HU-16>-->

## Desarrollo

```bash
npm test                                       # pruebas automáticas (Node.js 18+, sin dependencias)
python Backend/construir_index.py              # regenera Backend/Index.html para Apps Script
python Simulacion/simular_datos.py --mes 10 --semilla 1029   # otro mes simulado (requiere openpyxl)
```

## Equipo

Metodología: **Scrum** (sprints cortos, historias de usuario, QA antes de «Terminado»).

| Integrante | Rol |
|---|---|
| Ronal Alexander Álvarez Valencia (docente) | Product Owner |
| Juan Pablo | Scrum Master |
| María Camila | QA |
| Juan José | Desarrollador |
| Iván Santiago | Desarrollador |

## Notas

- Los datos son **simulados con autorización del docente** ([Docs/Supuestos_Simulacion.md](Docs/Supuestos_Simulacion.md)).
- Se usaron asistentes de IA (Claude); el detalle está en [Docs/Declaracion_Uso_Etico_IA.md](Docs/Declaracion_Uso_Etico_IA.md).
