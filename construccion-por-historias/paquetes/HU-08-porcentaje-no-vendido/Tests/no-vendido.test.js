// HU-08 · % de producto no vendido.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../Frontend/js/modelo.js');
const K = require('../Frontend/js/indicadores.js');
const { panaderia, baseCurso, cerca } = require('./comun.js');

test('% no vendido de septiembre igual al de la simulación', () => {
  cerca(K.analizar(M.construirModelo(panaderia()), {}).noVendido.valor, 2.270125906);
});

test('se calcula con las ventas del libro aunque la hoja tenga otro nombre', () => {
  const hojas = Object.assign({}, baseCurso(), { Ventas: [['Fecha', 'Unidades vendidas'], ['2026-01-05', 180000]] });
  cerca(K.analizar(M.construirModelo(hojas), {}).noVendido.valor, (191729 - 180000) / 191729 * 100);
});

test('sin tabla de ventas queda N/D', () => {
  assert.equal(K.analizar(M.construirModelo(baseCurso()), {}).noVendido, null);
});
