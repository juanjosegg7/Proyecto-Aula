# Decisiones técnicas y justificación de la tecnología

Responde a la observación del docente: *«La elección de Google Apps Script y Google Sheets debe justificarse por costo, licencias, curva de aprendizaje, dependencia del proveedor y sostenibilidad, como lo pide la guía»* (guía, numeral 2.2: «se evalúa la justificación de la elección —costo, licencias, curva de aprendizaje y sostenibilidad—, no su sofisticación»).

Responsable de la justificación: Juan José (desarrollador). Se escribe en HU-01, antes de la primera línea de código.

## 1. Necesidad que debe cumplir la tecnología

| Requisito | Origen |
|---|---|
| R1. Generar el tablero con **un archivo de datos distinto** entregado el día de la sustentación | Guía, numeral 4 (demostración en vivo) |
| R2. Desarrollo **con código propio y bajo control de versiones**; el historial de commits es la evidencia | Guía, numeral 2 |
| R3. Lenguaje y librerías **libres**; no se admite un archivo de Power BI, Looker Studio o Excel sin desarrollo propio | Guía, numeral 2.2 |
| R4. Uso por el administrador de la panadería sin conocimientos técnicos, en el computador de la panadería | Usuario del proceso |
| R5. Costo cero de operación (proyecto académico, panadería pequeña) | Business case (E-08) |

## 2. Alternativas evaluadas

Escala: 1 = desfavorable, 3 = intermedio, 5 = favorable.

| Criterio (peso) | A. Google Apps Script + Google Sheets (versión de la 1.ª entrega) | B. Aplicación web estática: HTML + CSS + JavaScript, Chart.js y SheetJS, publicada en GitHub Pages (**elegida**) | C. Python + Streamlit | D. Power BI / Looker Studio |
|---|---|---|---|---|
| **Costo** (20 %) | 5 — gratis con una cuenta de Google | 5 — gratis: GitHub Pages en repositorio público; también se abre sin internet | 4 — gratis en Streamlit Community Cloud con repositorio público; un servidor propio tiene costo | 2 — compartir tableros de Power BI requiere licencia por usuario |
| **Licencias** (15 %) | 3 — plataforma propietaria de Google; el código es propio | 5 — código propio; Chart.js (MIT) y SheetJS Community Edition (Apache 2.0), ambas libres | 5 — Python y Streamlit (Apache 2.0) libres | 1 — propietario; **la guía no lo admite como producto** |
| **Curva de aprendizaje** (20 %) | 3 — JavaScript más las APIs propias de Google (`SpreadsheetApp`, `HtmlService`) y su modelo de despliegue | 4 — HTML, CSS y JavaScript estándar, el mismo lenguaje que ya usábamos en Apps Script, sin servicios adicionales | 3 — Python es conocido en ingeniería, pero Streamlit y el despliegue son nuevos para el equipo | 4 — interfaz gráfica, poca programación |
| **Dependencia del proveedor** (20 %) | 1 — alta: el código vive en script.google.com ligado a la cuenta de quien lo creó; los datos en Sheets; despliegue y permisos de Google; cuotas de ejecución de la plataforma | 5 — baja: archivos estándar que corren en cualquier navegador y en cualquier hosting estático (o sin hosting) | 3 — media: necesita un servidor con Python | 1 — alta |
| **Sostenibilidad** (15 %) | 2 — si el estudiante que creó el proyecto pierde acceso, la app deja de funcionar; el código no estaba en el repositorio | 4 — el repositorio *es* el producto: cualquiera lo clona y lo abre; librerías incluidas en `Frontend/vendor/`; pruebas automáticas por historia. Riesgo: actualizar SheetJS (sección 5) | 3 — dependencias de Python que hay que mantener; servidor que hay que sostener | 2 — depende de licencias anuales |
| **Cumple R1 y R2** (10 %) | 1 — no generaba el tablero desde un archivo nuevo y el código no estaba versionado | 5 — carga cualquier Excel/CSV y todo el código está en Git | 5 | 1 |
| **Puntaje ponderado** | **2,65** | **4,65** | **3,70** | **1,95** |

Cálculo del puntaje: Σ (calificación × peso). Ejemplo B: 5×0,20 + 5×0,15 + 4×0,20 + 5×0,20 + 4×0,15 + 5×0,10 = 4,65.

## 3. Decisión

Se elige **B. Aplicación web estática** porque es la única alternativa con puntaje alto en los cinco criterios de la guía y porque cumple los dos requisitos que hicieron fallar la primera entrega (R1 y R2):

