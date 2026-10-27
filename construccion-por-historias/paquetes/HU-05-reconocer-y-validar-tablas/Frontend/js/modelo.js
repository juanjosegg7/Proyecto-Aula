/*
 * modelo.js — Lee el libro de Excel como un modelo relacional (tablas Dim y Fact).
 *
 * Reconoce cada tabla por los nombres de sus columnas (no por el nombre de la hoja),
 * valida cada fila y une los hechos con las dimensiones. No calcula indicadores:
 * eso lo hace indicadores.js.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./lectura.js'));
  else root.Modelo = factory(root.Lectura);
})(typeof self !== 'undefined' ? self : this, function (I) {
  'use strict';

  // Nombre del equipo cuando el archivo no trae columna de máquina (un solo horno).
  var EQUIPO = 'Horno';

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
    operador: ['operator id', 'operador', 'operario', 'id operador', 'id operario', 'operario id', 'panadero'],
    nombreOperador: ['operator name', 'nombre operador', 'nombre operario', '=nombre'],
    horas: ['horas trabajadas', 'horas hombre', 'horas laboradas', 'hours worked', '=horas'],
    asistio: ['asistio', 'asistencia', 'attended'],
    motivo: ['reason id', 'motivo', 'id motivo', 'causa', 'codigo paro', 'motivo paro', 'codigo motivo'],
    nombreMotivo: ['reason name', 'nombre motivo', 'descripcion motivo', 'descripcion paro', 'nombre causa'],
    tipoMotivo: ['=type', '=tipo', 'tipo paro', '=clase'],
    excluido: ['ppt excluded', 'excluidos', 'excluido', 'excluir', 'excluido del tiempo programado', 'excluir tiempo programado'],
    cicloSeg: ['std cycle time sec', 'tiempo ciclo', 'tiempo de ciclo', 'tiempo ciclo seg', 'ciclo seg', 'tiempo ciclo estandar', 'tiempo estandar seg'],
    cicloMin: ['tiempo horneado min', 'tiempo de horneado', 'tiempo horneado', 'tiempo de horneado min', 'tiempo ciclo min', 'tiempo de ciclo min'],
    unidadesCiclo: ['std units per cycle', 'unidades por ciclo', 'und por ciclo', 'unidades ciclo', 'panes por ciclo', 'panes por tanda', 'unidades por tanda', 'trenzas por tanda'],
    idealUnit: ['tiempo ideal unitario', 'ideal unit sec', 'tiempo ideal unitario seg'],
    duracionTurno: ['duration min', 'duracion', 'duracion turno', 'minutos turno', 'duracion min'],
    descanso: ['descanso min', 'descanso', 'minutos descanso', 'descanso minutos'],
    fechaCompromiso: ['due date', 'fecha hora compromiso', 'fecha compromiso', 'hora compromiso', 'fecha prometida', 'promised date', 'fecha requerida', 'fecha pactada', 'fecha limite'],
    fechaEntrega: ['delivery date', 'delivered date', 'fecha hora entrega', 'fecha entrega', 'hora entrega', 'fecha de entrega', 'fecha real entrega', 'fecha entregada'],
    cantidadPedida: ['qty ordered', 'cantidad pedida', 'unidades pedidas', 'ordered units', 'cantidad solicitada'],
    cantidadEntregada: ['qty delivered', 'cantidad entregada', 'unidades entregadas', 'delivered units'],
    vendidas: ['units sold', 'unidades vendidas', 'vendidas', 'cantidad vendida', 'ventas unidades', '=ventas'],
    noVendidas: ['units unsold', 'unidades no vendidas', 'no vendidas', 'sobrantes', 'devoluciones', 'unidades devueltas']
  };

  // Tablas: campos obligatorios, campos que no deben estar (para no confundir hechos con dimensiones) y opcionales.
  var TABLAS = [
    { rol: 'produccion', nombre: 'Producción (hechos)', req: ['fecha', 'turno', 'unidades'], no: [],
      opc: ['maquina', 'defectuosas', 'producto', 'orden', 'duracion', 'inicio', 'fin', 'operador', 'idealUnit', 'noVendidas'] },
    { rol: 'paros', nombre: 'Paros (hechos)', req: ['fecha', 'turno', 'motivo', 'duracion'], no: ['unidades'],
      opc: ['maquina', 'inicio', 'fin', 'excluido'] },
    { rol: 'manoObra', nombre: 'Mano de obra (hechos)', req: ['fecha', 'turno', 'horas'], no: ['unidades', 'motivo'],
      opc: ['operador', 'asistio'] },
    { rol: 'pedidos', nombre: 'Pedidos (SLA)', req: ['orden', 'fechaCompromiso', 'fechaEntrega'], no: [],
      opc: ['fecha', 'producto', 'cantidadPedida', 'cantidadEntregada'] },
    { rol: 'ventas', nombre: 'Ventas', req: ['vendidas'], no: ['maquina', 'turno'], opc: ['fecha', 'producto', 'noVendidas'] },
    { rol: 'producto', nombre: 'Productos', req: ['producto'], alguno: ['cicloSeg', 'cicloMin'], no: ['fecha', 'maquina'],
      opc: ['nombreProducto', 'unidadesCiclo', 'cicloSeg', 'cicloMin'] },
    { rol: 'turno', nombre: 'Turnos', req: ['turno', 'duracionTurno'], no: ['maquina', 'fecha'], opc: ['descanso'] },
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
      produccion: [], paros: [], pedidos: [], ventas: [], manoObra: [], errores: [], advertencias: [] };
    function error(hoja, n, msg) { m.errores.push({ hoja: hoja, fila: n, mensaje: msg }); }
    var avisos = {};
    function aviso(msg) { if (!avisos[msg]) { avisos[msg] = true; m.advertencias.push(msg); } }

    if (!t.produccion) { m.faltantes = ['hoja de producción con fecha, turno y unidades producidas']; return m; }
    m.faltantes = [];

    filasDe(hojas, t.maquina).forEach(function (x) {
      var id = texto(celda(x, t.maquina, 'maquina'));
      if (id) m.maquinas[id] = { id: id, nombre: texto(celda(x, t.maquina, 'nombreMaquina')) || id, linea: texto(celda(x, t.maquina, 'linea')) };
    });
    filasDe(hojas, t.producto).forEach(function (x) {
      var id = texto(celda(x, t.producto, 'producto'));
      // Tiempo de ciclo en segundos (cycle time) o en minutos (tiempo de horneado de la tanda).
      var ciclo = I.aNumero(celda(x, t.producto, 'cicloSeg'));
      if (ciclo === null) { var cm = I.aNumero(celda(x, t.producto, 'cicloMin')); ciclo = cm === null ? null : cm * 60; }
      var porCiclo = I.aNumero(celda(x, t.producto, 'unidadesCiclo'));
      if (!id) return;
      if (!(ciclo > 0)) { error(t.producto.hoja, x.n, 'tiempo de ciclo no válido para ' + id); return; }
      m.productos[id] = { id: id, nombre: texto(celda(x, t.producto, 'nombreProducto')) || id, cicloSeg: ciclo,
        unidadesCiclo: porCiclo > 0 ? porCiclo : 1, idealSegUnidad: ciclo / (porCiclo > 0 ? porCiclo : 1) };
    });
    filasDe(hojas, t.turno).forEach(function (x) {
      var id = texto(celda(x, t.turno, 'turno'));
      var d = I.aNumero(celda(x, t.turno, 'duracionTurno'));
      var descanso = I.aNumero(celda(x, t.turno, 'descanso')) || 0;
      if (id && d > 0) m.turnos[id] = { id: id, duracion: d, descanso: descanso };
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
      var maquina = P.mapa.maquina === undefined ? EQUIPO : texto(celda(x, P, 'maquina'));
      var fecha = I.aFecha(celda(x, P, 'fecha')), turno = texto(celda(x, P, 'turno'));
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
      var maquina = D.mapa.maquina === undefined ? EQUIPO : texto(celda(x, D, 'maquina'));
      var fecha = I.aFecha(celda(x, D, 'fecha')), turno = texto(celda(x, D, 'turno'));
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

    // SLA (OTIF): a tiempo (entrega ≤ compromiso, con fecha y hora) y completo (entregada ≥ pedida).
    var Pe = t.pedidos;
    filasDe(hojas, Pe).forEach(function (x) {
      var comp = aMinutos(celda(x, Pe, 'fechaCompromiso')), ent = aMinutos(celda(x, Pe, 'fechaEntrega'));
      var fecha = I.aFecha(celda(x, Pe, 'fecha')) || I.aFecha(celda(x, Pe, 'fechaCompromiso'));
      if (comp === null || !fecha) { error(Pe.hoja, x.n, 'fecha de compromiso no válida'); return; }
      var ped = I.aNumero(celda(x, Pe, 'cantidadPedida')), entr = I.aNumero(celda(x, Pe, 'cantidadEntregada'));
      if (ped !== null && ped <= 0) { error(Pe.hoja, x.n, 'cantidad pedida no válida'); return; }
      if (entr !== null && entr < 0) { error(Pe.hoja, x.n, 'cantidad entregada negativa'); return; }
      var aTiempo = ent !== null && ent <= comp;
      var completo = ped === null || entr === null ? true : entr >= ped;
      m.pedidos.push({ orden: texto(celda(x, Pe, 'orden')), fecha: fecha, aTiempo: aTiempo, completo: completo,
        cumple: aTiempo && completo, entregado: ent !== null });
    });

    var V = t.ventas;
    filasDe(hojas, V).forEach(function (x) {
      var vend = I.aNumero(celda(x, V, 'vendidas'));
      if (vend === null || vend < 0) { error(V.hoja, x.n, 'unidades vendidas no válidas'); return; }
      m.ventas.push({ fecha: I.aFecha(celda(x, V, 'fecha')), producto: texto(celda(x, V, 'producto')), vendidas: vend,
        noVendidas: I.aNumero(celda(x, V, 'noVendidas')) });
    });

    var MO = t.manoObra;
    filasDe(hojas, MO).forEach(function (x) {
      var fecha = I.aFecha(celda(x, MO, 'fecha')), turno = texto(celda(x, MO, 'turno')), horas = I.aNumero(celda(x, MO, 'horas'));
      var e = [];
      if (!fecha) e.push('fecha no válida');
      if (!turno) e.push('falta el turno');
      if (horas === null || horas < 0 || horas > 24) e.push('horas trabajadas no válidas');
      if (e.length) { error(MO.hoja, x.n, e.join('; ')); return; }
      if (horas > 8) aviso('Hay registros de mano de obra con más de 8 horas por persona.');
      m.manoObra.push({ fecha: fecha, turno: turno, operador: texto(celda(x, MO, 'operador')), horas: horas,
        asistio: MO.mapa.asistio === undefined ? horas > 0 : siNo(celda(x, MO, 'asistio')) !== false });
    });

    if (!t.turno) aviso('No hay tabla de turnos: la duración de cada turno se toma del primer al último registro de tiempo.');
    if (!t.producto && P.mapa.idealUnit === undefined) aviso('No hay tabla de productos con tiempo de ciclo: el rendimiento no se puede calcular.');
    if (!t.paros) aviso('No hay hoja de paros: la disponibilidad se calcula con el tiempo de los registros de producción.');
    return m;
  }

  return {
    TABLAS: TABLAS, CAMPOS: CAMPOS, EQUIPO: EQUIPO,
    detectarTablas: detectarTablas, esRelacional: esRelacional, construirModelo: construirModelo
  };
});
