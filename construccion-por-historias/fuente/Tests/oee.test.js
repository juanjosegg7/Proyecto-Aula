// HU-06 · OEE del horno: disponibilidad × rendimiento × calidad.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../Frontend/js/modelo.js');
const K = require('../Frontend/js/indicadores.js');
const { panaderia, baseCurso, cerca } = require('./comun.js');

const analizar = (hojas, f) => K.analizar(M.construirModelo(hojas), f || {});

test('septiembre: 22 días × 2 turnos y tiempo base = 480 − 30 de descanso', () => {
  const m = M.construirModelo(panaderia());
  const r = K.calcularRegistros(m);
  assert.equal(r.length, 44);
  assert.ok(r.every((x) => x.base === 450));
});

test('el motivo MP_08 (horno en otros productos) se excluye del tiempo programado', () => {
  const r = K.calcularRegistros(M.construirModelo(panaderia())).find((x) => x.turno === 'T1');
  assert.ok(r.excluidos >= 150);                 // 150 de MP_08 + precalentamiento + limpieza
  assert.ok(r.programado <= 300);               // ventana del pan trenza en T1
});

test('OEE y sus factores coinciden con el cálculo independiente de la simulación (hoja Verificacion)', () => {
  const t = analizar(panaderia()).total;
  cerca(t.programado, 10646.76);
  cerca(t.producido, 9576.41);
  cerca(t.A, 0.8994670679, 1e-8);
  cerca(t.R, 0.7856806465, 1e-8);
  cerca(t.Q, 0.9579678363, 1e-8);
  cerca(t.oee, 0.6769899951, 1e-8);
});

test('base del curso: el OEE coincide con la hoja OEE del Excel de referencia', () => {
  const m = M.construirModelo(baseCurso());
  assert.equal(m.errores.length, 0);
  const a = K.analizar(m, {}), t = a.total;
  assert.equal(m.registros.length, 160);
  assert.equal(t.programado, 72000);
  cerca(t.producido, 50884.96);
  cerca(t.idealMin, 45261.279163, 1e-4);
  assert.equal(t.unidades, 194750);
  assert.equal(t.defectuosas, 3021);
  cerca(t.A, 0.7067355555555556);
  cerca(t.R, 0.8894824553856385, 1e-8);
  cerca(t.Q, 0.9844878048780488);
  cerca(t.oee, 0.6188774634604783, 1e-8);
});

test('base del curso: primer registro igual a la fila PR_01 · 05/01/2026 · turno A', () => {
  const m = M.construirModelo(baseCurso());
  const r = K.calcularRegistros(m).find((x) => x.maquina === 'PR_01' && x.fecha === '2026-01-05' && x.turno === 'A');
  assert.equal(r.base, 480);
  assert.equal(r.excluidos, 30);
  assert.equal(r.programado, 450);
  cerca(r.paros, 235.88);
  cerca(r.producido, 214.12);
  assert.equal(r.unidades, 784);
  assert.equal(r.defectuosas, 17);
  cerca(r.idealMin, 187.958333, 1e-5);
  cerca(r.oee, 0.408628, 1e-6);
});
