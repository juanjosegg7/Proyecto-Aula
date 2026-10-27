// HU-10 · Semáforo y metas de las fichas técnicas.
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../Frontend/js/indicadores.js');

test('indicadores que deben ser altos (OEE, SLA…): verde ≥ meta, rojo < límite', () => {
  assert.equal(K.semaforo(67, 65, 55, 'min'), 'verde');
  assert.equal(K.semaforo(60, 65, 55, 'min'), 'amarillo');
  assert.equal(K.semaforo(50, 65, 55, 'min'), 'rojo');
});

test('% no vendido (debe ser bajo): verde ≤ 10, rojo > 15', () => {
  assert.equal(K.semaforo(8, 10, 15, 'max'), 'verde');
  assert.equal(K.semaforo(12, 10, 15, 'max'), 'amarillo');
  assert.equal(K.semaforo(16, 10, 15, 'max'), 'rojo');
});

test('sin meta definida no hay color', () => {
  assert.equal(K.semaforo(5, '', '', 'min'), 'sin-meta');
});