- **Costo cero** de desarrollo y operación.
- **Todo libre**: código propio más dos librerías con licencias permisivas incluidas en el repositorio.
- **Misma base de conocimiento** del equipo (JavaScript), sin aprender las APIs de un proveedor.
- **Sin dependencia de cuentas ni servidores**: los datos de producción no salen del computador del usuario (se procesan en el navegador y solo se guardan en su `localStorage`).
- **Sostenible**: el repositorio contiene todo lo necesario para ejecutar, probar y modificar la aplicación.

### Por qué se abandonó Google Apps Script

Fue una buena opción para empezar (gratis y en JavaScript), pero en la práctica:

1. El código quedó en el editor de Apps Script y **no se subió al repositorio** (carpetas `Frontend/` y `Backend/` vacías en la 1.ª entrega). Apps Script se puede versionar con la herramienta `clasp`, pero el equipo no lo hizo: el problema fue de proceso, y la nueva arquitectura lo evita porque el código *solo* existe como archivos del repositorio.
2. La aplicación guardaba datos en Google Sheets mediante formularios; **no podía generar el tablero con un archivo nuevo**, que es lo que exige la demostración en vivo.
3. Dependía de la cuenta de Google de un integrante para publicar y dar permisos.

Este cambio se registra como **CC-01** (control de cambios del informe).

### Por qué no hay backend

Los cálculos (indicadores, OEE) son operaciones sobre unos miles de filas que el navegador resuelve en milisegundos. Un servidor agregaría costo, mantenimiento y un punto de falla sin aportar al requisito. Por eso `Backend/` no calcula nada: solo contiene la publicación en Google Apps Script, que entrega la página (ver [Arquitectura.md](Arquitectura.md)).

### Publicación en Google Apps Script (carpeta `Backend/`)

Para la entrega, la aplicación también se publica como *aplicación web* de Google Apps Script. Esto **no** vuelve a la versión anterior:

| | Primera versión (rechazada) | Publicación actual en Apps Script |
|---|---|---|
| Dónde está el código | Solo en el editor de Apps Script | En el repositorio (`Frontend/`); `Backend/Index.html` se **genera** desde ahí con `python Backend/construir_index.py` |
| Datos | Google Sheets | El archivo de Excel que carga el usuario, procesado en el navegador |
| Lógica en Google | Formularios y escritura en hojas | Ninguna: `Code.gs` solo devuelve la página (`doGet`) |
| Dependencia del proveedor | Alta | Baja: la misma app sigue funcionando en GitHub Pages y sin internet |

Guía: PDF «Subir la app a Google Apps Script» y carpeta `Backend/`.

## 4. Componentes y versiones

| Componente | Versión | Licencia | Uso |
|---|---|---|---|
| HTML5, CSS3, JavaScript (ES5/ES2015) | — | Estándar abierto | Interfaz y lógica |
| Chart.js | 4.4.1 | MIT | Gráficos |
| SheetJS Community Edition (`xlsx`) | 0.18.5 | Apache 2.0 | Lectura de `.xlsx`, `.xls`, `.ods` |
| Node.js (`node:test`) | 18 o superior | MIT | Pruebas automáticas (solo desarrollo) |
| GitHub Pages | — | Servicio gratuito de GitHub | Publicación |

## 5. Riesgos técnicos y respuesta

| Riesgo | Prob. | Impacto | Respuesta |
|---|---|---|---|
| El archivo del docente usa encabezados no previstos | Media | Alto | Reconocimiento de tablas por columnas con sinónimos en español e inglés (HU-05); se probó con la plantilla de la panadería, otro mes simulado y la base OEE del curso |
| SheetJS 0.18.5 (última versión publicada en npm) tiene vulnerabilidades conocidas al leer archivos manipulados (CVE-2023-30533 y CVE-2024-22363, corregidas en 0.19.3 y 0.20.2) | Baja | Medio | El archivo lo elige el propio usuario y se procesa solo en su navegador. **Acción pendiente:** reemplazar `Frontend/vendor/xlsx.full.min.js` por la 0.20.3 de https://cdn.sheetjs.com y correr `npm test` |
| Sin internet el día de la demostración | Media | Alto | La app funciona abriendo `Frontend/index.html` localmente; las librerías están en el repositorio |
| Navegador antiguo | Baja | Medio | Se usa JavaScript compatible con Chrome, Edge y Firefox actuales |
| Datos guardados en el navegador se pierden al borrar caché | Media | Bajo | El archivo fuente siempre está en el computador del usuario; basta volver a cargarlo |
