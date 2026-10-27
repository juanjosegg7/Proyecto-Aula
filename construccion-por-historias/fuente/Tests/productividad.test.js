// HU-09 · Productividad de mano de obra (trenzas buenas por hora-hombre).
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../Frontend/js/modelo.js');
const K = require('../Frontend/js/indicadores.js');
const { panaderia, baseCurso, cerca } = require('./comun.js');

test('productividad de septiembre igual a la de la simulación: 8,03 trenzas/h-h', () => {
  const p = K.analizar(M.construirModelo(panaderia()), {}).productividad;
  cerca(p.valor, 8.033716475);
  cerca(p.horas, 652.5);
});

test('sin tabla de mano de obra se calcula por operador con el tiempo de producción', () => {
  assert.equal(K.analizar(M.construirModelo(baseCurso()), {}).productividad.operadores.length, 4);
});
