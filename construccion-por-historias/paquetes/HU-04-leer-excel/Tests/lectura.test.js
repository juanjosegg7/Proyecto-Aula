// Pruebas de la conversión de valores leídos del Excel (HU-04).
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../Frontend/js/lectura.js');

test('normaliza encabezados: minúsculas, sin tildes ni signos', () => {
  assert.equal(L.normalizar('Tiempo_Horneado (min)'), 'tiempo horneado min');
  assert.equal(L.normalizar('  Duración  '), 'duracion');
});

test('números con coma decimal, separador de miles y porcentaje', () => {
  assert.equal(L.aNumero('1.234,5'), 1234.5);
  assert.equal(L.aNumero('4,4'), 4.4);
  assert.equal(L.aNumero('1,234.5'), 1234.5);
  assert.equal(L.aNumero(' 5 % '), 5);
  assert.equal(L.aNumero(16), 16);
  assert.equal(L.aNumero('abc'), null);
  assert.equal(L.aNumero(''), null);
});

test('fechas: ISO, dd/mm/aaaa y número de serie de Excel (con hora)', () => {
  assert.equal(L.aFecha('2026-09-01'), '2026-09-01');
  assert.equal(L.aFecha('24/10/2026'), '2026-10-24');
  assert.equal(L.aFecha(46266), '2026-09-01');
  assert.equal(L.aFecha(46266.375), '2026-09-01');
  assert.equal(L.aFecha('sin fecha'), null);
});
