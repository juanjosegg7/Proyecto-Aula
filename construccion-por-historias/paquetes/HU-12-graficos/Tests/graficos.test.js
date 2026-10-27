// HU-12 · Datos de los gráficos: Pareto de paros y cliente por día.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../Frontend/js/modelo.js');
const K = require('../Frontend/js/indicadores.js');
const { panaderia, cerca } = require('./comun.js');

test('Pareto ordenado de mayor a menor y acumulado hasta 100 %', () => {
  const p = K.analizar(M.construirModelo(panaderia()), {}).pareto;
  assert.ok(p.length > 0);
  assert.ok(p.every((x, i, arr) => i === 0 || arr[i - 1].minutos >= x.minutos));
  cerca(p[p.length - 1].acumulado, 100, 1e-9);
});

test('el Pareto solo incluye paros no planeados (sin MP_01, MP_02, MP_03 ni MP_08)', () => {
  const m = M.construirModelo(panaderia());
  const p = K.analizar(m, {}).pareto;
  const excluidos = Object.keys(m.motivos).filter((k) => m.motivos[k].excluido).map((k) => m.motivos[k].nombre);
  assert.ok(excluidos.length >= 4);
  assert.ok(p.every((x) => excluidos.indexOf(x.motivo) === -1));
});

test('una serie de SLA y % no vendido por día', () => {
  const a = K.analizar(M.construirModelo(panaderia()), {});
  assert.equal(a.clientePorDia.length, 22);
});
