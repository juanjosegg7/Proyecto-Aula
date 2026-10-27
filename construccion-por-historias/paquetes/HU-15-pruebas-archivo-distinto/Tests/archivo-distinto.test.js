// HU-15 · Verificación con un archivo distinto: octubre de 2026 (otra semilla, festivo del 12 de octubre).
// Se lee el .xlsx con la misma librería que usa la app y se compara con su hoja Verificacion.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('../Frontend/vendor/xlsx.full.min.js');
const M = require('../Frontend/js/modelo.js');
const K = require('../Frontend/js/indicadores.js');
const { cerca } = require('./comun.js');

const libro = XLSX.read(fs.readFileSync(path.join(__dirname, '../Simulacion/Base_Panaderia_Indicadores_2026-10.xlsx')), { type: 'buffer' });
const hojas = {};
libro.SheetNames.forEach((n) => {
  hojas[n] = XLSX.utils.sheet_to_json(libro.Sheets[n], { header: 1, raw: true, defval: null, blankrows: false });
});
const verif = {};
hojas.Verificacion.slice(1).forEach((f) => { if (f[0]) verif[f[0]] = f[1]; });

test('octubre: 21 días hábiles × 2 turnos, sin errores', () => {
  const m = M.construirModelo(hojas);
  assert.equal(m.errores.length, 0);
  assert.equal(K.calcularRegistros(m).length, 42);
});

test('octubre: los indicadores coinciden con la hoja Verificacion', () => {
  const a = K.analizar(M.construirModelo(hojas), {});
  cerca(a.total.A, verif['Disponibilidad'], 1e-9);
  cerca(a.total.R, verif['Rendimiento'], 1e-9);
  cerca(a.total.Q, verif['Calidad'], 1e-9);
  cerca(a.total.oee, verif['OEE'], 1e-9);
  cerca(a.sla.valor / 100, verif['SLA (OTIF)'], 1e-9);
  cerca(a.noVendido.valor / 100, verif['% no vendido'], 1e-9);
  cerca(a.productividad.valor, verif['Productividad (trenzas/h-h)'], 1e-9);
});
