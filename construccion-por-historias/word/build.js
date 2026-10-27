const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, LevelFormat, BorderStyle, PageBreak } = require('docx');
const HU = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const MAN = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
const CAFE = '7A4A1E', CREMA = 'F7EFE4', W = 9360; // Carta con márgenes de 1": 12240 − 2×1440
const borde = { style: BorderStyle.SINGLE, size: 4, color: 'D9C8B4' };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };
const t = (text, o = {}) => new TextRun({ text, font: 'Arial', size: 20, ...o });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], spacing: { after: 80 }, ...o });
function celda(children, width, o = {}) {
  return new TableCell({ children, width: { size: width, type: WidthType.DXA }, borders: bordes,
    margins: { top: 80, bottom: 80, left: 120, right: 120 }, ...o });
}
function encabezado(textos, anchos) {
  return new TableRow({ tableHeader: true, children: textos.map((x, i) => celda([p(t(x, { bold: true, color: 'FFFFFF' }))], anchos[i],
    { shading: { type: ShadingType.CLEAR, fill: CAFE, color: 'auto' } })) });
}
function tabla(anchos, filas) {
  return new Table({ width: { size: anchos.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: anchos, rows: filas });
}
const vineta = (texto) => new Paragraph({ children: [t(texto)], numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 60 } });
const h1 = (texto) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: texto, font: 'Arial', size: 28, bold: true, color: CAFE })], spacing: { before: 240, after: 120 } });
const h2 = (texto) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun({ text: texto, font: 'Arial', size: 24, bold: true, color: CAFE })], spacing: { before: 280, after: 120 } });


const FECHA = { '2026-10-27': 'martes 27 de octubre de 2026', '2026-10-28': 'miércoles 28 de octubre de 2026', '2026-10-29': 'jueves 29 de octubre de 2026' };
const hijos = [];
hijos.push(p(t('Historias de Usuario — Construcción de la aplicación', { bold: true, size: 36, color: CAFE }), { spacing: { after: 60 } }));
hijos.push(p(t('Tablero de Indicadores · Panadería San Nicolás (pan trenza)', { size: 24 })));
hijos.push(p(t('Proyecto de Aula 2026-2 · Gerencia de Proyectos · Metodología Scrum', { color: '555555' }), { spacing: { after: 200 } }));
hijos.push(p(t('Estas historias describen cómo se construye la aplicación desde cero hasta el prototipo final. Cada historia agrega una parte concreta del producto y queda como un commit en el repositorio, en la fecha real en que se hace: así el historial de Git muestra la aplicación creciendo historia por historia.')));
hijos.push(p([t('Redacción. ', { bold: true }), t('Las historias de la base técnica (estructura, plantilla, datos simulados y pruebas) se escriben desde el equipo de desarrollo o QA; las historias de lo que ve y usa la panadería se escriben desde el administrador de la panadería, que es el usuario del tablero.')]));
hijos.push(p([t('Datos. ', { bold: true }), t('Los datos son simulados con autorización del docente (Docs/Supuestos_Simulacion.md): la panadería no tiene registros digitales del proceso. La aplicación no depende de ellos: genera el tablero con cualquier libro que tenga la estructura de la plantilla, como el que entregará el docente en la sustentación.')]));

hijos.push(h1('Hitos del producto'));
const H = [2300, 1500, 2100, 3460];
const hitos = [
  ['Prototipo v0', 'HU-06', 'martes 27 oct.', 'Carga el Excel, reconoce y valida las tablas y muestra el OEE del horno con A, R y Q. Publicado en Google Apps Script.'],
  ['Prototipo final', 'HU-16', 'jueves 29 oct.', 'Los cuatro indicadores de las fichas con semáforo, filtros, gráficos, hallazgos, exportación y manual. Probado con un archivo distinto (HU-15).']];
hijos.push(tabla(H, [encabezado(['Hito', 'Historia', 'Fecha', 'Qué incluye'], H)].concat(hitos.map((r) => new TableRow({ children: r.map((x, i) => celda([p(t(x, i === 0 ? { bold: true } : {}))], H[i])) })))));

hijos.push(h1('Escala de estimación'));
hijos.push(p(t('Las historias se estiman en puntos con la secuencia de Fibonacci (1, 2, 3, 5, 8, 13), que refleja la complejidad, el esfuerzo y la incertidumbre de cada historia.')));
const esc = [['1', 'Trivial, menos de 1 hora'], ['2', 'Simple, pocas horas'], ['3', 'Pequeña, medio día'], ['5', 'Media, alrededor de 1 día'], ['8', 'Grande, 2 a 3 días'], ['13', 'Muy grande; conviene dividirla']];
hijos.push(tabla([1600, 7760], [encabezado(['Puntos', 'Referencia de esfuerzo'], [1600, 7760])].concat(esc.map(([a, b]) => new TableRow({ children: [
  celda([p(t(a, { bold: true }))], 1600), celda([p(t(b))], 7760)] })))));

