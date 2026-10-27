// Utilidades compartidas por las pruebas: carga de los datos de ejemplo y comparación con tolerancia.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function cargarDatos(archivo, variable) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, archivo), 'utf8'), ctx);
  return ctx.window[variable].hojas;
}
const panaderia = () => cargarDatos('../Frontend/datos/ejemplo-panaderia.js', 'DATOS_EJEMPLO');
const baseCurso = () => cargarDatos('datos-base-oee-curso.js', 'DATOS_EJEMPLO_OEE');
const copia = (x) => JSON.parse(JSON.stringify(x));
const cerca = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);

module.exports = { panaderia, baseCurso, copia, cerca };
