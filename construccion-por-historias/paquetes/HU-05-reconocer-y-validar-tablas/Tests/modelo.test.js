// HU-05 · Reconocer las tablas del libro y validar sus filas.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../Frontend/js/modelo.js');
const { panaderia, baseCurso, copia } = require('./comun.js');

test('reconoce las 9 tablas de la plantilla de la panadería', () => {
  const t = M.detectarTablas(panaderia());
  assert.deepEqual(Object.keys(t).sort(),
    ['manoObra', 'motivo', 'operador', 'paros', 'pedidos', 'produccion', 'producto', 'turno', 'ventas']);
  assert.equal(t.produccion.hoja, 'Fact_Produccion');
  assert.equal(t.manoObra.hoja, 'Fact_ManoObra');
});

test('reconoce cada tabla por sus columnas, no por el nombre de la hoja', () => {
  const hojas = baseCurso(), renombradas = {};
  Object.keys(hojas).forEach((k, i) => { renombradas['Hoja' + (i + 1)] = hojas[k]; });
  const t = M.detectarTablas(renombradas);
  assert.deepEqual(Object.keys(t).sort(), ['maquina', 'motivo', 'operador', 'paros', 'produccion', 'producto', 'turno']);
  assert.ok(M.esRelacional(renombradas));
});

test('un libro de lotes simple no se toma como relacional', () => {
  assert.equal(M.esRelacional({ Datos: [['Lote', 'Panes producidos', 'Panes defectuosos'], ['1', 112, 4]] }), false);
});

test('el archivo de septiembre se carga sin errores; sin columna de máquina todo va al horno', () => {
  const m = M.construirModelo(panaderia());
  assert.equal(m.errores.length, 0);
  assert.ok(m.produccion.length > 0);
  assert.ok(m.produccion.every((p) => p.maquina === M.EQUIPO));
});

test('tiempo ideal por trenza = 22 min ÷ 16 = 1,375 min', () => {
  const m = M.construirModelo(panaderia());
  assert.equal(m.productos.PR_01.idealSegUnidad, 1.375 * 60);
});

test('rechaza tandas con defectuosas mayores que producidas y horas de mano de obra no válidas', () => {
  const hojas = copia(panaderia());
  hojas.Fact_Produccion[1][9] = 99;
  hojas.Fact_ManoObra[1][5] = -2;
  const m = M.construirModelo(hojas);
  assert.equal(m.errores.length, 2);
  assert.match(m.errores.map((e) => e.mensaje).join(' '), /defectuosas superan/);
});