hijos.push(h1('Resumen del backlog'));
const A = [900, 2560, 950, 1500, 1250, 1100, 1100];
const filasRes = HU.map((h) => new TableRow({ children: [
  celda([p(t(h.id, { bold: true }))], A[0]), celda([p(t(h.titulo))], A[1]), celda([p(t(h.tipo))], A[2]),
  celda([p(t(h.resp))], A[3]), celda([p(t(h.prio))], A[4]), celda([p(t('Sprint ' + h.sprint))], A[5]), celda([p(t(String(h.pts)), { alignment: AlignmentType.CENTER })], A[6])] }));
const total = HU.reduce((s, h) => s + h.pts, 0);
filasRes.push(new TableRow({ children: [celda([p(t(''))], A[0]), celda([p(t('Total', { bold: true }))], A[1])].concat([2, 3, 4, 5].map((i) => celda([p(t(''))], A[i])))
  .concat([celda([p(t(String(total), { bold: true }), { alignment: AlignmentType.CENTER })], A[6])]) }));
hijos.push(tabla(A, [encabezado(['ID', 'Historia', 'Tipo', 'Responsable', 'Prioridad', 'Sprint', 'Puntos'], A)].concat(filasRes)));

hijos.push(h1('Orden de construcción'));
const sprints = [
  ['Sprint 2 · martes 27 oct.', 'HU-01 a HU-06', 'De un repositorio vacío al prototipo v0: estructura, plantilla, datos simulados, lectura del Excel, validación y OEE del horno publicado en Apps Script.'],
  ['Sprint 3 · miércoles 28 oct.', 'HU-07 a HU-11', 'SLA de pedidos, % no vendido, productividad de mano de obra, semáforos y filtros.'],
  ['Sprint 3 · jueves 29 oct.', 'HU-12 a HU-16', 'Gráficos, hallazgos, exportación, prueba con un archivo distinto y prototipo final publicado.']];
const B = [2400, 1700, 5260];
hijos.push(tabla(B, [encabezado(['Cuándo', 'Historias', 'Resultado'], B)].concat(sprints.map((r) => new TableRow({ children: r.map((x, i) => celda([p(t(x, i === 0 ? { bold: true } : {}))], B[i])) })))));
hijos.push(p(t('Cada historia depende de la anterior: se construyen en orden y cada una se integra a main antes de empezar la siguiente.', { color: '555555' }), { spacing: { before: 120 } }));
hijos.push(p(t('Definición de terminado: cumple sus criterios de aceptación; el código está en main por Pull Request con el commit de la historia; las pruebas automáticas pasan (npm test, desde HU-04); QA la probó y registró el resultado. Solo entonces la tarjeta pasa a «Terminado» en Trello.', { italics: true, color: '555555' }), { spacing: { before: 120 } }));

hijos.push(new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Historias de usuario', font: 'Arial', size: 28, bold: true, color: CAFE })], spacing: { after: 120 } }));
const C = [2000, 7360];
const mono = (x) => new TextRun({ text: x, font: 'Consolas', size: 18 });
HU.forEach((h, i) => {
  const m = MAN[i];
  hijos.push(h2(h.id + ' · ' + h.titulo));
  const etiqueta = (x) => celda([p(t(x, { bold: true, color: CAFE }))], C[0], { shading: { type: ShadingType.CLEAR, fill: CREMA, color: 'auto' } });
  const fila = (e, hijosC) => new TableRow({ cantSplit: true, children: [etiqueta(e), celda(hijosC, C[1])] });
  hijos.push(tabla(C, [
    fila('Historia de usuario', [p(t(h.historia))]),
    fila('Tipo', [p(t(h.tipo === 'Técnica' ? 'Técnica (base de la aplicación)' : 'De usuario (lo que ve la panadería)'))]),
    fila('Descripción', h.desc.map(vineta)),
    fila('Criterios de aceptación', h.ca.map((c, k) => p([t('CA' + (k + 1) + '. ', { bold: true }), t(c)]))),
    fila('Estimación', [p([t(h.pts + ' puntos', { bold: true }), t(' (Fibonacci)')])]),
    fila('Responsable', [p(t(h.resp + ' (' + h.rol + ')' + (h.rol === 'QA' ? '' : ' · Revisa: María Camila (QA)')))]),
    fila('Prioridad', [p(t(h.prio))]),
    fila('Sprint y fecha', [p(t('Sprint ' + h.sprint + ' · ' + FECHA[m.fecha]))]),
    fila('Evidencia en el repositorio', [p([t('Rama: ', { bold: true }), mono(m.rama)]), p([t('Commit: ', { bold: true }), mono(m.mensaje)]),
      p(t('Archivos: ', { bold: true }))].concat(m.archivos.map((a) => new Paragraph({ children: [mono(a)], numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 20 } }))))
  ]));
});

const doc = new Document({
  styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
  numbering: { config: [{ reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: hijos }]
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(process.argv[3], b); console.log('ok', process.argv[3]); });
