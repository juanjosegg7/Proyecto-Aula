// Pruebas del modelo relacional y del OEE (HU-17, HU-18). Datos: frontend/datos/ejemplo-oee.js (Base_OEE_relacional.xlsx).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const O = require('../frontend/js/oee.js');

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../frontend/datos/ejemplo-oee.js'), 'utf8'), ctx);
const HOJAS = ctx.window.DATOS_EJEMPLO_OEE.hojas;
const cerca = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);

test('reconoce cada tabla por sus columnas, no por el nombre de la hoja', () => {
  const renombradas = {};
  Object.keys(HOJAS).forEach((k, i) => { renombradas['Hoja' + (i + 1)] = HOJAS[k]; });
  const t = O.detectarTablas(renombradas);
  assert.deepEqual(Object.keys(t).sort(), ['maquina', 'motivo', 'operador', 'paros', 'produccion', 'producto', 'turno']);
  assert.ok(O.esRelacional(renombradas));
});

test('el OEE coincide con la hoja OEE del Excel de referencia', () => {
  const m = O.construirModelo(HOJAS);
  assert.equal(m.errores.length, 0);
  assert.equal(m.registros.length, 160);
  const t = O.agregar(m.registros);
  assert.equal(t.programado, 72000);
  cerca(t.producido, 50884.96, 1e-6);
  cerca(t.idealMin, 45261.279163, 1e-4);
  assert.equal(t.unidades, 194750);
  assert.equal(t.defectuosas, 3021);
  cerca(t.A, 0.7067355555555556);
  cerca(t.R, 0.8894824553856385, 1e-8);
  cerca(t.Q, 0.9844878048780488);
  cerca(t.oee, 0.6188774634604783, 1e-8);
});

test('primer registro igual a la fila PR_01 · 05/01/2026 · turno A de la hoja OEE', () => {
  const m = O.construirModelo(HOJAS);
  const r = m.registros.find((x) => x.maquina === 'PR_01' && x.fecha === '2026-01-05' && x.turno === 'A');
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

test('filtros por máquina y turno, Pareto y productividad de mano de obra', () => {
  const m = O.construirModelo(HOJAS);
  const a = O.analizar(m, { maquina: 'PR_01', turno: 'A' });
  assert.equal(a.total.registros, 20);
  assert.ok(a.pareto.length > 0);
  cerca(a.pareto[a.pareto.length - 1].acumulado, 100, 1e-9);
  assert.ok(a.pareto.every((p, i, arr) => i === 0 || arr[i - 1].minutos >= p.minutos));
  const total = O.analizar(m, {});
  assert.equal(total.productividad.operadores.length, 4);
  assert.equal(total.sla, null);       // la base no trae pedidos
  assert.equal(total.noVendido, null); // ni ventas
});

test('SLA y % no vendido cuando el libro trae pedidos y ventas', () => {
  const hojas = Object.assign({}, HOJAS, {
    Pedidos: [['order_id', 'due_date', 'delivery_date'], ['P1', '2026-01-10', '2026-01-09'], ['P2', '2026-01-10', '2026-01-12'], ['P3', '2026-01-11', '2026-01-11'], ['P4', '2026-01-12', null]],
    Ventas: [['Fecha', 'Unidades vendidas'], ['2026-01-05', 180000]]
  });
  const a = O.analizar(O.construirModelo(hojas), {});
  cerca(a.sla.valor, 50);
  cerca(a.noVendido.valor, (191729 - 180000) / 191729 * 100);
});

test('valida filas: defectuosas mayores que producidas se rechazan', () => {
  const hojas = JSON.parse(JSON.stringify(HOJAS));
  hojas.Fact_Produccion[1][10] = 99999;
  const m = O.construirModelo(hojas);
  assert.equal(m.errores.length, 1);
  assert.match(m.errores[0].mensaje, /defectuosas superan/);
});

test('un libro de lotes simple no se toma como relacional', () => {
  assert.equal(O.esRelacional({ Datos: [['Lote', 'Panes producidos', 'Panes defectuosos'], ['1', 112, 4]] }), false);
});
