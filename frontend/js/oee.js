/*
 * oee.js — Modelo relacional de producción (dimensiones + hechos) y cálculo del OEE.
 *
 * Reconoce un libro con hojas de producción, paros, productos, turnos, motivos de paro,
 * máquinas y operadores (por los nombres de sus columnas, no por el nombre de la hoja)
 * y calcula, por máquina–fecha–turno, las mismas fórmulas de la hoja OEE de referencia:
 *
 *   Tiempo programado = duración del turno − paros excluidos (motivos con ppt_excluded = Y)
 *   Tiempo producido  = tiempo programado − paros no excluidos
 *   Disponibilidad A  = tiempo producido / tiempo programado
 *   Rendimiento R     = tiempo ideal / tiempo producido,  tiempo ideal = Σ unidades × ciclo / unidades por ciclo
 *   Calidad Q         = unidades buenas / unidades totales
 *   OEE               = A × R × Q
 *
 * Además: Pareto de paros, productividad de mano de obra, SLA (si hay pedidos) y % no vendido (si hay ventas).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./importador.js'));
  else root.OEE = factory(root.Importador);
})(typeof self !== 'undefined' ? self : this, function (I) {
  'use strict';

  var CAMPOS = {
    maquina: ['machine id', 'maquina', 'id maquina', 'maquina id', 'codigo maquina', 'equipo', 'id equipo', 'horno', '=machine'],
    nombreMaquina: ['machine name', 'nombre maquina', 'nombre equipo', 'descripcion maquina', 'nombre del equipo'],
    linea: ['line', 'linea', 'linea de produccion', '=area'],
    fecha: ['shift date', 'fecha', 'fecha turno', 'fecha de produccion', '=date', '=dia'],
    turno: ['shift id', 'turno', 'id turno', '=shift', 'codigo turno'],
    producto: ['product id', 'producto', 'id producto', 'referencia', 'sku', 'codigo producto'],
    nombreProducto: ['product name', 'nombre producto', 'descripcion producto', 'nombre del producto'],
    orden: ['order id', 'orden', 'orden de produccion', 'id orden', 'pedido', 'id pedido', 'numero pedido'],
    unidades: ['units produced', 'unidades producidas', 'unidades totales', 'producidas', 'producidos', 'cantidad producida', 'panes producidos', 'unidades'],
    defectuosas: ['units defective', 'unidades defectuosas', 'defectuosas', 'defectuosos', 'panes defectuosos', 'rechazos', 'rechazadas', 'no conformes'],
    duracion: ['duration min', 'duracion', 'duracion min', 'minutos', 'tiempo min', 'duracion minutos'],
    inicio: ['timestamp start', '=inicio', 'hora inicio', 'fecha hora inicio', '=start'],
    fin: ['timestamp end', '=fin', 'hora fin', 'fecha hora fin', '=end'],
    operador: ['operator id', 'operador', 'operario', 'id operador', 'id operario', 'panadero'],
    nombreOperador: ['operator name', 'nombre operador', 'nombre operario', '=nombre'],
    motivo: ['reason id', 'motivo', 'id motivo', 'causa', 'codigo paro', 'motivo paro', 'codigo motivo'],
    nombreMotivo: ['reason name', 'nombre motivo', 'descripcion motivo', 'descripcion paro', 'nombre causa'],
    tipoMotivo: ['=type', '=tipo', 'tipo paro', '=clase'],
    excluido: ['ppt excluded', 'excluidos', 'excluido', 'excluir', 'excluido del tiempo programado'],
    cicloSeg: ['std cycle time sec', 'tiempo ciclo', 'tiempo de ciclo', 'tiempo ciclo seg', 'ciclo seg', 'tiempo ciclo estandar', 'tiempo estandar seg'],
    unidadesCiclo: ['std units per cycle', 'unidades por ciclo', 'und por ciclo', 'unidades ciclo', 'panes por ciclo', 'panes por tanda'],
    idealUnit: ['tiempo ideal unitario', 'ideal unit sec', 'tiempo ideal unitario seg'],
    duracionTurno: ['duration min', 'duracion', 'duracion turno', 'minutos turno', 'duracion min'],
    fechaCompromiso: ['due date', 'fecha compromiso', 'fecha prometida', 'promised date', 'fecha requerida', 'fecha pactada', 'fecha limite'],
    fechaEntrega: ['delivery date', 'delivered date', 'fecha entrega', 'fecha de entrega', 'fecha real entrega', 'fecha entregada'],
    cantidadPedida: ['qty ordered', 'cantidad pedida', 'unidades pedidas', 'ordered units', 'cantidad solicitada'],
    cantidadEntregada: ['qty delivered', 'cantidad entregada', 'unidades entregadas', 'delivered units'],
    vendidas: ['units sold', 'unidades vendidas', 'vendidas', 'cantidad vendida', 'ventas unidades', '=ventas'],
    noVendidas: ['units unsold', 'unidades no vendidas', 'no vendidas', 'sobrantes', 'devoluciones', 'unidades devueltas']
  };

  // Tablas: campos obligatorios, campos que no deben estar (para no confundir hechos con dimensiones) y opcionales.
  var TABLAS = [
    { rol: 'produccion', nombre: 'Producción (hechos)', req: ['maquina', 'fecha', 'turno', 'unidades'], no: [],
      opc: ['defectuosas', 'producto', 'orden', 'duracion', 'inicio', 'fin', 'operador', 'idealUnit', 'noVendidas'] },
    { rol: 'paros', nombre: 'Paros (hechos)', req: ['maquina', 'fecha', 'turno', 'motivo', 'duracion'], no: ['unidades'],
      opc: ['inicio', 'fin', 'excluido'] },
    { rol: 'pedidos', nombre: 'Pedidos (SLA)', req: ['orden', 'fechaCompromiso', 'fechaEntrega'], no: [],
      opc: ['producto', 'cantidadPedida', 'cantidadEntregada'] },
    { rol: 'ventas', nombre: 'Ventas', req: ['vendidas'], no: ['maquina', 'turno'], opc: ['fecha', 'producto', 'noVendidas'] },
    { rol: 'producto', nombre: 'Productos', req: ['producto', 'cicloSeg'], no: ['fecha', 'maquina'], opc: ['nombreProducto', 'unidadesCiclo'] },
    { rol: 'turno', nombre: 'Turnos', req: ['turno', 'duracionTurno'], no: ['maquina', 'fecha'], opc: [] },
    { rol: 'motivo', nombre: 'Motivos de paro', req: ['motivo'], alguno: ['excluido', 'tipoMotivo'], no: ['maquina', 'fecha'], opc: ['nombreMotivo', 'tipoMotivo', 'excluido'] },
    { rol: 'maquina', nombre: 'Máquinas', req: ['maquina'], alguno: ['nombreMaquina', 'linea'], no: ['fecha', 'turno'], opc: ['nombreMaquina', 'linea'] },
    { rol: 'operador', nombre: 'Operadores', req: ['operador', 'nombreOperador'], no: ['fecha', 'maquina'], opc: [] }
  ];

  function puntaje(h, sinonimos) {
    if (!h) return 0;
    var mejor = 0;
    sinonimos.forEach(function (s) {
      var exacto = s.charAt(0) === '=';           // '=dia': solo coincide con el encabezado completo
      var sn = I.normalizar(exacto ? s.slice(1) : s);
      if (h === sn) mejor = Math.max(mejor, 100);
      else if (exacto) return;
      else if ((' ' + h + ' ').indexOf(' ' + sn + ' ') !== -1) mejor = Math.max(mejor, 40 + sn.length);
    });
    return mejor;
  }

  // Asigna columnas a los campos de una tabla (cada columna se usa una vez, mayor puntaje primero).
  function mapear(encabezados, campos) {
    var cand = [];
    var norm = encabezados.map(function (h) { return I.normalizar(h); });
    norm.forEach(function (h, col) {
      if (h.indexOf('%') !== -1) return;
      campos.forEach(function (c) { var p = puntaje(h, CAMPOS[c]); if (p) cand.push({ c: c, col: col, p: p }); });
    });
    cand.sort(function (a, b) { return b.p - a.p; });
    var mapa = {}, usadas = {};
    cand.forEach(function (k) { if (mapa[k.c] === undefined && !usadas[k.col]) { mapa[k.c] = k.col; usadas[k.col] = true; } });
    return mapa;
  }

  function evaluarTabla(filas, def) {
    var todos = def.req.concat(def.opc, def.alguno || [], def.no);
    var mejor = null;
    for (var i = 0; i < Math.min(filas.length, 10); i++) {
      var enc = (filas[i] || []).map(function (h) { return h == null ? '' : String(h).trim(); });
      var mapa = mapear(enc, todos.filter(function (c, j, a) { return a.indexOf(c) === j; }));
      var ok = def.req.every(function (c) { return mapa[c] !== undefined; }) &&
        def.no.every(function (c) { return mapa[c] === undefined; }) &&
        (!def.alguno || def.alguno.some(function (c) { return mapa[c] !== undefined; }));
      if (!ok) continue;
      var n = Object.keys(mapa).length;
      if (!mejor || n > mejor.n) mejor = { fila: i, mapa: mapa, n: n, encabezados: enc };
    }
    return mejor;
  }

  // Identifica qué hoja cumple cada rol. Devuelve { rol: { hoja, fila, mapa, encabezados } }.
  function detectarTablas(hojas) {
    var usadas = {}, res = {};
    TABLAS.forEach(function (def) {
      var mejor = null;
      Object.keys(hojas).forEach(function (nombre) {
        if (usadas[nombre]) return;
        var ev = evaluarTabla(hojas[nombre] || [], def);
        if (ev && (!mejor || ev.n > mejor.n)) { mejor = ev; mejor.hoja = nombre; }
      });
      if (mejor) { res[def.rol] = mejor; usadas[mejor.hoja] = true; }
    });
    return res;
  }

  // Es un libro relacional si tiene producción y al menos una tabla relacionada.
  function esRelacional(hojas) {
    var t = detectarTablas(hojas);
    return !!(t.produccion && (t.paros || t.turno || t.producto));
  }

  function texto(v) { return v == null ? '' : String(v).trim(); }
  function siNo(v) {
    if (v === true || v === 1) return true;
    if (v === false || v === 0) return false;
    var s = I.normalizar(v);
    if (['y', 'yes', 's', 'si', 'true', 'x', 'verdadero', '1'].indexOf(s) !== -1) return true;
    if (['n', 'no', 'false', 'falso', '0'].indexOf(s) !== -1) return false;
    return null;
  }
  // Minutos desde el origen para fechas-hora (número de serie de Excel o texto ISO).
  function aMinutos(v) {
    if (typeof v === 'number') return v * 1440;
    if (v instanceof Date) return v.getTime() / 60000;
    var t = Date.parse(String(v || '').replace(' ', 'T'));
    return isNaN(t) ? null : t / 60000;
  }

  function filasDe(hojas, t) {
    if (!t) return [];
    var filas = hojas[t.hoja].slice(t.fila + 1);
    return filas.map(function (f, i) { return { f: f, n: t.fila + 2 + i }; })
      .filter(function (x) { return x.f && x.f.some(function (c) { return c !== null && c !== undefined && String(c).trim() !== ''; }); });
  }
  function celda(x, t, campo) { return t.mapa[campo] === undefined ? undefined : x.f[t.mapa[campo]]; }

  /*
   * Construye el modelo a partir de las hojas: valida filas y resuelve las relaciones.
   */
  function construirModelo(hojas) {
    var t = detectarTablas(hojas);
    var m = { tablas: t, maquinas: {}, productos: {}, turnos: {}, motivos: {}, operadores: {},
      produccion: [], paros: [], pedidos: [], ventas: [], errores: [], advertencias: [] };
    function error(hoja, n, msg) { m.errores.push({ hoja: hoja, fila: n, mensaje: msg }); }
    var avisos = {};
    function aviso(msg) { if (!avisos[msg]) { avisos[msg] = true; m.advertencias.push(msg); } }

    if (!t.produccion) { m.faltantes = ['hoja de producción con máquina, fecha, turno y unidades producidas']; return m; }
    m.faltantes = [];

    filasDe(hojas, t.maquina).forEach(function (x) {
      var id = texto(celda(x, t.maquina, 'maquina'));
      if (id) m.maquinas[id] = { id: id, nombre: texto(celda(x, t.maquina, 'nombreMaquina')) || id, linea: texto(celda(x, t.maquina, 'linea')) };
    });
    filasDe(hojas, t.producto).forEach(function (x) {
      var id = texto(celda(x, t.producto, 'producto'));
      var ciclo = I.aNumero(celda(x, t.producto, 'cicloSeg'));
      var porCiclo = I.aNumero(celda(x, t.producto, 'unidadesCiclo'));
      if (!id) return;
      if (!(ciclo > 0)) { error(t.producto.hoja, x.n, 'tiempo de ciclo no válido para ' + id); return; }
      m.productos[id] = { id: id, nombre: texto(celda(x, t.producto, 'nombreProducto')) || id, cicloSeg: ciclo,
        unidadesCiclo: porCiclo > 0 ? porCiclo : 1, idealSegUnidad: ciclo / (porCiclo > 0 ? porCiclo : 1) };
    });
    filasDe(hojas, t.turno).forEach(function (x) {
      var id = texto(celda(x, t.turno, 'turno'));
      var d = I.aNumero(celda(x, t.turno, 'duracionTurno'));
      if (id && d > 0) m.turnos[id] = { id: id, duracion: d };
    });
    filasDe(hojas, t.motivo).forEach(function (x) {
      var id = texto(celda(x, t.motivo, 'motivo'));
      if (!id) return;
      var tipo = texto(celda(x, t.motivo, 'tipoMotivo'));
      var exc = siNo(celda(x, t.motivo, 'excluido'));
      m.motivos[id] = { id: id, nombre: texto(celda(x, t.motivo, 'nombreMotivo')) || id, tipo: tipo, excluido: exc === null ? false : exc };
    });
    filasDe(hojas, t.operador).forEach(function (x) {
      var id = texto(celda(x, t.operador, 'operador'));
      if (id) m.operadores[id] = { id: id, nombre: texto(celda(x, t.operador, 'nombreOperador')) || id };
    });

    var P = t.produccion;
    filasDe(hojas, P).forEach(function (x) {
      var maquina = texto(celda(x, P, 'maquina')), fecha = I.aFecha(celda(x, P, 'fecha')), turno = texto(celda(x, P, 'turno'));
      var unidades = I.aNumero(celda(x, P, 'unidades'));
      var defect = P.mapa.defectuosas === undefined ? 0 : I.aNumero(celda(x, P, 'defectuosas'));
      var dur = I.aNumero(celda(x, P, 'duracion'));
      var e = [];
      if (!maquina) e.push('falta la máquina');
      if (!fecha) e.push('fecha no válida');
      if (!turno) e.push('falta el turno');
      if (unidades === null || unidades < 0) e.push('unidades producidas no válidas');
      if (defect === null || defect < 0) e.push('unidades defectuosas no válidas');
      if (unidades !== null && defect !== null && defect > unidades) e.push('las defectuosas superan a las producidas');
      if (dur !== null && dur < 0) e.push('duración negativa');
      if (e.length) { error(P.hoja, x.n, e.join('; ')); return; }
      var producto = texto(celda(x, P, 'producto'));
      var idealUnit = null;
      if (m.productos[producto]) idealUnit = m.productos[producto].idealSegUnidad;
      else {
        var iu = I.aNumero(celda(x, P, 'idealUnit'));
        if (iu > 0) idealUnit = iu;
        else aviso('Producto «' + (producto || 'sin código') + '» sin tiempo de ciclo: sus unidades no suman tiempo ideal (afecta el rendimiento).');
      }
      if (t.maquina && !m.maquinas[maquina]) aviso('La máquina «' + maquina + '» no está en la tabla de máquinas.');
      var inicio = aMinutos(celda(x, P, 'inicio')), fin = aMinutos(celda(x, P, 'fin'));
      if (dur === null && inicio !== null && fin !== null) dur = fin - inicio;
      m.produccion.push({ maquina: maquina, fecha: fecha, turno: turno, producto: producto, orden: texto(celda(x, P, 'orden')),
        operador: texto(celda(x, P, 'operador')), unidades: unidades, defectuosas: defect, buenas: unidades - defect,
        duracion: dur, idealSeg: idealUnit === null ? 0 : idealUnit * unidades, inicio: inicio, fin: fin,
        noVendidas: I.aNumero(celda(x, P, 'noVendidas')) });
    });

    var D = t.paros;
    filasDe(hojas, D).forEach(function (x) {
      var maquina = texto(celda(x, D, 'maquina')), fecha = I.aFecha(celda(x, D, 'fecha')), turno = texto(celda(x, D, 'turno'));
      var motivo = texto(celda(x, D, 'motivo')), dur = I.aNumero(celda(x, D, 'duracion'));
      var e = [];
      if (!maquina) e.push('falta la máquina');
      if (!fecha) e.push('fecha no válida');
      if (!turno) e.push('falta el turno');
      if (dur === null || dur < 0) e.push('duración no válida');
      if (e.length) { error(D.hoja, x.n, e.join('; ')); return; }
      // Igual que la hoja de referencia: el motivo decide si el paro se excluye del tiempo programado.
      // Un motivo que no está en la tabla de motivos no cuenta en ninguno de los dos grupos.
      var excluido;
      if (m.motivos[motivo]) excluido = m.motivos[motivo].excluido;
      else if (!t.motivo) { var v = siNo(celda(x, D, 'excluido')); excluido = v === null ? false : v; }
      else { excluido = null; aviso('Motivo de paro «' + motivo + '» no está en la tabla de motivos: no se cuenta como paro ni como excluido.'); }
      m.paros.push({ maquina: maquina, fecha: fecha, turno: turno, motivo: motivo, duracion: dur, excluido: excluido,
        inicio: aMinutos(celda(x, D, 'inicio')), fin: aMinutos(celda(x, D, 'fin')) });
    });

    var Pe = t.pedidos;
    filasDe(hojas, Pe).forEach(function (x) {
      var comp = I.aFecha(celda(x, Pe, 'fechaCompromiso')), ent = I.aFecha(celda(x, Pe, 'fechaEntrega'));
      if (!comp) { error(Pe.hoja, x.n, 'fecha de compromiso no válida'); return; }
      var ped = I.aNumero(celda(x, Pe, 'cantidadPedida')), entr = I.aNumero(celda(x, Pe, 'cantidadEntregada'));
      var completo = ped === null || entr === null ? true : entr >= ped;
      m.pedidos.push({ orden: texto(celda(x, Pe, 'orden')), fecha: comp, entrega: ent,
        aTiempo: !!ent && ent <= comp && completo, entregado: !!ent });
    });

    var V = t.ventas;
    filasDe(hojas, V).forEach(function (x) {
      var vend = I.aNumero(celda(x, V, 'vendidas'));
      if (vend === null || vend < 0) { error(V.hoja, x.n, 'unidades vendidas no válidas'); return; }
      m.ventas.push({ fecha: I.aFecha(celda(x, V, 'fecha')), producto: texto(celda(x, V, 'producto')), vendidas: vend,
        noVendidas: I.aNumero(celda(x, V, 'noVendidas')) });
    });

    if (!t.turno) aviso('No hay tabla de turnos: la duración de cada turno se toma del primer al último registro de tiempo.');
    if (!t.producto && P.mapa.idealUnit === undefined) aviso('No hay tabla de productos con tiempo de ciclo: el rendimiento no se puede calcular.');
    if (!t.paros) aviso('No hay hoja de paros: la disponibilidad se calcula con el tiempo de los registros de producción.');
    m.registros = calcularRegistros(m);
    return m;
  }

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
      if (m.turnos[x.turno]) base = m.turnos[x.turno].duracion;
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
      pedidos: m.pedidos.filter(function (p) { return (!f.desde || p.fecha >= f.desde) && (!f.hasta || p.fecha <= f.hasta); }),
      ventas: m.ventas.filter(function (v) { return !v.fecha || ((!f.desde || v.fecha >= f.desde) && (!f.hasta || v.fecha <= f.hasta)); })
    };
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

  // Productividad de mano de obra: unidades buenas por hora de operador en producción.
  function productividadMO(m, produccion) {
    var g = {}, totB = 0, totH = 0;
    produccion.forEach(function (p) {
      if (p.duracion == null) return;
      var id = p.operador || '(sin operador)';
      if (!g[id]) g[id] = { buenas: 0, horas: 0 };
      g[id].buenas += p.buenas; g[id].horas += p.duracion / 60;
      totB += p.buenas; totH += p.duracion / 60;
    });
    var operadores = Object.keys(g).sort().map(function (id) {
      return { id: id, nombre: m.operadores[id] ? m.operadores[id].nombre : id, buenas: g[id].buenas, horas: g[id].horas,
        valor: g[id].horas > 0 ? g[id].buenas / g[id].horas : null };
    });
    return { valor: totH > 0 ? totB / totH : null, horas: totH, operadores: operadores };
  }

  function sla(pedidos) {
    if (!pedidos.length) return null;
    var a = pedidos.filter(function (p) { return p.aTiempo; }).length;
    return { valor: a / pedidos.length * 100, aTiempo: a, total: pedidos.length };
  }

  // % no vendido = no vendidas / unidades buenas.
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
    var d = filtrar(m, filtros);
    var total = agregar(d.registros);
    return {
      total: total,
      porFecha: agruparPor(d.registros, 'fecha'),
      porMaquina: agruparPor(d.registros, 'maquina'),
      porTurno: agruparPor(d.registros, 'turno'),
      pareto: pareto(m, d.paros),
      productividad: productividadMO(m, d.produccion),
      sla: sla(d.pedidos),
      noVendido: noVendido(d.produccion, d.ventas, total.buenas),
      datos: d
    };
  }

  return {
    TABLAS: TABLAS, CAMPOS: CAMPOS,
    detectarTablas: detectarTablas, esRelacional: esRelacional, construirModelo: construirModelo,
    agregar: agregar, agruparPor: agruparPor, filtrar: filtrar, analizar: analizar,
    pareto: pareto, productividadMO: productividadMO, sla: sla, noVendido: noVendido
  };
});
