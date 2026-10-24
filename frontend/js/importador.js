/*
 * importador.js — Lectura, mapeo y validación de los datos de producción.
 *
 * Funciones puras (sin DOM) para que puedan probarse con `node --test`.
 * Recibe una tabla como arreglo de filas (cada fila es un arreglo de celdas),
 * detecta la fila de encabezados, relaciona cada columna con un campo del
 * diccionario de datos y convierte cada fila en un registro de lote validado.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Importador = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Diccionario de datos: campo interno → sinónimos aceptados en el encabezado.
  // `excluir` evita que, por ejemplo, "% Aprobados" se tome como cantidad de aprobados.
  var CAMPOS = [
    { id: 'fecha', nombre: 'Fecha', tipo: 'fecha', sinonimos: ['fecha', 'fecha de produccion', 'fecha produccion', 'fecha lote', 'date'] },
    { id: 'dia', nombre: 'Día', tipo: 'entero', sinonimos: ['dia', 'dia de produccion', 'jornada', 'day', 'n dia'] },
    { id: 'lote', nombre: 'Lote', tipo: 'texto', sinonimos: ['lote', 'codigo lote', 'id lote', 'numero de lote', 'n lote', 'batch', 'lote id'] },
    { id: 'responsable', nombre: 'Responsable', tipo: 'texto', sinonimos: ['responsable', 'operario', 'panadero', 'encargado', 'operador'] },
    { id: 'masa', nombre: 'Masa preparada (kg)', tipo: 'numero', sinonimos: ['masa', 'masa preparada', 'masa kg', 'masa preparada kg', 'peso masa'] },
    { id: 'producidos', nombre: 'Panes producidos', tipo: 'numero', excluir: ['%', 'porcentaje', 'pct'],
      sinonimos: ['panes', 'panes producidos', 'producidos', 'unidades producidas', 'produccion', 'cantidad producida', 'unidades', 'produccion total', 'total panes'] },
    { id: 'defectuosos', nombre: 'Panes defectuosos', tipo: 'numero', excluir: ['%', 'porcentaje', 'pct'],
      sinonimos: ['defectuosos', 'panes defectuosos', 'defectos', 'unidades defectuosas', 'rechazados', 'no conformes', 'cantidad defectuosa'] },
    { id: 'aprobados', nombre: 'Panes aprobados', tipo: 'numero', excluir: ['%', 'porcentaje', 'pct'],
      sinonimos: ['aprobados', 'panes aprobados', 'unidades aprobadas', 'conformes', 'buenos', 'cantidad aprobada'] },
    { id: 'tiempo', nombre: 'Tiempo de producción (min)', tipo: 'numero',
      sinonimos: ['tiempo total', 'tiempo', 'tiempo de produccion', 'tiempo produccion', 'tiempo produccion min', 'tiempo min', 'duracion', 'tiempo total min', 'tiempo de produccion min'] },
    { id: 'materia', nombre: 'Materia prima utilizada (kg)', tipo: 'numero', excluir: ['desperdici'],
      sinonimos: ['material kg', 'material', 'materia prima', 'materia prima utilizada', 'materia prima kg', 'materia utilizada', 'materia prima utilizada kg', 'harina kg'] },
    { id: 'desperdicio', nombre: 'Materia prima desperdiciada (kg)', tipo: 'numero', excluir: ['%', 'porcentaje', 'pct'],
      sinonimos: ['desperdicio kg', 'desperdicio', 'materia prima desperdiciada', 'materia prima desperdiciada kg', 'merma', 'merma kg', 'desperdiciada'] },
    { id: 'desperdicioPct', nombre: 'Desperdicio (%)', tipo: 'porcentaje',
      sinonimos: ['desperdicio %', '% desperdicio', 'porcentaje desperdicio', 'porcentaje de desperdicio', 'desperdicio pct', 'merma %'] }
  ];

  // Etapas del proceso cuyo tiempo (min) puede venir en columnas opcionales.
  var ETAPAS = ['Dosificación', 'Mezclado', 'Amasado', 'Cilindro', 'Multiformadora', 'Moldeo', 'Enbolado', 'Fermentación', 'Horneo', 'Empaque',
    'Recepción', 'Pesaje', 'División', 'Formado', 'Horneado', 'Enfriamiento'];

  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/%/g, ' % ')
      .replace(/[^a-z0-9%]+/g, ' ')
      .trim();
  }

  // Puntaje de coincidencia entre un encabezado y un campo (0 = no coincide).
  function puntaje(encabezado, campo) {
    var h = normalizar(encabezado);
    if (!h) return 0;
    var excl = campo.excluir || [];
    for (var i = 0; i < excl.length; i++) if (h.indexOf(excl[i]) !== -1) return 0;
    var mejor = 0;
    campo.sinonimos.forEach(function (s) {
      var sn = normalizar(s);
      if (h === sn) mejor = Math.max(mejor, 100);
      else if ((' ' + h + ' ').indexOf(' ' + sn + ' ') !== -1) mejor = Math.max(mejor, 50 + sn.length);
    });
    return mejor;
  }

  /*
   * Relaciona encabezados con campos. Devuelve { campo: indiceColumna } y
   * { etapas: { nombreEtapa: indiceColumna } }. Cada columna se usa una sola vez,
   * asignando primero las coincidencias de mayor puntaje.
   */
  function mapearEncabezados(encabezados) {
    var candidatos = [];
    encabezados.forEach(function (h, col) {
      CAMPOS.forEach(function (c) {
        var p = puntaje(h, c);
        if (p > 0) candidatos.push({ campo: c.id, col: col, p: p });
      });
    });
    candidatos.sort(function (a, b) { return b.p - a.p; });
    var mapa = {}, usadas = {};
    candidatos.forEach(function (k) {
      if (mapa[k.campo] === undefined && !usadas[k.col]) { mapa[k.campo] = k.col; usadas[k.col] = true; }
    });
    var etapas = {};
    encabezados.forEach(function (h, col) {
      if (usadas[col]) return;
      var hn = normalizar(h).replace(/\s*min$/, '');
      ETAPAS.forEach(function (e) {
        if (hn === normalizar(e) || hn === 'tiempo ' + normalizar(e)) { etapas[e] = col; usadas[col] = true; }
      });
    });
    return { campos: mapa, etapas: etapas };
  }

  // Busca entre las primeras filas la que más se parece a una fila de encabezados.
  function detectarFilaEncabezados(filas) {
    var mejor = { fila: 0, n: -1 };
    var limite = Math.min(filas.length, 15);
    for (var i = 0; i < limite; i++) {
      var m = mapearEncabezados(filas[i] || []);
      var n = Object.keys(m.campos).length + Object.keys(m.etapas).length * 0.5;
      if (n > mejor.n) mejor = { fila: i, n: n };
    }
    return mejor.fila;
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

  function filaVacia(fila) {
    return !fila || fila.every(function (c) { return c === null || c === undefined || String(c).trim() === ''; });
  }

  /*
   * Convierte las filas de datos en lotes validados según HU-09.
   * mapa: resultado de mapearEncabezados (puede haber sido corregido por el usuario).
   * Devuelve { lotes, errores, advertencias }.
   */
  function construirLotes(filasDatos, mapa, opciones) {
    opciones = opciones || {};
    var inicioFila = opciones.filaInicial || 2; // número de fila visible para el usuario
    var c = mapa.campos, etapas = mapa.etapas || {};
    var lotes = [], errores = [], advertencias = [];

    // Si la columna de desperdicio % trae fracciones (0.05) o porcentajes (5).
    var pctEsFraccion = true;
    if (c.desperdicioPct !== undefined) {
      filasDatos.forEach(function (f) { var n = aNumero(f[c.desperdicioPct]); if (n !== null && n > 1) pctEsFraccion = false; });
    }

    function celda(f, campo) { return c[campo] === undefined ? undefined : f[c[campo]]; }

    filasDatos.forEach(function (f, i) {
      var nFila = inicioFila + i;
      if (filaVacia(f)) return;
      var e = [];
      var producidos = aNumero(celda(f, 'producidos'));
      var defectuosos = aNumero(celda(f, 'defectuosos'));
      var aprobados = aNumero(celda(f, 'aprobados'));
      var tiempo = aNumero(celda(f, 'tiempo'));
      var materia = aNumero(celda(f, 'materia'));
      var desperdicio = aNumero(celda(f, 'desperdicio'));
      var masa = aNumero(celda(f, 'masa'));
      var fecha = aFecha(celda(f, 'fecha'));
      var dia = aNumero(celda(f, 'dia'));
      var lote = celda(f, 'lote');
      lote = lote === undefined || lote === null || String(lote).trim() === '' ? String(lotes.length + 1) : String(lote).trim();
      var responsable = celda(f, 'responsable');
      responsable = responsable == null ? '' : String(responsable).trim();

      // Una fila de totales ("Total", "Promedio") no es un lote.
      var primera = String(f.find(function (x) { return x !== null && x !== undefined && String(x).trim() !== ''; }) || '');
      if (/^(total|totales|suma|promedio|resultados?)\b/i.test(normalizar(primera))) return;

      if (producidos === null) e.push('falta "panes producidos" o no es numérico');
      else if (producidos <= 0) e.push('los panes producidos deben ser positivos');

      if (defectuosos === null && aprobados !== null && producidos !== null) defectuosos = producidos - aprobados;
      if (aprobados === null && defectuosos !== null && producidos !== null) aprobados = producidos - defectuosos;
      if (defectuosos === null) e.push('faltan panes defectuosos (o aprobados)');
      else if (defectuosos < 0) e.push('los panes defectuosos no pueden ser negativos');
      if (producidos !== null && aprobados !== null && aprobados > producidos) e.push('los aprobados superan a los producidos');
      if (producidos !== null && defectuosos !== null && defectuosos > producidos) e.push('los defectuosos superan a los producidos');
      if (producidos !== null && defectuosos !== null && aprobados !== null &&
          Math.abs(producidos - defectuosos - aprobados) > 1e-9 && c.aprobados !== undefined && c.defectuosos !== undefined) {
        advertencias.push('Fila ' + nFila + ': aprobados ≠ producidos − defectuosos; se usa producidos − defectuosos.');
        aprobados = producidos - defectuosos;
      }

      // Tiempo: si no hay columna de tiempo total, se suma el tiempo de las etapas.
      var tiemposEtapa = {}, sumaEtapas = 0, hayEtapas = false;
      Object.keys(etapas).forEach(function (nombre) {
        var t = aNumero(f[etapas[nombre]]);
        if (t !== null) { tiemposEtapa[nombre] = t; sumaEtapas += t; hayEtapas = true; }
      });
      if (tiempo === null && hayEtapas) tiempo = sumaEtapas;
      if (tiempo !== null && tiempo <= 0) e.push('el tiempo de producción debe ser positivo');
      if (materia !== null && materia <= 0) e.push('la materia prima utilizada debe ser positiva');

      if (desperdicio === null && c.desperdicioPct !== undefined && materia !== null) {
        var pct = aNumero(celda(f, 'desperdicioPct'));
        if (pct !== null) desperdicio = materia * (pctEsFraccion ? pct : pct / 100);
      }
      if (desperdicio !== null && desperdicio < 0) e.push('el desperdicio no puede ser negativo');
      if (desperdicio !== null && materia !== null && desperdicio > materia) e.push('el desperdicio supera la materia prima utilizada');
      if (masa !== null && masa <= 0) e.push('la masa preparada debe ser positiva');

      if (e.length) { errores.push({ fila: nFila, mensajes: e }); return; }

      lotes.push({
        fecha: fecha, dia: dia === null ? null : dia, lote: lote, responsable: responsable,
        masa: masa, producidos: producidos, defectuosos: defectuosos, aprobados: aprobados,
        tiempo: tiempo, materia: materia, desperdicio: desperdicio, etapas: tiemposEtapa,
        origen: opciones.origen || 'archivo'
      });
    });

    return { lotes: lotes, errores: errores, advertencias: advertencias };
  }

  /*
   * Procesa una hoja completa (arreglo de filas). Si `mapaManual` viene, se usa
   * en lugar de la detección automática.
   */
  function procesarTabla(filas, mapaManual, opciones) {
    filas = (filas || []).filter(function (f) { return Array.isArray(f); });
    var filaEnc = detectarFilaEncabezados(filas);
    var encabezados = (filas[filaEnc] || []).map(function (h) { return h == null ? '' : String(h).trim(); });
    var mapa = mapaManual || mapearEncabezados(encabezados);
    var datos = filas.slice(filaEnc + 1);
    var opc = Object.assign({ filaInicial: filaEnc + 2 }, opciones || {});
    var r = construirLotes(datos, mapa, opc);
    var faltantes = [];
    if (mapa.campos.producidos === undefined) faltantes.push('Panes producidos');
    if (mapa.campos.defectuosos === undefined && mapa.campos.aprobados === undefined) faltantes.push('Panes defectuosos o aprobados');
    return {
      filaEncabezados: filaEnc, encabezados: encabezados, mapa: mapa,
      lotes: r.lotes, errores: r.errores, advertencias: r.advertencias, faltantes: faltantes
    };
  }

  // Elige, entre varias hojas, la que tiene más campos reconocidos y más lotes válidos.
  function elegirHoja(hojas) {
    var mejor = null;
    Object.keys(hojas).forEach(function (nombre) {
      var r = procesarTabla(hojas[nombre]);
      var puntos = (r.faltantes.length ? 0 : 1000) + Object.keys(r.mapa.campos).length * 100 + r.lotes.length;
      if (!mejor || puntos > mejor.puntos) mejor = { nombre: nombre, puntos: puntos };
    });
    return mejor ? mejor.nombre : null;
  }

  // Lector de CSV simple (separador , ; o tabulador, comillas dobles).
  function leerCSV(texto) {
    texto = String(texto || '').replace(/^﻿/, '');
    var primera = texto.split(/\r?\n/)[0] || '';
    var cuenta = function (ch) { return primera.split(ch).length - 1; };
    var sep = [';', '\t', ','].sort(function (a, b) { return cuenta(b) - cuenta(a); })[0];
    var filas = [], fila = [], campo = '', comillas = false;
    for (var i = 0; i < texto.length; i++) {
      var ch = texto[i];
      if (comillas) {
        if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (ch === '"') comillas = false;
        else campo += ch;
      } else if (ch === '"') comillas = true;
      else if (ch === sep) { fila.push(campo); campo = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && texto[i + 1] === '\n') i++;
        fila.push(campo); filas.push(fila); fila = []; campo = '';
      } else campo += ch;
    }
    if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
    return filas;
  }

  return {
    CAMPOS: CAMPOS, ETAPAS: ETAPAS,
    normalizar: normalizar, mapearEncabezados: mapearEncabezados, detectarFilaEncabezados: detectarFilaEncabezados,
    aNumero: aNumero, aFecha: aFecha, construirLotes: construirLotes, procesarTabla: procesarTabla,
    elegirHoja: elegirHoja, leerCSV: leerCSV
  };
});
