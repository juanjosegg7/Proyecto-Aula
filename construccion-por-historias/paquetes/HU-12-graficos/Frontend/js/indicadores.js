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

  function filtrar(m, f) {
    f = f || {};
    function pasa(r) {
      if (f.desde && r.fecha < f.desde) return false;
      if (f.hasta && r.fecha > f.hasta) return false;
      if (f.maquina && r.maquina !== f.maquina) return false;
      if (f.turno && r.turno !== f.turno) return false;
      if (f.linea) { var maq = m.maquinas[r.maquina]; if (!maq || maq.linea !== f.linea) return false; }
      return true;
    }
    return {
      registros: m.registros.filter(pasa),
      produccion: m.produccion.filter(pasa),
      paros: m.paros.filter(pasa),
      manoObra: m.manoObra.filter(function (r) {
        return (!f.desde || r.fecha >= f.desde) && (!f.hasta || r.fecha <= f.hasta) && (!f.turno || r.turno === f.turno);
      }),
      pedidos: m.pedidos.filter(function (p) { return (!f.desde || p.fecha >= f.desde) && (!f.hasta || p.fecha <= f.hasta); }),
      ventas: m.ventas.filter(function (v) { return !v.fecha || ((!f.desde || v.fecha >= f.desde) && (!f.hasta || v.fecha <= f.hasta)); })
    };
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

  /*
   * Productividad de mano de obra = unidades buenas / horas-hombre.
   * Con tabla de mano de obra, las horas salen de ella (horas trabajadas de los operarios del turno);
   * sin ella, de la duración de los registros de producción de cada operador.
   */
  function productividadMO(m, produccion, manoObra) {
    if (m.tablas.manoObra) {
      var porT = {}, porF = {}, totB = 0, totH = 0;
      function sumar(obj, k, b, h) { if (!obj[k]) obj[k] = { clave: k, buenas: 0, horas: 0 }; obj[k].buenas += b; obj[k].horas += h; }
      produccion.forEach(function (p) { sumar(porT, p.turno, p.buenas, 0); sumar(porF, p.fecha, p.buenas, 0); totB += p.buenas; });
      manoObra.forEach(function (r) { sumar(porT, r.turno, 0, r.horas); sumar(porF, r.fecha, 0, r.horas); totH += r.horas; });
      var lista = function (obj) {
        return Object.keys(obj).sort().map(function (k) { var x = obj[k]; x.valor = x.horas > 0 ? x.buenas / x.horas : null; return x; });
      };
      return { valor: totH > 0 ? totB / totH : null, horas: totH, porTurno: lista(porT), porFecha: lista(porF), operadores: [] };
    }
    var g = {}, tb = 0, th = 0;
    produccion.forEach(function (p) {
      if (p.duracion == null) return;
      var id = p.operador || '(sin operador)';
      if (!g[id]) g[id] = { buenas: 0, horas: 0 };
      g[id].buenas += p.buenas; g[id].horas += p.duracion / 60;
      tb += p.buenas; th += p.duracion / 60;
    });
    var operadores = Object.keys(g).sort().map(function (id) {
      return { id: id, nombre: m.operadores[id] ? m.operadores[id].nombre : id, buenas: g[id].buenas, horas: g[id].horas,
        valor: g[id].horas > 0 ? g[id].buenas / g[id].horas : null };
    });
    return { valor: th > 0 ? tb / th : null, horas: th, operadores: operadores };
  }

  // Pareto de paros no excluidos por motivo.
  function pareto(m, paros) {
    var g = {};
    paros.forEach(function (p) {
      if (p.excluido !== false) return;
      var nombre = m.motivos[p.motivo] ? m.motivos[p.motivo].nombre : p.motivo;
      g[nombre] = (g[nombre] || 0) + p.duracion;
    });
    var total = Object.keys(g).reduce(function (s, k) { return s + g[k]; }, 0), acum = 0;
    return Object.keys(g).map(function (k) { return { motivo: k, minutos: g[k] }; })
      .sort(function (a, b) { return b.minutos - a.minutos; })
      .map(function (x) { acum += x.minutos; x.pct = total ? x.minutos / total * 100 : 0; x.acumulado = total ? acum / total * 100 : 0; return x; });
  }

  // SLA y % no vendido por día (para la gráfica de cliente y desperdicio).
  function clientePorDia(d, porFecha) {
    var dias = {};
    function dia(k) { if (!dias[k]) dias[k] = { clave: k, pedidos: [], ventas: [], buenas: 0 }; return dias[k]; }
    d.pedidos.forEach(function (p) { dia(p.fecha).pedidos.push(p); });
    d.ventas.forEach(function (v) { if (v.fecha) dia(v.fecha).ventas.push(v); });
    porFecha.forEach(function (g) { dia(g.clave).buenas = g.buenas; });
    return Object.keys(dias).sort().map(function (k) {
      var x = dias[k], s = sla(x.pedidos), n = x.ventas.length ? noVendido([], x.ventas, x.buenas) : null;
      return { clave: k, sla: s ? s.valor : null, noVendido: n ? n.valor : null };
    });
  }

  function analizar(m, filtros) {
    filtros = filtros || {};
    if (!m.registros) m.registros = calcularRegistros(m);
    var d = todos(m);
    d = filtrar(m, filtros);
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
    // Las ventas no tienen turno ni máquina: con esos filtros el % no vendido no es comparable.
    if ((filtros.turno || filtros.maquina || filtros.linea) && d.ventas.length) {
      a.noVendido = { valor: null, motivo: 'Se calcula por día: quite el filtro de turno o máquina' };
    }
    a.productividad = productividadMO(m, d.produccion, d.manoObra);
    a.pareto = pareto(m, d.paros);
    a.clientePorDia = clientePorDia(d, porFecha);
    return a;
  }

  /*
   * Semáforo según las fichas técnicas. sentido 'min': verde si valor ≥ verde, rojo si valor < rojo.
   * sentido 'max': verde si valor ≤ verde, rojo si valor > rojo. Entre ambos límites, amarillo.
   */
  function semaforo(valor, verde, rojo, sentido) {
    if (valor == null || verde === '' || verde == null || isNaN(verde)) return 'sin-meta';
    verde = Number(verde);
    rojo = rojo === '' || rojo == null || isNaN(rojo) ? verde : Number(rojo);
    if (sentido === 'max') return valor <= verde ? 'verde' : valor > rojo ? 'rojo' : 'amarillo';
    return valor >= verde ? 'verde' : valor < rojo ? 'rojo' : 'amarillo';
  }

  return {
    calcularRegistros: calcularRegistros, agregar: agregar, agruparPor: agruparPor, analizar: analizar,
    sla: sla,
    noVendido: noVendido,
    productividadMO: productividadMO,
    semaforo: semaforo,
    filtrar: filtrar,
    pareto: pareto,
    todos: todos
  };
});
