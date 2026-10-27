/*
 * lectura.js — Conversión de los valores leídos del Excel: textos, números y fechas.
 *
 * Funciones puras (sin DOM) para que puedan probarse con `node --test`.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Lectura = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Minúsculas, sin tildes ni signos: «Tiempo_Horneado (min)» → «tiempo horneado min».
  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/%/g, ' % ')
      .replace(/[^a-z0-9%]+/g, ' ')
      .trim();
  }

  // Convierte "1.234,5", "1,5", "4.5 %" o números en Number; null si no es número.
  function aNumero(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (typeof v === 'boolean') return null;
    var s = String(v).trim().replace(/\s|%/g, '');
    if (!s) return null;
    var coma = s.lastIndexOf(','), punto = s.lastIndexOf('.');
    if (coma !== -1 && punto !== -1) {
      if (coma > punto) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (coma !== -1) {
      s = s.replace(',', '.');
    }
    if (!/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(s)) return null;
    return parseFloat(s);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDeFecha(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // Devuelve la fecha como texto ISO (AAAA-MM-DD) o null.
  function aFecha(v) {
    if (v === null || v === undefined || v === '') return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : isoDeFecha(v);
    if (typeof v === 'number') {
      if (v > 20000 && v < 80000) { // número de serie de Excel
        var d = new Date(Math.round((v - 25569) * 86400000));
        return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
      }
      return null;
    }
    var s = String(v).trim();
    var m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]);
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/); // dd/mm/aaaa (formato colombiano)
    if (m) {
      var anio = +m[3] < 100 ? 2000 + (+m[3]) : +m[3];
      if (+m[2] > 12 && +m[1] <= 12) return anio + '-' + pad(+m[1]) + '-' + pad(+m[2]);
      return anio + '-' + pad(+m[2]) + '-' + pad(+m[1]);
    }
    return null;
  }

  return { normalizar: normalizar, aNumero: aNumero, aFecha: aFecha };
});
