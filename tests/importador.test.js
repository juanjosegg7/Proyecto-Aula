// Pruebas del lector de archivos, el mapeo de columnas y las validaciones (HU-09, HU-14, HU-15).
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../frontend/js/importador.js');

test('reconoce encabezados con otros nombres, tildes y unidades', () => {
  const m = I.mapearEncabezados(['Fecha de producción', 'N° Lote', 'Operario', 'Unidades producidas', 'Rechazados',
    'Tiempo de producción (min)', 'Materia prima (kg)', 'Merma (kg)']);
  assert.deepEqual(m.campos, { fecha: 0, lote: 1, responsable: 2, producidos: 3, defectuosos: 4, tiempo: 5, materia: 6, desperdicio: 7 });
});

test('no confunde columnas de porcentaje con cantidades', () => {
  const m = I.mapearEncabezados(['Panes', 'Defectuosos', 'Aprobados', '% Defectos', '% Aprobados', 'Desperdicio %', 'Desperdicio kg', 'Material kg']);
  assert.equal(m.campos.producidos, 0);
  assert.equal(m.campos.defectuosos, 1);
  assert.equal(m.campos.aprobados, 2);
  assert.equal(m.campos.desperdicioPct, 5);
  assert.equal(m.campos.desperdicio, 6);
  assert.equal(m.campos.materia, 7);
});

test('detecta la fila de encabezados aunque haya un título encima', () => {
  const r = I.procesarTabla([['Reporte de octubre'], [], ['Lote', 'Panes producidos', 'Panes defectuosos'], ['A', 100, 4]]);
  assert.equal(r.filaEncabezados, 2);
  assert.equal(r.lotes.length, 1);
});

test('números con coma decimal y separador de miles', () => {
  assert.equal(I.aNumero('1.234,5'), 1234.5);
  assert.equal(I.aNumero('4,4'), 4.4);
  assert.equal(I.aNumero('1,234.5'), 1234.5);
  assert.equal(I.aNumero(' 5 % '), 5);
  assert.equal(I.aNumero('abc'), null);
});

test('fechas: ISO, dd/mm/aaaa y número de serie de Excel', () => {
  assert.equal(I.aFecha('2026-10-01'), '2026-10-01');
  assert.equal(I.aFecha('24/10/2026'), '2026-10-24');
  assert.equal(I.aFecha(46296), '2026-10-01');
});

test('CA2-CA4 de HU-09: valida filas y calcula aprobados = producidos − defectuosos', () => {
  const r = I.procesarTabla([
    ['Lote', 'Panes producidos', 'Panes defectuosos', 'Tiempo total', 'Material kg', 'Desperdicio kg'],
    ['1', 112, 5, 200, 50, 2],
    ['2', 112, 120, 200, 50, 2],   // defectuosos > producidos
    ['3', -5, 0, 200, 50, 2],      // producidos negativos
    ['4', 112, 3, 0, 50, 2],       // tiempo cero
    ['5', 112, 3, 200, 50, 60],    // desperdicio > materia
    ['Total', 448, 131]            // fila de totales: se ignora
  ]);
  assert.equal(r.lotes.length, 1);
  assert.equal(r.lotes[0].aprobados, 107);
  assert.deepEqual(r.errores.map((e) => e.fila), [3, 4, 5, 6]);
});

test('acepta aprobados en lugar de defectuosos', () => {
  const r = I.procesarTabla([['Panes producidos', 'Panes aprobados'], [100, 96]]);
  assert.equal(r.faltantes.length, 0);
  assert.equal(r.lotes[0].defectuosos, 4);
});

test('desperdicio en % (fracción o porcentaje) se convierte a kg', () => {
  const frac = I.procesarTabla([['Panes', 'Defectuosos', 'Material kg', 'Desperdicio %'], [112, 4, 50, 0.05]]);
  const pct = I.procesarTabla([['Panes', 'Defectuosos', 'Material kg', 'Desperdicio %'], [112, 4, 50, 5]]);
  assert.ok(Math.abs(frac.lotes[0].desperdicio - 2.5) < 1e-9);
  assert.ok(Math.abs(pct.lotes[0].desperdicio - 2.5) < 1e-9);
});

test('suma los tiempos de etapa cuando no hay tiempo total', () => {
  const r = I.procesarTabla([['Panes', 'Defectuosos', 'Amasado', 'Horneo', 'Empaque'], [112, 4, 7.5, 42, 17]]);
  assert.ok(Math.abs(r.lotes[0].tiempo - 66.5) < 1e-9);
  assert.deepEqual(Object.keys(r.lotes[0].etapas), ['Amasado', 'Horneo', 'Empaque']);
});

test('informa columnas obligatorias faltantes', () => {
  const r = I.procesarTabla([['Fecha', 'Lote'], ['2026-10-01', 'A']]);
  assert.deepEqual(r.faltantes, ['Panes producidos', 'Panes defectuosos o aprobados']);
});

test('elige la hoja con datos de lotes entre varias', () => {
  const hojas = {
    Portada: [['Panadería La Trenza Dorada'], ['Informe mensual']],
    Datos: [['Día', 'Lote', 'Panes', 'Defectuosos'], [1, 1, 112, 4], [1, 2, 112, 6]]
  };
  assert.equal(I.elegirHoja(hojas), 'Datos');
});

test('CSV con punto y coma, comillas y BOM', () => {
  const f = I.leerCSV('﻿Lote;Panes;"Notas"\r\n1;112;"con ; dentro"\r\n');
  assert.deepEqual(f, [['Lote', 'Panes', 'Notas'], ['1', '112', 'con ; dentro']]);
});
