// Pruebas unitarias de los cálculos (HU-10). Ejecutar con: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const I = require('../frontend/js/importador.js');
const K = require('../frontend/js/indicadores.js');

const cerca = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);
const lote = (o) => Object.assign({ lote: '1', producidos: 112, defectuosos: 6, aprobados: 106, tiempo: 66, materia: 50, desperdicio: 2.5, etapas: {} }, o);

test('CA2-CA5: fórmulas de las fichas técnicas con el lote de referencia', () => {
  const x = K.porLote(lote());
  cerca(x.pctDefectos, 6 / 112 * 100);        // 5,36 %
  cerca(x.pctAprobados, 106 / 112 * 100);     // 94,64 %
  cerca(x.productividad, 112 / 66);           // 1,70 panes/min
  cerca(x.pctDesperdicio, 5);                 // 5 %
});

test('el consolidado es razón de sumas, no promedio de porcentajes', () => {
  const r = K.resumen([lote({ producidos: 100, defectuosos: 10, aprobados: 90 }), lote({ producidos: 300, defectuosos: 0, aprobados: 300 })]);
  cerca(r.pctDefectos, 10 / 400 * 100);       // 2,5 % (el promedio simple daría 5 %)
  assert.equal(r.producidos, 400);
});

test('sin tiempo o sin materia prima el indicador queda N/D (sin división por cero)', () => {
  const r = K.resumen([lote({ tiempo: null, materia: null, desperdicio: null })]);
  assert.equal(r.productividad, null);
  assert.equal(r.pctDesperdicio, null);
});

test('CA6: el ejemplo de simulación coincide con la hoja Indicadores del Excel', () => {
  const csv = fs.readFileSync(path.join(__dirname, '../frontend/datos/ejemplo-simulacion-mensual.csv'), 'utf8');
  const r = I.procesarTabla(I.leerCSV(csv));
  assert.equal(r.errores.length, 0);
  const s = K.resumen(r.lotes);
  assert.equal(s.lotes, 44);
  assert.equal(s.periodos, 22);
  assert.equal(s.producidos, 4928);
  assert.equal(s.defectuosos, 226);
  assert.equal(s.aprobados, 4702);
  cerca(s.pctDefectos, 4.586038961038961);
  cerca(s.productividad, 0.564933629388191, 1e-4);
  cerca(s.pctDesperdicio, 4.76094526646842, 1e-3);
});

test('carta p: límites 3σ y detección de lotes fuera de control', () => {
  const lotes = Array.from({ length: 10 }, (_, i) => lote({ lote: String(i), producidos: 100, defectuosos: 5, aprobados: 95 }));
  lotes.push(lote({ lote: 'X', producidos: 100, defectuosos: 30, aprobados: 70 }));
  const cp = K.cartaP(lotes);
  cerca(cp.pBar, 80 / 1100);
  assert.equal(cp.fueraDeControl, 1);
  assert.ok(cp.puntos[10].fuera);
  assert.ok(cp.puntos.every((p) => p.lic >= 0));
});

test('semáforo frente a la meta', () => {
  assert.equal(K.semaforo(4, 5, 'max'), 'verde');
  assert.equal(K.semaforo(5.3, 5, 'max'), 'amarillo');
  assert.equal(K.semaforo(8, 5, 'max'), 'rojo');
  assert.equal(K.semaforo(96, 95, 'min'), 'verde');
  assert.equal(K.semaforo(3, '', 'max'), 'sin-meta');
});

test('tiempos por etapa y cuello de botella', () => {
  const t = K.tiemposPorEtapa([lote({ etapas: { Amasado: 8, Horneo: 42 } }), lote({ etapas: { Amasado: 6, Horneo: 40 } })]);
  assert.equal(t.cuelloDeBotella, 'Horneo');
  cerca(t.etapas[0].promedio, 7);
});
