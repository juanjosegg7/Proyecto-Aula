// HU-11 · Filtros por fechas, turno y equipo.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../Frontend/js/modelo.js');
const K = require('../Frontend/js/indicadores.js');
const { panaderia, baseCurso } = require('./comun.js');

test('filtro por rango de fechas', () => {
  const a = K.analizar(M.construirModelo(panaderia()), { desde: '2026-09-07', hasta: '2026-09-11' });
  assert.equal(a.porFecha.length, 5);
  assert.equal(a.total.registros, 10);
});

test('con filtro de turno el % no vendido no se calcula (las ventas son diarias)', () => {
  const a = K.analizar(M.construirModelo(panaderia()), { turno: 'T1' });
  assert.equal(a.noVendido.valor, null);
  assert.ok(a.productividad.valor > 0);
  assert.equal(a.total.registros, 22);
});

test('filtro por máquina y turno en la base del curso', () => {
  const a = K.analizar(M.construirModelo(baseCurso()), { maquina: 'PR_01', turno: 'A' });
  assert.equal(a.total.registros, 20);
});
