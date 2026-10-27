// HU-07 · SLA de pedidos (OTIF): a tiempo y completos.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../Frontend/js/modelo.js');
const K = require('../Frontend/js/indicadores.js');
const { panaderia, baseCurso, copia, cerca } = require('./comun.js');

test('SLA de septiembre igual al de la simulación: 70 de 76 pedidos', () => {
  const s = K.analizar(M.construirModelo(panaderia()), {}).sla;
  assert.equal(s.total, 76);
  cerca(s.valor, 92.10526316);
});

test('un pedido entregado un minuto tarde o incompleto no cumple el SLA', () => {
  const hojas = copia(panaderia());
  hojas.Fact_Pedidos = [hojas.Fact_Pedidos[0],
    [1, 46266, 'CL_01', 'PR_01', 20, 46266.375, 46266.375, 20],          // 09:00 y entrega 09:00 → cumple
    [2, 46266, 'CL_02', 'PR_01', 20, 46266.375, 46266.375 + 1 / 1440, 20], // un minuto tarde
    [3, 46266, 'CL_03', 'PR_01', 20, 46266.375, 46266.3, 19]];             // a tiempo pero incompleto
  const s = K.analizar(M.construirModelo(hojas), {}).sla;
  assert.equal(s.aTiempo, 1);
  assert.equal(s.tarde, 1);
  assert.equal(s.incompletos, 1);
});

test('sin tabla de pedidos el SLA queda N/D', () => {
  assert.equal(K.analizar(M.construirModelo(baseCurso()), {}).sla, null);
});
