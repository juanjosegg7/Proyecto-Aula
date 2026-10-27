/*
 * indicadores.js — Indicadores de las fichas técnicas a partir del modelo (modelo.js).
 *
 * Por turno (y por equipo, si hay varios): tiempo programado = duración − descanso − paros
 * excluidos; tiempo operativo = programado − paros no planeados; tiempo ideal = Σ unidades ×
 * tiempo de horneado ÷ unidades por tanda. Disponibilidad, rendimiento, calidad y OEE.
 * Los consolidados suman tiempos y unidades antes de dividir (no se promedian porcentajes).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Indicadores = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clave(r) { return r.maquina + '|' + r.fecha + '|' + r.turno; }

  // Un registro por máquina–fecha–turno, con las columnas de la hoja OEE de referencia.
  function calcularRegistros(m) {
    var grupos = {}, orden = [];
    function g(r) {
      var k = clave(r);
      if (!grupos[k]) {
        grupos[k] = { maquina: r.maquina, fecha: r.fecha, turno: r.turno, excluidos: 0, paros: 0, unidades: 0, defectuosas: 0,
          idealSeg: 0, durProd: 0, minIni: null, maxFin: null };
        orden.push(k);
      }
      return grupos[k];
    }
    function span(x, r) {
      if (r.inicio != null) x.minIni = x.minIni === null ? r.inicio : Math.min(x.minIni, r.inicio);
      if (r.fin != null) x.maxFin = x.maxFin === null ? r.fin : Math.max(x.maxFin, r.fin);
    }
    m.produccion.forEach(function (r) {
      var x = g(r); x.unidades += r.unidades; x.defectuosas += r.defectuosas; x.idealSeg += r.idealSeg; x.durProd += r.duracion || 0; span(x, r);
    });
    m.paros.forEach(function (r) {
      var x = g(r);
      if (r.excluido === true) x.excluidos += r.duracion; else if (r.excluido === false) x.paros += r.duracion;
      span(x, r);
    });
    return orden.map(function (k) {
      var x = grupos[k];
      var base;
      if (m.turnos[x.turno]) base = m.turnos[x.turno].duracion - m.turnos[x.turno].descanso;
      else if (x.minIni !== null && x.maxFin !== null) base = x.maxFin - x.minIni;
      else base = x.durProd + x.paros + x.excluidos;
      var programado = base - x.excluidos;
      var producido = m.tablas.paros ? programado - x.paros : (x.durProd || programado);
      var maq = m.maquinas[x.maquina];
      var r = {
        maquina: x.maquina, linea: maq ? maq.linea : '', fecha: x.fecha, turno: x.turno,
        base: base, excluidos: x.excluidos, programado: programado, paros: x.paros, producido: producido,
        unidades: x.unidades, defectuosas: x.defectuosas, buenas: x.unidades - x.defectuosas, idealMin: x.idealSeg / 60
      };
      Object.assign(r, razones(r));
      return r;
    }).sort(function (a, b) {
      return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.turno < b.turno ? -1 : a.turno > b.turno ? 1 : a.maquina < b.maquina ? -1 : a.maquina > b.maquina ? 1 : 0;
    });
  }

  function razones(s) {
    var A = s.programado > 0 ? s.producido / s.programado : null;
    var R = s.producido > 0 && s.idealMin > 0 ? s.idealMin / s.producido : null;
    var Q = s.unidades > 0 ? s.buenas / s.unidades : null;
    return { A: A, R: R, Q: Q, oee: A !== null && R !== null && Q !== null ? A * R * Q : null };
  }

  // Suma componentes y recalcula las razones (así el consolidado coincide con los totales).
  function agregar(registros) {
    var s = { registros: registros.length, base: 0, excluidos: 0, programado: 0, paros: 0, producido: 0, unidades: 0, defectuosas: 0, buenas: 0, idealMin: 0 };
    registros.forEach(function (r) {
      ['base', 'excluidos', 'programado', 'paros', 'producido', 'unidades', 'defectuosas', 'buenas', 'idealMin'].forEach(function (k) { s[k] += r[k]; });
    });
    Object.assign(s, razones(s));
    return s;
  }

  function agruparPor(registros, campo) {
    var g = {}, orden = [];
    registros.forEach(function (r) { var k = r[campo]; if (!g[k]) { g[k] = []; orden.push(k); } g[k].push(r); });
    return orden.sort().map(function (k) { var a = agregar(g[k]); a.clave = k; return a; });
  }

  // Todos los datos del modelo, sin filtrar.
  function todos(m) {
    return { registros: m.registros, produccion: m.produccion, paros: m.paros, manoObra: m.manoObra, pedidos: m.pedidos, ventas: m.ventas };
  }


  // SLA (OTIF) = pedidos a tiempo y completos / total de pedidos.
  function sla(pedidos) {
    if (!pedidos.length) return null;
    var a = pedidos.filter(function (p) { return p.cumple; }).length;
    return { valor: a / pedidos.length * 100, aTiempo: a, total: pedidos.length,
      tarde: pedidos.filter(function (p) { return !p.aTiempo; }).length,
      incompletos: pedidos.filter(function (p) { return !p.completo; }).length };
  }

  // % no vendido = (unidades buenas − vendidas) / unidades buenas. Las ventas son diarias.
  function noVendido(produccion, ventas, buenas) {
    var nv = null;
    var conNV = ventas.filter(function (v) { return v.noVendidas != null; });
    if (conNV.length) nv = conNV.reduce(function (s, v) { return s + v.noVendidas; }, 0);
    else if (ventas.length) nv = buenas - ventas.reduce(function (s, v) { return s + v.vendidas; }, 0);
    else {
      var p = produccion.filter(function (x) { return x.noVendidas != null; });
      if (p.length) nv = p.reduce(function (s, x) { return s + x.noVendidas; }, 0);
    }
    if (nv === null || !(buenas > 0)) return null;
    return { valor: Math.max(0, nv) / buenas * 100, unidades: Math.max(0, nv) };
  }



  function analizar(m, filtros) {
    filtros = filtros || {};
    if (!m.registros) m.registros = calcularRegistros(m);
    var d = todos(m);
    var total = agregar(d.registros);
    var porFecha = agruparPor(d.registros, 'fecha');
    var a = {
      total: total,
      porFecha: porFecha,
      porMaquina: agruparPor(d.registros, 'maquina'),
      porTurno: agruparPor(d.registros, 'turno'),
      datos: d
    };
    a.sla = sla(d.pedidos);
    a.noVendido = noVendido(d.produccion, d.ventas, total.buenas);
    return a;
  }


  return {
    calcularRegistros: calcularRegistros, agregar: agregar, agruparPor: agruparPor, analizar: analizar,
    sla: sla,
    noVendido: noVendido,
    todos: todos
  };
});
